import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket, Clock, CheckCircle, AlertCircle, Building2, Paperclip, XCircle, Star, Award, TrendingUp } from 'lucide-react';
import { useTicketStore } from '../../store/useTicketStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import api from '../../api/mockAxios';
import Badge from '../../components/ui/Badge';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import SuperAdminDashboard from '../superadmin/SuperAdminDashboard';
import { useThemeStore } from '../../store/useThemeStore';

const formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const ActivityTimeline = ({ activities }) => {
    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-[#111620]/80 backdrop-blur-xl p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 h-full shadow-2xl relative overflow-hidden"
        >
            <div className="absolute -left-10 bottom-0 w-60 h-60 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />
            
            <h3 className="text-lg font-bold text-white tracking-tight mb-8 relative z-10">Recent Activity</h3>
            <div className="space-y-7 relative z-10">
                {activities.length === 0 ? (
                  <div className="text-slate-500 text-sm italic py-10 text-center">No recent activity detected.</div>
                ) : activities.map((item, i) => (
                    <div key={i} className="flex gap-5 relative group">
                        {i !== activities.length - 1 && <div className="absolute left-[11px] top-8 bottom-[-20px] w-[2px] bg-white/5 group-hover:bg-blue-500/20 transition-colors"></div>}
                        <div className="w-6 h-6 rounded-full bg-[#181f2b] border border-white/10 flex items-center justify-center z-10 mt-0.5 shadow-md">
                            {item.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-bold text-white tracking-tight truncate">{item.title}</p>
                            <p className="text-[13px] text-slate-400 mt-1 truncate">{item.desc}</p>
                            <p className="text-[11px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">{item.time}</p>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

const NoticeBoard = ({ notifications, markAsRead, downloadAttachment }) => {
  const [expandedNotice, setExpandedNotice] = React.useState(null);

  const activeNotices = notifications.slice(0, 5); // display up to 5 latest notices

  if (activeNotices.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05, duration: 0.4 }}
      className="mb-8 bg-gradient-to-r from-blue-900/10 via-indigo-950/10 to-slate-900/10 border border-blue-500/10 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden"
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

const colorMap = {
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', glow: 'bg-blue-600/20 group-hover:bg-blue-500/30' },
  red: { bg: 'bg-red-500/20', text: 'text-red-400', glow: 'bg-red-600/20 group-hover:bg-red-500/30' },
  yellow: { bg: 'bg-orange-500/20', text: 'text-orange-400', glow: 'bg-orange-600/20 group-hover:bg-orange-500/30' },
  green: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', glow: 'bg-emerald-600/20 group-hover:bg-emerald-500/30' },
  gray: { bg: 'bg-slate-500/20', text: 'text-slate-400', glow: 'bg-slate-600/20 group-hover:bg-slate-500/30' }
};

const StatCard = ({ title, value, icon, color, delay, onClick }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    whileHover={{ y: -5 }}
    onClick={onClick}
    className={`bg-[#111620]/80 backdrop-blur-xl p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-xl ${onClick ? 'cursor-pointer hover:border-white/10 hover:bg-white/[0.02] transition-all duration-300' : ''}`}
  >
    <div className={`absolute -right-4 -top-4 w-40 h-40 ${colorMap[color].glow} rounded-full blur-[50px] transition-all duration-500`}></div>
    <div className="flex justify-between items-start relative z-10">
      <div>
        <h3 className="text-slate-400 text-[13px] font-bold uppercase tracking-widest mb-1">{title}</h3>
        <h2 className="text-4xl font-black text-white tracking-tight">{value}</h2>
      </div>
      <div className={`p-3.5 rounded-2xl ${colorMap[color].bg} ${colorMap[color].text} shadow-lg backdrop-blur-md`}>
        {icon}
      </div>
    </div>
  </motion.div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { tickets } = useTicketStore();
  const { user } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';
  
  if (user?.role === 'Super Admin' || user?.role === 'superadmin') {
    return <SuperAdminDashboard />;
  }

  if (user?.role === 'Consultant' || user?.role === 'consultant') {
    return <Navigate to="/consultant" replace />;
  }
  
  const { notifications, fetchNotifications, markAsRead, downloadAttachment } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // States for Solved Ticket Review Popup
  const [showAutoReviewModal, setShowAutoReviewModal] = React.useState(false);
  const [reviewTicket, setReviewTicket] = React.useState(null);
  const [rating, setRating] = React.useState(5);
  const [comment, setComment] = React.useState('');
  const [submittingFeedback, setSubmittingFeedback] = React.useState(false);
  const [feedbackError, setFeedbackError] = React.useState('');
  const [feedbackSuccess, setFeedbackSuccess] = React.useState(false);
  const [handledTicketIds, setHandledTicketIds] = React.useState(() => {
    try {
      const stored = sessionStorage.getItem('handled_reviews');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (e) {
      return new Set();
    }
  });

  const unreviewedSolvedTicket = React.useMemo(() => {
    if (!tickets || !user) return null;
    return tickets.find(t => {
      const ticketId = t.original?._id || t.id || t._id;
      if (handledTicketIds.has(ticketId)) return false;

      const isOwner = t.creatorId === user.id || t.creatorId === user._id || t.user === user.name;
      const isSolved = ['resolved', 'closed'].includes(t.status?.toLowerCase());
      const hasNoRating = !t.feedback || (!t.feedback.rating && !t.original?.feedback?.rating);
      return isOwner && isSolved && hasNoRating;
    });
  }, [tickets, user, handledTicketIds]);

  useEffect(() => {
    if (unreviewedSolvedTicket) {
      const ticketId = unreviewedSolvedTicket.original?._id || unreviewedSolvedTicket.id || unreviewedSolvedTicket._id;
      const currentReviewId = reviewTicket?.original?._id || reviewTicket?.id || reviewTicket?._id;
      
      if (ticketId !== currentReviewId) {
        setReviewTicket(unreviewedSolvedTicket);
        setShowAutoReviewModal(true);
        setRating(5);
        setComment('');
        setFeedbackSuccess(false);
        setFeedbackError('');
      }
    } else {
      setShowAutoReviewModal(false);
      setReviewTicket(null);
    }
  }, [unreviewedSolvedTicket, reviewTicket]);

  const dismissModal = () => {
    if (reviewTicket) {
      const ticketId = reviewTicket.original?._id || reviewTicket.id || reviewTicket._id;
      setHandledTicketIds(prev => {
        const next = new Set(prev);
        next.add(ticketId);
        try {
          sessionStorage.setItem('handled_reviews', JSON.stringify(Array.from(next)));
        } catch (e) {}
        return next;
      });
    }
    setShowAutoReviewModal(false);
  };

  const handleSubmitAutoReview = async () => {
    if (!reviewTicket) return;
    setSubmittingFeedback(true);
    setFeedbackError('');
    try {
      const ticketId = reviewTicket.original?._id || reviewTicket.id || reviewTicket._id;
      await api.post(`/tickets/${ticketId}/feedback`, { rating, comment });
      
      // Update local state in Zustand store
      useTicketStore.setState(state => ({
        tickets: state.tickets.map(t => 
          (t.id === ticketId || t._id === ticketId)
            ? { ...t, feedback: { rating, comment }, original: { ...t.original, feedback: { rating, comment } } }
            : t
        )
      }));

      setFeedbackSuccess(true);
      setTimeout(() => {
        setHandledTicketIds(prev => {
          const next = new Set(prev);
          next.add(ticketId);
          try {
            sessionStorage.setItem('handled_reviews', JSON.stringify(Array.from(next)));
          } catch (e) {}
          return next;
        });
        setShowAutoReviewModal(false);
        setReviewTicket(null);
      }, 1500);
    } catch (err) {
      console.error('Feedback Error:', err);
      setFeedbackError(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const [clientData, setClientData] = React.useState(null);
  const [clientLoading, setClientLoading] = React.useState(true);
  const [clientError, setClientError] = React.useState(null);

  React.useEffect(() => {
    if (user?.role === 'User' || user?.role === 'Client User' || user?.role === 'Consultant') {
      api.get('/clients/my-client')
        .then(res => {
          if (res.data.success) setClientData(res.data.client);
        })
        .catch(err => {
          console.error('Failed to load client data:', err);
          setClientError(err.response?.data?.message || 'Failed to load client details.');
        })
        .finally(() => setClientLoading(false));
    } else {
      setClientLoading(false);
    }
  }, [user]);
  
  const dashboardTickets = React.useMemo(() => {
    return (user?.role === 'User' || user?.role === 'Client User') ? tickets.filter(t => t.creatorId === user?.id || t.user === user?.name) : tickets;
  }, [tickets, user]);

  const openTickets = dashboardTickets.filter(t => t.status === 'Open').length;
  const onHoldTickets = dashboardTickets.filter(t => t.status === 'On Hold').length;
  const cancelledTickets = dashboardTickets.filter(t => t.status === 'Cancelled').length;
  const resolvedTickets = dashboardTickets.filter(t => t.status === 'Resolved').length;

  // Dynamic priorities distribution
  const priorityDistribution = React.useMemo(() => {
    const critical = dashboardTickets.filter(t => ['critical', 'high'].includes(t.priority?.toLowerCase())).length;
    const medium = dashboardTickets.filter(t => t.priority?.toLowerCase() === 'medium').length;
    const low = dashboardTickets.filter(t => t.priority?.toLowerCase() === 'low').length;
    
    return [
      { name: 'Critical/High', value: critical, color: '#ef4444' },
      { name: 'Medium', value: medium, color: '#f59e0b' },
      { name: 'Low', value: low, color: '#10b981' }
    ].filter(p => p.value > 0);
  }, [dashboardTickets]);

  const resolutionRate = React.useMemo(() => {
    return dashboardTickets.length > 0 
      ? Math.round((resolvedTickets / dashboardTickets.length) * 100) 
      : 0;
  }, [resolvedTickets, dashboardTickets]);

  const clientReviews = React.useMemo(() => {
    return dashboardTickets
      .filter(t => t.original?.feedback?.rating)
      .map(t => t.original.feedback.rating);
  }, [dashboardTickets]);

  const averageRating = React.useMemo(() => {
    if (clientReviews.length === 0) return '—';
    const sum = clientReviews.reduce((acc, r) => acc + r, 0);
    return (sum / clientReviews.length).toFixed(1);
  }, [clientReviews]);

  // Dynamic Weekly Volume Data
  const weeklyData = React.useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({ name: days[d.getDay()], tickets: 0, fullDate: d.toISOString().split('T')[0] });
    }

    dashboardTickets.forEach(t => {
      const tDate = new Date(t.createdAt).toISOString().split('T')[0];
      const day = last7Days.find(d => d.fullDate === tDate);
      if (day) day.tickets++;
    });

    return last7Days;
  }, [dashboardTickets]);

  // Dynamic Recent Activity
  const recentActivities = React.useMemo(() => {
    const acts = [];
    dashboardTickets.forEach(t => {
      // Creation event
      acts.push({
        title: 'Ticket Created',
        desc: t.title,
        time: formatRelativeTime(t.createdAt),
        rawTime: new Date(t.createdAt),
        icon: <Ticket size={16} className="text-purple-400" />
      });

      // Resolution event
      if (t.status === 'Resolved' && t.updatedAt) {
        acts.push({
          title: 'Ticket Resolved',
          desc: t.title,
          time: formatRelativeTime(t.updatedAt),
          rawTime: new Date(t.updatedAt),
          icon: <CheckCircle size={16} className="text-emerald-400" />
        });
      }

      // Latest comment event
      const latestRemark = t.original?.remarks?.[t.original.remarks.length - 1];
      if (latestRemark) {
        acts.push({
          title: 'New Response',
          desc: latestRemark.comment,
          time: formatRelativeTime(latestRemark.createdAt),
          rawTime: new Date(latestRemark.createdAt),
          icon: <Clock size={16} className="text-blue-400" />
        });
      }
    });

    return acts
      .sort((a, b) => b.rawTime - a.rawTime)
      .slice(0, 5);
  }, [dashboardTickets]);

  return (
    <div className="w-full">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-4"
      >
        <h1 className="text-3xl font-black text-white tracking-tight">Dashboard Overview</h1>
        <p className="text-slate-400 mt-2 font-medium">Welcome back, {user?.name || 'User'}! Here's a snapshot of your current ticketing activities.</p>
      </motion.div>

      <NoticeBoard notifications={notifications} markAsRead={markAsRead} downloadAttachment={downloadAttachment} />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6 mb-8 px-1 sm:px-2">
        <StatCard 
          title="Total Tickets" 
          value={dashboardTickets.length} 
          icon={<Ticket size={24} />} 
          color="blue" 
          delay={0.1}
          onClick={() => navigate('/my-tickets?status=all')}
        />
        <StatCard 
          title="Open" 
          value={openTickets} 
          icon={<AlertCircle size={24} />} 
          color="red" 
          delay={0.15}
          onClick={() => navigate('/my-tickets?status=open')}
        />
        <StatCard 
          title="On Hold" 
          value={onHoldTickets} 
          icon={<Clock size={24} />} 
          color="yellow" 
          delay={0.2}
          onClick={() => navigate('/my-tickets?status=on hold')}
        />
        <StatCard 
          title="Cancelled" 
          value={cancelledTickets} 
          icon={<XCircle size={24} />} 
          color="gray" 
          delay={0.25}
          onClick={() => navigate('/my-tickets?status=cancelled')}
        />
        <StatCard 
          title="Resolved" 
          value={resolvedTickets} 
          icon={<CheckCircle size={24} />} 
          color="green" 
          delay={0.3}
          onClick={() => navigate('/my-tickets?status=resolved')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-1 sm:px-2">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="col-span-1 lg:col-span-2 bg-[#111620]/80 backdrop-blur-xl p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden h-fit lg:h-full"
        >
          <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
          
          <h3 className="text-lg font-bold text-white tracking-tight mb-8 relative z-10">Weekly Ticket Volume</h3>
          <div className="h-72 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff0a" : "rgba(0,0,0,0.06)"} vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} dy={10} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? 'rgba(17, 22, 32, 0.9)' : 'rgba(255, 255, 255, 0.95)', 
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', 
                    borderRadius: '16px', 
                    boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(0,0,0,0.1)', 
                    padding: '12px 20px' 
                  }}
                  itemStyle={{ color: isDark ? '#fff' : '#0f172a', fontWeight: 'bold' }}
                  formatter={(v) => [v, 'Tickets']}
                />
                <Area type="monotone" dataKey="tickets" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#colorTickets)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="col-span-1">
            <ActivityTimeline activities={recentActivities} />
        </div>
      </div>

      {/* New Analytics Row: Priorities & Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 px-1 sm:px-2">
        {/* Priority breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-[#111620]/80 backdrop-blur-xl p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute right-0 bottom-0 w-60 h-60 bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight mb-2 flex items-center gap-2">
              <Award className="text-red-550" size={20} /> Priority Distribution
            </h3>
            <p className="text-slate-500 text-xs font-semibold mb-6 uppercase tracking-wider">Severity Breakdown of Submitted Tickets</p>
          </div>

          {priorityDistribution.length === 0 ? (
            <div className="text-slate-500 text-sm italic py-12 text-center">No active tickets to analyze distribution.</div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={priorityDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(17, 22, 32, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3.5 w-full">
                {priorityDistribution.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[13px] font-bold text-slate-300">{item.name}</span>
                    </div>
                    <span className="text-sm font-black text-white">{item.value} <span className="text-slate-500 text-xs font-bold">({Math.round((item.value / dashboardTickets.length) * 100)}%)</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Performance SLA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#111620]/80 backdrop-blur-xl p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute left-0 top-0 w-60 h-60 bg-emerald-600/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight mb-2 flex items-center gap-2">
              <TrendingUp className="text-emerald-500" size={20} /> Operational SLA & Performance
            </h3>
            <p className="text-slate-500 text-xs font-semibold mb-6 uppercase tracking-wider">Metrics measuring ticket resolution efficiency</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Resolution Rate</span>
              <div className="text-2xl font-black text-emerald-400">{resolutionRate}%</div>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Percentage of resolved issues</p>
            </div>
            
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Feedback Score</span>
              <div className="text-2xl font-black text-yellow-400 flex items-center gap-1.5">
                <Star size={20} className="fill-yellow-400" />
                {averageRating}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-semibold">Average rating from reviews</p>
            </div>
          </div>

          <div className="mt-4 p-4.5 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Guaranteed First Response:</span>
            <span className="text-blue-400 font-black uppercase tracking-wider">&lt; 2 Hours SLA</span>
          </div>
        </motion.div>
      </div>

      {user?.role !== 'Super Admin' && clientLoading && (
        <div className="mt-8 mx-2 bg-[#111620]/80 backdrop-blur-xl border border-white/5 rounded-[2rem] p-8 shadow-xl flex items-center gap-4 animate-pulse">
           <Building2 className="text-slate-500" size={24} />
           <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">Loading client profile...</span>
        </div>
      )}

      {user?.role !== 'Super Admin' && !clientLoading && clientError && (
        <div className="mt-8 mx-2 bg-red-500/10 border border-red-500/20 rounded-[2rem] p-8 flex items-center gap-4">
           <AlertCircle className="text-red-500" size={24} />
           <span className="text-red-400 font-bold uppercase tracking-widest text-sm">{clientError}</span>
        </div>
      )}

      {!clientLoading && !clientError && clientData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2 mt-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[#111620]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
            <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
              <Building2 className="text-purple-400" size={20} /> Client Profile: {clientData.name}
            </h3>
            <div className="space-y-4 relative z-10">
              <div>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Base Platform</span>
                <div className="font-medium text-lg text-slate-200">
                  {clientData.erpDetails?.erpName || 'N/A'} {clientData.erpDetails?.sapB1VersionType ? `- ${clientData.erpDetails.sapB1VersionType}` : ''}
                </div>
              </div>
              {clientData.erpDetails?.sapB1VersionAndFP && (
                <div>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Version & FP</span>
                  <div className="font-medium text-slate-300 bg-white/5 px-3 py-2 rounded-lg inline-block">
                    {clientData.erpDetails.sapB1VersionAndFP}
                  </div>
                </div>
              )}
              {clientData.erpDetails?.erpIncidentTypes && clientData.erpDetails.erpIncidentTypes.length > 0 && (
                <div>
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest block mb-2">Supported Data Streams</span>
                  <div className="flex flex-wrap gap-2">
                    {clientData.erpDetails.erpIncidentTypes.map(t => (
                      <span key={t} className="text-[10px] bg-white/10 border border-white/5 text-slate-300 px-2 py-1 rounded-md font-bold uppercase">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

        {clientData?.erpDetails?.sapSupportAMC?.status && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-[#111620]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
             <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-lg">
               <Clock className="text-blue-400" size={20} /> Support Contract
             </h3>
             <div className="space-y-6 relative z-10">
               <div className="flex gap-8">
                  <div>
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Contract Status</span>
                    <Badge color={clientData.erpDetails.sapSupportAMC.status === 'Active' ? 'green' : 'red'}>
                      {clientData.erpDetails.sapSupportAMC.status}
                    </Badge>
                  </div>
                  {clientData.erpDetails.sapSupportAMCType && (
                    <div>
                      <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Support Plan</span>
                      <div className="font-bold text-slate-200">{clientData.erpDetails.sapSupportAMCType}</div>
                    </div>
                  )}
               </div>

               {clientData.erpDetails.sapSupportAMCType === 'Limited' && (clientData.erpDetails.sapSupportHourlyCap || 0) > 0 && (() => {
                 const cap = clientData.erpDetails.sapSupportHourlyCap;
                 const used = clientData.erpDetails.hoursUsed || 0;
                 const pct = Math.min(100, (used / cap) * 100);
                 const isExceeded = pct >= 100;
                 const isNearCap = pct >= 85 && !isExceeded;
                 const barColor = isExceeded ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : isNearCap ? 'bg-orange-400 shadow-[0_0_10px_rgba(251,146,60,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
                 return (
                   <div className="pt-2 space-y-4">
                     {(isExceeded || isNearCap) && (
                       <div className={`flex items-start gap-3 p-3 rounded-xl border ${isExceeded ? 'bg-red-500/10 border-red-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
                         <AlertCircle size={16} className={isExceeded ? 'text-red-400 shrink-0 mt-0.5' : 'text-orange-400 shrink-0 mt-0.5'} />
                         <p className={`text-[12px] font-bold ${isExceeded ? 'text-red-300' : 'text-orange-300'}`}>
                           {isExceeded
                             ? `⚠️ Support hours cap exceeded! You have used ${used.toFixed(1)}h of your ${cap}h limit. Please contact your support team for renewal.`
                             : `⚠️ You have used ${used.toFixed(1)}h of ${cap}h (${pct.toFixed(1)}%). You are nearing your support hour limit.`
                           }
                         </p>
                       </div>
                     )}
                     <div>
                       <div className="flex justify-between items-end mb-2">
                         <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest block">Hourly Cap Consumption</span>
                         <span className={`text-sm font-black ${isExceeded ? 'text-red-400' : isNearCap ? 'text-orange-400' : 'text-blue-400'}`}>
                           {used.toFixed(1)} <span className="text-slate-500 text-xs font-bold">/ {cap} hrs ({pct.toFixed(1)}%)</span>
                         </span>
                       </div>
                       <div className="w-full h-3 bg-white/5 border border-white/5 rounded-full overflow-hidden">
                         <div 
                           className={`h-full transition-all duration-1000 ${barColor}`} 
                           style={{ width: `${pct}%` }} 
                         />
                       </div>
                       <div className="flex justify-between mt-1">
                         <span className="text-[10px] text-slate-600 font-bold">0 hrs</span>
                         <span className="text-[10px] text-slate-600 font-bold">{cap} hrs</span>
                       </div>
                     </div>
                   </div>
                 );
               })()}
             </div>
          </motion.div>
        )}
      </div>
      )}
      
      <AnimatePresence>
        {showAutoReviewModal && reviewTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={dismissModal}
              className={`absolute inset-0 z-40 backdrop-blur-sm ${isDark ? 'bg-slate-950/80' : 'bg-slate-900/40'}`}
            />

            {/* Modal Content Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden z-50 border transition-colors duration-300 ${
                isDark 
                  ? 'bg-[#111620] border-white/10' 
                  : 'bg-white border-slate-200 shadow-slate-200/50'
              }`}
            >
              {/* Premium Top Highlight Border */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500" />
              
              {/* Close Button in corner */}
              <button
                onClick={dismissModal}
                className={`absolute top-4 right-4 p-2 rounded-xl transition-all focus:outline-none ${
                  isDark 
                    ? 'text-slate-400 hover:text-white hover:bg-white/5' 
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                }`}
                title="Dismiss"
              >
                <XCircle size={20} />
              </button>

              {isDark && (
                <>
                  <div className="absolute -right-20 -top-20 w-60 h-60 bg-yellow-500/10 blur-[80px] rounded-full pointer-events-none" />
                  <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-amber-600/10 blur-[80px] rounded-full pointer-events-none" />
                </>
              )}

              <div className="text-center relative z-10 mt-2">
                {/* Glowing Star Header Icon */}
                <div className={`w-16 h-16 rounded-2xl border text-yellow-400 flex items-center justify-center mx-auto mb-6 relative ${
                  isDark 
                    ? 'bg-gradient-to-tr from-yellow-500/20 to-amber-500/10 border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.15)]' 
                    : 'bg-gradient-to-tr from-yellow-500/10 to-amber-500/5 border-yellow-500/20 shadow-sm shadow-yellow-500/10'
                }`}>
                  <Star size={30} className="fill-yellow-500 animate-pulse" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                  </span>
                </div>
                
                <h3 className="text-2xl font-black tracking-tight mb-2" style={{ color: isDark ? '#ffffff' : '#0f172a' }}>
                  Rate Our Support
                </h3>
                <p className="text-[12px] font-black uppercase tracking-widest mb-4 border px-3 py-1 rounded-full inline-block" 
                   style={{ 
                     color: isDark ? '#fbbf24' : '#b45309', 
                     backgroundColor: isDark ? 'rgba(245,158,11,0.05)' : 'rgba(245,158,11,0.08)',
                     borderColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.2)' 
                   }}>
                  Ticket #{reviewTicket.ticketNumber}
                </p>
                <p className="text-[15px] font-bold mb-6 italic px-2" style={{ color: isDark ? '#cbd5e1' : '#475569' }}>
                  "{reviewTicket.title}"
                </p>

                {feedbackSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-8 border rounded-2xl text-sm font-bold flex flex-col items-center gap-3 ${
                      isDark 
                        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]' 
                        : 'bg-emerald-55 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-500/5'
                    }`}
                  >
                    <CheckCircle size={32} className="animate-bounce text-emerald-500" />
                    <span className="text-base font-black">Thank You!</span>
                    Your feedback helps us continuously improve our service quality.
                  </motion.div>
                ) : (
                  <div className="space-y-6 text-left">
                    {/* Star Rating Select */}
                    <div className="flex flex-col items-center gap-3 border p-5 rounded-2xl" 
                         style={{ 
                           backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#f8fafc',
                           borderColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9'
                         }}>
                      <span className="text-[11px] font-black uppercase tracking-widest text-center" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        How would you rate this interaction?
                      </span>
                      
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            whileHover={{ scale: 1.25, rotate: 8 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setRating(star)}
                            className="p-1 text-yellow-500 transition-colors"
                            type="button"
                          >
                            <Star 
                              size={38} 
                              className={star <= rating 
                                ? "fill-yellow-500 text-yellow-500 drop-shadow-[0_0_12px_rgba(234,179,8,0.7)]" 
                                : isDark ? "fill-transparent text-slate-700 hover:text-yellow-500/75" : "fill-transparent text-slate-300 hover:text-yellow-500/75"
                              } 
                            />
                          </motion.button>
                        ))}
                      </div>

                      {/* Dynamic Quality Indicator text */}
                      <div className="h-5 flex items-center justify-center">
                        <span className="text-[13px] font-black tracking-wider" style={{ color: isDark ? '#fbbf24' : '#d97706' }}>
                          {
                            rating === 1 ? 'Terrible 😠' :
                            rating === 2 ? 'Poor 😟' :
                            rating === 3 ? 'Average 😐' :
                            rating === 4 ? 'Very Good 🙂' :
                            'Excellent! 🌟'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Comment Field */}
                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] font-black uppercase tracking-widest" style={{ color: isDark ? '#94a3b8' : '#64748b' }}>
                        Comments or Feedback
                      </label>
                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tell us about your experience (optional)..."
                        rows={3}
                        className={`w-full border rounded-2xl p-4 text-[13px] focus:outline-none transition-all resize-none shadow-inner focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                        style={{ 
                          backgroundColor: isDark ? '#181f2b' : '#ffffff', 
                          color: isDark ? '#ffffff' : '#0f172a',
                          borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#cbd5e1'
                        }}
                      />
                    </div>

                    {feedbackError && (
                      <p className="text-red-400 text-[12px] font-bold text-center border py-2.5 px-4 rounded-xl" 
                         style={{ 
                           backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2', 
                           color: isDark ? '#f87171' : '#b91c1c',
                           borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fecaca'
                         }}>
                        {feedbackError}
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={dismissModal}
                        className={`flex-1 py-3.5 text-[13px] font-bold rounded-2xl transition-all border border-transparent focus:outline-none ${
                          isDark 
                            ? 'text-slate-400 hover:text-white hover:bg-white/5' 
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        }`}
                        disabled={submittingFeedback}
                        type="button"
                      >
                        Maybe Later
                      </button>
                      <button
                        onClick={handleSubmitAutoReview}
                        className="flex-1 py-3.5 text-[13px] font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 focus:outline-none"
                        disabled={submittingFeedback}
                        type="button"
                      >
                        {submittingFeedback ? (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          'Submit Review'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
