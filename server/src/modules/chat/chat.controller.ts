import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatSessionService } from './chat-session.service';
import { ChatDto } from './dto/chat.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly chatSessionService: ChatSessionService,
  ) {}

  // ─── Models ───────────────────────────────────────────────

  @Get('models')
  @ApiOperation({ summary: 'Get available AI models' })
  getModels() {
    return this.chatService.getAvailableModels();
  }

  // ─── Sessions ─────────────────────────────────────────────

  @Get('sessions')
  @ApiOperation({ summary: 'List active chat sessions for the current user' })
  getSessions(@CurrentUser() user: JwtPayload) {
    return this.chatSessionService.findByUser(user.sub);
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new chat session' })
  createSession(
    @Body() dto: CreateSessionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatSessionService.create(
      user.sub,
      dto.title,
      dto.model || 'gemini-2.0-flash',
    );
  }

  @Get('sessions/ttl')
  @ApiOperation({ summary: 'Get the configured session TTL in hours' })
  getSessionTtl() {
    return { ttlHours: this.chatSessionService.getTtlHours() };
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get a chat session with messages' })
  getSession(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatSessionService.findByIdAndUser(id, user.sub);
  }

  @Patch('sessions/:id')
  @ApiOperation({ summary: 'Update a session title' })
  updateSession(
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatSessionService.updateTitle(id, user.sub, dto.title);
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete a chat session' })
  deleteSession(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.chatSessionService.delete(id, user.sub);
  }

  // ─── Chat (streaming) ────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Send a message to AI and get a streamed response' })
  async chat(
    @Body() chatDto: ChatDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    this.logger.log(
      `Chat request from ${user.username} with ${chatDto.messages.length} messages, model: ${chatDto.model || 'default'}` +
        (chatDto.sessionId ? `, session: ${chatDto.sessionId}` : ''),
    );

    // If sessionId is provided, persist the latest user message
    if (chatDto.sessionId) {
      const lastMessage = chatDto.messages[chatDto.messages.length - 1];
      if (lastMessage?.role === 'user') {
        await this.chatSessionService.addMessage(
          chatDto.sessionId,
          user.sub,
          lastMessage,
        );
      }
    }

    try {
      const result = await this.chatService.chat(
        chatDto.messages,
        chatDto.model,
      );

      // Pipe the stream to the client first
      result.pipeUIMessageStreamToResponse(res);

      // After streaming completes, persist the assistant response asynchronously
      if (chatDto.sessionId) {
        result.text
          .then((fullText: string) => {
            return this.chatSessionService.addMessage(
              chatDto.sessionId!,
              user.sub,
              {
                role: 'assistant',
                parts: [{ type: 'text', text: fullText }],
              },
            );
          })
          .catch((err: Error) => {
            this.logger.error(
              `Failed to save assistant response to session ${chatDto.sessionId}: ${err.message}`,
            );
          });
      }
    } catch (error) {
      this.logger.error(
        `Chat error for ${user.username}: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
