import React, { useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { Users, Plus, Download, Edit2, Trash2, Key, Mail, Briefcase, IdCard, Activity, Ticket, ChevronRight, XCircle } from 'lucide-react';
import { useClientUserStore } from '../../store/useClientUserStore';
import ManageClientUserModal from '../../components/ui/ManageClientUserModal';
import { useAuthStore } from '../../store/useAuthStore';
import { useTicketStore } from '../../store/useTicketStore';
import TicketViewerModal from '../../components/ui/TicketViewerModal';
import Badge from '../../components/ui/Badge';

export default function MyTeam() {
  const { clientUsers, stats, fetchClientUsers, isLoading: clientUsersLoading, deleteClientUser, updateClientUserStatus, resetClientUserPassword } = useClientUserStore();
  const { user: currentUser } = useAuthStore();
  const { tickets, fetchTickets } = useTicketStore();
  
  if (currentUser?.role === 'Client User' && !currentUser?.isPrimaryContact) {
    return <Navigate to="/" replace />;
  }
  
  const [searchParams] = useSearchParams();
  const initStatus = searchParams.get('status') || 'all';

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState(initStatus);

  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [viewingTicketsMember, setViewingTicketsMember] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchClientUsers();
    fetchTickets();
  }, [fetchClientUsers, fetchTickets]);

  const filteredUsers = clientUsers.filter(user => {
    const term = search.toLowerCase();
    const matchSearch = term === '' || 
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.employeeCode?.toLowerCase().includes(term);
    
    const matchStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    const csvData = filteredUsers.map(u => ({
      Name: u.name,
      Email: u.email,
      'Employee Code': u.employeeCode || '',
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
    a.download = `my_team_export_${new Date().getTime()}.csv`;
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
      const res = await deleteClientUser(user._id || user.id);
      if (res && !res.success) {
        alert(res.message);
      }
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

  const getStatusColor = (s) => {
    switch (s?.toLowerCase()) {
      case 'open':
      case 'pending':
      case 'assigned':
        return 'blue';
      case 'on hold':
      case 'hold':
        return 'yellow';
      case 'cancelled':
        return 'red';
      case 'resolved':
      case 'closed':
        return 'emerald';
      default:
        return 'gray';
    }
  };

  const memberTickets = React.useMemo(() => {
    if (!viewingTicketsMember) return [];
    const memberId = viewingTicketsMember._id || viewingTicketsMember.id;
    return tickets.filter(t => 
      t.creatorId === memberId || 
      t.createdBy?._id === memberId || 
      t.createdBy === memberId ||
      t.user === viewingTicketsMember.name
    );
  }, [tickets, viewingTicketsMember]);

  const currentUserId = currentUser?._id || currentUser?.id;

  return (
    <div className="w-full pt-2 font-sans relative">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="text-blue-500" size={32} /> Company Team Directory
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Manage and provision members under your company account.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} disabled={filteredUsers.length === 0} className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all disabled:opacity-50">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => { setSelectedUser(null); setModalMode('create'); }} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            <Plus size={16} strokeWidth={3} /> Add Team Member
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl"><Users size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats.total || clientUsers.length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Total Team</div></div>
        </div>
        <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><Users size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats.active || clientUsers.filter(u=>u.status==='active').length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Active nodes</div></div>
        </div>
        <div className="bg-[#111620]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-red-500/20 text-red-400 rounded-xl"><Users size={24} /></div>
          <div><div className="text-3xl font-black text-white">{stats.suspended || clientUsers.filter(u=>u.status==='suspended').length}</div><div className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Inactive</div></div>
        </div>
      </div>

      <div className="bg-[#111620]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden min-h-[600px]">
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-blue-600/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute left-0 top-1/2 w-60 h-60 bg-purple-600/5 blur-[80px] pointer-events-none rounded-full" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative z-10">
          <input type="text" placeholder="Search team members..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-[#1d2633] border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-inner text-sm" />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-[#1d2633] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 shadow-inner text-sm appearance-none">
            <option value="all">All Status Nodes</option>
            <option value="active">Active</option>
            <option value="suspended">Inactive</option>
          </select>
        </div>

        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left">
            <thead className="bg-[#181f2b]/80 border-b border-white/5">
              <tr>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-tl-xl border-b border-white/5">Identity</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Role / Position</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Status Core</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-white/5">Metrics</th>
                <th className="p-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-tr-xl border-b border-white/5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-white">
              {clientUsersLoading && clientUsers.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest animate-pulse">Establishing secure link...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-slate-500 font-bold uppercase tracking-widest">No matching team members located.</td></tr>
              ) : filteredUsers.map((user) => {
                const isCurrent = user._id === currentUserId || user.id === currentUserId;
                return (
                  <tr 
                    key={user._id || user.id} 
                    onClick={() => setViewingTicketsMember(user)}
                    className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group cursor-pointer"
                  >
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
                      <div className="flex flex-col gap-1">
                        <div className="text-[13px] font-bold text-slate-300 flex items-center gap-1.5">
                          <Briefcase className="text-indigo-400" size={14} />
                          {user.position || 'No Title'}
                        </div>
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role: {user.role === 'clientuser' ? 'Client User' : user.role}</span>
                      </div>
                    </td>
                    <td className="p-5">
                       <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                         <button 
                           onClick={() => handleStatusToggle(user)} 
                           disabled={isCurrent}
                           className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${user.status === 'active' ? 'bg-emerald-600' : 'bg-slate-700'} disabled:opacity-30 disabled:cursor-not-allowed`}
                           title={`Click to mark ${user.status === 'active' ? 'inactive' : 'active'}`}
                         >
                           <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${user.status === 'active' ? 'translate-x-5' : 'translate-x-0'}`} />
                         </button>
                         <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-white/10 shadow-sm ${user.status==='active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                           {user.status === 'suspended' ? 'inactive' : (user.status || 'active')}
                         </span>
                       </div>
                    </td>
                    <td className="p-5">
                       <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity size={12}/> Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                       {user.statusReason && <div className="text-[10px] text-red-400/80 italic line-clamp-1 max-w-[150px]">"{user.statusReason}"</div>}
                    </td>
                    <td className="p-5" onClick={(e) => e.stopPropagation()}>
                       <div className="flex flex-col items-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => { setSelectedUser(user); setModalMode('edit'); }} className="flex justify-end gap-2 items-center text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:text-blue-400 bg-white/5 py-1.5 px-3 rounded-lg border border-transparent hover:border-blue-500/30 transition-all cursor-pointer">
                           <Edit2 size={12} /> Edit Member
                         </button>
                         <div className="flex gap-2">
                            <button onClick={() => handleResetPassword(user)} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-yellow-500 border border-transparent hover:border-yellow-500/30 transition-all"><Key size={14}/></button>
                            <button onClick={() => handleDelete(user)} disabled={isCurrent} className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-red-500 border border-transparent hover:border-red-500/30 transition-all disabled:opacity-30"><Trash2 size={14}/></button>
                         </div>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode && (
         <ManageClientUserModal 
           isOpen={!!modalMode}
           mode={modalMode}
           user={selectedUser}
           onClose={() => { setModalMode(null); setSelectedUser(null); }}
           clients={[]}
         />
      )}

      {viewingTicketsMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm" onClick={() => setViewingTicketsMember(null)} />
          <div className="bg-[#111620] border border-white/10 w-full max-w-4xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 space-y-6 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <Ticket className="text-blue-500" size={22} /> Tickets by {viewingTicketsMember.name}
                </h3>
                <p className="text-[12px] text-slate-400 font-medium mt-1">Showing all tickets submitted by this team user ({viewingTicketsMember.email})</p>
              </div>
              <button 
                onClick={() => setViewingTicketsMember(null)} 
                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 min-h-[300px] custom-scrollbar">
              {memberTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
                  <Ticket size={40} className="text-slate-600 mb-3 animate-pulse" />
                  <span className="font-bold text-[14px] uppercase tracking-wider text-slate-400">No tickets submitted by this user</span>
                </div>
              ) : (
                <table className="w-full text-left table-fixed">
                  <thead className="bg-[#181f2b]/80 border-b border-white/5 sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[20%]">Ticket #</th>
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[45%]">Ticket Info</th>
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[20%]">Status & Priority</th>
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-[15%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-white divide-y divide-white/5">
                    {memberTickets.map((t) => (
                      <tr 
                        key={t.id || t._id} 
                        onClick={() => setSelectedTicket(t)}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group border-b border-white/5"
                      >
                        <td className="p-4 align-middle text-[12px] font-black text-slate-400">
                          {t.ticketNumber}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col gap-1">
                            <span className="font-extrabold text-[13px] text-white group-hover:text-blue-400 transition-colors truncate">
                              {t.title}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium truncate block max-w-full">
                              {t.description}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex flex-col gap-1.5 items-start">
                            <Badge color={getStatusColor(t.status)} size="xs">{t.status}</Badge>
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                              ● {t.priority}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 align-middle text-right" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setSelectedTicket(t)} 
                            className="text-[9px] font-black text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 shadow-sm uppercase tracking-wider transition-all"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedTicket && (
        <TicketViewerModal 
          isOpen={!!selectedTicket} 
          onClose={() => setSelectedTicket(null)} 
          ticket={selectedTicket} 
        />
      )}
    </div>
  );
}
