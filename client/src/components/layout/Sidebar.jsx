import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, PlusCircle, Ticket, Star, 
  ClipboardList, BookOpen, Users, Shield, 
  Building2, Briefcase, Activity, Radio, GitFork, Calendar
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import logo from '../../assets/logo.png';

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen }) => {
  const user = useAuthStore(state => state.user);
  const role = user?.role || 'User';

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
    { to: '/consultant/solutions', icon: <BookOpen size={20} />, label: 'Solutions' },
  ];

  const superAdminLinks = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { to: '/super-admin/tickets', icon: <Ticket size={20} />, label: 'Tickets' },
    { to: '/super-admin/pre-assignment-rules', icon: <GitFork size={20} />, label: 'Routing Rules' },
    { to: '/super-admin/notifications', icon: <Radio size={20} />, label: 'Broadcasts' },
    { to: '/super-admin/solutions', icon: <BookOpen size={20} />, label: 'Solutions Directory' },
    { to: '/super-admin/client-users', icon: <Users size={20} />, label: 'Client Users' },
    { to: '/super-admin/consultants', icon: <Shield size={20} />, label: 'Consultants' },
    { to: '/super-admin/departments', icon: <Building2 size={20} />, label: 'Departments' },
    { to: '/super-admin/clients', icon: <Briefcase size={20} />, label: 'Clients' },
  ];

  const links = role === 'Super Admin' ? superAdminLinks : role === 'Consultant' ? consultantLinks : userLinks;

  return (
    <motion.aside 
      className={`fixed lg:static inset-y-0 left-0 w-72 border-r border-white/5 bg-[#0a0d14] h-full flex flex-col z-50 shadow-2xl overflow-hidden transition-transform duration-300 ease-out lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="h-20 flex items-center px-8 border-b border-white/5 shrink-0">
        <img 
          src={logo} 
          alt="Akshay Support" 
          className="w-8 h-8 object-contain mr-3 shrink-0"
        />
        <span className="font-black text-xl text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 truncate">
          Akshay Support
        </span>
      </div>
      <div className="flex-1 overflow-y-auto py-8 px-4 space-y-1 custom-scrollbar">
        <div className="px-4 mb-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">
          Primary Console
        </div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/' || link.to === '/admin' || link.to === '/super-admin'}
            className={({ isActive }) => `
              relative flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden mb-1
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
                <span className="relative z-10 text-[14px] truncate">{link.label}</span>
                {isActive && (
                  <motion.div 
                    layoutId="active-nav"
                    className="absolute left-0 w-1.5 h-full bg-blue-500 rounded-r-full z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
