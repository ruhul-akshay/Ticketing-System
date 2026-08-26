import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({
  message = 'Loading...',
  size = 28,
  minHeight = 'min-h-[250px]',
  className = ''
}) {
  return (
    <div
      className={`w-full flex flex-col items-center justify-center p-8 text-center font-sans ${minHeight} ${className}`}
    >
      <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-4 animate-pulse">
        <Loader2 size={size} className="text-blue-500 animate-spin" />
      </div>
      {message && (
        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-[11px] sm:text-xs">
          {message}
        </p>
      )}
    </div>
  );
}
