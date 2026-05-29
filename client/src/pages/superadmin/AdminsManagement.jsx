import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Download, Edit2, Trash2, Key, ShieldAlert, ShieldCheck, Mail, Building2, Phone, IdCard, Activity, BarChart2, X } from 'lucide-react';
import { useAdminStore } from '../../core/store/useAdminStore';
import { useDepartmentStore } from '../../core/store/useDepartmentStore';
import ManageAdminModal from '../../components/forms/ManageAdminModal';
import AdminDashboard from '../admin/AdminDashboard';

export default function AdminsManagement() {
  const { admins, stats, fetchAdmins, isLoading: adminsLoading, deleteAdmin, updateAdminStatus, resetAdminPassword } = useAdminStore();
  const { departments, fetchDepartments } = useDepartmentStore();
  
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [viewAdminId, setViewAdminId] = useState(null); // for superadmin stats view

  useEffect(() => {
    fetchAdmins();
    fetchDepartments();
  }, [fetchAdmins, fetchDepartments]);

  const getDepartmentName = (admin) => {
    if (admin.department?.name) return admin.department.name;
    if (admin.departmentId) {
      const dept = departments.find(d => d._id === admin.departmentId || d.id === admin.departmentId);
      return dept ? dept.name : 'Unknown';
    }
    return 'Global Level Scope';
  };

  const filteredAdmins = admins.filter(admin => {
    const term = search.toLowerCase();
    const matchSearch = term === '' || 
      admin.name?.toLowerCase().includes(term) ||
      admin.email?.toLowerCase().includes(term) ||
      admin.employeeCode?.toLowerCase().includes(term);
    
    const dId = admin.department?._id || admin.departmentId;
    const matchDept = filterDept === 'all' || dId === filterDept;
    const matchStatus = filterStatus === 'all' || admin.status === filterStatus;
    
    return matchSearch && matchDept && matchStatus;
  });

  const handleExport = () => {
    const csvData = filteredAdmins.map(a => ({
      Name: a.name,
      Email: a.email,
      'Employee Code': a.employeeCode || '',
      Department: getDepartmentName(a),
      Position: a.position || '',
      Status: a.status,
      'Phone Number': a.phoneNumber || ''
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admins_export_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleStatusToggle = async (admin) => {
    const newStatus = admin.status === 'active' ? 'suspended' : 'active';
    const reason = prompt(`Reason for demoting to ${newStatus}:`);
    if (reason !== null) {
      await updateAdminStatus(admin._id || admin.id, newStatus, reason);
    }
  };

  const handleDelete = async (admin) => {
    if (window.confirm(`Are you absolutely sure you want to hard-wipe Core Admin ${admin.name}? This cannot be undone.`)) {
      await deleteAdmin(admin._id || admin.id);
    }
  };

  const handleResetPassword = async (admin) => {
    const np = prompt(`Enter new absolute root hash for ${admin.name} (min 6 chars):`);
    if (np && np.length >= 6) {
      const res = await resetAdminPassword(admin._id || admin.id, np);
      alert(res.message || (res.success ? 'Hash committed successfully!' : 'Commit Failed.'));
    } else if (np) {
      alert('Hash must be at least 6 characters.');
    }
  };

  const currentUserId = localStorage.getItem('userId');

  return (
    <div className="w-full pt-2 font-sans relative">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Shield className="text-[#ED1B2F]" size={32} /> Core Administrators
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Control the root access tier and department assignments seamlessly.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} disabled={filteredAdmins.length === 0} className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all disabled:opacity-50">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => { setSelectedAdmin(null); setModalMode('create'); }} className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-[#ED1B2F] hover:from-red-500 hover:to-red-400 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(237,27,47,0.3)]">
            <Plus size={16} strokeWidth={3} /> Register Core Admin
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <motion.div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-red-500/20 text-red-500 rounded-xl"><Shield size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats.totalAdmins || admins.length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Total Nodes</div></div>
        </motion.div>
        <motion.div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><ShieldCheck size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats.activeAdmins || admins.filter(a=>a.status==='active').length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Active Keys</div></div>
        </motion.div>
        <motion.div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-yellow-500/20 text-yellow-500 rounded-xl"><ShieldAlert size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats.inactiveAdmins || admins.filter(a=>a.status==='suspended').length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Demoted / Off</div></div>
        </motion.div>
        <motion.div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Building2 size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats.departmentsCovered || Object.values(admins).filter(v => v.departmentId || v.department).length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Managed Scopes</div></div>
        </motion.div>
      </div>

      <div className="bg-[#111620]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden min-h-[600px]">
        <div className="absolute right-0 bottom-0 w-96 h-96 bg-red-600/10 blur-[120px] pointer-events-none rounded-full" />
        <div className="absolute left-0 top-1/2 w-60 h-60 bg-[#ED1B2F]/5 blur-[80px] pointer-events-none rounded-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
          <input type="text" placeholder="Search absolute identities..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#1d2633] border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500/50 shadow-inner text-sm" />
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="w-full bg-[#1d2633] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 shadow-inner text-sm appearance-none">
            <option value="all">Global (All Depts)</option>
            {departments.map(d => <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-[#1d2633] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-red-500/50 shadow-inner text-sm appearance-none">
            <option value="all">All Operational States</option>
            <option value="active">Active System</option>
            <option value="suspended">Suspended Override</option>
          </select>
        </div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left">
            <thead className="bg-[#181f2b]/80 border-b border-white/5">
              <tr>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-tl-xl border-b border-white/5">Root Identity</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Scope</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Permission State</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Metrics</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-tr-xl border-b border-white/5 text-right">Overrides</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {adminsLoading && admins.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Establishing root override...</td></tr>
              ) : filteredAdmins.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest">No matching admin identities located.</td></tr>
              ) : filteredAdmins.map((admin, i) => {
                const isCurrent = admin._id === currentUserId || admin.id === currentUserId;
                return (
                  <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} key={admin._id || admin.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ED1B2F] to-[#455185] flex items-center justify-center font-black shadow-[0_0_15px_rgba(237,27,47,0.4)] border border-red-500/20">
                          {admin.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                          <div className="font-black text-[15px] flex items-center gap-2">
                            {admin.name}
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-black rounded uppercase tracking-widest border border-red-500/30">Admin</span>
                          </div>
                          <div className="text-[12px] font-bold text-slate-400 mt-1 flex items-center gap-1.5"><Mail size={12}/>{admin.email}</div>
                          {admin.employeeCode && <div className="text-[11px] font-bold text-red-300 mt-1 flex items-center gap-1.5 uppercase tracking-wide"><IdCard size={12}/>{admin.employeeCode}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2.5 text-[13px] font-bold text-slate-300">
                        <Building2 className="text-red-400" size={16} />
                        {getDepartmentName(admin)}
                      </div>
                    </td>
                    <td className="p-5">
                       <div className="flex flex-col items-start gap-2">
                         <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/10 shadow-sm ${admin.status==='active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                           {admin.status || 'active'}
                         </span>
                         <button onClick={() => handleStatusToggle(admin)} disabled={isCurrent} className="text-[10px] font-bold tracking-widest uppercase text-slate-500 hover:text-red-400 transition-colors disabled:opacity-30">
                           Override Power
                         </button>
                       </div>
                    </td>
                    <td className="p-5">
                       <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity size={12}/> Key Gen: {new Date(admin.createdAt).toLocaleDateString()}</div>
                       <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">Auth: {admin.role}</div>
                       {admin.statusReason && <div className="text-[10px] text-red-400/80 italic line-clamp-1 max-w-[150px]">"{admin.statusReason}"</div>}
                    </td>
                    <td className="p-5">
                       <div className="flex flex-col items-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setViewAdminId(admin._id || admin.id)} className="flex justify-end gap-2 items-center text-[11px] font-bold uppercase tracking-widest text-blue-400 hover:text-blue-300 bg-blue-500/5 py-1.5 px-3 rounded-lg border border-transparent hover:border-blue-500/30 transition-all cursor-pointer">
                            <BarChart2 size={12} /> View Stats
                          </button>
                         <button onClick={() => { setSelectedAdmin(admin); setModalMode('edit'); }} className="flex justify-end gap-2 items-center text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-400 bg-white/5 py-1.5 px-3 rounded-lg border border-transparent hover:border-red-500/30 transition-all cursor-pointer">
                           <Edit2 size={12} /> Refactor
                         </button>
                         <div className="flex gap-2">
                            <button onClick={() => handleResetPassword(admin)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-yellow-500 border border-transparent hover:border-yellow-500/30 transition-all"><Key size={14}/></button>
                            <button onClick={() => handleDelete(admin)} disabled={isCurrent} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-red-500 border border-transparent hover:border-red-500/30 transition-all disabled:opacity-30"><Trash2 size={14}/></button>
                         </div>
                       </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {modalMode && (
           <ManageAdminModal 
             isOpen={!!modalMode}
             mode={modalMode}
             admin={selectedAdmin}
             onClose={() => { setModalMode(null); setSelectedAdmin(null); }}
             departments={departments}
           />
        )}
      </AnimatePresence>

      {/* Admin Stats Side Panel (SuperAdmin view) */}
      <AnimatePresence>
        {viewAdminId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewAdminId(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-3xl bg-[#0a0d14] border-l border-white/10 z-50 flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#111620]/80 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <BarChart2 size={20} className="text-blue-400" />
                  <span className="text-white font-bold text-lg">Admin Performance Dashboard</span>
                </div>
                <button
                  onClick={() => setViewAdminId(null)}
                  className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
                <AdminDashboard adminId={viewAdminId} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
