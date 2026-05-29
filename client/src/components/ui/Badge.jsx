import React from 'react';

const Badge = ({ children, color = 'blue', size = 'md', className = '' }) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2.5 py-1 text-[10px]';
  const colorClasses = {
    red: 'bg-red-500/10 text-red-500 border-red-500/30',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    yellow: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    gray: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  }[color] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';

  return (
    <span className={`inline-block rounded font-bold uppercase tracking-widest border shadow-sm ${sizeClasses} ${colorClasses} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
