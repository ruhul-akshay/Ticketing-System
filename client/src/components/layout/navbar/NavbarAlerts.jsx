import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, ArrowRight, X, Check, Bell, AlertCircle, Clock } from 'lucide-react';
import { playNotificationSound } from '../../../utils/soundAlerts';
import { isUnopened, getPriorityBadgeClass, getStatusBadgeClass } from '../../../utils/ticketHelpers';
import { formatRelativeTime } from '../../../utils/formatters';
import { useTicketStore } from '../../../store/useTicketStore';

export default function NavbarAlerts({
  user,
  tickets = [],
  onSelectTicket
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [prevCount, setPrevCount] = useState(0);

  // Dismissed alert IDs (optional local override)
  const [dismissedAlerts, setDismissedAlerts] = useState(() => {
    try {
      const stored = localStorage.getItem(
        `dismissed_alerts_${user?.id || user?._id || 'default'}`
      );
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleDismissAlert = (alertId) => {
    setDismissedAlerts((prev) => {
      const next = [...prev, alertId];
      try {
        localStorage.setItem(
          `dismissed_alerts_${user?.id || user?._id || 'default'}`,
          JSON.stringify(next)
        );
      } catch (err) {
        console.error('Error storing dismissed alerts:', err);
      }
      return next;
    });
  };

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

  // Compute live unopened / new tickets relevant to logged-in user
  const unopenedTickets = useMemo(() => {
    if (!user || !Array.isArray(tickets)) return [];

    const roleLower = user.role?.toLowerCase()?.replace(/\s+/g, '') || '';
    const userIdStr = String(user.id || user._id || '');

    return tickets.filter((ticket) => {
      if (!ticket) return false;

      // 1. Check if unopened by this user
      const unopened = isUnopened(ticket, user);
      if (!unopened) return false;

      // 2. Ignore cancelled/resolved tickets
      const statusLower = ticket.status?.toLowerCase() || '';
      if (['cancelled', 'closed'].includes(statusLower)) return false;

      // 3. Filter by role access
      if (roleLower === 'superadmin' || roleLower === 'admin') {
        return true; // SuperAdmin sees all unopened tickets
      } else if (roleLower === 'consultant') {
        const o = ticket.original || {};
        const isAssigned =
          o.assignedTo?._id === userIdStr ||
          o.assignedTo?.id === userIdStr ||
          ticket.assignedTo === userIdStr;
        const isDept = ticket.department === user.department || o.department === user.department;
        return isAssigned || isDept || true;
      } else {
        // Client / User sees tickets created by their client
        const isSameClient =
          user.client &&
          (ticket.createdBy?.client?._id === user.client ||
            ticket.createdBy?.client === user.client ||
            ticket.clientId === user.client);
        return isSameClient || ticket.creatorId === userIdStr;
      }
    }).filter((t) => !dismissedAlerts.includes(String(t.id || t._id)));
  }, [user, tickets, dismissedAlerts]);

  // Audio cue when new unopened tickets arrive
  useEffect(() => {
    if (unopenedTickets.length > prevCount && prevCount > 0) {
      if (user?.preferences?.soundEnabled !== false) {
        playNotificationSound();
      }
    }
    setPrevCount(unopenedTickets.length);
  }, [unopenedTickets.length, prevCount, user]);

  const handleMarkAllOpened = () => {
    unopenedTickets.forEach((ticket) => {
      const ticketId = ticket.id || ticket._id || ticket.original?._id;
      if (ticketId) {
        useTicketStore.getState().markTicketAsOpened(ticketId);
      }
    });
  };

  const unreadBadgeCount = unopenedTickets.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
          unreadBadgeCount > 0
            ? 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
        }`}
        title="New Ticket Notifications"
      >
        <Ticket size={18} className={unreadBadgeCount > 0 ? 'animate-pulse' : ''} />
        {unreadBadgeCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-blue-600 text-white font-black text-[9px] rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#0b0f19] animate-pulse">
            {unreadBadgeCount > 99 ? '99+' : unreadBadgeCount}
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
            {/* Dropdown Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <Ticket size={16} className="text-blue-500" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  New Tickets
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {unreadBadgeCount} Unopened
                </span>
              </div>
              {unreadBadgeCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllOpened}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <Check size={12} /> Mark all read
                </button>
              )}
            </div>

            {/* Unopened Ticket List */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 custom-scrollbar">
              {unopenedTickets.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 font-medium space-y-1">
                  <Check size={24} className="mx-auto text-emerald-500 opacity-60 mb-2" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">All tickets opened</p>
                  <p className="text-[11px] text-slate-400">No new unopened tickets since last check.</p>
                </div>
              ) : (
                unopenedTickets.map((ticket) => {
                  const ticketId = ticket.id || ticket._id;
                  const ticketNum = ticket.ticketNumber || String(ticketId).slice(-6).toUpperCase();

                  return (
                    <div
                      key={ticketId}
                      onClick={() => {
                        onSelectTicket?.(ticket);
                        setIsOpen(false);
                      }}
                      className="p-4 bg-blue-500/[0.04] dark:bg-blue-500/[0.06] hover:bg-blue-500/[0.09] transition-colors cursor-pointer space-y-2 relative group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            #{ticketNum}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${getPriorityBadgeClass(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority || 'Medium'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDismissAlert(String(ticketId));
                            }}
                            className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                            title="Dismiss notification"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                        {ticket.title}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-white/5">
                        <span className="truncate max-w-[160px]">
                          {ticket.clientName || 'Internal'} • {ticket.department || 'General'}
                        </span>
                        <span className="font-semibold text-slate-400">
                          {formatRelativeTime(ticket.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
