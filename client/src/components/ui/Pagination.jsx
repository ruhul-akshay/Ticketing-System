import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  className = ''
}) {
  if (totalPages <= 1 && totalItems === 0) return null;

  const startIdx = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div
      className={`p-4 sm:p-6 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-white/[0.01] ${className}`}
    >
      <span className="text-[11px] sm:text-xs text-slate-500 font-bold uppercase tracking-wider">
        Showing <span className="text-slate-800 dark:text-white font-black">{startIdx}</span> to{' '}
        <span className="text-slate-800 dark:text-white font-black">{endIdx}</span> of{' '}
        <span className="text-slate-800 dark:text-white font-black">{totalItems}</span> entries
      </span>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="p-2 sm:px-3 sm:py-2 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-sm"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="px-3 py-1.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 font-black text-xs rounded-xl border border-blue-500/20">
          Page {currentPage} of {totalPages}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
          className="p-2 sm:px-3 sm:py-2 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-40 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-sm"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
