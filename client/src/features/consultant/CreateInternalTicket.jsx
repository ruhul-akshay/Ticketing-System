import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, File, X, Send, Mail, AlertOctagon, 
  HelpCircle, ArrowDown, ArrowUp, Zap, Radio, Layers, Users, Building2, Loader2, RefreshCw
} from 'lucide-react';
import { useTicketStore } from '../../store/useTicketStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useDepartmentStore } from '../../store/useDepartmentStore';
import { useConsultantStore } from '../../store/useConsultantStore';
import { useClientStore } from '../../store/useClientStore';
import api from '../../api/mockAxios';
import { useNavigate } from 'react-router-dom';

const PRIORITY_THEMES = {
  low: {
    border: 'border-blue-500/20 hover:border-blue-500/40',
    active: 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)]',
    icon: <ArrowDown size={14} className="text-blue-500" />,
    label: 'Low Urgency'
  },
  medium: {
    border: 'border-yellow-500/20 hover:border-yellow-500/40',
    active: 'border-yellow-500 bg-yellow-500/10 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.15)]',
    icon: <HelpCircle size={14} className="text-yellow-500" />,
    label: 'Medium Status'
  },
  high: {
    border: 'border-orange-500/20 hover:border-orange-500/40',
    active: 'border-orange-500 bg-orange-500/10 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.15)]',
    icon: <ArrowUp size={14} className="text-orange-500" />,
    label: 'High Priority'
  },
  critical: {
    border: 'border-red-500/20 hover:border-red-500/40',
    active: 'border-red-500 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]',
    icon: <Zap size={14} className="text-red-500" />,
    label: 'Mission Critical'
  }
};

