import { API_ENDPOINTS } from '@/constants/api';
import { createApiClient, getErrorMessage } from '@/lib/api';
import { ERROR_MESSAGES } from '@/features/auth/constants/error-messages';

export interface User {
  id: string;
  username: string;
  name?: string;
}

interface LoginResponse {
  access_token: string;
  user: User;
}

type ApiClient = ReturnType<typeof createApiClient>;

export function createAuthService(api: ApiClient) {
  return {
    async login(username: string, password: string): Promise<LoginResponse> {
      const { data, ok } = await api.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        { username, password },
      );

      if (!ok) {
        throw new Error(getErrorMessage(data, ERROR_MESSAGES.LOGIN_FAILED));
      }

      if (!data || !data.access_token) {
        throw new Error(ERROR_MESSAGES.LOGIN_FAILED);
      }

      return data;
    },

    async register(username: string, password: string, name?: string): Promise<LoginResponse> {
      const { data, ok } = await api.post<LoginResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        { username, password, name },
      );

      if (!ok) {
        throw new Error(getErrorMessage(data, ERROR_MESSAGES.REGISTER_FAILED));
      }

      if (!data || !data.access_token) {
        throw new Error(ERROR_MESSAGES.REGISTER_FAILED);
      }

      return data;
    },

    async logout(): Promise<void> {
      try {
        await api.post(API_ENDPOINTS.AUTH.LOGOUT);
      } catch {
        // Even if server call fails, caller should still clear local state
      }
    },

    async getProfile(): Promise<User | null> {
      const { data, ok } = await api.get<User>(API_ENDPOINTS.AUTH.PROFILE);

      if (ok && data) {
        return data;
      }

      return null;
    },
  };
}
