import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Clock, AlertCircle, CheckCircle2, User, HelpCircle, 
  ChevronLeft, ChevronRight, Calendar, Power, Edit3, Check, X, Shield, Search, Info
} from 'lucide-react';
import { useAttendanceStore } from '../../store/useAttendanceStore';
import { useAuthStore } from '../../store/useAuthStore';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const statusColors = {
  present: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  absent: 'bg-red-500/10 border-red-500/20 text-red-400',
  holiday: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
  'half-day-holiday': 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  weekend: 'bg-slate-500/10 border-slate-500/10 text-slate-400',
  'half-weekend': 'bg-amber-500/[0.04] border-dashed border-amber-500/25 text-amber-400/90',
  leave: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  future: 'bg-[#181f2b] border-white/5 text-slate-600'
};

const statusLabels = {
  present: 'Present',
  absent: 'Absent',
  holiday: 'Holiday',
  'half-day-holiday': 'Half Day Holiday',
  weekend: 'Full Weekend',
  'half-weekend': 'Half Day Weekend',
  leave: 'On Leave',
  pending: 'Pending Check-In',
  future: 'Future'
};

export default function AttendanceDashboard() {
  const { user } = useAuthStore();
  const { 
    attendanceList, summary, leaves, myLeaves, isLoading, error, 
    checkIn, checkOut, fetchMonthlySummary, requestLeave, fetchMyLeaves, fetchAllLeaves, approveLeave 
  } = useAttendanceStore();

  const isSuperAdmin = user?.role === 'Super Admin' || user?.role === 'superadmin';
  const isConsultant = user?.role === 'Consultant' || user?.role === 'Admin';
  const isApprover = isSuperAdmin || isConsultant;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [remarks, setRemarks] = useState('');
  
  // Tabs
  const [activeTab, setActiveTab] = useState(isConsultant ? 'leaves' : 'attendance');
  
  // Leave request form
  const [leaveForm, setLeaveForm] = useState({
    startDate: '',
    endDate: '',
    type: 'casual',
    reason: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Leave approvals filters
  const [approvalStatus, setApprovalStatus] = useState('');
  const [approvalSearch, setApprovalSearch] = useState('');

  // Live stopwatch timer ref & state
  const [timerString, setTimerString] = useState('00:00:00');
  const timerIntervalRef = useRef(null);

  // Fetch summary when month changes
  useEffect(() => {
    fetchMonthlySummary(null, currentDate.getFullYear(), currentDate.getMonth() + 1);
  }, [fetchMonthlySummary, currentDate]);

  // Fetch leaves when changing tabs
  useEffect(() => {
    if (activeTab === 'leaves') {
      fetchMyLeaves();
    } else if (activeTab === 'approvals' && isApprover) {
      fetchAllLeaves(approvalStatus, approvalSearch);
    }
  }, [activeTab, fetchMyLeaves, fetchAllLeaves, isApprover, approvalStatus, approvalSearch]);

  // Today's attendance record
  const todayRecord = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return attendanceList.find(a => a.date === todayStr);
  }, [attendanceList]);

  // Setup stopwatch timer if checked in but not checked out
  useEffect(() => {
    if (todayRecord && todayRecord.status === 'present' && todayRecord.checkIn && !todayRecord.checkOut) {
      const startTime = new Date(todayRecord.checkIn).getTime();
      
      const updateTimer = () => {
        const diff = Date.now() - startTime;
        if (diff < 0) return;
        
        const hrs = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        
        const pad = (n) => String(n).padStart(2, '0');
        setTimerString(`${pad(hrs)}:${pad(mins)}:${pad(secs)}`);
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);
    } else {
      setTimerString('00:00:00');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [todayRecord]);

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    const res = await checkIn(remarks);
    if (res.success) {
      showToast('Checked in successfully!');
      setRemarks('');
    } else {
      alert(res.message);
    }
  };

  const handleCheckOut = async () => {
    if (isLoading) return;
    const res = await checkOut();
    if (res.success) {
      showToast('Checked out successfully!');
    } else {
      alert(res.message);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!leaveForm.startDate || !leaveForm.endDate || !leaveForm.reason) {
      setFormError('All fields are required.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await requestLeave(leaveForm);
      if (res.success) {
        showToast('Leave request submitted successfully!');
        setLeaveForm({
          startDate: '',
          endDate: '',
          type: 'casual',
          reason: ''
        });
      } else {
        setFormError(res.message || 'Failed to submit leave.');
      }
    } catch (err) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveLeave = async (id, status) => {
    if (isLoading) return;
    const res = await approveLeave(id, status);
    if (res.success) {
      showToast(`Leave request has been ${status}.`);
    } else {
      alert('Failed to update leave request status');
    }
  };

  // Calendar Helpers
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();

    const days = [];
    
    // Fillers for previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevTotalDays - i), isCurrentMonth: false });
    }

    // Days in current month
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Fillers for next month
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  const attendanceByDateMap = useMemo(() => {
    const map = new Map();
    attendanceList.forEach(item => {
      map.set(item.date, item);
    });
    return map;
  }, [attendanceList]);

  return (
    <div className="w-full relative font-sans min-h-screen pt-2 space-y-6 max-w-7xl text-slate-300">
      
      {/* Title Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-gradient-to-r from-[#111620]/60 via-[#182030]/40 to-[#111620]/60 border border-white/5 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -right-20 -top-20 w-60 h-60 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20 animate-pulse">
              <ClipboardList size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                {isConsultant ? 'My Leaves & Request Center' : 'My Attendance & Leave Console'}
              </h1>
              <p className="text-slate-400 font-medium text-xs">
                {isConsultant 
                  ? 'Request sick/vacation days, track request histories, and manage team approvals.' 
                  : 'Log arrivals, check durations, request sick/vacation days, and track work configurations.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl font-bold text-sm relative z-50 shadow-lg"
          >
            <CheckCircle2 size={16} /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily check in & dynamic metrics */}
      {!isConsultant && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          
          {/* check in card */}
          <div className="lg:col-span-2 bg-[#111620]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col justify-between min-h-[240px]">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} className="text-indigo-500 animate-spin-slow" /> Arrival & Departure Terminal
              </h3>
              
              {todayRecord && todayRecord.status === 'present' ? (
                <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Active Log Registered</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Arrival Time</span>
                        <span className="text-xl font-black text-white">
                          {new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {todayRecord.checkOut && (
                        <div>
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Departure Time</span>
                          <span className="text-xl font-black text-white">
                            {new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* stopwatch timer */}
                  {!todayRecord.checkOut && (
                    <div className="bg-[#181f2b] border border-indigo-500/20 px-8 py-5 rounded-2xl flex flex-col items-center shadow-lg relative overflow-hidden shrink-0">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" />
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Session Stopwatch</span>
                      <span className="text-3xl font-mono font-black text-white">{timerString}</span>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleCheckIn} className="mt-5 space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-lg">
                    Terminal inactive. Register your check-in timestamp by providing optional remarks and clicking Check In.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
                    <Input
                      type="text"
                      placeholder="Check-in remarks (e.g. home office, client site)"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="font-bold text-xs py-2.5 px-4"
                    />
                    <Button type="submit" isLoading={isLoading} className="px-6 py-2.5 shrink-0">
                      <Power size={14} className="mr-1.5" /> Check In
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {todayRecord && todayRecord.status === 'present' && !todayRecord.checkOut && (
              <div className="pt-4 border-t border-white/5 flex justify-end">
                <Button onClick={handleCheckOut} isLoading={isLoading} variant="danger" className="px-6 py-2.5">
                  <Power size={14} className="mr-1.5" /> Check Out
                </Button>
              </div>
            )}
          </div>

          {/* Stats card */}
          <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Monthly Attendance Metrics
              </h3>
              
              {summary ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#181f2b]/40 border border-white/5 rounded-2xl text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Working Days</span>
                    <span className="text-lg font-black text-white">{summary.workingDays}</span>
                  </div>
                  <div className="p-3 bg-[#181f2b]/40 border border-white/5 rounded-2xl text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Present</span>
                    <span className="text-lg font-black text-emerald-400">{summary.present}</span>
                  </div>
                  <div className="p-3 bg-[#181f2b]/40 border border-white/5 rounded-2xl text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Absent</span>
                    <span className="text-lg font-black text-red-400">{summary.absent}</span>
                  </div>
                  <div className="p-3 bg-[#181f2b]/40 border border-white/5 rounded-2xl text-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Holidays</span>
                    <span className="text-lg font-black text-indigo-400">{summary.holidays}</span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-500 font-medium">No calculations data.</div>
              )}
            </div>

            <div className="text-[9px] text-slate-500 font-black uppercase tracking-widest pt-3 border-t border-white/5 flex justify-between">
              <span>Weekends: {summary?.weekends || 0}</span>
              <span>Leaves taken: {summary?.leave || 0}</span>
            </div>
          </div>

        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-white/5 gap-2 relative z-10 overflow-x-auto pb-px">
        {[
          ...(!isConsultant ? [{ id: 'attendance', label: 'Attendance logs', icon: <Calendar size={14} /> }] : []),
          { id: 'leaves', label: 'Leaves Center', icon: <Edit3 size={14} /> },
          ...(isApprover ? [{ id: 'approvals', label: 'Supervisor Approvals', icon: <Shield size={14} /> }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-indigo-500 text-white bg-indigo-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.01]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab contents */}
      <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative z-10 min-h-[420px]">
        
        {/* TAB 1: ATTENDANCE LOGS */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  Attendance History Grid
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Visual daily log detailing holidays, weekends (full and half), and check-in statuses.
                </p>
              </div>

              {/* Month Selector */}
              <div className="flex items-center gap-3 bg-[#181f2b] border border-white/5 rounded-2xl px-4 py-2.5 shadow-inner">
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-black text-white min-w-[120px] text-center uppercase tracking-widest">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Grid days */}
            <div className="grid grid-cols-7 gap-2 border-b border-white/5 pb-2 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/[0.01] rounded-lg py-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Calendar */}
            <div className="grid grid-cols-7 gap-2">
              {getCalendarDays().map(({ date, isCurrentMonth }, idx) => {
                const dateStr = date.toISOString().split('T')[0];
                const dayRecord = attendanceByDateMap.get(dateStr);
                const isToday = new Date().toDateString() === date.toDateString();

                let cellBg = 'bg-[#181f2b]/40 hover:bg-[#181f2b]/70 border-white/5';
                let textStyle = isCurrentMonth ? 'text-slate-300' : 'text-slate-600';
                let statusLabelText = '';
                
                if (dayRecord) {
                  cellBg = statusColors[dayRecord.status] || cellBg;
                  textStyle = isCurrentMonth ? 'text-white font-bold' : textStyle;
                  statusLabelText = dayRecord.holidayName || statusLabels[dayRecord.status] || '';
                } else if (!isCurrentMonth) {
                  cellBg = statusColors.future;
                } else if (date > new Date()) {
                  cellBg = statusColors.future;
                }

                return (
                  <motion.div 
                    key={idx} 
                    whileHover={{ y: -1 }}
                    className={`min-h-[85px] rounded-2xl p-2.5 transition-all flex flex-col justify-between border select-none relative ${cellBg} ${
                      isToday ? 'ring-2 ring-indigo-500 shadow-md' : ''
                    }`}
                  >
                    <span className={`text-[12px] font-black ${textStyle}`}>{date.getDate()}</span>
                    
                    {statusLabelText && (
                      <div className="text-[9px] font-bold uppercase tracking-wider text-center mt-2 leading-tight truncate px-1 rounded bg-white/5 py-0.5 border border-white/5 text-white">
                        {statusLabelText}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Legend Upgrade */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#10b981]/10 border border-emerald-500/20 inline-block" /> Present</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#ef4444]/10 border border-red-500/20 inline-block" /> Absent</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#6366f1]/10 border border-indigo-500/20 inline-block" /> Holiday</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#eab308]/10 border border-yellow-500/20 inline-block" /> Half Day Holiday</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#8b5cf6]/10 border border-purple-500/20 inline-block" /> Leaves</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#64748b]/10 border border-slate-500/20 inline-block" /> Weekend</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#f59e0b]/5 border border-dashed border-amber-500/25 inline-block" /> Half Weekend</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#f59e0b]/10 border border-amber-500/20 inline-block" /> Today (Pending)</span>
            </div>
          </div>
        )}

        {/* TAB 2: LEAVES CENTER */}
        {activeTab === 'leaves' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left: Leave Form */}
            <div className="lg:col-span-1 bg-[#181f2b]/40 border border-white/5 rounded-2xl p-5 space-y-4 shadow-lg">
              <div>
                <h3 className="text-md font-bold text-white uppercase tracking-wider">
                  Apply for Leave
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Submit a leave request. Approval updates will reflect in your calendar.
                </p>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl font-bold text-xs">
                  <AlertCircle size={14} className="shrink-0" /> {formError}
                </div>
              )}

              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm(p => ({ ...p, startDate: e.target.value }))}
                    required
                    className="font-bold text-[13px] py-2 px-3"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    End Date *
                  </label>
                  <Input
                    type="date"
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm(p => ({ ...p, endDate: e.target.value }))}
                    required
                    className="font-bold text-[13px] py-2 px-3"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Leave Type *
                  </label>
                  <select
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full bg-[#181f2b] border border-white/5 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/50 font-bold"
                  >
                    <option value="casual" className="bg-[#181f2b] text-white">Casual Leave</option>
                    <option value="sick" className="bg-[#181f2b] text-white">Sick Leave</option>
                    <option value="earned" className="bg-[#181f2b] text-white">Earned Leave</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Reason Details *
                  </label>
                  <textarea
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm(p => ({ ...p, reason: e.target.value }))}
                    placeholder="Provide details..."
                    required
                    className="w-full min-h-[80px] bg-[#181f2b] border border-white/5 text-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium placeholder:text-slate-600 shadow-inner"
                  />
                </div>

                <Button type="submit" isLoading={isSubmitting} className="w-full py-2">
                  Submit Request
                </Button>
              </form>
            </div>

            {/* Right: Request History list */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-md font-bold text-white uppercase tracking-wider">
                My Requests History
              </h3>
              
              {isLoading && myLeaves.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : myLeaves.length === 0 ? (
                <div className="py-16 text-center bg-[#181f2b]/40 rounded-3xl border border-dashed border-white/5 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  No leave requests logged
                </div>
              ) : (
                <div className="space-y-3 max-h-[450px] overflow-y-auto custom-scrollbar pr-2">
                  {myLeaves.map(leave => (
                    <motion.div 
                      key={leave._id || leave.id} 
                      whileHover={{ scale: 1.005 }}
                      className="p-4 bg-[#181f2b]/40 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-white/10 transition-colors shadow-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-black text-white uppercase tracking-wider">
                            {leave.type} Leave
                          </span>
                          <Badge 
                            color={
                              leave.status === 'approved' ? 'green' : 
                              leave.status === 'rejected' ? 'red' : 'yellow'
                            }
                            size="sm"
                          >
                            {leave.status}
                          </Badge>
                        </div>
                        
                        <p className="text-[11px] text-slate-400 font-semibold">
                          Date Range: {new Date(leave.startDate).toLocaleDateString([], { timeZone: 'UTC' })} to {new Date(leave.endDate).toLocaleDateString([], { timeZone: 'UTC' })}
                        </p>
                        <p className="text-xs text-slate-400 italic font-medium">
                          "{leave.reason}"
                        </p>
                      </div>

                      <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider">
                        Submitted: {new Date(leave.createdAt).toLocaleDateString()}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LEAVE APPROVALS */}
        {activeTab === 'approvals' && isApprover && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  Employee Leave Request Queue
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Approve or reject leave requests submitted by staff members.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <select
                  value={approvalStatus}
                  onChange={(e) => setApprovalStatus(e.target.value)}
                  className="bg-[#181f2b] border border-white/5 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/50 font-bold"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>

                <div className="relative w-full md:w-60">
                  <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
                  <input
                    type="text"
                    placeholder="Search employee..."
                    value={approvalSearch}
                    onChange={(e) => setApprovalSearch(e.target.value)}
                    className="w-full bg-[#181f2b] border border-white/5 text-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {isLoading && leaves.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : leaves.length === 0 ? (
              <div className="py-20 text-center bg-[#181f2b]/40 rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center">
                <CheckCircle2 className="text-slate-600 mb-3" size={40} />
                <p className="text-slate-300 font-bold text-sm uppercase tracking-wider">No leave requests logged</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-[#181f2b]/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/[0.01]">
                      <th className="py-4 px-6">Employee</th>
                      <th className="py-4 px-6">Leave Range</th>
                      <th className="py-4 px-6">Type</th>
                      <th className="py-4 px-6">Reason Details</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {leaves.map(leave => (
                      <tr key={leave._id || leave.id} className="hover:bg-white/[0.01] transition-all">
                        <td className="py-4 px-6 font-bold text-white text-[13px]">
                          <div>{leave.user?.name || 'Unknown'}</div>
                          <div className="text-[10px] text-slate-500 font-semibold font-mono">
                            {leave.user?.employeeCode || 'No Code'} | {leave.user?.role}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-300 font-semibold text-xs">
                          {new Date(leave.startDate).toLocaleDateString([], { timeZone: 'UTC' })} to {new Date(leave.endDate).toLocaleDateString([], { timeZone: 'UTC' })}
                        </td>
                        <td className="py-4 px-6">
                          <Badge color="slate" size="sm">
                            {leave.type}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-slate-400 font-medium text-xs max-w-xs truncate" title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td className="py-4 px-6">
                          <Badge 
                            color={
                              leave.status === 'approved' ? 'green' : 
                              leave.status === 'rejected' ? 'red' : 'yellow'
                            }
                            size="sm"
                          >
                            {leave.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {leave.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveLeave(leave._id || leave.id, 'approved')}
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/20 transition-colors"
                                title="Approve Request"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                onClick={() => handleApproveLeave(leave._id || leave.id, 'rejected')}
                                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-colors"
                                title="Reject Request"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-600 font-black uppercase tracking-wider italic">Processed</span>
                          )}
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

    </div>
  );
}
