import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Paperclip, Check, Ticket } from 'lucide-react';
import { formatRelativeTime } from '../../../utils/formatters';

export default function NavbarNotifications({
  notifications = [],
  markAsRead,
  downloadAttachment,
  onSelectTicket,
  tickets = []
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter((n) => !n.read).length;

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

  const handleMarkAllRead = () => {
    safeNotifications.forEach((n) => {
      if (!n.read && typeof markAsRead === 'function') {
        markAsRead(n._id);
      }
    });
  };

  const handleNotificationClick = async (n) => {
    if (!n.read && typeof markAsRead === 'function') {
      markAsRead(n._id || n.id);
    }

    // Attempt to locate and open the referenced ticket if applicable
    if (typeof onSelectTicket === 'function') {
      let targetTicket = n.ticket || null;

      if (!targetTicket && (n.ticketId || n.targetId) && Array.isArray(tickets)) {
        const searchId = String(n.ticketId || n.targetId);
        targetTicket = tickets.find(
          (t) => String(t.id || t._id) === searchId
        );
      }

      if (!targetTicket && Array.isArray(tickets)) {
        const textToMatch = `${n.title || ''} ${n.message || ''}`;
        const match = textToMatch.match(/#?([A-Za-z0-9_-]{4,})/);
        if (match) {
          const matchedNum = match[1].toLowerCase();
          targetTicket = tickets.find(
            (t) =>
              t.ticketNumber?.toLowerCase() === matchedNum ||
              String(t.id || t._id).toLowerCase() === matchedNum
          );
        }
      }

      // Fallback: If ticket was created recently and not in current state, refresh tickets store or query API
      if (!targetTicket) {
        try {
          const ticketStore = useTicketStore.getState();
          if (ticketStore?.fetchTickets) {
            await ticketStore.fetchTickets();
            const freshTickets = useTicketStore.getState().tickets || [];
            const searchId = String(n.ticketId || n.targetId || '');
            const textToMatch = `${n.title || ''} ${n.message || ''}`;
            const match = textToMatch.match(/#?([A-Za-z0-9_-]{4,})/);
            const matchedNum = match ? match[1].toLowerCase() : '';

            targetTicket = freshTickets.find(
              (t) =>
                (searchId && String(t.id || t._id) === searchId) ||
                (matchedNum && t.ticketNumber?.toLowerCase() === matchedNum) ||
                (matchedNum && String(t.id || t._id).toLowerCase() === matchedNum)
            );
          }
        } catch (err) {
          console.error('Error fetching tickets for notification:', err);
        }
      }

      if (targetTicket) {
        onSelectTicket(targetTicket);
        setIsOpen(false);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
        title="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white font-black text-[9px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#0b0f19] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#111620] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 font-sans"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Notifications</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {unreadCount} Unread
                </span>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <Check size={12} /> Mark all read
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 custom-scrollbar">
              {safeNotifications.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-medium">
                  No notifications yet
                </div>
              ) : (
                safeNotifications.slice(0, 10).map((n) => (
                  <div
                    key={n._id || Math.random()}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 transition-colors cursor-pointer space-y-1.5 ${
                      n.read
                        ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                        : 'bg-blue-500/[0.04] dark:bg-blue-500/[0.06] hover:bg-blue-500/[0.08]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-xs font-bold ${
                          n.read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {n.title || 'Notice'}
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>

                    {Array.isArray(n.attachments) && n.attachments.length > 0 && (
                      <div
                        className="pt-1 flex flex-wrap gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {n.attachments.map((att) => (
                          <button
                            key={att._id || att.filename}
                            type="button"
                            onClick={() =>
                              typeof downloadAttachment === 'function' &&
                              downloadAttachment(n._id, att._id, att.originalName || att.filename)
                            }
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-blue-500 cursor-pointer"
                          >
                            <Paperclip size={11} />
                            <span className="truncate max-w-[120px]">
                              {att.originalName || att.filename}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
