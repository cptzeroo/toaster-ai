import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { ERROR_MESSAGES } from '@/constants/error-messages';
import { API_ENDPOINTS } from '@/constants/api';
import { createApiClient, getErrorMessage } from '@/lib/api';

interface User {
  id: string;
  username: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, name?: string) => Promise<void>;
  logout: (options?: { serverLogout?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Use ref so the API client always has the latest token
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const api = useRef(createApiClient(() => tokenRef.current)).current;

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Create a one-off client with the stored token for init
          const initApi = createApiClient(() => storedToken);
          const { data, ok } = await initApi.get<User>(API_ENDPOINTS.AUTH.PROFILE);

          if (ok && data) {
            setUser(data);
            setToken(storedToken);
          } else {
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { data, ok } = await api.post<{ access_token: string; user: User }>(
      API_ENDPOINTS.AUTH.LOGIN,
      { username, password },
    );

    if (!ok) {
      throw new Error(getErrorMessage(data, ERROR_MESSAGES.LOGIN_FAILED));
    }

    if (!data || !data.access_token) {
      throw new Error(ERROR_MESSAGES.LOGIN_FAILED);
    }

    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  }, [api]);

  const register = useCallback(async (username: string, password: string, name?: string) => {
    const { data, ok } = await api.post<{ access_token: string; user: User }>(
      API_ENDPOINTS.AUTH.REGISTER,
      { username, password, name },
    );

    if (!ok) {
      throw new Error(getErrorMessage(data, ERROR_MESSAGES.REGISTER_FAILED));
    }

    if (!data || !data.access_token) {
      throw new Error(ERROR_MESSAGES.REGISTER_FAILED);
    }

    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  }, [api]);

  const logout = useCallback(async (options?: { serverLogout?: boolean }) => {
    const shouldCallServer = options?.serverLogout ?? true;

    // Only call server logout when the user explicitly logs out
    // Skip server call when logging out due to expired/invalid token
    if (shouldCallServer && tokenRef.current) {
      try {
        await api.post(API_ENDPOINTS.AUTH.LOGOUT);
      } catch {
        // Even if server call fails, still clear local state
      }
    }

    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, [api]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
