import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from '@/common/constants/validation-messages';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString({ message: VALIDATION_MESSAGES.USERNAME.IS_STRING })
  @MinLength(3, { message: VALIDATION_MESSAGES.USERNAME.MIN_LENGTH })
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString({ message: VALIDATION_MESSAGES.PASSWORD.IS_STRING })
  @MinLength(6, { message: VALIDATION_MESSAGES.PASSWORD.MIN_LENGTH })
  password: string;
}
