import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  FileMetadata,
  FileMetadataDocument,
} from './schemas/file-metadata.schema';

@Injectable()
export class FileMetadataRepository {
  constructor(
    @InjectModel(FileMetadata.name)
    private fileModel: Model<FileMetadataDocument>,
  ) {}

  async create(
    data: Partial<FileMetadata> & { userId: Types.ObjectId },
  ): Promise<FileMetadataDocument> {
    const doc = new this.fileModel(data);
    return doc.save();
  }

  /** Get all files across all users (used for DuckDB reload on startup). */
  async findAll(): Promise<FileMetadataDocument[]> {
    return this.fileModel.find().exec();
  }

  async findByUser(userId: string): Promise<FileMetadataDocument[]> {
    return this.fileModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByIdAndUser(
    fileId: string,
    userId: string,
  ): Promise<FileMetadataDocument | null> {
    return this.fileModel
      .findOne({
        _id: fileId,
        userId: new Types.ObjectId(userId),
      })
      .exec();
  }

  async findByTableNameAndUser(
    tableName: string,
    userId: string,
  ): Promise<FileMetadataDocument | null> {
    return this.fileModel
      .findOne({
        tableName,
        userId: new Types.ObjectId(userId),
      })
      .exec();
  }

  async updateLoaded(
    fileId: string,
    columns: string[],
    rowCount: number,
  ): Promise<FileMetadataDocument | null> {
    return this.fileModel
      .findByIdAndUpdate(
        fileId,
        { $set: { isLoaded: true, columns, rowCount } },
        { new: true },
      )
      .exec();
  }

  async delete(fileId: string, userId: string): Promise<boolean> {
    const result = await this.fileModel
      .deleteOne({
        _id: fileId,
        userId: new Types.ObjectId(userId),
      })
      .exec();
    return result.deletedCount > 0;
  }

  /** Delete by ID without userId check (internal cleanup only). */
  async deleteById(fileId: string): Promise<boolean> {
    const result = await this.fileModel.deleteOne({ _id: fileId }).exec();
    return result.deletedCount > 0;
  }
}
