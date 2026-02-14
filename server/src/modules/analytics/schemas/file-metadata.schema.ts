import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FileMetadataDocument = HydratedDocument<FileMetadata>;

@Schema({ timestamps: true, collection: 'fileMetadata' })
export class FileMetadata {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  /** Original filename as uploaded by the user */
  @Prop({ required: true, trim: true })
  originalName: string;

  /** Stored filename on disk (sanitized, unique per user) */
  @Prop({ required: true })
  storedName: string;

  /** MIME type (text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, etc.) */
  @Prop({ required: true })
  mimeType: string;

  /** File size in bytes */
  @Prop({ required: true })
  sizeBytes: number;

  /** Absolute path on disk */
  @Prop({ required: true })
  filePath: string;

  /** DuckDB table name derived from filename (for querying) */
  @Prop({ required: true })
  tableName: string;

  /** Whether the file has been loaded into DuckDB */
  @Prop({ default: false })
  isLoaded: boolean;

  /** Column names detected from the file */
  @Prop({ type: [String], default: [] })
  columns: string[];

  /** Row count (populated after loading) */
  @Prop({ default: 0 })
  rowCount: number;
}

export const FileMetadataSchema = SchemaFactory.createForClass(FileMetadata);

// Compound index for per-user file lookups
FileMetadataSchema.index({ userId: 1, storedName: 1 }, { unique: true });
