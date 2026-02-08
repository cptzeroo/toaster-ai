import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ERROR_MESSAGES } from '@/constants/error-messages';

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
  logout: () => Promise<void>;
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

/**
 * Safely parse JSON from response, returns null if parsing fails
 */
async function safeJsonParse(response: Response): Promise<any | null> {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Extract error message from API response or return default message
 */
function getErrorMessage(data: any, defaultMessage: string): string {
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await fetch('/api/auth/profile', {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          if (response.ok) {
            const userData = await safeJsonParse(response);
            if (userData) {
              setUser(userData);
              setToken(storedToken);
            } else {
              localStorage.removeItem('token');
              setToken(null);
            }
          } else {
            // Token is invalid, clear it
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
    let response: Response;
    
    try {
      response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
    } catch {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }

    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, ERROR_MESSAGES.LOGIN_FAILED));
    }

    if (!data || !data.access_token) {
      throw new Error(ERROR_MESSAGES.LOGIN_FAILED);
    }

    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (username: string, password: string, name?: string) => {
    let response: Response;
    
    try {
      response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, name }),
      });
    } catch {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }

    const data = await safeJsonParse(response);

    if (!response.ok) {
      throw new Error(getErrorMessage(data, ERROR_MESSAGES.REGISTER_FAILED));
    }

    if (!data || !data.access_token) {
      throw new Error(ERROR_MESSAGES.REGISTER_FAILED);
    }

    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    // Call server to invalidate the token
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Even if server call fails, still clear local state
      }
    }

    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, [token]);

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
