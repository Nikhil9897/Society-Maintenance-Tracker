import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Cursor } from './components/Cursor';
import { LandingPage } from './pages/Landing/index';
import { AuthPage } from './pages/Auth';
import { ResidentDashboard } from './pages/ResidentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Toaster } from 'react-hot-toast';

const RootRedirect: React.FC = () => {
  const { user, token, isLoading } = useAuth();
  if (isLoading) return null;
  if (!token || !user) return <Navigate to="/landing" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/resident'} replace />;
};

export const App: React.FC = () => (
  <AuthProvider>
    <Cursor />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#0c1525',
          color: '#F6F4EF',
          border: '1px solid rgba(246,244,239,0.1)',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        success: { iconTheme: { primary: '#C9A468', secondary: '#0c1525' } },
        error:   { iconTheme: { primary: '#DC2626', secondary: '#0c1525' } },
      }}
    />
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route
          path="/resident/*"
          element={
            <ProtectedRoute requiredRole="resident">
              <ResidentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/landing" replace />} />
      </Routes>
    </Router>
  </AuthProvider>
);

export default App;
