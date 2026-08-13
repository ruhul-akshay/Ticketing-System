import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Filter, List, Grid, Search, ChevronRight, Paperclip, Star, Clock, Building2 } from 'lucide-react';
import { useTicketStore } from '../../store/useTicketStore';
import { useAuthStore } from '../../store/useAuthStore';
import TicketViewerModal from '../../components/ui/TicketViewerModal';

export default function MyTickets() {
  const [view, setView] = useState('list'); // 'list' or 'grid'
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'oldest'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketScope, setTicketScope] = useState('my');
  const { tickets } = useTicketStore();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const ticketIdFromUrl = searchParams.get('ticketId');
  const statusFromUrl = searchParams.get('status');

  useEffect(() => {
    if (ticketIdFromUrl && tickets.length > 0) {
      const foundTicket = tickets.find(t => t.id === ticketIdFromUrl || t.ticketNumber === ticketIdFromUrl);
      if (foundTicket) {
        setSelectedTicket(foundTicket);
      }
    }
  }, [ticketIdFromUrl, tickets]);

  useEffect(() => {
    if (statusFromUrl) {
      const formatted = statusFromUrl.split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
      
      const validStatuses = ['Open', 'On Hold', 'Cancelled', 'Resolved'];
      if (validStatuses.includes(formatted)) {
        setFilter(formatted);
      } else if (statusFromUrl.toLowerCase() === 'all') {
        setFilter('All');
      }
    }
  }, [statusFromUrl]);

  const userTickets = (user?.role === 'User' || user?.role === 'Client User' || user?.role?.toLowerCase() === 'clientuser') 
    ? (user?.isPrimaryContact && ticketScope === 'all'
        ? tickets 
        : tickets.filter(t => t.creatorId === user?.id || t.creatorId === user?._id || t.user === user?.name)) 
    : tickets;
  
  const filteredTickets = userTickets.filter(t => {
    const matchesFilter = filter === 'All' || t.status === filter;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const dateA = new Date(a.createdAt || 0);
    const dateB = new Date(b.createdAt || 0);
    return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'Resolved': return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'On Hold': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'Cancelled': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': case 'Critical': return 'text-red-400';
      case 'Medium': return 'text-yellow-400';
      case 'Low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'High':
      case 'Critical':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Medium':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'Low':
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

  return (
    <div className="w-full">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">My Tickets</h1>
            <p className="text-muted-foreground mt-2">Manage and track your submitted tickets.</p>
          </div>
          {user?.isPrimaryContact && (
            <div className="flex bg-[#181f2b]/80 border border-white/5 rounded-xl p-1 self-start sm:self-end">
              <button
                onClick={() => setTicketScope('my')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  ticketScope === 'my'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/35'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                My Tickets
              </button>
              <button
                onClick={() => setTicketScope('all')}
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                  ticketScope === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/35'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                All Tickets
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..." 
              className="bg-card/50 border border-border/50 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all w-full md:w-48 placeholder:text-muted-foreground/70"
            />
          </div>
          
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-card/50 border border-border/50 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
          >
            <option value="All">All Status</option>
            <option value="Open">Open</option>
            <option value="On Hold">On Hold</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Resolved">Resolved</option>
          </select>

          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-card/50 border border-border/50 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
          
          <div className="flex bg-card/50 border border-border/50 rounded-lg overflow-hidden">
            <button 
              onClick={() => setView('list')}
              className={`p-2 transition-colors ${view === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setView('grid')}
              className={`p-2 transition-colors ${view === 'grid' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              <Grid size={18} />
            </button>
          </div>
        </div>
      </motion.div>
 
      <motion.div layout className={`transition-all duration-300 ${view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}`}>
        <AnimatePresence>
          {sortedTickets.map((ticket, index) => {
            const isOwnTicket = ticket.creatorId === user?.id || ticket.creatorId === user?._id || ticket.user === user?.name;
            return (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`bg-[#111620]/80 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden group hover:border-blue-500/30 hover:shadow-2xl transition-all duration-300 cursor-pointer relative ${view === 'grid' ? 'flex flex-col' : 'flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 pl-6 sm:pl-7 gap-4 sm:gap-0'}`}
            >
              {/* Glowing left edge matching priority border color */}
              <div className={`absolute left-0 top-0 bottom-0 w-[4px] transition-all duration-300 ${
                ticket.priority === 'High' || ticket.priority === 'Critical' ? 'bg-red-500/70 group-hover:bg-red-500' :
                ticket.priority === 'Medium' ? 'bg-yellow-500/70 group-hover:bg-yellow-500' : 'bg-green-500/70 group-hover:bg-green-500'
              }`} />

              {view === 'grid' ? (
                <>
                  <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 blur-[40px] group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
                  <div className="p-6 flex-1 relative z-10 pl-7">
                    <div className="flex justify-between items-start mb-5">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 tracking-wider">{ticket.ticketNumber || ticket.id}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(ticket.status)} uppercase tracking-wider`}>
                        {ticket.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors flex items-center gap-2">
                      {ticket.title}
                      {ticket.attachments?.length > 0 && <Paperclip size={16} className="text-blue-400 shrink-0" />}
                    </h3>
                    <p className="text-slate-400 text-[13px] line-clamp-2 mb-5 leading-relaxed">{ticket.description}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                      <span className={`px-2 py-0.5 rounded ${getPriorityBadgeClass(ticket.priority)}`}>
                        ● {ticket.priority}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-500/5 text-slate-350 border border-white/5 px-2 py-0.5 rounded">
                        <Building2 size={10} className="text-slate-400" />
                        {ticket.department}
                      </span>
                      {!isOwnTicket && (
                        <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                          By: {ticket.user}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-white/5 bg-[#181f2b]/50 backdrop-blur-sm flex justify-between items-center text-[12px] font-semibold text-slate-500 uppercase tracking-wider relative z-10 pl-7">
                    <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                      <Clock size={12} className="shrink-0" />
                      {formatDateTime(ticket.createdAt)}
                    </span>
                    {ticket.status === 'Resolved' ? (
                      ticket.original?.feedback?.rating ? (
                         <div className="flex items-center gap-1" title={`Rated ${ticket.original.feedback.rating} stars`}>
                           {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= ticket.original.feedback.rating ? "text-yellow-400 fill-yellow-400" : "text-white/10 fill-transparent"} />)}
                           <span className="ml-1 text-yellow-400 font-bold">{ticket.original.feedback.rating}.0</span>
                         </div>
                      ) : (
                         <button className="text-yellow-400 hover:text-yellow-300 flex items-center gap-1.5 transition-colors group-hover:scale-105 duration-300 font-bold">
                           <Star size={14} className="fill-yellow-400/50" /> Submit Review
                         </button>
                      )
                    ) : (
                      <button className="text-blue-400 hover:text-white flex items-center gap-1 transition-colors group-hover:translate-x-1 duration-300">
                        Details <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-5 flex-1 pl-2">
                    <div className="w-12 h-12 rounded-xl bg-[#1d2633] flex items-center justify-center border border-white/5 shrink-0 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all shadow-inner">
                      <FileText size={20} className="text-slate-400 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/5 tracking-wider">{ticket.ticketNumber || ticket.id}</span>
                        <h3 className="text-[15px] font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                          {ticket.title}
                          {ticket.attachments?.length > 0 && <Paperclip size={14} className="text-blue-400 shrink-0" />}
                        </h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                        <span className={`px-2 py-0.5 rounded ${getPriorityBadgeClass(ticket.priority)}`}>
                          ● {ticket.priority}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-500/5 text-slate-300 border border-white/5 px-2 py-0.5 rounded">
                          <Building2 size={11} className="text-slate-400" />
                          {ticket.department}
                        </span>
                        <span className="flex items-center gap-1.5 bg-blue-500/5 text-blue-400 border border-blue-500/10 px-2 py-0.5 rounded">
                          <Clock size={11} className="text-blue-400 shrink-0" />
                          {formatDateTime(ticket.createdAt)}
                        </span>
                        {!isOwnTicket && (
                          <span className="flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                            By: {ticket.user}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-auto sm:ml-4 sm:shrink-0">
                    {ticket.status === 'Resolved' && ticket.original?.feedback?.rating ? (
                      <div className="flex items-center gap-0.5 mr-4" title={`Rated ${ticket.original.feedback.rating} stars`}>
                        {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= ticket.original.feedback.rating ? "text-yellow-400 fill-yellow-400" : "text-white/10 fill-transparent"} />)}
                      </div>
                    ) : ticket.status === 'Resolved' ? (
                      <div className="flex items-center gap-1 mr-4 text-[10px] font-bold text-yellow-400 uppercase tracking-widest border border-yellow-500/20 bg-yellow-500/10 px-2 py-1 rounded-full group-hover:bg-yellow-500/20 transition-colors">
                        <Star size={10} className="fill-yellow-400/50" /> Rate
                      </div>
                    ) : null}
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusColor(ticket.status)} uppercase tracking-wider inline-block`}>
                      {ticket.status}
                    </span>
                    <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary text-muted-foreground hover:text-white flex items-center justify-center transition-all ml-4 shrink-0 group-hover:translate-x-1 duration-300">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </>
              )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {sortedTickets.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Filter size={24} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No tickets found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
        </div>
      )}

      <TicketViewerModal 
        ticket={selectedTicket} 
        isOpen={!!selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
      />
    </div>
  );
}
