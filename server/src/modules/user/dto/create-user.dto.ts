import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '@/common/constants/validation-messages';

export class CreateUserDto {
  @ApiProperty({ example: 'admin' })
  @IsString({ message: VALIDATION_MESSAGES.USERNAME.IS_STRING })
  @MinLength(3, { message: VALIDATION_MESSAGES.USERNAME.MIN_LENGTH })
  username: string;

  @ApiProperty({ minLength: 6 })
  @IsString({ message: VALIDATION_MESSAGES.PASSWORD.IS_STRING })
  @MinLength(6, { message: VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH })
  password: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @IsString({ message: VALIDATION_MESSAGES.NAME.IS_STRING })
  @IsOptional()
  name?: string;
}
