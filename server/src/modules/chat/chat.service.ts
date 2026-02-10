import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { streamText, convertToModelMessages } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import type { UIMessage } from 'ai';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private google: ReturnType<typeof createGoogleGenerativeAI>;

  constructor(private configService: ConfigService) {
    this.google = createGoogleGenerativeAI({
      apiKey: this.configService.get<string>('GOOGLE_GENERATIVE_AI_API_KEY'),
    });
  }

  async chat(messages: UIMessage[]): Promise<any> {
    this.logger.log(`Processing chat with ${messages.length} messages`);

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
      model: this.google('gemini-2.0-flash'),
      system:
        'You are Toaster AI, a helpful assistant. ' +
        'You help users with questions, tasks, and general knowledge. ' +
        'Be concise, friendly, and helpful. ' +
        'Format your responses using markdown when appropriate.',
      messages: modelMessages,
    });

    return result;
  }
}
