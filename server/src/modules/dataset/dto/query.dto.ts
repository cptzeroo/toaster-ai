import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QueryDto {
  @ApiProperty({
    description: 'SQL query to execute against uploaded data',
    example: 'SELECT * FROM sales LIMIT 10',
  })
  @IsString()
  @IsNotEmpty()
  sql: string;

  @ApiPropertyOptional({
    description: 'Maximum number of rows to return',
    example: 100,
    default: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10000)
  limit?: number;
}
