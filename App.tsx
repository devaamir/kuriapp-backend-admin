import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User } from './types';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { DashboardLayout } from './components/DashboardLayout';
import { Overview } from './components/Overview';
import { UsersList } from './components/UsersList';
import { KurisList } from './components/KurisList';
import { KuriDetails } from './components/KuriDetails';
import { SettingsPage } from './components/SettingsPage';

// Fake Auth Service within App for simplicity of single-file-like distribution structure logic
// In a larger app, this would be in services/auth.ts and context/AuthContext.tsx
const STORAGE_KEY = 'kuri_auth_user';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage on mount
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (user: User) => {
    setUser(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} />
        } />
        <Route path="/signup" element={
          user ? <Navigate to="/dashboard" replace /> : <SignupPage />
        } />

        <Route path="/*" element={
          user ? (
            <ProtectedRoutes user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </HashRouter>
  );
}

// Sub-router for dashboard pages to handle layout active states
const ProtectedRoutes: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const location = useLocation();

  // Determine active page ID based on path
  const getActivePage = (path: string) => {
    if (path.includes('users')) return 'users';
    if (path.includes('kuris')) return 'kuris';
    if (path.includes('settings')) return 'settings';
    return 'dashboard';
  };

  const [activePage, setActivePage] = useState(getActivePage(location.pathname));
  const navigate = (pathId: string) => {
    setActivePage(pathId);
    // Simple hash navigation
    window.location.hash = pathId === 'dashboard' ? '/' : `/${pathId}`;
  };

  // Update active page if URL changes externally (back button)
  useEffect(() => {
    setActivePage(getActivePage(location.pathname));
  }, [location]);

  return (
    <DashboardLayout user={user} onLogout={onLogout} activePage={activePage} onNavigate={navigate}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Overview currentUser={user} />} />
        <Route path="/users" element={user.role === 'admin' ? <UsersList /> : <Navigate to="/dashboard" />} />
        <Route path="/kuris" element={<KurisList currentUser={user} />} />
        <Route path="/kuris/:id" element={<KuriDetails currentUser={user} />} />
        <Route path="/settings" element={<SettingsPage currentUser={user} />} />
        <Route path="*" element={<div className="p-8 text-center text-slate-500">Page not found</div>} />
      </Routes>
    </DashboardLayout>
  );
};

export default App;