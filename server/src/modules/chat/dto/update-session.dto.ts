import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSessionDto {
  @ApiProperty({
    description: 'New session title',
    example: 'Chat about React hooks',
  })
  @IsString()
  @MinLength(1)
  title: string;
}
