import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatSessionRepository } from './chat-session.repository';
import { ChatSessionService } from './chat-session.service';
import {
  ChatSession,
  ChatSessionSchema,
} from './schemas/chat-session.schema';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
    ]),
    AnalyticsModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatSessionRepository, ChatSessionService],
})
export class ChatModule {}
