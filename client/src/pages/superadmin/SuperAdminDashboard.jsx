import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTicketStore } from '../../core/store/useTicketStore';
import { useCompanyStore } from '../../core/store/useCompanyStore';
import { useDepartmentStore } from '../../core/store/useDepartmentStore';
import { useUserStore } from '../../core/store/useUserStore';
import Badge from '../../components/ui/Badge';
import api from '../../core/api/mockAxios';
import { 
  Users, Ticket, Building2, TrendingUp, Calendar, CheckCircle, 
  Clock, Star, RefreshCw, ArrowUp, ArrowDown, Layers, Activity 
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { tickets, fetchTickets, isLoading: loadingTickets } = useTicketStore();
  const { companies, fetchCompanies, isLoading: loadingCompanies } = useCompanyStore();
  const { departments, fetchDepartments, isLoading: loadingDepartments } = useDepartmentStore();
  const { users, fetchUsers, isLoading: loadingUsers } = useUserStore();

  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [liveStats, setLiveStats] = useState({ avgResolutionTime: 0, avgRating: 0, totalRatings: 0 });

  const fetchLiveStats = async () => {
    try {
      const res = await api.get('/tickets/dashboard/stats');
      setLiveStats({
        avgResolutionTime: res.data.avgResolutionTime || 0,
        avgRating: res.data.avgRating || 0,
        totalRatings: res.data.totalRatings || 0
      });
    } catch (e) {
      console.error('Failed to fetch live stats:', e);
    }
  };

  const refreshAction = async () => {
    await Promise.all([fetchTickets(), fetchCompanies(), fetchDepartments(), fetchUsers(), fetchLiveStats()]);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    refreshAction();
  }, []);

  const isLoading = loadingTickets || loadingCompanies || loadingDepartments || loadingUsers;

  // Deriving Stats from Stores
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.status === 'Active' || u.status === 'active').length;
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(t => t.status === 'Open' || t.status === 'Pending').length;
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;
    const totalCompanies = companies.length;
    const totalDepartments = departments.length;

    return { totalUsers, activeUsers, totalTickets, openTickets, resolvedTickets, totalCompanies, totalDepartments,
      avgResolutionTime: liveStats.avgResolutionTime,
      avgRating: liveStats.avgRating,
      totalRatings: liveStats.totalRatings
    };
  }, [users, tickets, companies, departments, liveStats]);

  const recentTickets = useMemo(() => {
    return [...tickets].sort((a,b) => new Date(b.createdAt || b.original?.updatedAt) - new Date(a.createdAt || a.original?.updatedAt)).slice(0, 5);
  }, [tickets]);

  const recentUsers = useMemo(() => {
    return [...users].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  }, [users]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'green';
      case 'pending': return 'yellow';
      case 'resolved': return 'emerald';
      case 'open': return 'red';
      case 'closed': return 'gray';
      case 'suspended': return 'red';
      default: return 'gray';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': case 'critical': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const formatTime = (minutes) => {
    if (!minutes || minutes <= 0) return '0m';
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const deptColors = [
    'from-purple-500/20 to-blue-500/20 text-purple-400 border-purple-500/30',
    'from-red-500/20 to-orange-500/20 text-red-500 border-red-500/30',
    'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30',
    'from-yellow-500/20 to-amber-500/20 text-yellow-500 border-yellow-500/30',
    'from-indigo-500/20 to-violet-500/20 text-indigo-400 border-indigo-500/30'
  ];

  if (isLoading && tickets.length === 0 && users.length === 0) {
    return (
      <div className="w-full relative font-sans min-h-[60vh] flex flex-col items-center justify-center">
         <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center animate-pulse mb-6 border border-blue-500/30">
            <RefreshCw size={30} className="text-blue-500 animate-spin" />
         </div>
         <p className="text-slate-400 font-bold uppercase tracking-widest text-[13px]">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="w-full relative font-sans min-h-screen pt-4 space-y-6">
      {/* Overview Engine Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="text-indigo-500" size={32} /> Global Overview
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-1 flex items-center gap-2">
            <Clock size={14}/> Last Updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button onClick={refreshAction} disabled={isLoading} className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 shadow-inner transition-all disabled:opacity-50">
           <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* Hero Stats Quad */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <motion.div onClick={() => navigate('/super-admin/users')} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.05}} className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all group overflow-hidden relative cursor-pointer">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform"><Users size={80}/></div>
           <div className="flex items-center justify-between mb-4 relative z-10">
             <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shadow-inner border border-blue-500/20"><Users size={20}/></div>
             <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Active Users</span>
                <span className="text-sm font-black text-emerald-400">{stats.activeUsers} / {stats.totalUsers}</span>
             </div>
           </div>
           <h4 className="text-4xl font-black text-white mb-1 relative z-10">{stats.totalUsers}</h4>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest relative z-10 mb-4">Total Users</p>
           <div className="flex items-center gap-1.5 pt-4 border-t border-white/5 text-[11px] font-bold text-emerald-400 relative z-10">
              <ArrowUp size={12}/> Live Status: {stats.activeUsers} Online
           </div>
        </motion.div>

        <motion.div onClick={() => navigate('/super-admin/tickets')} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.1}} className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all group overflow-hidden relative cursor-pointer">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform"><Ticket size={80}/></div>
           <div className="flex items-center justify-between mb-4 relative z-10">
             <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center shadow-inner border border-red-500/20"><Ticket size={20}/></div>
             <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Open Tickets</span>
                <span className="text-sm font-black text-yellow-400">{stats.openTickets}</span>
             </div>
           </div>
           <h4 className="text-4xl font-black text-white mb-1 relative z-10">{stats.totalTickets}</h4>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest relative z-10 mb-4">Total Tickets</p>
           <div className="flex items-center gap-1.5 pt-4 border-t border-white/5 text-[11px] font-bold text-emerald-400 relative z-10">
              <CheckCircle size={12}/> Resolved: {stats.resolvedTickets} Tickets
           </div>
        </motion.div>

        <motion.div onClick={() => navigate('/super-admin/companies')} initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.15}} className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all group overflow-hidden relative cursor-pointer">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform"><Building2 size={80}/></div>
           <div className="flex items-center justify-between mb-4 relative z-10">
             <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center shadow-inner border border-purple-500/20"><Building2 size={20}/></div>
             <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Total Companies</span>
                <span className="text-sm font-black text-emerald-400">{stats.totalCompanies}</span>
             </div>
           </div>
           <h4 className="text-4xl font-black text-white mb-1 relative z-10">{stats.totalCompanies}</h4>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest relative z-10 mb-4">Total Departments</p>
           <div className="flex items-center gap-1.5 pt-4 border-t border-white/5 text-[11px] font-bold text-blue-400 relative z-10">
              <Layers size={12}/> Integrated Departments: {stats.totalDepartments}
           </div>
        </motion.div>

        <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.2}} className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all group overflow-hidden relative">
           <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 transition-transform"><Clock size={80}/></div>
           <div className="flex items-center justify-between mb-4 relative z-10">
             <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner border border-emerald-500/20"><Clock size={20}/></div>
             <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Avg Resolution</span>
                <span className="text-sm font-black text-emerald-400">{stats.resolvedTickets} Solved</span>
             </div>
           </div>
           <h4 className="text-4xl font-black text-white mb-1 relative z-10">{formatTime(stats.avgResolutionTime)}</h4>
           <p className="text-slate-500 text-xs font-bold uppercase tracking-widest relative z-10 mb-4">Avg Resolution Time</p>
           <div className="flex items-center gap-1.5 pt-4 border-t border-white/5 text-[11px] font-bold text-emerald-400 relative z-10">
              <CheckCircle size={12}/> Based on {stats.resolvedTickets} resolved tickets
           </div>
        </motion.div>
      </div>

      {/* Global Rating Wide Card */}
      <div className="relative z-10">
        <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.25}} className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-[0_4px_30px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5"><Star size={120}/></div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-yellow-500/20 text-yellow-400 rounded-2xl flex items-center justify-center shadow-inner border border-yellow-500/20 shrink-0"><Star size={28}/></div>
              <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Global User Rating</p>
                <div className="flex items-center gap-3">
                  <h4 className="text-5xl font-black text-white">{stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}</h4>
                  <div>
                    <div className="flex items-center gap-0.5 mb-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={16} className={s <= Math.round(stats.avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-white/10 fill-transparent'} />
                      ))}
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">out of 5.0</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-black text-white">{stats.totalRatings}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total Reviews</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-white">{stats.resolvedTickets}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Tickets Resolved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-400">
                  {stats.resolvedTickets > 0 ? Math.round((stats.totalRatings / stats.resolvedTickets) * 100) : 0}%
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Review Rate</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Secondary Monitor Dash */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10 w-full">
         <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
               <h4 className="text-[14px] font-black uppercase text-white tracking-widest flex items-center gap-2"><Ticket className="text-red-500" size={16}/> Recent Tickets</h4>
               <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded shadow-inner uppercase tracking-wider">{recentTickets.length} Tickets</span>
            </div>
            <div className="space-y-4 flex-1">
               {recentTickets.length > 0 ? recentTickets.map(t => (
                  <div key={t.id || t._id} className="bg-[#181f2b] p-4 rounded-xl border border-white/5 group hover:border-red-500/30 transition-all flex items-center justify-between shadow-inner">
                     <div className="flex-1 min-w-0 pr-4">
                        <div className="text-sm font-black text-white truncate mb-1 group-hover:text-red-400 transition-colors">{t.title}</div>
                        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                           ID: {t.ticketNumber} <span className="opacity-50">•</span> {t.user || 'Unknown'}
                        </div>
                     </div>
                     <div className="flex items-center gap-2 shrink-0">
                        <Badge color={getStatusColor(t.status)} size="sm">{t.status}</Badge>
                        <Badge color={getPriorityColor(t.priority)} size="sm">{t.priority}</Badge>
                     </div>
                  </div>
               )) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50"><Ticket size={32} className="mb-2"/><span className="text-[11px] font-bold uppercase tracking-widest">No Tickets Found</span></div>
               )}
            </div>
            <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-2 gap-4">
               <div onClick={() => navigate('/super-admin/tickets?status=open')} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center shadow-inner cursor-pointer hover:bg-red-500/20 transition-colors">
                  <div className="text-xl font-black text-red-500 mb-0.5">{stats.openTickets}</div>
                  <div className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Open Tickets</div>
               </div>
               <div onClick={() => navigate('/super-admin/tickets?status=resolved')} className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center shadow-inner cursor-pointer hover:bg-emerald-500/20 transition-colors">
                  <div className="text-xl font-black text-emerald-400 mb-0.5">{stats.resolvedTickets}</div>
                  <div className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Resolved Tickets</div>
               </div>
            </div>
         </div>

         <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
               <h4 className="text-[14px] font-black uppercase text-white tracking-widest flex items-center gap-2"><Users className="text-blue-500" size={16}/> Recent Users</h4>
               <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded shadow-inner uppercase tracking-wider">{recentUsers.length} Users</span>
            </div>
            <div className="space-y-4 flex-1">
               {recentUsers.length > 0 ? recentUsers.map(u => (
                  <div key={u.id || u._id} className="bg-[#181f2b] p-4 rounded-xl border border-white/5 group hover:border-blue-500/30 transition-all flex items-center justify-between shadow-inner">
                     <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600/30 to-indigo-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black shrink-0 shadow-inner">
                           {u.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                           <div className="text-[13px] font-black text-white truncate mb-1">{u.name}</div>
                           <div className="flex items-center gap-2">
                             <Badge color={getStatusColor(u.status)} size="sm">{u.status || 'Active'}</Badge>
                             <span className="text-[10px] font-bold text-blue-400 truncate uppercase tracking-widest">🏢 {u.company?.name || u.companyName || 'N/A'}</span>
                           </div>
                        </div>
                     </div>
                     <span className="text-[10px] font-bold text-slate-500 shrink-0 uppercase tracking-widest hidden sm:block bg-white/5 px-2 py-0.5 rounded shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)]">
                        {new Date(u.createdAt).toLocaleDateString()}
                     </span>
                  </div>
               )) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50"><Users size={32} className="mb-2"/><span className="text-[11px] font-bold uppercase tracking-widest">No Users Found</span></div>
               )}
            </div>
             <div className="mt-6 pt-5 border-t border-white/5 flex flex-col gap-3">
               <div onClick={() => navigate('/super-admin/users?status=active')} className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
                 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Users</span>
                 <span className="font-black text-emerald-400 text-sm">{stats.activeUsers}</span>
               </div>
               <div onClick={() => navigate('/super-admin/users')} className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded-lg border border-white/5 cursor-pointer hover:bg-white/5 transition-colors">
                 <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Users</span>
                 <span className="font-black text-white text-sm">{stats.totalUsers}</span>
               </div>
            </div>
         </div>
      </div>

       {/* Sub-Sector Layout (Departments) */}
      <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative z-10 w-full mb-8">
         <div className="flex items-center justify-between mb-6">
            <h4 className="text-[14px] font-black uppercase text-white tracking-widest flex items-center gap-2"><Layers className="text-purple-500" size={16}/> Departments Overview</h4>
            <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-3 py-1.5 rounded shadow-inner uppercase tracking-wider">{departments.length} Departments</span>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {departments.length > 0 ? departments.map((d, i) => (
                <div key={d.id || d._id} className="bg-[#181f2b] p-5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all flex flex-col shadow-inner group">
                   <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${deptColors[i%deptColors.length]} flex items-center justify-center shrink-0 border shadow-inner`}>
                         <Layers size={18} />
                      </div>
                      <div>
                         <div className="font-black text-[14px] text-white tracking-wide group-hover:text-purple-400 transition-colors uppercase">{d.name}</div>
                         <div className="text-[9px] font-bold text-emerald-500 tracking-widest uppercase">● ACTIVE DEPARTMENT</div>
                      </div>
                   </div>
                   <p className="text-[11px] text-slate-400 mb-4 line-clamp-2 font-medium leading-relaxed flex-1">
                      {d.description || 'Core unassigned logical array.'}
                   </p>
                   <div className="mt-auto">
                     <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Categories:</span>
                     <div className="flex flex-wrap gap-1.5">
                        {(d.categories || []).slice(0, 3).map((c, idx) => (
                           <span key={idx} className="px-2 py-1 bg-white/5 border border-white/10 rounded shadow-sm text-[9px] text-slate-300 font-bold uppercase">{c}</span>
                        ))}
                        {(d.categories || []).length > 3 && (
                           <span className="px-2 py-1 bg-white/5 border border-white/10 rounded shadow-sm text-[9px] text-slate-500 font-bold">+{d.categories.length-3}</span>
                        )}
                     </div>
                   </div>
                </div>
            )) : (
              <div className="col-span-full py-10 text-center"><span className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">No departments deployed.</span></div>
            )}
         </div>
      </div>

       {/* Master System Node Integrity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10 w-full pb-8">
         <div className="bg-gradient-to-br bg-[#111620] pb-2 border-b-2 border-emerald-500 p-6 rounded-2xl shadow-xl flex items-center gap-4">
            <CheckCircle className="text-emerald-500" size={36}/>
            <div>
               <div className="text-white font-black uppercase tracking-wider text-[14px]">System Status</div>
               <div className="text-emerald-400 font-bold text-[11px] uppercase tracking-widest">Online</div>
            </div>
         </div>
         <div className="bg-gradient-to-br bg-[#111620] pb-2 border-b-2 border-purple-500 p-6 rounded-2xl shadow-xl flex items-center gap-4">
            <TrendingUp className="text-purple-400" size={36}/>
            <div>
               <div className="text-white font-black uppercase tracking-wider text-[14px]">Response Time</div>
               <div className="text-purple-400 font-bold text-[11px] uppercase tracking-widest">Avg Time: {formatTime(stats.avgResolutionTime)}</div>
            </div>
         </div>
         <div className="bg-gradient-to-br bg-[#111620] pb-2 border-b-2 border-yellow-500 p-6 rounded-2xl shadow-xl flex items-center gap-4">
            <Star className="text-yellow-400" size={36}/>
            <div>
               <div className="text-white font-black uppercase tracking-wider text-[14px]">User Rating</div>
               <div className="text-yellow-400 font-bold text-[11px] uppercase tracking-widest">Average: {stats.avgRating.toFixed(1)} / 5.0</div>
            </div>
         </div>
      </div>

    </div>
  );
}
