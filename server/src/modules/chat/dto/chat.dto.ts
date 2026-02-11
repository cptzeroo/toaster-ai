import {
  IsArray,
  IsOptional,
  IsString,
  ArrayMinSize,
  Allow,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for chat requests.
 * The Vercel AI SDK (DefaultChatTransport) sends additional metadata fields
 * like `id` and `trigger` alongside `messages` and `model`.
 * We explicitly declare them here so the global whitelist validation doesn't reject them.
 */
export class ChatDto {
  @ApiProperty({
    description: 'Array of chat messages',
    type: [Object],
    example: [
      {
        id: 'msg-1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  messages: any[];

  @ApiPropertyOptional({
    description: 'AI model ID to use',
    example: 'gemini-2.0-flash',
  })
  @IsOptional()
  @IsString()
  model?: string;

  /** Chat session ID sent by the Vercel AI SDK */
  @IsOptional()
  @IsString()
  id?: string;

  /** How the message was triggered (e.g. "manual") -- sent by the Vercel AI SDK */
  @IsOptional()
  @IsString()
  trigger?: string;

  @ApiPropertyOptional({
    description: 'Session ID to persist messages to',
    example: '507f1f77bcf86cd799439011',
  })
  @IsOptional()
  @IsString()
  sessionId?: string;
}
