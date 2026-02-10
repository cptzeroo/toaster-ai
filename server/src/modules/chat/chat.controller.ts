import { Controller, Post, Get, Body, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatDto } from './dto/chat.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Get('models')
  @ApiOperation({ summary: 'Get available AI models' })
  getModels() {
    return this.chatService.getAvailableModels();
  }

  @Post()
  @ApiOperation({ summary: 'Send a message to AI and get a streamed response' })
  async chat(
    @Body() chatDto: ChatDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    this.logger.log(
      `Chat request from ${user.username} with ${chatDto.messages.length} messages, model: ${chatDto.model || 'default'}`,
    );

    try {
      const result = await this.chatService.chat(
        chatDto.messages,
        chatDto.model,
      );
      result.pipeUIMessageStreamToResponse(res);
    } catch (error) {
      this.logger.error(
        `Chat error for ${user.username}: ${(error as Error).message}`,
      );
      throw error;
    }
  }
}
