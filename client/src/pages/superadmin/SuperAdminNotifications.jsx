import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, Send, CheckCircle2 } from 'lucide-react';
import { useNotificationStore } from '../../core/store/useNotificationStore';
import { useDepartmentStore } from '../../core/store/useDepartmentStore';
import { useCompanyStore } from '../../core/store/useCompanyStore';

export default function SuperAdminNotifications() {
  const { broadcastNotification, isLoading } = useNotificationStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const { companies, fetchCompanies } = useCompanyStore();
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState('all');
  const [targetId, setTargetId] = useState('');
  const [successStatus, setSuccessStatus] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchCompanies();
  }, [fetchDepartments, fetchCompanies]);

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!title || !message) return;
    
    // Validate target bounds
    if (targetType !== 'all' && !targetId) {
      alert("Please select a target group.");
      return;
    }

    const payload = {
      title,
      message,
      targetType,
      targetId: targetType !== 'all' ? targetId : null
    };

    const success = await broadcastNotification(payload);
    if (success) {
      setSuccessStatus(true);
      setTitle('');
      setMessage('');
      setTimeout(() => setSuccessStatus(false), 3000);
    }
  };

  return (
    <div className="w-full pt-2 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Radio className="text-blue-500" size={32} /> Network Broadcaster
        </h1>
        <p className="text-slate-400 mt-2 font-medium">Deploy critical notifications across the platform hierarchy instantly.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-white/5 overflow-hidden bg-[#111620]"
      >
        <div className="p-8">
          <form onSubmit={handleDispatch} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Broadcast Target Scope</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button type="button" onClick={() => { setTargetType('all'); setTargetId(''); }} className={`px-4 py-3 rounded-xl border transition-all text-sm font-bold flex items-center justify-center gap-2 ${targetType === 'all' ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-[#181f2b] border-white/5 text-slate-400 hover:bg-white/5'}`}>
                  Global All
                </button>
                <button type="button" onClick={() => { setTargetType('department'); setTargetId(''); }} className={`px-4 py-3 rounded-xl border transition-all text-sm font-bold flex items-center justify-center gap-2 ${targetType === 'department' ? 'bg-purple-600/20 border-purple-500/50 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-[#181f2b] border-white/5 text-slate-400 hover:bg-white/5'}`}>
                  Target Department
                </button>
                <button type="button" onClick={() => { setTargetType('company'); setTargetId(''); }} className={`px-4 py-3 rounded-xl border transition-all text-sm font-bold flex items-center justify-center gap-2 ${targetType === 'company' ? 'bg-emerald-600/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'bg-[#181f2b] border-white/5 text-slate-400 hover:bg-white/5'}`}>
                  Target Company
                </button>
              </div>
            </div>

            {targetType === 'department' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Select Department</label>
                <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full bg-[#181f2b] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-purple-500/50 transition-all font-medium">
                  <option value="" disabled>Select specific department network...</option>
                  {departments.map(d => <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>)}
                </select>
              </motion.div>
            )}

            {targetType === 'company' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Select Company</label>
                <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full bg-[#181f2b] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500/50 transition-all font-medium">
                  <option value="" disabled>Select specific corporate network...</option>
                  {companies.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                </select>
              </motion.div>
            )}

            <div className="space-y-2 pt-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Broadcast Title *</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Alert Header..."
                className="w-full bg-[#181f2b] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-lg"
                required 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Broadcast Message *</label>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                placeholder="Content of the dispatch..."
                className="w-full bg-[#181f2b] border border-white/5 text-slate-300 rounded-xl px-4 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium resize-none leading-relaxed"
                required
              />
            </div>

            <div className="pt-4 flex flex-col-reverse sm:flex-row justify-between items-center sm:items-end gap-6 border-t border-white/5 mt-8">
              <div className="w-full sm:w-auto">
                {successStatus && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20">
                    <CheckCircle2 size={18} /> Network Broadcast Dispatched
                  </motion.div>
                )}
              </div>
              <button 
                type="submit" 
                disabled={isLoading || !title || !message || (targetType !== 'all' && !targetId)}
                className="w-full sm:w-auto justify-center px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] uppercase tracking-widest text-[13px]"
              >
                {isLoading ? <span className="animate-pulse">Transmitting...</span> : <><Send size={18} /> Dispatch Protocol</>}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
