import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Paperclip, Megaphone } from 'lucide-react';
import { formatDateOnly } from '../../utils/formatters';

export default function NoticeBoard({
  notifications = [],
  markAsRead,
  downloadAttachment,
  maxDisplay = 5,
  className = ''
}) {
  const [expandedNotice, setExpandedNotice] = useState(null);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const activeNotices = safeNotifications.slice(0, maxDisplay);

  if (activeNotices.length === 0) return null;

  const unreadCount = safeNotifications.filter((n) => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4 }}
      className={`bg-gradient-to-r from-blue-900/10 via-indigo-950/10 to-slate-900/10 border border-blue-500/10 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden ${className}`}
    >
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          <Megaphone className="text-blue-500" size={20} /> System Notice Board
        </h2>
        <span className="text-[11px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
          {unreadCount} Unread
        </span>
      </div>

      <div className="space-y-4 relative z-10">
        {activeNotices.map((notice) => {
          if (!notice) return null;
          const isExpanded = expandedNotice === notice._id;
          return (
            <motion.div
              key={notice._id || Math.random()}
              layout
              onClick={() => {
                if (!notice.read && typeof markAsRead === 'function') {
                  markAsRead(notice._id);
                }
                setExpandedNotice(isExpanded ? null : notice._id);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                notice.read
                  ? 'bg-white/40 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                  : 'bg-blue-500/[0.03] dark:bg-blue-500/[0.03] border-blue-500/20 hover:border-blue-500/40 shadow-lg shadow-blue-500/5'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {!notice.read && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-blue-500 text-white uppercase tracking-wider animate-pulse shadow-md shadow-blue-500/30">
                      New
                    </span>
                  )}
                  <h3
                    className={`text-[15px] font-bold ${
                      notice.read ? 'text-slate-700 dark:text-slate-200' : 'text-slate-900 dark:text-white'
                    } tracking-tight`}
                  >
                    {notice.title || 'Announcement'}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {formatDateOnly(notice.createdAt)}
                </span>
              </div>

              <p
                className={`text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed font-medium ${
                  isExpanded ? '' : 'line-clamp-2'
                }`}
              >
                {notice.message || ''}
              </p>

              {Array.isArray(notice.attachments) && notice.attachments.length > 0 && (
                <div
                  className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5 flex flex-wrap gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {notice.attachments.map((att) => (
                    <button
                      key={att._id || att.filename}
                      type="button"
                      onClick={() => {
                        if (typeof downloadAttachment === 'function') {
                          downloadAttachment(notice._id, att._id, att.originalName || att.filename);
                        }
                      }}
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-blue-50 dark:bg-[#181f2b] dark:hover:bg-blue-600/10 border border-slate-200 dark:border-white/5 hover:border-blue-500/30 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all shadow-inner cursor-pointer"
                    >
                      <Paperclip size={13} className="shrink-0 text-slate-500" />
                      <span className="truncate max-w-[150px]">{att.originalName || att.filename}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        ({((att.size || 0) / 1024).toFixed(1)} KB)
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
