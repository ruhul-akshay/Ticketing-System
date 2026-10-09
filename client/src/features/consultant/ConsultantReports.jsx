import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, Search, RefreshCw, Calendar, Clock,
  Building2, CheckCircle2, AlertCircle, AlertTriangle, ChevronRight,
  TrendingUp, BarChart2, PieChart as PieIcon, ArrowUpRight,
  Layers, Filter, Eye, Users, Shield, Briefcase
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import api from '../../api/mockAxios';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import TicketStatusBadge from '../../components/ui/TicketStatusBadge';
import TicketViewerModal from '../../components/ui/TicketViewerModal';

const PRIORITY_COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#3b82f6'
};

const CHART_PALETTE = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1', '#14b8a6'];

const formatMinutesToHours = (minutes) => {
  if (!minutes || minutes <= 0) return '—';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  return `${mins}m`;
};

export default function ConsultantReports() {
  const { user } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  // Active Report Tab: 'ticket-summary' | 'customer-wise' | 'timesheet-details' | 'timesheet-summary'
  const [activeTab, setActiveTab] = useState('ticket-summary');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Date Filter State
  const [timeframe, setTimeframe] = useState('all'); // 'all' | 'today' | 'yesterday' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom-range'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Dropdown Filter States
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedConsultant, setSelectedConsultant] = useState('all'); // For superadmin

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Drilldown / Modal States
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  // Raw API Response Data
  const [reportsData, setReportsData] = useState({
    ticketSummary: {
      totalTickets: 0,
      openTickets: 0,
      onHoldTickets: 0,
      resolvedTickets: 0,
      cancelledTickets: 0,
      resolutionRate: 0,
      avgResolutionMinutes: 0,
      totalWorkHours: 0,
      priorityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
      departmentBreakdown: [],
      timelineTrend: [],
      tickets: []
    },
    customerWiseReport: [],
    timesheetDetails: {
      summary: {
        totalHours: 0,
        totalEntries: 0,
        uniqueTicketsCount: 0,
        uniqueClientsCount: 0,
        totalCost: 0
      },
      entries: []
    },
    timesheetSummary: {
      kpi: {
        totalHours: 0,
        dailyAverage: 0,
        activeDaysCount: 0,
        topCustomer: 'None',
        mostProductiveDay: 'None'
      },
      byDate: [],
      byClient: [],
      byTicket: []
    },
    clients: [],
    departments: [],
    consultants: []
  });

  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'Super Admin' || user?.role === 'admin';

  // Compute startDate & endDate from timeframe
  const dateParams = useMemo(() => {
    const now = new Date();
    let start = null;
    let end = null;

    if (timeframe === 'today') {
      const s = new Date();
      s.setHours(0, 0, 0, 0);
      const e = new Date();
      e.setHours(23, 59, 59, 999);
      start = s.toISOString();
      end = e.toISOString();
    } else if (timeframe === 'yesterday') {
      const s = new Date();
      s.setDate(s.getDate() - 1);
      s.setHours(0, 0, 0, 0);
      const e = new Date(s);
      e.setHours(23, 59, 59, 999);
      start = s.toISOString();
      end = e.toISOString();
    } else if (timeframe === 'this-week') {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      start = monday.toISOString();
      end = now.toISOString();
    } else if (timeframe === 'last-week') {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1) - 7;
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      start = monday.toISOString();
      end = sunday.toISOString();
    } else if (timeframe === 'this-month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      s.setHours(0, 0, 0, 0);
      start = s.toISOString();
      end = now.toISOString();
    } else if (timeframe === 'last-month') {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      s.setHours(0, 0, 0, 0);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      e.setHours(23, 59, 59, 999);
      start = s.toISOString();
      end = e.toISOString();
    } else if (timeframe === 'custom-range') {
      if (customStartDate && customEndDate) {
        const s = new Date(customStartDate);
        s.setHours(0, 0, 0, 0);
        const e = new Date(customEndDate);
        e.setHours(23, 59, 59, 999);
        start = s.toISOString();
        end = e.toISOString();
      }
    }

    return { startDate: start, endDate: end };
  }, [timeframe, customStartDate, customEndDate]);

  // Fetch Report Data from backend
  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError('');

    const params = {};
    if (dateParams.startDate && dateParams.endDate) {
      params.startDate = dateParams.startDate;
      params.endDate = dateParams.endDate;
    }
    if (selectedClient && selectedClient !== 'all') {
      params.clientId = selectedClient;
    }
    if (selectedDepartment && selectedDepartment !== 'all') {
      params.departmentId = selectedDepartment;
    }
    if (selectedStatus && selectedStatus !== 'all') {
      params.status = selectedStatus;
    }
    if (isSuperAdmin && selectedConsultant && selectedConsultant !== 'all') {
      params.consultantId = selectedConsultant;
    }

    try {
      const res = await api.get('/consultant-stats/reports', { params });
      if (res.data && res.data.success) {
        setReportsData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load consultant reports:', err);
      setError(err.response?.data?.message || 'Failed to compile consultant reports. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [dateParams, selectedClient, selectedDepartment, selectedStatus, selectedConsultant, isSuperAdmin]);

  useEffect(() => {
    if (timeframe === 'custom-range' && (!customStartDate || !customEndDate)) {
      return;
    }
    fetchReports();
  }, [fetchReports, timeframe, customStartDate, customEndDate]);

  // Download CSV with UTF-8 BOM for Microsoft Excel compatibility
  const downloadCSV = (filename, headers, rows) => {
    const BOM = '\uFEFF';
    const csvContent = [
      headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
      ...rows.map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export handlers for each report
  const handleExport = (reportType) => {
    const timestamp = new Date().toISOString().split('T')[0];

    if (reportType === 'ticket-summary') {
      const headers = [
        'SL', 'Ticket ID', 'Subject', 'Client', 'Department', 'Category',
        'Priority', 'Status', 'Assigned To', 'Hours Logged', 'Created Date', 'Create Time', 'Solved Date'
      ];
      const rows = (reportsData.ticketSummary?.tickets || []).map((t, idx) => [
        idx + 1,
        t.customId,
        t.title,
        t.clientName,
        t.departmentName,
        t.category || 'General',
        t.priority,
        t.status,
        t.assignedToName,
        t.workHours,
        t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—',
        t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) : '—',
        t.solvedAt ? new Date(t.solvedAt).toLocaleDateString() : '—'
      ]);
      downloadCSV(`Ticket_Summary_Report_${timestamp}.csv`, headers, rows);
    } else if (reportType === 'customer-wise') {
      const headers = [
        'Customer Company', 'Domain', 'Total Tickets', 'Open Tickets', 'On Hold Tickets',
        'Resolved Tickets', 'Cancelled Tickets', 'Resolution Rate (%)', 'Total Support Hours', 'Avg Resolution Time'
      ];
      const rows = (reportsData.customerWiseReport || []).map(c => [
        c.clientName,
        c.domain || 'N/A',
        c.totalTickets,
        c.openTickets,
        c.onHoldTickets,
        c.resolvedTickets,
        c.cancelledTickets,
        `${c.resolutionRate}%`,
        c.totalWorkHours,
        formatMinutesToHours(c.avgResolutionMinutes)
      ]);
      downloadCSV(`Customer_Wise_Ticket_Report_${timestamp}.csv`, headers, rows);
    } else if (reportType === 'timesheet-details') {
      const headers = [
        'Date', 'Ticket ID', 'Ticket Title', 'Customer Company', 'Department',
        'Category', 'Status', 'Priority', 'Hours Logged', 'Consultant', 'Hourly Rate (INR)', 'Total Cost (INR)'
      ];
      const rows = (reportsData.timesheetDetails?.entries || []).map(log => [
        log.date,
        log.customId,
        log.ticketTitle,
        log.clientName,
        log.departmentName,
        log.category,
        log.status,
        log.priority,
        log.hours,
        log.consultantName,
        log.hourlyCost,
        log.totalCost
      ]);
      downloadCSV(`Timesheet_Report_Details_${timestamp}.csv`, headers, rows);
    } else if (reportType === 'timesheet-summary') {
      const headers = [
        'Date', 'Day', 'Total Hours Logged', 'Tickets Worked', 'Customers Supported', 'Work Logs'
      ];
      const rows = (reportsData.timesheetSummary?.byDate || []).map(d => [
        d.date,
        d.dayOfWeek,
        d.totalHours,
        d.ticketsCount,
        d.clientsCount,
        d.entriesCount
      ]);
      downloadCSV(`Timesheet_Report_Summary_${timestamp}.csv`, headers, rows);
    }
  };

  // Search-filtered lists
  const filteredTickets = useMemo(() => {
    const list = reportsData.ticketSummary?.tickets || [];
    const q = searchTerm.toLowerCase().trim();
    if (!q) return list;
    return list.filter(t =>
      t.customId?.toLowerCase().includes(q) ||
      t.title?.toLowerCase().includes(q) ||
      t.clientName?.toLowerCase().includes(q) ||
      t.departmentName?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q)
    );
  }, [reportsData.ticketSummary?.tickets, searchTerm]);

  const filteredCustomerReport = useMemo(() => {
    const list = reportsData.customerWiseReport || [];
    const q = searchTerm.toLowerCase().trim();
    if (!q) return list;
    return list.filter(c =>
      c.clientName?.toLowerCase().includes(q) ||
      c.domain?.toLowerCase().includes(q)
    );
  }, [reportsData.customerWiseReport, searchTerm]);

  const filteredTimesheetEntries = useMemo(() => {
    const list = reportsData.timesheetDetails?.entries || [];
    const q = searchTerm.toLowerCase().trim();
    if (!q) return list;
    return list.filter(l =>
      l.customId?.toLowerCase().includes(q) ||
      l.ticketTitle?.toLowerCase().includes(q) ||
      l.clientName?.toLowerCase().includes(q) ||
      l.consultantName?.toLowerCase().includes(q) ||
      l.date?.toLowerCase().includes(q)
    );
  }, [reportsData.timesheetDetails?.entries, searchTerm]);

  // Priority Chart Data
  const priorityChartData = useMemo(() => {
    const p = reportsData.ticketSummary?.priorityBreakdown || {};
    return [
      { name: 'Critical', value: p.critical || 0, color: PRIORITY_COLORS.critical },
      { name: 'High', value: p.high || 0, color: PRIORITY_COLORS.high },
      { name: 'Medium', value: p.medium || 0, color: PRIORITY_COLORS.medium },
      { name: 'Low', value: p.low || 0, color: PRIORITY_COLORS.low }
    ].filter(i => i.value > 0);
  }, [reportsData.ticketSummary?.priorityBreakdown]);

  // Customer Hours Distribution Chart Data
  const customerHoursChartData = useMemo(() => {
    return (reportsData.timesheetSummary?.byClient || [])
      .slice(0, 8)
      .map((item, idx) => ({
        name: item.clientName,
        hours: item.totalHours,
        color: CHART_PALETTE[idx % CHART_PALETTE.length]
      }));
  }, [reportsData.timesheetSummary?.byClient]);

  return (
    <div className="w-full relative font-sans p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 min-h-screen">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/5 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
            <BarChart2 size={14} />
            <span>Consultant Intelligence & Metrics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            Consultant Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Analyze ticket distribution, customer engagement, itemized timesheets, and productivity summaries.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={fetchReports}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Report Data"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-blue-500' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => handleExport(activeTab)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export Report (Excel/CSV)</span>
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4 relative z-10">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Filter size={14} className="text-blue-500" />
            <span>Report Filters & Parameters</span>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {timeframe === 'all' ? 'All Time Historical Data' : `Timeframe: ${timeframe.replace('-', ' ')}`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Timeframe Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Timeframe Period
            </label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this-week">This Week</option>
              <option value="last-week">Last Week</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="custom-range">Custom Date Range...</option>
            </select>
          </div>

          {/* Client Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Client
            </label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Clients</option>
              {reportsData.clients?.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {reportsData.departments?.map(d => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>

          {/* Super Admin Consultant Filter or Status Filter */}
          {isSuperAdmin && reportsData.consultants?.length > 0 ? (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Target Consultant
              </label>
              <select
                value={selectedConsultant}
                onChange={(e) => setSelectedConsultant(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Consultants</option>
                {reportsData.consultants.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.employeeCode ? `(${c.employeeCode})` : ''}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Ticket Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open / In Progress</option>
                <option value="on hold">On Hold</option>
                <option value="resolved">Resolved</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
        </div>

        {/* Custom Date Range Row */}
        {timeframe === 'custom-range' && (
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-white focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Report Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => { setActiveTab('ticket-summary'); setSearchTerm(''); }}
          className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer shrink-0 ${
            activeTab === 'ticket-summary'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <FileText size={16} />
          <span>Ticket Summary Report</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            activeTab === 'ticket-summary' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
          }`}>
            {reportsData.ticketSummary?.totalTickets || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('customer-wise'); setSearchTerm(''); }}
          className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer shrink-0 ${
            activeTab === 'customer-wise'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <Building2 size={16} />
          <span>Customer Wise Ticket Report</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            activeTab === 'customer-wise' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
          }`}>
            {reportsData.customerWiseReport?.length || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('timesheet-details'); setSearchTerm(''); }}
          className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer shrink-0 ${
            activeTab === 'timesheet-details'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <Clock size={16} />
          <span>Timesheet Report Details</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            activeTab === 'timesheet-details' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
          }`}>
            {reportsData.timesheetDetails?.summary?.totalEntries || 0}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('timesheet-summary'); setSearchTerm(''); }}
          className={`flex items-center gap-2.5 px-4 sm:px-5 py-3 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer shrink-0 ${
            activeTab === 'timesheet-summary'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
        >
          <TrendingUp size={16} />
          <span>Timesheet Report Summary</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
            activeTab === 'timesheet-summary' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
          }`}>
            {reportsData.timesheetSummary?.kpi?.totalHours || 0}h
          </span>
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: TICKET SUMMARY REPORT */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'ticket-summary' && (
        <motion.div
          key="tab-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Total Tickets</span>
                <FileText size={18} className="text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
                {reportsData.ticketSummary?.totalTickets || 0}
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Assigned / Handled in period
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Resolved Tickets</span>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {reportsData.ticketSummary?.resolvedTickets || 0}
              </div>
              <p className="text-[11px] font-medium text-emerald-500/90 mt-1">
                {reportsData.ticketSummary?.resolutionRate || 0}% resolution rate
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Open / Pending</span>
                <Clock size={18} className="text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                {reportsData.ticketSummary?.openTickets || 0}
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                {reportsData.ticketSummary?.onHoldTickets || 0} on hold
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Total Work Hours</span>
                <Clock size={18} className="text-purple-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                {reportsData.ticketSummary?.totalWorkHours || 0} <span className="text-base font-bold">hrs</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Avg resolution: {formatMinutesToHours(reportsData.ticketSummary?.avgResolutionMinutes)}
              </p>
            </div>
          </div>

          {/* Visual Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Priority Distribution */}
            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <PieIcon size={14} className="text-blue-500" />
                Priority Distribution
              </h3>
              {priorityChartData.length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {priorityChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#181f2b' : '#ffffff',
                          borderColor: isDark ? '#ffffff10' : '#e2e8f0',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400 font-medium">
                  No priority data available
                </div>
              )}
            </div>

            {/* Department Breakdown */}
            <div className="lg:col-span-2 bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers size={14} className="text-indigo-500" />
                Department Ticket Distribution
              </h3>
              {(reportsData.ticketSummary?.departmentBreakdown || []).length > 0 ? (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportsData.ticketSummary.departmentBreakdown}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff08' : '#e2e8f0'} />
                      <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={11}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                      <RechartsTooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#181f2b' : '#ffffff',
                          borderColor: isDark ? '#ffffff10' : '#e2e8f0',
                          borderRadius: '12px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="count" name="Tickets" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400 font-medium">
                  No department breakdown available
                </div>
              )}
            </div>
          </div>

          {/* Detailed Itemized Tickets Table */}
          <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-wide">
                  Itemized Ticket Records ({filteredTickets.length})
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Complete list of assigned tickets with priority, client, category, and time spent
                </p>
              </div>

              {/* Local Search Input */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ticket, subject, client, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 font-black uppercase text-[10px] tracking-wider whitespace-nowrap">
                    <th className="py-3 px-4 w-12 text-center">SL</th>
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Work Hours</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4">Create Time</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((t, idx) => (
                      <tr key={t._id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-400 dark:text-slate-500 text-[11px] whitespace-nowrap">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {t.customId}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-white max-w-xs truncate" title={t.title}>
                          {t.title}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {t.clientName}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {t.departmentName}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 capitalize">
                            {t.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            t.priority?.toLowerCase() === 'critical' ? 'bg-red-500/10 text-red-500' :
                            t.priority?.toLowerCase() === 'high' ? 'bg-orange-500/10 text-orange-500' :
                            t.priority?.toLowerCase() === 'low' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <TicketStatusBadge status={t.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                          {t.workHours}h
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                          {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                          {t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setSelectedTicket(t)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-blue-500 cursor-pointer"
                            title="View Ticket"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400 font-medium">
                        No tickets matching the specified filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: CUSTOMER WISE TICKET REPORT */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'customer-wise' && (
        <motion.div
          key="tab-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Top Customer KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Customers Supported</span>
                <Building2 size={18} className="text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
                {reportsData.customerWiseReport?.length || 0}
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Active client accounts
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Top Customer by Tickets</span>
                <Briefcase size={18} className="text-indigo-500" />
              </div>
              <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 truncate">
                {reportsData.customerWiseReport?.[0]?.clientName || 'None'}
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                {reportsData.customerWiseReport?.[0]?.totalTickets || 0} tickets logged
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Top Customer by Hours</span>
                <Clock size={18} className="text-purple-500" />
              </div>
              <div className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400 truncate">
                {reportsData.timesheetSummary?.kpi?.topCustomer || 'None'}
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Highest support allocation
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Total Support Hours</span>
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {reportsData.ticketSummary?.totalWorkHours || 0} <span className="text-base font-bold">hrs</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Across all customers
              </p>
            </div>
          </div>

          {/* Customer Hours Distribution Chart */}
          {customerHoursChartData.length > 0 && (
            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart2 size={14} className="text-blue-500" />
                Support Hours by Customer (Top 8)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={customerHoursChartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff08' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={11} unit="h" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#181f2b' : '#ffffff',
                        borderColor: isDark ? '#ffffff10' : '#e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="hours" name="Support Hours" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                      {customerHoursChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Customer Table */}
          <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-wide">
                  Customer Wise Ticket Breakdown ({filteredCustomerReport.length})
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Detailed view of ticket volume, resolution rates, and support hours per customer
                </p>
              </div>

              {/* Local Search Input */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search customer name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Customer Company</th>
                    <th className="py-3 px-4 text-center">Total Tickets</th>
                    <th className="py-3 px-4 text-center">Open</th>
                    <th className="py-3 px-4 text-center">On Hold</th>
                    <th className="py-3 px-4 text-center">Resolved</th>
                    <th className="py-3 px-4">Resolution Rate</th>
                    <th className="py-3 px-4 text-center">Support Hours</th>
                    <th className="py-3 px-4">Avg Resolution</th>
                    <th className="py-3 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredCustomerReport.length > 0 ? (
                    filteredCustomerReport.map(c => {
                      const isExpanded = expandedCustomer === c.clientId;
                      return (
                        <React.Fragment key={c.clientId || c.clientName}>
                          <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white">
                              <div className="flex items-center gap-2">
                                <Building2 size={16} className="text-slate-400 shrink-0" />
                                <div>
                                  <p className="font-bold">{c.clientName}</p>
                                  {c.domain && (
                                    <p className="text-[10px] text-slate-400 font-normal">{c.domain}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-white">
                              {c.totalTickets}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-blue-600 dark:text-blue-400">
                              {c.openTickets}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-yellow-600 dark:text-yellow-400">
                              {c.onHoldTickets}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                              {c.resolvedTickets}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-emerald-500 h-full rounded-full transition-all"
                                    style={{ width: `${Math.min(100, c.resolutionRate)}%` }}
                                  />
                                </div>
                                <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                                  {c.resolutionRate}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-purple-600 dark:text-purple-400">
                              {c.totalWorkHours}h
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">
                              {formatMinutesToHours(c.avgResolutionMinutes)}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setExpandedCustomer(isExpanded ? null : c.clientId)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 font-bold text-[11px] cursor-pointer"
                              >
                                <span>{isExpanded ? 'Hide' : 'Tickets'}</span>
                                <ChevronRight size={12} className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Nested Tickets List for this Customer */}
                          {isExpanded && c.tickets && c.tickets.length > 0 && (
                            <tr>
                              <td colSpan={9} className="bg-slate-50/70 dark:bg-white/[0.01] p-4 border-b border-slate-200 dark:border-white/5">
                                <div className="space-y-2">
                                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                                    Tickets for {c.clientName} ({c.tickets.length})
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                    {c.tickets.map(item => (
                                      <div
                                        key={item._id}
                                        onClick={() => setSelectedTicket(item)}
                                        className="p-3 rounded-xl bg-white dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 hover:border-blue-500/50 cursor-pointer transition-all space-y-1.5"
                                      >
                                        <div className="flex items-center justify-between">
                                          <span className="font-mono text-[11px] font-bold text-blue-500">
                                            {item.customId}
                                          </span>
                                          <TicketStatusBadge status={item.status} size="xs" />
                                        </div>
                                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                          {item.title}
                                        </p>
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-white/5">
                                          <span>Logged: <strong className="text-purple-400">{item.workHours}h</strong></span>
                                          <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                        No customer data available for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: TIMESHEET REPORT DETAILS */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'timesheet-details' && (
        <motion.div
          key="tab-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Top Timesheet KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Total Logged Time</span>
                <Clock size={18} className="text-purple-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                {reportsData.timesheetDetails?.summary?.totalHours || 0} <span className="text-base font-bold">hrs</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Sum of itemized work entries
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Work Log Entries</span>
                <FileText size={18} className="text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white">
                {reportsData.timesheetDetails?.summary?.totalEntries || 0}
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Total itemized records
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Tickets Worked On</span>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {reportsData.timesheetDetails?.summary?.uniqueTicketsCount || 0}
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Unique ticket instances
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Customers Supported</span>
                <Building2 size={18} className="text-indigo-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">
                {reportsData.timesheetDetails?.summary?.uniqueClientsCount || 0}
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Distinct customer companies
              </p>
            </div>
          </div>

          {/* Timesheet Details Table */}
          <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-wide">
                  Itemized Work Log History ({filteredTimesheetEntries.length})
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Detailed individual entries with date, hours logged, ticket number, customer, and consultant
                </p>
              </div>

              {/* Local Search Input */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search date, ticket ID, title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] text-slate-400 font-black uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Log Date</th>
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Ticket Title</th>
                    <th className="py-3 px-4">Customer Company</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Hours Logged</th>
                    <th className="py-3 px-4">Consultant</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredTimesheetEntries.length > 0 ? (
                    filteredTimesheetEntries.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                          {log.date}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {log.customId}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white max-w-xs truncate">
                          {log.ticketTitle}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300">
                          {log.clientName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {log.departmentName}
                        </td>
                        <td className="py-3.5 px-4">
                          <TicketStatusBadge status={log.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-black text-xs">
                            {log.hours} hrs
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                          {log.consultantName}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTicket({ _id: log.ticketId, customId: log.customId, title: log.ticketTitle })}
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-blue-500 cursor-pointer"
                            title="View Ticket"
                          >
                            <Eye size={15} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 font-medium">
                        No work log entries found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: TIMESHEET REPORT SUMMARY */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'timesheet-summary' && (
        <motion.div
          key="tab-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Top Timesheet KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Total Support Hours</span>
                <Clock size={18} className="text-purple-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                {reportsData.timesheetSummary?.kpi?.totalHours || 0} <span className="text-base font-bold">hrs</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Across all activity in period
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Daily Average</span>
                <BarChart2 size={18} className="text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                {reportsData.timesheetSummary?.kpi?.dailyAverage || 0} <span className="text-base font-bold">hrs/day</span>
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Active working days: {reportsData.timesheetSummary?.kpi?.activeDaysCount || 0}
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Top Customer by Time</span>
                <Building2 size={18} className="text-indigo-500" />
              </div>
              <div className="text-lg sm:text-xl font-black text-indigo-600 dark:text-indigo-400 truncate">
                {reportsData.timesheetSummary?.kpi?.topCustomer || 'None'}
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Highest share of support hours
              </p>
            </div>

            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider">Peak Productive Day</span>
                <Calendar size={18} className="text-emerald-500" />
              </div>
              <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">
                {reportsData.timesheetSummary?.kpi?.mostProductiveDay || 'None'}
              </div>
              <p className="text-[11px] font-medium text-slate-400 mt-1">
                Most hours logged in single date
              </p>
            </div>
          </div>

          {/* Daily Work Hours Trend Chart */}
          {(reportsData.timesheetSummary?.byDate || []).length > 0 && (
            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 p-5 rounded-2xl shadow-sm">
              <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <TrendingUp size={14} className="text-purple-500" />
                Daily Support Hours Timeline
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportsData.timesheetSummary.byDate} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <defs>
                      <linearGradient id="hoursGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#ffffff08' : '#e2e8f0'} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} interval={0} angle={-15} textAnchor="end" />
                    <YAxis stroke="#94a3b8" fontSize={11} unit="h" />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#181f2b' : '#ffffff',
                        borderColor: isDark ? '#ffffff10' : '#e2e8f0',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}
                    />
                    <Area type="monotone" dataKey="totalHours" name="Hours Logged" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#hoursGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 2 Summary Tables Side-by-Side: Daily & Customer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Aggregated Summary */}
            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-white/5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                  <Calendar size={14} className="text-blue-500" />
                  Daily Timesheet Summary
                </h4>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-[#111620] border-b border-slate-200 dark:border-white/5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Day</th>
                      <th className="py-2.5 px-4 text-center">Tickets</th>
                      <th className="py-2.5 px-4 text-center">Clients</th>
                      <th className="py-2.5 px-4 text-right">Hours Logged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {(reportsData.timesheetSummary?.byDate || []).length > 0 ? (
                      reportsData.timesheetSummary.byDate.map(d => (
                        <tr key={d.date} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-800 dark:text-white">
                            {d.date}
                          </td>
                          <td className="py-2.5 px-4 text-slate-400">
                            {d.dayOfWeek}
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-blue-500">
                            {d.ticketsCount}
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-indigo-500">
                            {d.clientsCount}
                          </td>
                          <td className="py-2.5 px-4 text-right font-black text-purple-600 dark:text-purple-400">
                            {d.totalHours} hrs
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 font-medium">
                          No daily entries in this range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Timesheet Summary */}
            <div className="bg-white/80 dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-white/5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                  <Building2 size={14} className="text-indigo-500" />
                  Customer Timesheet Summary
                </h4>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-[#111620] border-b border-slate-200 dark:border-white/5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="py-2.5 px-4">Customer Company</th>
                      <th className="py-2.5 px-4 text-center">Tickets</th>
                      <th className="py-2.5 px-4 text-center">Share %</th>
                      <th className="py-2.5 px-4 text-right">Hours Logged</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {(reportsData.timesheetSummary?.byClient || []).length > 0 ? (
                      reportsData.timesheetSummary.byClient.map(c => (
                        <tr key={c.clientId || c.clientName} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-white truncate max-w-xs">
                            {c.clientName}
                          </td>
                          <td className="py-2.5 px-4 text-center font-bold text-blue-500">
                            {c.ticketsCount}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                              {c.percentage}%
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-right font-black text-purple-600 dark:text-purple-400">
                            {c.totalHours} hrs
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                          No customer summary data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Ticket Viewer Modal */}
      {selectedTicket && (
        <TicketViewerModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={fetchReports}
        />
      )}
    </div>
  );
}
