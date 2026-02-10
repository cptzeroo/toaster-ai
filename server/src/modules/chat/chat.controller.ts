import { Controller, Post, Req, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ChatService } from './chat.service';

@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a message to AI and get a streamed response' })
  async chat(@Req() req: Request, @Res() res: Response) {
    const { messages } = req.body;
    const user = (req as any).user;

    this.logger.log(`Chat request from ${user?.username || 'unknown'} with ${messages?.length || 0} messages`);

    try {
      const result = await this.chatService.chat(messages);
      result.pipeUIMessageStreamToResponse(res);
    } catch (error) {
      this.logger.error(`Chat error for ${user?.username || 'unknown'}: ${(error as Error).message}`);
      throw error;
    }
  }
}
