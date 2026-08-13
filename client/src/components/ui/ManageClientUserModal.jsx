import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Save } from 'lucide-react';
import { useClientUserStore } from '../../store/useClientUserStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Input } from '../Input';
import { Button } from '../Button';

export default function ManageClientUserModal({ isOpen, mode, user, onClose, clients }) {
  const { addClientUser, updateClientUser } = useClientUserStore();
  const { user: currentUser } = useAuthStore();
  const isClientUser = currentUser?.role === 'Client User';
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', employeeCode: '',
    clientId: '', phoneNumber: '', position: '', status: 'active', statusReason: ''
  });

  const isSelf = user && (user._id === currentUser?._id || user.id === currentUser?._id || user._id === (currentUser?.id || currentUser?._id));

  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        employeeCode: user.employeeCode || '',
        clientId: user.client?._id || user.clientId || (isClientUser ? (currentUser?.client?._id || currentUser?.client) : ''),
        phoneNumber: user.phoneNumber || '',
        position: user.position || '',
        status: user.status || 'active',
        statusReason: user.statusReason || ''
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        employeeCode: '',
        clientId: isClientUser ? (currentUser?.client?._id || currentUser?.client) : '',
        phoneNumber: '',
        position: '',
        status: 'active',
        statusReason: ''
      });
    }
  }, [mode, user, isClientUser, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords mismatch.");
      return;
    }
    if (mode === 'create' && formData.password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    
    const payload = {
      name: formData.name, email: formData.email, role: 'clientuser',
      employeeCode: formData.employeeCode, clientId: formData.clientId,
      phoneNumber: formData.phoneNumber, position: formData.position,
      status: formData.status, statusReason: formData.statusReason
    };
    if (formData.password) payload.password = formData.password;

    let res;
    if (mode === 'create') {
      res = await addClientUser(payload);
    } else {
      res = await updateClientUser(user._id || user.id, payload);
    }
    
    setIsLoading(false);
    if (!res.success) { alert(res.message); } 
    else { onClose(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="bg-[#111620] border border-white/10 w-full max-w-2xl rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-8 py-6 border-b border-white/5 bg-[#181f2b]/50 backdrop-blur-xl flex justify-between items-center sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{mode === 'create' ? 'Register Identity' : 'Modify Sub-Node Data'}</h2>
            <p className="text-[13px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{mode === 'create' ? 'Provision a new client user into the platform' : `Editing record ${user?.id || user?._id || ''}`}</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors border border-white/5"><X size={20} /></button>
        </div>

        <div className="p-8 overflow-y-auto relative custom-scrollbar flex-1">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[100px] pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Full Name *" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
              <Input label="Email Address *" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label={mode === 'create' ? 'Access Password *' : 'Override Password'} type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} required={mode === 'create'} />
              <Input label={mode === 'create' ? 'Confirm Password  *' : 'Confirm Override'} type="password" value={formData.confirmPassword} onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} required={mode === 'create' || formData.password.length > 0} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Internal Employee Code" value={formData.employeeCode} onChange={e => setFormData(p => ({ ...p, employeeCode: e.target.value }))} />
              <Input label="Position Title" value={formData.position} onChange={e => setFormData(p => ({ ...p, position: e.target.value }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!isClientUser ? (
                <>
                  <div className="space-y-2">
                    <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest mb-2 block">Assigned Client Scope</label>
                    <select value={formData.clientId} onChange={e => setFormData(p => ({ ...p, clientId: e.target.value }))} className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 shadow-inner appearance-none text-sm font-medium">
                      <option value="">No Client Scope</option>
                      {clients.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <Input label="Phone Contact" value={formData.phoneNumber} onChange={e => setFormData(p => ({ ...p, phoneNumber: e.target.value }))} />
                </>
              ) : (
                <div className="md:col-span-2">
                  <Input label="Phone Contact" value={formData.phoneNumber} onChange={e => setFormData(p => ({ ...p, phoneNumber: e.target.value }))} />
                </div>
              )}
            </div>

            {mode === 'edit' && !isSelf && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-white/5 pt-6">
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest mb-2 block">Account Status</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} 
                    className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 shadow-inner appearance-none text-sm font-medium"
                  >
                    <option value="active">🟢 Active</option>
                    <option value="suspended">🔴 Inactive</option>
                  </select>
                </div>
                {formData.status === 'suspended' && (
                  <Input 
                    label="Reason for Inactivation" 
                    value={formData.statusReason} 
                    onChange={e => setFormData(p => ({ ...p, statusReason: e.target.value }))} 
                    placeholder="Enter reason..."
                    required
                  />
                )}
              </div>
            )}
          </form>
        </div>

        <div className="px-8 py-5 border-t border-white/5 bg-[#181f2b]/80 backdrop-blur-xl flex justify-end gap-4 sticky bottom-0 z-20">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-[13px] font-bold">Abort Sync</button>
          <Button onClick={handleSubmit} isLoading={isLoading} className="px-10 py-3" icon={mode === 'create' ? Send : Save}>{mode === 'create' ? 'Provision Account' : 'Commit Revisions'}</Button>
        </div>
      </motion.div>
    </div>
  );
}
