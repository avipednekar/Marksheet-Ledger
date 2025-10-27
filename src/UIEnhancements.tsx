// UIEnhancements.tsx
// Purpose: A collection of polished UI utility components (loader, page transitions,
// skeletons, animated sidebar/nav helpers) and a small demo. Drop these into your
// React + Tailwind project and integrate where noted in the integration tips below.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Bell, User, Menu, X } from 'lucide-react';

/*
  Integration tips (read first):
  1) Install framer-motion: `npm i framer-motion` (available in your environment per canvas rules).
  2) Replace your Suspense fallback in App.tsx with <AnimatedFullPageLoader /> for auth-checks.
  3) Wrap main route content with <PageTransition> ... </PageTransition> (used for subtle enter/exit).
  4) Use <SkeletonText lines={3} /> inside lists/cards while fetching.
  5) Swap Sidebar and Navbar where micro-interactions are desired by using the Animated* versions.

  Example quick integration:
  - In App.tsx: import { AnimatedFullPageLoader, PageTransition } from './UIEnhancements';
  - Use <AnimatedFullPageLoader /> for full page loading and <PageTransition> around page children.
*/

// ----------------------------- AnimatedFullPageLoader -----------------------------
export const AnimatedFullPageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-50/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 25 }}
        className="flex flex-col items-center gap-4 p-6 rounded-2xl shadow-2xl bg-white/90 border border-neutral-100"
        role="status"
        aria-live="polite"
      >
        <div className="relative">
          <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg">
            <ScrollText className="h-8 w-8 text-white animate-pulse" />
          </div>
          {/* Orb */}
          <motion.span
            aria-hidden
            className="absolute -right-3 -bottom-3 h-6 w-6 rounded-full bg-indigo-300/60 blur-xl"
            animate={{ scale: [1, 1.45, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>

        <div className="text-center">
          <p className="font-semibold text-neutral-900">{message}</p>
          <p className="text-xs text-neutral-500">Preparing a smooth experience…</p>
        </div>

        <div className="w-40 mt-1">
          {/* Fancy progress bar — purely visual to suggest activity without actual percent */}
          <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
              initial={{ x: '-110%' }}
              animate={{ x: ['-110%', '110%'] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        </div>

      </motion.div>
    </div>
  );
};

// ----------------------------- LoadingSpinner (refined) -----------------------------
export const LoadingSpinner: React.FC<{ size?: 'sm'|'md'|'lg'|'xl'; className?: string; accessibleLabel?: string }> = ({ size = 'md', className = '', accessibleLabel = 'Loading' }) => {
  const sizes: Record<string, string> = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-3',
    lg: 'h-8 w-8 border-4',
    xl: 'h-12 w-12 border-4'
  };

  return (
    <div className={`flex items-center justify-center ${className}`} aria-busy aria-label={accessibleLabel}>
      <div className={`${sizes[size]} rounded-full border-t-transparent animate-spin`} style={{ borderLeftColor: 'rgb(99 102 241)', borderTopColor: 'rgb(79 70 229)', borderRightColor: 'rgb(168 85 247)', borderBottomColor: '#e5e7eb' }} />
    </div>
  );
};

// ----------------------------- SkeletonText -----------------------------
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => {
  const array = Array.from({ length: lines });
  return (
    <div className={`space-y-2 ${className}`}> 
      {array.map((_, i) => (
        <div key={i} className="h-3 bg-neutral-200 rounded animate-pulse" style={{ width: `${80 - i * 10}%` }} />
      ))}
    </div>
  );
};

// ----------------------------- PageTransition wrapper -----------------------------
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AnimatePresence mode="wait" initial={true}>
      <motion.div
        key={typeof children === 'string' ? children : 'page'}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
        className="min-h-[60vh]"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// ----------------------------- AnimatedSidebar (drop-in helpers) -----------------------------
export const AnimatedSidebar: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  onClose?: () => void;
}> = ({ children, isOpen, onClose }) => {
  return (
    <>
      {/* backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-neutral-900/30 lg:hidden backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={{ x: -320 }}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        className={`fixed top-0 left-0 z-50 w-64 border-r border-neutral-200 bg-white h-screen lg:static lg:translate-x-0`}
        aria-hidden={!isOpen}
      >
        {children}
      </motion.aside>
    </>
  );
};

// ----------------------------- AnimatedNavbar (compact) -----------------------------
export const AnimatedNavbar: React.FC<{ onMenuClick?: () => void; teacherName?: string; department?: string; onLogout?: () => void }> = ({ onMenuClick, teacherName, department, onLogout }) => {
  return (
    <motion.nav
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.36, ease: [0.2, 0.8, 0.2, 1] }}
      className="bg-white shadow-sm border-b border-neutral-200 fixed top-0 left-0 right-0 z-50"
    >
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button onClick={onMenuClick} className="lg:hidden p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center ml-3 lg:ml-0">
              <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
                <ScrollText className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-neutral-900">College Marksheet</h1>
                <p className="text-xs text-neutral-500 hidden sm:block">Academic Management System</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all relative group">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white transform-gpu transition-transform group-hover:scale-110"></span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-neutral-900">{teacherName}</p>
                <p className="text-xs text-neutral-500">{department}</p>
              </div>
              <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>

              <button onClick={onLogout} className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

// ----------------------------- Demo Page (default export) -----------------------------
const DemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">UI Enhancements — Demo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl border bg-white shadow-sm">
            <h3 className="font-semibold mb-3">Animated Full Page Loader</h3>
            <AnimatedFullPageLoader message="Loading dashboard…" />
          </div>

          <div className="p-5 rounded-xl border bg-white shadow-sm">
            <h3 className="font-semibold mb-3">Skeleton + Spinner</h3>
            <div className="flex items-center gap-3">
              <LoadingSpinner size="lg" />
              <div className="flex-1">
                <SkeletonText lines={4} />
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-xl border bg-white shadow-sm">
          <h3 className="font-semibold mb-3">Page Transition (wrap your route content)</h3>
          <div className="p-3 rounded border-dashed border-neutral-200">
            <PageTransition>
              <div className="p-4">This content will fade/slide in when the route changes. Use it to reduce abrupt changes.</div>
            </PageTransition>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DemoPage;
