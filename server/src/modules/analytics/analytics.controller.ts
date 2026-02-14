import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Logger,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { QueryDto } from './dto/query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtPayload } from '../auth/auth.service';

// 20 GB max file size (in bytes)
const MAX_FILE_SIZE = 20 * 1024 * 1024 * 1024;

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) {}

  // ─── Files ─────────────────────────────────────────────────

  @Post('files')
  @ApiOperation({ summary: 'Upload a CSV or Excel file for analysis' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.log(
      `File upload: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB) from ${user.username}`,
    );
    return this.analyticsService.uploadFile(user.sub, file);
  }

  @Get('files')
  @ApiOperation({ summary: 'List all uploaded files for the current user' })
  getFiles(@CurrentUser() user: JwtPayload) {
    return this.analyticsService.getFiles(user.sub);
  }

  @Get('files/:id')
  @ApiOperation({ summary: 'Get metadata for a specific file' })
  getFile(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.analyticsService.getFile(id, user.sub);
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Delete an uploaded file' })
  async deleteFile(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    await this.analyticsService.deleteFile(id, user.sub);
    return { deleted: true };
  }

  // ─── Query ─────────────────────────────────────────────────

  @Post('query')
  @ApiOperation({ summary: 'Execute a SQL query against uploaded data' })
  executeQuery(
    @Body() dto: QueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.log(
      `Query from ${user.username}: ${dto.sql.substring(0, 100)}${dto.sql.length > 100 ? '...' : ''}`,
    );
    return this.analyticsService.executeQuery(user.sub, dto.sql, dto.limit);
  }

  // ─── Schema ────────────────────────────────────────────────

  @Get('schema')
  @ApiOperation({
    summary: 'Get schema info for all loaded tables (for LLM context)',
  })
  async getSchema(@CurrentUser() user: JwtPayload) {
    const schema = await this.analyticsService.getUserSchema(user.sub);
    return { schema };
  }
}
