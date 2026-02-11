import { API_ENDPOINTS } from '@/constants/api';
import { createApiClient } from '@/lib/api';

export interface UserSettings {
  defaultModel: string;
  theme: string;
}

type ApiClient = ReturnType<typeof createApiClient>;

export function createSettingsService(api: ApiClient) {
  return {
    async getSettings(): Promise<UserSettings | null> {
      const { data, ok } = await api.get<UserSettings>(
        API_ENDPOINTS.SETTINGS,
      );

      if (ok && data) {
        return data;
      }

      return null;
    },

    async updateSettings(
      updates: Partial<UserSettings>,
    ): Promise<UserSettings | null> {
      const { data, ok } = await api.patch<UserSettings>(
        API_ENDPOINTS.SETTINGS,
        updates,
      );

      if (ok && data) {
        return data;
      }

      return null;
    },
  };
}
