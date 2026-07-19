import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, File, X, Send, Mail } from 'lucide-react';
import { useTicketStore } from '../../store/useTicketStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useDepartmentStore } from '../../store/useDepartmentStore';
import { usePriorityStore } from '../../store/usePriorityStore';
import api from '../../api/mockAxios';
import { useNavigate } from 'react-router-dom';

export default function CreateTicket() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [ccEmail, setCcEmail] = useState('');
  const [files, setFiles] = useState([]);
  const [erpIncidentType, setErpIncidentType] = useState('');
  const [clientData, setClientData] = useState(null);
  
  const { addTicket, isLoading } = useTicketStore();
  const { user } = useAuthStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const { priorities, fetchPriorities } = usePriorityStore();

  useEffect(() => {
    fetchPriorities();
  }, [fetchPriorities]);
  const navigate = useNavigate();

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

  // When department changes, auto-select its first category
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

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('priority', priority.toLowerCase());
    formData.append('department', department);
    if (category) formData.append('category', category);
    if (ccEmail && ccEmail.trim()) formData.append('ccEmails', ccEmail.trim());
    if (erpIncidentType) formData.append('erpIncidentType', erpIncidentType);
    
    files.forEach(file => {
      formData.append('attachments', file);
    });

    await addTicket(formData);
    
    navigate('/my-tickets');
  };

  const selectedDepartmentObj = departments.find(d => d._id === department);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-8 w-full"
    >
      <div className="mb-8 pl-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Create New Ticket</h1>
        <p className="text-muted-foreground mt-2">Submit a request to the appropriate department for rapid resolution.</p>
      </div>

      <motion.form 
        onSubmit={handleSubmit}
        className="glass-card p-5 md:p-8 rounded-2xl border border-white/5 space-y-6 bg-gradient-to-br from-card to-background/50 shadow-2xl"
      >
        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Ticket Title *</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the issue (e.g., Unable to login to ERP system)"
            className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-500"
            required 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Department *</label>
            <select 
              value={department}
              onChange={handleDepartmentChange}
              className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-medium appearance-none"
              required
            >
              {departments.length === 0 && <option value="">Loading departments...</option>}
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-medium appearance-none"
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
              <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">ERP Incident Type *</label>
              <select 
                value={erpIncidentType}
                onChange={(e) => setErpIncidentType(e.target.value)}
                className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-medium appearance-none"
                required
              >
                <option value="">-- Select ERP Incident Type --</option>
                {clientData.erpDetails.erpIncidentTypes.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Priority</label>
            <select 
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-medium appearance-none"
            >
              {priorities.length > 0 ? (
                priorities.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))
              ) : (
                <>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </>
              )}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">
              CC Manager Email
              <span className="ml-2 text-[11px] font-normal text-slate-500 normal-case tracking-normal">(optional)</span>
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="email"
                value={ccEmail}
                onChange={(e) => setCcEmail(e.target.value)}
                placeholder="manager@company.com"
                className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Description *</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Detailed description of the issue (e.g., Getting error 500 when trying to access the SAP B1 portal)"
            className="w-full bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/50 transition-all font-medium resize-none placeholder:text-slate-500"
            required 
          />
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">Attachments</label>
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-upload').click()}
            className="w-full border-2 border-dashed border-white/10 rounded-xl p-8 hover:border-blue-500/50 transition-all cursor-pointer flex flex-col items-center justify-center text-center group bg-[#1d2633]/50"
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
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UploadCloud size={24} />
            </div>
            <p className="text-white font-medium">Click to upload or drag and drop</p>
            <p className="text-slate-500 text-[12px] font-black mt-1 uppercase tracking-widest">Supported: Word, Excel, Images, PDFs, etc. (max. 10MB each)</p>
          </div>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <File size={16} className="text-blue-400" />
                    <span className="text-sm text-white/90 truncate max-w-[200px] font-medium">{file.name}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeFile(i)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4 border-t border-white/5">
          <button
            type="button"
            onClick={() => navigate('/my-tickets')}
            className="w-full sm:w-auto px-6 py-3.5 text-white/70 hover:text-white font-bold text-sm transition-colors text-center"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl px-10 py-3.5 font-bold text-[14px] flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <>
                Confirm Submission <Send size={18} />
              </>
            )}
          </motion.button>
        </div>
      </motion.form>
    </motion.div>
  );
}
