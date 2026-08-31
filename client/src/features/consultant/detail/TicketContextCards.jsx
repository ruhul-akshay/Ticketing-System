import React from 'react';
import { User, Building2, Briefcase, Clock, CheckCircle } from 'lucide-react';
import { formatDateOnly } from '../../../utils/formatters';

export default function TicketContextCards({ ticket, status }) {
  if (!ticket) return null;

  const isResolved = status === 'Resolved' || ticket.status === 'Resolved';
  const solvedDate = ticket.original?.solvedAt || ticket.original?.actualResolutionDate;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {/* Reporter Card */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors group shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
            <User size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            Reporter
          </span>
        </div>
        <div>
          <p
            className="text-sm sm:text-base font-bold text-slate-800 dark:text-white truncate"
            title={ticket.user || ticket.original?.createdBy?.name || 'Unknown'}
          >
            {ticket.user || ticket.original?.createdBy?.name || 'Unknown'}
          </p>
          <p
            className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5"
            title={ticket.original?.createdBy?.email || ''}
          >
            {ticket.original?.createdBy?.email || 'No email provided'}
          </p>
        </div>
      </div>

      {/* Department Card */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors group shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform shrink-0">
            <Building2 size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            Department
          </span>
        </div>
        <div>
          <p
            className="text-sm sm:text-base font-bold text-slate-800 dark:text-white truncate"
            title={typeof ticket.department === 'object' ? (ticket.department?.name || 'General') : (ticket.department || 'General')}
          >
            {typeof ticket.department === 'object' ? (ticket.department?.name || 'General') : (ticket.department || 'General')}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
            {ticket.original?.category || 'General Category'}
          </p>
        </div>
      </div>

      {/* Client Card */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors group shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
            <Briefcase size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            Client
          </span>
        </div>
        <div>
          <p
            className="text-sm sm:text-base font-bold text-slate-800 dark:text-white truncate"
            title={ticket.clientName || ticket.original?.createdBy?.client?.name || 'Self/Internal'}
          >
            {ticket.clientName || ticket.original?.createdBy?.client?.name || 'Self/Internal'}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
            Account Domain
          </p>
        </div>
      </div>

      {/* Logged On Card */}
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors group shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform shrink-0">
            <Clock size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            Logged On
          </span>
        </div>
        <div>
          <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">
            {formatDateOnly(ticket.createdAt)}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            {ticket.createdAt
              ? new Date(ticket.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '—'}
          </p>
        </div>
      </div>

      {/* Solved On Card (if resolved) */}
      {isResolved && (
        <div className="bg-white dark:bg-white/5 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors group shadow-sm sm:col-span-2 xl:col-span-4 flex flex-col justify-between">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
              <CheckCircle size={16} />
            </div>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Resolution Logged
            </span>
          </div>
          <div>
            <p className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
              {solvedDate ? formatDateOnly(solvedDate) : 'Resolved'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {solvedDate
                ? new Date(solvedDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Ticket closed'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
