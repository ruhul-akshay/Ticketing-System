import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, Ticket, AlertCircle, RefreshCw, Plus, Search, ChevronDown, ChevronUp, Database, FileText, Send, Trash2, Edit2, Mail, Phone, User, Globe } from 'lucide-react';
import { useClientStore } from '../../store/useClientStore';
import { Button } from '../../components/Button';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/Input';
import Badge from '../../components/ui/Badge';

export default function ClientsManagement() {
  const { clients, stats, fetchClients, fetchStats, refreshAnalytics, isRefreshing, isLoading, addClient, updateClient, deleteClient, suspendClient } = useClientStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [erpFilter, setErpFilter] = useState('all');
  const [showDetails, setShowDetails] = useState({});

  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'delete' | null
  const [selectedClient, setSelectedClient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', domain: '', contactPerson: '', contactEmail: '', contactPhone: '',
    erpDetails: {
      erpName: '', sapB1VersionType: '', sapB1VersionAndFP: '', sapLicenseAMC: '',
      sapSupportAMC: { status: '', fromDate: '', toDate: '' },
      sapSupportAMCType: '', sapSupportHourlyCap: '', erpIncidentTypes: []
    }
  });

  const erpOptions = ['SAP B1', 'CREST', 'SFA'];
  const sapVersionOptions = ['HANA', 'SQL'];
  const licenseAMCOptions = ['Active', 'Terminated'];
  const supportAMCOptions = ['Active', 'Suspended'];
  const supportAMCTypeOptions = ['Limited', 'Unlimited'];
  const incidentTypeOptions = ['Functional / Transactional', 'Technical / Connection', 'Add-Ons'];

  const loadData = useCallback(() => {
    fetchClients({ search: searchTerm, status: statusFilter !== 'all' ? statusFilter : undefined, erpName: erpFilter !== 'all' ? erpFilter : undefined });
    fetchStats();
  }, [searchTerm, statusFilter, erpFilter, fetchClients, fetchStats]);

  useEffect(() => {
    const handler = setTimeout(loadData, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, statusFilter, erpFilter, loadData]);

  const toggleDetails = (id) => setShowDetails(p => ({ ...p, [id]: !p[id] }));

  const openCreateModal = () => {
    setFormData({ name: '', domain: '', contactPerson: '', contactEmail: '', contactPhone: '', erpDetails: { erpName: '', sapB1VersionType: '', sapB1VersionAndFP: '', sapLicenseAMC: '', sapSupportAMC: { status: '', fromDate: '', toDate: '' }, sapSupportAMCType: '', sapSupportHourlyCap: '', erpIncidentTypes: [] } });
    setModalMode('create');
  };

  const openEditModal = (c) => {
    setSelectedClient(c);
    
    const erp = c.erpDetails 
      ? JSON.parse(JSON.stringify(c.erpDetails)) 
      : { erpName: '', sapB1VersionType: '', sapB1VersionAndFP: '', sapLicenseAMC: '', sapSupportAMC: { status: '', fromDate: '', toDate: '' }, sapSupportAMCType: '', sapSupportHourlyCap: '', erpIncidentTypes: [] };
      
    if (erp.sapSupportAMC) {
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
      };
      erp.sapSupportAMC.fromDate = formatDate(erp.sapSupportAMC.fromDate);
      erp.sapSupportAMC.toDate = formatDate(erp.sapSupportAMC.toDate);
    }

    setFormData({
      name: c.name || '', domain: c.domain || '', contactPerson: c.contactPerson || '', contactEmail: c.contactEmail || '', contactPhone: c.contactPhone || '',
      erpDetails: erp
    });
    setModalMode('edit');
  };

  const submitForm = async (e) => {
    e.preventDefault();
    if (isSubmitting) return; // guard against double-submit
    setIsSubmitting(true);
    try {
      const payload = JSON.parse(JSON.stringify(formData));
      
      if (payload.erpDetails) {
        if (!payload.erpDetails.erpName) payload.erpDetails.erpName = null;
        if (!payload.erpDetails.sapB1VersionType) payload.erpDetails.sapB1VersionType = null;
        if (!payload.erpDetails.sapLicenseAMC) payload.erpDetails.sapLicenseAMC = null;
        if (!payload.erpDetails.sapSupportAMCType) payload.erpDetails.sapSupportAMCType = null;
        if (payload.erpDetails.sapSupportAMC && !payload.erpDetails.sapSupportAMC.status) {
          payload.erpDetails.sapSupportAMC.status = null;
        }
      }
      
      let res;
      if (modalMode === 'create') res = await addClient(payload);
      else res = await updateClient(selectedClient._id || selectedClient.id, payload);

      if (res?.success) setModalMode(null);
      else if (res) alert(res.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDelete = async () => {
    await deleteClient(selectedClient._id || selectedClient.id);
    setModalMode(null);
  };

  const filteredClients = clients.filter(c => {
    const searchMatch = searchTerm === '' || c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || c.domain?.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'all' || c.status === statusFilter;
    const erpMatch = erpFilter === 'all' || (erpFilter === 'none' ? !c.erpDetails?.erpName : c.erpDetails?.erpName === erpFilter);
    return searchMatch && statusMatch && erpMatch;
  });

  return (
    <div className="w-full relative font-sans min-h-screen pt-4">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Building2 className="text-[#ED1B2F]" size={32} /> Client Entities
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Manage B2B SaaS nodes, ERP dependencies, and active deployments.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refreshAnalytics} disabled={isRefreshing} className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all disabled:opacity-50">
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} /> {isRefreshing ? 'Syncing...' : 'Sync Data'}
          </button>
          <button onClick={openCreateModal} className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-[#ED1B2F] hover:from-red-500 hover:to-red-400 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(237,27,47,0.3)]">
            <Plus size={16} strokeWidth={3} /> Create Client
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <motion.div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-red-500/20 text-red-500 rounded-xl"><Building2 size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats?.totalClients || clients.length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Total Clients</div></div>
        </motion.div>
        <motion.div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><Users size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats?.totalUsers || clients.reduce((a,b)=>a+(b.totalUsers||b.employeeCount||0),0)}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Total Users</div></div>
        </motion.div>
        <motion.div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Ticket size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats?.totalTickets || clients.reduce((a,b)=>a+(b.totalTickets||0),0)}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Total Tickets</div></div>
        </motion.div>
         <motion.div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><Database size={24} /></div>
          <div><div className="text-3xl font-black text-white">{clients.filter(c => c.erpDetails?.erpName === 'SAP B1').length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">SAP B1 Nodes</div></div>
        </motion.div>
      </div>

      <div className="bg-[#111620]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden min-h-[600px]">
        <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 relative z-10">
          <div className="md:col-span-2">
            <input type="text" placeholder="Search client string..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1d2633] border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 shadow-inner text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full bg-[#1d2633] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 shadow-inner text-sm appearance-none">
            <option value="all">Global (All States)</option>
            <option value="active">Active Orbit</option>
            <option value="suspended">Suspended Override</option>
          </select>
          <select value={erpFilter} onChange={(e) => setErpFilter(e.target.value)} className="w-full bg-[#1d2633] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 shadow-inner text-sm appearance-none">
            <option value="all">All ERP Targets</option>
            {erpOptions.map(e => <option key={e} value={e}>{e}</option>)}
            <option value="none">No ERP Sync</option>
          </select>
        </div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left">
             <thead className="bg-[#181f2b]/80 border-b border-white/5">
              <tr>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-tl-xl border-b border-white/5">Client</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">ERP Details</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Users</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Tickets</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-tr-xl border-b border-white/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white">
               {isLoading && clients.length === 0 ? (
                 <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Scanning server subroutines...</td></tr>
               ) : filteredClients.length === 0 ? (
                 <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest">No matching entity models discovered.</td></tr>
               ) : filteredClients.map((c, i) => (
                 <React.Fragment key={c.id || c._id}>
                   <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className={`border-b border-white/5 hover:bg-white/[0.03] transition-colors group ${c.isNewClient ? 'bg-blue-500/5' : ''}`}>
                      <td className="p-5 cursor-pointer" onClick={() => { setSelectedClient(c); setModalMode('details'); }}>
                       <div className="flex items-center gap-5">
                         <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center font-black text-white border border-white/10 shadow-lg relative overflow-hidden group-hover:border-red-500/50 transition-colors">
                            <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10 text-xl">{c.name?.charAt(0).toUpperCase()}</span>
                         </div>
                         <div>
                           <div className="font-black text-[16px] flex items-center gap-2 text-white group-hover:text-red-400 transition-colors">
                             {c.name}
                             {c.isNewClient && <Badge color="blue" size="sm">NEW</Badge>}
                             {c.erpDetails?.sapSupportAMCType === 'Limited' && (c.erpDetails?.sapSupportHourlyCap || 0) <= 5 && (
                               <Badge color="red" size="sm" className="animate-pulse">LOW BALANCE</Badge>
                             )}
                           </div>
                           <div className="text-[12px] font-bold text-slate-500 mt-0.5 flex items-center gap-1.5">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {c.domain || 'Unlisted Domain'}
                           </div>
                           {c.contactPerson && <div className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-wider">POC: {c.contactPerson}</div>}
                         </div>
                       </div>
                      </td>
                      <td className="p-5">
                         {c.erpDetails?.erpName ? (
                           <div className="flex flex-col items-start gap-1 text-[12px]">
                             <Badge color={c.erpDetails.erpName==='SAP B1'?'purple':c.erpDetails.erpName==='CREST'?'blue':'gray'}>{c.erpDetails.erpName}</Badge>
                             {c.erpDetails.sapSupportAMCType === 'Limited' && (
                               <div className="text-[10px] font-black text-blue-400/80 uppercase tracking-tight mt-1">
                                 {c.erpDetails.sapSupportHourlyCap}h Balance
                                </div>
                             )}
                             <button onClick={() => toggleDetails(c.id || c._id)} className="font-bold text-slate-500 hover:text-white flex items-center gap-1 transition-colors mt-1 text-[10px] uppercase tracking-widest">
                               {showDetails[c.id || c._id] ? <ChevronUp size={12}/> : <ChevronDown size={12}/>} {showDetails[c.id || c._id] ? 'Hide' : 'Details'}
                             </button>
                           </div>
                         ) : <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">NONE</span>}
                      </td>
                      <td className="p-5">
                           <div className="bg-white/5 p-3 rounded-2xl border border-white/5 inline-block min-w-[80px] text-center">
                             <div className="font-black text-xl text-white">{c.totalUsers || c.employeeCount || 0}</div>
                             <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Active Users</div>
                           </div>
                      </td>
                      <td className="p-5">
                           <div className="flex items-center gap-4 text-[12px] font-bold">
                              <div className="bg-white/5 p-3 rounded-2xl border border-white/5 min-w-[60px] text-center">
                                 <span className="text-slate-500 block text-[8px] uppercase tracking-tighter mb-1">Total</span>
                                 <span className="text-lg text-white font-black">{c.totalTickets || 0}</span>
                              </div>
                              <div className="bg-red-500/10 p-3 rounded-2xl border border-red-500/10 min-w-[60px] text-center">
                                 <span className="text-red-400 block text-[8px] uppercase tracking-tighter mb-1">Pending</span>
                                 <span className="text-lg text-red-400 font-black">{c.pendingTickets || 0}</span>
                              </div>
                              <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/10 min-w-[60px] text-center">
                                 <span className="text-emerald-400 block text-[8px] uppercase tracking-tighter mb-1">Solved</span>
                                 <span className="text-lg text-emerald-400 font-black">{c.resolvedTickets || 0}</span>
                              </div>
                           </div>
                      </td>
                      <td className="p-5">
                           <div className="flex flex-col items-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditModal(c)} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-400 bg-white/5 py-1.5 px-3 rounded-lg border border-transparent hover:border-red-500/30 transition-all cursor-pointer">
                                <Edit2 size={12} /> Edit
                              </button>
                              <button onClick={() => { setSelectedClient(c); setModalMode('delete'); }} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 bg-white/5 py-1.5 px-3 rounded-lg border border-transparent hover:border-red-500/30 transition-all cursor-pointer">
                                <Trash2 size={12} /> Delete
                              </button>
                           </div>
                      </td>
                   </motion.tr>

                   <AnimatePresence>
                   {showDetails[c.id || c._id] && (
                     <motion.tr initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-black/30 border-b border-white/5 overflow-hidden block w-full table-row">
                       <td colSpan="5" className="p-0">
                         <div className="p-6 ml-14 mr-6 my-4 bg-[#181f2b]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-inner relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5"><Database size={200}/></div>
                            <h4 className="font-bold text-white mb-4 flex items-center gap-2 text-[13px] uppercase tracking-widest border-b border-white/10 pb-3">
                              <Database className="text-purple-400" size={16} /> Schema Metadata
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
                               <div className="space-y-1">
                                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Base Bridge</span>
                                 <div className="font-medium text-slate-300">{c.erpDetails.erpName || 'N/A'} {c.erpDetails.sapB1VersionType}</div>
                               </div>
                               <div className="space-y-1">
                                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Version Float</span>
                                 <div className="font-medium text-slate-300">{c.erpDetails.sapB1VersionAndFP || 'N/A'}</div>
                               </div>
                               <div className="space-y-1">
                                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">License Layer</span>
                                 <div className="font-medium text-slate-300">{c.erpDetails.sapLicenseAMC || 'N/A'}</div>
                               </div>
                               <div className="space-y-1">
                                 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Data Streams</span>
                                 <div className="flex flex-wrap gap-1 mt-1">
                                   {c.erpDetails.erpIncidentTypes?.map(t => <span key={t} className="text-[9px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded font-bold uppercase">{t}</span>)}
                                 </div>
                               </div>
                               {c.erpDetails.sapSupportAMCType && (
                                 <div className="space-y-1">
                                   <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Support Type</span>
                                   <div className="font-medium text-slate-300">
                                     {c.erpDetails.sapSupportAMCType}
                                     {c.erpDetails.sapSupportAMCType === 'Limited' && ` (Cap: ${c.erpDetails.sapSupportHourlyCap} hrs)`}
                                   </div>
                                 </div>
                               )}
                               {c.erpDetails.sapSupportAMC?.status && (
                                 <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 mt-2 relative overflow-hidden group/amc">
                                   <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover/amc:opacity-[0.07] transition-opacity"><RefreshCw size={120}/></div>
                                   <div className="flex justify-between items-start relative z-10">
                                     <div className="flex gap-4 items-center">
                                       <div className={`p-4 rounded-2xl ${c.erpDetails.sapSupportAMC.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                          <RefreshCw size={24} className={c.erpDetails.sapSupportAMC.status === 'Active' ? 'animate-spin-slow' : ''} />
                                       </div>
                                       <div>
                                         <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Support AMC Lifecycle</span>
                                         <Badge color={c.erpDetails.sapSupportAMC.status === 'Active' ? 'green' : 'red'}>{c.erpDetails.sapSupportAMC.status}</Badge>
                                       </div>
                                     </div>
                                     <div className="flex gap-4 items-center">
                                       {c.erpDetails.sapSupportAMC.fromDate && (
                                         <div className="text-right">
                                           <div className="text-[11px] font-bold text-slate-400 flex items-center gap-2 justify-end">Launch: <span className="text-white">{new Date(c.erpDetails.sapSupportAMC.fromDate).toLocaleDateString()}</span></div>
                                           <div className="text-[11px] font-bold text-slate-400 mt-1 flex items-center gap-2 justify-end">Decay: <span className="text-white">{new Date(c.erpDetails.sapSupportAMC.toDate).toLocaleDateString()}</span></div>
                                         </div>
                                       )}
                                       <Button variant="ghost" size="sm" className="bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 h-10 px-4 rounded-xl font-bold" onClick={() => { setSelectedClient(c); setModalMode('renew'); }}>
                                         Renew Contract
                                       </Button>
                                     </div>
                                   </div>
                                   {c.erpDetails.sapSupportAMCType === 'Limited' && c.erpDetails.sapSupportHourlyCap > 0 && (
                                     <div className="mt-6 relative z-10">
                                        {(() => {
                                          const totalCap = c.erpDetails?.sapSupportHourlyCap || 0;
                                          const used = c.erpDetails?.hoursUsed || 0;
                                          const remaining = Math.max(0, totalCap - used);
                                          const progress = totalCap > 0 ? (remaining / totalCap) * 100 : 0;
                                          const isCritical = remaining <= 5 && totalCap > 0;

                                          return (
                                            <>
                                              <div className="flex justify-between text-xs mb-2 items-end">
                                                <div>
                                                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Support Balance</span>
                                                  <span className={isCritical ? 'text-red-400 font-black animate-pulse flex items-center gap-2 text-xl' : 'text-white font-black text-xl'}>
                                                    {isCritical && <AlertCircle size={18}/>}
                                                    {remaining.toFixed(1)} <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">hrs left</span>
                                                  </span>
                                                </div>
                                                <div className="text-right">
                                                  <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Manual Deductions Active</div>
                                                  <span className="text-slate-400 font-black text-sm">{used.toFixed(1)}h Total Consumed</span>
                                                </div>
                                              </div>
                                              
                                              {/* Progress bar shows Remaining balance */}
                                              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                                                <div 
                                                  className={`h-full transition-all rounded-full ${isCritical ? 'bg-gradient-to-r from-red-600 to-pink-500' : 'bg-gradient-to-r from-blue-600 to-indigo-500'}`} 
                                                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} 
                                                />
                                              </div>
                                              <div className="flex justify-between mt-2">
                                                 <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Initial Cap: {totalCap}h</span>
                                                 <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Depleted</span>
                                              </div>
                                            </>
                                          );
                                        })()}</div>
                                   )}
                                 </div>
                               )}
                            </div>
                         </div>
                       </td>
                     </motion.tr>
                   )}
                   </AnimatePresence>
                 </React.Fragment>
               ))}
            </tbody>
          </table>
        </div>
      </div>

       {/* Form Modal (Create / Edit) */}
      <Modal isOpen={modalMode === 'create' || modalMode === 'edit'} onClose={() => setModalMode(null)} title={modalMode === 'create' ? "Create New Client" : "Edit Client"} size="xl">
        <form onSubmit={submitForm} className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Input label="Client Name *" value={formData.name} onChange={e => setFormData(p=>({...p, name: e.target.value}))} required />
             <Input label="Domain *" value={formData.domain} onChange={e => setFormData(p=>({...p, domain: e.target.value}))} />
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <Input label="Contact Person" value={formData.contactPerson} onChange={e => setFormData(p=>({...p, contactPerson: e.target.value}))} />
             <Input label="Contact Email" type="email" value={formData.contactEmail} onChange={e => setFormData(p=>({...p, contactEmail: e.target.value}))} />
             <Input label="Contact Phone" value={formData.contactPhone} onChange={e => setFormData(p=>({...p, contactPhone: e.target.value}))} />
           </div>

           <div className="border border-white/5 bg-[#181f2b]/50 p-6 rounded-2xl relative">
              <h4 className="font-bold text-white mb-4 text-[13px] uppercase tracking-widest text-[#ED1B2F] flex items-center gap-2">
                <Database size={16}/> ERP Details
              </h4>
              <div className="space-y-4">
                 <div>
                   <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">ERP Name</label>
                   <select value={formData.erpDetails.erpName} onChange={e=>setFormData(p=>({...p, erpDetails: {...p.erpDetails, erpName: e.target.value}}))} className="w-full bg-[#111620] border border-white/5 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500/50 appearance-none">
                     <option value="">No ERP Specified</option>
                     {erpOptions.map(e=><option key={e} value={e}>{e}</option>)}
                   </select>
                 </div>
                 
                 {formData.erpDetails.erpName === 'SAP B1' && (
                   <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                           <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">SAP B1 Version Type</label>
                           <select value={formData.erpDetails.sapB1VersionType} onChange={e=>setFormData(p=>({...p, erpDetails: {...p.erpDetails, sapB1VersionType: e.target.value}}))} className="w-full bg-[#111620] border border-white/5 text-white rounded-lg px-3 py-2 text-sm">
                             <option value="">None</option>{sapVersionOptions.map(o=><option key={o} value={o}>{o}</option>)}
                           </select>
                         </div>
                         <Input label="Version & FP" value={formData.erpDetails.sapB1VersionAndFP} onChange={e=>setFormData(p=>({...p, erpDetails: {...p.erpDetails, sapB1VersionAndFP: e.target.value}}))} />
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                           <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">SAP License AMC</label>
                           <select value={formData.erpDetails.sapLicenseAMC} onChange={e=>setFormData(p=>({...p, erpDetails: {...p.erpDetails, sapLicenseAMC: e.target.value}}))} className="w-full bg-[#111620] border border-white/5 text-white rounded-lg px-3 py-2 text-sm">
                             <option value="">None</option>{licenseAMCOptions.map(o=><option key={o} value={o}>{o}</option>)}
                           </select>
                         </div>
                          <div>
                           <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">SAP Support AMC</label>
                           <select value={formData.erpDetails.sapSupportAMC.status} onChange={e=>setFormData(p=>({...p, erpDetails: {...p.erpDetails, sapSupportAMC: {...p.erpDetails.sapSupportAMC, status: e.target.value}}}))} className="w-full bg-[#111620] border border-white/5 text-white rounded-lg px-3 py-2 text-sm">
                             <option value="">None</option>{supportAMCOptions.map(o=><option key={o} value={o}>{o}</option>)}
                           </select>
                         </div>
                       </div>
                       
                       {formData.erpDetails.sapSupportAMC.status === 'Active' && (
                          <>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                                <Input label="From Date" type="date" value={formData.erpDetails.sapSupportAMC.fromDate} onChange={e=>setFormData(p=>({...p, erpDetails: {...p.erpDetails, sapSupportAMC: {...p.erpDetails.sapSupportAMC, fromDate: e.target.value}}}))} />
                                <Input label="To Date" type="date" value={formData.erpDetails.sapSupportAMC.toDate} onChange={e=>setFormData(p=>({...p, erpDetails: {...p.erpDetails, sapSupportAMC: {...p.erpDetails.sapSupportAMC, toDate: e.target.value}}}))} />
                             </div>
                             
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <div>
                                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Support Type</label>
                                 <select value={formData.erpDetails.sapSupportAMCType} onChange={e=>setFormData(p=>({...p, erpDetails: {...p.erpDetails, sapSupportAMCType: e.target.value}}))} className="w-full bg-[#111620] border border-white/5 text-white rounded-lg px-3 py-2 text-sm">
                                   <option value="">None</option>{supportAMCTypeOptions.map(o=><option key={o} value={o}>{o}</option>)}
                                 </select>
                               </div>
                               {formData.erpDetails.sapSupportAMCType === 'Limited' && (
                                 <Input label="Hourly Cap" type="number" min="0" value={formData.erpDetails.sapSupportHourlyCap} onChange={e=>setFormData(p=>({...p, erpDetails: {...p.erpDetails, sapSupportHourlyCap: e.target.value}}))} />
                               )}
                             </div>
                          </>
                       )}
                    </motion.div>
                 )}

                 {formData.erpDetails.erpName && (
                   <div>
                     <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">ERP Incident Types</label>
                     <div className="flex flex-wrap gap-4">
                        {incidentTypeOptions.map(t => (
                          <label key={t} className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 font-bold bg-white/5 px-3 py-2 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                            <input type="checkbox" checked={formData.erpDetails.erpIncidentTypes.includes(t)} onChange={() => {
                               setFormData(p => {
                                  const arr = p.erpDetails.erpIncidentTypes.includes(t) ? p.erpDetails.erpIncidentTypes.filter(x=>x!==t) : [...p.erpDetails.erpIncidentTypes, t];
                                  return {...p, erpDetails: {...p.erpDetails, erpIncidentTypes: arr}};
                               });
                            }} className="rounded bg-[#111620] border-white/20 text-[#ED1B2F] focus:ring-[#ED1B2F]"/>
                            {t}
                          </label>
                        ))}
                     </div>
                   </div>
                 )}
              </div>
           </div>

           <div className="flex justify-end gap-3 mt-8">
            <Button variant="ghost" onClick={() => setModalMode(null)} type="button" disabled={isSubmitting}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={!formData.name || isSubmitting} icon={Send}>
              {isSubmitting ? (modalMode === 'create' ? 'Creating...' : 'Saving...') : (modalMode === 'create' ? 'Create Client' : 'Save Changes')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={modalMode === 'delete'} onClose={() => setModalMode(null)} title="Delete Client" size="md">
         <div className="text-center py-6">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(237,27,47,0.3)]">
               <AlertCircle className="text-red-500" size={40} />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Delete {selectedClient?.name}?</h3>
            <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">Are you sure you want to permanently delete this client? This action cannot be undone.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="ghost" onClick={() => setModalMode(null)}>Cancel</Button>
              <Button onClick={submitDelete} className="bg-red-600 hover:bg-red-500 text-white" icon={Trash2}>Delete</Button>
            </div>
         </div>
      </Modal>

      <Modal isOpen={modalMode === 'renew'} onClose={() => setModalMode(null)} title="Renew Support Contract" size="md">
         <form onSubmit={async (e) => {
            e.preventDefault();
            const payload = {
              fromDate: e.target.fromDate.value,
              toDate: e.target.toDate.value,
              sapSupportAMCType: e.target.sapSupportAMCType.value,
              sapSupportHourlyCap: e.target.sapSupportAMCType.value === 'Limited' ? e.target.sapSupportHourlyCap.value : 0
            };
            const { renewClientContract } = useClientStore.getState();
            await renewClientContract(selectedClient._id || selectedClient.id, payload);
            setModalMode(null);
         }} className="space-y-4">
            <p className="text-sm text-slate-400 mb-4">Renewing the contract will update the dates, hourly cap, and reset the consumed hours to 0.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input name="fromDate" label="New From Date" type="date" defaultValue={selectedClient?.erpDetails?.sapSupportAMC?.toDate ? new Date(selectedClient.erpDetails.sapSupportAMC.toDate).toISOString().split('T')[0] : ''} required />
              <Input name="toDate" label="New To Date" type="date" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
               <div>
                 <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Support Type</label>
                 <select name="sapSupportAMCType" defaultValue={selectedClient?.erpDetails?.sapSupportAMCType || 'Unlimited'} className="w-full bg-[#111620] border border-white/5 text-white rounded-lg px-3 py-2 text-sm">
                   {supportAMCTypeOptions.map(o=><option key={o} value={o}>{o}</option>)}
                 </select>
               </div>
               <Input name="sapSupportHourlyCap" label="New Hourly Cap" type="number" min="0" defaultValue={selectedClient?.erpDetails?.sapSupportHourlyCap || 0} />
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button variant="ghost" onClick={() => setModalMode(null)} type="button">Cancel</Button>
              <Button type="submit" variant="primary" icon={RefreshCw}>Renew Contract</Button>
            </div>
         </form>
      </Modal>

      <Modal isOpen={modalMode === 'details'} onClose={() => setModalMode(null)} title={`${selectedClient?.name || 'Client'} Profile & Telemetry`} size="lg">
         {selectedClient && (
           <div className="space-y-6 text-slate-700 dark:text-slate-300">
             {/* Header Card */}
             <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl flex items-center gap-5 shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5 text-slate-400 dark:text-white"><Building2 size={120}/></div>
               <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center font-black text-white text-2xl shadow-lg shrink-0">
                 {selectedClient.name?.charAt(0).toUpperCase()}
               </div>
               <div>
                 <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
                   {selectedClient.name}
                   {selectedClient.isNewClient && <Badge color="blue" size="sm">NEW</Badge>}
                 </h3>
                 <p className="text-sm text-slate-505 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                   <Globe size={14} className="text-slate-500 dark:text-slate-400" /> {selectedClient.domain || 'Unlisted Domain'}
                 </p>
               </div>
             </div>

             {/* Stats Counters */}
             <div className="grid grid-cols-3 gap-4">
               <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center shadow-inner">
                 <div className="font-black text-2xl text-slate-850 dark:text-white">{selectedClient.totalUsers || selectedClient.employeeCount || 0}</div>
                 <div className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-widest mt-1">Active Users</div>
               </div>
               <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center shadow-inner">
                 <div className="font-black text-2xl text-red-550 dark:text-red-400">{selectedClient.pendingTickets || 0}</div>
                 <div className="text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest mt-1">Pending Tickets</div>
               </div>
               <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 text-center shadow-inner">
                 <div className="font-black text-2xl text-emerald-655 dark:text-emerald-400">{selectedClient.resolvedTickets || 0}</div>
                 <div className="text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase tracking-widest mt-1">Resolved Tickets</div>
               </div>
             </div>

             {/* Contact Details */}
             <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-sm">
               <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-3 flex items-center gap-2">
                 <User size={16} className="text-red-500 dark:text-red-400" /> Primary Contact Person
               </h4>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Full Name</span>
                   <div className="font-semibold text-slate-850 dark:text-white">{selectedClient.contactPerson || 'N/A'}</div>
                 </div>
                 <div className="space-y-1">
                   <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Phone Number</span>
                   <div className="font-semibold text-slate-850 dark:text-white flex items-center gap-2">
                     <Phone size={12} className="text-slate-500 dark:text-slate-450" /> {selectedClient.contactPhone || 'N/A'}
                   </div>
                 </div>
                 <div className="space-y-1 sm:col-span-2">
                   <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Email Address</span>
                   <div className="font-semibold text-slate-850 dark:text-white flex items-center gap-2">
                     <Mail size={12} className="text-slate-500 dark:text-slate-450" /> {selectedClient.contactEmail || 'N/A'}
                   </div>
                 </div>
               </div>
             </div>

             {/* ERP Details */}
             {selectedClient.erpDetails && (
               <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-sm">
                 <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-3 flex items-center gap-2">
                   <Database size={16} className="text-purple-500 dark:text-purple-400" /> ERP & Schema Metadata
                 </h4>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">ERP Name</span>
                     <div className="font-semibold text-slate-850 dark:text-white mt-0.5">
                       <Badge color={selectedClient.erpDetails.erpName==='SAP B1'?'purple':selectedClient.erpDetails.erpName==='CREST'?'blue':'gray'}>{selectedClient.erpDetails.erpName || 'N/A'}</Badge>
                     </div>
                   </div>
                   <div className="space-y-1">
                     <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Database Version Type</span>
                     <div className="font-semibold text-slate-850 dark:text-white">{selectedClient.erpDetails.sapB1VersionType || 'N/A'}</div>
                   </div>
                   <div className="space-y-1">
                     <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">SAP Version & FP</span>
                     <div className="font-semibold text-slate-850 dark:text-white">{selectedClient.erpDetails.sapB1VersionAndFP || 'N/A'}</div>
                   </div>
                   <div className="space-y-1">
                     <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">License Status</span>
                     <div className="font-semibold text-slate-850 dark:text-white mt-0.5">
                       <Badge color={selectedClient.erpDetails.sapLicenseAMC === 'Active' ? 'green' : 'red'}>{selectedClient.erpDetails.sapLicenseAMC || 'N/A'}</Badge>
                     </div>
                   </div>
                   {selectedClient.erpDetails.sapSupportAMCType && (
                     <div className="space-y-1">
                       <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Support AMC Type</span>
                       <div className="font-semibold text-slate-850 dark:text-white">
                         {selectedClient.erpDetails.sapSupportAMCType}
                         {selectedClient.erpDetails.sapSupportAMCType === 'Limited' && ` (Cap: ${selectedClient.erpDetails.sapSupportHourlyCap} hrs)`}
                       </div>
                     </div>
                   )}
                   {selectedClient.erpDetails.sapSupportAMC?.status && (
                     <div className="space-y-1">
                       <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Support Contract Status</span>
                       <div className="font-semibold text-slate-850 dark:text-white mt-0.5">
                         <Badge color={selectedClient.erpDetails.sapSupportAMC.status === 'Active' ? 'green' : 'red'}>{selectedClient.erpDetails.sapSupportAMC.status}</Badge>
                       </div>
                     </div>
                   )}
                   {selectedClient.erpDetails.sapSupportAMC?.fromDate && (
                     <div className="space-y-1">
                       <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Contract Start Date</span>
                       <div className="font-semibold text-slate-850 dark:text-white">
                         {new Date(selectedClient.erpDetails.sapSupportAMC.fromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                       </div>
                     </div>
                   )}
                   {selectedClient.erpDetails.sapSupportAMC?.toDate && (
                     <div className="space-y-1">
                       <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Contract Expiry Date</span>
                       <div className="font-semibold text-slate-850 dark:text-white">
                         {new Date(selectedClient.erpDetails.sapSupportAMC.toDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                       </div>
                     </div>
                   )}
                   {selectedClient.erpDetails.erpIncidentTypes?.length > 0 && (
                     <div className="col-span-2 space-y-1.5">
                       <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest block">Authorized Incident Data Streams</span>
                       <div className="flex flex-wrap gap-2 mt-1">
                         {selectedClient.erpDetails.erpIncidentTypes.map(t => (
                           <span key={t} className="text-[10px] bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-xl font-bold uppercase tracking-tight">{t}</span>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             )}

             {/* Support Balance Progress */}
             {selectedClient.erpDetails?.sapSupportAMCType === 'Limited' && selectedClient.erpDetails?.sapSupportHourlyCap > 0 && (
               <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-sm">
                 <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest border-b border-slate-200 dark:border-white/5 pb-3 flex items-center gap-2">
                   <AlertCircle size={16} className="text-yellow-500 dark:text-yellow-450" /> Support Balance Resource Usage
                 </h4>
                 {(() => {
                   const totalCap = selectedClient.erpDetails?.sapSupportHourlyCap || 0;
                   const used = selectedClient.erpDetails?.hoursUsed || 0;
                   const remaining = Math.max(0, totalCap - used);
                   const progress = totalCap > 0 ? (remaining / totalCap) * 100 : 0;
                   const isCritical = remaining <= 5 && totalCap > 0;

                   return (
                     <div className="space-y-3">
                       <div className="flex justify-between text-xs items-end">
                         <div>
                           <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">Available Hours</span>
                           <span className={isCritical ? 'text-red-500 font-black animate-pulse flex items-center gap-2 text-xl' : 'text-slate-850 dark:text-white font-black text-xl'}>
                             {isCritical && <AlertCircle size={18}/>}
                             {remaining.toFixed(1)} <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">hrs remaining</span>
                           </span>
                         </div>
                         <div className="text-right">
                           <span className="text-slate-505 dark:text-slate-450 font-bold uppercase tracking-wider block mb-1">Consumption Rate</span>
                           <span className="text-slate-800 dark:text-slate-300 font-black text-base">{used.toFixed(1)} / {totalCap} hrs used</span>
                         </div>
                       </div>
                       
                       {/* Progress Track */}
                       <div className="h-2.5 w-full bg-slate-200 dark:bg-[#111620] rounded-full overflow-hidden border border-slate-300 dark:border-white/5">
                         <div 
                           className={`h-full rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'}`}
                           style={{ width: `${progress}%` }}
                         />
                       </div>
                     </div>
                   );
                 })()}
               </div>
             )}

             {/* Footer Actions */}
             <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/5">
               <Button variant="ghost" onClick={() => setModalMode(null)}>Close Profile</Button>
               <Button variant="primary" onClick={() => setModalMode('edit')} icon={Edit2}>Edit Client</Button>
             </div>
           </div>
         )}
      </Modal>
    </div>
  );
}
