export const API_BASE = '/api/v1';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE}/auth/login`,
    REGISTER: `${API_BASE}/auth/register`,
    LOGOUT: `${API_BASE}/auth/logout`,
    PROFILE: `${API_BASE}/auth/profile`,
  },
  CHAT: {
    SEND: `${API_BASE}/chat`,
    MODELS: `${API_BASE}/chat/models`,
    SESSIONS: `${API_BASE}/chat/sessions`,
    SESSION_TTL: `${API_BASE}/chat/sessions/ttl`,
  },
  ANALYTICS: {
    FILES: `${API_BASE}/analytics/files`,
    RELOAD: `${API_BASE}/analytics/files/reload`,
    QUERY: `${API_BASE}/analytics/query`,
    SCHEMA: `${API_BASE}/analytics/schema`,
  },
  SETTINGS: `${API_BASE}/settings`,
  HEALTH: `${API_BASE}/health`,
} as const;
