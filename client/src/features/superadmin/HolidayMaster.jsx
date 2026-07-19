import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Search, Plus, Edit2, Trash2, CheckCircle2, 
  AlertCircle, ShieldAlert, Settings, History, Info, ChevronLeft, ChevronRight, 
  Trash, Award, Star, ListFilter, Clipboard, User, RefreshCw, CalendarDays,
  Grid, LayoutList
} from 'lucide-react';
import { useHolidayStore } from '../../store/useHolidayStore';
import { useAuthStore } from '../../store/useAuthStore';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const getInitialFY = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0 is Jan, 3 is April
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(-2)}`;
  } else {
    return `${year - 1}-${String(year).slice(-2)}`;
  }
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function HolidayMaster() {
  const { user } = useAuthStore();
  const { 
    holidays, weekendConfig, auditLogs, isLoading, error, 
    fetchHolidays, addHoliday, updateHoliday, deleteHoliday, 
    fetchWeekendConfig, saveWeekendConfig, fetchAuditLogs 
  } = useHolidayStore();

  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'calendar' | 'weekends' | 'audit'
  const [financialYear, setFinancialYear] = useState(getInitialFY());
  const [searchTerm, setSearchTerm] = useState('');
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'delete' | null
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'full',
    description: ''
  });
  
  // Weekend Days Configuration
  // Array of { day: Number, type: 'full' | 'half' }
  const [weekendConfigDays, setWeekendConfigDays] = useState([
    { day: 0, type: 'full' },
    { day: 6, type: 'full' }
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Calendar view state
  const [calendarDate, setCalendarDate] = useState(new Date());

  const isSuperAdmin = user?.role === 'Super Admin' || user?.role === 'superadmin';
  const isAuthorized = isSuperAdmin || user?.role === 'Consultant' || user?.role === 'Admin';

  useEffect(() => {
    if (isAuthorized) {
      fetchHolidays(financialYear);
      fetchWeekendConfig(financialYear);
    }
  }, [fetchHolidays, fetchWeekendConfig, financialYear, isAuthorized]);

  useEffect(() => {
    if (activeTab === 'audit' && isAuthorized) {
      fetchAuditLogs();
    }
  }, [activeTab, fetchAuditLogs, isAuthorized]);

  // Sync weekend config when loaded
  useEffect(() => {
    if (weekendConfig && Array.isArray(weekendConfig.daysConfig)) {
      setWeekendConfigDays(weekendConfig.daysConfig);
    } else if (weekendConfig && Array.isArray(weekendConfig.days)) {
      // Backward compatibility for old weekend array schema
      const mapped = weekendConfig.days.map(d => ({ day: d, type: 'full' }));
      setWeekendConfigDays(mapped);
    }
  }, [weekendConfig]);

  if (!isAuthorized) {
    return (
      <div className="w-full relative font-sans min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-6 text-red-500">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-2">Access Denied</h2>
        <p className="text-slate-400 max-w-md text-sm font-medium leading-relaxed">
          You do not have permission to view or manage the Holiday Master.
        </p>
      </div>
    );
  }

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Open Handlers
  const handleOpenCreate = () => {
    if (!isSuperAdmin) return;
    setFormData({
      name: '',
      date: '',
      type: 'full',
      description: ''
    });
    setFormError('');
    setModalMode('create');
  };

  const handleOpenEdit = (holiday) => {
    if (!isSuperAdmin) return;
    setSelectedHoliday(holiday);
    
    // Format date for html input yyyy-mm-dd
    const d = new Date(holiday.date);
    const dateStr = d.toISOString().split('T')[0];

    setFormData({
      name: holiday.name || '',
      date: dateStr,
      type: holiday.type || 'full',
      description: holiday.description || ''
    });
    setFormError('');
    setModalMode('edit');
  };

  const handleOpenDelete = (holiday) => {
    if (!isSuperAdmin) return;
    setSelectedHoliday(holiday);
    setModalMode('delete');
  };

  // Form Submissions
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin || isSubmitting) return;

    if (!formData.name || !formData.date) {
      setFormError('Name and date are required');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      let res;
      const data = { ...formData, financialYear };
      if (modalMode === 'create') {
        res = await addHoliday(data);
      } else {
        res = await updateHoliday(selectedHoliday._id || selectedHoliday.id, data);
      }

      if (res?.success) {
        showToast(modalMode === 'create' ? 'Holiday created successfully!' : 'Holiday updated successfully!');
        setModalMode(null);
      } else {
        setFormError(res?.message || 'An error occurred during submission.');
      }
    } catch (err) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!isSuperAdmin || !selectedHoliday || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await deleteHoliday(selectedHoliday._id || selectedHoliday.id);
      if (res?.success) {
        showToast('Holiday deleted successfully.');
        setModalMode(null);
      } else {
        setFormError(res?.message || 'Failed to delete holiday.');
      }
    } catch (err) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Weekend CONFIG editor helpers
  const handleWeekendDayToggle = (dayIndex) => {
    if (!isSuperAdmin) return;
    const exists = weekendConfigDays.some(c => c.day === dayIndex);
    if (exists) {
      setWeekendConfigDays(prev => prev.filter(c => c.day !== dayIndex));
    } else {
      setWeekendConfigDays(prev => [...prev, { day: dayIndex, type: 'full' }]);
    }
  };

  const handleWeekendTypeChange = (dayIndex, type) => {
    if (!isSuperAdmin) return;
    setWeekendConfigDays(prev => 
      prev.map(c => c.day === dayIndex ? { ...c, type } : c)
    );
  };

  const handleSaveWeekendConfig = async (autoGenerate) => {
    if (!isSuperAdmin || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await saveWeekendConfig({
        financialYear,
        daysConfig: weekendConfigDays,
        autoGenerate
      });

      if (res?.success) {
        showToast(res.message || 'Weekend config saved successfully.');
      } else {
        alert(res?.message || 'Failed to save weekend configuration');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Corporate Holidays (Non-weekend)
  const filteredCorporateHolidays = useMemo(() => {
    return holidays.filter(h => {
      const isWeekend = h.type === 'weekend' || h.type === 'half-weekend';
      if (isWeekend) return false;
      return (
        h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [holidays, searchTerm]);

  // Filter Weekend Roster
  const filteredWeekendHolidays = useMemo(() => {
    return holidays.filter(h => {
      const isWeekend = h.type === 'weekend' || h.type === 'half-weekend';
      if (!isWeekend) return false;
      return (
        h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [holidays, searchTerm]);

  // Holiday Stats calculator
  const holidayStats = useMemo(() => {
    const total = holidays.length;
    const full = holidays.filter(h => h.type === 'full').length;
    const half = holidays.filter(h => h.type === 'half').length;
    const weekend = holidays.filter(h => h.type === 'weekend' || h.type === 'half-weekend').length;
    return { total, full, half, weekend };
  }, [holidays]);

  // Calendar Helpers
  const getCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth(); // 0-indexed
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const days = [];
    
    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevTotalDays - i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Next month filler days
    const remainingSlots = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  };

  const holidayByDateMap = useMemo(() => {
    const map = new Map();
    holidays.forEach(h => {
      const d = new Date(h.date);
      const dateStr = d.toISOString().split('T')[0];
      map.set(dateStr, h);
    });
    return map;
  }, [holidays]);

  // FY list helper
  const financialYears = ['2024-25', '2025-26', '2026-27', '2027-28', '2028-29'];

  return (
    <div className="w-full relative font-sans min-h-screen pt-2 space-y-6 max-w-7xl text-slate-700 dark:text-slate-300">
      
      {/* Background Blurs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Title Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 dark:from-[#111620]/60 dark:via-[#182030]/40 dark:to-[#111620]/60 border border-slate-200 dark:border-white/5 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
              <CalendarIcon size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                Holiday Master Configurator
              </h1>
              <p className="text-slate-400 font-medium text-xs">
                Configure company holidays, manage financial periods, and customize weekend days.
              </p>
            </div>
          </div>
        </div>
        
        {/* FY & Add Button */}
        <div className="flex flex-wrap items-center gap-4 relative z-10">
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 px-4 py-2.5 rounded-2xl shadow-inner">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Financial Year</span>
            <select
              value={financialYear}
              onChange={(e) => setFinancialYear(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer pr-2"
            >
              {financialYears.map(fy => (
                <option key={fy} value={fy} className="bg-white dark:bg-[#111620] text-slate-800 dark:text-white font-bold">{fy}</option>
              ))}
            </select>
          </div>

          {isSuperAdmin ? (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-white/10 rounded-2xl text-white text-[12px] font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_4px_20px_rgba(79,70,229,0.3)] transition-all"
            >
              <Plus size={14} /> Add Holiday
            </motion.button>
          ) : (
            <Badge color="blue" size="md">View-Only Access</Badge>
          )}
        </div>
      </div>

      {/* STATISTICS BANNER UPGRADE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        {[
          { label: 'Total Holidays', value: holidayStats.total, icon: <CalendarDays className="text-indigo-400" size={20} />, gradient: 'from-indigo-500/10 to-blue-500/5' },
          { label: 'Full Day Holidays', value: holidayStats.full, icon: <Award className="text-blue-400" size={20} />, gradient: 'from-blue-500/10 to-teal-500/5' },
          { label: 'Half Day Holidays', value: holidayStats.half, icon: <Star className="text-amber-400" size={20} />, gradient: 'from-amber-500/10 to-orange-500/5' },
          { label: 'Weekend Days', value: holidayStats.weekend, icon: <Settings className="text-slate-400" size={20} />, gradient: 'from-slate-500/10 to-slate-500/5' }
        ].map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -2 }}
            className={`p-4 bg-gradient-to-br ${stat.gradient} border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-between shadow-lg`}
          >
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{stat.label}</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white block">{isLoading ? '...' : stat.value}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex items-center justify-center shrink-0">
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 dark:border-white/5 gap-2 relative z-10 overflow-x-auto pb-px">
        {[
          { id: 'list', label: 'Holiday Roster', icon: <Clipboard size={14} /> },
          { id: 'calendar', label: 'Interactive Calendar', icon: <CalendarIcon size={14} /> },
          { id: 'weekends', label: 'Weekend Settings', icon: <Settings size={14} /> },
          { id: 'audit', label: 'Audit Trail Logs', icon: <History size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? 'border-indigo-500 text-indigo-600 dark:text-white bg-indigo-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-black/[0.01] dark:hover:bg-white/[0.01]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content card */}
      <div className="glass-card rounded-[2rem] border border-slate-200 dark:border-white/5 p-6 shadow-2xl relative z-10 min-h-[450px]">
        
        {/* TAB 1: HOLIDAY ROSTER */}
        {activeTab === 'list' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-md font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  Holiday Listing
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  View and manage all corporate holidays and weekend logs defined for FY {financialYear}.
                </p>
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* View Switcher Toggle */}
                <div className="flex items-center bg-slate-100 dark:bg-[#181f2b] p-1.5 rounded-xl border border-slate-200 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-[#111620] text-indigo-600 dark:text-indigo-400 shadow-md shadow-black/5'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                    title="Table View"
                  >
                    <LayoutList size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white dark:bg-[#111620] text-indigo-600 dark:text-indigo-400 shadow-md shadow-black/5'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}
                    title="Grid View"
                  >
                    <Grid size={15} />
                  </button>
                </div>

                {/* Search */}
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Search holidays and weekends..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-bold"
                  />
                </div>
              </div>
            </div>

            {isLoading && holidays.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest animate-pulse">Fetching records...</span>
              </div>
            ) : (
              <div className="space-y-8">
                {/* SUBSECTION 1: CORPORATE HOLIDAYS */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <span>🗓️ Corporate & Public Holidays</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-600 dark:text-indigo-300">
                      {filteredCorporateHolidays.length} entries
                    </span>
                  </h4>
                  
                  {filteredCorporateHolidays.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 dark:bg-[#181f2b]/20 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
                      <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">No corporate holidays registered</p>
                    </div>
                  ) : viewMode === 'table' ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#181f2b]/20">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-100/50 dark:bg-white/[0.01]">
                            <th className="py-4 px-6">Date</th>
                            <th className="py-4 px-6">Day of Week</th>
                            <th className="py-4 px-6">Holiday Name</th>
                            <th className="py-4 px-6">Type</th>
                            <th className="py-4 px-6">Description</th>
                            {isSuperAdmin && <th className="py-4 px-6 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/[0.02]">
                          {filteredCorporateHolidays.map((holiday) => {
                            const hDate = new Date(holiday.date);
                            return (
                              <tr key={holiday._id || holiday.id} className="group hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-all">
                                <td className="py-4 px-6 font-bold text-slate-800 dark:text-white text-[13px]">
                                  {hDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                </td>
                                <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-semibold text-xs">
                                  {hDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })}
                                </td>
                                <td className="py-4 px-6 font-bold text-slate-800 dark:text-white text-[13px]">
                                  {holiday.name}
                                </td>
                                <td className="py-4 px-6">
                                  <Badge color={holiday.type === 'half' ? 'yellow' : 'indigo'} size="sm">
                                    {holiday.type === 'half' ? 'Half Day' : 'Full Day'}
                                  </Badge>
                                </td>
                                <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-medium text-xs max-w-xs truncate">
                                  {holiday.description || '-'}
                                </td>
                                {isSuperAdmin && (
                                  <td className="py-4 px-6 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        onClick={() => handleOpenEdit(holiday)}
                                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-indigo-500/10 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-xl border border-slate-200 dark:border-white/5 transition-colors cursor-pointer"
                                        title="Edit Holiday"
                                      >
                                        <Edit2 size={13} />
                                      </button>
                                      <button
                                        onClick={() => handleOpenDelete(holiday)}
                                        className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-xl border border-slate-200 dark:border-white/5 transition-colors cursor-pointer"
                                        title="Remove Holiday"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* GRID VIEW MODE */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredCorporateHolidays.map((holiday) => {
                        const hDate = new Date(holiday.date);
                        const day = hDate.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'UTC' });
                        const month = hDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
                        const weekday = hDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
                        return (
                          <motion.div
                            key={holiday._id || holiday.id}
                            whileHover={{ y: -3, scale: 1.01 }}
                            className="p-5 bg-slate-50/50 dark:bg-[#181f2b]/20 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-between gap-4 transition-all relative group shadow-sm hover:shadow-md"
                          >
                            {/* Calendar Plate Design */}
                            <div className="w-16 h-18 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col items-center shrink-0 shadow-inner">
                              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white w-full py-1 text-[9px] font-black text-center tracking-widest uppercase">
                                {month}
                              </div>
                              <div className="flex-1 flex items-center justify-center text-lg font-black text-slate-800 dark:text-white">
                                {day}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge color={holiday.type === 'half' ? 'yellow' : 'indigo'} size="sm">
                                  {holiday.type === 'half' ? 'Half Day' : 'Full Day'}
                                </Badge>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{weekday}</span>
                              </div>
                              <h4 className="text-sm font-black text-slate-800 dark:text-white truncate leading-snug">{holiday.name}</h4>
                              <p className="text-slate-550 dark:text-slate-450 font-medium text-xs truncate mt-0.5" title={holiday.description}>
                                {holiday.description || 'No description provided.'}
                              </p>
                            </div>

                            {/* Action buttons on hover */}
                            {isSuperAdmin && (
                              <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-white/5 shadow-md z-20">
                                <button
                                  onClick={() => handleOpenEdit(holiday)}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button
                                  onClick={() => handleOpenDelete(holiday)}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-red-500/10 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SUBSECTION 2: WEEKENDS ROSTER */}
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/5">
                  <h4 className="text-sm font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <span>⚙️ Weekend Days Roster</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-500/10 rounded-full border border-slate-500/20 text-slate-600 dark:text-slate-300">
                      {filteredWeekendHolidays.length} entries
                    </span>
                  </h4>
                  
                  {filteredWeekendHolidays.length === 0 ? (
                    <div className="py-12 text-center bg-slate-50 dark:bg-[#181f2b]/20 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
                      <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">No weekend roster entries found</p>
                    </div>
                  ) : viewMode === 'table' ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#181f2b]/20">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-100/50 dark:bg-white/[0.01]">
                            <th className="py-4 px-6">Date</th>
                            <th className="py-4 px-6">Day of Week</th>
                            <th className="py-4 px-6">Holiday Name</th>
                            <th className="py-4 px-6">Type</th>
                            <th className="py-4 px-6">Description</th>
                            {isSuperAdmin && <th className="py-4 px-6 text-right">Roster Status</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/[0.02]">
                          {filteredWeekendHolidays.map((holiday) => {
                            const hDate = new Date(holiday.date);
                            return (
                              <tr key={holiday._id || holiday.id} className="group hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-all">
                                <td className="py-4 px-6 font-bold text-slate-800 dark:text-white text-[13px]">
                                  {hDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                                </td>
                                <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-semibold text-xs">
                                  {hDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' })}
                                </td>
                                <td className="py-4 px-6 font-bold text-slate-800 dark:text-white text-[13px]">
                                  {holiday.name}
                                </td>
                                <td className="py-4 px-6">
                                  <Badge color={holiday.type === 'weekend' ? 'slate' : 'yellow'} size="sm">
                                    {holiday.type === 'weekend' ? 'Full Weekend' : 'Half Weekend'}
                                  </Badge>
                                </td>
                                <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-medium text-xs max-w-xs truncate">
                                  {holiday.description || '-'}
                                </td>
                                {isSuperAdmin && (
                                  <td className="py-4 px-6 text-right">
                                    <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider italic">Auto Roster</span>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    /* GRID VIEW MODE */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredWeekendHolidays.map((holiday) => {
                        const hDate = new Date(holiday.date);
                        const day = hDate.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'UTC' });
                        const month = hDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
                        const weekday = hDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
                        return (
                          <motion.div
                            key={holiday._id || holiday.id}
                            whileHover={{ y: -3, scale: 1.01 }}
                            className="p-5 bg-slate-50/50 dark:bg-[#181f2b]/20 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center justify-between gap-4 transition-all relative group shadow-sm hover:shadow-md"
                          >
                            {/* Calendar Plate Design */}
                            <div className="w-16 h-18 rounded-xl bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col items-center shrink-0 shadow-inner">
                              <div className="bg-gradient-to-r from-slate-600 to-slate-500 text-white w-full py-1 text-[9px] font-black text-center tracking-widest uppercase">
                                {month}
                              </div>
                              <div className="flex-1 flex items-center justify-center text-lg font-black text-slate-800 dark:text-white">
                                {day}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge color={holiday.type === 'weekend' ? 'slate' : 'yellow'} size="sm">
                                  {holiday.type === 'weekend' ? 'Full Weekend' : 'Half Weekend'}
                                </Badge>
                                <span className="text-[10px] text-slate-550 dark:text-slate-400 font-bold uppercase tracking-wider">{weekday}</span>
                              </div>
                              <h4 className="text-sm font-black text-slate-800 dark:text-white truncate leading-snug">{holiday.name}</h4>
                              <p className="text-slate-550 dark:text-slate-455 font-medium text-xs truncate mt-0.5" title={holiday.description}>
                                {holiday.description || 'Auto-generated weekend day.'}
                              </p>
                            </div>

                            {/* Action indicator */}
                            <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest italic shrink-0">
                              Auto
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {/* TAB 2: INTERACTIVE CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Interactive Holiday Calendar
                </h3>
                <p className="text-slate-505 dark:text-slate-400 text-xs mt-0.5">
                  Visual representation of configured holidays. Select months below.
                </p>
              </div>
              
              {/* Switchers */}
              <div className="flex items-center gap-3 bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-2.5 shadow-inner">
                <button 
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-black text-slate-800 dark:text-white min-w-[120px] text-center uppercase tracking-widest">
                  {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                  className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Grid days */}
            <div className="grid grid-cols-7 gap-2 border-b border-slate-200 dark:border-white/5 pb-2 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50/50 dark:bg-white/[0.01] rounded-lg py-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Calendar list */}
            <div className="grid grid-cols-7 gap-2">
              {getCalendarDays().map(({ date, isCurrentMonth }, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                const holiday = holidayByDateMap.get(dateStr);
                const isToday = new Date().toDateString() === date.toDateString();

                let cellBg = 'bg-slate-100/40 hover:bg-slate-200/50 dark:bg-[#181f2b]/40 dark:hover:bg-[#181f2b]/70';
                let textStyle = isCurrentMonth ? 'text-slate-700 dark:text-slate-300' : 'text-slate-450 dark:text-slate-600';
                let borderStyle = 'border border-slate-200 dark:border-white/5';
                
                if (isToday) {
                  borderStyle = 'border-2 border-indigo-500 shadow-lg';
                }

                if (holiday) {
                  if (holiday.type === 'weekend') {
                    cellBg = 'bg-slate-550/[0.04] dark:bg-slate-500/[0.04] hover:bg-slate-500/[0.08]';
                    textStyle = isCurrentMonth ? 'text-slate-600 dark:text-slate-400 font-bold' : 'text-slate-450 dark:text-slate-600';
                  } else if (holiday.type === 'half-weekend') {
                    cellBg = 'bg-slate-550/[0.04] dark:bg-slate-500/[0.04] hover:bg-slate-500/[0.08]';
                    borderStyle = 'border border-dashed border-yellow-500/25';
                    textStyle = isCurrentMonth ? 'text-yellow-600 dark:text-yellow-400 font-bold' : 'text-yellow-700/60';
                  } else if (holiday.type === 'half') {
                    cellBg = 'bg-yellow-500/[0.04] hover:bg-yellow-500/[0.08]';
                    borderStyle = 'border border-yellow-500/25';
                    textStyle = isCurrentMonth ? 'text-yellow-600 dark:text-yellow-400 font-bold animate-pulse' : 'text-yellow-700/60';
                  } else {
                    cellBg = 'bg-indigo-500/[0.04] hover:bg-indigo-500/[0.08]';
                    borderStyle = 'border border-indigo-500/30';
                    textStyle = isCurrentMonth ? 'text-indigo-650 dark:text-indigo-400 font-black' : 'text-indigo-700/60';
                  }
                }

                return (
                  <motion.div 
                    key={idx} 
                    whileHover={{ y: -1 }}
                    className={`min-h-[95px] rounded-2xl p-3 transition-all flex flex-col justify-between select-none relative overflow-hidden ${cellBg} ${borderStyle}`}
                  >
                    <span className={`text-[12px] font-black ${textStyle}`}>{date.getDate()}</span>
                    
                    {holiday && (
                      <div className="mt-2 text-[9px] truncate max-w-full font-bold uppercase tracking-wider leading-none py-1 px-1.5 rounded bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 text-center text-slate-800 dark:text-white">
                        {holiday.name}
                        {holiday.type === 'half-weekend' && <span className="text-yellow-600 dark:text-yellow-500 block text-[8px] mt-0.5">Half Weekend</span>}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: WEEKEND SETTINGS (UPGRADED WITH HALF DAY DROPDOWN) */}
        {activeTab === 'weekends' && (
          <div className="space-y-6 max-w-4xl animate-fadeIn">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider">
                Weekend Schedule Editor
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                Toggle days off and configure them as Full Day or Half Day weekends for FY {financialYear}.
              </p>
            </div>

            {/* Config list of days */}
            <div className="space-y-3 pt-2">
              {dayNames.map((name, idx) => {
                const configItem = weekendConfigDays.find(c => c.day === idx);
                const isSelected = !!configItem;
                const weekendType = configItem ? configItem.type : 'full';

                return (
                  <motion.div
                    key={name}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none ${
                      isSelected 
                        ? 'bg-indigo-500/[0.03] border-indigo-500/20 text-indigo-900 dark:text-white' 
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-[#181f2b]/60 dark:border-white/5 dark:text-slate-400 dark:hover:bg-[#181f2b] dark:hover:text-slate-300'
                    }`}
                  >
                    {/* Left: Checkbox & Name */}
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => handleWeekendDayToggle(idx)}>
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                        isSelected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-300 dark:border-slate-700'
                      }`}>
                        {isSelected && <span className="text-[10px] font-black">✓</span>}
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">{name}</span>
                    </div>

                    {/* Right: Full vs Half Selector (only when active) */}
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mr-2">Weekend Scope</span>
                        <div className="flex bg-slate-100 border border-slate-200 dark:bg-[#181f2b] dark:border-white/5 p-1 rounded-xl">
                          <button
                            type="button"
                            onClick={() => handleWeekendTypeChange(idx, 'full')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              weekendType === 'full' 
                                ? 'bg-indigo-500 text-white shadow-lg' 
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-250'
                            }`}
                          >
                            Full Day
                          </button>
                          <button
                            type="button"
                            onClick={() => handleWeekendTypeChange(idx, 'half')}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              weekendType === 'half' 
                                ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 font-bold shadow-lg' 
                                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-250'
                            }`}
                          >
                            Half Day
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Info warning */}
            <div className="flex items-start gap-4 p-4.5 bg-slate-100 dark:bg-[#181f2b]/60 border border-slate-200 dark:border-white/5 rounded-2xl text-slate-550 dark:text-slate-400 mt-6">
              <Info size={24} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-800 dark:text-white block">Auto-Generation Actions</span>
                <span className="leading-relaxed block font-medium">
                  Saving the configuration and selecting **"Apply & Generate Weekends"** will automatically write weekend and half-weekend entries in the corporate calendar database for FY {financialYear} (from April 1st to March 31st).
                  Existing weekend entries for this FY will be overridden. Manual holidays will be preserved.
                </span>
              </div>
            </div>

            {/* Buttons */}
            {isSuperAdmin ? (
              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-200 dark:border-white/5">
                <Button
                  onClick={() => handleSaveWeekendConfig(false)}
                  disabled={isSubmitting}
                  variant="secondary"
                >
                  Save Config Only
                </Button>
                <Button
                  onClick={() => handleSaveWeekendConfig(true)}
                  isLoading={isSubmitting}
                >
                  Apply & Generate Weekends
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic mt-2">
                * Weekend configurations can only be updated by a Super Administrator.
              </p>
            )}
          </div>
        )}

        {/* TAB 4: AUDIT TRAIL LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-md font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Audit Logs Trail
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                  Historical log of all modifications made to holidays and configurations.
                </p>
              </div>
              
              {/* Search Logs */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Search logs details..."
                  value={auditSearchTerm}
                  onChange={(e) => {
                    setAuditSearchTerm(e.target.value);
                    fetchAuditLogs('', e.target.value);
                  }}
                  className="w-full bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-bold"
                />
              </div>
            </div>

            {isLoading && auditLogs.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-20 text-center bg-slate-50 dark:bg-[#181f2b]/40 rounded-3xl border border-dashed border-slate-200 dark:border-white/5 flex flex-col items-center justify-center">
                <History className="text-slate-400 dark:text-slate-600 mb-3" size={40} />
                <p className="text-slate-500 dark:text-slate-350 font-bold text-xs uppercase tracking-wider">No audit logs recorded</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-[#181f2b]/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-100/50 dark:bg-white/[0.01]">
                      <th className="py-4 px-6">Timestamp</th>
                      <th className="py-4 px-6">Action</th>
                      <th className="py-4 px-6">Performed By</th>
                      <th className="py-4 px-6">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/[0.02]">
                    {auditLogs.map((log) => (
                      <tr key={log._id || log.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-all">
                        <td className="py-4 px-6 text-slate-555 dark:text-slate-400 font-bold text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-4 px-6">
                          <Badge 
                            color={
                              log.action === 'CREATE' ? 'green' : 
                              log.action === 'UPDATE' ? 'blue' : 
                              log.action === 'DELETE' ? 'red' : 'purple'
                            }
                            size="sm"
                          >
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800 dark:text-white text-[13px]">
                          <div>{log.performedBy?.name || 'System'}</div>
                          <div className="text-[10px] text-slate-500 font-semibold font-mono">{log.performedBy?.email}</div>
                        </td>
                        <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium text-xs leading-relaxed max-w-md">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CREATE & EDIT HOLIDAY MODAL */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={() => setModalMode(null)}
        title={modalMode === 'create' ? 'Add Corporate Holiday' : 'Edit Holiday Record'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {formError && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl font-bold text-sm">
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Holiday Title *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Christmas, Independence Day"
              required
              className="font-bold text-[14px]"
            />
          </div>

          {/* Date Picker & Type Dropdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                Holiday Date *
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(p => ({ ...p, date: e.target.value }))}
                required
                className="font-bold text-[14px]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                Holiday Scope *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(p => ({ ...p, type: e.target.value }))}
                className="w-full bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/50 font-bold"
              >
                <option value="full" className="bg-white dark:bg-[#181f2b] text-slate-800 dark:text-white">Full Day Holiday</option>
                <option value="half" className="bg-white dark:bg-[#181f2b] text-slate-800 dark:text-white">Half Day Holiday</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Detailed Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Provide context or notes about this holiday..."
              className="w-full min-h-[100px] bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-xl p-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-bold placeholder:text-slate-400 dark:placeholder:text-slate-650 shadow-inner"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-white/5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalMode(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              {modalMode === 'create' ? 'Create Holiday' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={modalMode === 'delete'}
        onClose={() => setModalMode(null)}
        title="Remove Holiday Record"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-650 dark:text-red-400">
            <ShieldAlert size={28} className="shrink-0 pt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black text-sm uppercase tracking-wide">Danger Zone Protocol</h4>
              <p className="text-xs leading-relaxed font-medium">
                You are deleting the holiday record <strong className="text-slate-800 dark:text-white">'{selectedHoliday?.name}'</strong> configured on {selectedHoliday && new Date(selectedHoliday.date).toLocaleDateString()}. 
                This action will take effect immediately in all attendance calculations.
              </p>
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl font-bold text-sm">
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalMode(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteSubmit}
              isLoading={isSubmitting}
            >
              Remove Holiday
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
