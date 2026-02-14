import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { DuckDBRepository } from './duckdb.repository';
import { FileMetadataRepository } from './file-metadata.repository';
import {
  FileMetadata,
  FileMetadataSchema,
} from './schemas/file-metadata.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FileMetadata.name, schema: FileMetadataSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, DuckDBRepository, FileMetadataRepository],
  exports: [AnalyticsService, DuckDBRepository],
})
export class AnalyticsModule {}
