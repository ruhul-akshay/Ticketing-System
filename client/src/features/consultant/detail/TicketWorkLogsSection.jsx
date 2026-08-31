import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Plus, Trash2, User, Clock, Calendar, CheckCircle2, Pencil, Check, X } from 'lucide-react';
import { formatHoursToHM, formatDateOnly } from '../../../utils/formatters';

// Helper to resolve consultant details from work log entry
export function resolveConsultantInfo(logAddedBy, ticket, consultants = [], currentUser = null) {
  // 1. If addedBy is an object with a valid human name
  if (logAddedBy && typeof logAddedBy === 'object' && logAddedBy.name && logAddedBy.name !== 'Staff') {
    return {
      id: logAddedBy._id || logAddedBy.id || logAddedBy.name,
      name: logAddedBy.name,
      email: logAddedBy.email || '',
      role: logAddedBy.role || 'Consultant'
    };
  }

  // 2. Extract potential ID string
  const idStr =
    typeof logAddedBy === 'object'
      ? String(logAddedBy?._id || logAddedBy?.id || '')
      : String(logAddedBy || '');

  // 3. Search in consultants list
  if (idStr && idStr.length > 5 && Array.isArray(consultants) && consultants.length > 0) {
    const matched = consultants.find((c) => String(c._id || c.id) === idStr);
    if (matched && matched.name) {
      return {
        id: matched._id || matched.id,
        name: matched.name,
        email: matched.email || '',
        role: matched.role || 'Consultant'
      };
    }
  }

  // 4. Check against currentUser
  if (
    currentUser &&
    (String(currentUser._id || currentUser.id) === idStr || (!idStr && currentUser.name))
  ) {
    return {
      id: currentUser._id || currentUser.id,
      name: currentUser.name,
      email: currentUser.email || '',
      role: currentUser.role || 'Consultant'
    };
  }

  // 5. Check against ticket assignedTo object
  if (ticket?.assignedTo && typeof ticket.assignedTo === 'object' && ticket.assignedTo.name) {
    return {
      id: ticket.assignedTo._id || ticket.assignedTo.id || 'assigned',
      name: ticket.assignedTo.name,
      email: ticket.assignedTo.email || '',
      role: ticket.assignedTo.role || 'Consultant'
    };
  }

  // 6. Check against ticket assignee string (e.g. "Alan Turing")
  if (
    ticket?.assignee &&
    ticket.assignee !== 'Unassigned' &&
    ticket.assignee !== 'Unassigned Support'
  ) {
    return {
      id: idStr || 'assignee',
      name: ticket.assignee,
      email: '',
      role: 'Consultant'
    };
  }

  // 7. Fallback to ticket creator or consultant
  return {
    id: idStr || 'consultant',
    name: ticket?.original?.assignedTo?.name || currentUser?.name || 'Assigned Consultant',
    email: '',
    role: 'Consultant'
  };
}

