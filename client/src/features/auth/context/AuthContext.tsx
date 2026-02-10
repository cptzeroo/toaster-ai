import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createApiClient } from '@/lib/api';
import { createAuthService, type User } from '@/features/auth/services/authService';

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
  const authService = useRef(createAuthService(api)).current;

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Create a one-off client with the stored token for init
          const initApi = createApiClient(() => storedToken);
          const initService = createAuthService(initApi);
          const profile = await initService.getProfile();

          if (profile) {
            setUser(profile);
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
    const data = await authService.login(username, password);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  }, [authService]);

  const register = useCallback(async (username: string, password: string, name?: string) => {
    const data = await authService.register(username, password, name);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  }, [authService]);

  const logout = useCallback(async (options?: { serverLogout?: boolean }) => {
    const shouldCallServer = options?.serverLogout ?? true;

    // Only call server logout when the user explicitly logs out
    // Skip server call when logging out due to expired/invalid token
    if (shouldCallServer && tokenRef.current) {
      await authService.logout();
    }

    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, [authService]);

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
