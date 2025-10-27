import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  X,
  Filter,
  ScrollText
} from 'lucide-react';
import { motion, Variants } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Results', href: '/results', icon: FileText },
  { name: 'Filter', href: '/filter', icon: Filter },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings }
];

const sidebarVariants: Variants = {
  hidden: { x: '-100%' },
  visible: { x: 0, transition: { when: 'beforeChildren', staggerChildren: 0.04 } },
  exit: { x: '-100%' }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0 }
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-neutral-900/30 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <motion.aside
        initial="hidden"
        animate={isOpen ? 'visible' : 'hidden'}
        exit="exit"
        variants={sidebarVariants}
        className={`
          fixed top-0 left-0 z-50 w-64 border-r border-neutral-200
          bg-white h-screen lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        <div className="flex flex-col h-screen">
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
                <ScrollText className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-neutral-900">Marksheet</h1>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.name} variants={itemVariants}>
                  <NavLink
                    to={item.href}
                    onClick={() => window.innerWidth < 1024 && onClose()}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-150 group
                       ${isActive
                        ? 'border-l-4 border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                        : 'border-l-4 border-transparent text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                       }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-neutral-400 group-hover:text-neutral-600'}`} />
                        <span className="flex-1 truncate">{item.name}</span>
                      </>
                    )}
                  </NavLink>
                </motion.div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-neutral-200">
            <div className="text-xs text-neutral-500 text-center">
              <p>College Marksheet System</p>
              <p className="mt-1">v2.0.0</p>
            </div>
          </div>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;