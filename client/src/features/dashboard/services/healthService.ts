import { API_ENDPOINTS } from '@/constants/api';

export interface HealthStatus {
  status: string;
  timestamp: string;
}

export async function checkHealth(): Promise<HealthStatus> {
  const response = await fetch(API_ENDPOINTS.HEALTH);

  if (!response.ok) {
    throw new Error('Server returned an error');
  }

  return response.json();
}
