import React from 'react';
import { motion } from 'framer-motion';

export const Button = React.forwardRef(({ children, variant = 'primary', isLoading, icon: Icon, className = '', ...props }, ref) => {
  const baseStyle = "relative h-11 px-6 rounded-lg font-bold text-[13px] flex items-center justify-center gap-2 transition-all overflow-hidden tracking-wide whitespace-nowrap";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] border border-white/10",
    danger: "bg-[#ef3b3b] hover:bg-red-500 text-white shadow-lg shadow-red-500/20 border border-red-400/20",
    secondary: "bg-[#242d3d] hover:bg-[#2f394d] border border-white/5 text-white shadow-md",
    ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
    outline: "bg-transparent border border-white/20 text-white hover:bg-white/5 shadow-sm"
  };

  return (
    <motion.button
      ref={ref}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyle} ${variants[variant]} ${isLoading ? 'opacity-80 pointer-events-none' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin absolute" />
      ) : null}
      <span className={`flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {Icon && <Icon size={16} />}
        {children}
      </span>
    </motion.button>
  );
});
Button.displayName = 'Button';
