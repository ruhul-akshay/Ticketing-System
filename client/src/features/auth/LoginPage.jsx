import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowRight, Sun, Moon, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, AlertTriangle, Clock, X, Loader2 } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import Background3D from './Background3D';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import logoImg from '../../assets/logo.png';

/* ── view keys ─────────────────────────────── */
const VIEW_LOGIN  = 'login';
const VIEW_FORGOT = 'forgot';

/* ── error visual helper (high contrast for both light & dark themes) ───────────────────── */
const getErrorConfig = (type, status) => {
  switch (type) {
    case 'server':
      return {
        icon: AlertTriangle,
        badge: status ? `Server (${status})` : 'Server Error',
        badgeBg: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30',
        container: 'bg-rose-50 text-rose-950 border-rose-300 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-500/40',
        iconColor: 'text-rose-700 dark:text-rose-400',
      };
    case 'network':
    case 'timeout':
      return {
        icon: AlertCircle,
        badge: type === 'timeout' ? 'Timeout' : 'Network',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
        container: 'bg-amber-50 text-amber-950 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-500/40',
        iconColor: 'text-amber-700 dark:text-amber-400',
      };
    case 'rate_limit':
      return {
        icon: Clock,
        badge: 'Rate Limited',
        badgeBg: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
        container: 'bg-orange-50 text-orange-950 border-orange-300 dark:bg-orange-950/50 dark:text-orange-200 dark:border-orange-500/40',
        iconColor: 'text-orange-700 dark:text-orange-400',
      };
    case 'forbidden':
      return {
        icon: AlertCircle,
        badge: 'Access Denied',
        badgeBg: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
        container: 'bg-amber-50 text-amber-950 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-500/40',
        iconColor: 'text-amber-700 dark:text-amber-400',
      };
    case 'not_found':
      return {
        icon: Mail,
        badge: 'Not Found',
        badgeBg: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
        container: 'bg-purple-50 text-purple-950 border-purple-300 dark:bg-purple-950/50 dark:text-purple-200 dark:border-purple-500/40',
        iconColor: 'text-purple-700 dark:text-purple-400',
      };
    case 'credentials':
    default:
      return {
        icon: KeyRound,
        badge: 'Failed',
        badgeBg: 'bg-red-100 text-red-900 border-red-300 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
        container: 'bg-red-50 text-red-950 border-red-300 dark:bg-red-950/50 dark:text-red-200 dark:border-red-500/40',
        iconColor: 'text-red-700 dark:text-red-400',
      };
  }
};

