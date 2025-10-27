// App.tsx
import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoadingSpinner, { SkeletonLoader } from './components/LoadingSpinner';
import { AnimatePresence, motion } from 'framer-motion';

// Lazy-load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const Results = lazy(() => import('./pages/Results'));
const Login = lazy(() => import('./pages/Login'));
const UnderProcess = lazy(() => import('./pages/UnderProcess'));
const StudentDataViewer = lazy(() => import('./pages/StudentDataViewer'));

const AppStyles = () => (
  <style>{`
    :root { --bg: #f3f4f6; }
    body { background: var(--bg); }
    @keyframes subtleFloat {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
      100% { transform: translateY(0px); }
    }
    .content-fade-in { animation: fadeIn 0.28s ease-out forwards; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `}</style>
);

const FullPageLoader: React.FC<{ message?: string }> = ({ message }) => (
  <div className="min-h-screen flex items-center justify-center bg-neutral-100">
    <div className="text-center max-w-md w-full p-6">
      <div className="mb-6">
        <LoadingSpinner size="lg" />
      </div>
      {message && <p className="text-sm text-neutral-500">{message}</p>}
      <div className="mt-6">
        <SkeletonLoader lines={4} />
      </div>
    </div>
  </div>
);

const PageSkeletonCard: React.FC = () => (
  <div className="max-w-4xl w-full mx-auto p-6 bg-white rounded-lg shadow-sm">
    <div className="mb-4">
      <div className="h-6 w-48 rounded-md bg-neutral-200 mb-3" />
      <SkeletonLoader lines={6} />
    </div>
  </div>
);

const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.28 }}
    className="content-fade-in"
  >
    {children}
  </motion.div>
);

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-neutral-100">
      <Navbar onMenuClick={() => setSidebarOpen((s) => !s)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 lg:ml-78 pt-16 min-h-screen">
          <div className="p-6">
            <PageWrapper>{children}</PageWrapper>
          </div>
        </main>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { teacher, loading } = useAuth();

  if (loading) return <FullPageLoader message="Checking authentication…" />;

  if (!teacher) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      {/* Use a skeleton card while the protected page is still lazy-loading */}
      <Suspense fallback={<PageSkeletonCard />}>
        {children}
      </Suspense>
    </AppLayout>
  );
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { teacher, loading } = useAuth();

  if (loading) return <FullPageLoader message="Preparing application…" />;

  if (teacher) return <Navigate to="/dashboard" replace />;

  return (
    <Suspense fallback={<div className="max-w-md mx-auto p-6"><SkeletonLoader lines={8} /></div>}>
      {children}
    </Suspense>
  );
};

const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <Students />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />
        <Route
          path="/filter"
          element={
            <ProtectedRoute>
              <StudentDataViewer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <UnderProcess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <UnderProcess />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppStyles />
      <Router>
        <AnimatedRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;