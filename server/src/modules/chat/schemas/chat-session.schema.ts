import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ChatSessionDocument = HydratedDocument<ChatSession>;

@Schema({ timestamps: true, collection: 'chatSessions' })
export class ChatSession {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: [Object], default: [] })
  messages: Record<string, any>[];

  @Prop({ default: 'gemini-2.0-flash' })
  model: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

export const ChatSessionSchema = SchemaFactory.createForClass(ChatSession);

// MongoDB TTL index -- automatically deletes documents when expiresAt < now
ChatSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
