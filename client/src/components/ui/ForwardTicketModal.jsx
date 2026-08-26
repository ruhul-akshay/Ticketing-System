import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ChevronRight, Users, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useConsultantStore } from '../../store/useConsultantStore';

export default function ForwardTicketModal({
  isOpen,
  ticket,
  onClose,
  onForward,
  isSubmitting = false
}) {
  const { user } = useAuthStore();
  const { consultants, fetchConsultants, isLoading: consultantsLoading } = useConsultantStore();

  const [selectedConsultantId, setSelectedConsultantId] = useState('');
  const [remarks, setRemarks] = useState('');
  const [ccConsultantIds, setCcConsultantIds] = useState([]);
  const [ccEmails, setCcEmails] = useState('');
  const [ccDropdownOpen, setCcDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen && consultants.length === 0) {
      fetchConsultants().catch((err) => console.error('Failed to fetch consultants:', err));
    }
  }, [isOpen, consultants.length, fetchConsultants]);

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setSelectedConsultantId('');
      setRemarks('');
      setCcConsultantIds([]);
      setCcEmails('');
      setCcDropdownOpen(false);
    }
  }, [isOpen]);

  if (!isOpen || !ticket) return null;

  const currentUserId = user?._id || user?.id;
  const rawTicketId = ticket.id || ticket._id || ticket.original?._id;
  const currentAssignedId =
    ticket.assignedTo?._id ||
    ticket.assignedTo?.id ||
    ticket.original?.assignedTo?._id ||
    ticket.original?.assignedTo?.id;

  const activeConsultants = consultants.filter((c) => c.status === 'active');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedConsultantId) {
      alert('Please select a consultant first.');
      return;
    }

    const ccs = [...ccConsultantIds];
    if (ccEmails.trim()) {
      const extra = ccEmails
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email.includes('@'));
      ccs.push(...extra);
    }

    try {
      await onForward(rawTicketId, selectedConsultantId, remarks, ccs);
      onClose();
    } catch (err) {
      console.error('Forward submission error:', err);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#020617]/80 backdrop-blur-xl z-[80]"
      />

      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-white dark:bg-[#111620] border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden font-sans"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Forward Ticket</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {ticket.ticketNumber ? `Ticket #${ticket.ticketNumber}` : ticket.title}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                Select Consultant to Forward To <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedConsultantId}
                onChange={(e) => setSelectedConsultantId(e.target.value)}
                disabled={consultantsLoading && consultants.length === 0}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-blue-500/50 cursor-pointer disabled:opacity-60"
              >
                <option value="">
                  {consultantsLoading && consultants.length === 0
                    ? 'Loading consultants...'
                    : '-- Choose Consultant --'}
                </option>
                {activeConsultants
                  .filter((c) => String(c._id || c.id) !== String(currentUserId))
                  .map((c) => (
                    <option key={c._id || c.id} value={c._id || c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
              </select>
            </div>

            {/* CC Consultants Dropdown */}
            <div className="space-y-1.5 relative">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                CC Consultants (Optional)
              </label>
              <div
                onClick={() => setCcDropdownOpen(!ccDropdownOpen)}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-xs font-bold flex justify-between items-center cursor-pointer select-none"
              >
                <span>
                  {ccConsultantIds.length === 0
                    ? '-- Choose CCs --'
                    : `${ccConsultantIds.length} Consultant(s) Selected`}
                </span>
                <ChevronRight
                  size={14}
                  className={`text-slate-400 transition-transform ${ccDropdownOpen ? 'rotate-90' : ''}`}
                />
              </div>

              {ccDropdownOpen && (
                <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-white/10 rounded-xl max-h-[140px] overflow-y-auto p-2.5 z-20 space-y-1.5 shadow-xl custom-scrollbar">
                  {activeConsultants
                    .filter(
                      (c) =>
                        String(c._id || c.id) !== String(currentAssignedId) &&
                        String(c._id || c.id) !== String(selectedConsultantId)
                    )
                    .map((c) => {
                      const id = c._id || c.id;
                      const isChecked = ccConsultantIds.includes(id);
                      return (
                        <label
                          key={id}
                          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer select-none text-[11px]"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setCcConsultantIds((prev) =>
                                isChecked ? prev.filter((item) => item !== id) : [...prev, id]
                              );
                            }}
                            className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                          />
                          <span className="truncate text-slate-700 dark:text-slate-200">{c.name}</span>
                        </label>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Additional CC Emails */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                Additional CC Emails (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. manager@domain.com, tech@domain.com"
                value={ccEmails}
                onChange={(e) => setCcEmails(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-blue-500/50"
              />
              <span className="text-[10px] text-slate-500 ml-1">Comma-separated email addresses.</span>
            </div>

            {/* Forwarding Remarks */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                Forwarding Remarks
              </label>
              <textarea
                placeholder="Provide context, instructions, or reason for forwarding..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 dark:bg-[#0b0f19] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-blue-500/50 resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !selectedConsultantId}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
              >
                <Send size={14} />
                {isSubmitting ? 'Forwarding...' : 'Forward Ticket'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
