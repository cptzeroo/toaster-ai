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
} as const;
