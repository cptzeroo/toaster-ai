export const VALIDATION_MESSAGES = {
  USERNAME: {
    IS_STRING: 'Username must be a string',
    MIN_LENGTH: 'Username must be at least 3 characters',
  },
  PASSWORD: {
    IS_STRING: 'Password must be a string',
    MIN_LENGTH: 'Password must be at least 6 characters',
  },
  NAME: {
    IS_STRING: 'Name must be a string',
  },
} as const;
