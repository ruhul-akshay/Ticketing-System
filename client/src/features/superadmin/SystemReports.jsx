import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Download, Search, RefreshCw, ShieldAlert,
  X, Users, Building, ClipboardList, Clock, Briefcase, Award, Star, Settings, Calendar,
  BarChart2, PieChart as PieIcon, TrendingUp, CheckCircle, AlertTriangle
} from 'lucide-react';
import api from '../../api/mockAxios';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import Badge from '../../components/ui/Badge';
import ConsultantDashboard from '../consultant/ConsultantDashboard';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend 
} from 'recharts';

const PRIORITY_COLORS = {
  critical: '#ef4444', // Red
  high: '#f97316',     // Orange
  medium: '#eab308',   // Yellow
  low: '#3b82f6'       // Blue
};

const CHART_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#6366f1'];

const formatResolutionTime = (minutes) => {
  if (!minutes || minutes <= 0) return '—';
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0) {
    const hrStr = hrs === 1 ? 'hr' : 'hrs';
    const minStr = mins === 1 ? 'min' : 'mins';
    return `${hrs} ${hrStr} and ${mins} ${minStr}`;
  }
  const minStr = mins === 1 ? 'min' : 'mins';
  return `${mins} ${minStr}`;
};

export default function SystemReports() {
  const { user } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  const [activeTab, setActiveTab] = useState('consultant'); // 'consultant' | 'client' | 'overall'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Timeframe Picker States
  const [timeframe, setTimeframe] = useState('all'); // 'all' | 'weekly' | 'monday' | 'custom-day' | 'custom-range'
  const [customDay, setCustomDay] = useState(new Date().toISOString().split('T')[0]);
  const [customRangeStart, setCustomRangeStart] = useState('');
  const [customRangeEnd, setCustomRangeEnd] = useState('');

  // Data States
  const [consultantData, setConsultantData] = useState([]);
  const [clientData, setClientData] = useState([]);
  const [ticketOverviewStats, setTicketOverviewStats] = useState(null);
  const [ticketDetailedStats, setTicketDetailedStats] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConsultantId, setSelectedConsultantId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  const isSuperAdmin = user?.role === 'Super Admin' || user?.role === 'superadmin';

  // Compute startDate and endDate parameters based on selected timeframe
  const dateFilters = useMemo(() => {
    const now = new Date();
    let start = null;
    let end = null;

    if (timeframe === 'weekly') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      d.setHours(0, 0, 0, 0);
      start = d.toISOString();
      end = now.toISOString();
    } else if (timeframe === 'monday') {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      
      const endOfMonday = new Date(monday);
      endOfMonday.setHours(23, 59, 59, 999);
      
      start = monday.toISOString();
      end = endOfMonday.toISOString();
    } else if (timeframe === 'custom-day') {
      if (customDay) {
        const d = new Date(customDay);
        d.setHours(0, 0, 0, 0);
        const endOfDay = new Date(d);
        endOfDay.setHours(23, 59, 59, 999);
        
        start = d.toISOString();
        end = endOfDay.toISOString();
      }
    } else if (timeframe === 'custom-range') {
      if (customRangeStart && customRangeEnd) {
        const s = new Date(customRangeStart);
        s.setHours(0, 0, 0, 0);
        const e = new Date(customRangeEnd);
        e.setHours(23, 59, 59, 999);
        
        start = s.toISOString();
        end = e.toISOString();
      }
    }

    return { startDate: start, endDate: end };
  }, [timeframe, customDay, customRangeStart, customRangeEnd]);

  const getMostRecentMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    
    const params = {};
    if (dateFilters.startDate && dateFilters.endDate) {
      params.startDate = dateFilters.startDate;
      params.endDate = dateFilters.endDate;
    }

    try {
      // 1. Fetch stats summary for all consultants
      const consultantRes = await api.get('/consultant-stats', { params });
      setConsultantData(consultantRes.data?.data || []);

      // 2. Fetch all clients in the system
      const clientRes = await api.get('/clients', { params: { ...params, limit: 1000 } });
      setClientData(clientRes.data?.data || clientRes.data?.clients || []);

      // 3. Fetch dashboard ticket overview stats
      const ticketOverviewRes = await api.get('/dashboard/stats');
      setTicketOverviewStats(ticketOverviewRes.data?.overview || null);

      // 4. Fetch detailed tickets SLA & rating stats
      const ticketDetailedRes = await api.get('/tickets/dashboard/stats', { params });
      setTicketDetailedStats(ticketDetailedRes.data || null);
    } catch (err) {
      console.error('Failed to load system reports:', err);
      setError('An error occurred while compiling system-wide statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      if (timeframe === 'custom-range' && (!customRangeStart || !customRangeEnd)) {
        return;
      }
      fetchData();
    }
  }, [isSuperAdmin, dateFilters]);

  // Overall Report Metrics Compilation
  const overallData = useMemo(() => {
    const totalClients = clientData.length;
    const activeClients = clientData.filter(c => c.status === 'active').length;
    const suspendedClients = clientData.filter(c => c.status === 'suspended').length;
    const frozenClients = clientData.filter(c => c.status === 'frozen').length;
    const totalClientEmployees = clientData.reduce((acc, curr) => acc + (curr.employeeCount || 0), 0);

    const totalConsultants = consultantData.length;
    const totalHours = consultantData.reduce((acc, curr) => acc + (curr.totalWorkHours || 0), 0);
    const totalCost = consultantData.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);

    const totalTickets = ticketOverviewStats?.totalTokens || ticketDetailedStats?.total || 0;
    const pendingTickets = ticketOverviewStats?.pendingTokens || ticketDetailedStats?.pending || 0;
    const assignedTickets = ticketOverviewStats?.assignedTokens || 0;
    const resolvedTickets = ticketOverviewStats?.resolvedTokens || ticketDetailedStats?.resolved || 0;

    const avgResolutionTime = ticketDetailedStats?.avgResolutionTime || 0;
    const avgRating = ticketDetailedStats?.avgRating || 0;
    const totalRatings = ticketDetailedStats?.totalRatings || 0;

    // Extra metrics extracted from stats / clients / consultants
    const priorityBreakdown = ticketDetailedStats?.priorityBreakdown || { critical: 0, high: 0, medium: 0, low: 0 };
    const statusBreakdown = ticketDetailedStats?.statusBreakdown || { pending: 0, assigned: 0, resolved: 0, closed: 0, hold: 0, cancelled: 0 };
    const departmentBreakdown = ticketDetailedStats?.departmentBreakdown || [];

    const erpBreakdown = clientData.reduce((acc, c) => {
      const erp = c.erpDetails?.erpName || 'Unspecified';
      acc[erp] = (acc[erp] || 0) + 1;
      return acc;
    }, {});
    const erpBreakdownArray = Object.entries(erpBreakdown).map(([name, value]) => ({ name, value }));

    const topConsultants = [...consultantData]
      .sort((a, b) => (b.tickets?.resolved || 0) - (a.tickets?.resolved || 0))
      .slice(0, 5);

    return {
      totalClients,
      activeClients,
      suspendedClients,
      frozenClients,
      totalClientEmployees,
      totalConsultants,
      totalHours: +totalHours.toFixed(1),
      totalCost: +totalCost.toFixed(2),
      totalTickets,
      pendingTickets,
      assignedTickets,
      resolvedTickets,
      avgResolutionTime,
      avgRating,
      totalRatings,
      priorityBreakdown,
      statusBreakdown,
      departmentBreakdown,
      erpBreakdownArray,
      topConsultants
    };
  }, [clientData, consultantData, ticketOverviewStats, ticketDetailedStats]);

  const priorityChartData = useMemo(() => {
    const p = overallData.priorityBreakdown || {};
    return [
      { name: 'Critical', value: p.critical || 0, color: PRIORITY_COLORS.critical },
      { name: 'High', value: p.high || 0, color: PRIORITY_COLORS.high },
      { name: 'Medium', value: p.medium || 0, color: PRIORITY_COLORS.medium },
      { name: 'Low', value: p.low || 0, color: PRIORITY_COLORS.low }
    ].filter(item => item.value > 0);
  }, [overallData.priorityBreakdown]);

  const departmentChartData = useMemo(() => {
    return (overallData.departmentBreakdown || [])
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [overallData.departmentBreakdown]);

  const erpChartData = useMemo(() => {
    return (overallData.erpBreakdownArray || [])
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [overallData.erpBreakdownArray]);

  // Filtered Lists for tables
  const filteredConsultants = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return consultantData;
    return consultantData.filter(c => 
      c.name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.employeeCode?.toLowerCase().includes(query) ||
      c.department?.toLowerCase().includes(query)
    );
  }, [consultantData, searchTerm]);

  const filteredClients = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return clientData;
    return clientData.filter(c => 
      c.name?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phone?.toLowerCase().includes(query) ||
      c.status?.toLowerCase().includes(query) ||
      c.erpDetails?.erpName?.toLowerCase().includes(query)
    );
  }, [clientData, searchTerm]);

  // Export report to Excel (via natively-opening UTF-8 BOM CSV format)
  const handleExport = (reportType) => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (reportType === 'consultant') {
      filename = 'consultant_performance_report.csv';
      headers = [
        'Consultant Name', 'Email', 'Employee ID', 'Department',
        'Total Tickets', 'Resolved Tickets', 'Open Tickets',
        'Total Hours Worked', 'Hourly Cost (INR/hr)', 'Total Accrued Cost (INR)', 'Joined Date'
      ];
      rows = consultantData.map(item => [
        item.name, item.email, item.employeeCode || 'N/A', item.department || 'Global',
        item.tickets?.total || 0, item.tickets?.resolved || 0, item.tickets?.open || 0,
        item.totalWorkHours || 0, item.hourlyCost || 0, item.totalCost || 0,
        item.joinedAt ? new Date(item.joinedAt).toLocaleDateString() : 'N/A'
      ]);
    } else if (reportType === 'client') {
      filename = 'client_engagement_report.csv';
      headers = [
        'Client Name', 'Client Email', 'Contact Person', 'Contact Phone', 'Domain',
        'ERP System', 'SAP Version Type', 'SAP Version/FP', 'SAP License AMC',
        'Support AMC Status', 'Support AMC From Date', 'Support AMC End Date', 'AMC Hours Cap', 'Hours Consumed',
        'Employee Count', 'Total Tickets Created', 'Resolved Tickets', 'Pending Tickets', 'Average satisfaction Rating',
        'Status', 'Registration Date'
      ];
      rows = clientData.map(item => [
        item.name, item.contactEmail || 'N/A', item.contactPerson || 'N/A', item.contactPhone || 'N/A', item.domain || 'N/A',
        item.erpDetails?.erpName || 'N/A', item.erpDetails?.sapB1VersionType || 'N/A', item.erpDetails?.sapB1VersionAndFP || 'N/A', item.erpDetails?.sapLicenseAMC || 'N/A',
        item.erpDetails?.sapSupportAMC?.status || 'N/A', 
        item.erpDetails?.sapSupportAMC?.fromDate ? new Date(item.erpDetails.sapSupportAMC.fromDate).toLocaleDateString() : 'N/A',
        item.erpDetails?.sapSupportAMC?.toDate ? new Date(item.erpDetails.sapSupportAMC.toDate).toLocaleDateString() : 'N/A',
        item.erpDetails?.sapSupportHourlyCap || 0, item.erpDetails?.hoursUsed || 0,
        item.employeeCount || 0, item.totalTickets || 0, item.resolvedTickets || 0, item.pendingTickets || 0,
        item.averageRating ? item.averageRating.toFixed(1) : '0', item.status || 'active',
        item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A'
      ]);
    } else if (reportType === 'overall') {
      filename = 'overall_system_report.csv';
      headers = ['Metric Category', 'Metric Name', 'Metric Value'];
      rows = [
        ['Clients', 'Total Clients Registered', overallData.totalClients || 0],
        ['Clients', 'Active Client Organizations', overallData.activeClients || 0],
        ['Clients', 'Suspended Client Organizations', overallData.suspendedClients || 0],
        ['Clients', 'Frozen Client Organizations', overallData.frozenClients || 0],
        ['Clients', 'Total Registered Client Employees', overallData.totalClientEmployees || 0],
        ['Consultants', 'Total Registered Consultants', overallData.totalConsultants || 0],
        ['Consultants', 'Total Support Work Hours Logged', overallData.totalHours || 0],
        ['Consultants', 'Total Accrued Work Billing Cost (INR)', overallData.totalCost || 0],
        ['Tickets', 'Total Tickets Registered', overallData.totalTickets || 0],
        ['Tickets', 'Pending Tickets', overallData.pendingTickets || 0],
        ['Tickets', 'Assigned Tickets', overallData.assignedTickets || 0],
        ['Tickets', 'Resolved Tickets', overallData.statusBreakdown?.resolved || 0],
        ['Tickets', 'Closed Tickets', overallData.statusBreakdown?.closed || 0],
        ['Tickets', 'On Hold Tickets', overallData.statusBreakdown?.hold || 0],
        ['Tickets', 'Cancelled Tickets', overallData.statusBreakdown?.cancelled || 0],
        ['SLA & Efficiency', 'Average Ticket Resolution Time (minutes)', overallData.avgResolutionTime || 0],
        ['SLA & Efficiency', 'Average Ticket Resolution Time (Formatted)', formatResolutionTime(overallData.avgResolutionTime)],
        ['SLA & Efficiency', 'Average Customer Satisfaction Rating (1-5)', overallData.avgRating || 0],
        ['SLA & Efficiency', 'Total Tickets Rated by Customers', overallData.totalRatings || 0],
        ['Priority Breakdown', 'Critical Tickets', overallData.priorityBreakdown?.critical || 0],
        ['Priority Breakdown', 'High Tickets', overallData.priorityBreakdown?.high || 0],
        ['Priority Breakdown', 'Medium Tickets', overallData.priorityBreakdown?.medium || 0],
        ['Priority Breakdown', 'Low Tickets', overallData.priorityBreakdown?.low || 0],
      ];

      // Add ERPs distribution
      overallData.erpBreakdownArray?.forEach(item => {
        rows.push(['ERP Breakdown', `Clients running ${item.name}`, item.value]);
      });

      // Add Department distribution
      overallData.departmentBreakdown?.forEach(item => {
        rows.push(['Department Tickets', `Tickets in ${item.name}`, item.count]);
      });

      // Add top performing consultants
      overallData.topConsultants?.forEach((c, idx) => {
        rows.push(['Top Performers', `Rank ${idx+1}: ${c.name} (${c.department})`, `${c.tickets?.resolved || 0} resolved tickets`]);
      });
    }

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        let clean = val === null || val === undefined ? '' : String(val);
        clean = clean.replace(/"/g, '""');
        if (clean.includes(',') || clean.includes('\n') || clean.includes('"')) {
          clean = `"${clean}"`;
        }
        return clean;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);

    let nameWithoutExt = filename.replace('.csv', '');
    let fileSuffix = '';
    if (timeframe === 'weekly') {
      fileSuffix = '_weekly';
    } else if (timeframe === 'monday') {
      fileSuffix = `_monday_${dateFilters.startDate?.split('T')[0]}`;
    } else if (timeframe === 'custom-day') {
      fileSuffix = `_day_${customDay}`;
    } else if (timeframe === 'custom-range') {
      fileSuffix = `_range_${customRangeStart}_to_${customRangeEnd}`;
    } else {
      fileSuffix = '_lifetime';
    }

    link.setAttribute('download', `${nameWithoutExt}${fileSuffix}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportIndividual = async (consultantId, name) => {
    try {
      setIsLoading(true);
      const res = await api.get(`/consultant-stats/${consultantId}`);
      const stats = res.data.data;
      if (!stats) {
        alert('Failed to retrieve statistics for this consultant.');
        return;
      }

      const { consultant, department, tickets, workHours, clientBreakdown = [], clientWorkHours = [], reviews = [] } = stats;

      let csvRows = [];
      
      // Section 1: Consultant Profile
      csvRows.push(['CONSULTANT SPECIFICATIONS']);
      csvRows.push(['Name', consultant.name]);
      csvRows.push(['Email', consultant.email]);
      csvRows.push(['Employee ID', consultant.employeeCode || 'N/A']);
      csvRows.push(['Title / Position', consultant.position || 'N/A']);
      csvRows.push(['Delegated Department', department?.name || 'Global Level Scope']);
      csvRows.push(['Joined Date', consultant.joinedAt ? new Date(consultant.joinedAt).toLocaleDateString() : 'N/A']);
      csvRows.push([]);

      // Section 2: Ticket Summary
      csvRows.push(['TICKET RESOLUTION METRICS']);
      csvRows.push(['Total Assigned Tickets', tickets.total || 0]);
      csvRows.push(['Resolved Tickets', tickets.resolved || 0]);
      csvRows.push(['Open Tickets', tickets.open || 0]);
      csvRows.push(['Resolution Rate', tickets.total > 0 ? `${Math.round((tickets.resolved / tickets.total) * 100)}%` : '0%']);
      csvRows.push(['Average Resolution Time', workHours.avgResolutionHours > 0 ? `${workHours.avgResolutionHours} hrs` : 'N/A']);
      csvRows.push([]);

      // Section 3: Billing Summary
      csvRows.push(['BILLING & WORK CAPACITY']);
      csvRows.push(['Total Work Hours Logged', `${workHours.total} hrs`]);
      csvRows.push(['Hourly Cost Rate', `₹${workHours.hourlyCost}/hr`]);
      csvRows.push(['Total Accrued Cost of Work', `₹${workHours.totalCost}`]);
      csvRows.push([]);

      // Section 4: Client Breakdown
      csvRows.push(['CLIENT SUPPORT BREAKDOWN']);
      csvRows.push(['Client Name', 'Tickets Handled', 'Hours Logged']);
      const clientMap = new Map();
      clientBreakdown.forEach(item => {
        clientMap.set(item.clientName, { count: item.count, hours: 0 });
      });
      clientWorkHours.forEach(item => {
        const existing = clientMap.get(item.clientName) || { count: 0, hours: 0 };
        clientMap.set(item.clientName, { count: existing.count, hours: item.hours });
      });
      
      if (clientMap.size === 0) {
        csvRows.push(['No clients handled yet', '0', '0']);
      } else {
        clientMap.forEach((val, key) => {
          csvRows.push([key, val.count, val.hours]);
        });
      }
      csvRows.push([]);

      // Section 5: Daily Work Log sessions
      csvRows.push(['DAILY WORK EFFORT LOG']);
      csvRows.push(['Date', 'Hours Logged']);
      if (!workHours.byDate || workHours.byDate.length === 0) {
        csvRows.push(['No daily logs recorded', '0']);
      } else {
        workHours.byDate.forEach(log => {
          csvRows.push([log.date, `${log.hours} hrs`]);
        });
      }
      csvRows.push([]);

      // Section 6: Customer satisfaction reviews
      csvRows.push(['CUSTOMER SATISFACTION FEEDBACK']);
      csvRows.push(['Ticket Number', 'Date', 'Rating (Stars)', 'Feedback Comment']);
      if (reviews.length === 0) {
        csvRows.push(['No customer reviews submitted', '-', '-', '-']);
      } else {
        reviews.forEach(rev => {
          csvRows.push([rev.ticketNumber || 'N/A', rev.date ? new Date(rev.date).toLocaleDateString() : 'N/A', `${rev.rating} Stars`, rev.comment || '-']);
        });
      }

      // Convert rows to CSV
      const csvContent = '\uFEFF' + csvRows.map(row => row.map(val => {
        let clean = val === null || val === undefined ? '' : String(val);
        clean = clean.replace(/"/g, '""');
        if (clean.includes(',') || clean.includes('\n') || clean.includes('"')) {
          clean = `"${clean}"`;
        }
        return clean;
      }).join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.setAttribute('href', url);
      link.setAttribute('download', `consultant_report_${safeName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export individual consultant report:', err);
      alert('Error occurred while compiling individual report.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="w-full relative font-sans min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-6 text-red-500">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-2">Access Denied</h2>
        <p className="text-slate-400 max-w-md text-sm font-medium leading-relaxed">
          You do not have permission to view or generate System Reports.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative font-sans p-4 md:p-8 space-y-8 min-h-screen">
      {/* Background Blurs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <FileText className="text-red-500 shrink-0" size={32} />
            In-Depth Reports Center
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Review detailed metrics and download performance reports natively in Excel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleExport(activeTab)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-600/15"
          >
            <Download size={13} /> Export Active to Excel
          </button>
          <button 
            onClick={fetchData}
            disabled={isLoading}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Loading...' : 'Sync Logs'}
          </button>
        </div>
      </div>

      {/* Timeframe Scope Selector */}
      <div className="bg-slate-50/80 dark:bg-[#111620]/80 border border-slate-200 dark:border-white/10 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 shadow-lg backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-red-500" size={18} />
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Report Timeframe Scope</span>
          </div>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-slate-800 dark:text-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-red-500/50 cursor-pointer"
          >
            <option value="all">📊 All-Time / Lifetime</option>
            <option value="weekly">📅 Weekly (Last 7 Days)</option>
            <option value="monday">🗓️ Monday Report (Most Recent)</option>
            <option value="custom-day">🎯 Custom Day (Single Date)</option>
            <option value="custom-range">🎛️ Custom Date Range</option>
          </select>
        </div>

        {/* Dynamic date pickers based on selected timeframe */}
        <div className="flex flex-wrap items-center gap-3">
          {timeframe === 'monday' && (
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white/5 border border-white/5 rounded-xl px-4 py-2 animate-in fade-in duration-200">
              Selected Monday: <span className="text-red-500">{getMostRecentMonday()}</span>
            </div>
          )}
          
          {timeframe === 'custom-day' && (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Select Date:</span>
              <input
                type="date"
                value={customDay}
                onChange={(e) => setCustomDay(e.target.value)}
                className="bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-slate-800 dark:text-white text-xs font-bold outline-none focus:border-red-500/50"
              />
            </div>
          )}

          {timeframe === 'custom-range' && (
            <div className="flex flex-wrap items-center gap-3 animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">From:</span>
                <input
                  type="date"
                  value={customRangeStart}
                  onChange={(e) => setCustomRangeStart(e.target.value)}
                  className="bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-slate-800 dark:text-white text-xs font-bold outline-none focus:border-red-500/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">To:</span>
                <input
                  type="date"
                  value={customRangeEnd}
                  onChange={(e) => setCustomRangeEnd(e.target.value)}
                  className="bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-slate-800 dark:text-white text-xs font-bold outline-none focus:border-red-500/50"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-2 relative z-10 shadow-lg">
          <ShieldAlert size={16} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/5 gap-2 relative z-10 overflow-x-auto pb-px">
        {[
          { id: 'consultant', label: 'Consultant Report', icon: <Users size={14} /> },
          { id: 'client', label: 'Client Engagement', icon: <Building size={14} /> },
          { id: 'overall', label: 'Overall System Roster', icon: <ClipboardList size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-red-500 text-red-600 dark:text-white bg-red-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT CARDS */}
      <div className="glass-card rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden relative z-10">
        
        {/* Search Bar for data filtering */}
        {activeTab !== 'overall' && (
          <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-[13px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Settings size={13} /> {activeTab === 'consultant' ? 'Detailed Consultant Roster' : 'Detailed Client Roster'}
            </h3>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text"
                placeholder={activeTab === 'consultant' ? "Search consultants..." : "Search clients..."}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-slate-800 dark:text-white text-xs placeholder:text-slate-500 outline-none focus:border-red-500/50 transition-all font-bold"
              />
            </div>
          </div>
        )}

        <div className="p-6">
          {isLoading ? (
            <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Compiling reports...</span>
            </div>
          ) : (
            <div>
              {/* TAB 1: CONSULTANTS */}
              {activeTab === 'consultant' && (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead className="bg-slate-100/80 dark:bg-[#181f2b]/80 border-b border-slate-200 dark:border-white/5">
                      <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="p-4 rounded-tl-xl">Consultant</th>
                        <th className="p-4">ID & Department</th>
                        <th className="p-4 text-center">Tickets (Tot/Res/Open)</th>
                        <th className="p-4 text-center">Hours & Rates</th>
                        <th className="p-4 text-right">Joined Date</th>
                        <th className="p-4 text-right">Total Cost of Work</th>
                        <th className="p-4 text-right rounded-tr-xl">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/[0.02]">
                      {filteredConsultants.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-8 text-center text-slate-500 text-xs font-medium">No consultant stats loaded.</td>
                        </tr>
                      ) : filteredConsultants.map(c => (
                        <tr 
                          key={c._id} 
                          onClick={() => setSelectedConsultantId(c._id)}
                          className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02] cursor-pointer transition-all group"
                        >
                          <td className="p-4 font-bold text-slate-800 dark:text-white text-[13px]">
                            <div>{c.name}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{c.email}</div>
                          </td>
                          <td className="p-4 text-slate-600 dark:text-slate-300 text-xs">
                            <div className="font-bold flex items-center gap-1"><Briefcase size={12}/> ID: {c.employeeCode || 'N/A'}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{c.department || 'Global Level'}</div>
                          </td>
                          <td className="p-4 text-center text-xs">
                            <span className="font-bold text-slate-700 dark:text-slate-200">{c.tickets?.total || 0}</span>
                            <span className="text-slate-500"> / </span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">{c.tickets?.resolved || 0}</span>
                            <span className="text-slate-500"> / </span>
                            <span className="font-bold text-yellow-600 dark:text-yellow-400">{c.tickets?.open || 0}</span>
                          </td>
                          <td className="p-4 text-center text-xs">
                            <div className="font-black text-slate-800 dark:text-slate-200">{c.totalWorkHours || 0} hrs</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">Rate: ₹{c.hourlyCost || 0}/hr</div>
                          </td>
                          <td className="p-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400">
                            {c.joinedAt ? new Date(c.joinedAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4 text-right text-xs font-black text-emerald-400">
                            ₹{(c.totalCost || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleExportIndividual(c._id, c.name); }}
                              className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 transition-all cursor-pointer inline-flex items-center gap-1.5 align-middle ml-auto"
                              title="Download Individual Stats & Logs"
                            >
                              <Download size={11} /> Excel
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: CLIENT ENGAGEMENT */}
              {activeTab === 'client' && (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="bg-slate-100/80 dark:bg-[#181f2b]/80 border-b border-slate-200 dark:border-white/5">
                      <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <th className="p-4 rounded-tl-xl">Client & Domain</th>
                        <th className="p-4">Contact Info</th>
                        <th className="p-4">AMC ERP Details</th>
                        <th className="p-4 text-center">Support Hours Cap</th>
                        <th className="p-4 text-center">Hours Used</th>
                        <th className="p-4 text-center">Users</th>
                        <th className="p-4 text-center">Tickets (Tot/Res)</th>
                        <th className="p-4 text-center">Satisfaction</th>
                        <th className="p-4 text-right rounded-tr-xl">AMC Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-white/[0.02]">
                      {filteredClients.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="p-8 text-center text-slate-500 text-xs font-medium">No client metrics compiled.</td>
                        </tr>
                      ) : filteredClients.map(c => {
                        const amcDate = c.erpDetails?.sapSupportAMC?.toDate;
                        return (
                          <tr 
                            key={c._id} 
                            onClick={() => setSelectedClient(c)}
                            className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02] cursor-pointer transition-all"
                          >
                            <td className="p-4 font-bold text-slate-800 dark:text-white text-[13px]">
                              <div>{c.name}</div>
                              <div className="text-[11px] text-slate-500 font-medium">{c.domain || 'N/A'}</div>
                            </td>
                            <td className="p-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                              <div>{c.contactPerson || 'N/A'}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{c.contactEmail || 'N/A'}</div>
                              <div className="text-[10px] text-slate-500">{c.contactPhone || 'N/A'}</div>
                            </td>
                            <td className="p-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                              <div>{c.erpDetails?.erpName || 'ERP N/A'} ({c.erpDetails?.sapB1VersionType || 'N/A'})</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">AMC End: {amcDate ? new Date(amcDate).toLocaleDateString() : 'N/A'}</div>
                            </td>
                            <td className="p-4 text-center text-xs font-bold text-slate-750 dark:text-slate-200">
                              {c.erpDetails?.sapSupportHourlyCap ? `${c.erpDetails.sapSupportHourlyCap} hrs` : 'Unlimited'}
                            </td>
                            <td className="p-4 text-center text-xs font-bold text-slate-750 dark:text-slate-200">
                              {c.erpDetails?.hoursUsed ? `${+c.erpDetails.hoursUsed.toFixed(1)} hrs` : '0 hrs'}
                            </td>
                            <td className="p-4 text-center text-xs font-black text-slate-750 dark:text-slate-200">
                              {c.employeeCount || 0}
                            </td>
                            <td className="p-4 text-center text-xs">
                              <span className="font-bold text-slate-750 dark:text-slate-200">{c.totalTickets || 0}</span>
                              <span className="text-slate-500"> / </span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{c.resolvedTickets || 0}</span>
                            </td>
                            <td className="p-4 text-center text-xs font-bold text-yellow-400">
                              <div className="flex items-center justify-center gap-1">
                                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                                {c.averageRating ? c.averageRating.toFixed(1) : '0'}
                              </div>
                            </td>
                            <td className="p-4 text-right">
                              <Badge color={c.erpDetails?.sapSupportAMC?.status === 'Active' ? 'green' : 'slate'} size="sm">
                                {c.erpDetails?.sapSupportAMC?.status || 'Inactive'}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: OVERALL SYSTEM REPORT */}
              {activeTab === 'overall' && (
                <div className="space-y-8 max-w-6xl mx-auto">
                  {/* Tab Title & Actions */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight uppercase">System Operational Summary</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Macro operational overview of all services, users, and ticket volumes.</p>
                    </div>
                    <button 
                      onClick={() => handleExport('overall')}
                      className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download size={13} /> Download Overall Log
                    </button>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Clients summary card */}
                    <div className="bg-slate-100/50 dark:bg-[#181f2b]/40 border border-slate-200 dark:border-white/5 p-6 rounded-2xl space-y-4">
                      <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Building size={14} className="text-red-500 dark:text-red-400" /> Client Orgs
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-500 dark:text-slate-400">Total Registered</span>
                          <span className="font-bold text-slate-800 dark:text-white">{overallData.totalClients}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-500 dark:text-slate-400">Active AMC</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{overallData.activeClients}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-500 dark:text-slate-400">Suspended Orgs</span>
                          <span className="font-bold text-red-500 dark:text-red-400">{overallData.suspendedClients}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold border-t border-slate-250 dark:border-white/5 pt-2">
                          <span className="text-slate-500 dark:text-slate-400">Total Users</span>
                          <span className="font-bold text-slate-700 dark:text-slate-200">{overallData.totalClientEmployees}</span>
                        </div>
                      </div>
                    </div>

                    {/* Support team capacity card */}
                    <div className="bg-slate-100/50 dark:bg-[#181f2b]/40 border border-slate-200 dark:border-white/5 p-6 rounded-2xl space-y-4">
                      <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Users size={14} className="text-yellow-600 dark:text-yellow-400" /> Support Team
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-500 dark:text-slate-400">Total Consultants</span>
                          <span className="font-bold text-slate-800 dark:text-white">{overallData.totalConsultants}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-500 dark:text-slate-400">Total Work Hours</span>
                          <span className="font-bold text-yellow-600 dark:text-yellow-400">{overallData.totalHours} hrs</span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold border-t border-slate-250 dark:border-white/5 pt-2">
                          <span className="text-slate-500 dark:text-slate-400">Accrued Billing Cost</span>
                          <span className="font-black text-emerald-600 dark:text-emerald-400">₹{overallData.totalCost.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* SLA Response card */}
                    <div className="bg-slate-100/50 dark:bg-[#181f2b]/40 border border-slate-200 dark:border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                          <Clock size={14} className="text-indigo-500 dark:text-indigo-400" /> Avg. Resolution Duration
                        </h4>
                        <span className="text-lg font-black text-slate-800 dark:text-white block tracking-tight leading-none mt-2">
                          {formatResolutionTime(overallData.avgResolutionTime)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-4">
                        Average time to solve resolved support tickets
                      </div>
                    </div>

                    {/* Satisfaction card */}
                    <div className="bg-slate-100/50 dark:bg-[#181f2b]/40 border border-slate-200 dark:border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                          <Star size={14} className="text-yellow-500 fill-yellow-500/20" /> Satisfaction Rating
                        </h4>
                        <span className="text-lg font-black text-yellow-500 block flex items-center gap-1.5 mt-2">
                          <Star size={20} className="fill-yellow-400 text-yellow-400" />
                          {overallData.avgRating > 0 ? `${overallData.avgRating.toFixed(2)} / 5.0` : '—'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-4">
                        Based on {overallData.totalRatings} customer reviews
                      </div>
                    </div>
                  </div>

                  {/* Tickets Detailed Breakdown */}
                  <div className="bg-slate-100/50 dark:bg-[#181f2b]/40 border border-slate-200 dark:border-white/5 p-6 rounded-2xl space-y-4">
                    <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ClipboardList size={14} className="text-blue-500 dark:text-blue-400" /> Tickets Status Breakdown
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="bg-slate-200/50 dark:bg-black/20 p-4 rounded-xl text-center border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total</span>
                        <span className="text-xl font-black text-slate-800 dark:text-white block mt-1">{overallData.totalTickets}</span>
                      </div>
                      <div className="bg-slate-200/50 dark:bg-black/20 p-4 rounded-xl text-center border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block text-yellow-600">Pending</span>
                        <span className="text-xl font-black text-yellow-600 dark:text-yellow-400 block mt-1">{overallData.statusBreakdown?.pending || 0}</span>
                      </div>
                      <div className="bg-slate-200/50 dark:bg-black/20 p-4 rounded-xl text-center border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block text-blue-500">Assigned</span>
                        <span className="text-xl font-black text-blue-600 dark:text-blue-400 block mt-1">{overallData.statusBreakdown?.assigned || 0}</span>
                      </div>
                      <div className="bg-slate-200/50 dark:bg-black/20 p-4 rounded-xl text-center border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block text-emerald-500">Resolved</span>
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 block mt-1">{overallData.statusBreakdown?.resolved || 0}</span>
                      </div>
                      <div className="bg-slate-200/50 dark:bg-black/20 p-4 rounded-xl text-center border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block text-teal-600">Closed</span>
                        <span className="text-xl font-black text-teal-600 dark:text-teal-400 block mt-1">{overallData.statusBreakdown?.closed || 0}</span>
                      </div>
                      <div className="bg-slate-200/50 dark:bg-black/20 p-4 rounded-xl text-center border border-slate-200 dark:border-white/5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block text-purple-500">On Hold</span>
                        <span className="text-xl font-black text-purple-650 dark:text-purple-400 block mt-1">{overallData.statusBreakdown?.hold || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Visual Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Priority Pie Chart */}
                    <div className="bg-slate-100/50 dark:bg-[#181f2b]/40 border border-slate-200 dark:border-white/5 p-6 rounded-2xl flex flex-col h-[320px]">
                      <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                        <PieIcon size={14} className="text-orange-500" /> Ticket Priorities
                      </h4>
                      {priorityChartData.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic">No priority metrics.</div>
                      ) : (
                        <div className="flex-1 w-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={priorityChartData}
                                cx="50%"
                                cy="45%"
                                innerRadius={45}
                                outerRadius={70}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {priorityChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Legend 
                                verticalAlign="bottom" 
                                height={36} 
                                iconSize={8}
                                formatter={(v) => <span className="text-slate-600 dark:text-slate-400 text-[10px] font-semibold uppercase">{v}</span>} 
                              />
                              <RechartsTooltip
                                contentStyle={{ 
                                  backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255, 255, 255, 0.95)', 
                                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', 
                                  borderRadius: '12px',
                                  color: isDark ? '#fff' : '#0f172a',
                                  fontSize: '11px',
                                  fontWeight: 'bold'
                                }}
                                itemStyle={{ color: isDark ? '#fff' : '#0f172a' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* ERP distribution */}
                    <div className="bg-slate-100/50 dark:bg-[#181f2b]/40 border border-slate-200 dark:border-white/5 p-6 rounded-2xl flex flex-col h-[320px]">
                      <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                        <Building size={14} className="text-emerald-500" /> Clients by ERP System
                      </h4>
                      {erpChartData.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic">No client ERP data.</div>
                      ) : (
                        <div className="flex-1 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={erpChartData} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff0d" : "rgba(0,0,0,0.06)"} horizontal={false} />
                              <XAxis type="number" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                              <YAxis type="category" dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} width={70} />
                              <RechartsTooltip
                                contentStyle={{ 
                                  backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255, 255, 255, 0.95)', 
                                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', 
                                  borderRadius: '12px',
                                  color: isDark ? '#fff' : '#0f172a',
                                  fontSize: '11px',
                                  fontWeight: 'bold'
                                }}
                                itemStyle={{ color: isDark ? '#fff' : '#0f172a' }}
                              />
                              <Bar dataKey="value" name="Clients Count" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>

                    {/* Department distribution */}
                    <div className="bg-slate-100/50 dark:bg-[#181f2b]/40 border border-slate-200 dark:border-white/5 p-6 rounded-2xl flex flex-col h-[320px]">
                      <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                        <BarChart2 size={14} className="text-blue-500" /> Tickets by Department
                      </h4>
                      {departmentChartData.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 text-xs italic">No ticket department distribution.</div>
                      ) : (
                        <div className="flex-1 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff0d" : "rgba(0,0,0,0.06)"} vertical={false} />
                              <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                              <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                              <RechartsTooltip
                                contentStyle={{ 
                                  backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255, 255, 255, 0.95)', 
                                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)', 
                                  borderRadius: '12px',
                                  color: isDark ? '#fff' : '#0f172a',
                                  fontSize: '11px',
                                  fontWeight: 'bold'
                                }}
                                itemStyle={{ color: isDark ? '#fff' : '#0f172a' }}
                              />
                              <Bar dataKey="count" name="Tickets count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Consultants Table */}
                  <div className="bg-slate-100/50 dark:bg-[#181f2b]/40 border border-slate-200 dark:border-white/5 p-6 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-3">
                      <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Award size={14} className="text-yellow-500" /> Top Performing Consultants
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Sorted by Resolved Tickets</span>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                            <th className="p-3 text-center w-16">Rank</th>
                            <th className="p-3">Consultant</th>
                            <th className="p-3">Department</th>
                            <th className="p-3 text-center">Resolved Tickets</th>
                            <th className="p-3 text-center">Total Hours</th>
                            <th className="p-3 text-right">Total Billing Cost</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/[0.02] text-xs">
                          {overallData.topConsultants?.length === 0 ? (
                            <tr>
                              <td colSpan="7" className="p-4 text-center text-slate-500 italic">No consultant data available.</td>
                            </tr>
                          ) : (
                            overallData.topConsultants?.map((c, idx) => (
                              <tr 
                                key={c._id} 
                                onClick={() => setSelectedConsultantId(c._id)}
                                className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02] cursor-pointer transition-all group"
                              >
                                <td className="p-3 text-center">
                                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-[11px] ${
                                    idx === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                                    idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                                    idx === 2 ? 'bg-amber-600/20 text-amber-500' :
                                    'bg-slate-200/20 text-slate-450'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                </td>
                                <td className="p-3 font-bold text-slate-800 dark:text-white">
                                  <div>{c.name}</div>
                                  <div className="text-[10px] text-slate-500 font-medium">{c.email}</div>
                                </td>
                                <td className="p-3 text-slate-600 dark:text-slate-300 font-semibold">{c.department || 'Unassigned'}</td>
                                <td className="p-3 text-center font-black text-emerald-500">{c.tickets?.resolved || 0}</td>
                                <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{c.totalWorkHours || 0} hrs</td>
                                <td className="p-3 text-right font-black text-emerald-400">₹{(c.totalCost || 0).toLocaleString('en-IN')}</td>
                                <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleExportIndividual(c._id, c.name)}
                                    className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded border border-emerald-500/20 text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer inline-flex items-center gap-1"
                                    title="Export Performance Report"
                                  >
                                    <Download size={10} /> Excel
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CONSULTANT DETAILS MODAL */}
      <AnimatePresence>
        {selectedConsultantId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedConsultantId(null)} 
              className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white dark:bg-[#111620] border border-slate-200 dark:border-white/10 w-full max-w-5xl rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-8 py-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#181f2b]/50 backdrop-blur-xl flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Consultant Node Stats</h2>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">Appraisal and Log Performance Details</p>
                </div>
                <button 
                  onClick={() => setSelectedConsultantId(null)} 
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 rounded-full transition-colors border border-slate-200 dark:border-white/5"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <ConsultantDashboard consultantId={selectedConsultantId} />
              </div>
              
              {/* Footer */}
              <div className="px-8 py-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-[#181f2b]/80 backdrop-blur-xl flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedConsultantId(null)} 
                  className="px-6 py-2 bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest cursor-pointer"
                >
                  Close Dashboard
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLIENT DETAILS MODAL */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedClient(null)} 
              className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="bg-white dark:bg-[#111620] border border-slate-200 dark:border-white/10 w-full max-w-2xl rounded-[2rem] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#181f2b]/50 backdrop-blur-xl flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{selectedClient.name}</h2>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wider">Client Organization Specifications</p>
                </div>
                <button 
                  onClick={() => setSelectedClient(null)} 
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 rounded-full transition-colors border border-slate-200 dark:border-white/5"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto space-y-6 custom-scrollbar flex-1 relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[80px] pointer-events-none" />
                
                {/* Section 1: Basic & Contact info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Building size={12}/> Profile Details</h3>
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-500">Domain / Org Domain</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-black/20 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/5">{selectedClient.domain}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-500">Contact Person</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-black/20 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/5">{selectedClient.contactPerson || 'N/A'}</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Users size={12}/> Contact Credentials</h3>
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-500">Email Address</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-black/20 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/5">{selectedClient.contactEmail || 'N/A'}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-500">Phone Number</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-black/20 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-white/5">{selectedClient.contactPhone || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Section 2: ERP Details & Support AMC */}
                <div className="border-t border-slate-200 dark:border-white/5 pt-6 space-y-4 relative z-10">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Settings size={12}/> SAP Support AMC Specifications</h3>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-100 dark:bg-black/20 p-3.5 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">ERP Platform</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white block mt-1 truncate">{selectedClient.erpDetails?.erpName || 'N/A'}</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-black/20 p-3.5 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">SAP Version</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white block mt-1 truncate">{selectedClient.erpDetails?.sapB1VersionType || 'N/A'}</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-black/20 p-3.5 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Version FP</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white block mt-1 truncate">{selectedClient.erpDetails?.sapB1VersionAndFP || 'N/A'}</span>
                    </div>
                    <div className="bg-slate-100 dark:bg-black/20 p-3.5 rounded-xl border border-slate-200 dark:border-white/5 text-center">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">License AMC</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white block mt-1 truncate">{selectedClient.erpDetails?.sapLicenseAMC || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-white/[0.01] border border-slate-200 dark:border-white/5 p-4 rounded-2xl">
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AMC Contract Dates</div>
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {selectedClient.erpDetails?.sapSupportAMC?.fromDate ? new Date(selectedClient.erpDetails.sapSupportAMC.fromDate).toLocaleDateString() : 'N/A'}
                        <span className="text-slate-500 px-1.5">to</span>
                        {selectedClient.erpDetails?.sapSupportAMC?.toDate ? new Date(selectedClient.erpDetails.sapSupportAMC.toDate).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1 sm:text-right">
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AMC Status</div>
                      <Badge color={selectedClient.erpDetails?.sapSupportAMC?.status === 'Active' ? 'green' : 'slate'} size="sm">
                        {selectedClient.erpDetails?.sapSupportAMC?.status || 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Section 3: Hours Cap progress bar */}
                {selectedClient.erpDetails?.sapSupportHourlyCap > 0 && (
                  <div className="border-t border-slate-200 dark:border-white/5 pt-6 space-y-3 relative z-10">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-555 dark:text-slate-400">
                      <span>Support Hours Consumption</span>
                      <span className="text-slate-800 dark:text-white font-black">{selectedClient.erpDetails.hoursUsed ? +selectedClient.erpDetails.hoursUsed.toFixed(1) : 0} / {selectedClient.erpDetails.sapSupportHourlyCap} hrs</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-[#181f2b] rounded-full h-3 overflow-hidden border border-slate-300 dark:border-white/5">
                      <div 
                        className="bg-gradient-to-r from-red-600 to-[#ED1B2F] h-full rounded-full transition-all duration-500 shadow-md"
                        style={{ width: `${Math.min(100, ((selectedClient.erpDetails.hoursUsed || 0) / selectedClient.erpDetails.sapSupportHourlyCap) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-555 dark:text-slate-500 font-bold">
                      * Based on ticket resolution effort logging. Remaining support capacity: {Math.max(0, selectedClient.erpDetails.sapSupportHourlyCap - (selectedClient.erpDetails.hoursUsed || 0)).toFixed(1)} hrs.
                    </p>
                  </div>
                )}

                {/* Section 4: Tickets stats & reviews */}
                <div className="border-t border-slate-200 dark:border-white/5 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><ClipboardList size={12}/> Ticket Volumes</h3>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-100 dark:bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                        <div className="text-[9px] text-slate-555 dark:text-slate-500 font-bold uppercase">Total</div>
                        <div className="text-base font-black text-slate-800 dark:text-white mt-0.5">{selectedClient.totalTickets || 0}</div>
                      </div>
                      <div className="bg-slate-100 dark:bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                        <div className="text-[9px] text-slate-555 dark:text-slate-500 font-bold uppercase">Resolved</div>
                        <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedClient.resolvedTickets || 0}</div>
                      </div>
                      <div className="bg-slate-100 dark:bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                        <div className="text-[9px] text-slate-555 dark:text-slate-500 font-bold uppercase">Pending</div>
                        <div className="text-base font-black text-yellow-600 dark:text-yellow-400 mt-0.5">{selectedClient.pendingTickets || 0}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Star size={12}/> Customer satisfaction</h3>
                    <div className="bg-slate-100 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] text-slate-555 dark:text-slate-500 font-bold uppercase">Average Rating</div>
                        <div className="text-xl font-black text-yellow-500 flex items-center gap-1 mt-0.5">
                          <Star size={18} className="fill-yellow-400 text-yellow-400" />
                          {selectedClient.averageRating ? selectedClient.averageRating.toFixed(1) : '0.0'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-slate-555 dark:text-slate-500 font-bold uppercase">Feedbacks</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">{selectedClient.totalFeedbacks || 0} reviews</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-8 py-5 border-t border-slate-200 dark:border-white/5 bg-slate-50/80 dark:bg-[#181f2b]/80 backdrop-blur-xl flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedClient(null)} 
                  className="px-6 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 transition-all text-xs font-black uppercase tracking-widest cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
