import React from 'react';
import { Ticket, RefreshCw } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Ticket,
  title = 'No records found',
  description = 'There are no items matching your criteria at this moment.',
  actionLabel,
  onAction,
  minHeight = 'min-h-[250px]',
  className = ''
}) {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 dark:bg-white/[0.01] rounded-[2rem] border border-slate-200 dark:border-white/5 ${minHeight} ${className}`}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
        <Icon size={28} />
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white tracking-tight mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm font-medium mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          <RefreshCw size={14} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
