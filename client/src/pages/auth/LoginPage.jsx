import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../core/store/useAuthStore';
import Background3D from './Background3D';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import logoImg from '../../assets/logo.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    const success = await login(email, password);
    if (success) {
      // Use useAuthStore.getState() to get the most fresh user data
      const user = useAuthStore.getState().user;
      const role = (user?.role || '').toLowerCase();
      
      if (role === 'admin') navigate('/admin');
      else if (role === 'super admin' || role === 'superadmin') navigate('/super-admin/tickets');
      else navigate('/');
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center relative bg-[#020617] overflow-hidden font-sans">
      <Background3D />
      
      {/* Decorative background glow behind the card for visual depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10 mx-6 filter drop-shadow-2xl"
      >
        <div className="bg-[#111620]/80 backdrop-blur-2xl p-10 sm:p-12 rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 20 }}
              className="w-24 h-24 mx-auto mb-6 flex items-center justify-center"
            >
              <img src={logoImg} alt="Logo" className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
            </motion.div>
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400 text-sm font-medium">Log into your secure dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-[13px] font-semibold text-center overflow-hidden flex items-center justify-center gap-2"
                >
                  <span className="text-red-500">⚠️</span> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <Input 
              label="Email Address"
              type="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
            
            <div className="space-y-2">
              <Input 
                label="Password"
                type="password"
                icon={Lock}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="pt-6">
              <Button 
                type="submit" 
                variant="primary" 
                className="w-full h-14 text-[15px]" 
                isLoading={isLoading}
              >
                Sign In <ArrowRight size={18} className="ml-1" />
              </Button>
            </div>
          </form>
        </div>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-slate-500 text-[11px] font-medium mt-8 tracking-wide uppercase"
        >
          By signing in, you agree to our Terms of Service.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