export default function TicketWorkLogsSection({
  ticket,
  consultants = [],
  currentUser = null,
  workLogEntries = [],
  onAddRow,
  onRemoveRow,
  onUpdateRow,
  onSaveWorkLogsOnly,
  isSaving = false,
  onUpdateExistingWorkLog,
  onDeleteExistingWorkLog
}) {
  const isResolved = ticket?.status === 'Resolved';
  const existingWorkLogs = ticket?.workLogs || ticket?.original?.workLogs || [];

  const [editingLogId, setEditingLogId] = useState(null);
  const [editDate, setEditDate] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editMinutes, setEditMinutes] = useState('');

  const handleStartEdit = (log, logKey) => {
    setEditingLogId(logKey);
    const dStr = log.date ? new Date(log.date).toISOString().slice(0, 10) : '';
    setEditDate(dStr);
    const totalMins = Math.round((log.hours || 0) * 60);
    setEditHours(Math.floor(totalMins / 60).toString());
    setEditMinutes((totalMins % 60).toString());
  };

  const handleSaveEdit = async (logKey) => {
    if (!onUpdateExistingWorkLog) return;
    const totalHours = Number(editHours || 0) + (Number(editMinutes || 0) / 60);
    if (totalHours < 0) {
      alert('Hours cannot be negative.');
      return;
    }
    await onUpdateExistingWorkLog(logKey, { date: editDate, hours: totalHours });
    setEditingLogId(null);
  };

  // Group logged work hours by consultant
  const memberEfforts = useMemo(() => {
    const map = {};
    existingWorkLogs.forEach((log) => {
      const info = resolveConsultantInfo(log.addedBy, ticket, consultants, currentUser);
      const groupKey = info.name || info.id;

      if (!map[groupKey]) {
        map[groupKey] = {
          id: info.id,
          name: info.name,
          email: info.email,
          role: info.role,
          totalHours: 0,
          entriesCount: 0
        };
      }
      map[groupKey].totalHours += Number(log.hours || 0);
      map[groupKey].entriesCount += 1;
    });
    return Object.values(map);
  }, [existingWorkLogs, ticket, consultants, currentUser]);

  const totalLoggedHours = existingWorkLogs.reduce((sum, l) => sum + Number(l.hours || 0), 0);

  const validEntries = workLogEntries.filter(
    (r) => r.date && (Number(r.hours) > 0 || Number(r.minutes) > 0)
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">
              Effort & Time Tracking
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Itemized breakdown of consultants and hours spent on this ticket
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black">
            {formatHoursToHM(totalLoggedHours)}
          </span>
        </div>
      </div>

      {/* Member Contribution Breakdown */}
      {memberEfforts.length > 0 && (
        <div className="bg-slate-50 dark:bg-[#111620]/90 border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <User size={12} /> Work Distribution by Consultant
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {memberEfforts.map((member) => {
              const pct =
                totalLoggedHours > 0
                  ? Math.round((member.totalHours / totalLoggedHours) * 100)
                  : 0;

              return (
                <div
                  key={member.id}
                  className="p-3 bg-white dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-xl space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                        {member.name[0]?.toUpperCase() || 'C'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate" title={member.name}>
                          {member.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate font-medium">
                          {member.role || 'Consultant'} {member.email && `• ${member.email}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatHoursToHM(member.totalHours)}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-bold">
                        {pct}% share
                      </span>
                    </div>
                  </div>

                  {/* Share Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Effort Log Entries */}
      {existingWorkLogs.length > 0 && (
        <div className="bg-slate-50 dark:bg-[#111620]/90 border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 sm:p-5 space-y-2.5 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <Clock size={12} /> Logged Work History ({existingWorkLogs.length} Entries)
          </h4>

          <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-1">
            {existingWorkLogs.map((log, lIdx) => {
              const consultant = resolveConsultantInfo(log.addedBy, ticket, consultants, currentUser);
              const logKey = log._id || log.id || lIdx;
              const isEditing = editingLogId === logKey;

              const logUserId = String(log.addedBy?._id || log.addedBy?.id || log.addedBy || '');
              const currentUserId = String(currentUser?._id || currentUser?.id || '');
              const isOwnLog =
                (currentUserId && logUserId && currentUserId === logUserId) ||
                (currentUser?.name && consultant.name === currentUser.name) ||
                currentUser?.role === 'superadmin' ||
                currentUser?.role === 'admin';

              if (isEditing) {
                return (
                  <div
                    key={logKey}
                    className="flex flex-wrap items-center gap-2 p-2.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs"
                  >
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-white"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        placeholder="Hrs"
                        value={editHours}
                        onChange={(e) => setEditHours(e.target.value)}
                        className="w-14 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-right text-slate-800 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">hrs</span>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        placeholder="Mins"
                        value={editMinutes}
                        onChange={(e) => setEditMinutes(e.target.value)}
                        className="w-14 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-xs font-bold text-right text-slate-800 dark:text-white"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">mins</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(logKey)}
                        className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all cursor-pointer"
                        title="Save changes"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingLogId(null)}
                        className="p-1.5 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={logKey}
                  className="flex items-center justify-between p-2.5 bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Calendar size={13} className="text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-200 shrink-0">
                      {formatDateOnly(log.date)}
                    </span>
                    <span className="text-slate-400 font-medium shrink-0">by</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 truncate" title={consultant.name}>
                      {consultant.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md text-[11px] tabular-nums">
                      {formatHoursToHM(log.hours)}
                    </span>
                    {isOwnLog && (
                      <div className="flex items-center gap-1 pl-1 border-l border-slate-200 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(log, logKey)}
                          className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 rounded transition-all cursor-pointer"
                          title="Edit your time entry"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete this work log entry of ${formatHoursToHM(log.hours)}?`)) {
                              onDeleteExistingWorkLog && onDeleteExistingWorkLog(logKey);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                          title="Delete your time entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Append New Effort Hours Form */}
      <div className="bg-slate-50 dark:bg-[#111620]/90 border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <Plus size={12} /> Record New Effort
          </h4>
          <button
            type="button"
            onClick={onAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider transition-all cursor-pointer"
          >
            <Plus size={11} strokeWidth={3} /> Add Row
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {workLogEntries.map((entry, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-wrap gap-2.5 items-center w-full bg-white dark:bg-black/20 p-2.5 sm:p-3 rounded-xl border border-slate-200/70 dark:border-white/5 shadow-xs"
              >
                {/* Date Input */}
                <div className="w-[130px] sm:w-[140px] shrink-0">
                  <input
                    type="date"
                    value={entry.date}
                    onChange={(e) => onUpdateRow(idx, 'date', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-lg px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner"
                  />
                </div>

                {/* Hours & Minutes Inputs */}
                <div className="flex-1 min-w-[130px] flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      placeholder="Hours"
                      value={entry.hours}
                      onChange={(e) => onUpdateRow(idx, 'hours', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-lg pl-2.5 pr-7 py-2 text-xs font-black focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner tabular-nums text-right placeholder:text-slate-400"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-bold uppercase pointer-events-none">
                      hrs
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="Mins"
                      value={entry.minutes}
                      onChange={(e) => onUpdateRow(idx, 'minutes', e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-lg pl-2.5 pr-7 py-2 text-xs font-black focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner tabular-nums text-right placeholder:text-slate-400"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-bold uppercase pointer-events-none">
                      mins
                    </span>
                  </div>
                </div>

                {/* Remove Row Button */}
                <button
                  type="button"
                  onClick={() => onRemoveRow(idx)}
                  disabled={workLogEntries.length === 1}
                  className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-0 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer shrink-0"
                  title="Remove Log Entry"
                >
                  <Trash2 size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Quick save button */}
        {validEntries.length > 0 && (
          <button
            type="button"
            onClick={onSaveWorkLogsOnly}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 size={14} /> {isSaving ? 'Saving Effort...' : 'Save Effort Hours'}
          </button>
        )}
      </div>
    </section>
  );
}
