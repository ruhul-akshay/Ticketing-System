import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Clock, CheckCircle, Building2, User,
  Briefcase, TrendingUp, AlertCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import api from '../../core/api/mockAxios';
import { useTicketStore } from '../../core/store/useTicketStore';
import { useAuthStore } from '../../core/store/useAuthStore';

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

/* -----------------------------------------------
   Compute stats purely from the local ticket store.
   This is always available and doesn't need a new
   backend endpoint — used as the primary data source.
----------------------------------------------- */
function useLocalStats(adminId) {
  const { tickets } = useTicketStore();
  const { user } = useAuthStore();

  return useMemo(() => {
    const currentUserId = user?._id || user?.id;
    const dept = user?.department;

    const open = tickets.filter(t => t.status === 'Open').length;
    const resolved = tickets.filter(t => t.status === 'Resolved').length;
    const total = tickets.length;

    // Total work hours this admin has logged across all tickets
    let totalWorkHours = 0;
    const workByDate = {}; // date string → hours
    const workByCompany = {}; // companyName → hours

    tickets.forEach(ticket => {
      (ticket.workLogs || []).forEach(log => {
        // addedBy may be an objectId or a string; check by userId
        const logBy = log.addedBy?._id || log.addedBy;
        const matchesAdmin = !currentUserId || String(logBy) === String(currentUserId);

        if (matchesAdmin) {
          const hrs = Number(log.hours) || 0;
          totalWorkHours += hrs;

          // Group by date for chart
          if (log.date) {
            const dateKey = new Date(log.date).toISOString().slice(0, 10);
            workByDate[dateKey] = (workByDate[dateKey] || 0) + hrs;
          }

          // Group by company
          const company = ticket.companyName || ticket.original?.createdBy?.companyName || 'Unknown';
          workByCompany[company] = (workByCompany[company] || 0) + hrs;
        }
      });
    });

    // Company ticket breakdown
    const companyTickets = {};
    tickets.forEach(ticket => {
      const company = ticket.companyName || ticket.original?.createdBy?.companyName || 'Unknown';
      if (!companyTickets[company]) companyTickets[company] = { total: 0, resolved: 0, open: 0 };
      companyTickets[company].total++;
      if (ticket.status === 'Resolved') companyTickets[company].resolved++;
      if (ticket.status === 'Open') companyTickets[company].open++;
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

    const companyBreakdown = Object.entries(companyTickets)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10)
      .map(([company, data]) => ({ company, ...data }));

    const companyWorkHours = Object.entries(workByCompany)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([company, hours]) => ({
        company,
        hours: +hours.toFixed(1),
        ticketCount: companyTickets[company]?.total || 0
      }));

    return {
      admin: {
        name: user?.name || 'Admin',
        email: user?.email || '',
        employeeCode: user?.employeeCode || '',
        expertise: [],
      },
      department: dept
        ? { name: dept?.name || dept, description: '', categories: [] }
        : null,
      tickets: { total, open, resolved, solvedByAdmin: 0 },
      workHours: {
        total: +totalWorkHours.toFixed(1),
        avgResolutionHours: 0,
        byDate: workLogByDate,
      },
      companyBreakdown,
      companyWorkHours,
    };
  }, [tickets, user, adminId]);
}

export default function AdminDashboard({ adminId = null }) {
  const localStats = useLocalStats(adminId);
  const [apiStats, setApiStats] = useState(null);
  const [apiLoading, setApiLoading] = useState(true);

  // Try to load enriched data from the new backend endpoint.
  // If it fails (e.g. server not yet restarted), we silently fall back to local stats.
  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      setApiLoading(true);
      try {
        const endpoint = adminId ? `/admin-stats/${adminId}` : '/admin-stats/me';
        const res = await api.get(endpoint);
        if (!cancelled) setApiStats(res.data.data);
      } catch {
        // Silently ignore — local stats will be used
        if (!cancelled) setApiStats(null);
      } finally {
        if (!cancelled) setApiLoading(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, [adminId]);

  // Use API data if available, otherwise local store data
  const stats = apiStats || localStats;
  const { admin, department, tickets, workHours, companyBreakdown, companyWorkHours } = stats;

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          {adminId ? `${admin.name}'s Dashboard` : 'My Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
          Real-time performance overview and ticket analytics.
          {apiLoading && (
            <span className="inline-flex items-center gap-1 text-blue-400/70">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> Syncing live data...
            </span>
          )}
        </p>
      </motion.div>

      {/* Admin Profile Info Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05 }}
        className="glass-card rounded-[1.5rem] sm:rounded-2xl border border-white/5 p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center"
      >
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/30 shrink-0">
            {admin.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1 sm:flex-none">
            <p className="text-white font-bold text-lg leading-tight truncate">{admin.name}</p>
            <p className="text-slate-400 text-sm truncate">{admin.email}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto">
          {department && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] sm:text-xs font-bold whitespace-nowrap">
              <Building2 size={13} /> {department.name}
            </span>
          )}
          {admin.employeeCode && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-[10px] sm:text-xs font-bold whitespace-nowrap">
              <User size={13} /> {admin.employeeCode}
            </span>
          )}
          {admin.expertise?.length > 0 && admin.expertise.slice(0, 3).map(e => (
            <span key={e} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] sm:text-xs font-medium whitespace-nowrap">
              {e}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Tickets"
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
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" axisLine={false} tickLine={false} dy={8} tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  formatter={(v) => [`${v} hrs`, 'Hours']}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Company Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Ticket Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6 rounded-2xl border border-white/5"
        >
          <h3 className="text-lg font-bold text-white mb-1">Company-wise Tickets</h3>
          <p className="text-xs text-slate-500 mb-5">Tickets raised by each company</p>
          {companyBreakdown.length === 0 ? (
            <div className="text-slate-500 text-sm italic text-center py-8">No ticket data available.</div>
          ) : (
            <div className="space-y-3">
              {companyBreakdown.map((item, i) => {
                const pct = item.total > 0 ? Math.round((item.resolved / item.total) * 100) : 0;
                return (
                  <div key={i} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Briefcase size={13} className="text-blue-400" />
                        <span className="text-white text-sm font-semibold truncate max-w-[160px]">{item.company}</span>
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

        {/* Company Work Hours Pie */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card p-6 rounded-2xl border border-white/5"
        >
          <h3 className="text-lg font-bold text-white mb-1">Work Hours by Company</h3>
          <p className="text-xs text-slate-500 mb-5">Distribution of logged hours per company</p>
          {companyWorkHours.length === 0 ? (
            <div className="text-slate-500 text-sm italic text-center py-8">No work hours logged yet.</div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={companyWorkHours}
                    dataKey="hours"
                    nameKey="company"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {companyWorkHours.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    formatter={(v, name) => [`${v} hrs`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