export default function CreateInternalTicket() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [ccEmails, setCcEmails] = useState(['']);
  const [files, setFiles] = useState([]);
  
  // Internal ticket specific states
  const [assignedTo, setAssignedTo] = useState('');
  const [assignedConsultants, setAssignedConsultants] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [clientUsers, setClientUsers] = useState([]);
  const [selectedClientUser, setSelectedClientUser] = useState('');
  const [isVisibleToClient, setIsVisibleToClient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(false);

  const { addTicket } = useTicketStore();
  const { user } = useAuthStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  // Use shared stores — data is cached and shared across all components
  const { consultants, fetchConsultants, isLoading: consultantsLoading } = useConsultantStore();
  const { clients, fetchClients, isLoading: clientsLoading } = useClientStore();
  const navigate = useNavigate();

  const loadData = useCallback(async (force = false) => {
    setDataLoading(true);
    setDataError(false);
    try {
      await Promise.all([
        fetchDepartments(),
        fetchConsultants({ force }),
        fetchClients({}, { force }),
      ]);
    } catch (err) {
      console.error('Failed to load form data:', err);
      setDataError(true);
    } finally {
      setDataLoading(false);
    }
  }, [fetchDepartments, fetchConsultants, fetchClients]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Fetch client users when client selection changes
  useEffect(() => {
    if (selectedClient) {
      api.get(`/client-users?clientId=${selectedClient}&limit=1000`)
        .then(res => {
          if (res.data.success) {
            setClientUsers(res.data.users || []);
          }
        })
        .catch(err => {
          console.error('Failed to load client users:', err);
          setClientUsers([]);
        });
    } else {
      setClientUsers([]);
      setSelectedClientUser('');
      setIsVisibleToClient(false);
    }
  }, [selectedClient]);

  // Set default department & category
  useEffect(() => {
    if (departments.length > 0 && !department) {
      setDepartment(departments[0]._id);
      if (departments[0].categories?.length > 0) {
        setCategory(departments[0].categories[0]);
      }
    }
  }, [departments, department]);

  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    setDepartment(deptId);
    const dept = departments.find(d => d._id === deptId);
    if (dept && dept.categories?.length > 0) {
      const firstCat = dept.categories[0];
      setCategory(typeof firstCat === 'string' ? firstCat : (firstCat.name || firstCat._id || String(firstCat)));
    } else {
      setCategory('');
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCcChange = (index, val) => {
    const updated = [...ccEmails];
    updated[index] = val;
    setCcEmails(updated);
  };

  const addCcField = () => setCcEmails([...ccEmails, '']);
  const removeCcField = (index) => setCcEmails(ccEmails.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const effectiveAssignees = assignedConsultants.length > 0 ? assignedConsultants : (assignedTo ? [assignedTo] : []);
    if (!title || !description || !department || effectiveAssignees.length === 0) {
      setError('Please fill in all required fields (Title, Description, Department, and at least one Assigned Consultant).');
      return;
    }

    setSubmitting(true);
    setError('');

    // Validate CC Emails if present
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const activeEmails = ccEmails.map(e => e.trim()).filter(Boolean);
    const invalidEmails = activeEmails.filter(email => !emailRegex.test(email));
        
    if (invalidEmails.length > 0) {
      setError(`The following CC email addresses are invalid: ${invalidEmails.join(', ')}`);
      setSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('priority', priority.toLowerCase());
    formData.append('department', department);
    if (category) formData.append('category', category);
    
    // Internal Ticket details
    formData.append('isInternal', 'true');
    formData.append('assignedTo', effectiveAssignees[0]);
    effectiveAssignees.forEach(id => {
      formData.append('assignedConsultants', id);
    });
    if (selectedClient) formData.append('client', selectedClient);
    if (selectedClientUser) formData.append('clientUser', selectedClientUser);
    formData.append('isVisibleToClient', isVisibleToClient ? 'true' : 'false');
    
    activeEmails.forEach(email => {
      formData.append('ccEmails', email);
    });

    files.forEach(file => {
      formData.append('attachments', file);
    });

    try {
      await addTicket(formData);
      navigate(user?.role === 'Super Admin' ? '/super-admin/tickets' : '/consultant/tickets');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to initialize internal ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full relative font-sans p-4 md:p-8 space-y-8 min-h-screen">
      {/* Glow effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Radio className="text-blue-500 animate-pulse shrink-0" size={32} />
            Raise Internal Ticket
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Create a ticket to collaborate with other consultants.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8 relative z-10">
        {/* Left 2 Columns: Core Form Content */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6">
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[13px] font-bold flex items-center gap-3">
                <AlertOctagon size={18} className="shrink-0" />
                {error}
              </div>
            )}

            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                Ticket Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue or task..."
                className="w-full bg-[#181f2b] border border-white/5 hover:border-white/10 focus:border-blue-500/40 rounded-2xl p-4 text-[14px] text-white placeholder-slate-500 focus:outline-none transition-colors"
                required
              />
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide detailed instructions, context, or requirements..."
                rows={6}
                className="w-full bg-[#181f2b] border border-white/5 hover:border-white/10 focus:border-blue-500/40 rounded-2xl p-4 text-[14px] text-white placeholder-slate-500 focus:outline-none transition-colors resize-none"
                required
              />
            </div>

            {/* CC Email Recipients */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                  CC Emails (Notify others)
                </label>
                <button
                  type="button"
                  onClick={addCcField}
                  className="text-[10px] font-black text-blue-400 hover:text-white uppercase tracking-wider"
                >
                  + Add Recipient
                </button>
              </div>
              <div className="space-y-2">
                {ccEmails.map((email, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleCcChange(index, e.target.value)}
                        placeholder="collaborator@company.com"
                        className="w-full bg-[#181f2b] border border-white/5 hover:border-white/10 focus:border-blue-500/40 rounded-2xl py-3.5 pl-11 pr-4 text-[13px] text-white placeholder-slate-500 focus:outline-none transition-colors"
                      />
                    </div>
                    {ccEmails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCcField(index)}
                        className="p-3 bg-[#181f2b] border border-white/5 hover:border-red-500/30 hover:text-red-400 rounded-2xl transition-colors"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* File Drag and Drop / Uploader */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                Attach Supporting Assets
              </label>
              <div className="border border-dashed border-white/10 hover:border-blue-500/40 rounded-3xl p-8 text-center transition-colors relative cursor-pointer group bg-[#181f2b]/40">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud size={40} className="mx-auto text-slate-500 group-hover:text-blue-400 transition-colors mb-4" />
                <p className="text-[14px] font-bold text-white group-hover:text-blue-400 transition-colors">Drag and drop assets here</p>
                <p className="text-[12px] text-slate-500 mt-1">or browse files from your computer</p>
              </div>

              {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[#181f2b] border border-white/5 rounded-2xl text-[12px] text-slate-300">
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <File size={16} className="text-blue-400 shrink-0" />
                        <span className="truncate font-medium">{file.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Metadata & Controls */}
        <div className="space-y-6">
          {/* Assignment & Routing Parameters */}
          <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl space-y-6">
            <h3 className="text-md font-bold text-white border-b border-white/5 pb-3">Routing & Target</h3>
            
            {/* Assignee Selection (Multiple Consultants Support) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                  Assign to Consultant(s) <span className="text-red-500">*</span>
                </label>
                {(dataLoading || consultantsLoading) && (
                  <Loader2 size={13} className="text-blue-400 animate-spin" />
                )}
                {dataError && !dataLoading && (
                  <button type="button" onClick={() => loadData(true)} className="flex items-center gap-1 text-[10px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-widest">
                    <RefreshCw size={11} /> Retry
                  </button>
                )}
              </div>
              <div className="relative">
                <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !assignedConsultants.includes(val)) {
                      const updated = [...assignedConsultants, val];
                      setAssignedConsultants(updated);
                      if (!assignedTo) setAssignedTo(val);
                    }
                  }}
                  className="w-full bg-[#181f2b] border border-white/5 hover:border-white/10 focus:border-blue-500/40 rounded-2xl py-3.5 pl-11 pr-4 text-[13px] text-white focus:outline-none appearance-none cursor-pointer disabled:opacity-60"
                  disabled={dataLoading || consultantsLoading}
                >
                  <option value="">
                    {(dataLoading || consultantsLoading) ? 'Loading consultants...' : consultants.length === 0 ? 'No consultants found' : '+ Select / Add Consultant'}
                  </option>
                  {consultants
                    .filter(c => !assignedConsultants.includes(c._id))
                    .map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                    ))
                  }
                </select>
              </div>

              {/* Selected Consultant Badges */}
              {assignedConsultants.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {assignedConsultants.map(id => {
                    const consultantObj = consultants.find(c => (c._id === id || c.id === id));
                    return (
                      <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold shadow-sm">
                        <Users size={12} /> {consultantObj?.name || 'Consultant'}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = assignedConsultants.filter(cId => cId !== id);
                            setAssignedConsultants(updated);
                            if (assignedTo === id) setAssignedTo(updated[0] || '');
                          }}
                          className="text-blue-400 hover:text-white rounded-full bg-white/5 hover:bg-white/20 p-0.5 ml-0.5 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Department Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                Target Department <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  value={department}
                  onChange={handleDepartmentChange}
                  className="w-full bg-[#181f2b] border border-white/5 hover:border-white/10 focus:border-blue-500/40 rounded-2xl py-3.5 pl-11 pr-4 text-[13px] text-white focus:outline-none appearance-none cursor-pointer"
                  required
                >
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Select */}
            {department && (
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                  Issue Classification
                </label>
                <div className="relative">
                  <Layers size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#181f2b] border border-white/5 hover:border-white/10 focus:border-blue-500/40 rounded-2xl py-3.5 pl-11 pr-4 text-[13px] text-white focus:outline-none appearance-none cursor-pointer"
                  >
                    <option value="">None</option>
                    {departments.find(d => d._id === department)?.categories?.map((cat) => {
                      const val = typeof cat === 'string' ? cat : (cat.name || cat._id || String(cat));
                      return <option key={val} value={val}>{val}</option>;
                    })}
                  </select>
                </div>
              </div>
            )}

            {/* Priority Selector */}
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                Task Urgency Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PRIORITY_THEMES).map(([lvl, theme]) => {
                  const isActive = priority === lvl;
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriority(lvl)}
                      className={`p-3 rounded-2xl border transition-all duration-300 text-left flex flex-col justify-between h-20 ${
                        isActive ? theme.active : `bg-[#181f2b] ${theme.border}`
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        {theme.icon}
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-current animate-pulse' : 'bg-transparent'}`} />
                      </div>
                      <span className={`text-[12px] font-bold tracking-tight capitalize ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {lvl}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Client & Client User Association (Optional) */}
          <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl space-y-6">
            <h3 className="text-md font-bold text-white border-b border-white/5 pb-3">Client Association (Optional)</h3>

            {/* Client Select */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
                  Select Client Company
                </label>
                {(dataLoading || clientsLoading) && (
                  <Loader2 size={13} className="text-blue-400 animate-spin" />
                )}
              </div>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-[#181f2b] border border-white/5 hover:border-white/10 focus:border-blue-500/40 rounded-2xl py-3.5 px-4 text-[13px] text-white focus:outline-none appearance-none cursor-pointer disabled:opacity-60"
                disabled={dataLoading || clientsLoading}
              >
                <option value="">
                  {(dataLoading || clientsLoading) ? 'Loading clients...' : '-- None (Purely Internal) --'}
                </option>
                {clients.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Client User Select */}
            <div className="space-y-2">
              <label className={`text-[11px] font-black uppercase tracking-widest block ${selectedClient ? 'text-slate-400' : 'text-slate-600'}`}>
                Select Client Contact User
              </label>
              <select
                value={selectedClientUser}
                onChange={(e) => setSelectedClientUser(e.target.value)}
                className="w-full bg-[#181f2b] border border-white/5 hover:border-white/10 focus:border-blue-500/40 rounded-2xl py-3.5 px-4 text-[13px] text-white focus:outline-none appearance-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!selectedClient}
              >
                <option value="">-- None --</option>
                {clientUsers.map(u => {
                  let displayName = u.name || u.contactPerson || '';
                  if (!displayName || displayName === u.email || (displayName.includes('@') && displayName.includes('.'))) {
                    if (u.email && u.email.includes('@')) {
                      displayName = u.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    } else {
                      displayName = u.email || 'Client User';
                    }
                  }
                  const label = (u.email && u.email !== displayName) ? `${displayName} (${u.email})` : displayName;
                  return (
                    <option key={u._id || u.id} value={u._id || u.id}>{label}</option>
                  );
                })}
              </select>
            </div>

            {/* Visible to Client Checkbox */}
            {selectedClient && (
              <div className="flex items-center gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-2xl transition-all">
                <input
                  type="checkbox"
                  id="isVisibleToClient"
                  checked={isVisibleToClient}
                  onChange={(e) => setIsVisibleToClient(e.target.checked)}
                  className="w-4.5 h-4.5 accent-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="isVisibleToClient" className="text-[12px] font-bold text-slate-300 hover:text-white cursor-pointer select-none">
                  Make ticket visible to this Client
                </label>
              </div>
            )}
          </div>

          {/* Submission Action */}
          <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl flex flex-col gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:text-slate-400 transition-colors py-4 rounded-2xl text-[14px] font-black text-white shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 focus:outline-none cursor-pointer"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Initializing Token...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Create Internal Ticket</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate(user?.role === 'Super Admin' ? '/super-admin/tickets' : '/consultant/tickets')}
              className="w-full bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:text-white transition-all py-3.5 rounded-2xl text-[13px] font-bold text-slate-400 focus:outline-none cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
