import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { AppProvider } from './context/AppContext.jsx';
import { useToast } from './hooks/useToast.js';
import Toast from './components/Toast.jsx';
import AuthPage    from './pages/AuthPage.jsx';
import Dashboard   from './pages/Dashboard.jsx';
import ScopingPage from './pages/ScopingPage.jsx';
import SummaryPage from './pages/SummaryPage.jsx';
import AdminPage   from './pages/AdminPage.jsx';

// ── PROTECTED LAYOUT ─────────────────────────────────────────────────────────
function AppLayout() {
  const { user, logout, loading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { toasts, toast } = useToast();

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!user)   return <Navigate to="/login" replace />;

  const tabs = [
    { path: '/',        label: 'Dashboard' },
    { path: '/scope',   label: 'New Scope' },
    { path: '/summary', label: 'Summary'   },
    ...(user.role === 'admin' ? [{ path: '/admin', label: 'Admin' }] : []),
  ];

  const active = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <AppProvider>
      <div className="app-shell">
        {/* Top bar */}
        <div className="topbar">
          <div className="topbar-brand">ScopeBuilder</div>
          <div className="topbar-right">
            {user.role === 'admin' && <span className="topbar-badge">Admin</span>}
            <span className="topbar-user">{user.name}</span>
            <button className="btn-link" onClick={() => { logout(); navigate('/login'); }}>
              Sign out
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="nav-tabs">
          {tabs.map(t => (
            <button
              key={t.path}
              className={`nav-tab${active(t.path) ? ' active' : ''}`}
              onClick={() => navigate(t.path)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Page content */}
        <div className="main">
          <Routes>
            <Route path="/"        element={<Dashboard   toast={toast} />} />
            <Route path="/scope"   element={<ScopingPage toast={toast} />} />
            <Route path="/summary" element={<SummaryPage toast={toast} />} />
            <Route path="/admin"   element={
              user.role === 'admin'
                ? <AdminPage toast={toast} />
                : <Navigate to="/" replace />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <Toast toasts={toasts} />
      </div>
    </AppProvider>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/*"     element={<AppLayout />} />
      </Routes>
    </AuthProvider>
  );
}
