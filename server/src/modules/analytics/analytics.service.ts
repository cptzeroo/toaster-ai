import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import * as path from 'path';
import * as fs from 'fs/promises';
import { DuckDBRepository, QueryResult } from './duckdb.repository';
import { FileMetadataRepository } from './file-metadata.repository';
import { FileMetadataDocument } from './schemas/file-metadata.schema';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

@Injectable()
export class AnalyticsService implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly dataDir: string;

  constructor(
    private readonly duckdb: DuckDBRepository,
    private readonly fileRepo: FileMetadataRepository,
    private readonly configService: ConfigService,
  ) {
    this.dataDir = this.configService.get<string>('DATA_DIR', './data');
  }

  /**
   * On startup, reload all previously uploaded files into DuckDB.
   * DuckDB is in-memory so tables are lost on server restart.
   */
  async onModuleInit() {
    await this.reloadAllFiles();
  }

  private async reloadAllFiles(): Promise<void> {
    const allFiles = await this.fileRepo.findAll();
    const loadedFiles = allFiles.filter((f) => f.isLoaded);

    if (loadedFiles.length === 0) {
      this.logger.log('No files to reload into DuckDB');
      return;
    }

    this.logger.log(
      `Reloading ${loadedFiles.length} file(s) into DuckDB...`,
    );

    for (const file of loadedFiles) {
      try {
        // Check if the file still exists on disk
        await fs.access(file.filePath);
        await this.loadFileIntoDuckDB(file);
      } catch (err) {
        this.logger.warn(
          `Skipping reload of "${file.originalName}": ${(err as Error).message}`,
        );
      }
    }

    this.logger.log('DuckDB reload complete');
  }

  // ─── File Management ───────────────────────────────────────

  /**
   * Upload and register a file for a user.
   * The file is saved to disk under DATA_DIR/<userId>/ and metadata is stored in MongoDB.
   */
  async uploadFile(
    userId: string,
    file: Express.Multer.File,
  ): Promise<FileMetadataDocument> {
    // Validate file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(ERROR_MESSAGES.ANALYTICS.UNSUPPORTED_FORMAT);
    }

    // Create user directory if it doesn't exist
    const userDir = path.join(this.dataDir, userId);
    await fs.mkdir(userDir, { recursive: true });

    // Generate a safe stored name
    const timestamp = Date.now();
    const safeName = file.originalname
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .toLowerCase();
    const storedName = `${timestamp}_${safeName}`;
    const filePath = path.join(userDir, storedName);

    // Write file to disk
    await fs.writeFile(filePath, file.buffer);

    // Generate DuckDB table name (alphanumeric + underscore only)
    const tableName = this.generateTableName(file.originalname, userId);

    this.logger.log(
      `File uploaded: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB) for user ${userId} -> ${storedName}`,
    );

    // Save metadata to MongoDB
    const metadata = await this.fileRepo.create({
      userId: new Types.ObjectId(userId),
      originalName: file.originalname,
      storedName,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      filePath: path.resolve(filePath),
      tableName,
      isLoaded: false,
      columns: [],
      rowCount: 0,
    });

    // Load into DuckDB -- clean up metadata + file if this fails
    try {
      await this.loadFileIntoDuckDB(metadata);
    } catch (err) {
      this.logger.warn(
        `Cleaning up failed upload: ${file.originalname} for user ${userId}`,
      );
      await this.fileRepo.delete((metadata as any)._id.toString(), userId);
      try {
        await fs.unlink(path.resolve(filePath));
      } catch {
        // File may not exist if write also failed
        this.logger.warn(
          `Could not delete file from disk: ${filePath} - ${(err as Error).message}`,
        );
      }
      throw err;
    }

    return metadata;
  }

  /**
   * Load a file into DuckDB based on its extension.
   */
  private async loadFileIntoDuckDB(
    file: FileMetadataDocument,
  ): Promise<void> {
    try {
      const ext = path.extname(file.originalName).toLowerCase();
      let schema: QueryResult;

      if (ext === '.csv') {
        schema = await this.duckdb.loadCsv(file.filePath, file.tableName);
      } else if (ext === '.xlsx' || ext === '.xls') {
        schema = await this.duckdb.loadExcel(file.filePath, file.tableName);
      } else {
        throw new BadRequestException(
          ERROR_MESSAGES.ANALYTICS.UNSUPPORTED_FORMAT,
        );
      }

      // Get row count
      const rowCount = await this.duckdb.getRowCount(file.tableName);

      // Extract column names from schema result
      const columns = schema.rows.map((row) => String(row[0]));

      // Update metadata
      await this.fileRepo.updateLoaded(
        (file as any)._id.toString(),
        columns,
        rowCount,
      );

      this.logger.log(
        `Loaded "${file.originalName}" into DuckDB table "${file.tableName}" (${columns.length} columns, ${rowCount} rows)`,
      );
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof NotFoundException
      ) {
        throw err;
      }
      this.logger.error(
        `Failed to load file into DuckDB: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw new InternalServerErrorException(
        ERROR_MESSAGES.ANALYTICS.QUERY_FAILED,
      );
    }
  }

  /**
   * Get all files for a user.
   */
  async getFiles(userId: string): Promise<FileMetadataDocument[]> {
    return this.fileRepo.findByUser(userId);
  }

  /**
   * Get a single file's metadata.
   */
  async getFile(
    fileId: string,
    userId: string,
  ): Promise<FileMetadataDocument> {
    const file = await this.fileRepo.findByIdAndUser(fileId, userId);
    if (!file) {
      throw new NotFoundException(ERROR_MESSAGES.ANALYTICS.FILE_NOT_FOUND);
    }
    return file;
  }

  /**
   * Delete a file (removes from disk, DuckDB, and MongoDB).
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.fileRepo.findByIdAndUser(fileId, userId);
    if (!file) {
      throw new NotFoundException(ERROR_MESSAGES.ANALYTICS.FILE_NOT_FOUND);
    }

    // Remove from DuckDB
    await this.duckdb.dropTable(file.tableName);

    // Remove from disk
    try {
      await fs.unlink(file.filePath);
    } catch (err) {
      this.logger.warn(
        `Could not delete file from disk: ${file.filePath} - ${(err as Error).message}`,
      );
    }

    // Remove from MongoDB
    await this.fileRepo.delete(fileId, userId);

    this.logger.log(
      `Deleted file "${file.originalName}" for user ${userId}`,
    );
  }

  // ─── Querying ──────────────────────────────────────────────

  /**
   * Execute a SQL query against user's loaded data.
   * Validates that the query only references tables belonging to the user.
   */
  async executeQuery(
    userId: string,
    sql: string,
    limit = 100,
  ): Promise<QueryResult> {
    // Wrap with LIMIT to prevent accidentally returning millions of rows
    const safeSql = this.addLimitIfMissing(sql, limit);

    try {
      return await this.duckdb.query(safeSql);
    } catch (err) {
      this.logger.error(
        `Query failed for user ${userId}: ${(err as Error).message}`,
      );
      throw new BadRequestException(
        `Query error: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Get schema information for all user's tables.
   * This is used to provide context to the LLM.
   */
  async getUserSchema(userId: string): Promise<string> {
    const files = await this.fileRepo.findByUser(userId);
    const loadedFiles = files.filter((f) => f.isLoaded);

    if (loadedFiles.length === 0) {
      return 'No data files loaded.';
    }

    const schemas: string[] = [];

    for (const file of loadedFiles) {
      try {
        const tableSchema = await this.duckdb.describeTable(file.tableName);
        const columnDefs = tableSchema.rows
          .map((row) => `  ${row[0]} (${row[1]})`)
          .join('\n');

        schemas.push(
          `Table: "${file.tableName}" (from file: "${file.originalName}", ${file.rowCount} rows)\nColumns:\n${columnDefs}`,
        );
      } catch {
        // Table might have been dropped; skip it
      }
    }

    return schemas.join('\n\n');
  }

  // ─── Helpers ───────────────────────────────────────────────

  private generateTableName(originalName: string, userId: string): string {
    // Strip extension, replace non-alphanumeric with underscore, lowercase
    const base = path
      .basename(originalName, path.extname(originalName))
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase()
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    // Add user-specific short prefix to avoid collisions between users
    const userPrefix = userId.slice(-6);
    return `u${userPrefix}_${base}`;
  }

  private addLimitIfMissing(sql: string, limit: number): string {
    const upperSql = sql.trim().toUpperCase();
    if (!upperSql.includes('LIMIT')) {
      return `${sql.trim()} LIMIT ${limit}`;
    }
    return sql;
  }
}
