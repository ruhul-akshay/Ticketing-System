import React from 'react';
import { motion } from 'framer-motion';

const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-500/10 dark:bg-blue-500/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    glow: 'bg-blue-600/15 group-hover:bg-blue-500/25',
    activeBg: 'bg-blue-500/15'
  },
  emerald: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'bg-emerald-600/15 group-hover:bg-emerald-500/25',
    activeBg: 'bg-emerald-500/15'
  },
  green: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    glow: 'bg-emerald-600/15 group-hover:bg-emerald-500/25',
    activeBg: 'bg-emerald-500/15'
  },
  yellow: {
    bg: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/20',
    glow: 'bg-yellow-600/15 group-hover:bg-yellow-500/25',
    activeBg: 'bg-yellow-500/15'
  },
  amber: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    glow: 'bg-amber-600/15 group-hover:bg-amber-500/25',
    activeBg: 'bg-amber-500/15'
  },
  red: {
    bg: 'bg-red-500/10 dark:bg-red-500/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/20',
    glow: 'bg-red-600/15 group-hover:bg-red-500/25',
    activeBg: 'bg-red-500/15'
  },
  purple: {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-500/20',
    glow: 'bg-purple-600/15 group-hover:bg-purple-500/25',
    activeBg: 'bg-purple-500/15'
  },
  indigo: {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-500/20',
    glow: 'bg-indigo-600/15 group-hover:bg-indigo-500/25',
    activeBg: 'bg-indigo-500/15'
  },
  gray: {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/20',
    glow: 'bg-slate-600/15 group-hover:bg-slate-500/25',
    activeBg: 'bg-slate-500/15'
  }
};

export default function StatCard({
  title,
  value,
  sub,
  icon,
  color = 'blue',
  delay = 0,
  isActive = false,
  onClick,
  className = ''
}) {
  const scheme = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      whileHover={onClick ? { y: -4 } : undefined}
      onClick={onClick}
      className={`glass-card p-3.5 sm:p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group shadow-sm dark:shadow-xl ${
        isActive
          ? `${scheme.border} ${scheme.activeBg} ring-2 ring-offset-0 ring-offset-transparent ring-blue-500/30`
          : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div
        className={`absolute -right-6 -top-6 w-36 h-36 ${scheme.glow} rounded-full blur-3xl pointer-events-none transition-all duration-500`}
      />

      <div className="flex justify-between items-start relative z-10 gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-bold uppercase tracking-wider mb-1 truncate">
            {title}
          </h3>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            {value !== undefined && value !== null ? value : '—'}
          </h2>
          {sub && (
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">
              {sub}
            </p>
          )}
        </div>

        {icon && (
          <div
            className={`p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl ${scheme.bg} ${scheme.text} shrink-0 shadow-inner flex items-center justify-center`}
          >
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
