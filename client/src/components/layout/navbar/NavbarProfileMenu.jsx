import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Settings,
  LogOut,
  Sun,
  Moon,
  Shield,
  Mail,
  DollarSign,
  FileText,
  Calendar,
  Sliders
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { useThemeStore } from '../../../store/useThemeStore';

export default function NavbarProfileMenu({ onOpenProfileModal }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const { user, logout } = useAuthStore();
  const { resolvedTheme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || user?.fullName || 'User';
  const roleName = user?.role || 'Staff';
  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'Super Admin' || user?.role === 'admin';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-2 rounded-2xl bg-slate-100/70 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-md">
          {displayName[0]?.toUpperCase() || 'U'}
        </div>
        <div className="hidden lg:block text-left">
          <p className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[120px]">
            {displayName}
          </p>
          <p className="text-[10px] text-slate-500 font-medium truncate uppercase tracking-wider">{roleName}</p>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#111620] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 font-sans space-y-1"
          >
            {/* User Header */}
            <div className="p-3 border-b border-slate-100 dark:border-white/5">
              <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                {displayName}
              </p>
              <p className="text-[11px] text-slate-500 font-medium truncate">{user?.email}</p>
              <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                <Shield size={10} /> {roleName}
              </div>
            </div>

            {/* Menu Items matching original interface */}
            <div className="py-1 space-y-0.5">
              {/* 1. Profile Information */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenProfileModal?.('profile');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <User size={15} className="text-slate-400 shrink-0" />
                <span>Profile Information</span>
              </button>

              {/* 2. Dashboard Settings */}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenProfileModal?.('settings');
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <Sliders size={15} className="text-slate-400 shrink-0" />
                <span>Dashboard Settings</span>
              </button>

              {/* Super Admin specific functions */}
              {isSuperAdmin && (
                <>
                  {/* 3. CC Email Settings */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/super-admin/settings');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Settings size={15} className="text-slate-400 shrink-0" />
                    <span>CC Email Settings</span>
                  </button>

                  {/* 4. Pricing Setup */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/super-admin/pricing');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <DollarSign size={15} className="text-emerald-500 shrink-0" />
                    <span>Pricing Setup</span>
                  </button>

                  {/* 5. System Reports */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/super-admin/reports');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <FileText size={15} className="text-rose-500 shrink-0" />
                    <span>System Reports</span>
                  </button>

                  {/* 6. Holiday Master */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/super-admin/holidays');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                  >
                    <Calendar size={15} className="text-purple-500 shrink-0" />
                    <span>Holiday Master</span>
                  </button>
                </>
              )}

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={() => toggleTheme()}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  {resolvedTheme === 'dark' ? (
                    <Moon size={15} className="text-blue-400 shrink-0" />
                  ) : (
                    <Sun size={15} className="text-amber-500 shrink-0" />
                  )}
                  <span>Theme</span>
                </div>
                <span className="text-[10px] uppercase font-black text-slate-400">
                  {resolvedTheme}
                </span>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 dark:border-white/5 my-1" />

            {/* 7. Secure Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-xs font-bold text-red-600 dark:text-red-500 transition-colors cursor-pointer"
            >
              <LogOut size={15} className="shrink-0" />
              <span className="font-extrabold">Secure Logout</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
