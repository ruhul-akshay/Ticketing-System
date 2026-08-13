import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, File, X, Send, Mail, AlertOctagon, 
  HelpCircle, ArrowDown, ArrowUp, Zap, Radio, Layers
} from 'lucide-react';
import { useTicketStore } from '../../store/useTicketStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useDepartmentStore } from '../../store/useDepartmentStore';
import { usePriorityStore } from '../../store/usePriorityStore';
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

export default function CreateTicket() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [ccEmails, setCcEmails] = useState(['']);
  const [files, setFiles] = useState([]);
  const [erpIncidentType, setErpIncidentType] = useState('');
  const [clientData, setClientData] = useState(null);
  
  const { addTicket, isLoading } = useTicketStore();
  const { user } = useAuthStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const { priorities, fetchPriorities } = usePriorityStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await api.get('/clients/my-client');
        if (res.data.success) {
          setClientData(res.data.client);
        }
      } catch (err) {
        console.error('Failed to fetch client details', err);
      }
    };
    if (user?.role === 'clientuser') {
      fetchClient();
    }
  }, [user]);

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

  const handleAddCcEmail = () => {
    setCcEmails([...ccEmails, '']);
  };

  const handleRemoveCcEmail = (index) => {
    const updated = ccEmails.filter((_, i) => i !== index);
    setCcEmails(updated.length === 0 ? [''] : updated);
  };

  const handleCcEmailChange = (index, value) => {
    const updated = [...ccEmails];
    updated[index] = value;
    setCcEmails(updated);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setFiles([...files, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !department) return;

    // Validate CC Emails if present
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const activeEmails = ccEmails.map(e => e.trim()).filter(Boolean);
    const invalidEmails = activeEmails.filter(email => !emailRegex.test(email));
        
    if (invalidEmails.length > 0) {
      alert(`The following CC email addresses are invalid: ${invalidEmails.join(', ')}`);
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('priority', priority.toLowerCase());
    formData.append('department', department);
    if (category) formData.append('category', category);
    
    activeEmails.forEach(email => {
      formData.append('ccEmails', email);
    });

    if (erpIncidentType) formData.append('erpIncidentType', erpIncidentType);
    
    files.forEach(file => {
      formData.append('attachments', file);
    });

    await addTicket(formData);
    navigate('/my-tickets');
  };

  const selectedDepartmentObj = departments.find(d => d._id === department);

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
            Initialize Support Token
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Fill in the parameters below to open a ticket in the routing registry.
          </p>
        </div>
      </div>

      <motion.form 
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-6 md:p-10 space-y-10 relative z-10 max-w-4xl mx-auto shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 blur-[100px] pointer-events-none rounded-full" />

        {/* SECTION 1: CORE CLASSIFICATION */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <div className="p-1 bg-blue-500/10 text-blue-400 rounded-lg"><Layers size={16} /></div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">1. Token Classification</h3>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ticket Title *</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., SAP Business One database sync connection failed"
              className="w-full bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-bold placeholder:text-slate-500 text-xs shadow-inner"
              required 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Routing Department *</label>
              <select 
                value={department}
                onChange={handleDepartmentChange}
                className="w-full bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-xs cursor-pointer shadow-inner"
                required
              >
                {departments.length === 0 && <option value="">Loading departments...</option>}
                {departments.map(dept => (
                  <option key={dept._id} value={dept._id}>{dept.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-xs cursor-pointer shadow-inner"
              >
                {selectedDepartmentObj?.categories?.length > 0 ? (
                  selectedDepartmentObj.categories.map((c, i) => {
                    const catName = typeof c === 'string' ? c : (c.name || String(c));
                    const catVal = typeof c === 'string' ? c : (c.name || c._id || String(c));
                    return <option key={catVal || i} value={catVal}>{catName}</option>;
                  })
                ) : (
                  <option value="General">General</option>
                )}
              </select>
            </div>

            {clientData?.erpDetails?.erpIncidentTypes && clientData.erpDetails.erpIncidentTypes.length > 0 && (
              <div className="space-y-2">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">ERP Incident Type *</label>
                <select 
                  value={erpIncidentType}
                  onChange={(e) => setErpIncidentType(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-xs cursor-pointer shadow-inner"
                  required
                >
                  <option value="">-- Select ERP Type --</option>
                  {clientData.erpDetails.erpIncidentTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: PRIORITY & CC EMAILS */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <div className="p-1 bg-yellow-500/10 text-yellow-400 rounded-lg"><AlertOctagon size={16} /></div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">2. Urgency & Notification Routing</h3>
          </div>

          {/* Interactive Priority Grid */}
          <div className="space-y-3">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">Select Priority Level</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Low', 'Medium', 'High', 'Critical'].map(pName => {
                const themeKey = pName.toLowerCase();
                const theme = PRIORITY_THEMES[themeKey] || {};
                const isActive = priority === pName;
                return (
                  <button
                    key={pName}
                    type="button"
                    onClick={() => setPriority(pName)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-300 select-none cursor-pointer ${
                      isActive ? theme.active : `bg-slate-100/50 dark:bg-[#141a24]/55 border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 ${theme.border}`
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${isActive ? 'bg-white/10' : 'bg-slate-200 dark:bg-white/5'}`}>
                      {theme.icon}
                    </div>
                    <span className="text-[13px] font-black">{pName}</span>
                    <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wider">{theme.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CC Emails Array */}
          <div className="space-y-3 pt-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
              CC Manager Emails
              <span className="ml-2 text-[10px] font-normal text-slate-500 normal-case tracking-normal">(Optional notifications)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence initial={false}>
                {ccEmails.map((email, index) => (
                  <motion.div 
                    key={index} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleCcEmailChange(index, e.target.value)}
                        placeholder="manager@company.com"
                        className="w-full bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500/50 transition-all font-bold text-xs placeholder:text-slate-500 shadow-inner"
                      />
                    </div>
                    {ccEmails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCcEmail(index)}
                        className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 hover:text-red-400 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer"
                        title="Remove CC Email"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={handleAddCcEmail}
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/25 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer mt-2 inline-flex items-center gap-1.5"
            >
              + Add CC Recipient
            </button>
          </div>
        </div>

        {/* SECTION 3: DESCRIPTION & LOGS */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <div className="p-1 bg-indigo-500/10 text-indigo-400 rounded-lg"><UploadCloud size={16} /></div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">3. Narrative & Attached Assets</h3>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Detailed Description *</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              placeholder="State the technical conditions and error codes (e.g. Database connectivity timed out while saving sales order payload; SAP return code: 10004)"
              className="w-full bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-semibold text-xs resize-none placeholder:text-slate-500 shadow-inner leading-relaxed"
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Attachments & System Logs</label>
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload').click()}
              className="w-full border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl p-8 hover:border-blue-500/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center group bg-slate-100/50 dark:bg-[#181f2b]/40 relative overflow-hidden"
            >
              <input 
                id="file-upload" 
                type="file" 
                multiple 
                className="hidden" 
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles([...files, ...Array.from(e.target.files)]);
                  }
                }} 
              />
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                <UploadCloud size={24} />
              </div>
              <p className="text-slate-800 dark:text-white font-bold text-xs uppercase tracking-wider">Drag Files Here or click to Browse</p>
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold mt-1.5 uppercase tracking-widest">Upload config sheets, screen captures, or log files (max. 10MB each)</p>
            </div>

            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3 min-w-0">
                      <File size={16} className="text-blue-500 dark:text-blue-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[200px]">{file.name}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeFile(i)}
                      className="text-slate-400 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS FOOTER */}
        <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-white/5 bg-transparent">
          <button
            type="button"
            onClick={() => navigate('/my-tickets')}
            className="w-full sm:w-auto px-6 py-3.5 text-slate-500 hover:text-slate-800 dark:hover:text-white text-xs font-black uppercase tracking-widest transition-colors text-center cursor-pointer"
          >
            Abort Request
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl px-10 py-3.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/10 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                Register Ticket <Send size={14} />
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
