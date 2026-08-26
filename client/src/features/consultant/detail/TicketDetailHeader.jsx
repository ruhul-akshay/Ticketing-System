import React from 'react';
import { ClipboardList, AlertCircle, Download, X } from 'lucide-react';
import { getStatusBadgeClass, getPriorityBadgeClass } from '../../../utils/ticketHelpers';

export default function TicketDetailHeader({
  ticket,
  status,
  onDownloadReport,
  onClose
}) {
  if (!ticket) return null;

  return (
    <div className="px-4 sm:px-8 py-3.5 sm:py-5 border-b border-slate-200 dark:border-white/5 bg-gradient-to-r from-slate-100/70 to-slate-50/70 dark:from-[#1e293b]/70 dark:to-[#0f172a]/70 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 relative overflow-hidden shrink-0">
      <div className="absolute top-0 left-0 w-full h-full bg-blue-600/5 blur-[100px] pointer-events-none" />

      {/* Left: Icon, Number, Status, Title */}
      <div className="flex items-center gap-3 sm:gap-4 relative z-10 w-full md:flex-1 min-w-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
          <ClipboardList size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="px-2 py-0.5 bg-slate-200/80 dark:bg-white/10 border border-slate-300/60 dark:border-white/10 rounded-md text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              #{ticket.ticketNumber || String(ticket.id).slice(-8).toUpperCase()}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${getStatusBadgeClass(
                status
              )}`}
            >
              {status}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${getPriorityBadgeClass(
                ticket.priority
              )}`}
            >
              <AlertCircle size={10} /> {ticket.priority || 'Medium'}
            </span>
          </div>
          <h2
            className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-snug truncate"
            title={ticket.title}
          >
            {ticket.title}
          </h2>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 relative z-10 w-full md:w-auto justify-end shrink-0">
        <button
          type="button"
          onClick={onDownloadReport}
          className="px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-blue-500/20 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider cursor-pointer"
          title="Download Ticket Summary Report"
        >
          <Download size={14} />
          <span>Report</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-2 sm:p-2.5 bg-slate-100 hover:bg-red-500/10 dark:bg-white/5 dark:hover:bg-red-500/20 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 cursor-pointer"
          title="Close Panel"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