const LoginPage = () => {
  const navigate = useNavigate();
  const {
    login, isLoading, error, errorType, errorStatus, clearError,
    isAuthenticated, user, needsProfileCompletion,
    forgotPassword, clearResetState,
    isResetting, resetError, resetErrorType, resetSuccess,
  } = useAuthStore();

  const [view,     setView]     = useState(VIEW_LOGIN);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  const { resolvedTheme, toggleTheme } = useThemeStore();

  /* auto-redirect if already authenticated */
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const role = (user.role || '').toLowerCase();
      if (role === 'consultant') navigate('/consultant');
      else navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  /* clean up reset state whenever we leave/enter the forgot panel */
  const openForgot = () => {
    clearResetState();
    setResetEmail('');
    setView(VIEW_FORGOT);
  };

  const backToLogin = () => {
    clearResetState();
    setView(VIEW_LOGIN);
  };

  /* ── login handler ─────────────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    const success = await login(email, password);
    if (success) {
      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) { navigate(redirectUrl); return; }

      const freshState   = useAuthStore.getState();
      const loggedInUser = freshState.user;
      const role         = (loggedInUser?.role || '').toLowerCase();

      if (freshState.needsProfileCompletion) { navigate('/complete-profile'); return; }
      if (role === 'consultant') navigate('/consultant');
      else navigate('/');
    }
  };

  /* ── forgot-password handler ───────────── */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) return;
    await forgotPassword(resetEmail);
  };

  /* ── shared card animation props ──────── */
  const cardVariants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -20 },
  };

  return (
    <div className="h-screen w-full flex items-center justify-center relative bg-[#020617] overflow-hidden font-sans">
      <Background3D />

      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl border border-white/10 transition-all flex items-center justify-center shadow-lg"
          aria-label="Toggle Theme"
        >
          {resolvedTheme === 'dark'
            ? <Sun  size={20} className="text-amber-400" />
            : <Moon size={20} className="text-blue-600"  />}
        </motion.button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[440px] relative z-10 mx-6 filter drop-shadow-2xl"
      >
        {/* ════════════════ CARD ════════════════ */}
        <div className="bg-[#111620]/80 backdrop-blur-2xl p-10 sm:p-12 rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">

          {/* Logo + Title — always visible */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
              className="w-20 h-20 mx-auto mb-5 flex items-center justify-center"
            >
              <img
                src={logoImg}
                alt="Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              />
            </motion.div>

            <AnimatePresence mode="wait">
              {view === VIEW_LOGIN ? (
                <motion.div key="login-title" {...cardVariants} transition={{ duration: 0.35 }}>
                  <h2 className="text-3xl font-bold tracking-tight text-white mb-1">Welcome Back</h2>
                  <p className="text-slate-400 text-sm font-medium">Log into your secure dashboard</p>
                </motion.div>
              ) : (
                <motion.div key="forgot-title" {...cardVariants} transition={{ duration: 0.35 }}>
                  <h2 className="text-3xl font-bold tracking-tight text-white mb-1">Forgot Password?</h2>
                  <p className="text-slate-400 text-sm font-medium">We'll send a temporary password to your email</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── LOGIN FORM ────────────────────── */}
          <AnimatePresence mode="wait">
            {view === VIEW_LOGIN && (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                <form onSubmit={handleLogin} className="space-y-5">
                  {/* Error banner */}
                  <AnimatePresence mode="wait">
                    {error && (() => {
                      const config = getErrorConfig(errorType, errorStatus);
                      const IconComp = config.icon;

                      return (
                        <motion.div
                          initial={{ opacity: 0, height: 0, scale: 0.96 }}
                          animate={{ opacity: 1, height: 'auto', scale: 1 }}
                          exit={{ opacity: 0, height: 0, scale: 0.96 }}
                          transition={{ duration: 0.2, ease: 'easeOut' }}
                          className={`border rounded-xl px-3.5 py-2.5 shadow-sm overflow-hidden flex items-center justify-between gap-2.5 ${config.container}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <IconComp size={16} className={`${config.iconColor} shrink-0`} />
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${config.badgeBg} shrink-0`}>
                                {config.badge}
                              </span>
                              <span className="font-semibold text-[12px] leading-tight">
                                {error}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={clearError}
                            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                            title="Dismiss"
                          >
                            <X size={14} />
                          </button>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>

                  <Input
                    label="Email Address"
                    type="email"
                    icon={Mail}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) clearError();
                    }}
                    placeholder="name@client.com"
                    required
                  />

                  <div className="space-y-2">
                    <Input
                      label="Password"
                      type="password"
                      icon={Lock}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) clearError();
                      }}
                      placeholder="••••••••"
                      required
                    />

                    {/* Forgot password link */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        id="forgot-password-link"
                        onClick={openForgot}
                        className="text-[12px] text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-150 focus:outline-none focus:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <div className="pt-3">
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
              </motion.div>
            )}

            {/* ── FORGOT PASSWORD PANEL ─────────── */}
            {view === VIEW_FORGOT && (
              <motion.div
                key="forgot-form"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {/* Success state */}
                <AnimatePresence mode="wait">
                  {resetSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, type: 'spring', stiffness: 180, damping: 18 }}
                      className="flex flex-col items-center text-center gap-4 py-4"
                    >
                      {/* Animated checkmark ring */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 16 }}
                        className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center"
                      >
                        <CheckCircle2 size={32} className="text-emerald-400" />
                      </motion.div>

                      <div>
                        <h3 className="text-white font-bold text-lg mb-1">Email Sent!</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          A temporary password has been sent to<br />
                          <span className="text-blue-400 font-semibold">{resetEmail}</span>.<br />
                          Please check your inbox and use it to log in.
                        </p>
                      </div>

                      <button
                        type="button"
                        id="back-to-login-after-success"
                        onClick={backToLogin}
                        className="mt-2 w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-[14px] font-semibold transition-all duration-200"
                      >
                        <ArrowLeft size={16} />
                        Back to Login
                      </button>
                    </motion.div>
                  ) : (
                    /* Input form state */
                    <motion.form
                      key="forgot-input"
                      onSubmit={handleForgotPassword}
                      className="space-y-5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {/* Error banner */}
                      <AnimatePresence mode="wait">
                        {resetError && (() => {
                          const config = getErrorConfig(resetErrorType, null);
                          const IconComp = config.icon;

                          return (
                            <motion.div
                              initial={{ opacity: 0, height: 0, scale: 0.96 }}
                              animate={{ opacity: 1, height: 'auto', scale: 1 }}
                              exit={{ opacity: 0, height: 0, scale: 0.96 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                              className={`border rounded-xl px-3.5 py-2.5 shadow-sm overflow-hidden flex items-center justify-between gap-2.5 ${config.container}`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <IconComp size={16} className={`${config.iconColor} shrink-0`} />
                                <div className="flex flex-wrap items-center gap-1.5 min-w-0 flex-1">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${config.badgeBg} shrink-0`}>
                                    {config.badge}
                                  </span>
                                  <span className="font-semibold text-[12px] leading-tight">
                                    {resetError}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={clearResetState}
                                className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
                                title="Dismiss"
                              >
                                <X size={14} />
                              </button>
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>

                      <Input
                        label="Registered Email Address"
                        type="email"
                        icon={Mail}
                        value={resetEmail}
                        onChange={(e) => {
                          setResetEmail(e.target.value);
                          if (resetError) clearResetState();
                        }}
                        placeholder="name@client.com"
                        required
                        id="forgot-email-input"
                      />

                      <p className="text-[12px] text-slate-500 leading-relaxed -mt-1">
                        Enter the email linked to your account. A temporary password will be sent immediately.
                      </p>

                      {/* Send button */}
                      <button
                        id="send-temp-password-btn"
                        type="submit"
                        disabled={isResetting || !resetEmail}
                        className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl font-bold text-[15px] transition-all duration-200
                          bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400
                          text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] hover:shadow-[0_6px_28px_rgba(59,130,246,0.5)]
                          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                      >
                        {isResetting ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Sending&hellip;
                          </>
                        ) : (
                          <>
                            <KeyRound size={18} />
                            Send Temporary Password
                          </>
                        )}
                      </button>

                      {/* Back link */}
                      <button
                        type="button"
                        id="back-to-login-btn"
                        onClick={backToLogin}
                        className="w-full flex items-center justify-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-200 font-medium transition-colors duration-150 focus:outline-none"
                      >
                        <ArrowLeft size={14} />
                        Back to Login
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
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
