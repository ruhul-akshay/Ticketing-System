import React from 'react';
import { getStatusBadgeClass } from '../../utils/ticketHelpers';

/**
 * Standard Ticket Statuses supported throughout the system
 */
export const TICKET_STATUSES = ['Open', 'On Hold', 'Cancelled', 'Resolved'];

export const TICKET_STATUS_OPTIONS = [
  { value: 'Open', label: 'Open' },
  { value: 'On Hold', label: 'On Hold' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Resolved', label: 'Resolved' },
];

/**
 * Helper to normalize ticket status strings from various sources
 * (e.g. 'pending', 'assigned' -> 'Open', 'hold' -> 'On Hold', 'closed' -> 'Resolved')
 */
export const normalizeTicketStatus = (status) => {
  if (!status) return 'Open';
  const s = String(status).trim().toLowerCase();
  if (['open', 'pending', 'assigned', 'open protocol'].includes(s)) return 'Open';
  if (['on hold', 'hold'].includes(s)) return 'On Hold';
  if (s === 'cancelled') return 'Cancelled';
  if (['resolved', 'closed', 'resolution complete'].includes(s)) return 'Resolved';
  return String(status).charAt(0).toUpperCase() + String(status).slice(1);
};

/**
 * Standardized Ticket Status Badge Component.
 * Renders uniform badge pill matching Image 1:
 * - Open: Blue (bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20)
 * - On Hold: Amber/Yellow (bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20)
 * - Cancelled: Gray/Slate (bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20)
 * - Resolved: Emerald/Green (bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20)
 *
 * @param {string} status - Raw ticket status
 * @param {'xs'|'sm'|'md'|'lg'} size - Badge size (default: 'md')
 * @param {string} className - Optional additional classes
 */
export default function TicketStatusBadge({
  status = 'Open',
  size = 'md',
  className = '',
  ...props
}) {
  const normalized = normalizeTicketStatus(status);
  const colorClass = getStatusBadgeClass(normalized);

  const sizeClasses = {
    xs: 'text-[8px] px-1.5 py-0.5 rounded',
    sm: 'text-[9px] px-2 py-0.5 rounded-lg',
    md: 'text-[10px] px-2.5 py-1 rounded-lg',
    lg: 'text-[11px] px-3 py-1.5 rounded-xl',
  }[size] || 'text-[10px] px-2.5 py-1 rounded-lg';

  return (
    <span
      className={`inline-flex items-center justify-center font-black uppercase tracking-wider ${sizeClasses} ${colorClass} ${className}`}
      {...props}
    >
      {normalized}
    </span>
  );
}
