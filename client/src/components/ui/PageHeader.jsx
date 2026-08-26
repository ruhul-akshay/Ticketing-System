import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function PageHeader({
  title,
  subtitle,
  icon: Icon,
  onRefresh,
  isRefreshing = false,
  actions,
  className = ''
}) {
  return (
    <div
      className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-slate-200 dark:border-white/5 relative z-10 ${className}`}
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
          {Icon && (
            <div className="p-2 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Icon size={24} />
            </div>
          )}
          <span>{title}</span>
        </h1>
        {subtitle && (
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-start md:justify-end">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2.5 sm:px-4 sm:py-2.5 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-500' : ''} />
            <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        )}
        {actions}
      </div>
    </div>
  );
}
