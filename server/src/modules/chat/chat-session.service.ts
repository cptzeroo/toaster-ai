import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatSessionRepository } from './chat-session.repository';
import { ChatSessionDocument } from './schemas/chat-session.schema';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';

@Injectable()
export class ChatSessionService {
  private readonly logger = new Logger(ChatSessionService.name);
  private readonly ttlHours: number;

  constructor(
    private readonly sessionRepository: ChatSessionRepository,
    private readonly configService: ConfigService,
  ) {
    this.ttlHours = this.configService.get<number>(
      'CHAT_SESSION_TTL_HOURS',
      8,
    );
    this.logger.log(`Chat session TTL: ${this.ttlHours} hours`);
  }

  getTtlHours(): number {
    return this.ttlHours;
  }

  async create(
    userId: string,
    title: string,
    model: string,
  ): Promise<ChatSessionDocument> {
    this.logger.log(
      `Creating session for user ${userId}: "${title}" (model: ${model})`,
    );
    return this.sessionRepository.create(userId, title, model, this.ttlHours);
  }

  async findByUser(userId: string): Promise<ChatSessionDocument[]> {
    return this.sessionRepository.findByUser(userId);
  }

  async findByIdAndUser(
    sessionId: string,
    userId: string,
  ): Promise<ChatSessionDocument> {
    const session = await this.sessionRepository.findByIdAndUser(
      sessionId,
      userId,
    );

    if (!session) {
      throw new NotFoundException(ERROR_MESSAGES.SESSION.NOT_FOUND);
    }

    return session;
  }

  async addMessage(
    sessionId: string,
    userId: string,
    message: Record<string, any>,
  ): Promise<ChatSessionDocument> {
    const session = await this.sessionRepository.addMessage(
      sessionId,
      userId,
      message,
      this.ttlHours,
    );

    if (!session) {
      throw new NotFoundException(ERROR_MESSAGES.SESSION.NOT_FOUND);
    }

    return session;
  }

  async updateTitle(
    sessionId: string,
    userId: string,
    title: string,
  ): Promise<ChatSessionDocument> {
    const session = await this.sessionRepository.updateTitle(
      sessionId,
      userId,
      title,
    );

    if (!session) {
      throw new NotFoundException(ERROR_MESSAGES.SESSION.NOT_FOUND);
    }

    return session;
  }

  async delete(sessionId: string, userId: string): Promise<void> {
    const deleted = await this.sessionRepository.delete(sessionId, userId);

    if (!deleted) {
      throw new NotFoundException(ERROR_MESSAGES.SESSION.NOT_FOUND);
    }

    this.logger.log(
      `Deleted session ${sessionId} for user ${userId}`,
    );
  }
}
