import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DatasetController } from './dataset.controller';
import { DatasetService } from './dataset.service';
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
  controllers: [DatasetController],
  providers: [DatasetService, DuckDBRepository, FileMetadataRepository],
  exports: [DatasetService, DuckDBRepository],
})
export class DatasetModule {}
