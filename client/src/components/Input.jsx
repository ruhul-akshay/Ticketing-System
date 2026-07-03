import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = React.forwardRef(({ label, icon: Icon, error, type = 'text', className = '', containerClassName = '', ...props }, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`space-y-1.5 w-full ${containerClassName}`}>
      {label && <label className="text-[12px] font-bold text-slate-400 uppercase tracking-widest block mb-2">{label}</label>}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-4 z-10 text-slate-500 pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input 
          ref={ref}
          type={inputType}
          className={`w-full h-12 bg-[#1d2633] border border-white/5 focus:border-blue-500/50 rounded-xl ${Icon ? 'pl-11' : 'pl-4'} ${isPassword ? 'pr-11' : 'pr-4'} text-sm text-white placeholder:text-slate-500 outline-none transition-all shadow-inner relative z-0 ${error ? 'border-red-500/50 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20' : 'focus:ring-1 focus:ring-blue-500/20'} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 text-slate-500 hover:text-white transition-colors flex items-center justify-center p-1 z-10 focus:outline-none"
            tabIndex="-1"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-red-400 text-[11px] font-semibold mt-1.5">{error}</p>}
    </div>
  );
});
Input.displayName = 'Input';
