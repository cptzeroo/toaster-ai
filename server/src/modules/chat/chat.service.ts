import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { streamText, generateText, convertToModelMessages } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { UIMessage, LanguageModel } from 'ai';
import {
  AI_MODELS,
  DEFAULT_MODEL_ID,
  getModelById,
  type AIProvider,
} from './chat.models';

const SYSTEM_PROMPT =
  'You are Toaster AI, a helpful assistant. ' +
  'You help users with questions, tasks, and general knowledge. ' +
  'Be concise, friendly, and helpful. ' +
  'Format your responses using markdown when appropriate.';

const TITLE_PROMPT =
  'Generate a short title (max 6 words) for a chat that starts with the following user message. ' +
  'Return ONLY the title text, nothing else. No quotes, no punctuation at the end.';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private google: ReturnType<typeof createGoogleGenerativeAI>;
  private openai: ReturnType<typeof createOpenAI>;
  private anthropic: ReturnType<typeof createAnthropic>;

  constructor(private configService: ConfigService) {
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

  async chat(messages: UIMessage[], modelId?: string): Promise<any> {
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

    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: modelMessages,
    });

    return result;
  }
}
