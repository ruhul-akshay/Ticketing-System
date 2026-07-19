import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, UploadCloud, File } from 'lucide-react';
import { useClientStore } from '../../store/useClientStore';
import { useDepartmentStore } from '../../store/useDepartmentStore';
import { useTicketStore } from '../../store/useTicketStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePriorityStore } from '../../store/usePriorityStore';
import { Input } from '../Input';
import { Button } from '../Button';
import api from '../../api/mockAxios';

export default function CreateTicketConsultantModal({ isOpen, onClose }) {
  const { addTicket } = useTicketStore();
  const { clients, fetchClients } = useClientStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const { user } = useAuthStore();
  const { priorities, fetchPriorities } = usePriorityStore();

  useEffect(() => {
    if (isOpen) {
      fetchPriorities();
    }
  }, [isOpen, fetchPriorities]);
  const isConsultant = user?.role?.toLowerCase() === 'consultant' || user?.role?.toLowerCase() === 'admin';

  const availableDepartments = departments; // Show all departments like superadmin for now to match behavior

  const [formData, setFormData] = useState({
    clientId: '',
    userId: '',
    departmentId: '',
    title: '',
    description: '',
    priority: 'Medium',
    category: '',
    reason: '',
    erpIncidentType: '',
  });

  const [clientUsers, setClientUsers] = useState([]);
  const [departmentCategories, setDepartmentCategories] = useState([]);
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchDepartments();
    }
  }, [isOpen]); // Only fetch when modal opens

  // Auto-select client if only one is available (e.g. for Consultants)
  useEffect(() => {
    if (isOpen && clients.length === 1 && !formData.clientId) {
      const compId = clients[0]._id || clients[0].id;
      setFormData(prev => ({ ...prev, clientId: compId }));
    }
  }, [isOpen, clients, formData.clientId]);

  // Auto-select department and populate categories
  useEffect(() => {
    if (isOpen && availableDepartments.length > 0 && !formData.departmentId) {
      const dept = availableDepartments[0];
      const deptId = dept._id || dept.id;
      
      let catVal = 'General';
      if (dept.categories?.length > 0) {
        const firstCat = dept.categories[0];
        catVal = typeof firstCat === 'string' ? firstCat : (firstCat.name || firstCat._id || String(firstCat));
        setDepartmentCategories(dept.categories);
      } else {
        setDepartmentCategories([]);
      }
      
      setFormData(prev => ({ 
        ...prev, 
        departmentId: deptId,
        category: catVal
      }));
    }
  }, [isOpen, availableDepartments, formData.departmentId]);

  // Fetch users when client changes
  useEffect(() => {
    const fetchUsers = async () => {
      if (!formData.clientId) {
        setClientUsers([]);
        return;
      }
      try {
        const res = await api.get(`/client-users?clientId=${formData.clientId}`);
        const users = Array.isArray(res.data) ? res.data : (res.data.users || res.data.data || []);
        
        // Allow any user from this client (both 'user' and 'consultant' roles)
        const filtered = users.filter(u => u.role !== 'superadmin');
        setClientUsers(filtered);
        
        if (filtered.length > 0) {
          setFormData(prev => ({ ...prev, userId: filtered[0]._id || filtered[0].id }));
        } else {
          setFormData(prev => ({ ...prev, userId: '' }));
        }
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    };
    fetchUsers();
  }, [formData.clientId]);

  // Handle department change for categories mapping
  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    const dept = departments.find(d => d._id === deptId || d.id === deptId);
    if (dept && dept.categories?.length > 0) {
      const firstCat = dept.categories[0];
      const catVal = typeof firstCat === 'string' ? firstCat : (firstCat.name || firstCat._id || String(firstCat));
      setFormData(prev => ({ ...prev, departmentId: deptId, category: catVal }));
      setDepartmentCategories(dept.categories);
    } else {
      setFormData(prev => ({ ...prev, departmentId: deptId, category: 'General' }));
      setDepartmentCategories([]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles([...files, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientId || !formData.userId || !formData.departmentId || !formData.title || !formData.description) {
      alert("Validation Error: Please select a client, ensure a user is available, assign a department, and provide a title and description.");
      return;
    }
    
    setIsLoading(true);
    
    const payload = new FormData();
    payload.append('title', formData.title);
    payload.append('description', formData.description);
    payload.append('priority', formData.priority.toLowerCase());
    payload.append('department', formData.departmentId);
    payload.append('createdBy', formData.userId);
    if (formData.category) payload.append('category', formData.category);
    if (formData.reason) payload.append('reason', formData.reason);
    if (formData.erpIncidentType) payload.append('erpIncidentType', formData.erpIncidentType);
    
    files.forEach(file => {
      payload.append('attachments', file);
    });

    await addTicket(payload);
    
    setIsLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
          className="bg-[#111620] border border-white/10 w-full max-w-4xl rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
        >
          <div className="px-8 py-6 border-b border-white/5 bg-[#181f2b]/50 backdrop-blur-xl flex justify-between items-center sticky top-0 z-20">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">Create Ticket on Behalf</h2>
              <p className="text-[13px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Log an issue manually via Consultant delegation</p>
            </div>
            <button 
              type="button"
              onClick={onClose} 
              className="p-2.5 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-full transition-colors border border-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-8 overflow-y-auto relative scroll-smooth flex-1 custom-scrollbar">
             {/* Glowing ambient orb */}
             <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[100px] pointer-events-none" />

             <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
               {/* 2 cols: Client / User */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Client Framework *</label>
                   <select 
                     value={formData.clientId}
                     onChange={(e) => setFormData(p => ({ ...p, clientId: e.target.value }))}
                     className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-medium appearance-none shadow-inner"
                     required
                   >
                     <option value="">Select Target Client</option>
                     {Array.isArray(clients) && clients.map(c => (
                       <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                     ))}
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Delegated User *</label>
                   <select 
                     value={formData.userId}
                     onChange={(e) => setFormData(p => ({ ...p, userId: e.target.value }))}
                     className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-medium appearance-none disabled:opacity-50 shadow-inner"
                     required
                     disabled={!formData.clientId || clientUsers.length === 0}
                   >
                     <option value="">{clientUsers.length === 0 ? (formData.clientId ? 'Loading Users...' : 'Select Client First') : 'Select User Array'}</option>
                     {clientUsers.map(u => <option key={u._id || u.id} value={u._id || u.id}>{u.name || u.email}</option>)}
                   </select>
                 </div>
               </div>

               {/* Title */}
               <div className="space-y-2">
                 <Input 
                   label="Ticket Title"
                   value={formData.title} 
                   onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                   placeholder="E.g., Connection failure logic block"
                   required
                 />
               </div>

                 {/* 2 cols: Dept / Category */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Assigned Department *</label>
                     <select 
                       value={formData.departmentId}
                       onChange={handleDepartmentChange}
                       className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-medium appearance-none shadow-inner"
                       required
                     >
                      <option value="">Select Valid Department</option>
                       {availableDepartments.map(d => <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>)}
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Department Category</label>
                     <select 
                       value={formData.category}
                       onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                       className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-medium appearance-none shadow-inner"
                     >
                       {departmentCategories.map((c, i) => {
                         const catName = typeof c === 'string' ? c : (c.name || String(c));
                         const catVal = typeof c === 'string' ? c : (c.name || c._id || String(c));
                         return <option key={catVal || i} value={catVal}>{catName}</option>;
                       })}
                       {departmentCategories.length === 0 && <option value="General">General Null</option>}
                     </select>
                   </div>
                 </div>

                  {/* 2 cols: Priority & ERP Incident Type (Conditional) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Priority</label>
                      <select 
                        value={formData.priority}
                        onChange={(e) => setFormData(p => ({ ...p, priority: e.target.value }))}
                        className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-medium appearance-none shadow-inner"
                        required
                      >
                        {priorities.length > 0
                          ? priorities.map(p => <option key={p.name} value={p.name}>{p.name}</option>)
                          : ["Low", "Medium", "High", "Critical"].map(p => <option key={p} value={p}>{p}</option>)
                        }
                      </select>
                    </div>

                    {(() => {
                      const selectedClient = clients.find(c => (c._id || c.id) === formData.clientId);
                      const erpTypes = selectedClient?.erpDetails?.erpIncidentTypes || [];
                      if (erpTypes.length === 0) return null;
                      return (
                        <div className="space-y-2">
                          <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">ERP Incident Type *</label>
                          <select 
                            value={formData.erpIncidentType}
                            onChange={(e) => setFormData(p => ({ ...p, erpIncidentType: e.target.value }))}
                            className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-medium appearance-none shadow-inner"
                            required
                          >
                            <option value="">Select ERP Incident Type</option>
                            {erpTypes.map(t => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })()}
                  </div>

               <div className="space-y-2">
                 <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Description *</label>
                 <textarea 
                   value={formData.description}
                   onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                   rows={5}
                   placeholder="Extensive log data regarding the core issue..."
                   className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-blue-500/50 transition-all font-medium resize-none placeholder:text-slate-500 shadow-inner"
                   required
                 />
               </div>

               <div className="space-y-2">
                 <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">File Object Attachments</label>
                 <div 
                   onDragOver={e => e.preventDefault()}
                   onDrop={handleDrop}
                   onClick={() => document.getElementById('consultant-file-upload').click()}
                   className="w-full border-2 border-dashed border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center bg-[#1d2633]/50"
                 >
                   <input 
                     id="consultant-file-upload" 
                     type="file" 
                     multiple 
                     className="hidden" 
                     onChange={(e) => setFiles([...files, ...Array.from(e.target.files || [])])} 
                   />
                   <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                     <UploadCloud size={28} />
                   </div>
                   <p className="text-white text-sm font-bold tracking-wide">Attach Logs or PNG Traces</p>
                 </div>
                 {files.length > 0 && (
                   <div className="flex gap-2 flex-wrap mt-3">
                     {files.map((file, i) => (
                       <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[11px] font-bold text-white shadow-sm">
                         <File size={12} className="text-blue-400" />
                         {file.name}
                         <button type="button" onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, idx) => idx !== i)) }} className="text-slate-400 hover:text-red-400 ml-2 transition-colors"><X size={12} /></button>
                       </span>
                     ))}
                   </div>
                 )}
               </div>

             </form>
          </div>

          <div className="px-8 py-5 border-t border-white/5 bg-[#181f2b]/80 backdrop-blur-xl flex justify-end gap-4 sticky bottom-0 z-20">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-[13px] font-bold"
            >
              Cancel Operation
            </button>
            <Button 
              onClick={handleSubmit} 
              isLoading={isLoading}
              className="px-10 py-3"
              icon={Send}
            >
              Delegate Ticket Request
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
