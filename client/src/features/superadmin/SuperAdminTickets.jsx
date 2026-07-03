import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../api/mockAxios';
import { useTicketStore } from '../../store/useTicketStore';
import { useClientStore } from '../../store/useClientStore';
import { useDepartmentStore } from '../../store/useDepartmentStore';
import { useConsultantStore } from '../../store/useConsultantStore';
import { Button } from '../../components/Button';
import Badge from '../../components/ui/Badge';
import CreateTicketConsultantModal from '../../components/ui/CreateTicketConsultantModal';
import TicketViewerModal from '../../components/ui/TicketViewerModal';
import { Ticket, Search, Filter, Plus, RefreshCw, AlertCircle, Clock, CheckCircle, ChevronLeft, ChevronRight, Paperclip, XCircle, Download } from 'lucide-react';

export default function SuperAdminTickets() {
  const { tickets, fetchTickets, forwardTicket, isLoading: ticketsLoading } = useTicketStore();
  const { clients, fetchClients } = useClientStore();
  const { departments, fetchDepartments } = useDepartmentStore();

  const [searchParams] = useSearchParams();
  const initStatus = searchParams.get('status') || 'all';
  const ticketIdFromUrl = searchParams.get('ticketId');

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ client: 'all', department: 'all', status: initStatus, priority: 'all', consultant: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { consultants, fetchConsultants } = useConsultantStore();
  const [forwardingTicket, setForwardingTicket] = useState(null);
  const [modalConsultantId, setModalConsultantId] = useState('');
  const [modalRemarks, setModalRemarks] = useState('');
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      const response = await api.get('/tickets/export/csv', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers if possible, or fallback to default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `tickets_${new Date().toISOString().split('T')[0]}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading tickets CSV:', error);
      alert('Failed to download tickets CSV: ' + (error.response?.data?.message || error.message));
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    if (ticketIdFromUrl && tickets.length > 0) {
      const foundTicket = tickets.find(t => t.id === ticketIdFromUrl || t.ticketNumber === ticketIdFromUrl);
      if (foundTicket) {
        setSelectedTicket(foundTicket);
      }
    }
  }, [ticketIdFromUrl, tickets]);

  useEffect(() => {
    fetchTickets();
    fetchClients();
    fetchDepartments();
    fetchConsultants().catch(err => console.error('Error fetching consultants:', err));
  }, [fetchTickets, fetchClients, fetchDepartments]);

  // Derived Stats
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => ['open', 'pending'].includes(t.status?.toLowerCase())).length;
    const onHold = tickets.filter(t => ['on hold', 'hold'].includes(t.status?.toLowerCase())).length;
    const cancelled = tickets.filter(t => t.status?.toLowerCase() === 'cancelled').length;
    const resolved = tickets.filter(t => ['resolved', 'closed'].includes(t.status?.toLowerCase())).length;
    return { total, open, onHold, cancelled, resolved };
  }, [tickets]);

  // Filter Logic
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const o = t.original || {};
      const matchesSearch = !searchQuery || 
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesClient = filters.client === 'all' || t.clientId === filters.client;
      const matchesDepartment = filters.department === 'all' || o.department === filters.department || o.department?._id === filters.department;
      const matchesStatus = filters.status === 'all' || t.status?.toLowerCase() === filters.status.toLowerCase();
      const matchesPriority = filters.priority === 'all' || t.priority?.toLowerCase() === filters.priority.toLowerCase();
      const matchesConsultant = filters.consultant === 'all' || 
        (filters.consultant === 'unassigned' && !o.assignedTo) || 
        (o.assignedTo?._id === filters.consultant || o.assignedTo?.id === filters.consultant);

      return matchesSearch && matchesClient && matchesDepartment && matchesStatus && matchesPriority && matchesConsultant;
    });
  }, [tickets, searchQuery, filters]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTickets.length / ticketsPerPage) || 1;
  const currentTickets = filteredTickets.slice((currentPage - 1) * ticketsPerPage, currentPage * ticketsPerPage);

  const getPriorityColor = (p) => {
    switch(p?.toLowerCase()) {
      case 'high': case 'critical': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getStatusColor = (s) => {
    switch(s?.toLowerCase()) {
      case 'open': case 'pending': return 'red';
      case 'on hold': case 'hold': return 'yellow';
      case 'cancelled': return 'gray';
      case 'resolved': return 'green';
      default: return 'gray';
    }
  };

  return (
    <div className="w-full relative font-sans min-h-screen pt-4">
      {/* Header Container */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 mb-2">
            <Ticket className="text-[#ED1B2F]" size={32} /> Ticket Management
          </h1>
          <p className="text-slate-400 font-medium">Monitoring {stats.total} total tickets • {stats.open} open • {stats.onHold} on hold • {stats.cancelled} cancelled</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadCSV} disabled={downloading} className="py-2.5 bg-white/5 border border-white/10 hover:bg-white/10">
            <Download size={16} className={downloading ? 'animate-pulse' : ''} /> {downloading ? 'Downloading...' : 'Download CSV'}
          </Button>
          <Button variant="outline" onClick={fetchTickets} disabled={ticketsLoading} className="py-2.5 bg-white/5 border border-white/10 hover:bg-white/10">
            <RefreshCw size={16} className={ticketsLoading ? 'animate-spin' : ''} /> {ticketsLoading ? 'Scanning...' : 'Sync Tickets'}
          </Button>
           <button onClick={() => setShowCreateModal(true)} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            <Plus size={16} strokeWidth={3} /> Create Ticket
          </button>
        </div>
      </div>      {/* System Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8 relative z-10">
        <motion.div 
          onClick={() => { setFilters(p => ({ ...p, status: 'all' })); setCurrentPage(1); }}
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`relative bg-[#111620]/80 backdrop-blur-xl border p-4 sm:p-6 rounded-2xl flex items-center gap-4 shadow-xl cursor-pointer transition-all duration-300 ${
            filters.status === 'all' 
              ? 'border-blue-500/40 bg-blue-500/5 shadow-[0_0_25px_rgba(59,130,246,0.12)]' 
              : 'border-white/5 hover:bg-white/5 hover:border-white/10'
          }`}
        >
          {filters.status === 'all' && (
            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse" />
          )}
          <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 transition-all duration-300 ${
            filters.status === 'all' ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-blue-500/20 text-blue-500'
          }`}>
            <Ticket size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">{stats.total}</div>
            <div className="text-slate-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest mt-0.5">Total Tickets</div>
          </div>
        </motion.div>

        <motion.div 
          onClick={() => { setFilters(p => ({ ...p, status: 'open' })); setCurrentPage(1); }}
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`relative bg-[#111620]/80 backdrop-blur-xl border p-4 sm:p-6 rounded-2xl flex items-center gap-4 shadow-xl cursor-pointer transition-all duration-300 ${
            filters.status === 'open' 
              ? 'border-red-500/40 bg-red-500/5 shadow-[0_0_25px_rgba(239,68,68,0.12)]' 
              : 'border-white/5 hover:bg-white/5 hover:border-white/10'
          }`}
        >
          {filters.status === 'open' && (
            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" />
          )}
          <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 transition-all duration-300 ${
            filters.status === 'open' ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-red-500/20 text-red-500'
          }`}>
            <AlertCircle size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">{stats.open}</div>
            <div className="text-slate-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest mt-0.5">Open Tickets</div>
          </div>
        </motion.div>

        <motion.div 
          onClick={() => { setFilters(p => ({ ...p, status: 'on hold' })); setCurrentPage(1); }}
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`relative bg-[#111620]/80 backdrop-blur-xl border p-4 sm:p-6 rounded-2xl flex items-center gap-4 shadow-xl cursor-pointer transition-all duration-300 ${
            filters.status === 'on hold' 
              ? 'border-amber-500/40 bg-amber-500/5 shadow-[0_0_25px_rgba(245,158,11,0.12)]' 
              : 'border-white/5 hover:bg-white/5 hover:border-white/10'
          }`}
        >
          {filters.status === 'on hold' && (
            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" />
          )}
          <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 transition-all duration-300 ${
            filters.status === 'on hold' ? 'bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]' : 'bg-amber-500/20 text-amber-500'
          }`}>
            <Clock size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">{stats.onHold}</div>
            <div className="text-slate-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest mt-0.5">On Hold</div>
          </div>
        </motion.div>

        <motion.div 
          onClick={() => { setFilters(p => ({ ...p, status: 'cancelled' })); setCurrentPage(1); }}
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`relative bg-[#111620]/80 backdrop-blur-xl border p-4 sm:p-6 rounded-2xl flex items-center gap-4 shadow-xl cursor-pointer transition-all duration-300 ${
            filters.status === 'cancelled' 
              ? 'border-slate-500/40 bg-slate-500/5 shadow-[0_0_25px_rgba(148,163,184,0.12)]' 
              : 'border-white/5 hover:bg-white/5 hover:border-white/10'
          }`}
        >
          {filters.status === 'cancelled' && (
            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-slate-400 shadow-[0_0_10px_rgba(148,163,184,0.8)] animate-pulse" />
          )}
          <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 transition-all duration-300 ${
            filters.status === 'cancelled' ? 'bg-slate-500 text-white shadow-[0_0_15px_rgba(148,163,184,0.4)]' : 'bg-slate-500/20 text-slate-400'
          }`}>
            <XCircle size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">{stats.cancelled}</div>
            <div className="text-slate-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest mt-0.5">Cancelled</div>
          </div>
        </motion.div>

        <motion.div 
          onClick={() => { setFilters(p => ({ ...p, status: 'resolved' })); setCurrentPage(1); }}
          whileHover={{ y: -3, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className={`relative bg-[#111620]/80 backdrop-blur-xl border p-4 sm:p-6 rounded-2xl flex items-center gap-4 shadow-xl cursor-pointer transition-all duration-300 ${
            filters.status === 'resolved' 
              ? 'border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_25px_rgba(16,185,129,0.12)]' 
              : 'border-white/5 hover:bg-white/5 hover:border-white/10'
          }`}
        >
          {filters.status === 'resolved' && (
            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-pulse" />
          )}
          <div className={`p-2.5 sm:p-3 rounded-xl shrink-0 transition-all duration-300 ${
            filters.status === 'resolved' ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-emerald-500/20 text-emerald-500'
          }`}>
            <CheckCircle size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">{stats.resolved}</div>
            <div className="text-slate-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest mt-0.5">Resolved Tickets</div>
          </div>
        </motion.div>
      </div>

       {/* Module Hub Container */}
      <div className="bg-[#111620]/80 backdrop-blur-2xl border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-8 shadow-2xl relative overflow-hidden min-h-[600px] flex flex-col">
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] pointer-events-none rounded-full" />
        
        {/* Filtering Mechanics */}
        <div className="bg-[#181f2b]/80 border border-white/5 rounded-2xl p-4 mb-6 relative z-10 flex flex-col gap-4">
           {/* Omnisearch */}
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
             <input type="text" placeholder="Search tickets..." value={searchQuery} onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}} className="w-full bg-[#111620] border border-white/5 rounded-xl pl-12 pr-6 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 shadow-inner font-medium text-sm transition-all" />
           </div>

           {/* Filter Params Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <select value={filters.client} onChange={e => {setFilters(p=>({...p, client: e.target.value})); setCurrentPage(1);}} className="bg-[#111620] border border-white/5 rounded-xl px-4 py-3 text-white text-[13px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner truncate">
                <option value="all">Any Client</option>
                {clients.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
              <select value={filters.department} onChange={e => {setFilters(p=>({...p, department: e.target.value})); setCurrentPage(1);}} className="bg-[#111620] border border-white/5 rounded-xl px-4 py-3 text-white text-[13px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner truncate">
                <option value="all">Any Department</option>
                {departments.map(d => <option key={d.id || d._id} value={d.id || d._id}>{d.name}</option>)}
              </select>
              <select value={filters.consultant} onChange={e => {setFilters(p=>({...p, consultant: e.target.value})); setCurrentPage(1);}} className="bg-[#111620] border border-white/5 rounded-xl px-4 py-3 text-white text-[13px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner truncate">
                <option value="all">Any Assigned Consultant</option>
                <option value="unassigned">Unassigned Only</option>
                {consultants.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
              <select value={filters.status} onChange={e => {setFilters(p=>({...p, status: e.target.value})); setCurrentPage(1);}} className="bg-[#111620] border border-white/5 rounded-xl px-4 py-3 text-white text-[13px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner">
                <option value="all">All Statuses</option>
                <option value="open">Open Tickets</option>
                <option value="on hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
                <option value="resolved">Resolved Tickets</option>
              </select>
              <select value={filters.priority} onChange={e => {setFilters(p=>({...p, priority: e.target.value})); setCurrentPage(1);}} className="bg-[#111620] border border-white/5 rounded-xl px-4 py-3 text-white text-[13px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner">
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
           </div>
        </div>

        {/* Database Table Matrix */}
        <div className="overflow-x-auto relative z-10 flex-1">
          <table className="w-full text-left">
            <thead className="bg-[#181f2b]/80 border-b border-white/5">
              <tr>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-tl-xl border-b border-white/5 whitespace-nowrap">Ticket ID</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 min-w-[250px]">Ticket Info</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 whitespace-nowrap">Client</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 whitespace-nowrap">Status</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 whitespace-nowrap">Priority</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 whitespace-nowrap">Department</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 whitespace-nowrap">Assigned To</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 whitespace-nowrap">Hours</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-tr-xl border-b border-white/5 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {ticketsLoading && currentTickets.length === 0 ? (
                 <tr><td colSpan="9" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Loading tickets...</td></tr>
               ) : currentTickets.length === 0 ? (
                 <tr><td colSpan="9" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest">No matching tickets found.</td></tr>
               ) : currentTickets.map((t, i) => (
                 <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} key={t.id || t._id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-pointer" onClick={() => setSelectedTicket(t)}>
                    <td className="p-4 text-[11px] font-black text-slate-400">{t.ticketNumber}</td>
                    <td className="p-4">
                       <span className="font-bold text-[14px] text-white flex items-center gap-2 truncate mb-1 group-hover:text-blue-400 transition-colors">
                         {t.title}
                         {t.attachments?.length > 0 && <Paperclip size={14} className="text-blue-400 shrink-0" />}
                       </span>
                       <span className="text-[12px] text-slate-500 font-medium truncate block max-w-[320px]">{t.description}</span>
                    </td>
                    <td className="p-4"><Badge color="blue" size="sm" className="max-w-[120px] truncate">{t.clientName || 'N/A'}</Badge></td>
                    <td className="p-4"><Badge color={getStatusColor(t.status)} size="sm">{t.status}</Badge></td>
                    <td className="p-4"><span className={`text-[11px] font-black uppercase tracking-wider ${getPriorityColor(t.priority)==='red'?'text-red-400':getPriorityColor(t.priority)==='yellow'?'text-yellow-400':'text-emerald-400'}`}>{t.priority}</span></td>
                    <td className="p-4 text-[12px] font-bold text-slate-300 flex items-center gap-1.5"><Badge color="purple" size="sm" className="max-w-[120px] truncate">{t.department}</Badge></td>
                    <td className="p-4">
                       {t.assignee ? (
                         <div className="flex items-center gap-2">
                           <div className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-[10px] border border-blue-500/30 shrink-0 font-bold">{t.assignee.charAt(0).toUpperCase()}</div>
                           <span className="text-[12px] font-bold text-slate-300 truncate max-w-[120px]">{t.assignee}</span>
                         </div>
                       ) : (
                         <span className="text-[11px] text-slate-500 font-bold italic">Unassigned</span>
                       )}
                    </td>
                    <td className="p-4">
                       <div className="flex items-center gap-1.5 text-blue-400 font-black text-[13px]">
                         <Clock size={12}/>
                         {t.workLogs?.reduce((acc, l) => acc + (l.hours || 0), 0).toFixed(1)}h
                       </div>
                    </td>
                    <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }} className="text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-transparent shadow-sm hover:border-white/10 uppercase tracking-widest transition-all">View</button>
                         {t.status !== 'Resolved' && (
                           <button 
                             onClick={(e) => { 
                               e.stopPropagation(); 
                               setForwardingTicket(t); 
                             }} 
                             className="text-[10px] font-bold text-amber-400 hover:text-white bg-amber-500/10 px-3 py-1.5 rounded-lg border border-transparent shadow-sm hover:border-amber-500/20 uppercase tracking-widest transition-all"
                           >
                             Forward
                           </button>
                         )}
                       </div>
                    </td>
                 </motion.tr>
               ))}
            </tbody>
          </table>
        </div>

        {/* Temporal Pagination Drive */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-4 relative z-10">
             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Showing {currentTickets.length} of {filteredTickets.length} Tickets</span>
             <div className="flex items-center gap-2 bg-[#181f2b]/80 border border-white/5 p-1 rounded-xl">
               <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all font-bold"><ChevronLeft size={16}/></button>
               <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-black text-white bg-blue-600 shadow-inner">{currentPage}</span>
               <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all font-bold"><ChevronRight size={16}/></button>
             </div>
          </div>
        )}
      </div>

       {/* Active Modals */}
       <CreateTicketConsultantModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
       <TicketViewerModal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} ticket={selectedTicket} />

       {/* Forward Ticket Modal */}
       {forwardingTicket && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
           <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" onClick={() => setForwardingTicket(null)} />
           <div className="bg-[#111620] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative z-10 space-y-4">
             <h3 className="text-lg font-black text-white flex items-center gap-2">
               <RefreshCw size={18} className="text-amber-500" /> Forward Ticket #{forwardingTicket.ticketNumber}
             </h3>
             <div className="space-y-4">
               <div className="flex flex-col gap-1.5">
                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Select Consultant to Forward To</label>
                 <select
                   value={modalConsultantId}
                   onChange={(e) => setModalConsultantId(e.target.value)}
                   className="bg-[#181f2b] border border-white/5 rounded-xl px-3.5 py-2.5 text-white text-[12px] font-bold focus:outline-none focus:border-blue-500/50 cursor-pointer w-full"
                 >
                   <option value="">-- Choose Consultant --</option>
                   {consultants.filter(c => c.status === 'active').map(consultant => (
                     <option key={consultant._id || consultant.id} value={consultant._id || consultant.id}>
                       {consultant.name} ({consultant.email})
                     </option>
                   ))}
                 </select>
               </div>
               <div className="flex flex-col gap-1.5">
                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Remarks</label>
                 <textarea
                   placeholder="Reason for forwarding..."
                   value={modalRemarks}
                   onChange={(e) => setModalRemarks(e.target.value)}
                   className="bg-[#181f2b] border border-white/5 rounded-xl p-3 text-[12px] text-white focus:outline-none focus:border-blue-500/50 min-h-[80px] resize-none w-full"
                 />
               </div>
               <div className="flex justify-end gap-3 pt-2">
                 <button onClick={() => setForwardingTicket(null)} className="px-4 py-2 text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                 <button
                   onClick={async () => {
                     if (!modalConsultantId) return alert('Please select a consultant first.');
                     setIsModalSubmitting(true);
                     try {
                       await forwardTicket(forwardingTicket.original?._id || forwardingTicket.id, modalConsultantId, modalRemarks);
                       setForwardingTicket(null);
                       setModalConsultantId('');
                       setModalRemarks('');
                       alert('Ticket forwarded successfully!');
                     } catch (err) {
                       alert(err.response?.data?.message || 'Failed to forward ticket.');
                     } finally {
                       setIsModalSubmitting(false);
                     }
                   }}
                   disabled={isModalSubmitting || !modalConsultantId}
                   className="px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-xl text-white text-[11px] font-black uppercase tracking-widest disabled:opacity-50 transition-all cursor-pointer"
                 >
                   {isModalSubmitting ? 'Forwarding...' : 'Forward'}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
    </div>
  );
}
