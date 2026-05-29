import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTicketStore } from '../../core/store/useTicketStore';
import { useCompanyStore } from '../../core/store/useCompanyStore';
import { useDepartmentStore } from '../../core/store/useDepartmentStore';
import { Button } from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import CreateTicketAdminModal from '../../components/forms/CreateTicketAdminModal';
import TicketViewerModal from '../../components/ui/TicketViewerModal';
import { Ticket, Search, Filter, Plus, RefreshCw, AlertCircle, Clock, CheckCircle, ChevronLeft, ChevronRight, Paperclip } from 'lucide-react';

export default function SuperAdminTickets() {
  const { tickets, fetchTickets, isLoading: ticketsLoading } = useTicketStore();
  const { companies, fetchCompanies } = useCompanyStore();
  const { departments, fetchDepartments } = useDepartmentStore();

  const [searchParams] = useSearchParams();
  const initStatus = searchParams.get('status') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({ company: 'all', department: 'all', status: initStatus, priority: 'all' });
  const [currentPage, setCurrentPage] = useState(1);
  const ticketsPerPage = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchTickets();
    fetchCompanies();
    fetchDepartments();
  }, [fetchTickets, fetchCompanies, fetchDepartments]);

  // Derived Stats
  const stats = useMemo(() => {
    const active = tickets.filter(t => t.status === 'Open' || t.status === 'Pending').length;
    const resolved = tickets.filter(t => t.status === 'Resolved').length;
    return { total: tickets.length, open: active, resolved };
  }, [tickets]);

  // Filter Logic
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const o = t.original || {};
      const matchesSearch = !searchQuery || 
        t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.user?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesCompany = filters.company === 'all' || t.companyId === filters.company;
      const matchesDepartment = filters.department === 'all' || o.department === filters.department || o.department?._id === filters.department;
      const matchesStatus = filters.status === 'all' || t.status?.toLowerCase() === filters.status.toLowerCase();
      const matchesPriority = filters.priority === 'all' || t.priority?.toLowerCase() === filters.priority.toLowerCase();

      return matchesSearch && matchesCompany && matchesDepartment && matchesStatus && matchesPriority;
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
          <p className="text-slate-400 font-medium">Monitoring {stats.total} total tickets • {stats.open} open tickets</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchTickets} disabled={ticketsLoading} className="py-2.5 bg-white/5 border border-white/10 hover:bg-white/10">
            <RefreshCw size={16} className={ticketsLoading ? 'animate-spin' : ''} /> {ticketsLoading ? 'Scanning...' : 'Sync Tickets'}
          </Button>
           <button onClick={() => setShowCreateModal(true)} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            <Plus size={16} strokeWidth={3} /> Create Ticket
          </button>
        </div>
      </div>

       {/* System Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 relative z-10">
        <motion.div 
          onClick={() => { setFilters(p => ({ ...p, status: 'all' })); setCurrentPage(1); }}
          className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-4 sm:p-6 rounded-2xl flex items-center gap-4 shadow-xl cursor-pointer hover:bg-white/5 transition-colors"
        >
          <div className="p-2.5 sm:p-3 bg-blue-500/20 text-blue-500 rounded-xl shrink-0"><Ticket size={20} className="sm:w-6 sm:h-6" /></div>
          <div><div className="text-2xl sm:text-3xl font-black text-white">{stats.total}</div><div className="text-slate-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest">Total Tickets</div></div>
        </motion.div>
        <motion.div 
          onClick={() => { setFilters(p => ({ ...p, status: 'open' })); setCurrentPage(1); }}
          className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-4 sm:p-6 rounded-2xl flex items-center gap-4 shadow-xl cursor-pointer hover:bg-white/5 transition-colors"
        >
          <div className="p-2.5 sm:p-3 bg-red-500/20 text-red-500 rounded-xl shrink-0"><AlertCircle size={20} className="sm:w-6 sm:h-6" /></div>
          <div><div className="text-2xl sm:text-3xl font-black text-white">{stats.open}</div><div className="text-slate-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest">Open Tickets</div></div>
        </motion.div>
        <motion.div 
          onClick={() => { setFilters(p => ({ ...p, status: 'resolved' })); setCurrentPage(1); }}
          className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-4 sm:p-6 rounded-2xl flex items-center gap-4 shadow-xl cursor-pointer hover:bg-white/5 transition-colors sm:col-span-2 md:col-span-1"
        >
          <div className="p-2.5 sm:p-3 bg-emerald-500/20 text-emerald-500 rounded-xl shrink-0"><CheckCircle size={20} className="sm:w-6 sm:h-6" /></div>
          <div><div className="text-2xl sm:text-3xl font-black text-white">{stats.resolved}</div><div className="text-slate-500 text-[9px] sm:text-[11px] font-bold uppercase tracking-widest">Resolved Tickets</div></div>
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
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <select value={filters.company} onChange={e => {setFilters(p=>({...p, company: e.target.value})); setCurrentPage(1);}} className="bg-[#111620] border border-white/5 rounded-xl px-4 py-3 text-white text-[13px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner truncate">
                <option value="all">Any Company</option>
                {companies.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
              <select value={filters.department} onChange={e => {setFilters(p=>({...p, department: e.target.value})); setCurrentPage(1);}} className="bg-[#111620] border border-white/5 rounded-xl px-4 py-3 text-white text-[13px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner truncate">
                <option value="all">Any Department</option>
                {departments.map(d => <option key={d.id || d._id} value={d.id || d._id}>{d.name}</option>)}
              </select>
              <select value={filters.status} onChange={e => {setFilters(p=>({...p, status: e.target.value})); setCurrentPage(1);}} className="bg-[#111620] border border-white/5 rounded-xl px-4 py-3 text-white text-[13px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner">
                <option value="all">All Statuses</option>
                <option value="open">Open Tickets</option>
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
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 whitespace-nowrap">Company</th>
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
                 <tr><td colSpan="7" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Loading tickets...</td></tr>
               ) : currentTickets.length === 0 ? (
                 <tr><td colSpan="7" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest">No matching tickets found.</td></tr>
               ) : currentTickets.map((t, i) => (
                 <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} key={t.id || t._id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-pointer" onClick={() => setSelectedTicket(t)}>
                    <td className="p-4 text-[11px] font-black text-slate-400">{t.ticketNumber}</td>
                    <td className="p-4">
                       <span className="font-bold text-[14px] text-white flex items-center gap-2 truncate mb-1 group-hover:text-blue-400 transition-colors">
                         {t.title}
                         {t.attachments?.length > 0 && <Paperclip size={14} className="text-blue-400 shrink-0" />}
                       </span>
                       <span className="text-[12px] text-slate-500 font-medium truncate block max-w-sm">{t.description}</span>
                    </td>
                    <td className="p-4"><Badge color="blue" size="sm" className="max-w-[120px] truncate">{t.companyName}</Badge></td>
                    <td className="p-4"><Badge color={getStatusColor(t.status)} size="sm">{t.status}</Badge></td>
                    <td className="p-4"><span className={`text-[11px] font-black uppercase tracking-wider ${getPriorityColor(t.priority)==='red'?'text-red-400':getPriorityColor(t.priority)==='yellow'?'text-yellow-400':'text-emerald-400'}`}>{t.priority}</span></td>
                    <td className="p-4 text-[12px] font-bold text-slate-300 flex items-center gap-1.5"><Badge color="purple" size="sm" className="max-w-[120px] truncate">{t.department}</Badge></td>
                    <td className="p-4">
                       <div className="flex items-center gap-2">
                         <div className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-[10px] border border-blue-500/30 shrink-0 font-bold">{(t.user||'U').charAt(0).toUpperCase()}</div>
                         <span className="text-[12px] font-bold text-slate-300 truncate max-w-[120px]">{t.user}</span>
                       </div>
                    </td>
                    <td className="p-4">
                       <div className="flex items-center gap-1.5 text-blue-400 font-black text-[13px]">
                         <Clock size={12}/>
                         {t.workLogs?.reduce((acc, l) => acc + (l.hours || 0), 0).toFixed(1)}h
                       </div>
                    </td>
                    <td className="p-4 text-right">
                       <button onClick={(e) => { e.stopPropagation(); setSelectedTicket(t); }} className="text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg border border-transparent shadow-sm hover:border-white/10 uppercase tracking-widest transition-all">View Ticket</button>
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
       <CreateTicketAdminModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
       <TicketViewerModal isOpen={!!selectedTicket} onClose={() => setSelectedTicket(null)} ticket={selectedTicket} />
    </div>
  );
}
