import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { streamText, convertToModelMessages } from 'ai';
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
