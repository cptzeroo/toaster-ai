export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid credentials',
    ACCOUNT_DISABLED: 'Account is disabled',
    TOKEN_INVALIDATED: 'Token has been invalidated',
    REGISTRATION_DISABLED: 'Registration is disabled',
  },
  USER: {
    USERNAME_EXISTS: 'Username already exists',
  },
  SESSION: {
    NOT_FOUND: 'Chat session not found or has expired',
    ACCESS_DENIED: 'You do not have access to this session',
  },
  ANALYTICS: {
    FILE_NOT_FOUND: 'File not found or has been removed',
    FILE_TOO_LARGE: 'File exceeds the maximum allowed size',
    UNSUPPORTED_FORMAT: 'Unsupported file format. Accepted: CSV, Excel (.xlsx, .xls)',
    QUERY_FAILED: 'Failed to execute query on the data',
    NO_FILES: 'No files uploaded yet. Upload a CSV or Excel file first.',
    DUCKDB_INIT_FAILED: 'Failed to initialize analytics engine',
    UPLOAD_FAILED: 'Failed to upload file',
    DELETE_FAILED: 'Failed to delete file',
  },
} as const;
