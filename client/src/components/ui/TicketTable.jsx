import React from 'react';
import { motion } from 'framer-motion';
import {
  Ticket,
  Eye,
  Send,
  Building2,
  Clock,
  User,
  Paperclip,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  getPriorityBadgeClass,
  getStatusBadgeClass,
  isUnopened
} from '../../utils/ticketHelpers';
import { formatDateTime, formatDateOnly } from '../../utils/formatters';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

export default function TicketTable({
  tickets = [],
  currentUser,
  isLoading = false,
  onSelectTicket,
  onForwardTicket,
  showAssignee = true,
  canForward = false,
  emptyTitle = 'No tickets found',
  emptyDescription = 'Try adjusting your search query or active filters.',
  className = ''
}) {
  if (isLoading && tickets.length === 0) {
    return <LoadingSpinner message="Loading tickets..." />;
  }

  if (tickets.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div
      className={`bg-white/70 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-sm ${className}`}
    >
      {/* Desktop & Tablet Table (hidden on small mobile) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] text-slate-500 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
              <th className="py-4 px-5">Ticket Info</th>
              <th className="py-4 px-5">Client / Dept</th>
              <th className="py-4 px-5">Priority</th>
              <th className="py-4 px-5">Status</th>
              {showAssignee && <th className="py-4 px-5">Assignee</th>}
              <th className="py-4 px-5">Created At</th>
              <th className="py-4 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-white/5 font-sans">
            {tickets.map((ticket, index) => {
              if (!ticket) return null;
              const unopened = isUnopened(ticket, currentUser);
              const hasAttachments =
                (ticket.attachments && ticket.attachments.length > 0) ||
                (ticket.original?.attachments && ticket.original.attachments.length > 0);

              const assignedName =
                ticket.assignee ||
                ticket.assignedTo?.name ||
                ticket.original?.assignedTo?.name ||
                'Unassigned';

              return (
                <motion.tr
                  key={ticket.id || ticket._id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02, duration: 0.25 }}
                  onClick={() => onSelectTicket?.(ticket)}
                  className="hover:bg-blue-500/[0.03] dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  {/* Ticket Info */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
                          <Ticket size={18} />
                        </div>
                        {unopened && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-[#111620] rounded-full animate-ping" />
                        )}
                        {unopened && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white dark:border-[#111620] rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                            #{ticket.ticketNumber || String(ticket.id).slice(-6).toUpperCase()}
                          </span>
                          {hasAttachments && (
                            <Paperclip size={12} className="text-slate-400 shrink-0" />
                          )}
                        </div>
                        <p
                          className="font-bold text-slate-800 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors"
                          title={ticket.title}
                        >
                          {ticket.title || 'Untitled Ticket'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Client / Dept */}
                  <td className="py-4 px-5">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {ticket.clientName || 'Internal'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {ticket.department || 'General'}
                      </p>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getPriorityBadgeClass(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority || 'Medium'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusBadgeClass(
                        ticket.status
                      )}`}
                    >
                      {ticket.status || 'Open'}
                    </span>
                  </td>

                  {/* Assignee */}
                  {showAssignee && (
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {assignedName[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                          {assignedName}
                        </span>
                      </div>
                    </td>
                  )}

                  {/* Created At */}
                  <td className="py-4 px-5 text-slate-500 font-medium whitespace-nowrap">
                    {formatDateOnly(ticket.createdAt)}
                  </td>

                  {/* Action Buttons */}
                  <td className="py-4 px-5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectTicket?.(ticket)}
                        className="p-2 bg-slate-100 hover:bg-blue-50 dark:bg-white/5 dark:hover:bg-blue-500/20 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 cursor-pointer shadow-sm"
                        title="View Ticket Details"
                      >
                        <Eye size={15} />
                      </button>

                      {canForward && ticket.status !== 'Resolved' && onForwardTicket && (
                        <button
                          type="button"
                          onClick={() => onForwardTicket?.(ticket)}
                          className="p-2 bg-slate-100 hover:bg-purple-50 dark:bg-white/5 dark:hover:bg-purple-500/20 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 cursor-pointer shadow-sm"
                          title="Forward Ticket"
                        >
                          <Send size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (visible on mobile only) */}
      <div className="md:hidden divide-y divide-slate-200 dark:divide-white/5">
        {tickets.map((ticket, index) => {
          if (!ticket) return null;
          const unopened = isUnopened(ticket, currentUser);
          const assignedName =
            ticket.assignee ||
            ticket.assignedTo?.name ||
            ticket.original?.assignedTo?.name ||
            'Unassigned';

          return (
            <div
              key={ticket.id || ticket._id || index}
              onClick={() => onSelectTicket?.(ticket)}
              className="p-4 space-y-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {unopened && (
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full shrink-0 animate-pulse" />
                  )}
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    #{ticket.ticketNumber || String(ticket.id).slice(-6).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${getPriorityBadgeClass(
                      ticket.priority
                    )}`}
                  >
                    {ticket.priority}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${getStatusBadgeClass(
                      ticket.status
                    )}`}
                  >
                    {ticket.status}
                  </span>
                </div>
              </div>

              <h4 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-2">
                {ticket.title}
              </h4>

              <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 gap-2 border-t border-slate-200/50 dark:border-white/5">
                <span className="truncate max-w-[150px]">
                  {ticket.clientName || 'Internal'} • {ticket.department || 'General'}
                </span>
                <span className="font-medium text-[11px]">{formatDateOnly(ticket.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
