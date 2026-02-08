import { Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/loginPage/loginPage';
import { RegisterPage } from '@/pages/registerPage/registerPage';
import './App.css';

interface HealthStatus {
  status: string;
  timestamp: string;
}

function HomePage() {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        if (response.ok) {
          const data = await response.json();
          setHealth(data);
          setError(null);
        } else {
          setError('Server returned an error');
        }
      } catch {
        setError('Unable to connect to server');
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Toaster</h1>
        <p>React + NestJS Application</p>
        {user && (
          <div className="user-info">
            <span>Welcome, {user.name || user.username}</span>
            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        )}
      </header>
      <main className="app-main">
        <div className="status-card">
          <h2>Server Status</h2>
          {error ? (
            <div className="status error">
              <span className="status-indicator"></span>
              <span>{error}</span>
            </div>
          ) : health ? (
            <div className="status success">
              <span className="status-indicator"></span>
              <span>Connected - {health.status}</span>
            </div>
          ) : (
            <div className="status loading">
              <span>Checking connection...</span>
            </div>
          )}
        </div>
        <div className="info-section">
          <h3>Getting Started</h3>
          <ul>
            <li>Client runs on <code>http://localhost:5173</code></li>
            <li>Server runs on <code>http://localhost:3000</code></li>
            <li>API docs at <code>http://localhost:3000/api/docs</code></li>
          </ul>
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
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
