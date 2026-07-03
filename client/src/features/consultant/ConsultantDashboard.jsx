import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Clock, CheckCircle, Building2, User,
  Briefcase, TrendingUp, AlertCircle, Download, Star, Paperclip
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../api/mockAxios';
import { useTicketStore } from '../../store/useTicketStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];

function StatCard({ title, value, sub, icon, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-${color}-500/20`} />
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
          <h2 className="text-3xl font-bold text-white">{value ?? '—'}</h2>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl bg-${color}-500/20 text-${color}-400`}>{icon}</div>
      </div>
    </motion.div>
  );
}

const NoticeBoard = ({ notifications, markAsRead, downloadAttachment }) => {
  const [expandedNotice, setExpandedNotice] = useState(null);

  const activeNotices = notifications.slice(0, 5); // display up to 5 latest notices

  if (activeNotices.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4 }}
      className="bg-gradient-to-r from-blue-900/10 via-indigo-950/10 to-slate-900/10 border border-blue-500/10 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6 relative z-10">
        <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          📢 System Notice Board
        </h2>
        <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
          {notifications.filter(n => !n.read).length} Unread
        </span>
      </div>

      <div className="space-y-4 relative z-10">
        {activeNotices.map((notice) => {
          const isExpanded = expandedNotice === notice._id;
          return (
            <motion.div
              key={notice._id}
              layout
              onClick={() => {
                if (!notice.read) markAsRead(notice._id);
                setExpandedNotice(isExpanded ? null : notice._id);
              }}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                notice.read
                  ? 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  : 'bg-blue-500/[0.03] border-blue-500/20 hover:border-blue-500/40 shadow-lg shadow-blue-500/5'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  {!notice.read && (
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-blue-500 text-white uppercase tracking-wider animate-pulse shadow-md shadow-blue-500/30">
                      New
                    </span>
                  )}
                  <h3 className={`text-[15px] font-bold ${notice.read ? 'text-slate-200' : 'text-white'} tracking-tight`}>
                    {notice.title}
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {new Date(notice.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <p className={`text-sm text-slate-400 mt-2 leading-relaxed font-medium ${isExpanded ? '' : 'line-clamp-2'}`}>
                {notice.message}
              </p>

              {notice.attachments && notice.attachments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                  {notice.attachments.map(att => (
                    <button
                      key={att._id}
                      onClick={() => downloadAttachment(notice._id, att._id, att.originalName)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#181f2b] hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 rounded-xl text-xs font-bold text-slate-300 hover:text-blue-400 transition-all shadow-inner"
                    >
                      <Paperclip size={13} className="shrink-0" />
                      <span className="truncate max-w-[150px]">{att.originalName}</span>
                      <span className="text-[10px] text-slate-500 font-semibold">({(att.size / 1024).toFixed(1)} KB)</span>
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
};

/* -----------------------------------------------
   Compute stats purely from the local ticket store.
   This is always available and doesn't need a new
   backend endpoint — used as the primary data source.
----------------------------------------------- */
function useLocalStats(consultantId) {
  const { tickets } = useTicketStore();
  const { user } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  return useMemo(() => {
    const currentUserId = user?._id || user?.id;
    const targetConsultantId = consultantId || currentUserId;
    const dept = user?.department;

    // Filter tickets assigned to this consultant
    const consultantTickets = tickets.filter(t => {
      const assignedId = t.assignedTo?._id || t.assignedTo;
      return assignedId && String(assignedId) === String(targetConsultantId);
    });

    const open = consultantTickets.filter(t => ['open', 'pending', 'assigned', 'hold', 'on hold'].includes(t.status?.toLowerCase())).length;
    const resolved = consultantTickets.filter(t => ['resolved', 'closed'].includes(t.status?.toLowerCase())).length;
    const total = consultantTickets.length;

    // Total work hours this consultant has logged across all tickets
    let totalWorkHours = 0;
    const workByDate = {}; // date string → hours
    const workByClient = {}; // clientName → hours

    tickets.forEach(ticket => {
      (ticket.workLogs || []).forEach(log => {
        // addedBy may be an objectId or a string; check by userId
        const logBy = log.addedBy?._id || log.addedBy;
        const matchesConsultant = String(logBy) === String(targetConsultantId);

        if (matchesConsultant) {
          const hrs = Number(log.hours) || 0;
          totalWorkHours += hrs;

          // Group by date for chart
          if (log.date) {
            const dateKey = new Date(log.date).toISOString().slice(0, 10);
            workByDate[dateKey] = (workByDate[dateKey] || 0) + hrs;
          }

          // Group by client
          const client = ticket.clientName || ticket.original?.createdBy?.clientName || 'Unknown';
          workByClient[client] = (workByClient[client] || 0) + hrs;
        }
      });
    });

    // Client ticket breakdown
    const clientTickets = {};
    consultantTickets.forEach(ticket => {
      const client = ticket.clientName || ticket.original?.createdBy?.clientName || 'Unknown';
      if (!clientTickets[client]) clientTickets[client] = { total: 0, resolved: 0, open: 0 };
      clientTickets[client].total++;
      if (['resolved', 'closed'].includes(ticket.status?.toLowerCase())) clientTickets[client].resolved++;
      if (['open', 'pending', 'assigned', 'hold', 'on hold'].includes(ticket.status?.toLowerCase())) clientTickets[client].open++;
    });

    // Work log by date — last 30 days sorted
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const workLogByDate = Object.entries(workByDate)
      .filter(([d]) => new Date(d) >= thirtyDaysAgo)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, hours]) => ({
        date: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        hours
      }));

    const clientBreakdown = Object.entries(clientTickets)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10)
      .map(([client, data]) => ({ client, ...data }));

    const clientWorkHours = Object.entries(workByClient)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([client, hours]) => ({
        client,
        hours: +hours.toFixed(1),
        ticketCount: clientTickets[client]?.total || 0
      }));

    // Reviews (Feedback)
    const reviewsList = [];
    consultantTickets.forEach(t => {
      if (t.feedback?.rating) {
        reviewsList.push({
          ticketNumber: t.ticketNumber,
          title: t.title,
          rating: t.feedback.rating,
          comment: t.feedback.comment || '',
          submittedAt: t.feedback.submittedAt,
          userName: t.createdBy?.name || t.original?.createdBy?.name || 'Client',
          clientName: t.clientName || t.original?.createdBy?.clientName || 'Unknown'
        });
      }
    });
    reviewsList.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));

    return {
      consultant: {
        name: user?.name || 'Consultant',
        email: user?.email || '',
        employeeCode: user?.employeeCode || '',
        expertise: [],
      },
      department: dept
        ? { name: dept?.name || dept, description: '', categories: [] }
        : null,
      tickets: { total, open, resolved, solvedByConsultant: resolved },
      workHours: {
        total: +totalWorkHours.toFixed(1),
        avgResolutionHours: 0,
        byDate: workLogByDate,
      },
      clientBreakdown,
      clientWorkHours,
      reviews: reviewsList
    };
  }, [tickets, user, consultantId]);
}

const getDateRange = (preset, custom) => {
  const now = new Date();
  let start = null;
  let end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case 'today':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      break;
    case 'last_7':
      start = new Date();
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'last_30':
      start = new Date();
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'custom':
      if (custom.startDate) {
        start = new Date(custom.startDate);
        start.setHours(0, 0, 0, 0);
      }
      if (custom.endDate) {
        end = new Date(custom.endDate);
        end.setHours(23, 59, 59, 999);
      }
      break;
    default:
      start = new Date();
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      break;
  }
  return { start, end };
};

export default function ConsultantDashboard({ consultantId = null }) {
  const localStats = useLocalStats(consultantId);
  const [apiStats, setApiStats] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  const [datePreset, setDatePreset] = useState('last_30');
  const [customRange, setCustomRange] = useState({ startDate: '', endDate: '' });

  const { notifications, fetchNotifications, markAsRead, downloadAttachment } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Try to load enriched data from the new backend endpoint.
  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      setApiLoading(true);
      try {
        const { start, end } = getDateRange(datePreset, customRange);
        let urlParams = [];
        if (start) urlParams.push(`startDate=${start.toISOString()}`);
        if (end) urlParams.push(`endDate=${end.toISOString()}`);
        const queryString = urlParams.length > 0 ? `?${urlParams.join('&')}` : '';

        const endpoint = consultantId ? `/consultant-stats/${consultantId}${queryString}` : `/consultant-stats/me${queryString}`;
        const res = await api.get(endpoint);
        if (!cancelled) setApiStats(res.data.data);
      } catch {
        if (!cancelled) setApiStats(null);
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    };
    if (datePreset !== 'custom' || (customRange.startDate && customRange.endDate)) {
      fetchStats();
    }
    return () => { cancelled = true; };
  }, [consultantId, datePreset, customRange.startDate, customRange.endDate]);

  // Use API data if available, otherwise local store data
  const stats = apiStats || localStats;
  const { consultant, department, tickets, workHours, clientBreakdown = [], clientWorkHours = [], reviews } = stats;

  const exportToExcel = () => {
    const { start, end } = getDateRange(datePreset, customRange);
    const dateRangeStr = start && end 
      ? `${start.toLocaleDateString()} to ${end.toLocaleDateString()}` 
      : 'All Time';

    let csvContent = '\uFEFF'; // Excel UTF-8 BOM
    const escapeCSV = (str) => {
      if (str === null || str === undefined) return '';
      const stringified = String(str);
      if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    const addRow = (arr) => {
      csvContent += arr.map(escapeCSV).join(',') + '\r\n';
    };

    addRow(['CONSULTANT PERFORMANCE REPORT']);
    addRow([`Generated on: ${new Date().toLocaleString()}`]);
    addRow([`Date Filter Range: ${dateRangeStr}`]);
    addRow([]);

    addRow(['1. PROFILE INFORMATION']);
    addRow(['Field', 'Value']);
    addRow(['Name', consultant.name || '—']);
    addRow(['Email', consultant.email || '—']);
    addRow(['Employee Code', consultant.employeeCode || '—']);
    addRow(['Department', department?.name || '—']);
    addRow(['Role/Title', consultant.role || 'Consultant']);
    addRow([]);

    addRow(['2. PERFORMANCE METRICS']);
    addRow(['Metric', 'Value']);
    addRow(['Total Assigned Tickets', tickets.total]);
    addRow(['Resolved Tickets', tickets.resolved]);
    addRow(['Open Tickets', tickets.open]);
    addRow(['Resolution Rate', `${tickets.total > 0 ? Math.round((tickets.resolved / tickets.total) * 100) : 0}%`]);
    addRow(['Total Logged Work Hours', `${workHours.total} hrs`]);
    addRow(['Average Resolution Time', `${workHours.avgResolutionHours || 0} hrs`]);
    addRow([]);

    addRow(['3. WORK DISTRIBUTION BY CLIENT']);
    addRow(['Client', 'Total Tickets', 'Resolved Tickets', 'Open Tickets', 'Resolution Rate']);
    clientBreakdown.forEach(item => {
      const pct = item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0;
      addRow([item.client, item.total, item.resolved, item.open, `${pct}%`]);
    });
    if (clientBreakdown.length === 0) addRow(['No ticket data available.']);
    addRow([]);

    addRow(['4. WORK HOURS BY CLIENT']);
    addRow(['Client', 'Hours Logged', 'Ticket Count']);
    clientWorkHours.forEach(item => {
      addRow([item.client, item.hours, item.ticketCount]);
    });
    if (clientWorkHours.length === 0) addRow(['No work hours logged yet.']);
    addRow([]);

    addRow(['5. CLIENT REVIEWS & FEEDBACK']);
    addRow(['Ticket Number', 'Title', 'Rating', 'Client', 'Comment', 'Date']);
    (reviews || []).forEach(r => {
      addRow([
        r.ticketNumber,
        r.title,
        r.rating,
        r.userName,
        r.comment,
        r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'
      ]);
    });
    if (!reviews || reviews.length === 0) addRow(['No reviews received.']);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Consultant_Report_${consultant.name?.replace(/\s+/g, '_') || 'Consultant'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadConsultantReport = () => {
    const reportText = `==================================================
CONSULTANT PERFORMANCE REPORT
==================================================
Generated on: ${new Date().toLocaleString()}

1. PROFILE INFORMATION
--------------------------------------------------
Name:          ${consultant.name || '—'}
` + (consultant.email ? `Email:         ${consultant.email}\n` : '') + `Employee Code: ${consultant.employeeCode || '—'}
Department:    ${department?.name || '—'}
Role/Title:    ${consultant.role || 'Consultant'}
Phone Number:  ${consultant.phone || '—'}
Expertise:     ${(consultant.expertise || []).join(', ') || '—'}

2. PERFORMANCE METRICS
--------------------------------------------------
Total Assigned Tickets: ${tickets.total}
Resolved Tickets:       ${tickets.resolved}
Open Tickets:           ${tickets.open}
Resolution Rate:        ${tickets.total > 0 ? Math.round((tickets.resolved / tickets.total) * 100) : 0}%
Total Logged Work Hours: ${workHours.total} hrs
Average Resolution Time: ${workHours.avgResolutionHours || '—'} hrs

3. WORK DISTRIBUTION BY CLIENT
--------------------------------------------------
${clientWorkHours.map(c => `- ${c.client}: ${c.hours} hrs (${c.ticketCount} tickets)`).join('\n') || 'No work hours logged yet.'}

4. CLIENT REVIEWS & FEEDBACK
--------------------------------------------------
${(reviews || []).map(r => `Ticket #${r.ticketNumber} - ${r.title}
Rating:     ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} (${r.rating}/5)
Client:     ${r.userName} (${r.clientName})
Comment:    "${r.comment || 'No comment provided.'}"
Date:       ${r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '—'}
--------------------------------------------------`).join('\n') || 'No client reviews received yet.'}
==================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Consultant_Report_${consultant.name?.replace(/\s+/g, '_') || 'Consultant'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {consultantId ? `${consultant.name}'s Dashboard` : 'My Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
            Real-time performance overview and ticket analytics.
            {apiLoading && (
              <span className="inline-flex items-center gap-1 text-blue-400/70">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> Syncing live data...
              </span>
            )}
          </p>
        </div>
      </motion.div>

      {/* Date Filter & Export Options Control Bar */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 whitespace-nowrap">
            Date Filter:
          </span>
          <select
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-white text-[13px] font-bold focus:outline-none focus:border-blue-500/40 cursor-pointer min-w-[160px]"
          >
            <option value="today">Today</option>
            <option value="last_7">Last 7 Days</option>
            <option value="last_30">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {datePreset === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customRange.startDate}
                onChange={(e) => setCustomRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="bg-black/35 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500/40 cursor-pointer"
              />
              <span className="text-slate-500 text-xs">to</span>
              <input
                type="date"
                value={customRange.endDate}
                onChange={(e) => setCustomRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="bg-black/35 border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-blue-500/40 cursor-pointer"
              />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportToExcel}
            className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
          >
            <Download size={13} /> Export to Excel
          </button>
          <button
            onClick={downloadConsultantReport}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
          >
            <Download size={13} /> Export Text Report
          </button>
        </div>
      </motion.div>

      {!consultantId && <NoticeBoard notifications={notifications} markAsRead={markAsRead} downloadAttachment={downloadAttachment} />}

      {/* Consultant Profile Info Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="glass-card rounded-[1.5rem] sm:rounded-2xl border border-white/5 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center"
      >
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/30 shrink-0">
            {consultant.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 sm:flex-none">
            <p className="text-white font-bold text-lg leading-tight truncate">{consultant.name}</p>
            <p className="text-slate-400 text-sm truncate">{consultant.email}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto">
          {department && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] sm:text-xs font-bold whitespace-nowrap">
              <Building2 size={13} /> {department.name}
            </span>
          )}
          {consultant.employeeCode && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[10px] sm:text-xs font-bold whitespace-nowrap">
              <User size={13} /> {consultant.employeeCode}
            </span>
          )}
          {consultant.expertise?.length > 0 && consultant.expertise.slice(0, 3).map(e => (
            <span key={e} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] sm:text-xs font-medium whitespace-nowrap">
              {e}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Assigned Tickets"
          value={tickets.total}
          sub={`${tickets.open} open · ${tickets.resolved} resolved`}
          icon={<ClipboardList size={22} />}
          color="blue"
          delay={0.1}
        />
        <StatCard
          title="Resolved"
          value={tickets.resolved}
          sub={`${tickets.total > 0 ? Math.round((tickets.resolved / tickets.total) * 100) : 0}% resolution rate`}
          icon={<CheckCircle size={22} />}
          color="green"
          delay={0.15}
        />
        <StatCard
          title="Total Work Hours"
          value={`${workHours.total} hrs`}
          sub="Across all logged sessions"
          icon={<Clock size={22} />}
          color="yellow"
          delay={0.2}
        />
        <StatCard
          title="Avg. Resolution Time"
          value={workHours.avgResolutionHours > 0 ? `${workHours.avgResolutionHours} hrs` : '—'}
          sub="Based on resolved tickets"
          icon={<TrendingUp size={22} />}
          color="purple"
          delay={0.25}
        />
      </div>

      {/* Department Info */}
      {department && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-2xl border border-white/5 p-6"
        >
          <h3 className="text-lg font-bold text-white mb-4">Department Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Department</p>
              <p className="text-white font-bold text-lg">{department.name}</p>
            </div>
            {department.description && (
              <div className="bg-white/5 rounded-xl p-4 md:col-span-2">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">Description</p>
                <p className="text-slate-300 text-sm leading-relaxed">{department.description}</p>
              </div>
            )}
            {department.categories?.length > 0 && (
              <div className="bg-white/5 rounded-xl p-4 md:col-span-3">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Categories Handled</p>
                <div className="flex flex-wrap gap-2">
                  {department.categories.map(cat => (
                    <span key={cat} className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-medium">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Work Hours Chart (last 30 days) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card p-6 rounded-2xl border border-white/5"
      >
        <h3 className="text-lg font-bold text-white mb-1">Work Hours — Last 30 Days</h3>
        <p className="text-xs text-slate-500 mb-5">Hours logged per day across all tickets</p>
        {workHours.byDate.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-slate-500 text-sm italic">
            No work logs recorded yet.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workHours.byDate} barSize={20} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff0d" : "rgba(0,0,0,0.06)"} vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" axisLine={false} tickLine={false} dy={8} tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{ 
                    backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255, 255, 255, 0.95)', 
                    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', 
                    borderRadius: '12px',
                    color: isDark ? '#fff' : '#0f172a'
                  }}
                  itemStyle={{ color: isDark ? '#fff' : '#0f172a' }}
                  cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}
                  formatter={(v) => [`${v} hrs`, 'Hours']}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Client Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Ticket Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-2xl border border-white/5"
        >
          <h3 className="text-lg font-bold text-white mb-1">Client-wise Tickets</h3>
          <p className="text-xs text-slate-500 mb-5">Tickets raised by each client</p>
          {clientBreakdown.length === 0 ? (
            <div className="text-slate-500 text-sm italic text-center py-8">No ticket data available.</div>
          ) : (
            <div className="space-y-3">
              {clientBreakdown.map((item, i) => {
                const pct = item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0;
                return (
                  <div key={i} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Briefcase size={13} className="text-blue-400" />
                        <span className="text-white text-sm font-semibold truncate max-w-[160px]">{item.client}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400">{item.total} tickets</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-1.5">
                      <span>{item.resolved} resolved</span>
                      <span>{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Client Work Hours Pie */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card p-6 rounded-2xl border border-white/5"
        >
          <h3 className="text-lg font-bold text-white mb-1">Work Hours by Client</h3>
          <p className="text-xs text-slate-500 mb-5">Distribution of logged hours per client</p>
          {clientWorkHours.length === 0 ? (
            <div className="text-slate-500 text-sm italic text-center py-8">No work hours logged yet.</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                     data={clientWorkHours}
                     dataKey="hours"
                     nameKey="client"
                     cx="50%"
                     cy="50%"
                     innerRadius={55}
                     outerRadius={90}
                     paddingAngle={3}
                  >
                    {clientWorkHours.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend formatter={(v) => <span style={{ color: isDark ? '#94a3b8' : '#475569', fontSize: 12 }}>{v}</span>} />
                  <RechartsTooltip
                    contentStyle={{ 
                      backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255, 255, 255, 0.95)', 
                      border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', 
                      borderRadius: '12px',
                      color: isDark ? '#fff' : '#0f172a'
                    }}
                    itemStyle={{ color: isDark ? '#fff' : '#0f172a' }}
                    formatter={(v, name) => [`${v} hrs`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* Reviews & Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 rounded-2xl border border-white/5"
      >
        <h3 className="text-lg font-bold text-white mb-1">Client Reviews & Feedback</h3>
        <p className="text-xs text-slate-500 mb-5">Ratings and comments left by users for solved tickets</p>
        {!reviews || reviews.length === 0 ? (
          <div className="text-slate-500 text-sm italic text-center py-8">
            No client reviews received yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.map((r, i) => (
              <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-bold text-red-400">Ticket #{r.ticketNumber}</span>
                      <h4 className="text-white text-sm font-bold truncate max-w-[200px] mt-0.5">{r.title}</h4>
                    </div>
                    <div className="flex gap-0.5 text-yellow-500">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          size={13}
                          fill={idx < r.rating ? "currentColor" : "none"}
                          className={idx < r.rating ? "text-yellow-500" : "text-slate-600"}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-300 text-xs italic mb-4 leading-relaxed">
                    "{r.comment || 'No comment provided.'}"
                  </p>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider border-t border-white/5 pt-2">
                  <span>{r.userName} ({r.clientName})</span>
                  {r.submittedAt && <span>{new Date(r.submittedAt).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
