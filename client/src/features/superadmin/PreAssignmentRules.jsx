import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitFork, Plus, Edit2, Trash2, Sliders, CheckCircle, XCircle, 
  User, Building2, Briefcase, Mail, Shield, Play, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { usePreAssignmentRuleStore } from '../../store/usePreAssignmentRuleStore';
import { useClientUserStore } from '../../store/useClientUserStore';
import { useClientStore } from '../../store/useClientStore';
import { useDepartmentStore } from '../../store/useDepartmentStore';
import { useConsultantStore } from '../../store/useConsultantStore';

export default function PreAssignmentRules() {
  const { rules, isLoading: rulesLoading, fetchRules, createRule, updateRule, deleteRule } = usePreAssignmentRuleStore();
  const { clientUsers, fetchClientUsers } = useClientUserStore();
  const { clients, fetchClients } = useClientStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  const { consultants, fetchConsultants } = useConsultantStore();

  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedRule, setSelectedRule] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    conditionType: 'clientUser',
    clientUser: '',
    client: '',
    department: '',
    categories: [],
    erpIncidentType: [],
    assignedTo: '',
    ccConsultants: [],
    evaluationOrder: 0,
    isActive: true
  });

  const [ccDropdownOpen, setCcDropdownOpen] = useState(false);

  useEffect(() => {
    fetchRules();
    fetchClientUsers();
    fetchClients();
    fetchDepartments();
    fetchConsultants();
  }, []);

  const openCreateModal = () => {
    setFormData({
      name: '',
      conditionType: 'clientUser',
      clientUser: '',
      client: '',
      department: '',
      categories: [],
      erpIncidentType: [],
      assignedTo: '',
      ccConsultants: [],
      evaluationOrder: rules.length > 0 ? Math.max(...rules.map(r => r.evaluationOrder || 0)) + 10 : 10,
      isActive: true
    });
    setModalMode('create');
  };

  const openEditModal = (rule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name || '',
      conditionType: rule.conditionType || 'clientUser',
      clientUser: rule.clientUser?._id || rule.clientUser?.id || rule.clientUser || '',
      client: rule.client?._id || rule.client?.id || rule.client || '',
      department: rule.department?._id || rule.department?.id || rule.department || '',
      categories: Array.isArray(rule.categories) ? rule.categories : [],
      erpIncidentType: Array.isArray(rule.erpIncidentType) ? rule.erpIncidentType : (rule.erpIncidentType ? [rule.erpIncidentType] : []),
      assignedTo: rule.assignedTo?._id || rule.assignedTo?.id || rule.assignedTo || '',
      ccConsultants: Array.isArray(rule.ccConsultants) 
        ? rule.ccConsultants.map(c => c._id || c.id || c) 
        : [],
      evaluationOrder: rule.evaluationOrder || 0,
      isActive: rule.isActive !== undefined ? rule.isActive : true
    });
    setModalMode('edit');
  };

  const handleToggleActive = async (rule) => {
    const id = rule._id || rule.id;
    await updateRule(id, { isActive: !rule.isActive });
  };

  const handleDelete = async (rule) => {
    if (window.confirm(`Are you sure you want to delete the routing rule "${rule.name}"?`)) {
      await deleteRule(rule._id || rule.id);
    }
  };

  const handleCcToggle = (consultantId) => {
    setFormData(prev => {
      const exists = prev.ccConsultants.includes(consultantId);
      if (exists) {
        return {
          ...prev,
          ccConsultants: prev.ccConsultants.filter(id => id !== consultantId)
        };
      } else {
        return {
          ...prev,
          ccConsultants: [...prev.ccConsultants, consultantId]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) return alert('Please enter a rule name.');
    if (!formData.assignedTo) return alert('Please select a target consultant.');

    if (formData.conditionType === 'clientUser' && !formData.clientUser) {
      return alert('Please select a client user.');
    }
    if (formData.conditionType === 'client' && !formData.client) {
      return alert('Please select a client company.');
    }
    if (formData.conditionType === 'department' && !formData.department) {
      return alert('Please select a department.');
    }
    if (formData.conditionType === 'erpIncidentType' && (!formData.erpIncidentType || formData.erpIncidentType.length === 0)) {
      return alert('Please select at least one ERP incident type.');
    }

    const payload = {
      name: formData.name.trim(),
      conditionType: formData.conditionType,
      assignedTo: formData.assignedTo,
      ccConsultants: formData.ccConsultants,
      evaluationOrder: Number(formData.evaluationOrder),
      isActive: formData.isActive,
      clientUser: formData.conditionType === 'clientUser' ? formData.clientUser : null,
      client: formData.conditionType === 'client' ? formData.client : null,
      department: formData.conditionType === 'department' ? formData.department : null,
      categories: formData.conditionType === 'department' ? formData.categories : [],
      erpIncidentType: formData.conditionType === 'erpIncidentType' ? formData.erpIncidentType : null
    };

    let result;
    if (modalMode === 'create') {
      result = await createRule(payload);
    } else {
      result = await updateRule(selectedRule._id || selectedRule.id, payload);
    }

    if (result.success) {
      setModalMode(null);
      setSelectedRule(null);
    } else {
      alert(result.message || 'Operation failed.');
    }
  };

  const getConditionLabel = (rule) => {
    switch (rule.conditionType) {
      case 'clientUser':
        return (
          <span className="flex items-center gap-1.5 text-blue-400 font-medium">
            <User size={14} /> Raiser: {rule.clientUser?.name || 'Unknown User'}
          </span>
        );
      case 'client':
        return (
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Briefcase size={14} /> Client: {rule.client?.name || 'Unknown Company'}
          </span>
        );
      case 'department':
        const catStr = rule.categories && rule.categories.length > 0 
          ? ` (${rule.categories.join(', ')})` 
          : '';
        return (
          <span className="flex items-center gap-1.5 text-purple-400 font-medium">
            <Building2 size={14} /> Department: {rule.department?.name || 'Unknown Department'}{catStr}
          </span>
        );
      case 'erpIncidentType':
        return (
          <span className="flex items-center gap-1.5 text-orange-400 font-medium">
            <Sliders size={14} /> ERP Incident: {rule.erpIncidentType || 'Unknown Type'}
          </span>
        );
      default:
        return 'Unknown';
    }
  };

  // Only client users
  const activeClientUsers = clientUsers.filter(u => u.role === 'clientuser' && u.status === 'active');
  // Only consultants
  const activeConsultants = consultants.filter(c => c.status === 'active');

  return (
    <div className="p-6 lg:p-10 font-sans max-w-7xl mx-auto space-y-8 text-white">
      {/* Header Band */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0f1d]/50 p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
            <GitFork className="text-blue-500" size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Pre-Assignment Rules</h1>
            <p className="text-slate-400 text-xs mt-0.5">Configure conditional routing logic to dispatch tickets automatically to consultants.</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 transform active:scale-95 cursor-pointer shrink-0"
        >
          <Plus size={16} /> Add New Rule
        </button>
      </div>

      {/* Main Rules List Panel */}
      <div className="bg-[#0b0f19] border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
        {rulesLoading && rules.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Loading Routing Rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-slate-500/5 rounded-full flex items-center justify-center border border-slate-500/10 mb-2">
              <Sliders className="text-slate-500" size={24} />
            </div>
            <h3 className="text-lg font-bold">No Routing Rules Found</h3>
            <p className="text-slate-400 text-xs max-w-sm mx-auto leading-relaxed">Super Admins can define rule-based routings to map tickets directly to the right consultant on creation.</p>
            <button
              onClick={openCreateModal}
              className="mt-2 py-2.5 px-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all"
            >
              Configure First Rule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01]">
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest pl-8">Order</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rule Name</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Routing Condition</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Assignee</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">CC Recipients</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, idx) => (
                  <tr 
                    key={rule._id || rule.id} 
                    className="border-b border-white/5 hover:bg-white/[0.01] transition-colors"
                  >
                    <td className="p-5 pl-8">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">
                          {rule.evaluationOrder}
                        </span>
                      </div>
                    </td>
                    <td className="p-5">
                      <span className="font-bold text-[14px] text-white tracking-wide">{rule.name}</span>
                    </td>
                    <td className="p-5">
                      {getConditionLabel(rule)}
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-purple-500/10 rounded-lg border border-purple-500/20 flex items-center justify-center">
                          <Shield size={12} className="text-purple-400" />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold">{rule.assignedTo?.name || 'Unassigned'}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{rule.assignedTo?.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      {rule.ccConsultants && rule.ccConsultants.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {rule.ccConsultants.map((c) => (
                            <span 
                              key={c._id || c.id} 
                              className="text-[9px] font-bold bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-slate-300"
                              title={c.email}
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-600 italic">—</span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      <button
                        onClick={() => handleToggleActive(rule)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${
                          rule.isActive 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                            : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                        }`}
                      >
                        {rule.isActive ? (
                          <>
                            <CheckCircle size={10} /> Active
                          </>
                        ) : (
                          <>
                            <XCircle size={10} /> Suspended
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-5 text-right pr-8">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(rule)}
                          className="w-8 h-8 bg-white/5 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 text-slate-400 hover:text-blue-400 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                          title="Edit Rule"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(rule)}
                          className="w-8 h-8 bg-white/5 hover:bg-red-600/10 border border-white/5 hover:border-red-500/30 text-slate-400 hover:text-red-400 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                          title="Delete Rule"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Rule Modal */}
      <AnimatePresence>
        {modalMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalMode(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#0f1322] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl relative overflow-hidden z-10 flex flex-col max-h-[90vh]"
            >
              {/* Top Band accent */}
              <div className="h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 w-full shrink-0"></div>

              {/* Title */}
              <div className="p-6 border-b border-white/5 shrink-0 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    {modalMode === 'create' ? 'Create Routing Rule' : 'Edit Routing Rule'}
                  </h3>
                  <p className="text-slate-400 text-[10px] mt-0.5">Design automated pre-assignment rules based on matching metadata.</p>
                </div>
                <button 
                  onClick={() => setModalMode(null)}
                  className="text-slate-400 hover:text-white transition-colors text-xs font-bold"
                >
                  ✕ Close
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {/* Rule Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rule Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Route Dept B to Consultant H"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-[#171c2e] border border-white/5 rounded-xl px-4 py-3 text-[13px] text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 w-full transition-all"
                  />
                </div>

                {/* Condition Type */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Routing Criteria Type</label>
                  <select
                    value={formData.conditionType}
                    onChange={(e) => setFormData(prev => ({ ...prev, conditionType: e.target.value, clientUser: '', client: '', department: '', categories: [], erpIncidentType: '' }))}
                    className="bg-[#171c2e] border border-white/5 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-blue-500/50 w-full cursor-pointer transition-all"
                  >
                    <option value="clientUser">Specific Ticket Creator (Client User)</option>
                    <option value="client">Specific Client Company</option>
                    <option value="department">Specific Department</option>
                    <option value="erpIncidentType">ERP Incident Type</option>
                  </select>
                </div>

                {/* Dynamic Condition Dropdown */}
                {formData.conditionType === 'clientUser' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Match Client User</label>
                    <select
                      required
                      value={formData.clientUser}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientUser: e.target.value }))}
                      className="bg-[#171c2e] border border-white/5 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-blue-500/50 w-full cursor-pointer transition-all"
                    >
                      <option value="">-- Select Client User --</option>
                      {activeClientUsers.map(u => (
                        <option key={u._id || u.id} value={u._id || u.id}>{u.name} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.conditionType === 'client' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Match Client Company</label>
                    <select
                      required
                      value={formData.client}
                      onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value }))}
                      className="bg-[#171c2e] border border-white/5 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-blue-500/50 w-full cursor-pointer transition-all"
                    >
                      <option value="">-- Select Client Company --</option>
                      {clients.filter(c => c.status === 'active').map(c => (
                        <option key={c._id || c.id} value={c._id || c.id}>{c.name} ({c.domain})</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.conditionType === 'department' && (
                  <div className="space-y-4 w-full">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Match Target Department</label>
                      <select
                        required
                        value={formData.department}
                        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value, categories: [] }))}
                        className="bg-[#171c2e] border border-white/5 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-blue-500/50 w-full cursor-pointer transition-all"
                      >
                        <option value="">-- Select Department --</option>
                        {departments.map(d => (
                          <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {formData.department && (() => {
                      const selectedDept = departments.find(d => (d._id || d.id) === formData.department);
                      const deptCats = selectedDept?.categories || [];
                      if (deptCats.length === 0) return null;
                      return (
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Match Department Categories (Optional)</label>
                          <div className="grid grid-cols-2 gap-2 bg-[#131924] border border-white/5 p-3.5 rounded-xl max-h-[150px] overflow-y-auto custom-scrollbar">
                            {deptCats.map(cat => {
                              const isChecked = formData.categories.includes(cat);
                              return (
                                <label key={cat} className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer py-1 select-none">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      setFormData(prev => {
                                        const exists = prev.categories.includes(cat);
                                        return {
                                          ...prev,
                                          categories: exists 
                                            ? prev.categories.filter(x => x !== cat)
                                            : [...prev.categories, cat]
                                        };
                                      });
                                    }}
                                    className="rounded border-white/10 text-blue-600 focus:ring-0 cursor-pointer"
                                  />
                                  <span>{cat}</span>
                                </label>
                              );
                            })}
                          </div>
                          <span className="text-[10px] text-slate-500 italic">If no categories are selected, the rule matches all tickets for this department.</span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {formData.conditionType === 'erpIncidentType' && (
                  <div className="flex flex-col gap-1.5 font-sans">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Match ERP Incident Types</label>
                    <div className="grid grid-cols-1 gap-2 bg-[#131924] border border-white/5 p-3.5 rounded-xl">
                      {['Functional / Transactional', 'Technical / Connection', 'Add-Ons'].map(type => {
                        const isChecked = formData.erpIncidentType.includes(type);
                        return (
                          <label key={type} className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer py-1 select-none">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setFormData(prev => {
                                  const exists = prev.erpIncidentType.includes(type);
                                  return {
                                    ...prev,
                                    erpIncidentType: exists 
                                      ? prev.erpIncidentType.filter(x => x !== type)
                                      : [...prev.erpIncidentType, type]
                                  };
                                });
                              }}
                              className="rounded border-white/10 text-blue-600 focus:ring-0 cursor-pointer"
                            />
                            <span>{type}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Primary Assignee */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assign to Consultant</label>
                  <select
                    required
                    value={formData.assignedTo}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="bg-[#171c2e] border border-white/5 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-blue-500/50 w-full cursor-pointer transition-all"
                  >
                    <option value="">-- Select Target Consultant --</option>
                    {activeConsultants.map(c => (
                      <option key={c._id || c.id} value={c._id || c.id}>{c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>

                {/* CC Consultants list */}
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CC Recipients (Consultants)</label>
                  
                  <div 
                    onClick={() => setCcDropdownOpen(!ccDropdownOpen)}
                    className="bg-[#171c2e] border border-white/5 rounded-xl px-4 py-3 text-[13px] text-white flex justify-between items-center cursor-pointer select-none"
                  >
                    <span className="truncate">
                      {formData.ccConsultants.length === 0 
                        ? '-- Choose CC Recipients (Optional) --' 
                        : `${formData.ccConsultants.length} Consultant(s) Selected`}
                    </span>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${ccDropdownOpen ? 'rotate-180' : ''}`} />
                  </div>

                  {ccDropdownOpen && (
                    <div className="mt-1 bg-[#1a1f33] border border-white/10 rounded-xl max-h-[160px] overflow-y-auto p-2.5 z-20 space-y-1.5 shadow-xl custom-scrollbar w-full">
                      {activeConsultants.length === 0 ? (
                        <p className="text-[11px] text-slate-500 p-2 italic text-center">No active consultants available</p>
                      ) : (
                        activeConsultants.map(c => {
                          const isChecked = formData.ccConsultants.includes(c._id || c.id);
                          return (
                            <label 
                              key={c._id || c.id} 
                              className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer select-none text-[12px]"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleCcToggle(c._id || c.id)}
                                className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                              />
                              <span className="truncate text-slate-200">{c.name} ({c.email})</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Evaluation Order and Is Active Toggle */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evaluation Order</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.evaluationOrder}
                      onChange={(e) => setFormData(prev => ({ ...prev, evaluationOrder: parseInt(e.target.value) || 0 }))}
                      className="bg-[#171c2e] border border-white/5 rounded-xl px-4 py-3 text-[13px] text-white focus:outline-none focus:border-blue-500/50 w-full transition-all"
                    />
                  </div>

                  <div className="flex items-end pb-3 pl-2">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="rounded border-white/10 text-blue-600 focus:ring-0 cursor-pointer w-4 h-4 bg-[#171c2e]"
                      />
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Rule Active</span>
                    </label>
                  </div>
                </div>
              </form>

              {/* Actions Footer */}
              <div className="p-6 border-t border-white/5 shrink-0 flex gap-3.5 justify-end bg-white/[0.01]">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-5 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10 transition-all transform active:scale-95 cursor-pointer"
                >
                  {modalMode === 'create' ? 'Create Rule' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
