import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Save } from 'lucide-react';
import { useConsultantStore } from '../../store/useConsultantStore';
import { Input } from '../Input';
import { Button } from '../Button';

export default function ManageConsultantModal({ isOpen, mode, consultant, onClose, departments }) {
  const { addConsultant, updateConsultant } = useConsultantStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', employeeCode: '',
    departmentId: '', phoneNumber: '', position: '',
    leaveFrom: '', leaveTo: '', hourlyCost: '0'
  });

  useEffect(() => {
    if (mode === 'edit' && consultant) {
      const formatDate = (dateVal) => {
        if (!dateVal) return '';
        try {
          return new Date(dateVal).toISOString().split('T')[0];
        } catch (e) {
          return '';
        }
      };

      setFormData({
        name: consultant.name || '',
        email: consultant.email || '',
        password: '',
        confirmPassword: '',
        employeeCode: consultant.employeeCode || '',
        departmentId: consultant.department?._id || consultant.departmentId || '',
        phoneNumber: consultant.phoneNumber || '',
        position: consultant.position || '',
        leaveFrom: formatDate(consultant.leaveFrom),
        leaveTo: formatDate(consultant.leaveTo),
        hourlyCost: consultant.hourlyCost !== undefined ? String(consultant.hourlyCost) : '0'
      });
    } else if (mode === 'create') {
      setFormData({
        name: '', email: '', password: '', confirmPassword: '', employeeCode: '',
        departmentId: '', phoneNumber: '', position: '',
        leaveFrom: '', leaveTo: '', hourlyCost: '0'
      });
    }
  }, [mode, consultant]);

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
      name: formData.name, email: formData.email,
      employeeCode: formData.employeeCode, departmentId: formData.departmentId,
      phoneNumber: formData.phoneNumber, position: formData.position,
      leaveFrom: formData.leaveFrom || null,
      leaveTo: formData.leaveTo || null,
      hourlyCost: Number(formData.hourlyCost) || 0
    };
    if (formData.password) payload.password = formData.password;

    let res;
    if (mode === 'create') {
      res = await addConsultant(payload);
    } else {
      res = await updateConsultant(consultant._id || consultant.id, payload);
    }
    
    setIsLoading(false);
    if (!res.success) { alert(res.message); } 
    else { onClose(); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md" />
      
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="bg-[#111620] border border-white/10 w-full max-w-2xl rounded-[2rem] shadow-[0_0_80px_rgba(237,27,47,0.2)] relative z-10 flex flex-col overflow-hidden max-h-[90vh]">
        <div className="px-8 py-6 border-b border-white/5 bg-[#181f2b]/50 backdrop-blur-xl flex justify-between items-center sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">{mode === 'create' ? 'Register Consultant Node' : 'Modify Core Consultant'}</h2>
            <p className="text-[13px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">{mode === 'create' ? 'Elevate a new identity' : `Editing super-record ${consultant?.id || consultant?._id || ''}`}</p>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors border border-white/5"><X size={20} /></button>
        </div>

        <div className="p-8 overflow-y-auto relative custom-scrollbar flex-1">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/10 blur-[100px] pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Consultant Name *" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
              <Input label="Secure Email Address *" type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} disabled={mode === 'edit'} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label={mode === 'create' ? 'Access Password *' : 'Override Password'} type="password" value={formData.password} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} required={mode === 'create'} />
              <Input label={mode === 'create' ? 'Confirm Hash *' : 'Confirm Override'} type="password" value={formData.confirmPassword} onChange={e => setFormData(p => ({ ...p, confirmPassword: e.target.value }))} required={mode === 'create' || formData.password.length > 0} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="EMPLOYEE ID" value={formData.employeeCode} onChange={e => setFormData(p => ({ ...p, employeeCode: e.target.value }))} />
              <Input label="Consultant Title" value={formData.position} onChange={e => setFormData(p => ({ ...p, position: e.target.value }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest mb-2 block">Delegated Department</label>
                <select value={formData.departmentId} onChange={e => setFormData(p => ({ ...p, departmentId: e.target.value }))} className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500/50 shadow-inner appearance-none text-sm font-medium">
                  <option value="">Global / No Scope</option>
                  {departments.map(d => <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>)}
                </select>
              </div>
              <Input 
                label="Hourly Cost (INR/hr) *" 
                type="number" 
                min="0" 
                value={formData.hourlyCost} 
                onChange={e => setFormData(p => ({ ...p, hourlyCost: e.target.value }))} 
                required 
              />
            </div>

            {/* Leave Period Section */}
            {mode === 'edit' && (
              <div className="border-t border-white/5 pt-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Leave Schedule Settings</h3>
                  <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                    Mark this consultant as temporarily On Leave. The system will skip auto-assignments and block manual assignments for dates within this window.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label="Leave From Date" 
                    type="date" 
                    value={formData.leaveFrom} 
                    onChange={e => setFormData(p => ({ ...p, leaveFrom: e.target.value }))} 
                  />
                  <Input 
                    label="Leave To Date" 
                    type="date" 
                    value={formData.leaveTo} 
                    onChange={e => setFormData(p => ({ ...p, leaveTo: e.target.value }))} 
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="px-8 py-5 border-t border-white/5 bg-[#181f2b]/80 backdrop-blur-xl flex justify-end gap-4 sticky bottom-0 z-20">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-[13px] font-bold">Abort Key Gen</button>
          <Button onClick={handleSubmit} isLoading={isLoading} className="px-10 py-3 bg-gradient-to-r from-red-600 to-[#ED1B2F] hover:from-red-500 hover:to-red-400" icon={mode === 'create' ? Send : Save}>{mode === 'create' ? 'Elevate Key' : 'Flash Memory'}</Button>
        </div>
      </motion.div>
    </div>
  );
}
