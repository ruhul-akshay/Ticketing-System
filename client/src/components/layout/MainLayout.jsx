import React, { useEffect, useState, Suspense } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import ErrorBoundary from '../ErrorBoundary';
import { useAuthStore } from '../../store/useAuthStore';
import { useTicketStore } from '../../store/useTicketStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationPolling } from '../../hooks/useNotificationPolling';
import { PageLoader } from '../../app/router';

const MainLayout = () => {
  const { isAuthenticated, checkAuth, user } = useAuthStore();
  const { fetchTickets } = useTicketStore();
  const { initFromUser } = useThemeStore();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  // ── Centralised notification polling (runs once, shared by Sidebar + Navbar)
  useNotificationPolling();

  // Sync theme settings when user preferences are loaded
  useEffect(() => {
    if (user?.preferences) {
      initFromUser(user.preferences);
    }
  }, [user, initFromUser]);

  // Run initial session check on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Persist sidebar collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', isSidebarCollapsed);
  }, [isSidebarCollapsed]);

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Load tickets on auth, then auto-refresh based on user preference
  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated, fetchTickets]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshSeconds = user?.preferences?.autoRefreshInterval ?? 4;
    if (refreshSeconds <= 0) return;

    const interval = setInterval(() => {
      fetchTickets().catch((err) =>
        console.error('[Tickets] Auto-refresh failed:', err)
      );
    }, refreshSeconds * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchTickets, user?.preferences?.autoRefreshInterval]);

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617] font-sans relative text-slate-300">
      {/* Global Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="relative z-10 flex w-full h-full">
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        <div className="flex flex-col flex-1 overflow-hidden relative min-w-0">
          <Navbar isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8 scroll-smooth w-full relative">
            <div className="max-w-[1600px] mx-auto w-full min-h-full pb-10">
              {/* ErrorBoundary catches component crashes — shows friendly UI instead of blank screen */}
              <ErrorBoundary>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0, scale: 0.98, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -10 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="w-full h-full"
                  >
                    <Suspense fallback={<PageLoader />}>
                      <Outlet />
                    </Suspense>
                  </motion.div>
                </AnimatePresence>
              </ErrorBoundary>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default MainLayout;

