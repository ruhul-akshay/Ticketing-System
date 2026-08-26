import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useTicketStore } from '../../store/useTicketStore';

// Navbar sub-components
import NavbarSearchBar from './navbar/NavbarSearchBar';
import NavbarNotifications from './navbar/NavbarNotifications';
import NavbarAlerts from './navbar/NavbarAlerts';
import NavbarProfileMenu from './navbar/NavbarProfileMenu';
import TicketViewerModal from '../ui/TicketViewerModal';
import ProfileSettingsModal from '../ui/ProfileSettingsModal';

export default function Navbar({ isMobileMenuOpen, setIsMobileMenuOpen }) {
  const { user } = useAuthStore();
  const { notifications, fetchNotifications, markAsRead, downloadAttachment } =
    useNotificationStore();
  const { tickets, fetchTickets } = useTicketStore();

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('profile');

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Background polling for notifications
  useEffect(() => {
    if (!user) return;
    const prefs = user.preferences || {};
    const refreshSeconds =
      prefs.autoRefreshInterval !== undefined ? prefs.autoRefreshInterval : 4;

    if (refreshSeconds <= 0) return;

    const interval = setInterval(() => {
      fetchNotifications().catch((err) =>
        console.error('Error fetching notifications:', err)
      );
    }, Math.max(refreshSeconds, 6) * 1000);

    return () => clearInterval(interval);
  }, [fetchNotifications, user?.preferences?.autoRefreshInterval, user]);

  const handleOpenProfileModal = (tab = 'profile') => {
    setActiveProfileTab(tab);
    setIsProfileModalOpen(true);
  };

  return (
    <>
      <header className="h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-xl flex items-center justify-between gap-4 sticky top-0 z-40">
        {/* Left Side: Mobile Menu Toggle & Global Search */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen?.(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 cursor-pointer"
            title="Toggle Navigation Menu"
          >
            <Menu size={20} />
          </button>

          <NavbarSearchBar tickets={tickets} onSelectTicket={setSelectedTicket} />
        </div>

        {/* Right Side: Alerts, Notifications, Theme, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <NavbarAlerts
            user={user}
            tickets={tickets}
            onSelectTicket={setSelectedTicket}
          />

          <NavbarNotifications
            notifications={notifications}
            markAsRead={markAsRead}
            downloadAttachment={downloadAttachment}
            onSelectTicket={setSelectedTicket}
            tickets={tickets}
          />

          <NavbarProfileMenu onOpenProfileModal={handleOpenProfileModal} />
        </div>
      </header>

      {/* Ticket Viewer Modal */}
      {selectedTicket && (
        <TicketViewerModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={fetchTickets}
        />
      )}

      {/* Profile & Settings Modal */}
      {isProfileModalOpen && (
        <ProfileSettingsModal
          isOpen={isProfileModalOpen}
          initialTab={activeProfileTab}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}
    </>
  );
}
