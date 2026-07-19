import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Settings, Key, Mail, Phone, Shield, Building, Tag, Save, AlertCircle, Check, Volume2, VolumeX, RefreshCw, Sun, Moon, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import api from '../../api/mockAxios';

export default function ProfileSettingsModal({ isOpen, onClose, initialTab = 'profile' }) {
  const { user, updateUserProfile, updatePreferences, isLoading } = useAuthStore();
  const { 
    previewTheme,
    previewPrimaryColor,
    previewAccentColor,
    setPreviewTheme,
    setPreviewPrimaryColor,
    setPreviewAccentColor,
    savePreferences,
    cancelPreview
  } = useThemeStore();
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const isConsultant = user?.role === 'Consultant' || user?.role === 'Admin';

  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');

  const handleClose = () => {
    cancelPreview();
    onClose();
  };
  
  // Profile form state
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [position, setPosition] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Password form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Settings preferences state
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(4);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Sync state when modal opens or user changes
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setPhoneNumber(user.phoneNumber || '');
      setPosition(user.position || '');
      
      const formatDate = (dateVal) => {
        if (!dateVal) return '';
        try {
          return new Date(dateVal).toISOString().split('T')[0];
        } catch (e) {
          return '';
        }
      };
      setLeaveFrom(formatDate(user.leaveFrom));
      setLeaveTo(formatDate(user.leaveTo));
      
      const prefs = user.preferences || {};
      setSoundEnabled(prefs.soundEnabled !== false);
      setEmailNotifications(prefs.emailNotifications !== false);
      setAutoRefreshInterval(prefs.autoRefreshInterval !== undefined ? prefs.autoRefreshInterval : 4);
      
      // Clear alerts
      setProfileSuccess(false);
      setProfileError('');
      setPasswordSuccess(false);
      setPasswordError('');
      setSettingsSuccess(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen || !user) return null;

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess(false);
    setProfileError('');

    if (!name.trim()) return setProfileError('Name is required');

    const success = await updateUserProfile({ 
      name, 
      phoneNumber, 
      position,
      leaveFrom: leaveFrom || null,
      leaveTo: leaveTo || null
    });
    if (success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } else {
      setProfileError('Failed to update profile information.');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess(false);
    setPasswordError('');

    if (!currentPassword) return setPasswordError('Current password is required');
    if (newPassword.length < 6) return setPasswordError('New password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setPasswordError('Passwords do not match');

    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordSuccess(false);
        setShowPasswordForm(false);
      }, 3000);
    } catch (err) {
      console.error(err);
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsSuccess(false);

    // Save preferences locally first
    const saved = savePreferences();

    const success = await updatePreferences({
      theme: saved.theme,
      primaryColor: saved.primaryColor,
      accentColor: saved.accentColor,
      soundEnabled,
      emailNotifications,
      autoRefreshInterval
    });

    if (success) {
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4 font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
          className="bg-[#111620] border border-white/10 w-full max-w-lg rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden relative z-10 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/5 bg-[#181f2b]/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-[#ED1B2F] flex items-center justify-center shadow-lg text-white">
                {activeTab === 'profile' ? <User size={20} /> : <Settings size={20} />}
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight leading-tight">
                  {activeTab === 'profile' ? 'Profile Information' : 'Dashboard Settings'}
                </h2>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                  Manage your account & experience
                </p>
              </div>
            </div>
            <button 
              onClick={handleClose}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors border border-white/5 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 pt-4 flex gap-2 bg-[#181f2b]/20 border-b border-white/5">
            <button
              onClick={() => setActiveTab('profile')}
              className={`pb-3 px-4 text-[12px] font-black uppercase tracking-wider relative transition-all ${
                activeTab === 'profile' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Profile
              {activeTab === 'profile' && (
                <motion.div 
                  layoutId="activeTabUnderline" 
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-[#ED1B2F] rounded-t-full"
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-3 px-4 text-[12px] font-black uppercase tracking-wider relative transition-all ${
                activeTab === 'settings' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Preferences
              {activeTab === 'settings' && (
                <motion.div 
                  layoutId="activeTabUnderline" 
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-[#ED1B2F] rounded-t-full"
                />
              )}
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
            <AnimatePresence mode="wait">
              {activeTab === 'profile' ? (
                <motion.form
                  key="profile-tab"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  onSubmit={handleProfileSubmit}
                  className="space-y-5"
                >
                  {profileSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-[12px] font-bold flex items-center gap-2">
                      <Check size={14} /> Profile details updated successfully!
                    </div>
                  )}
                  {profileError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[12px] font-bold flex items-center gap-2">
                      <AlertCircle size={14} /> {profileError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Full Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-[#1d2633]/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-white text-[13px] font-bold focus:outline-none focus:border-red-500/40 shadow-inner w-full"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Phone Number</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="bg-[#1d2633]/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-white text-[13px] font-bold focus:outline-none focus:border-red-500/40 shadow-inner w-full"
                        placeholder="e.g. +91 99999 88888"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-0.5">Position / Title</label>
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="bg-[#1d2633]/60 border border-white/5 rounded-xl px-3.5 py-2.5 text-white text-[13px] font-bold focus:outline-none focus:border-red-500/40 shadow-inner w-full"
                        placeholder="e.g. Support Specialist"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-0.5">Email Address (Locked)</label>
                      <div className="bg-[#1d2633]/20 border border-white/5 rounded-xl px-3.5 py-2.5 text-slate-500 text-[13px] font-bold flex items-center gap-2 select-none">
                        <Mail size={13} /> {user.email}
                      </div>
                    </div>
                  </div>

                  {isConsultant && (
                    <div className="bg-[#181f2b]/40 border border-white/5 p-4.5 rounded-2xl space-y-4">
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-1.5"><Calendar size={13} className="text-yellow-500" /> Operational Leave settings</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                          Mark yourself as temporarily On Leave. During this period, the system will not assign you new tickets automatically or manually.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Leave From</label>
                          <input
                            type="date"
                            value={leaveFrom}
                            onChange={(e) => setLeaveFrom(e.target.value)}
                            className="bg-black/30 border border-white/5 rounded-xl px-3.5 py-2 text-white text-[13px] focus:outline-none focus:border-red-500/40 shadow-inner w-full"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Leave To</label>
                          <input
                            type="date"
                            value={leaveTo}
                            onChange={(e) => setLeaveTo(e.target.value)}
                            className="bg-black/30 border border-white/5 rounded-xl px-3.5 py-2 text-white text-[13px] focus:outline-none focus:border-red-500/40 shadow-inner w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Read-Only Account Metadata */}
                  <div className="bg-[#181f2b]/40 border border-white/5 p-4 rounded-xl space-y-2.5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Shield size={12} /> Account Specifications</h4>
                    <div className="grid grid-cols-2 gap-3 text-[12px] font-bold text-slate-300">
                      <div className="flex items-center gap-1.5 truncate">
                        <Tag size={12} className="text-slate-500 shrink-0" />
                        <span className="text-slate-500">Role:</span> <span className="text-slate-200">{user.role}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <Building size={12} className="text-slate-500 shrink-0" />
                        <span className="text-slate-500">Client:</span> <span className="text-slate-200" title={user.clientName || 'Self/Internal'}>{user.clientName || 'Self/Internal'}</span>
                      </div>
                      {user.department?.name && (
                        <div className="flex items-center gap-1.5 truncate col-span-2">
                          <Building size={12} className="text-slate-500 shrink-0" />
                          <span className="text-slate-500">Department:</span> <span className="text-slate-200">{user.department.name}</span>
                        </div>
                      )}
                      {user.employeeCode && (
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-slate-500">Employee ID:</span> <span className="text-slate-200">{user.employeeCode}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Save Profile */}
                  <div className="flex justify-end border-b border-white/5 pb-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-[#ED1B2F] hover:from-red-500 hover:to-red-400 rounded-xl text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-red-600/10 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Save size={13} /> {isLoading ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>

                  {/* Password Change Trigger Section */}
                  <div className="pt-2">
                    {!showPasswordForm ? (
                      <button
                        type="button"
                        onClick={() => setShowPasswordForm(true)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-xl text-slate-300 hover:text-white text-[12px] font-black uppercase tracking-wider hover:bg-white/10 transition-all cursor-pointer"
                      >
                        <Key size={14} /> Request Password Shift
                      </button>
                    ) : (
                      <div className="bg-[#181f2b]/40 border border-white/5 p-5 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-1.5"><Key size={13} className="text-red-500" /> Change Password</h4>
                          <button
                            type="button"
                            onClick={() => setShowPasswordForm(false)}
                            className="text-slate-500 hover:text-white text-[11px] font-bold cursor-pointer"
                          >
                            Hide
                          </button>
                        </div>

                        {passwordSuccess && (
                          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                            <Check size={13} /> Password changed successfully!
                          </div>
                        )}
                        {passwordError && (
                          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                            <AlertCircle size={13} /> {passwordError}
                          </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Current Password</label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="bg-black/30 border border-white/5 rounded-xl px-3.5 py-2 text-white text-[13px] focus:outline-none focus:border-red-500/40 shadow-inner w-full"
                            placeholder="Enter current password"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">New Password</label>
                            <input
                              type="password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className="bg-black/30 border border-white/5 rounded-xl px-3.5 py-2 text-white text-[13px] focus:outline-none focus:border-red-500/40 shadow-inner w-full"
                              placeholder="Min 6 characters"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Confirm Password</label>
                            <input
                              type="password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className="bg-black/30 border border-white/5 rounded-xl px-3.5 py-2 text-white text-[13px] focus:outline-none focus:border-red-500/40 shadow-inner w-full"
                              placeholder="Confirm new password"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handlePasswordSubmit}
                            disabled={passwordLoading}
                            className="px-4 py-2 bg-white text-slate-900 font-bold hover:bg-slate-200 rounded-xl text-[11px] uppercase tracking-widest disabled:opacity-50 transition-all cursor-pointer"
                          >
                            {passwordLoading ? 'Shifting...' : 'Apply Shift'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.form>
              ) : (
                <motion.form
                  key="settings-tab"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  onSubmit={handleSettingsSubmit}
                  className="space-y-6"
                >
                  {settingsSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-[12px] font-bold flex items-center gap-2">
                      <Check size={14} /> Preferences updated successfully!
                    </div>
                  )}

                  {/* Theme Mode Selector */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[12px] font-black text-white uppercase tracking-wider mb-1">Core Theme Mode</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Select your dashboard core aesthetic theme style.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setPreviewTheme('light')}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          previewTheme === 'light'
                            ? 'bg-blue-600/10 border-blue-500/40 text-white shadow-lg shadow-blue-500/5'
                            : 'bg-[#181f2b]/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Sun size={18} className={previewTheme === 'light' ? 'text-amber-400 animate-pulse' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Light</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTheme('dark')}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          previewTheme === 'dark'
                            ? 'bg-blue-600/10 border-blue-500/40 text-white shadow-lg shadow-blue-500/5'
                            : 'bg-[#181f2b]/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Moon size={18} className={previewTheme === 'dark' ? 'text-blue-400' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Dark</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTheme('system')}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all cursor-pointer ${
                          previewTheme === 'system'
                            ? 'bg-blue-600/10 border-blue-500/40 text-white shadow-lg shadow-blue-500/5'
                            : 'bg-[#181f2b]/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Shield size={18} className={previewTheme === 'system' ? 'text-indigo-400' : ''} />
                        <span className="text-[10px] font-black uppercase tracking-wider">System</span>
                      </button>
                    </div>
                  </div>

                  {/* Primary UI Color Selection */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[12px] font-black text-white uppercase tracking-wider mb-1">Primary UI Brand Color</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Select a gradient palette for primary buttons and active indicators.</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { key: 'indigo', name: 'Indigo Blue', from: '#2563eb', to: '#4f46e5' },
                        { key: 'red', name: 'Red Alert', from: '#dc2626', to: '#f97316' },
                        { key: 'emerald', name: 'Emerald', from: '#059669', to: '#14b8a6' },
                        { key: 'purple', name: 'Royal Purple', from: '#7c3aed', to: '#d946ef' },
                        { key: 'cyberpunk', name: 'Cyberpunk', from: '#ec4899', to: '#06b6d4' },
                        { key: 'slate', name: 'Slate Gray', from: '#334155', to: '#64748b' }
                      ].map((col) => (
                        <button
                          key={col.key}
                          type="button"
                          onClick={() => setPreviewPrimaryColor(col.key)}
                          className={`p-2.5 rounded-2xl border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                            previewPrimaryColor === col.key
                              ? 'bg-white/5 border-white/20 text-white shadow-lg'
                              : 'bg-[#181f2b]/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${col.from}, ${col.to})` }}
                          />
                          <span className="text-[10px] font-bold truncate">{col.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accent Color Selection */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-[12px] font-black text-white uppercase tracking-wider mb-1">Accent UI Highlight Color</h4>
                      <p className="text-[10px] text-slate-500 font-medium">Select a color style for visual notifications, highlights, and borders.</p>
                    </div>

                    <div className="grid grid-cols-6 gap-2">
                      {[
                        { key: 'blue', name: 'Blue', color: '#3b82f6' },
                        { key: 'emerald', name: 'Emerald', color: '#10b981' },
                        { key: 'purple', name: 'Purple', color: '#8b5cf6' },
                        { key: 'amber', name: 'Amber', color: '#f59e0b' },
                        { key: 'rose', name: 'Rose', color: '#f43f5e' },
                        { key: 'indigo', name: 'Indigo', color: '#6366f1' }
                      ].map((acc) => (
                        <button
                          key={acc.key}
                          type="button"
                          onClick={() => setPreviewAccentColor(acc.key)}
                          className={`p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                            previewAccentColor === acc.key
                              ? 'bg-white/5 border-white/25 text-white'
                              : 'bg-[#181f2b]/40 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                          title={acc.name}
                        >
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0"
                            style={{ backgroundColor: acc.color }}
                          />
                          <span className="text-[8px] font-black uppercase tracking-wider">{acc.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sound & Notifications preferences */}
                  <div className="space-y-4 bg-[#181f2b]/30 p-5 rounded-2xl border border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[12px] font-black text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          {soundEnabled ? <Volume2 size={14} className="text-red-500" /> : <VolumeX size={14} className="text-slate-500" />}
                          Sound Notifications
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">Trigger clean audio cues when notifications are received.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={soundEnabled}
                          onChange={(e) => setSoundEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-4">
                      <div>
                        <h4 className="text-[12px] font-black text-white uppercase tracking-wider mb-1">
                          Email Notifications
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">Receive message streams & ticket alerts via email.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600 peer-checked:after:bg-white"></div>
                      </label>
                    </div>
                  </div>

                  {/* Auto-Refresh Ticketing preferences */}
                  <div className="space-y-3 bg-[#181f2b]/30 p-5 rounded-2xl border border-white/5">
                    <div>
                      <h4 className="text-[12px] font-black text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <RefreshCw size={14} className="text-red-500 animate-spin-slow" />
                        Ticket Refresh Cadence
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">Configure background auto-refresh timing intervals.</p>
                    </div>
                    
                    <select
                      value={autoRefreshInterval}
                      onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                      className="bg-black/30 border border-white/5 rounded-xl px-3.5 py-2.5 text-white text-[13px] font-bold focus:outline-none focus:border-red-500/40 shadow-inner w-full cursor-pointer"
                    >
                      <option value={4}>4 Seconds (Fast Stream)</option>
                      <option value={10}>10 Seconds</option>
                      <option value={30}>30 Seconds</option>
                      <option value={60}>60 Seconds</option>
                      <option value={0}>Disable Polling</option>
                    </select>
                  </div>

                  {/* Action Save Preferences */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-[#ED1B2F] hover:from-red-500 hover:to-red-400 rounded-xl text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-red-600/10 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Save size={13} /> Apply Preferences
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-white/5 bg-[#181f2b]/50 flex justify-end gap-3">
            <button 
              onClick={handleClose}
              className="px-5 py-2 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-[12px] font-bold cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
