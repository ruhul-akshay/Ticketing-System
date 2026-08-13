import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/mockAxios';
import { useTicketStore } from '../../store/useTicketStore';
import { useClientStore } from '../../store/useClientStore';
import { useDepartmentStore } from '../../store/useDepartmentStore';
import { useConsultantStore } from '../../store/useConsultantStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/Button';
import Badge from '../../components/ui/Badge';
import CreateTicketConsultantModal from '../../components/ui/CreateTicketConsultantModal';
import ConsultantTicketDetailPanel from './ConsultantTicketDetailPanel';
import { 
  Ticket, Search, Filter, Plus, RefreshCw, AlertCircle, Clock, 
  CheckCircle, ChevronLeft, ChevronRight, Paperclip, XCircle, 
  Download, ClipboardList, Building2, Loader2 
} from 'lucide-react';

export default function ConsultantKanbanBoard() {
  const { tickets, fetchTickets, forwardTicket, updateTicketStatus, isLoading: ticketsLoading } = useTicketStore();
  const { clients, fetchClients } = useClientStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const { consultants, fetchConsultants } = useConsultantStore();
  const { user } = useAuthStore();

  const isUnopened = (t) => {
    if (!user) return false;
    const openedByList = (t.openedBy || t.original?.openedBy || []).map(id => id.toString());
    const userId = (user.id || user._id)?.toString();
    return userId ? !openedByList.includes(userId) : false;
  };

  const [searchParams] = useSearchParams();
  const initStatus = searchParams.get('status') || 'all';
  const ticketIdFromUrl = searchParams.get('ticketId');

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ client: 'all', department: 'all', status: initStatus, priority: 'all' });
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'oldest'
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [dateSpecific, setDateSpecific] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [forwardingTicket, setForwardingTicket] = useState(null);
  const [modalConsultantId, setModalConsultantId] = useState('');
  const [modalRemarks, setModalRemarks] = useState('');
  const [modalCcConsultantIds, setModalCcConsultantIds] = useState([]);
  const [modalCcEmails, setModalCcEmails] = useState('');
  const [ccDropdownOpen, setCcDropdownOpen] = useState(false);
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
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `assigned_tickets_${new Date().toISOString().split('T')[0]}.csv`;
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
    fetchTickets();
    fetchClients();
    fetchDepartments();
    fetchConsultants().catch(err => console.error('Error fetching consultants:', err));
  }, [fetchTickets, fetchClients, fetchDepartments, fetchConsultants]);

  // When the forwarding modal opens, ensure consultants are loaded (force-refresh if empty)
  useEffect(() => {
    if (forwardingTicket) {
      if (consultants.length === 0) {
        fetchConsultants({ force: true }).catch(err => console.error('Failed to load consultants for forwarding:', err));
      }
    }
  }, [forwardingTicket, consultants.length, fetchConsultants]);

  useEffect(() => {
    if (ticketIdFromUrl && tickets.length > 0) {
      const foundTicket = tickets.find(t => t.id === ticketIdFromUrl || t.ticketNumber === ticketIdFromUrl);
      if (foundTicket) {
        setSelectedTicket(foundTicket);
      }
    }
  }, [ticketIdFromUrl, tickets]);

  // Derived Stats for tickets assigned to current consultant
  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter(t => ['open', 'pending', 'assigned'].includes(t.status?.toLowerCase())).length;
    const onHold = tickets.filter(t => ['on hold', 'hold'].includes(t.status?.toLowerCase())).length;
    const cancelled = tickets.filter(t => t.status?.toLowerCase() === 'cancelled').length;
    const resolved = tickets.filter(t => ['resolved', 'closed'].includes(t.status?.toLowerCase())).length;
    return { total, open, onHold, cancelled, resolved };
  }, [tickets]);

  // Filter Logic
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const o = t.original || {};
      const ticketDate = t.createdAt ? new Date(t.createdAt) : null;

      const matchesSearch = !searchQuery || 
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesClient = filters.client === 'all' || t.clientId === filters.client;
      const matchesStatus = filters.status === 'all' || t.status?.toLowerCase() === filters.status.toLowerCase();
      const matchesPriority = filters.priority === 'all' || t.priority?.toLowerCase() === filters.priority.toLowerCase();

      // Date filtering
      let matchesDate = true;
      if (dateSpecific) {
        const specific = new Date(dateSpecific);
        matchesDate = ticketDate &&
          ticketDate.getFullYear() === specific.getFullYear() &&
          ticketDate.getMonth() === specific.getMonth() &&
          ticketDate.getDate() === specific.getDate();
      } else {
        if (dateFrom) {
          const from = new Date(dateFrom);
          from.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && ticketDate && ticketDate >= from;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          to.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && ticketDate && ticketDate <= to;
        }
      }

      return matchesSearch && matchesClient && matchesStatus && matchesPriority && matchesDate;
    });
  }, [tickets, searchQuery, filters, dateFrom, dateTo, dateSpecific]);

  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [filteredTickets, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedTickets.length / ticketsPerPage) || 1;
  const currentTickets = sortedTickets.slice((currentPage - 1) * ticketsPerPage, currentPage * ticketsPerPage);

  const getPriorityColor = (p) => {
    switch(p?.toLowerCase()) {
      case 'high': case 'critical': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
      case 'critical':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'low':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    }
  };

  const formatDateTime = (dateVal) => {
    if (!dateVal) return '';
    const date = new Date(dateVal);
    const dStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const tStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${dStr} • ${tStr}`;
  };

  const formatHoursToHM = (hoursVal) => {
    const totalMinutes = Math.round(Number(hoursVal || 0) * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0 && mins > 0) {
      return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} and ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
    }
    if (hrs > 0) {
      return `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
    }
    if (mins > 0) {
      return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
    }
    return '0 hours';
  };

  const getStatusColor = (s) => {
    switch(s?.toLowerCase()) {
      case 'open': case 'pending': case 'assigned': return 'red';
      case 'on hold': case 'hold': return 'yellow';
      case 'cancelled': return 'gray';
      case 'resolved': case 'closed': return 'green';
      default: return 'gray';
    }
  };

  // Exclude current user from forwarding target list
  const activeConsultants = useMemo(() => {
    return consultants.filter(c => (c._id || c.id) !== (user?._id || user?.id) && c.status === 'active');
  }, [consultants, user]);

  return (
    <div className="w-full relative font-sans min-h-screen pt-4">
      {/* Header Container */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 mb-2">
            <ClipboardList className="text-blue-500" size={32} /> Assigned Tickets
          </h1>
          <p className="text-slate-400 font-medium">Monitoring {stats.total} assigned tickets • {stats.open} open • {stats.onHold} on hold • {stats.cancelled} cancelled</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button variant="outline" onClick={handleDownloadCSV} disabled={downloading} className="py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 flex-1 md:flex-initial">
            <Download size={16} className={downloading ? 'animate-pulse' : ''} /> {downloading ? 'Downloading...' : 'Download CSV'}
          </Button>
          <Button variant="outline" onClick={fetchTickets} disabled={ticketsLoading} className="py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 flex-1 md:flex-initial">
            <RefreshCw size={16} className={ticketsLoading ? 'animate-spin' : ''} /> {ticketsLoading ? 'Scanning...' : 'Sync Tickets'}
          </Button>
          <button onClick={() => setShowCreateModal(true)} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex-1 md:flex-initial justify-center">
            <Plus size={16} strokeWidth={3} /> Formulate Ticket
          </button>
        </div>
      </div>

      {/* System Telemetry Grid */}
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
            filters.status === 'cancelled' ? 'bg-slate-505 text-white shadow-[0_0_15px_rgba(148,163,184,0.4)]' : 'bg-slate-500/20 text-slate-400'
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
             <input 
               type="text" 
               placeholder="Search tickets..." 
               value={searchQuery} 
               onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}} 
               className="w-full bg-[#111620] border border-white/5 rounded-xl pl-12 pr-6 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 shadow-inner font-medium text-sm transition-all" 
             />
           </div>

           {/* Filter Params Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <select value={filters.client} onChange={e => {setFilters(p=>({...p, client: e.target.value})); setCurrentPage(1);}} className="bg-[#111620] border border-white/5 rounded-xl px-4 py-3 text-white text-[13px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner truncate cursor-pointer">
                <option value="all">Any Client</option>
                {clients.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
              <select value={filters.status} onChange={e => {setFilters(p=>({...p, status: e.target.value})); setCurrentPage(1);}} className="bg-[#111620] border border-white/5 rounded-xl px-4 py-3 text-white text-[13px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner cursor-pointer">
                <option value="all">All Statuses</option>
                <option value="open">Open Tickets</option>
                <option value="on hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
                <option value="resolved">Resolved Tickets</option>
              </select>
              <select value={filters.priority} onChange={e => {setFilters(p=>({...p, priority: e.target.value})); setCurrentPage(1);}} className="bg-[#111620] border border-white/5 rounded-xl px-4 py-3 text-white text-[13px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner cursor-pointer">
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select value={sortBy} onChange={e => {setSortBy(e.target.value); setCurrentPage(1);}} className="bg-[#111620] border border-white/5 rounded-xl px-4 py-3 text-white text-[13px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner cursor-pointer">
                <option value="newest">Date Wise: Newest First</option>
                <option value="oldest">Date Wise: Oldest First</option>
              </select>
           </div>

           {/* Date Filters Row */}
           <div className="flex flex-wrap items-center gap-3 border-t border-white/5 pt-3">
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">Date Filter:</span>
             <div className="flex items-center gap-2">
               <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">From</label>
               <input
                 type="date"
                 value={dateFrom}
                 onChange={e => { setDateFrom(e.target.value); setDateSpecific(''); setCurrentPage(1); }}
                 className="bg-[#111620] border border-white/5 rounded-xl px-3 py-2 text-white text-[12px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner cursor-pointer"
               />
             </div>
             <div className="flex items-center gap-2">
               <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">To</label>
               <input
                 type="date"
                 value={dateTo}
                 onChange={e => { setDateTo(e.target.value); setDateSpecific(''); setCurrentPage(1); }}
                 className="bg-[#111620] border border-white/5 rounded-xl px-3 py-2 text-white text-[12px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner cursor-pointer"
               />
             </div>
             <div className="w-px h-6 bg-white/10 mx-1 shrink-0" />
             <div className="flex items-center gap-2">
               <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Specific Date</label>
               <input
                 type="date"
                 value={dateSpecific}
                 onChange={e => { setDateSpecific(e.target.value); setDateFrom(''); setDateTo(''); setCurrentPage(1); }}
                 className="bg-[#111620] border border-white/5 rounded-xl px-3 py-2 text-white text-[12px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner cursor-pointer"
               />
             </div>
             {(dateFrom || dateTo || dateSpecific) && (
               <button
                 onClick={() => { setDateFrom(''); setDateTo(''); setDateSpecific(''); setCurrentPage(1); }}
                 className="ml-auto text-[10px] font-black text-red-400 hover:text-red-300 bg-red-400/10 px-3 py-1.5 rounded-lg uppercase tracking-widest transition-colors"
               >
                 Clear Dates
               </button>
             )}
           </div>
        </div>

        {/* Database Table Matrix */}
        <div className="overflow-x-auto relative z-10 flex-1">
          <table className="w-full text-left table-fixed">
            <thead className="bg-[#181f2b]/80 border-b border-white/5">
              <tr>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-tl-xl border-b border-white/5 w-[38%] min-w-[280px]">Ticket Info</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 w-[20%] min-w-[150px]">Client & Dept</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 w-[15%] min-w-[120px]">Status & Priority</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 w-[17%] min-w-[130px]">Assignment & Hours</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-tr-xl border-b border-white/5 text-right w-[10%] min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {ticketsLoading && currentTickets.length === 0 ? (
                 <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Loading tickets...</td></tr>
               ) : currentTickets.length === 0 ? (
                 <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest">No matching tickets found.</td></tr>
               ) : currentTickets.map((t, i) => (
                 <motion.tr 
                   initial={{ opacity: 0, y: 10 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   transition={{ delay: i * 0.02 }} 
                   key={t.id || t._id} 
                   className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-pointer ${
                    isUnopened(t) ? 'bg-amber-500/[0.06] hover:bg-amber-500/[0.1] border-l-4 border-l-amber-500' : ''
                  }`}
                   onClick={() => setSelectedTicket(t)}
                 >
                    <td className="p-4 align-middle">
                       <div className="flex flex-col gap-1.5">
                         <div className="flex items-center gap-2 flex-wrap">
                           <span className="text-[10px] font-black text-slate-400 bg-white/5 border border-white/5 px-1.5 py-0.5 rounded tracking-wider shrink-0">{t.ticketNumber}</span>
                           {isUnopened(t) && (
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse shrink-0" title="Unopened Ticket" />
                            )}
                           <span className="text-[10px] text-blue-400 font-bold flex items-center gap-1.5 bg-blue-500/5 px-1.5 py-0.5 rounded border border-blue-500/10">
                             <Clock size={10} className="shrink-0" />
                             {formatDateTime(t.createdAt)}
                           </span>
                         </div>
                         <span className={`font-extrabold text-[14px] flex items-center gap-1.5 truncate transition-colors ${
                           isUnopened(t) ? 'text-amber-400 font-black' : 'text-white group-hover:text-blue-400'
                         }`}>
                           {t.title}
                           {(t.attachments?.length > 0 || t.original?.attachments?.length > 0 || 
                             t.adminAttachments?.length > 0 || t.original?.adminAttachments?.length > 0 ||
                             t.supportingDocuments?.length > 0 || t.original?.supportingDocuments?.length > 0) && (
                              <Paperclip size={13} className="text-blue-400 shrink-0" />
                           )}
                         </span>
                         <span className="text-[12px] text-slate-500 font-medium truncate block w-full">{t.description}</span>
                       </div>
                    </td>
                    <td className="p-4 align-middle">
                       <div className="flex flex-col gap-1.5">
                         <span className="text-[13px] font-bold text-slate-200 truncate w-full" title={t.clientName || 'N/A'}>{t.clientName || 'N/A'}</span>
                         <span className="text-[10px] font-black text-purple-400/90 uppercase tracking-widest flex items-center gap-1 truncate w-full" title={t.department}>
                           <Building2 size={10} className="shrink-0" />
                           {t.department}
                         </span>
                       </div>
                    </td>
                    <td className="p-4 align-middle">
                       <div className="flex flex-col gap-1.5 items-start">
                         <Badge color={getStatusColor(t.status)} size="sm">{t.status}</Badge>
                         <span className={`text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${getPriorityBadgeClass(t.priority)} px-2 py-0.5 rounded`}>
                           ● {t.priority}
                         </span>
                       </div>
                    </td>
                    <td className="p-4 align-middle">
                       <div className="flex flex-col gap-1.5">
                         {t.assignee ? (
                           <div className="flex items-center gap-1.5">
                             <div className="w-5 h-5 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-[9px] border border-blue-500/30 shrink-0 font-black">{t.assignee.charAt(0).toUpperCase()}</div>
                             <span className="text-[12px] font-bold text-slate-300 truncate w-full" title={t.assignee}>{t.assignee}</span>
                           </div>
                         ) : (
                           <span className="text-[10px] text-slate-500 font-bold italic uppercase tracking-wider">Unassigned</span>
                         )}
                         <div className="flex items-center gap-1 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                           <Clock size={10} className="shrink-0" />
                           {formatHoursToHM(t.workLogs?.reduce((acc, l) => acc + (l.hours || 0), 0))}
                         </div>
                       </div>
                    </td>
                    <td className="p-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                       <div className="flex items-center justify-end gap-1.5">
                         <button onClick={() => setSelectedTicket(t)} className="text-[9px] font-black text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/5 shadow-sm uppercase tracking-wider transition-all">View</button>
                         {t.status !== 'Resolved' && (
                           <button 
                             onClick={() => setForwardingTicket(t)} 
                             className="text-[9px] font-black text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 rounded-lg border border-amber-500/10 shadow-sm uppercase tracking-wider transition-all"
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
             <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Showing {currentTickets.length} of {sortedTickets.length} Tickets</span>
             <div className="flex items-center gap-2 bg-[#181f2b]/80 border border-white/5 p-1 rounded-xl">
               <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all font-bold"><ChevronLeft size={16}/></button>
               <span className="w-8 h-8 rounded-lg flex items-center justify-center text-[13px] font-black text-white bg-blue-600 shadow-inner">{currentPage}</span>
               <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all font-bold"><ChevronRight size={16}/></button>
             </div>
          </div>
        )}
      </div>

      {/* Active Modals and Overlay Panels */}
      <CreateTicketConsultantModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      
      <AnimatePresence>
        {selectedTicket && (
          <ConsultantTicketDetailPanel 
            ticket={selectedTicket} 
            onClose={() => setSelectedTicket(null)} 
            onUpdateStatus={(id, status, reply, solution, workLogs, adminFiles, remarkFiles, isInternal) => {
              updateTicketStatus(id, status, reply, solution, workLogs, adminFiles, remarkFiles, isInternal);
              setSelectedTicket(null);
            }}
          />
        )}
      </AnimatePresence>

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
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Select Consultant to Forward To</label>
                  {useConsultantStore.getState().isLoading && (
                    <Loader2 size={12} className="text-amber-400 animate-spin" />
                  )}
                </div>
                <select
                  value={modalConsultantId}
                  onChange={(e) => setModalConsultantId(e.target.value)}
                  className="bg-[#181f2b] border border-white/5 rounded-xl px-3.5 py-2.5 text-white text-[12px] font-bold focus:outline-none focus:border-blue-500/50 cursor-pointer w-full disabled:opacity-60"
                  disabled={activeConsultants.length === 0}
                >
                  <option value="">
                    {activeConsultants.length === 0 ? 'Loading consultants...' : '-- Choose Consultant --'}
                  </option>
                  {activeConsultants.map(consultant => (
                    <option key={consultant._id || consultant.id} value={consultant._id || consultant.id}>
                      {consultant.name} ({consultant.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 relative">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">CC Consultants (Optional)</label>
                <div 
                  onClick={() => setCcDropdownOpen(!ccDropdownOpen)}
                  className="bg-[#181f2b] border border-white/5 rounded-xl px-3.5 py-2.5 text-white text-[12px] font-bold flex justify-between items-center cursor-pointer select-none"
                >
                  <span className="truncate">
                    {modalCcConsultantIds.length === 0 
                      ? '-- Choose CCs --' 
                      : `${modalCcConsultantIds.length} Selected`}
                  </span>
                  <ChevronRight size={14} className={`text-slate-400 transition-transform ${ccDropdownOpen ? 'rotate-90' : ''}`} />
                </div>
                {ccDropdownOpen && (
                  <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-white/10 rounded-xl max-h-[120px] overflow-y-auto p-2.5 z-20 space-y-1.5 shadow-xl custom-scrollbar">
                    {consultants.filter(c => {
                      const assignedId = forwardingTicket.assignedTo?._id || forwardingTicket.assignedTo?.id || forwardingTicket.original?.assignedTo?._id || forwardingTicket.original?.assignedTo?.id;
                      return c.status === 'active' && 
                        String(c._id || c.id) !== String(assignedId) && 
                        String(c._id || c.id) !== String(modalConsultantId);
                    }).map(c => {
                      const isChecked = modalCcConsultantIds.includes(c._id || c.id);
                      return (
                        <label 
                          key={c._id || c.id} 
                          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer select-none text-[11px]"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setModalCcConsultantIds(prev => prev.includes(c._id || c.id) ? prev.filter(id => id !== (c._id || c.id)) : [...prev, (c._id || c.id)]);
                            }}
                            className="rounded text-amber-600 focus:ring-0 cursor-pointer"
                          />
                          <span className="truncate text-slate-700 dark:text-slate-200">{c.name}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Additional CC Email Addresses (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. manager@example.com, developer@example.com"
                  value={modalCcEmails}
                  onChange={(e) => setModalCcEmails(e.target.value)}
                  className="bg-[#181f2b] border border-white/5 rounded-xl px-3.5 py-2.5 text-white text-[12px] font-bold focus:outline-none focus:border-blue-500/50 w-full placeholder:text-slate-600 shadow-inner"
                />
                <span className="text-[9px] text-slate-500 font-medium">Separate multiple email addresses with commas.</span>
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
                <button onClick={() => {
                  setForwardingTicket(null);
                  setModalCcConsultantIds([]);
                  setModalCcEmails('');
                  setCcDropdownOpen(false);
                }} className="px-4 py-2 text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button
                  onClick={async () => {
                    if (!modalConsultantId) return alert('Please select a consultant first.');
                    setIsModalSubmitting(true);
                    try {
                      const ccs = [...modalCcConsultantIds];
                      if (modalCcEmails.trim()) {
                        const extraEmails = modalCcEmails.split(',').map(e => e.trim()).filter(e => e.includes('@'));
                        ccs.push(...extraEmails);
                      }
                      await forwardTicket(forwardingTicket.original?._id || forwardingTicket.id, modalConsultantId, modalRemarks, ccs);
                      setForwardingTicket(null);
                      setModalConsultantId('');
                      setModalRemarks('');
                      setModalCcConsultantIds([]);
                      setModalCcEmails('');
                      setCcDropdownOpen(false);
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
