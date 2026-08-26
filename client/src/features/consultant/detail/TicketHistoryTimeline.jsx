import React from 'react';
import { Clock, Send, UserCheck, Bot, ArrowRight, User, Calendar, MessageSquare } from 'lucide-react';
import { formatDateTime, formatRelativeTime } from '../../../utils/formatters';

export default function TicketHistoryTimeline({ assignmentHistory = [] }) {
  const safeHistory = Array.isArray(assignmentHistory) ? assignmentHistory : [];

  // Sort timeline chronologically (latest event first)
  const sortedHistory = [...safeHistory].sort((a, b) => {
    return new Date(b.actionDate || 0) - new Date(a.actionDate || 0);
  });

  const latestForward = sortedHistory.find((h) => h.action === 'forward');

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">
              Assignment & Routing History
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Detailed chronology of ticket assignments and forwarding
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300">
          {safeHistory.length} {safeHistory.length === 1 ? 'Event' : 'Events'}
        </span>
      </div>

      {/* Latest Forward Highlight Banner */}
      {latestForward && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
              <Send size={18} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">
                Forwarded to{' '}
                <span className="text-amber-600 dark:text-amber-400 font-black">
                  {latestForward.forwardedTo?.name || 'Consultant'}
                </span>
                {latestForward.forwardedBy?.name && (
                  <span className="text-slate-500 font-medium">
                    {' '}by {latestForward.forwardedBy.name}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar size={12} />
                <span>
                  {latestForward.actionDate ? formatDateTime(latestForward.actionDate) : 'Recently'}
                </span>
                {latestForward.actionDate && (
                  <span className="text-amber-500 font-bold">
                    ({formatRelativeTime(latestForward.actionDate)})
                  </span>
                )}
              </p>
            </div>
          </div>

          {latestForward.remarks && (
            <div className="sm:max-w-xs text-[11px] bg-white dark:bg-black/30 p-2 rounded-xl border border-amber-500/20 text-slate-600 dark:text-slate-300 italic truncate">
              "{latestForward.remarks}"
            </div>
          )}
        </div>
      )}

      {/* Chronological Timeline */}
      <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 sm:p-8 shadow-inner">
        {sortedHistory.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-slate-400 font-medium italic">
            No assignment or forwarding history logged.
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-200 dark:border-white/10 pl-6 sm:pl-8 ml-3 sm:ml-4 space-y-8">
            {sortedHistory.map((item, index) => {
              const isInitial = item.action === 'initial_assignment';
              const isAssign = item.action === 'assign';
              const isForward = item.action === 'forward';

              const actor = isForward
                ? item.forwardedBy
                : isAssign
                ? item.assignedBy
                : null;
              const target = isForward
                ? item.forwardedTo
                : item.assignedTo;

              return (
                <div key={item._id || index} className="relative group">
                  {/* Timeline Node Icon Indicator */}
                  <div
                    className={`absolute -left-[35px] sm:-left-[43px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${
                      isForward
                        ? 'bg-amber-500 border-white dark:border-[#0b0f19] text-white'
                        : isAssign
                        ? 'bg-purple-600 border-white dark:border-[#0b0f19] text-white'
                        : 'bg-blue-600 border-white dark:border-[#0b0f19] text-white'
                    }`}
                  >
                    {isForward ? (
                      <Send size={11} />
                    ) : isAssign ? (
                      <UserCheck size={11} />
                    ) : (
                      <Bot size={11} />
                    )}
                  </div>

                  <div className="bg-white dark:bg-[#111620]/90 border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
                    {/* Event Header: Action badge & Prominent Date + Time */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                            isForward
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : isAssign
                              ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          }`}
                        >
                          {isForward ? (
                            <>
                              <Send size={10} /> Ticket Forwarded
                            </>
                          ) : isAssign ? (
                            <>
                              <UserCheck size={10} /> Assigned by Admin
                            </>
                          ) : (
                            <>
                              <Bot size={10} /> Initial Auto-Assign
                            </>
                          )}
                        </span>
                      </div>

                      {/* Prominent Date & Time */}
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Calendar size={13} className="text-blue-500" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                          {item.actionDate
                            ? formatDateTime(item.actionDate)
                            : 'Unknown Date & Time'}
                        </span>
                        {item.actionDate && (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                            {formatRelativeTime(item.actionDate)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Routing Participants */}
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {actor && (
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                          <User size={13} className="text-slate-400" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">
                              From
                            </span>
                            <span className="font-bold text-slate-800 dark:text-white">
                              {actor?.name || 'Staff'}
                            </span>
                            {actor?.role && (
                              <span className="text-[9px] text-slate-400 ml-1">
                                ({actor.role})
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {actor && target && (
                        <ArrowRight size={16} className="text-slate-400 shrink-0" />
                      )}

                      {target && (
                        <div className="flex items-center gap-1.5 p-2 rounded-xl bg-blue-50/50 dark:bg-blue-500/[0.04] border border-blue-500/10">
                          <UserCheck size={13} className="text-blue-500" />
                          <div>
                            <span className="text-[10px] uppercase font-bold text-blue-500 block">
                              {isForward ? 'Forwarded To' : 'Assigned To'}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {target?.name || 'Consultant'}
                            </span>
                            {target?.email && (
                              <span className="text-[10px] text-slate-400 block font-normal">
                                {target.email}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Remarks / Directives */}
                    {item.remarks && (
                      <div className="p-3 bg-amber-500/[0.04] dark:bg-amber-500/[0.06] border border-amber-500/20 rounded-xl space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-wider">
                          <MessageSquare size={11} /> Transfer Remarks / Instructions
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-200 font-medium leading-relaxed italic">
                          "{item.remarks}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
