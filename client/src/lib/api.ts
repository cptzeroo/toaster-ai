import { ERROR_MESSAGES } from '@/constants/error-messages';

export interface ApiResponse<T = unknown> {
  data: T | null;
  ok: boolean;
  status: number;
}

/**
 * Safely parse JSON from response, returns null if parsing fails.
 * Automatically unwraps the server's standardized response envelope
 * ({ success, data, timestamp }) so callers get the data directly.
 */
async function safeJsonParse(response: Response): Promise<any | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    const json = JSON.parse(text);

    // Unwrap the server's { success, data } envelope on success responses
    if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
      return json.success ? json.data : json;
    }

    return json;
  } catch {
    return null;
  }
}

/**
 * Extract error message from API response or return default message
 */
export function getErrorMessage(data: any, defaultMessage: string): string {
  if (!data) return defaultMessage;

  // Handle NestJS validation errors (array of messages)
  if (Array.isArray(data.message)) {
    return data.message[0];
  }

  // Handle standard error message
  if (typeof data.message === 'string') {
    return data.message;
  }

  return defaultMessage;
}

/**
 * Creates an API client with automatic auth header injection
 */
export function createApiClient(getToken: () => string | null) {
  async function request<T = unknown>(
    url: string,
    options?: RequestInit,
  ): Promise<ApiResponse<T>> {
    const token = getToken();
    const headers: Record<string, string> = {};

    // Spread any existing headers
    if (options?.headers) {
      const existing = options.headers as Record<string, string>;
      Object.assign(headers, existing);
    }

    // Auto-attach auth header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Auto-attach content-type for requests with body (skip for FormData)
    if (options?.body && !headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    let response: Response;

    try {
      response = await fetch(url, { ...options, headers });
    } catch {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }

    const data = await safeJsonParse(response);

    return {
      data,
      ok: response.ok,
      status: response.status,
    };
  }

  return {
    get: <T = unknown>(url: string) => request<T>(url),

    post: <T = unknown>(url: string, body?: unknown) =>
      request<T>(url, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      }),

    patch: <T = unknown>(url: string, body?: unknown) =>
      request<T>(url, {
        method: 'PATCH',
        body: body ? JSON.stringify(body) : undefined,
      }),

    delete: <T = unknown>(url: string) =>
      request<T>(url, { method: 'DELETE' }),

    /**
     * Upload a file using FormData (no JSON Content-Type).
     * The browser sets the multipart boundary automatically.
     */
    upload: <T = unknown>(url: string, formData: FormData) =>
      request<T>(url, {
        method: 'POST',
        body: formData,
        headers: {}, // Empty so auto Content-Type JSON isn't added
      }),
  };
}
