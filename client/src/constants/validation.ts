export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MESSAGE: 'Username must be at least 3 characters',
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MESSAGE: 'Password must be at least 6 characters',
  },
  PASSWORD_CONFIRM: {
    MESSAGE: 'Passwords do not match',
  },
} as const;
