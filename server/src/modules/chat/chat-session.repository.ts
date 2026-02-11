import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  ChatSession,
  ChatSessionDocument,
} from './schemas/chat-session.schema';

@Injectable()
export class ChatSessionRepository {
  constructor(
    @InjectModel(ChatSession.name)
    private sessionModel: Model<ChatSessionDocument>,
  ) {}

  async create(
    userId: string,
    title: string,
    model: string,
    ttlHours: number,
  ): Promise<ChatSessionDocument> {
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    const session = new this.sessionModel({
      userId: new Types.ObjectId(userId),
      title,
      model,
      messages: [],
      expiresAt,
    });
    return session.save();
  }

  async findByUser(userId: string): Promise<ChatSessionDocument[]> {
    return this.sessionModel
      .find({
        userId: new Types.ObjectId(userId),
        expiresAt: { $gt: new Date() },
      })
      .select('-messages')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findByIdAndUser(
    sessionId: string,
    userId: string,
  ): Promise<ChatSessionDocument | null> {
    return this.sessionModel
      .findOne({
        _id: sessionId,
        userId: new Types.ObjectId(userId),
        expiresAt: { $gt: new Date() },
      })
      .exec();
  }

  async addMessage(
    sessionId: string,
    userId: string,
    message: Record<string, any>,
    ttlHours: number,
  ): Promise<ChatSessionDocument | null> {
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    return this.sessionModel
      .findOneAndUpdate(
        {
          _id: sessionId,
          userId: new Types.ObjectId(userId),
        },
        {
          $push: { messages: message },
          $set: { expiresAt },
        },
        { new: true },
      )
      .exec();
  }

  async updateTitle(
    sessionId: string,
    userId: string,
    title: string,
  ): Promise<ChatSessionDocument | null> {
    return this.sessionModel
      .findOneAndUpdate(
        {
          _id: sessionId,
          userId: new Types.ObjectId(userId),
        },
        { $set: { title } },
        { new: true },
      )
      .exec();
  }

  async delete(sessionId: string, userId: string): Promise<boolean> {
    const result = await this.sessionModel
      .deleteOne({
        _id: sessionId,
        userId: new Types.ObjectId(userId),
      })
      .exec();
    return result.deletedCount > 0;
  }
}
