import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createApiClient } from '@/lib/api';
import { createAuthService, type User } from '@/features/auth/services/authService';
import { createSettingsService, type UserSettings } from '@/features/settings/services/settingsService';
import { useTheme } from '@/features/settings/context/ThemeContext';

interface AuthContextType {
  user: User | null;
  token: string | null;
  settings: UserSettings | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, name?: string) => Promise<void>;
  logout: (options?: { serverLogout?: boolean }) => Promise<void>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
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
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setTheme } = useTheme();

  // Use ref so the API client always has the latest token
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const api = useRef(createApiClient(() => tokenRef.current)).current;
  const authService = useRef(createAuthService(api)).current;
  const settingsService = useRef(createSettingsService(api)).current;

  // Check if user is authenticated on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Create a one-off client with the stored token for init
          const initApi = createApiClient(() => storedToken);
          const initService = createAuthService(initApi);
          const initSettingsService = createSettingsService(initApi);
          const profile = await initService.getProfile();

          if (profile) {
            setUser(profile);
            setToken(storedToken);

            // Fetch user settings after auth and sync theme
            const userSettings = await initSettingsService.getSettings();
            if (userSettings) {
              setSettings(userSettings);
              if (userSettings.theme === 'dark' || userSettings.theme === 'light') {
                setTheme(userSettings.theme);
              }
            }
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

    // Fetch settings after login and sync theme
    const userSettings = await settingsService.getSettings();
    if (userSettings) {
      setSettings(userSettings);
      if (userSettings.theme === 'dark' || userSettings.theme === 'light') {
        setTheme(userSettings.theme);
      }
    }
  }, [authService, settingsService, setTheme]);

  const register = useCallback(async (username: string, password: string, name?: string) => {
    const data = await authService.register(username, password, name);
    localStorage.setItem('token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);

    // Fetch settings after register and sync theme
    const userSettings = await settingsService.getSettings();
    if (userSettings) {
      setSettings(userSettings);
      if (userSettings.theme === 'dark' || userSettings.theme === 'light') {
        setTheme(userSettings.theme);
      }
    }
  }, [authService, settingsService, setTheme]);

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
    setSettings(null);
  }, [authService]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    const updated = await settingsService.updateSettings(updates);
    if (updated) {
      setSettings(updated);
      // Sync theme if it was updated
      if (updates.theme && (updates.theme === 'dark' || updates.theme === 'light')) {
        setTheme(updates.theme);
      }
    }
  }, [settingsService, setTheme]);

  const value: AuthContextType = {
    user,
    token,
    settings,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    register,
    logout,
    updateSettings,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
