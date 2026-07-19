import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, Settings, LogOut, User as UserIcon, Menu, Sun, Moon, Paperclip, Calendar, DollarSign, FileText } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useTicketStore } from '../../store/useTicketStore';
import { useNavigate } from 'react-router-dom';
import TicketViewerModal from '../ui/TicketViewerModal';
import ProfileSettingsModal from '../ui/ProfileSettingsModal';

const Navbar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const { user, logout } = useAuthStore();
  const { notifications, fetchNotifications, markAsRead, downloadAttachment } = useNotificationStore();
  
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { resolvedTheme, toggleTheme } = useThemeStore();

  const { tickets } = useTicketStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState('profile');
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return tickets.filter(t => 
      t.ticketNumber?.toLowerCase().includes(query) ||
      t.title?.toLowerCase().includes(query) ||
      t.user?.toLowerCase().includes(query)
    ).slice(0, 5);
  }, [searchQuery, tickets]);

  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Background polling for notifications
  useEffect(() => {
    if (!user) return;
    const prefs = user.preferences || {};
    const refreshSeconds = prefs.autoRefreshInterval !== undefined ? prefs.autoRefreshInterval : 4;
    
    if (refreshSeconds <= 0) return;
    
    const interval = setInterval(() => {
      fetchNotifications().catch(err => console.error('Error fetching notifications:', err));
    }, Math.max(refreshSeconds, 6) * 1000); // Poll notifications at a minimum of 6 seconds to preserve resources
    
    return () => clearInterval(interval);
  }, [fetchNotifications, user?.preferences?.autoRefreshInterval, user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    // Play sound alert if unread count increases (skip initial load)
    if (unreadCount > prevUnreadCount && prevUnreadCount > 0) {
      const prefs = user?.preferences || {};
      if (prefs.soundEnabled !== false) {
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.15);
          
          gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start();
          osc.stop(audioCtx.currentTime + 0.25);
        } catch (e) {
          console.warn('AudioContext failed:', e);
        }
      }
    }
    setPrevUnreadCount(unreadCount);
  }, [unreadCount, prevUnreadCount, user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-20 border-b border-white/5 bg-[#0a0d14] flex items-center px-4 md:px-8 justify-between sticky top-0 z-30 w-full transition-all shadow-md">
      <div className="flex-1 flex items-center gap-2 md:gap-4">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-[#181f2b]"
        >
          <Menu size={24} />
        </button>
        <div className="relative w-40 sm:w-80 max-w-md group">
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-blue-500 transition-colors z-10" />
          <input 
            type="text" 
            placeholder="Search ticket number..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
            className="w-full bg-[#111620] border border-white/5 text-sm text-white rounded-2xl pl-9 sm:pl-12 pr-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium placeholder:text-slate-600 shadow-inner relative z-10"
          />

          <AnimatePresence>
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 w-[280px] sm:w-full mt-3 bg-[#111620] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-50 backdrop-blur-xl"
              >
                <div className="px-5 py-2 border-b border-white/5 bg-white/[0.02]">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Search Results</span>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {searchResults.length === 0 ? (
                     <div className="px-5 py-6 text-center text-sm text-slate-500 font-medium">No tickets found for "{searchQuery}"</div>
                  ) : searchResults.map(ticket => (
                     <button 
                        key={ticket.id || ticket._id} 
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setSearchQuery('');
                          setIsSearchFocused(false);
                        }} 
                        className="w-full text-left p-4 border-b border-white/5 hover:bg-white/[0.05] transition-all block relative"
                     >
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="text-[13px] font-bold text-white leading-snug">{ticket.ticketNumber}</h4>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-inner ${ticket.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-400 leading-relaxed font-medium truncate">{ticket.title}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">User: {ticket.user}</p>
                     </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <motion.button 
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          onClick={toggleTheme}
          className="relative p-2.5 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-[#181f2b] border border-transparent hover:border-white/5 flex items-center justify-center w-10 h-10 overflow-hidden"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={resolvedTheme}
              initial={{ y: -20, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 20, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              {resolvedTheme === 'dark' ? (
                <Sun size={20} className="text-amber-400" />
              ) : (
                <Moon size={20} className="text-blue-600" />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.button>

        <div className="relative">
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            onClick={() => { setShowNotifications(!showNotifications); setShowProfile(false); }}
            className="relative p-2.5 text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-[#181f2b] border border-transparent hover:border-white/5"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
            )}
          </motion.button>
          
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-[-40px] sm:right-0 mt-3 w-72 sm:w-80 bg-[#111620] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-50 backdrop-blur-xl"
              >
                <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                  <h3 className="font-bold text-white text-[14px]">System Network</h3>
                  <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">{unreadCount} Active</span>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                     <div className="px-5 py-8 text-center text-sm text-slate-500 font-medium">No alerts currently circulating.</div>
                  ) : notifications.map(notif => (
                     <button key={notif._id} onClick={() => { if(!notif.read) markAsRead(notif._id); }} className={`w-full text-left p-4 border-b border-white/5 transition-all block relative bg-white/[0.01] hover:bg-white/[0.03] ${notif.read ? '' : 'bg-blue-500/[0.03]'}`}>
                        {!notif.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 pointer-events-none"></div>}
                        <h4 className={`text-[13px] ${notif.read ? 'font-medium text-slate-300' : 'font-bold text-white'} mb-1 leading-snug`}>{notif.title}</h4>
                        <p className="text-[12px] text-slate-400 leading-relaxed font-medium">{notif.message}</p>
                        {notif.attachments && notif.attachments.length > 0 && (
                           <div className="mt-3 flex flex-wrap gap-1.5 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
                             {notif.attachments.map(att => (
                               <button
                                 key={att._id}
                                 onClick={() => downloadAttachment(notif._id, att._id, att.originalName)}
                                 className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-[10px] font-bold text-blue-400 transition-colors"
                               >
                                 <Paperclip size={10} />
                                 <span className="truncate max-w-[100px]">{att.originalName}</span>
                               </button>
                             ))}
                           </div>
                        )}
                     </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative">
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
            className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-2xl hover:bg-[#181f2b] border border-transparent hover:border-white/10 transition-all"
          >
            <div className="text-right hidden md:block">
              <div className="text-[13px] font-bold text-white">{user?.name || 'User'}</div>
              <div className="text-[11px] font-bold text-blue-400 uppercase tracking-widest">{user?.role || 'User Role'}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          </motion.button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 mt-3 w-56 bg-[#111620] border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2 z-50 backdrop-blur-xl"
              >
                <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                  <p className="text-[14px] font-bold text-white">{user?.name || 'Guest'}</p>
                  <p className="text-[12px] font-medium text-slate-400 truncate">{user?.email || 'guest@example.com'}</p>
                </div>
                <div className="py-2 px-2 flex flex-col gap-1">
                  <button 
                    onClick={() => {
                      setActiveProfileTab('profile');
                      setIsProfileModalOpen(true);
                      setShowProfile(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <UserIcon size={16} /> Profile Information
                  </button>
                  <button 
                    onClick={() => {
                      setActiveProfileTab('settings');
                      setIsProfileModalOpen(true);
                      setShowProfile(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <Settings size={16} /> Dashboard Settings
                  </button>
                  {(user?.role === 'Super Admin' || user?.role === 'superadmin') && (
                    <button 
                      onClick={() => {
                        navigate('/super-admin/settings');
                        setShowProfile(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <Settings size={16} /> CC Email Settings
                    </button>
                  )}
                  {(user?.role === 'Super Admin' || user?.role === 'superadmin') && (
                    <button 
                      onClick={() => {
                        navigate('/super-admin/pricing');
                        setShowProfile(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <DollarSign size={16} className="text-emerald-400" /> Pricing Setup
                    </button>
                  )}
                  {(user?.role === 'Super Admin' || user?.role === 'superadmin') && (
                    <button 
                      onClick={() => {
                        navigate('/super-admin/reports');
                        setShowProfile(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <FileText size={16} className="text-red-400" /> System Reports
                    </button>
                  )}
                  {(user?.role === 'Super Admin' || user?.role === 'superadmin' || user?.role === 'Consultant' || user?.role === 'Admin') && (
                    <button 
                      onClick={() => {
                        navigate('/super-admin/holidays');
                        setShowProfile(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl flex items-center gap-3 transition-colors cursor-pointer"
                    >
                      <Calendar size={16} /> Holiday Master
                    </button>
                  )}
                </div>
                <div className="border-t border-white/5 py-2 px-2">
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-[13px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl flex items-center gap-3 transition-colors"
                  >
                    <LogOut size={16} /> Secure Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <TicketViewerModal 
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        initialTab={activeProfileTab}
      />
    </header>
  );
};

export default Navbar;
