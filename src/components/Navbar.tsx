// Navbar.tsx
import React from 'react';
import { Menu, User, LogOut, Bell, ScrollText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { teacher, logout } = useAuth();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-neutral-200 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <motion.button
              onClick={onMenuClick}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="lg:hidden p-2 rounded-md text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-6 w-6" />
            </motion.button>

            <div className="flex-shrink-0 flex items-center ml-3 lg:ml-0">
              <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-sm">
                <ScrollText className="h-5 w-5 text-white" />
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold text-neutral-900">College Marksheet</h1>
                <p className="text-xs text-neutral-500 hidden sm:block">Academic Management System</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              className="p-2 rounded-lg relative"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-neutral-600" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
            </motion.button>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-neutral-900">{teacher?.fullName}</p>
                <p className="text-xs text-neutral-500">{teacher?.department}</p>
              </div>

              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center shadow-inner">
                  <User className="h-4 w-4 text-white" />
                </div>

                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  className="p-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;