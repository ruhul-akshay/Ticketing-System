import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Search, ShieldAlert, Edit2, Check, X, RefreshCw, 
  Users, Clock, Award, Activity, Building2, User, ToggleLeft, ToggleRight 
} from 'lucide-react';
import api from '../../api/mockAxios';
import { useAuthStore } from '../../store/useAuthStore';
import { useSystemSettingStore } from '../../store/useSystemSettingStore';
import { Input } from '../../components/Input';

export default function PricingSetup() {
  const { user } = useAuthStore();
  const { settings, fetchSettings, updateSetting } = useSystemSettingStore();
  const [summaries, setSummaries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editRate, setEditRate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isSuperAdmin = user?.role === 'Super Admin' || user?.role === 'superadmin';

  const fetchSummaries = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/consultant-stats');
      setSummaries(res.data.data || []);
    } catch (err) {
      console.error('Error fetching consultant billing stats:', err);
      setError('Failed to fetch consultant billing rates and work logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchSummaries();
      fetchSettings();
    }
  }, [isSuperAdmin]);

  const handleStartEdit = (item) => {
    setEditingId(item._id);
    setEditRate(String(item.hourlyCost || 0));
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditRate('');
  };

  const handleSaveRate = async (id) => {
    if (isNaN(Number(editRate)) || Number(editRate) < 0) {
      alert('Please enter a valid non-negative billing rate.');
      return;
    }
    setIsSaving(true);
    setSuccessMsg('');
    setError('');
    try {
      const response = await api.put(`/client-users/${id}`, {
        hourlyCost: Number(editRate),
        role: 'consultant'
      });
      if (response.data?.success || response.status === 200) {
        setSuccessMsg('Billing rate updated successfully!');
        setEditingId(null);
        setEditRate('');
        await fetchSummaries();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError(response.data?.message || 'Failed to save rate.');
      }
    } catch (err) {
      console.error('Error saving billing rate:', err);
      setError(err.response?.data?.message || 'Error occurred while saving billing rate.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter summaries based on search query
  const filteredSummaries = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return summaries;
    return summaries.filter(item => 
      item.name?.toLowerCase().includes(term) ||
      item.email?.toLowerCase().includes(term) ||
      item.employeeCode?.toLowerCase().includes(term) ||
      item.department?.toLowerCase().includes(term)
    );
  }, [summaries, searchTerm]);

  // Aggregate metrics
  const aggregateMetrics = useMemo(() => {
    const totalConsultants = summaries.length;
    const totalHours = summaries.reduce((acc, curr) => acc + (curr.totalWorkHours || 0), 0);
    const totalCost = summaries.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
    return {
      totalConsultants,
      totalHours: +totalHours.toFixed(1),
      totalCost: +totalCost.toFixed(2)
    };
  }, [summaries]);

  if (!isSuperAdmin) {
    return (
      <div className="w-full relative font-sans min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30 mb-6 text-red-500">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase mb-2">Access Denied</h2>
        <p className="text-slate-400 max-w-md text-sm font-medium leading-relaxed">
          You do not have permission to view or manage the Pricing Setup.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative font-sans p-4 md:p-8 space-y-8 min-h-screen">
      {/* Background Blurs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5 relative z-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <DollarSign className="text-red-500 shrink-0" size={32} />
            Pricing List & Rate Setup
          </h1>
          <p className="text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wider">
            Configure hourly billing rates and monitor work costs for all consultants.
          </p>
        </div>

        <button 
          onClick={fetchSummaries}
          disabled={isLoading}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Refreshing...' : 'Refresh Logs'}
        </button>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-5 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-2 relative z-10 shadow-lg"
          >
            <Check size={16} /> {successMsg}
          </motion.div>
        )}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-3 rounded-2xl text-[13px] font-bold flex items-center gap-2 relative z-10 shadow-lg"
          >
            <ShieldAlert size={16} /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Consultant Visibility Preference Control */}
      <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 shadow-lg">
        <div className="space-y-0.5">
          <h4 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="text-red-400" size={16} /> Portal Access Configurations
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            Toggle whether consultants can view their own Hourly Rates and Total Cost of Work calculations on their dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            const targetVal = !settings.showBillingToConsultants;
            const res = await updateSetting('showBillingToConsultants', targetVal);
            if (res?.success) {
              setSuccessMsg(`Pricing data visibility set to: ${targetVal ? 'Visible' : 'Hidden'} for consultants`);
              setTimeout(() => setSuccessMsg(''), 3500);
            }
          }}
          className="flex items-center gap-3 bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/10 rounded-xl transition-all select-none cursor-pointer text-xs font-bold text-slate-300"
        >
          <span>Consultant Visibility:</span>
          {settings.showBillingToConsultants ? (
            <div className="flex items-center gap-1.5 text-emerald-400 font-black uppercase tracking-wider"><ToggleRight size={26} /> Enabled</div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-500 font-black uppercase tracking-wider"><ToggleLeft size={26} /> Disabled</div>
          )}
        </button>
      </div>

      {/* Metric Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 relative z-10">
        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-5 -mt-5" />
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1.5">Consultants</h3>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white">{aggregateMetrics.totalConsultants}</h2>
              <p className="text-[11px] text-slate-400 mt-1 font-bold">Total active nodes in pool</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400"><Users size={20} /></div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl -mr-5 -mt-5" />
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1.5">Logged Hours</h3>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white">{aggregateMetrics.totalHours} hrs</h2>
              <p className="text-[11px] text-slate-400 mt-1 font-bold">Total hours recorded overall</p>
            </div>
            <div className="p-3 rounded-2xl bg-yellow-500/10 text-yellow-400"><Clock size={20} /></div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl border border-slate-200 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl -mr-5 -mt-5" />
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1.5">Accrued Expense</h3>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white">₹{aggregateMetrics.totalCost.toLocaleString('en-IN')}</h2>
              <p className="text-[11px] text-slate-400 mt-1 font-bold">Calculated from hour-based rates</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400"><DollarSign size={20} /></div>
          </div>
        </div>
      </div>

      {/* Search & List */}
      <div className="glass-card rounded-[2rem] border border-slate-200 dark:border-white/5 overflow-hidden relative z-10">
        <div className="p-6 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight uppercase flex items-center gap-2">
            <Award className="text-red-500" size={16} /> Rates Ledger
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text"
              placeholder="Search by name, code or scope..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl pl-11 pr-4 py-2.5 text-slate-800 dark:text-white text-xs placeholder:text-slate-500 outline-none focus:border-red-500/50 transition-all font-bold"
            />
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/80 dark:bg-[#181f2b]/80 border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-tl-xl">Consultant Node</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Scope</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Hourly Rate</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Work Effort</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right rounded-tr-xl">Total Cost of Work</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-500 font-medium">
                    <div className="flex justify-center items-center gap-3">
                      <RefreshCw className="animate-spin text-red-500" size={18} />
                      Loading rates and effort metrics...
                    </div>
                  </td>
                </tr>
              ) : filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-500 font-medium">
                    No matching consultants found in stats registry.
                  </td>
                </tr>
              ) : filteredSummaries.map((item) => {
                const isEditingThis = editingId === item._id;
                return (
                  <tr key={item._id} className="border-b border-slate-200 dark:border-white/5 hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-all group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-md shrink-0">
                          {item.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-[14px] font-black text-slate-800 dark:text-white leading-tight group-hover:text-red-400 transition-colors">{item.name}</h4>
                          <span className="text-[11px] text-slate-500 font-semibold leading-relaxed flex items-center gap-1.5 mt-0.5"><User size={10}/> {item.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="text-[13px] font-bold text-slate-650 dark:text-slate-300 flex items-center gap-2">
                        <Building2 className="text-red-400" size={14} />
                        {item.department || 'Global Level Scope'}
                      </div>
                      {item.employeeCode && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">ID: {item.employeeCode}</span>
                      )}
                    </td>

                    <td className="p-5">
                      <div className="flex justify-center items-center">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1.5 animate-fadeIn">
                            <input
                              type="number"
                              min="0"
                              value={editRate}
                              onChange={e => setEditRate(e.target.value)}
                              className="w-24 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1.5 text-center text-slate-800 dark:text-white text-xs font-black outline-none focus:border-red-500/50"
                              placeholder="Rate"
                              autoFocus
                            />
                            <button 
                              onClick={() => handleSaveRate(item._id)}
                              disabled={isSaving}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors border border-emerald-500/20 cursor-pointer disabled:opacity-50"
                              title="Save Rate"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={handleCancelEdit}
                              className="p-1.5 bg-slate-150 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg transition-colors border border-slate-200 dark:border-white/5 cursor-pointer"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/rate">
                            <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                              ₹{(item.hourlyCost || 0).toLocaleString('en-IN')}/hr
                            </span>
                            <button 
                              onClick={() => handleStartEdit(item)}
                              className="p-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-900 dark:bg-white/5 dark:border-white/5 dark:text-slate-400 dark:hover:text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Edit Hourly Rate"
                            >
                              <Edit2 size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="p-5 text-center">
                      <div className="text-sm font-black text-slate-800 dark:text-slate-200">{item.totalWorkHours || 0} hrs</div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Across logged tickets</span>
                    </td>

                    <td className="p-5 text-right">
                      <div className="text-sm font-black text-emerald-400">
                        ₹{(item.totalCost || 0).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Accrued billable cost</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
