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
import { DatasetModule } from '../dataset/dataset.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatSession.name, schema: ChatSessionSchema },
    ]),
    DatasetModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatSessionRepository, ChatSessionService],
})
export class ChatModule {}
