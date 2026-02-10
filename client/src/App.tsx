import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SidebarLayout } from '@/components/sidebar-layout';
import { LoginPage } from '@/pages/loginPage/loginPage';
import { DashboardPage } from '@/pages/dashboardPage/dashboardPage';
import { PlaceholderPage } from '@/pages/placeholderPage/placeholderPage';

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

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
