import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, AlertCircle, Building2, Tag, CheckCircle, Download, File, Star, Send, MessageSquare, UploadCloud, Radio } from 'lucide-react';
import api from '../../core/api/mockAxios';
import { useTicketStore } from '../../core/store/useTicketStore';
import { useAuthStore } from '../../core/store/useAuthStore';

const getStatusColor = (status) => {
  switch (status) {
    case 'Open': return 'bg-red-500/20 text-red-500 border-red-500/30';
    case 'Resolved': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High': case 'Critical': return 'text-red-400';
    case 'Medium': return 'text-yellow-400';
    case 'Low': return 'text-emerald-400';
    default: return 'text-gray-400';
  }
};

export default function TicketViewerModal({ ticket, isOpen, onClose }) {
  if (!isOpen || !ticket) return null;

  const { user } = useAuthStore();
  const isOwner = (user?.role === 'User' || user?.role === 'user') && (ticket.creatorId === user?.id || ticket.creatorId === user?._id);
  const hasNoFeedback = !ticket.original?.feedback?.rating;
  const isResolved = ticket.status === 'Resolved';

  // Auto-open feedback form for resolved tickets without a rating (for the ticket owner)
  const [showFeedbackForm, setShowFeedbackForm] = React.useState(isOwner && isResolved && hasNoFeedback);
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { fetchTickets } = useTicketStore();

  const handleSubmitFeedback = async () => {
    if (rating === 0) return alert('Please select a rating');
    setIsSubmitting(true);
    try {
      const ticketId = ticket.original?._id || ticket.id;
      await api.post(`/tickets/${ticketId}/feedback`, { rating, comment });
      
      // Update local state before closing for immediate feedback
      setShowFeedbackForm(false);
      await fetchTickets();
      
      // Show success briefly or just close
      onClose();
    } catch (err) {
      console.error('Feedback Error:', err);
      const msg = err.response?.data?.message || 'Failed to submit feedback. Please try again.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const rawTicketId = ticket.original?._id || ticket.id;

  const handleDownloadAttachment = async (e, ticketId, attachmentId, filename) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'https://ticketing-backend-61yr.onrender.com/api';
      const response = await fetch(`${baseUrl}/tickets/${ticketId}/attachment/${attachmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 5000);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file'); 
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
          className="bg-[#111620] border border-white/10 w-full max-w-2xl rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/5 bg-[#181f2b]/50 backdrop-blur-xl flex justify-between items-start sticky top-0 z-20">
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">{ticket.ticketNumber || ticket.id}</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(ticket.status)} uppercase tracking-wider`}>
                  {ticket.status}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight pr-8">{ticket.title}</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors absolute right-6 top-6 border border-white/5"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-8 overflow-y-auto relative scroll-smooth flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/5 blur-[100px] pointer-events-none" />
            
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 relative z-10">
              <div className="bg-[#1d2633]/50 border border-white/5 p-4 rounded-[1.2rem] flex flex-col gap-1.5 items-start shadow-inner">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><AlertCircle size={13} /> Priority</span>
                <span className={`text-[14px] font-black tracking-wide uppercase ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
              </div>
              <div className="bg-[#1d2633]/50 border border-white/5 p-4 rounded-[1.2rem] flex flex-col gap-1.5 items-start shadow-inner">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Building2 size={13} /> Dept</span>
                <span className="text-[14px] font-bold text-white tracking-wide truncate w-full">{ticket.department}</span>
              </div>
              <div className="bg-[#1d2633]/50 border border-white/5 p-4 rounded-[1.2rem] flex flex-col gap-1.5 items-start shadow-inner">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Tag size={13} /> Category</span>
                <span className="text-[14px] font-bold text-white tracking-wide truncate w-full">{ticket.original?.category || 'General'}</span>
              </div>
              <div className="bg-[#1d2633]/50 border border-white/5 p-4 rounded-[1.2rem] flex flex-col gap-1.5 items-start shadow-inner">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Clock size={13} /> Created</span>
                <span className="text-[14px] font-bold text-white tracking-wide">{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Description */}
            <div className="relative z-10 mb-8">
              <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">Description</h3>
              <div className="bg-[#1d2633] border border-white/5 p-6 rounded-2xl text-[14px] text-slate-300 leading-relaxed font-medium shadow-inner whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>

            {/* Attachments */}
            <div className="relative z-10 mb-8">
              <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">User Attachments</h3>
              {(!ticket.attachments?.length && !ticket.original?.attachments?.length) ? (
                <div className="bg-[#1d2633]/50 border border-white/5 p-4 rounded-xl text-center text-slate-500 text-[13px] font-medium italic shadow-inner">
                  No user attachments provided
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {(ticket.attachments?.length > 0 ? ticket.attachments : (ticket.original?.attachments || [])).map((file) => (
                    <div key={file._id} className="bg-[#1d2633] border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-inner">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                          <File size={16} className="text-blue-400" />
                        </div>
                        <span className="text-[14px] font-medium text-slate-200 truncate">{file.originalName || file.filename}</span>
                      </div>
                      <button 
                        onClick={(e) => handleDownloadAttachment(e, rawTicketId, file._id, file.originalName || file.filename)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5 shrink-0"
                        title="Download Attachment"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Admin Attachments */}
            {(ticket.adminAttachments?.length > 0 || ticket.original?.adminAttachments?.length > 0) && (
              <div className="relative z-10 mb-8">
                <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">Admin Attachments</h3>
                <div className="flex flex-col gap-3">
                  {(ticket.adminAttachments?.length > 0 ? ticket.adminAttachments : (ticket.original?.adminAttachments || [])).map((file) => (
                    <div key={file._id} className="bg-[#1d2633] border border-emerald-500/10 p-4 rounded-xl flex items-center justify-between shadow-inner">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                          <File size={16} className="text-emerald-400" />
                        </div>
                        <span className="text-[14px] font-medium text-slate-200 truncate">{file.originalName || file.filename}</span>
                      </div>
                      <button 
                        onClick={(e) => handleDownloadAttachment(e, rawTicketId, file._id, file.originalName || file.filename)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-white rounded-lg transition-colors border border-emerald-500/20 shrink-0"
                        title="Download Admin Attachment"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supporting Documents */}
            <div className="relative z-10 mb-8">
              <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">Supporting Documents</h3>
              {(!ticket.supportingDocuments?.length && !ticket.original?.supportingDocuments?.length) ? (
                <div className="bg-[#1d2633]/50 border border-purple-500/5 p-4 rounded-xl text-center text-slate-500 text-[13px] font-medium italic shadow-inner">
                  No supporting documents provided
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {(ticket.supportingDocuments?.length > 0 ? ticket.supportingDocuments : (ticket.original?.supportingDocuments || [])).map((file) => (
                    <div key={file._id} className="bg-[#1d2633] border border-purple-500/10 p-4 rounded-xl flex items-center justify-between shadow-inner">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
                          <File size={16} className="text-purple-400" />
                        </div>
                        <span className="text-[14px] font-medium text-slate-200 truncate">{file.originalName || file.filename}</span>
                      </div>
                      <button 
                        onClick={(e) => handleDownloadAttachment(e, rawTicketId, file._id, file.originalName || file.filename)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-purple-400 hover:text-white rounded-lg transition-colors border border-purple-500/20 shrink-0"
                        title="Download Supporting Document"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reason */}
            {ticket.original?.reason && (
              <div className="relative z-10 mb-8">
                 <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">Reported Reason</h3>
                 <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[13px] font-bold tracking-wide">
                    <AlertCircle size={16} /> {ticket.original.reason}
                 </div>
              </div>
            )}

            <div className="relative z-10 mb-8 bg-[#0a0f1a]/80 p-8 rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden">
              {/* Mesh background for the conversation area */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
              
              <h3 className="text-[14px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3 relative z-10">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Secure Transmission Logs
              </h3>
              
              <div className="space-y-8 max-h-[500px] overflow-y-auto pr-4 mb-8 scroll-smooth custom-scrollbar relative z-10">
                {(!ticket.original?.remarks || ticket.original.remarks.length === 0) ? (
                  <div className="bg-white/[0.01] border border-white/5 p-20 rounded-[2.5rem] text-center backdrop-blur-sm">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                      <Radio size={32} className="text-slate-800 animate-pulse" />
                    </div>
                    <p className="text-slate-600 text-[12px] font-black uppercase tracking-[0.4em]">Standby for Data Stream</p>
                  </div>
                ) : (
                  ticket.original.remarks.map((remark, index) => {
                    const isAdmin = remark.addedBy?.role === 'admin' || remark.addedBy?.role === 'superadmin';
                    const senderName = remark.addedBy?.name || 'System';
                    const isMe = String(remark.addedBy?._id || remark.addedBy) === String(user?._id || user?.id);
                    
                    return (
                      <div key={index} className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} w-full animate-in fade-in slide-in-from-bottom-6 duration-700`}>
                        <div className={`max-w-[80%] flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                          {/* Chat Header */}
                          <div className={`flex items-center gap-3 mb-2.5 px-3 ${isAdmin ? 'flex-row' : 'flex-row-reverse'}`}>
                            <div className={`w-8 h-8 rounded-2xl flex items-center justify-center text-[11px] font-black shadow-xl transition-transform hover:rotate-12 ${
                              isAdmin 
                                ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/10' 
                                : 'bg-blue-600 text-white ring-4 ring-blue-600/10'
                            }`}>
                              {senderName[0].toUpperCase()}
                            </div>
                            <div className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}>
                              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400">
                                {isMe ? 'Me' : isAdmin ? `${senderName} (Support)` : senderName}
                              </span>
                              <span className="text-[9px] text-slate-600 font-black tracking-widest">
                                {new Date(remark.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </span>
                            </div>
                          </div>

                          {/* Message Bubble */}
                          <div className={`group relative p-6 rounded-[2.5rem] shadow-2xl border transition-all duration-500 hover:scale-[1.01] ${
                            isAdmin 
                              ? 'bg-[#161b26] border-white/10 text-slate-200 rounded-tl-none shadow-black/60' 
                              : 'bg-blue-600 border-blue-400/30 text-white rounded-tr-none shadow-blue-900/40'
                          }`}>
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium tracking-tight selection:bg-white/20">{remark.text}</p>
                            
                            {/* Remark Attachments */}
                            {remark.attachments?.length > 0 && (
                              <div className={`mt-6 pt-5 border-t space-y-3 ${isAdmin ? 'border-white/5' : 'border-white/20'}`}>
                                {remark.attachments.map((file, fIdx) => (
                                  <button 
                                    key={fIdx}
                                    onClick={(e) => handleDownloadAttachment(e, rawTicketId, file._id, file.originalName || file.filename)}
                                    className={`flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all w-full text-left group/file overflow-hidden relative ${
                                      isAdmin 
                                        ? 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08]' 
                                        : 'bg-white/10 border-white/10 hover:bg-white/20'
                                    }`}
                                  >
                                    <div className={`p-3 rounded-xl transition-all duration-500 group-hover/file:scale-110 group-hover/file:rotate-6 ${isAdmin ? 'bg-blue-500/20 text-blue-400' : 'bg-white/20 text-white'}`}>
                                      <File size={18} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[12px] font-black truncate tracking-tight uppercase">{file.originalName || file.filename}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                         <span className="text-[9px] font-black opacity-50 tracking-[0.2em]">{(file.size / 1024).toFixed(1)} KB</span>
                                         <div className="w-1 h-1 bg-white/20 rounded-full" />
                                         <span className="text-[9px] font-black text-blue-400 tracking-[0.2em]">Verified File</span>
                                      </div>
                                    </div>
                                    <div className="p-2.5 bg-white/5 rounded-xl opacity-0 group-hover/file:opacity-100 transition-all">
                                      <Download size={16} />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* User Reply Input */}
              {ticket.status !== 'Resolved' && (
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] blur opacity-10 group-focus-within:opacity-30 transition duration-1000"></div>
                  <div className="relative">
                    <textarea 
                      id="remark-input"
                      placeholder="Type your message here..."
                      className="w-full bg-[#161b26] border border-white/10 rounded-[2rem] p-5 text-[15px] text-white focus:outline-none focus:border-blue-500/50 transition-all resize-none h-28 shadow-2xl pr-24 scrollbar-none font-medium placeholder:text-slate-600"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          document.getElementById('send-remark-btn').click();
                        }
                      }}
                    />
                    <div className="absolute right-4 bottom-4 flex items-center gap-2">
                       <input 
                         type="file" 
                         id="remark-file-input" 
                         multiple 
                         className="hidden" 
                         onChange={(e) => {
                           const count = e.target.files?.length || 0;
                           const label = document.getElementById('file-count-label');
                           if (label) label.innerText = count > 0 ? `${count} FILES` : '';
                         }}
                       />
                       <span id="file-count-label" className="text-[9px] font-black text-blue-400 uppercase tracking-widest"></span>
                       <button 
                         onClick={() => document.getElementById('remark-file-input').click()}
                         className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-all"
                         title="Attach Files"
                       >
                         <UploadCloud size={18} />
                       </button>
                       <button 
                        id="send-remark-btn"
                        onClick={async (e) => {
                          const textarea = document.getElementById('remark-input');
                          const fileInput = document.getElementById('remark-file-input');
                          const text = textarea.value.trim();
                          const files = fileInput.files ? Array.from(fileInput.files) : [];
                          
                          if (text || files.length > 0) {
                            setIsSubmitting(true);
                            try {
                              await useTicketStore.getState().updateTicketStatus(ticket.id, ticket.status, text, [], [], files);
                              textarea.value = '';
                              fileInput.value = '';
                              const label = document.getElementById('file-count-label');
                              if (label) label.innerText = '';
                              await fetchTickets();
                            } finally {
                              setIsSubmitting(false);
                            }
                          }
                        }}
                        disabled={isSubmitting}
                        className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Feedback Section */}
            {isResolved && (
              <div className="relative z-10 mt-6 border-t border-white/5 pt-6">
                {(ticket.original?.feedback?.rating && !showFeedbackForm) ? (
                   <div className="bg-[#1d2633]/50 border border-yellow-500/20 p-5 rounded-2xl shadow-inner">
                     <h3 className="text-[13px] font-bold text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <Star size={14} className="fill-yellow-500" /> Your Review
                     </h3>
                     <div className="flex items-center gap-1 mb-3">
                       {[1,2,3,4,5].map(star => (
                         <Star key={star} size={16} className={star <= ticket.original.feedback.rating ? "text-yellow-500 fill-yellow-500" : "text-white/10 fill-transparent"} />
                       ))}
                       <span className="ml-2 text-[13px] font-bold text-yellow-400">{ticket.original.feedback.rating}.0 / 5</span>
                     </div>
                     <p className="text-[14px] text-slate-300 font-medium italic">"{ticket.original.feedback.comment || 'No additional comments.'}"​</p>
                   </div>
                ) : showFeedbackForm ? (
                   <div className="bg-[#1d2633] border border-yellow-500/20 p-6 rounded-2xl shadow-xl">
                     <div className="flex items-center gap-2 mb-1">
                       <Star size={16} className="text-yellow-400 fill-yellow-400" />
                       <h3 className="text-[13px] font-bold text-yellow-400 uppercase tracking-widest">Rate This Resolution</h3>
                     </div>
                     <p className="text-[12px] text-slate-500 font-medium mb-5">Your feedback helps us improve our support quality.</p>
                     
                     <div className="mb-5">
                       <p className="text-[12px] font-bold text-slate-400 mb-3">How satisfied were you with the resolution? *</p>
                       <div className="flex gap-1">
                         {[1,2,3,4,5].map(star => (
                           <button 
                             key={star} 
                             onMouseEnter={() => setHoverRating(star)} 
                             onMouseLeave={() => setHoverRating(0)}
                             onClick={() => setRating(star)}
                             className="p-1 transition-transform hover:scale-110 outline-none"
                           >
                             <Star size={32} className={(hoverRating || rating) >= star ? "text-yellow-400 fill-yellow-400" : "text-white/10 fill-transparent"} />
                           </button>
                         ))}
                         {rating > 0 && (
                           <span className="ml-3 self-center text-[13px] font-bold text-yellow-400">
                             {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                           </span>
                         )}
                       </div>
                     </div>
                     
                     <div className="mb-5">
                        <p className="text-[12px] font-bold text-slate-400 mb-2">Additional Comments (optional)</p>
                        <textarea 
                          value={comment} 
                          onChange={e => setComment(e.target.value)}
                          placeholder="How was the support experience? Any suggestions?"
                          className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500/50 resize-none h-24 shadow-inner"
                        />
                     </div>
                     
                     <div className="flex justify-end gap-3">
                        <button onClick={() => setShowFeedbackForm(false)} className="px-4 py-2 text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                        <button 
                          onClick={handleSubmitFeedback} 
                          disabled={rating === 0 || isSubmitting}
                          className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-xl text-white font-bold text-[12px] shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Review'}
                          {!isSubmitting && <Send size={14} />}
                        </button>
                     </div>
                   </div>
                ) : isOwner ? (
                  <button
                    onClick={() => setShowFeedbackForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-[13px] font-bold hover:bg-yellow-500/20 transition-all"
                  >
                    <Star size={16} /> Rate This Resolution
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-white/5 bg-[#181f2b]/80 backdrop-blur-xl flex justify-end gap-4 sticky bottom-0 z-20">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-[13px] font-bold"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
