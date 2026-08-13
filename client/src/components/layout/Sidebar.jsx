import React, { useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, PlusCircle, Ticket, Star, 
  ClipboardList, BookOpen, Users, Shield, 
  Building2, Briefcase, Radio, GitFork, 
  PanelLeftClose, PanelLeftOpen, LogOut, Sun, Moon,
  Download
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import logo from '../../assets/logo.png';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen, isCollapsed, setIsCollapsed }) => {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const role = user?.role || 'User';

  // Notifications are polled centrally by useNotificationPolling in MainLayout.
  // Sidebar only reads from the store — no separate fetch/interval needed here.
  const { notifications, markAsRead, downloadAttachment } = useNotificationStore();
  const [expandedNoticeId, setExpandedNoticeId] = useState(null);
  const [isBroadcastsOpen, setIsBroadcastsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Memoize navigation links — only recompute when role or isPrimaryContact changes
  const links = useMemo(() => {
    const userLinks = [
      { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
      { to: '/create-ticket', icon: <PlusCircle size={20} />, label: 'Create Ticket' },
      { to: '/my-tickets', icon: <Ticket size={20} />, label: 'My Tickets' },
      ...(user?.isPrimaryContact ? [{ to: '/my-team', icon: <Users size={20} />, label: 'My Team' }] : []),
      { to: '/reviews', icon: <Star size={20} />, label: 'Reviews' },
    ];

    const consultantLinks = [
      { to: '/consultant', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
      { to: '/consultant/tickets', icon: <ClipboardList size={20} />, label: 'Assigned Tickets' },
      { to: '/create-internal-ticket', icon: <PlusCircle size={20} />, label: 'Internal Ticket' },
      { to: '/consultant/solutions', icon: <BookOpen size={20} />, label: 'Solutions' },
    ];

    const superAdminLinks = [
      { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
      { to: '/super-admin/tickets', icon: <Ticket size={20} />, label: 'Tickets' },
      { to: '/create-internal-ticket', icon: <PlusCircle size={20} />, label: 'Internal Ticket' },
      { to: '/super-admin/pre-assignment-rules', icon: <GitFork size={20} />, label: 'Routing Rules' },
      { to: '/super-admin/notifications', icon: <Radio size={20} />, label: 'Broadcasts' },
      { to: '/super-admin/solutions', icon: <BookOpen size={20} />, label: 'Solutions Directory' },
      { to: '/super-admin/client-users', icon: <Users size={20} />, label: 'Client Users' },
      { to: '/super-admin/consultants', icon: <Shield size={20} />, label: 'Consultants' },
      { to: '/super-admin/departments', icon: <Building2 size={20} />, label: 'Departments' },
      { to: '/super-admin/clients', icon: <Briefcase size={20} />, label: 'Clients' },
    ];

    if (role === 'Super Admin') return superAdminLinks;
    if (role === 'Consultant') return consultantLinks;
    return userLinks;
  }, [role, user?.isPrimaryContact]);

  // Memoize client initials — only recompute when clientName changes
  const clientInitial = useMemo(() =>
    (user?.clientName || 'Self/Internal')
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase(),
    [user?.clientName]
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside 
      className={`fixed lg:static inset-y-0 left-0 ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} w-72 border-r border-white/5 bg-[#0a0d14] h-full flex flex-col z-50 shadow-2xl overflow-hidden transition-all duration-300 ease-in-out lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      {/* Header section */}
      <div className={`h-20 flex items-center border-b border-white/5 shrink-0 transition-all duration-300 ${isCollapsed ? 'px-3 justify-between' : 'px-6 justify-between'}`}>
        <div className="flex items-center min-w-0">
          <img 
            src={logo} 
            alt="Akshay Support" 
            className={`object-contain shrink-0 transition-all duration-300 ${isCollapsed ? 'w-7 h-7' : 'w-8 h-8 mr-3'}`}
          />
          {!isCollapsed && (
            <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 truncate animate-in fade-in duration-300">
              Akshay Support
            </span>
          )}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)} 
          className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors shrink-0 hidden lg:block"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {/* Client/User Role Card */}
      <div className={`mx-4 my-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center mx-2 p-2' : 'gap-3'}`}>
        <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0 shadow-inner select-none">
          {clientInitial}
        </div>
        {!isCollapsed && (
          <div className="min-w-0 text-left">
            <div className="text-[13px] font-black text-white truncate" title={user?.clientName || 'Self/Internal'}>
              {user?.clientName || 'Self/Internal'}
            </div>
            <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-0.5 truncate">
              {user?.role || 'User'}
            </div>
          </div>
        )}
      </div>

      {/* Links List */}
      <div className={`flex-1 overflow-y-auto py-2 space-y-1 custom-scrollbar transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {!isCollapsed && (
          <div className="px-4 mb-4 text-[11px] font-black text-slate-500 uppercase tracking-widest truncate animate-in fade-in duration-300">
            Primary Console
          </div>
        )}
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/' || link.to === '/admin' || link.to === '/super-admin'}
            title={isCollapsed ? link.label : undefined}
            className={({ isActive }) => `
              relative flex items-center transition-all duration-300 group overflow-hidden mb-1 rounded-xl
              ${isCollapsed ? 'justify-center py-3 px-0 mx-1' : 'gap-3.5 px-4 py-3'}
              ${isActive 
                ? 'bg-blue-600/10 text-white font-bold' 
                : 'text-slate-400 hover:bg-white/[0.03] hover:text-white font-medium'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <div className={`${isActive ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-400'} transition-colors relative z-10 shrink-0`}>
                  {link.icon}
                </div>
                {!isCollapsed && (
                  <span className="relative z-10 text-[14px] truncate animate-in fade-in duration-300">
                    {link.label}
                  </span>
                )}
                {isActive && (
                  <motion.div 
                    layoutId="active-nav"
                    className={`absolute bg-blue-500 rounded-r-full z-10 h-full ${isCollapsed ? 'left-[-4px] w-1' : 'left-0 w-1.5'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
        {/* System Broadcasts Menu Item */}
        {['consultant', 'admin', 'clientuser', 'user'].includes(role.toLowerCase().replace(/\s+/g, '')) && (
          <div className="mb-2">
            <button
              onClick={() => setIsBroadcastsOpen(!isBroadcastsOpen)}
              className={`
                w-full relative flex items-center transition-all duration-300 group overflow-hidden rounded-xl text-left
                ${isCollapsed ? 'justify-center py-3 px-0 mx-1' : 'gap-3.5 px-4 py-3'}
                ${isBroadcastsOpen 
                  ? 'bg-blue-600/10 text-white font-bold' 
                  : 'text-slate-400 hover:bg-white/[0.03] hover:text-white font-medium'
                }
              `}
              title={isCollapsed ? "System Broadcasts" : undefined}
            >
              <div className={`${isBroadcastsOpen ? 'text-blue-500' : 'text-slate-500 group-hover:text-slate-400'} transition-colors relative z-10 shrink-0`}>
                <Radio size={20} />
              </div>
              {!isCollapsed && (
                <span className="relative z-10 text-[14px] truncate flex-1 animate-in fade-in duration-300">
                  System Broadcasts
                </span>
              )}
              {/* Badge */}
              {unreadCount > 0 && (
                <span className={`
                  font-black rounded-full border shrink-0 relative z-10 transition-all duration-300
                  ${isCollapsed 
                    ? 'absolute top-2 right-2 w-2 h-2 bg-blue-500 border-none shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse' 
                    : 'text-[9px] text-blue-400 bg-blue-500/10 border-blue-500/20 px-2 py-0.5 ml-2'
                  }
                `}>
                  {!isCollapsed && `${unreadCount} New`}
                </span>
              )}
              {isBroadcastsOpen && !isCollapsed && (
                <motion.div 
                  layoutId="active-broadcast"
                  className="absolute bg-blue-500 rounded-r-full z-10 h-full left-0 w-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
            </button>

            {/* Submenu of Broadcasts (Visible only when expanded and menu open) */}
            {!isCollapsed && isBroadcastsOpen && (
              <div className="mt-2 ml-4 pl-4 border-l border-white/5 space-y-2 py-1 pr-2 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-200">
                {notifications.length === 0 ? (
                  <p className="text-[12px] text-slate-600 italic py-1 px-1">No active broadcasts.</p>
                ) : (
                  notifications.slice(0, 3).map((notif) => {
                    const isExpanded = expandedNoticeId === notif._id;
                    return (
                      <div 
                        key={notif._id}
                        className={`p-2.5 rounded-xl border transition-all text-left ${
                          notif.read 
                            ? 'bg-white/[0.01] border-white/5' 
                            : 'bg-blue-500/[0.03] border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.04)]'
                        }`}
                      >
                        <div 
                          className="flex justify-between items-start gap-2 cursor-pointer"
                          onClick={() => {
                            if (!notif.read) markAsRead(notif._id);
                            setExpandedNoticeId(isExpanded ? null : notif._id);
                          }}
                        >
                          <div className="min-w-0">
                            <h4 className={`text-[12px] leading-snug truncate ${notif.read ? 'text-slate-300 font-medium' : 'text-white font-bold'}`}>
                              {notif.title}
                            </h4>
                            <span className="text-[9px] text-slate-500 font-bold block mt-0.5">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {!notif.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1 shadow-[0_0_8px_rgba(59,130,246,0.8)] animate-pulse" />
                          )}
                        </div>

                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-white/5 space-y-2 animate-in fade-in duration-200">
                            <p className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap font-medium">
                              {notif.message}
                            </p>
                            {notif.attachments && notif.attachments.length > 0 && (
                              <div className="space-y-1">
                                {notif.attachments.map(att => (
                                  <button
                                    key={att._id}
                                    onClick={() => downloadAttachment(notif._id, att._id, att.originalName)}
                                    className="w-full flex items-center justify-between p-1.5 bg-black/20 hover:bg-black/30 border border-white/5 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white transition-colors"
                                  >
                                    <span className="truncate pr-2">{att.originalName}</span>
                                    <Download size={10} className="shrink-0 text-blue-400" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="border-t border-white/5 p-4 space-y-4 shrink-0 bg-[#0a0d14]">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center text-slate-400 hover:text-white hover:bg-white/[0.03] rounded-xl transition-all duration-300 ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-3'}`}
          title={isCollapsed ? `${resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}` : undefined}
        >
          <div className="text-slate-500 group-hover:text-slate-400 transition-colors shrink-0">
            {resolvedTheme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </div>
          {!isCollapsed && (
            <span className="text-[14px] font-medium truncate capitalize text-left">
              {resolvedTheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </span>
          )}
        </button>

        {/* User Profile Info */}
        <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-between px-2'}`}>
          <div className="flex items-center min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-blue-500/30">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div className="ml-3 min-w-0 text-left">
                <div className="text-[13px] font-bold text-white truncate">{user?.name || 'User'}</div>
                <div className="text-[11px] font-medium text-slate-500 truncate">{user?.role || 'Role'}</div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-lg transition-colors ml-2 shrink-0"
              title="Secure Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
