import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, Send, CheckCircle, Ticket, Clock, Building2, AlertCircle } from 'lucide-react';
import { useTicketStore } from '../../core/store/useTicketStore';
import { useAuthStore } from '../../core/store/useAuthStore';
import api from '../../core/api/mockAxios';

export default function Reviews() {
  const { tickets, fetchTickets } = useTicketStore();
  const { user } = useAuthStore();
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  // Filter for tickets that are resolved and belong to the user AND have NO rating yet
  const pendingReviews = tickets.filter(t => 
    t.status === 'Resolved' && 
    (t.creatorId === user?.id || t.creatorId === user?._id) &&
    !t.original?.feedback?.rating
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
      }, 2500);
    } catch (err) {
      console.error('Feedback submission failed:', err);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 w-full min-h-screen font-sans">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
           <Star className="text-yellow-400 fill-yellow-400/20" size={32} /> Service Reviews
        </h1>
        <p className="text-slate-400 mt-2 font-medium">Evaluate our support performance for your resolved tickets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Pending List */}
        <div className="md:col-span-1 space-y-4">
          <h2 className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-4">Pending Reviews ({pendingReviews.length})</h2>
          
          {pendingReviews.length === 0 ? (
            <div className="bg-[#111620]/50 border border-white/5 rounded-2xl p-8 text-center">
               <CheckCircle className="mx-auto text-emerald-500/30 mb-3" size={40} />
               <p className="text-slate-500 text-sm font-medium">All caught up! No pending reviews.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReviews.map(ticket => (
                <motion.div
                  key={ticket.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setSubmitted(false);
                  }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedTicket?.id === ticket.id 
                    ? 'bg-blue-600/10 border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
                    : 'bg-[#111620] border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{ticket.ticketNumber}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase border border-emerald-500/20">Resolved</span>
                  </div>
                  <h3 className="text-white text-sm font-bold truncate mb-1">{ticket.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase">
                    <Clock size={10} /> {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Review Form */}
        <div className="md:col-span-2">
          <AnimatePresence mode="wait">
            {!selectedTicket ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#111620]/50 border border-white/5 rounded-[2rem] p-12 text-center h-full flex flex-col items-center justify-center border-dashed"
              >
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                  <Star size={32} className="text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-400">Select a ticket to review</h3>
                <p className="text-slate-500 text-sm mt-2 max-w-xs">Pick one of your resolved tickets from the list on the left to share your experience.</p>
              </motion.div>
            ) : submitted ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#111620] border border-emerald-500/20 rounded-[2rem] p-12 text-center h-full flex flex-col items-center justify-center shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                  className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8"
                >
                  <CheckCircle size={48} className="text-emerald-400" />
                </motion.div>
                <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Review Submitted!</h2>
                <p className="text-slate-400 font-medium">Thank you for helping us improve our support standards.</p>
              </motion.div>
            ) : (
              <motion.div 
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#111620] border border-white/10 rounded-[2rem] p-8 md:p-10 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/5 blur-[80px] pointer-events-none" />
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                    <Star size={24} className="text-blue-400" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-[0.2em] mb-1 block">Reviewing Ticket</span>
                    <h2 className="text-xl font-bold text-white tracking-tight">{selectedTicket.title}</h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-10">
                  <div className="bg-white/3 border border-white/5 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Ticket size={10} /> ID</span>
                    <span className="text-xs font-bold text-white">{selectedTicket.ticketNumber}</span>
                  </div>
                  <div className="bg-white/3 border border-white/5 rounded-xl p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><Building2 size={10} /> Dept</span>
                    <span className="text-xs font-bold text-white">{selectedTicket.department}</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="text-center bg-[#181f2b]/50 border border-white/5 rounded-3xl p-8 shadow-inner">
                    <p className="text-sm font-bold text-slate-300 mb-6">How was your support experience?</p>
                    <div className="flex justify-center gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onMouseEnter={() => setHovered(star)}
                          onMouseLeave={() => setHovered(0)}
                          onClick={() => setRating(star)}
                          className="p-1 transition-colors"
                        >
                          <Star 
                            size={40} 
                            className={`transition-all duration-300 ${
                              star <= (hovered || rating) 
                                ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.4)]' 
                                : 'text-white/10'
                            }`} 
                          />
                        </motion.button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <motion.p 
                        initial={{ opacity: 0, y: 5 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="text-yellow-400 text-[11px] font-black uppercase tracking-widest mt-4"
                      >
                        {['', 'Poor Experience', 'Could be Better', 'Good Support', 'Very Satisfied', 'Exceptional Service'][rating]}
                      </motion.p>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <MessageSquare size={14} /> Additional Comments
                    </label>
                    <textarea 
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={4}
                      placeholder="Share what we did well or what we can improve..."
                      className="w-full bg-black/20 border border-white/5 text-white rounded-2xl px-5 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium text-sm shadow-inner resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={rating === 0 || isSubmitting}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl px-8 py-4 font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(59,130,246,0.3)] disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Resolution Review'} <Send size={18} />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
