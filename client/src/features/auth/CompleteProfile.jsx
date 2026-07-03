import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, Briefcase, ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { useAuthStore } from "../../store/useAuthStore";
import Background3D from "./Background3D";
import logoImg from "../../assets/logo.png";

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, needsProfileCompletion, completeProfile, isLoading, error } = useAuthStore();

  const [name, setName] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [position, setPosition] = useState(user?.position || "");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (isAuthenticated && !needsProfileCompletion) {
      navigate("/");
    }
  }, [isAuthenticated, needsProfileCompletion, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const success = await completeProfile({ name, phoneNumber, position });
    if (success) {
      setDone(true);
      setTimeout(() => navigate("/"), 1800);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center relative bg-[#020617] overflow-hidden font-sans">
      <Background3D />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[480px] relative z-10 mx-6"
      >
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#111620]/90 backdrop-blur-2xl p-12 rounded-[2rem] border border-white/10 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
                className="w-20 h-20 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center"
              >
                <CheckCircle size={40} className="text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Profile Complete!</h2>
              <p className="text-slate-400 text-sm">Taking you to your dashboard...</p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111620]/80 backdrop-blur-2xl rounded-[2rem] border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-blue-500 to-indigo-600" />
              <div className="p-10 sm:p-12">
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
                    className="w-16 h-16 mx-auto mb-4 flex items-center justify-center"
                  >
                    <img src={logoImg} alt="Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(139,92,246,0.4)]" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-4"
                  >
                    <Sparkles size={13} className="text-violet-400" />
                    <span className="text-xs font-semibold text-violet-300 tracking-wide uppercase">First Login</span>
                  </motion.div>
                  <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Complete Your Profile</h1>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Welcome! Please fill in your details to get started.
                  </p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        required
                        className="w-full bg-[#1a2234] border border-white/8 text-white rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all font-medium placeholder:text-slate-600 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Phone Number <span className="text-slate-600 font-normal normal-case">(optional)</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full bg-[#1a2234] border border-white/8 text-white rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all font-medium placeholder:text-slate-600 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Job Title / Position <span className="text-slate-600 font-normal normal-case">(optional)</span>
                    </label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        placeholder="e.g. Finance Manager"
                        className="w-full bg-[#1a2234] border border-white/8 text-white rounded-xl pl-11 pr-4 py-3.5 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/20 transition-all font-medium placeholder:text-slate-600 text-sm"
                      />
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading || !name.trim()}
                    className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white rounded-xl py-4 font-bold text-[14px] flex items-center justify-center gap-2.5 transition-all shadow-[0_0_24px_rgba(139,92,246,0.3)] disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                  >
                    {isLoading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Get Started <ArrowRight size={18} /></>
                    )}
                  </motion.button>
                </form>

                <p className="text-center text-xs text-slate-600 mt-6 leading-relaxed">
                  You can update these details anytime from your profile settings.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;