import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Filter, List, Grid, Search, ChevronRight, Paperclip, Star } from 'lucide-react';
import { useTicketStore } from '../../core/store/useTicketStore';
import { useAuthStore } from '../../core/store/useAuthStore';
import TicketViewerModal from '../../components/ui/TicketViewerModal';

export default function MyTickets() {
  const [view, setView] = useState('list'); // 'list' or 'grid'
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const { tickets } = useTicketStore();
  const { user } = useAuthStore();

  const userTickets = user?.role === 'User' ? tickets.filter(t => t.creatorId === user?.id || t.creatorId === user?._id || t.user === user?.name) : tickets;
  
  const filteredTickets = userTickets.filter(t => {
    const matchesFilter = filter === 'All' || t.status === filter;
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'Resolved': return 'bg-green-500/20 text-green-500 border-green-500/30';
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

  return (
    <div className="w-full">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">My Tickets</h1>
          <p className="text-muted-foreground mt-2">Manage and track your submitted tickets.</p>
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
            <option value="Resolved">Resolved</option>
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
          {filteredTickets.map((ticket, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`bg-[#111620]/80 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden group hover:border-blue-500/30 hover:shadow-2xl transition-all duration-300 cursor-pointer ${view === 'grid' ? 'flex flex-col relative' : 'flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-5 gap-4 sm:gap-0'}`}
            >
              {view === 'grid' ? (
                <>
                  <div className="absolute -right-4 -top-4 w-32 h-32 bg-blue-500/5 blur-[40px] group-hover:bg-blue-500/10 transition-colors pointer-events-none" />
                  <div className="p-6 flex-1 relative z-10">
                    <div className="flex justify-between items-start mb-5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{ticket.ticketNumber || ticket.id}</span>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(ticket.status)} uppercase tracking-wider`}>
                        {ticket.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-blue-400 transition-colors flex items-center gap-2">
                      {ticket.title}
                      {ticket.attachments?.length > 0 && <Paperclip size={16} className="text-blue-400 shrink-0" />}
                    </h3>
                    <p className="text-slate-400 text-[13px] line-clamp-2 mb-5 leading-relaxed">{ticket.description}</p>
                    <div className="flex items-center gap-4 text-[12px] font-semibold text-slate-500 tracking-wide uppercase">
                      <span className={getPriorityColor(ticket.priority)}>● {ticket.priority}</span>
                      <span>{ticket.department}</span>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-white/5 bg-[#181f2b]/50 backdrop-blur-sm flex justify-between items-center text-[12px] font-semibold text-slate-500 uppercase tracking-wider relative z-10">
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
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
                  <div className="flex items-center gap-5 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-[#1d2633] flex items-center justify-center border border-white/5 shrink-0 group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all shadow-inner">
                      <FileText size={20} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{ticket.ticketNumber || ticket.id}</span>
                        <h3 className="text-[15px] font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-2">
                          {ticket.title}
                          {ticket.attachments?.length > 0 && <Paperclip size={14} className="text-blue-400 shrink-0" />}
                        </h3>
                      </div>
                      <div className="flex items-center gap-5 text-[12px] font-semibold text-slate-500 tracking-wide uppercase">
                        <span className={getPriorityColor(ticket.priority)}>● {ticket.priority}</span>
                        <span>{ticket.department}</span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
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
                    <button className="w-8 h-8 rounded-full bg-white/5 hover:bg-primary text-muted-foreground hover:text-white flex items-center justify-center transition-all ml-4 shrink-0">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredTickets.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
            <Filter size={24} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-white mb-1">No tickets found</h3>
          <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
        </div>
      )}

      {selectedTicket && (
        <TicketViewerModal 
          ticket={selectedTicket} 
          isOpen={!!selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
        />
      )}
    </div>
  );
}
