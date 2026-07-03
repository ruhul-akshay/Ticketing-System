import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Download, Edit2, Trash2, Key, ShieldAlert, ShieldCheck, Mail, Briefcase, Phone, IdCard, Activity } from 'lucide-react';
import { useClientUserStore } from '../../store/useClientUserStore';
import { useClientStore } from '../../store/useClientStore';
import ManageClientUserModal from '../../components/ui/ManageClientUserModal';
import { useAuthStore } from '../../store/useAuthStore';

export default function ClientUsersManagement() {
  const { clientUsers, stats, fetchClientUsers, isLoading: clientUsersLoading, deleteClientUser, updateClientUserStatus, resetClientUserPassword } = useClientUserStore();
  const { clients, fetchClients } = useClientStore();
  
  const [searchParams] = useSearchParams();
  const initStatus = searchParams.get('status') || 'all';

  const [search, setSearch] = useState('');
  const [filterClient, setFilterClient] = useState('all');
  const [filterStatus, setFilterStatus] = useState(initStatus);

  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchClientUsers();
    fetchClients();
  }, [fetchClientUsers, fetchClients]);

  const getClientName = (user) => {
    if (user.client?.name) return user.client.name;
    if (user.clientName) return user.clientName;
    if (user.clientId) {
      const cl = clients.find(c => c._id === user.clientId || c.id === user.clientId);
      return cl ? cl.name : 'Unknown';
    }
    if (user.client && typeof user.client === 'string') {
      const cl = clients.find(c => c._id === user.client || c.id === user.client);
      return cl ? cl.name : 'Unknown';
    }
    return 'No Client Attached';
  };

  const filteredUsers = clientUsers.filter(user => {
    const term = search.toLowerCase();
    const matchSearch = term === '' || 
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.employeeCode?.toLowerCase().includes(term);
    
    const clientId = user.client?._id || (typeof user.client === 'string' ? user.client : null) || user.clientId;
    const matchClient = filterClient === 'all' || clientId === filterClient;
    const matchStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchSearch && matchClient && matchStatus;
  });

  const handleExport = () => {
    const csvData = filteredUsers.map(u => ({
      Name: u.name,
      Email: u.email,
      'Employee Code': u.employeeCode || '',
      Client: getClientName(u),
      Position: u.position || '',
      Status: u.status,
      'Phone Number': u.phoneNumber || ''
    }));

    const csv = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client_users_export_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleStatusToggle = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const reason = prompt(`Reason for marking ${newStatus}:`);
    if (reason !== null) {
      await updateClientUserStatus(user._id || user.id, newStatus, reason);
    }
  };

  const handleDelete = async (user) => {
    if (window.confirm(`Are you sure you want to completely erase ${user.name}? This cannot be undone.`)) {
      await deleteClientUser(user._id || user.id);
    }
  };

  const handleResetPassword = async (user) => {
    const np = prompt(`Enter new password for ${user.name} (min 6 chars):`);
    if (np && np.length >= 6) {
      const res = await resetClientUserPassword(user._id || user.id, np);
      alert(res.message || (res.success ? 'Password reset successfully!' : 'Failed.'));
    } else if (np) {
      alert('Password must be at least 6 characters.');
    }
  };

  const { user: currentUser } = useAuthStore();
  const currentUserId = currentUser?._id || currentUser?.id;

  return (
    <div className="w-full pt-2 font-sans relative">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="text-blue-500" size={32} /> Client User Directory
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Control identities, clients, and roles globally.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} disabled={filteredUsers.length === 0} className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all disabled:opacity-50">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => { setSelectedUser(null); setModalMode('create'); }} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            <Plus size={16} strokeWidth={3} /> Add Client User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Users size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats.totalUsers || clientUsers.length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Total Base</div></div>
        </motion.div>
        <motion.div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><ShieldCheck size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats.activeUsers || clientUsers.filter(u=>u.status==='active').length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Active nodes</div></div>
        </motion.div>
        <motion.div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-red-500/20 text-red-400 rounded-xl"><ShieldAlert size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats.suspendedUsers || clientUsers.filter(u=>u.status==='suspended').length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Suspended</div></div>
        </motion.div>
        <motion.div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl"><Briefcase size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats.withClient || Object.values(clientUsers).filter(v => v.clientId || v.client).length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">With Client</div></div>
        </motion.div>
      </div>

      <div className="bg-[#111620]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden min-h-[600px]">
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute left-0 top-1/2 w-60 h-60 bg-purple-600/5 blur-[80px] pointer-events-none rounded-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative z-10">
          <input type="text" placeholder="Search identities..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#1d2633] border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-inner text-sm" />
          <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="w-full bg-[#1d2633] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-inner text-sm appearance-none">
            <option value="all">All Clients</option>
            {clients.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-[#1d2633] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-inner text-sm appearance-none">
            <option value="all">All Status Nodes</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left">
            <thead className="bg-[#181f2b]/80 border-b border-white/5">
              <tr>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-tl-xl border-b border-white/5">Identity</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Client</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Status Core</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Metrics</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-tr-xl border-b border-white/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {clientUsersLoading && clientUsers.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Establishing secure link...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest">No matching identities located.</td></tr>
              ) : filteredUsers.map((user, i) => {
                const isCurrent = user._id === currentUserId || user.id === currentUserId;
                return (
                  <motion.tr initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} key={user._id || user.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-black shadow-lg">
                          {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-black text-[15px]">{user.name}</div>
                          <div className="text-[12px] font-bold text-slate-400 mt-1 flex items-center gap-1.5"><Mail size={12}/>{user.email}</div>
                          {user.employeeCode && <div className="text-[11px] font-bold text-indigo-400 mt-1 flex items-center gap-1.5 uppercase tracking-wide"><IdCard size={12}/>{user.employeeCode}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2.5 text-[13px] font-bold text-slate-300">
                        <Briefcase className="text-indigo-400" size={16} />
                        {getClientName(user)}
                      </div>
                    </td>
                    <td className="p-5">
                       <div className="flex flex-col items-start gap-2">
                         <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/10 shadow-sm ${user.status==='active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                           {user.status || 'active'}
                         </span>
                         <button onClick={() => handleStatusToggle(user)} disabled={isCurrent} className="text-[10px] font-bold tracking-widest uppercase text-slate-500 hover:text-blue-400 transition-colors disabled:opacity-30">
                           Toggle Status
                         </button>
                       </div>
                    </td>
                    <td className="p-5">
                       <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity size={12}/> Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                       <div className="text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">Role: {user.role}</div>
                       {user.statusReason && <div className="text-[10px] text-red-400/80 italic line-clamp-1 max-w-[150px]">"{user.statusReason}"</div>}
                    </td>
                    <td className="p-5">
                       <div className="flex flex-col items-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setSelectedUser(user); setModalMode('edit'); }} className="flex justify-end gap-2 items-center text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-400 bg-white/5 py-1.5 px-3 rounded-lg border border-transparent hover:border-blue-500/30 transition-all cursor-pointer">
                           <Edit2 size={12} /> Edit Map
                         </button>
                         <div className="flex gap-2">
                            <button onClick={() => handleResetPassword(user)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-yellow-500 border border-transparent hover:border-yellow-500/30 transition-all"><Key size={14}/></button>
                            <button onClick={() => handleDelete(user)} disabled={isCurrent} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-red-500 border border-transparent hover:border-red-500/30 transition-all disabled:opacity-30"><Trash2 size={14}/></button>
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
           <ManageClientUserModal 
             isOpen={!!modalMode}
             mode={modalMode}
             user={selectedUser}
             onClose={() => { setModalMode(null); setSelectedUser(null); }}
             clients={clients}
           />
        )}
      </AnimatePresence>
    </div>
  );
}
