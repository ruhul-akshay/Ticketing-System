import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Send, CheckCircle, Ticket, Clock, Building2, AlertCircle, Search, Award } from 'lucide-react';
import { useTicketStore } from '../../store/useTicketStore';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../api/mockAxios';

const starColors = [
  'text-slate-250 dark:text-white/10',
  'text-red-500 fill-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]',
  'text-orange-500 fill-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]',
  'text-yellow-500 fill-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]',
  'text-blue-500 fill-blue-500 drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]',
  'text-emerald-500 fill-emerald-500 drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]'
];

const emojis = ['', '😞', '😐', '🙂', '🤩', '🚀'];
const labels = ['', 'Poor Experience', 'Could be Better', 'Good Support', 'Very Satisfied', 'Exceptional Service'];

export default function Reviews() {
  const { tickets, fetchTickets } = useTicketStore();
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Rating states
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Filter for tickets belonging to the user
  const userTickets = tickets.filter(t => 
    t.creatorId === user?.id || t.creatorId === user?._id || t.user === user?.name
  );

  // Tickets awaiting feedback (Resolved but no rating yet)
  const pendingReviews = userTickets.filter(t => 
    t.status === 'Resolved' && 
    !(t.original?.feedback?.rating || t.feedback?.rating)
  );

  // Tickets that have already been reviewed
  const reviewHistory = userTickets.filter(t => 
    t.original?.feedback?.rating || t.feedback?.rating
  );

  // Filter lists based on search
  const filteredPending = pendingReviews.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.ticketNumber || t.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = reviewHistory.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.ticketNumber || t.id).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket || rating === 0) return;
    
    setIsSubmitting(true);
    try {
      await api.post(`/tickets/${selectedTicket.id}/feedback`, { rating, comment });
      setSubmitted(true);
      await fetchTickets();
      
      setTimeout(() => {
        setSubmitted(false);
        setSelectedTicket(null);
        setRating(0);
        setComment('');
      }, 2200);
    } catch (err) {
      console.error('Feedback submission failed:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderLeftList = () => {
    const list = activeTab === 'pending' ? filteredPending : filteredHistory;
    
    if (list.length === 0) {
      return (
        <div className="bg-slate-50 dark:bg-[#111620]/50 border border-slate-200 dark:border-white/5 rounded-2xl p-8 text-center mt-4">
          <CheckCircle className="mx-auto text-emerald-500/20 mb-3" size={36} />
          <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            {searchTerm ? 'No matches found' : 'All Caught Up!'}
          </p>
          <p className="text-slate-400 dark:text-slate-650 text-xs mt-1">
            {searchTerm ? 'Try a different search query.' : activeTab === 'pending' ? 'No pending reviews.' : 'No feedback history.'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3 mt-4 max-h-[calc(100vh-320px)] overflow-y-auto pr-1 custom-scrollbar">
        {list.map(ticket => {
          const fb = ticket.original?.feedback || ticket.feedback;
          return (
            <motion.div
              key={ticket.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                setSelectedTicket(ticket);
                setSubmitted(false);
                if (activeTab === 'pending') {
                  setRating(0);
                  setComment('');
                }
              }}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                selectedTicket?.id === ticket.id 
                ? 'bg-blue-50/80 border-blue-400/40 dark:bg-blue-600/10 dark:border-blue-500/30 shadow-lg shadow-blue-500/5' 
                : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 dark:bg-[#111620]/60 dark:border-white/5 dark:hover:border-white/10 dark:hover:bg-[#111620]'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{ticket.ticketNumber || 'TICKET'}</span>
                {activeTab === 'pending' ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[9px] font-bold uppercase border border-emerald-500/20">Resolved</span>
                ) : (
                  <div className="flex items-center gap-0.5 bg-yellow-500/10 border border-yellow-500/25 px-1.5 py-0.5 rounded-md">
                    <Star size={10} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] font-black text-yellow-500">{fb?.rating}.0</span>
                  </div>
                )}
              </div>
              <h3 className="text-slate-800 dark:text-white text-sm font-bold truncate mb-1 leading-snug">{ticket.title}</h3>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">
                <Clock size={10} /> {new Date(ticket.createdAt).toLocaleDateString()}
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-8 px-4 w-full min-h-screen font-sans relative">
      {/* Background Blurs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-yellow-500/5 dark:bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Page Header */}
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-white/5 pb-6 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <Star className="text-yellow-500 dark:text-yellow-450 fill-yellow-500/10 animate-pulse" size={32} /> Service Reviews
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium text-sm">
            Evaluate support performance or browse feedback history for resolved tickets.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Left Side Panel: Tabs, Search, List */}
        <div className="col-span-1 space-y-4">
          {/* Custom Tabs */}
          <div className="flex bg-slate-100 dark:bg-[#111620]/60 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
            <button
              onClick={() => { setActiveTab('pending'); setSelectedTicket(null); setSearchTerm(''); }}
              className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 select-none ${
                activeTab === 'pending' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.01]'
              }`}
            >
              Pending
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === 'pending' ? 'bg-white/20 text-white' : 'bg-slate-250 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`}>
                {pendingReviews.length}
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('history'); setSelectedTicket(null); setSearchTerm(''); }}
              className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 select-none ${
                activeTab === 'history' 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.01]'
              }`}
            >
              History
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-250 dark:bg-white/5 text-slate-600 dark:text-slate-400'}`}>
                {reviewHistory.length}
              </span>
            </button>
          </div>

          {/* Search Field */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'pending' ? 'pending' : 'history'} reviews...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#111620]/60 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/50 transition-all font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Listing */}
          {renderLeftList()}
        </div>

        {/* Right Side Panel: Form or Read-Only Card */}
        <div className="col-span-1 lg:col-span-2">
          <AnimatePresence mode="wait">
            {!selectedTicket ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-slate-50/50 border border-dashed border-slate-200 dark:bg-[#111620]/40 dark:border-white/5 rounded-[2rem] p-12 text-center h-full min-h-[350px] flex flex-col items-center justify-center"
              >
                <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Star size={32} className="text-slate-400 dark:text-slate-600 fill-slate-400/10" />
                </div>
                <h3 className="text-lg font-bold text-slate-400 dark:text-slate-450 uppercase tracking-wide">Review Details</h3>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 max-w-sm leading-relaxed font-semibold">
                  {activeTab === 'pending' 
                    ? 'Select a resolved ticket from the list on the left to leave a review and rate your support experience.'
                    : 'Select a ticket from your history to view your previously submitted feedback details.'
                  }
                </p>
              </motion.div>
            ) : submitted ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-[#111620]/80 backdrop-blur-xl border border-emerald-500/20 rounded-[2rem] p-12 text-center h-full min-h-[350px] flex flex-col items-center justify-center shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/20"
                >
                  <CheckCircle size={48} className="text-emerald-500 animate-bounce" />
                </motion.div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Review Submitted Successfully!</h2>
                <p className="text-slate-550 dark:text-slate-450 font-bold text-sm">Thank you! Your feedback helps us maintain and refine our support standards.</p>
              </motion.div>
            ) : activeTab === 'pending' ? (
              /* Review Form for Pending Tickets */
              <motion.div 
                key="form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/5 rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-blue-50 border border-blue-200 dark:bg-blue-600/10 dark:border-blue-500/25 text-blue-500 shrink-0 rounded-2xl flex items-center justify-center">
                    <Star size={24} className="text-blue-500 dark:text-blue-400" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-blue-500 dark:text-blue-450 uppercase tracking-[0.2em] mb-1 block">Reviewing Ticket</span>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-snug">{selectedTicket.title}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 border border-slate-200/60 dark:bg-white/[0.02] dark:border-white/5 rounded-xl p-3 flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1"><Ticket size={10} /> ID</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{selectedTicket.ticketNumber || selectedTicket.id}</span>
                  </div>
                  <div className="bg-white/[0.02] border border-slate-200/60 dark:bg-white/[0.02] dark:border-white/5 rounded-xl p-3 flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1"><Building2 size={10} /> Dept</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{selectedTicket.department}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Rating Selector */}
                  <div className="text-center bg-slate-50/50 dark:bg-[#181f2b]/40 border border-slate-200/80 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] to-transparent pointer-events-none" />
                    <p className="text-[13px] font-black text-slate-650 dark:text-slate-350 uppercase tracking-wider mb-6 relative z-10">How was your support experience?</p>
                    
                    <div className="flex justify-center gap-3.5 relative z-10">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isHighlighted = star <= (hovered || rating);
                        const activeVal = hovered || rating;
                        return (
                          <motion.button
                            key={star}
                            type="button"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onMouseEnter={() => setHovered(star)}
                            onMouseLeave={() => setHovered(0)}
                            onClick={() => setRating(star)}
                            className="p-1 transition-all cursor-pointer"
                          >
                            <Star 
                              size={38} 
                              className={`transition-all duration-300 ${
                                isHighlighted 
                                  ? starColors[activeVal] 
                                  : 'text-slate-200 dark:text-white/10 fill-transparent hover:text-slate-400 hover:dark:text-white/20'
                              }`} 
                            />
                          </motion.button>
                        );
                      })}
                    </div>

                    <AnimatePresence mode="wait">
                      {(hovered || rating) > 0 && (
                        <motion.div
                          key={hovered || rating}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="mt-6 flex flex-col items-center relative z-10"
                        >
                          <span className="text-4xl filter drop-shadow-md mb-2">{emojis[hovered || rating]}</span>
                          <span className="text-slate-800 dark:text-slate-200 text-xs font-black uppercase tracking-widest bg-slate-100 border border-slate-200 dark:bg-white/5 dark:border-white/5 px-3 py-1 rounded-full">
                            {labels[hovered || rating]}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Comment box */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={14} /> Additional Comments
                    </label>
                    <textarea 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      placeholder="Share what we did well or what we can improve..."
                      className="w-full bg-slate-50 border border-slate-200 text-slate-850 dark:bg-black/20 dark:border-white/5 dark:text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-indigo-500/50 transition-all font-bold text-xs shadow-inner resize-none placeholder:text-slate-400"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={rating === 0 || isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl px-8 py-4 font-black uppercase tracking-wider flex items-center justify-center gap-3 transition-all cursor-pointer shadow-[0_4px_20px_rgba(79,70,229,0.35)] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Resolution Review'} <Send size={15} />
                  </button>
                </form>
              </motion.div>
            ) : (
              /* Read-only Feedback Details for Reviewed Tickets */
              <motion.div 
                key="history-detail"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-[#111620]/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/5 rounded-[2rem] p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-emerald-50 border border-emerald-255 dark:bg-emerald-500/10 dark:border-emerald-500/25 text-emerald-500 shrink-0 rounded-2xl flex items-center justify-center">
                    <Award size={24} className="text-emerald-500 dark:text-emerald-405" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-[0.2em] mb-1 block">Feedback Submitted</span>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-snug">{selectedTicket.title}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 border border-slate-200/60 dark:bg-white/[0.02] dark:border-white/5 rounded-xl p-3 flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1"><Ticket size={10} /> ID</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{selectedTicket.ticketNumber || selectedTicket.id}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/60 dark:bg-white/[0.02] dark:border-white/5 rounded-xl p-3 flex flex-col gap-0.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1"><Building2 size={10} /> Dept</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{selectedTicket.department}</span>
                  </div>
                </div>

                {(() => {
                  const fb = selectedTicket.original?.feedback || selectedTicket.feedback;
                  const rateVal = fb?.rating || 0;
                  return (
                    <div className="space-y-6">
                      {/* Rating details display */}
                      <div className="text-center bg-slate-50/50 dark:bg-[#181f2b]/40 border border-slate-200/80 dark:border-white/5 rounded-3xl p-6 sm:p-8 shadow-inner relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.01] to-transparent pointer-events-none" />
                        <span className="text-4xl filter drop-shadow-md mb-2 block">{emojis[rateVal]}</span>
                        <p className="text-[13px] font-black text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-4">{labels[rateVal]}</p>
                        
                        <div className="flex justify-center gap-2 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              size={28} 
                              className={star <= rateVal ? starColors[rateVal] : 'text-slate-200 dark:text-white/5 fill-transparent'} 
                            />
                          ))}
                        </div>
                      </div>

                      {/* Comment display */}
                      {fb?.comment && (
                        <div className="space-y-2 bg-slate-50 border border-slate-200/80 dark:bg-black/25 dark:border-white/5 rounded-2xl p-5 relative shadow-inner">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest block mb-1">Your Review Comments</span>
                          <p className="text-sm text-slate-700 dark:text-slate-300 italic leading-relaxed">"{fb.comment}"</p>
                        </div>
                      )}

                      <div className="pt-6 border-t border-slate-200 dark:border-white/5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center">
                        Reviewed on {new Date(fb?.submittedAt || selectedTicket.updatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
