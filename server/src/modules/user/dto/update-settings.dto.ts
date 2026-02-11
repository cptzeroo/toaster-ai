import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({
    description: 'Default AI model ID',
    example: 'gemini-2.0-flash',
  })
  @IsOptional()
  @IsString()
  defaultModel?: string;

  @ApiPropertyOptional({
    description: 'UI theme preference',
    example: 'dark',
  })
  @IsOptional()
  @IsString()
  theme?: string;
}
