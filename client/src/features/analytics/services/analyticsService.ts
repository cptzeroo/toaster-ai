import { API_ENDPOINTS } from '@/constants/api';
import { createApiClient } from '@/lib/api';

export interface FileMetadata {
  _id: string;
  userId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  filePath: string;
  tableName: string;
  isLoaded: boolean;
  columns: string[];
  rowCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QueryResult {
  columns: string[];
  rows: any[][];
  rowCount: number;
}

type ApiClient = ReturnType<typeof createApiClient>;

export function createAnalyticsService(api: ApiClient) {
  return {
    /**
     * Upload a CSV or Excel file for analysis.
     */
    async uploadFile(file: File): Promise<FileMetadata | null> {
      const formData = new FormData();
      formData.append('file', file);

      const { data, ok } = await api.upload<FileMetadata>(
        API_ENDPOINTS.ANALYTICS.FILES,
        formData,
      );
      return ok && data ? data : null;
    },

    /**
     * Get all uploaded files for the current user.
     */
    async getFiles(): Promise<FileMetadata[]> {
      const { data, ok } = await api.get<FileMetadata[]>(
        API_ENDPOINTS.ANALYTICS.FILES,
      );
      return ok && data ? data : [];
    },

    /**
     * Get a single file's metadata.
     */
    async getFile(fileId: string): Promise<FileMetadata | null> {
      const { data, ok } = await api.get<FileMetadata>(
        `${API_ENDPOINTS.ANALYTICS.FILES}/${fileId}`,
      );
      return ok && data ? data : null;
    },

    /**
     * Delete an uploaded file.
     */
    async deleteFile(fileId: string): Promise<boolean> {
      const { ok } = await api.delete(
        `${API_ENDPOINTS.ANALYTICS.FILES}/${fileId}`,
      );
      return ok;
    },

    /**
     * Execute a SQL query against uploaded data.
     */
    async executeQuery(
      sql: string,
      limit?: number,
    ): Promise<QueryResult | null> {
      const { data, ok } = await api.post<QueryResult>(
        API_ENDPOINTS.ANALYTICS.QUERY,
        { sql, limit },
      );
      return ok && data ? data : null;
    },

    /**
     * Get schema info for all loaded tables.
     */
    async getSchema(): Promise<string> {
      const { data, ok } = await api.get<{ schema: string }>(
        API_ENDPOINTS.ANALYTICS.SCHEMA,
      );
      return ok && data ? data.schema : '';
    },
  };
}
