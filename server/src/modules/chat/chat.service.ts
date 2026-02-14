import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  streamText,
  generateText,
  convertToModelMessages,
  tool,
  stepCountIs,
} from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import type { UIMessage, LanguageModel } from 'ai';
import {
  AI_MODELS,
  DEFAULT_MODEL_ID,
  getModelById,
  type AIProvider,
} from './chat.models';
import { DatasetService } from '../dataset/dataset.service';

const BASE_SYSTEM_PROMPT =
  'You are Toaster AI, an assistant specialized in accounting and financial data analysis. ' +
  'You help users query, analyze, and understand their financial data (CSV/Excel files). ' +
  'When users ask about their data, use the queryData tool to execute SQL queries. ' +
  'Always explain your findings clearly. Format numbers as currency when appropriate. ' +
  'Use markdown tables for tabular results. Be concise and accurate.\n\n' +
  'IMPORTANT SQL tips for DuckDB:\n' +
  '- VARCHAR columns that contain currency values (e.g. "$50,000") must be cast to numeric before math. ' +
  'Use: REPLACE(REPLACE(column_name, \'$\', \'\'), \',\', \'\')::DOUBLE to clean and cast them.\n' +
  '- You CAN perform calculations across columns in the same row (e.g. total_debt / yearly_income for DTI).\n' +
  '- Use MEDIAN() for median, AVG() for mean, MIN(), MAX(), ROUND() for formatting.\n' +
  '- Always handle potential division by zero with NULLIF().\n' +
  '- For percentages, multiply by 100 and round to 2 decimal places.\n' +
  '- You can use multiple queryData tool calls if a single query is too complex. Break it down.';

const NO_DATA_PROMPT =
  'You are Toaster AI, a helpful assistant. ' +
  'You help users with questions, tasks, and general knowledge. ' +
  'The user has not uploaded any data files yet. If they ask about data analysis, ' +
  'let them know they can upload CSV or Excel files for analysis. ' +
  'Be concise, friendly, and helpful. Format your responses using markdown when appropriate.';

const TITLE_PROMPT =
  'Generate a short title (max 6 words) for a chat that starts with the following user message. ' +
  'Return ONLY the title text, nothing else. No quotes, no punctuation at the end.';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private google: ReturnType<typeof createGoogleGenerativeAI>;
  private openai: ReturnType<typeof createOpenAI>;
  private anthropic: ReturnType<typeof createAnthropic>;

  constructor(
    private configService: ConfigService,
    private datasetService: DatasetService,
  ) {
    this.google = createGoogleGenerativeAI({
      apiKey: this.configService.get<string>('GOOGLE_GENERATIVE_AI_API_KEY'),
    });

    this.openai = createOpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });

    this.anthropic = createAnthropic({
      apiKey: this.configService.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  private getLanguageModel(
    provider: AIProvider,
    modelId: string,
  ): LanguageModel {
    switch (provider) {
      case 'google':
        return this.google(modelId);
      case 'openai':
        return this.openai(modelId);
      case 'anthropic':
        return this.anthropic(modelId);
      default:
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
  }

  getAvailableModels() {
    return AI_MODELS;
  }

  /**
   * Generate a short title from the user's first message.
   * Uses gemini-2.0-flash for speed/cost regardless of selected model.
   */
  async generateTitle(userMessage: string): Promise<string> {
    try {
      const model = this.google('gemini-2.0-flash');
      const { text } = await generateText({
        model,
        system: TITLE_PROMPT,
        prompt: userMessage,
      });
      return text.trim() || 'New conversation';
    } catch (err) {
      this.logger.warn(
        `Failed to generate title: ${(err as Error).message}`,
      );
      return 'New conversation';
    }
  }

  /**
   * Build a dynamic system prompt that includes the user's data schema.
   */
  private async buildSystemPrompt(userId: string): Promise<string> {
    try {
      const schema = await this.datasetService.getUserSchema(userId);

      this.logger.log(`duck db schema: ${schema}`);

      if (schema === 'No data files loaded.') {
        return NO_DATA_PROMPT;
      }

      return (
        BASE_SYSTEM_PROMPT +
        '\n\n--- Available Data ---\n' +
        schema +
        '\n--- End of Data Schema ---\n\n' +
        'When writing SQL queries, use the exact table and column names shown above. ' +
        'DuckDB SQL syntax is used. Common functions: sum(), avg(), count(), round(), strftime(), median(). ' +
        'If a column is VARCHAR but contains numeric data (like currency with $ or commas), cast it: ' +
        'REPLACE(REPLACE(col, \'$\', \'\'), \',\', \'\')::DOUBLE'
      );
    } catch (err) {
      this.logger.warn(
        `Failed to build schema context: ${(err as Error).message}`,
      );
      return NO_DATA_PROMPT;
    }
  }

  async chat(
    messages: UIMessage[],
    userId: string,
    modelId?: string,
  ): Promise<any> {
    const selectedId = modelId || DEFAULT_MODEL_ID;
    const modelConfig = getModelById(selectedId);

    if (!modelConfig) {
      throw new BadRequestException(
        `Unknown model: ${selectedId}. Available models: ${AI_MODELS.map((m) => m.id).join(', ')}`,
      );
    }

    this.logger.log(
      `Processing chat with ${messages.length} messages using ${modelConfig.name} (${modelConfig.provider}/${modelConfig.modelId})`,
    );

    const model = this.getLanguageModel(
      modelConfig.provider,
      modelConfig.modelId,
    );
    const modelMessages = await convertToModelMessages(messages);
    const systemPrompt = await this.buildSystemPrompt(userId);

    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      tools: {
        queryData: tool({
          description:
            'Execute a SQL query against the user\'s uploaded accounting data. ' +
            'Use DuckDB SQL syntax. Always reference the exact table names from the schema context. ' +
            'For large tables, use LIMIT to avoid returning too many rows.',
          inputSchema: z.object({
            sql: z
              .string()
              .describe('The SQL query to execute (DuckDB syntax)'),
            explanation: z
              .string()
              .describe(
                'Brief explanation of what this query does (shown to user)',
              ),
          }),
          execute: async ({ sql, explanation }: { sql: string; explanation: string }) => {
            this.logger.log(
              `Tool call queryData from user ${userId}: ${sql}`,
            );
            try {
              const result = await this.datasetService.executeQuery(
                userId,
                sql,
                100,
              );
              return {
                success: true,
                explanation,
                columns: result.columns,
                rows: result.rows,
                rowCount: result.rowCount,
              };
            } catch (err) {
              return {
                success: false,
                explanation,
                error: (err as Error).message,
              };
            }
          },
        }),
      },
      stopWhen: stepCountIs(5),
    });

    return result;
  }
}
