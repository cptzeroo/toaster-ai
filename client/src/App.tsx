import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from '@/features/settings/context/ThemeContext';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { SidebarLayout } from '@/components/sidebar-layout';
import { LoginPage } from '@/features/auth/pages/loginPage';
import { DashboardPage } from '@/features/dashboard/pages/dashboardPage';
import { ChatPage } from '@/features/chat/pages/chatPage';
import { PlaceholderPage } from '@/features/shared/pages/placeholderPage';
import { Toaster } from 'sonner';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Registration is disabled - redirect to login */}
      <Route path="/register" element={<Navigate to="/login" replace />} />

      {/* Protected routes with sidebar layout */}
      <Route
        element={
          <ProtectedRoute>
            <SidebarLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route
          path="/activity"
          element={
            <PlaceholderPage
              title="Activity"
              description="View recent activity across your application."
            />
          }
        />
        <Route
          path="/users"
          element={
            <PlaceholderPage
              title="Users"
              description="Manage users and their permissions."
            />
          }
        />
        <Route
          path="/notifications"
          element={
            <PlaceholderPage
              title="Notifications"
              description="View and manage notifications."
            />
          }
        />
        <Route
          path="/settings"
          element={
            <PlaceholderPage
              title="Settings"
              description="Configure your application settings."
            />
          }
        />
        <Route
          path="/health"
          element={
            <PlaceholderPage
              title="Health"
              description="Monitor system health and performance."
            />
          }
        />
      </Route>
    </Routes>
  );
}

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster richColors position="top-right" theme={theme} />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <ThemedToaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
