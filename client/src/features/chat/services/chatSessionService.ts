import { API_ENDPOINTS } from '@/constants/api';
import { createApiClient } from '@/lib/api';

export interface ChatSession {
  _id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  parts: { type: string; text: string }[];
}

/** Summary without messages, used in sidebar listing */
export type ChatSessionSummary = Omit<ChatSession, 'messages'>;

type ApiClient = ReturnType<typeof createApiClient>;

export function createChatSessionService(api: ApiClient) {
  return {
    async getSessions(): Promise<ChatSessionSummary[]> {
      const { data, ok } = await api.get<ChatSessionSummary[]>(
        API_ENDPOINTS.CHAT.SESSIONS,
      );
      return ok && data ? data : [];
    },

    async getSession(sessionId: string): Promise<ChatSession | null> {
      const { data, ok } = await api.get<ChatSession>(
        `${API_ENDPOINTS.CHAT.SESSIONS}/${sessionId}`,
      );
      return ok && data ? data : null;
    },

    async createSession(
      title: string,
      model?: string,
    ): Promise<ChatSession | null> {
      const { data, ok } = await api.post<ChatSession>(
        API_ENDPOINTS.CHAT.SESSIONS,
        { title, model },
      );
      return ok && data ? data : null;
    },

    async updateSessionTitle(
      sessionId: string,
      title: string,
    ): Promise<ChatSession | null> {
      const { data, ok } = await api.patch<ChatSession>(
        `${API_ENDPOINTS.CHAT.SESSIONS}/${sessionId}`,
        { title },
      );
      return ok && data ? data : null;
    },

    async deleteSession(sessionId: string): Promise<boolean> {
      const { ok } = await api.delete(
        `${API_ENDPOINTS.CHAT.SESSIONS}/${sessionId}`,
      );
      return ok;
    },

    async getTtl(): Promise<number> {
      const { data, ok } = await api.get<{ ttlHours: number }>(
        API_ENDPOINTS.CHAT.SESSION_TTL,
      );
      return ok && data ? data.ttlHours : 8;
    },
  };
}
