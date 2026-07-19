import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Mail, Plus, Search, Edit2, Trash2, CheckCircle2, 
  AlertCircle, X, ShieldAlert, ToggleLeft, ToggleRight, Info, Users 
} from 'lucide-react';
import { useCcEmailStore } from '../../store/useCcEmailStore';
import { useSystemSettingStore } from '../../store/useSystemSettingStore';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useAuthStore } from '../../store/useAuthStore';
import { usePriorityStore } from '../../store/usePriorityStore';

export default function SuperAdminSettings() {
  const { user } = useAuthStore();
  const { configs, isLoading, error, fetchConfigs, addConfig, updateConfig, deleteConfig } = useCcEmailStore();
  const { settings, fetchSettings, updateSetting } = useSystemSettingStore();
  const { priorities, fetchPriorities, addPriority, deletePriority, isLoading: isPriorityLoading } = usePriorityStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | 'delete' | null
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Priority Management state
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [isDeletePriorityModalOpen, setIsDeletePriorityModalOpen] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(null);
  const [priorityError, setPriorityError] = useState('');
  const [priorityFormData, setPriorityFormData] = useState({
    name: '',
    level: 50,
    color: '#3b82f6',
    description: ''
  });

  const isSuperAdmin = user?.role === 'Super Admin' || user?.role === 'superadmin';

  useEffect(() => {
    if (isSuperAdmin) {
      fetchConfigs();
      fetchSettings();
      fetchPriorities();
    }
  }, [fetchConfigs, fetchSettings, fetchPriorities, isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="w-full relative font-sans min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-6 text-red-500">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-2">Access Denied</h2>
        <p className="text-slate-400 max-w-md text-sm font-medium leading-relaxed">
          You do not have permission to view or modify system settings. This operation is restricted to Super Administrator accounts.
        </p>
      </div>
    );
  }

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    client_created: false,
    client_user_created: false,
    ticket_created: false,
    ticket_status_updated: false,
    ticket_assigned: false,
    ticket_closed: false,
    password_reset: false,
    new_message: false,
    isActive: true
  });

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const handleOpenCreate = () => {
    setFormData({
      email: '',
      client_created: false,
      client_user_created: false,
      ticket_created: false,
      ticket_status_updated: false,
      ticket_assigned: false,
      ticket_closed: false,
      password_reset: false,
      new_message: false,
      isActive: true
    });
    setFormError('');
    setModalMode('create');
  };

  const handleOpenEdit = (cfg) => {
    setSelectedConfig(cfg);
    setFormData({
      email: cfg.email || '',
      client_created: !!cfg.client_created,
      client_user_created: !!cfg.client_user_created,
      ticket_created: !!cfg.ticket_created,
      ticket_status_updated: !!cfg.ticket_status_updated,
      ticket_assigned: !!cfg.ticket_assigned,
      ticket_closed: !!cfg.ticket_closed,
      password_reset: !!cfg.password_reset,
      new_message: !!cfg.new_message,
      isActive: cfg.isActive !== undefined ? !!cfg.isActive : true
    });
    setFormError('');
    setModalMode('edit');
  };

  const handleOpenDelete = (cfg) => {
    setSelectedConfig(cfg);
    setModalMode('delete');
  };

  const handleToggleActive = async (cfg) => {
    const updatedStatus = !cfg.isActive;
    const res = await updateConfig(cfg._id || cfg.id, { isActive: updatedStatus });
    if (res?.success) {
      showToast(`CC Routing for ${cfg.email} is now ${updatedStatus ? 'Active' : 'Inactive'}`);
    }
  };

  const showToast = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.email) {
      setFormError('Email address is required');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      let res;
      if (modalMode === 'create') {
        res = await addConfig(formData);
      } else {
        res = await updateConfig(selectedConfig._id || selectedConfig.id, formData);
      }

      if (res?.success) {
        showToast(modalMode === 'create' ? 'CC Email Config added successfully!' : 'CC Email Config updated successfully!');
        setModalMode(null);
      } else {
        setFormError(res?.message || 'An error occurred during submission.');
      }
    } catch (err) {
      setFormError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedConfig) return;
    setIsSubmitting(true);
    try {
      const res = await deleteConfig(selectedConfig._id || selectedConfig.id);
      if (res?.success) {
        showToast('CC Email Configuration removed successfully.');
        setModalMode(null);
      } else {
        alert(res?.message || 'Failed to delete configuration');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrioritySubmit = async (e) => {
    e.preventDefault();
    if (!priorityFormData.name) {
      setPriorityError('Priority Name is required');
      return;
    }
    setPriorityError('');
    setIsSubmitting(true);
    try {
      const res = await addPriority(priorityFormData);
      if (res?.success) {
        showToast(`Priority "${priorityFormData.name}" added successfully!`);
        setIsPriorityModalOpen(false);
      } else {
        setPriorityError(res?.message || 'Failed to add priority');
      }
    } catch (err) {
      setPriorityError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeletePriority = (p) => {
    setSelectedPriority(p);
    setIsDeletePriorityModalOpen(true);
  };

  const handleDeletePrioritySubmit = async () => {
    if (!selectedPriority) return;
    setIsSubmitting(true);
    try {
      const res = await deletePriority(selectedPriority._id || selectedPriority.id);
      if (res?.success) {
        showToast(`Priority "${selectedPriority.name}" removed successfully.`);
        setIsDeletePriorityModalOpen(false);
      } else {
        alert(res?.message || 'Failed to delete priority');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Configs
  const filteredConfigs = useMemo(() => {
    if (!configs) return [];
    return configs.filter(cfg => 
      cfg.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [configs, searchTerm]);

  // Event list configuration helper
  const eventTypes = [
    { key: 'client_created', label: 'Client Creation', desc: 'Auto-provisioned client company signups', badgeColor: 'green' },
    { key: 'client_user_created', label: 'User Creation', desc: 'Manually provisioned client users welcome alerts', badgeColor: 'indigo' },
    { key: 'ticket_created', label: 'Ticket Creation', desc: 'Customer ticket registration & technician alerts', badgeColor: 'blue' },
    { key: 'ticket_status_updated', label: 'Status Updates', desc: 'Transitions in ticket resolution status workflow', badgeColor: 'yellow' },
    { key: 'ticket_assigned', label: 'Ticket Assignment', desc: 'Assigning or forwarding tickets to department staff', badgeColor: 'purple' },
    { key: 'ticket_closed', label: 'Ticket Closure', desc: 'Marking a service ticket resolved or finalized', badgeColor: 'emerald' },
    { key: 'password_reset', label: 'Password Resets', desc: 'Temporary credentials generated by admin resets', badgeColor: 'red' },
    { key: 'new_message', label: 'Ticket Chat Messages', desc: 'Customer or consultant replies within ticket threads', badgeColor: 'indigo' }
  ];

  return (
    <div className="w-full relative font-sans min-h-screen pt-4 space-y-6 max-w-7xl">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Settings className="text-indigo-500 animate-spin-slow" size={32} /> System Settings
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-1">
            Configure system settings, SMTP routing protocols, and dynamic global variables.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-white/10 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.35)] transition-all hover:-translate-y-0.5"
        >
          <Plus size={16} /> Add CC Recipient
        </button>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl font-bold text-sm relative z-50 shadow-lg"
          >
            <CheckCircle2 size={16} /> {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Settings Console Card */}
      <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative z-10">
        
        {/* Navigation / Section Subheader */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5 mb-6">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Mail className="text-blue-400" size={18} /> CC Email Routing Manager
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Copy secondary email addresses on system notifications dynamically without code changes.
            </p>
          </div>
          
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-3.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search CC addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#181f2b] border border-white/5 text-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
            />
          </div>
        </div>

        {/* Configurations Grid / List */}
        {isLoading && configs.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Loading Routing Tables...</span>
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="py-20 text-center bg-[#181f2b]/40 rounded-2xl border border-dashed border-white/5 flex flex-col items-center justify-center">
            <Mail className="text-slate-600 mb-3" size={40} />
            <p className="text-slate-300 font-black text-sm uppercase tracking-wider">No CC configurations discovered</p>
            <p className="text-slate-500 text-xs mt-1">Create a configuration to start copying recipients automatically.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="pb-3 px-4">CC Email Address</th>
                  <th className="pb-3 px-4">Subscribed Notification Events</th>
                  <th className="pb-3 px-4 text-center">Status</th>
                  <th className="pb-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredConfigs.map((cfg) => (
                  <tr key={cfg._id || cfg.id} className="group hover:bg-white/[0.01] transition-colors">
                    
                    {/* Email column */}
                    <td className="py-4.5 px-4 font-bold text-white text-[14px]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                          <Mail size={14} />
                        </div>
                        <span className="truncate max-w-[200px] md:max-w-xs">{cfg.email}</span>
                      </div>
                    </td>

                    {/* Events Tags column */}
                    <td className="py-4.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md lg:max-w-xl">
                        {eventTypes.filter(ev => cfg[ev.key]).map(ev => (
                          <Badge key={ev.key} color={ev.badgeColor} size="sm">
                            {ev.label}
                          </Badge>
                        ))}
                        {eventTypes.filter(ev => cfg[ev.key]).length === 0 && (
                          <span className="text-xs text-slate-600 font-medium italic">No events subscribed</span>
                        )}
                      </div>
                    </td>

                    {/* Toggle Status column */}
                    <td className="py-4.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(cfg)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider transition-all ${
                          cfg.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/10 hover:bg-slate-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                        {cfg.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    {/* Actions column */}
                    <td className="py-4.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(cfg)}
                          className="p-2 bg-white/5 hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-400 rounded-lg border border-white/5 transition-colors"
                          title="Edit Subscriptions"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(cfg)}
                          className="p-2 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg border border-white/5 transition-colors"
                          title="Remove CC Email"
                        >
                          <Trash2 size={14} />
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

      {/* Consultant Preferences Section */}
      <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative z-10 mt-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5 mb-6">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="text-blue-400" size={18} /> Consultant Portal Preferences
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Control what data features are visible on the consultant dashboards.
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-6 bg-[#181f2b]/40 border border-white/5 rounded-2xl">
          <div className="space-y-1">
            <span className="text-[14px] font-bold text-white block">Display Operational Costs & Rates</span>
            <span className="text-xs text-slate-500 block leading-relaxed max-w-xl font-medium">
              If enabled, consultants will be able to see their Hourly Rate and Total Cost of Work metrics on their dashboards. If disabled, these financial cards will be hidden.
            </span>
          </div>
          
          <button
            type="button"
            onClick={async () => {
              const targetValue = !settings.showBillingToConsultants;
              const res = await updateSetting('showBillingToConsultants', targetValue);
              if (res?.success) {
                showToast(`Billing metrics are now ${targetValue ? 'Visible' : 'Hidden'} for consultants`);
              }
            }}
            className="shrink-0 transition-all hover:scale-105"
          >
            {settings.showBillingToConsultants ? (
              <ToggleRight size={36} className="text-emerald-400" />
            ) : (
              <ToggleLeft size={36} className="text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* Ticket Priority Manager Section */}
      <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-2xl relative z-10 mt-8 font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-white/5 mb-6">
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Settings className="text-blue-400" size={18} /> Ticket Priority Manager
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Define the priority tiers and severity levels for customer tickets.
            </p>
          </div>
          <button
            onClick={() => {
              setPriorityFormData({ name: '', level: 50, color: '#3b82f6', description: '' });
              setPriorityError('');
              setIsPriorityModalOpen(true);
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border border-white/10 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(79,70,229,0.35)] transition-all hover:-translate-y-0.5"
          >
            <Plus size={16} /> Add Priority
          </button>
        </div>

        {isPriorityLoading && priorities.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Loading Priorities...</span>
          </div>
        ) : priorities.length === 0 ? (
          <div className="py-12 text-center bg-[#181f2b]/40 rounded-2xl border border-dashed border-white/5 flex flex-col items-center justify-center">
            <Settings className="text-slate-600 mb-3" size={40} />
            <p className="text-slate-300 font-black text-sm uppercase tracking-wider">No Custom Priorities Configured</p>
            <p className="text-slate-500 text-xs mt-1">Add priority levels to classify ticket urgency.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <th className="pb-3 px-4">Priority Name</th>
                  <th className="pb-3 px-4">Severity Level</th>
                  <th className="pb-3 px-4">Color Tag</th>
                  <th className="pb-3 px-4">Description</th>
                  <th className="pb-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {priorities.map((p) => (
                  <tr key={p._id || p.id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-4 font-bold text-white text-[14px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || '#6c757d' }} />
                        {p.name}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-300 text-sm font-semibold">
                      {p.level}
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-xs font-mono">
                      {p.color || '#6c757d'}
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-xs max-w-xs truncate">
                      {p.description || '—'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleConfirmDeletePriority(p)}
                        className="p-2 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-lg border border-white/5 transition-colors"
                        title="Delete Priority"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE PRIORITY MODAL */}
      <Modal
        isOpen={isPriorityModalOpen}
        onClose={() => setIsPriorityModalOpen(false)}
        title="Add Ticket Priority"
        size="md"
      >
        <form onSubmit={handlePrioritySubmit} className="space-y-6">
          {priorityError && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl font-bold text-sm">
              <AlertCircle size={16} /> {priorityError}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
              Priority Name *
            </label>
            <Input
              type="text"
              value={priorityFormData.name}
              onChange={(e) => setPriorityFormData(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Critical, High, Urgent"
              required
              className="font-bold text-[14px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
              Severity Level * (Numeric Order)
            </label>
            <Input
              type="number"
              value={priorityFormData.level}
              onChange={(e) => setPriorityFormData(p => ({ ...p, level: parseInt(e.target.value) || 0 }))}
              placeholder="e.g. 100 for Critical, 10 for Low"
              required
              className="font-bold text-[14px]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
              Color Tag *
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={priorityFormData.color}
                onChange={(e) => setPriorityFormData(p => ({ ...p, color: e.target.value }))}
                className="w-10 h-10 border border-white/10 rounded-xl cursor-pointer bg-[#181f2b]"
              />
              <Input
                type="text"
                value={priorityFormData.color}
                onChange={(e) => setPriorityFormData(p => ({ ...p, color: e.target.value }))}
                placeholder="#3b82f6"
                required
                className="font-mono flex-1 font-bold text-[14px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">
              Description
            </label>
            <textarea
              value={priorityFormData.description}
              onChange={(e) => setPriorityFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Provide context or instructions for this priority tier..."
              className="w-full min-h-[100px] bg-[#1d2633] border border-white/5 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500/50 transition-all font-medium resize-y"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPriorityModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              Add Priority
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE PRIORITY CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeletePriorityModalOpen}
        onClose={() => setIsDeletePriorityModalOpen(false)}
        title="Remove Ticket Priority"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 font-sans">
            <ShieldAlert size={28} className="shrink-0 pt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black text-sm uppercase tracking-wide">Danger Zone Protocol</h4>
              <p className="text-xs leading-relaxed font-medium">
                You are removing the priority tier <strong className="text-white">{selectedPriority?.name}</strong>.
                This action will hide this priority tier from option lists. 
                This action is immediate and cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsDeletePriorityModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeletePrioritySubmit}
              isLoading={isSubmitting}
            >
              Remove Priority
            </Button>
          </div>
        </div>
      </Modal>

      {/* CREATE & EDIT MODAL */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={() => setModalMode(null)}
        title={modalMode === 'create' ? 'Add CC Email Configuration' : 'Edit CC Subscriptions'}
        size="lg"
      >
        <form onSubmit={handleFormSubmit} className="space-y-6">
          {formError && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl font-bold text-sm">
              <AlertCircle size={16} /> {formError}
            </div>
          )}

          {/* Email input */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              CC Email Address *
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
              placeholder="e.g. support-manager@yourcompany.com"
              required
              disabled={modalMode === 'edit'} // Disable email edit for consistency
              className="font-bold text-[14px]"
            />
            {modalMode === 'edit' && (
              <p className="text-[10px] text-slate-500 italic flex items-center gap-1">
                <Info size={11} /> CC Address matches unique database index. Delete and recreate if modifying domain.
              </p>
            )}
          </div>

          {/* Dynamic Switch Board */}
          <div className="space-y-3 pt-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block border-b border-white/5 pb-2">
              Select Copied System Notifications
            </label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eventTypes.map((ev) => (
                <div 
                  key={ev.key} 
                  onClick={() => setFormData(p => ({ ...p, [ev.key]: !p[ev.key] }))}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-start select-none ${
                    formData[ev.key] 
                      ? 'bg-indigo-500/5 border-indigo-500/30 text-white shadow-inner' 
                      : 'bg-[#181f2b]/60 border-white/5 text-slate-400 hover:bg-[#181f2b] hover:text-slate-300'
                  }`}
                >
                  <div className="space-y-1 pr-3">
                    <span className="text-[13px] font-bold block">{ev.label}</span>
                    <span className="text-[10px] text-slate-500 block leading-normal font-medium">{ev.desc}</span>
                  </div>
                  <button type="button" className="shrink-0 pt-0.5">
                    {formData[ev.key] ? (
                      <ToggleRight size={26} className="text-indigo-400" />
                    ) : (
                      <ToggleLeft size={26} className="text-slate-600" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Status Switch */}
          <div className="flex items-center justify-between p-4 bg-[#181f2b]/40 border border-white/5 rounded-2xl pt-3">
            <div className="space-y-0.5">
              <span className="text-[13px] font-bold text-white block">Rule Set Status</span>
              <span className="text-[10px] text-slate-500 block font-medium">Toggle active to temporarily suspend CC matching rules</span>
            </div>
            <button 
              type="button" 
              onClick={() => setFormData(p => ({ ...p, isActive: !p.isActive }))}
              className="shrink-0"
            >
              {formData.isActive ? (
                <ToggleRight size={32} className="text-emerald-400" />
              ) : (
                <ToggleLeft size={32} className="text-slate-600" />
              )}
            </button>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalMode(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
            >
              {modalMode === 'create' ? 'Register Rules' : 'Save Changes'}
            </Button>
          </div>

        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={modalMode === 'delete'}
        onClose={() => setModalMode(null)}
        title="Remove CC Recipient"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4.5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
            <ShieldAlert size={28} className="shrink-0 pt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black text-sm uppercase tracking-wide">Danger Zone Protocol</h4>
              <p className="text-xs leading-relaxed font-medium">
                You are removing <strong className="text-white">{selectedConfig?.email}</strong> from all automated email copies. 
                This action is immediate and cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalMode(null)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteSubmit}
              isLoading={isSubmitting}
            >
              Remove Config
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
