import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Session title',
    example: 'New conversation',
  })
  @IsString()
  @MinLength(1)
  title: string;

  @ApiPropertyOptional({
    description: 'AI model ID for this session',
    example: 'gemini-2.0-flash',
  })
  @IsOptional()
  @IsString()
  model?: string;
}
