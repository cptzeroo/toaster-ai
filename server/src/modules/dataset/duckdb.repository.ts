import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api';

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
}

@Injectable()
export class DuckDBRepository implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DuckDBRepository.name);
  private instance: DuckDBInstance;

  async onModuleInit() {
    this.logger.log('Initializing DuckDB in-memory instance');
    this.instance = await DuckDBInstance.create(':memory:');

    // Install and load the excel extension for .xlsx/.xls support
    const connection = await this.instance.connect();
    try {
      await connection.run('INSTALL excel; LOAD excel;');
      this.logger.log('DuckDB excel extension loaded');
    } catch (err) {
      this.logger.warn(
        `Could not load excel extension: ${(err as Error).message}`,
      );
    } finally {
      connection.closeSync();
    }
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down DuckDB instance');
    // DuckDBInstance doesn't expose a close method in the Neo API;
    // the GC handles cleanup for in-memory databases.
  }

  private async withConnection<T>(
    fn: (connection: DuckDBConnection) => Promise<T>,
  ): Promise<T> {
    const connection = await this.instance.connect();
    try {
      return await fn(connection);
    } finally {
      connection.closeSync();
    }
  }

  /**
   * Load a CSV file into DuckDB as a table.
   * Uses all_varchar=true to avoid type-detection failures on dirty data.
   * The AI can CAST columns to the correct types in its SQL queries.
   */
  async loadCsv(filePath: string, tableName: string): Promise<QueryResult> {
    return this.withConnection(async (connection) => {
      // Drop existing table if it exists (for re-uploads)
      await connection.run(`DROP TABLE IF EXISTS "${tableName}"`);

      // Load with all_varchar=true to prevent conversion errors on messy data.
      // quote='"' ensures fields like "val1,val2" are parsed correctly.
      // ignore_errors=true skips malformed lines instead of aborting the entire load.
      await connection.run(
        `CREATE TABLE "${tableName}" AS SELECT * FROM read_csv('${this.escapePath(filePath)}', auto_detect=true, all_varchar=true, quote='"', ignore_errors=true)`,
      );

      // Get schema info
      return this.describeTable(tableName);
    });
  }

  /**
   * Load an Excel file into DuckDB as a table.
   */
  async loadExcel(filePath: string, tableName: string): Promise<QueryResult> {
    return this.withConnection(async (connection) => {
      await connection.run(`DROP TABLE IF EXISTS "${tableName}"`);

      await connection.run(
        `CREATE TABLE "${tableName}" AS SELECT * FROM read_xlsx('${this.escapePath(filePath)}')`,
      );

      return this.describeTable(tableName);
    });
  }

  /**
   * Execute an arbitrary SQL query (read-only by convention).
   */
  async query(sql: string): Promise<QueryResult> {
    return this.withConnection(async (connection) => {
      this.logger.debug(`Executing query: ${sql}`);
      const result = await connection.run(sql);

      const columns = result.columnNames();
      const rows = this.toJsonSafe(await result.getRows() as any[][]);

      return {
        columns,
        rows,
        rowCount: rows.length,
      };
    });
  }

  /**
   * Get column names and types for a loaded table.
   */
  async describeTable(tableName: string): Promise<QueryResult> {
    return this.withConnection(async (connection) => {
      const result = await connection.run(
        `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}' ORDER BY ordinal_position`,
      );

      const columns = result.columnNames();
      const rows = this.toJsonSafe(await result.getRows() as any[][]);

      return {
        columns,
        rows,
        rowCount: rows.length,
      };
    });
  }

  /**
   * Get row count for a table.
   */
  async getRowCount(tableName: string): Promise<number> {
    return this.withConnection(async (connection) => {
      const result = await connection.run(
        `SELECT count(*) as cnt FROM "${tableName}"`,
      );
      const rows = await result.getRows();
      return Number(rows[0]?.[0] ?? 0);
    });
  }

  /**
   * Drop a table.
   */
  async dropTable(tableName: string): Promise<void> {
    return this.withConnection(async (connection) => {
      await connection.run(`DROP TABLE IF EXISTS "${tableName}"`);
    });
  }

  /**
   * List all loaded tables.
   */
  async listTables(): Promise<string[]> {
    return this.withConnection(async (connection) => {
      const result = await connection.run(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'main'`,
      );
      const rows = await result.getRows();
      return rows.map((r: any[]) => String(r[0]));
    });
  }

  private escapePath(filePath: string): string {
    return filePath.replace(/'/g, "''");
  }

  /**
   * Convert BigInt values to Numbers (or strings if too large) so
   * JSON.stringify doesn't throw "Do not know how to serialize a BigInt".
   * Also converts Date objects to ISO strings for safe serialization.
   */
  private toJsonSafe(rows: any[][]): any[][] {
    return rows.map((row) => row.map((val) => this.toJsonSafeValue(val)));
  }

  private toJsonSafeValue(val: unknown): unknown {
    if (val === null || val === undefined) return val;
    if (typeof val === 'bigint') {
      return val >= -9007199254740991n && val <= 9007199254740991n
        ? Number(val)
        : val.toString();
    }
    if (val instanceof Date) {
      return val.toISOString();
    }
    if (Array.isArray(val)) {
      return val.map((v) => this.toJsonSafeValue(v));
    }
    if (typeof val === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        result[k] = this.toJsonSafeValue(v);
      }
      return result;
    }
    return val;
  }
}
