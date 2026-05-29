import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizeClass = size === 'xl' ? 'max-w-4xl' : size === 'lg' ? 'max-w-2xl' : 'max-w-md';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md" />
        
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className={`bg-[#111620] border border-white/10 w-full ${sizeClass} rounded-[2rem] shadow-[0_0_80px_rgba(237,27,47,0.2)] relative z-10 flex flex-col overflow-hidden max-h-[90vh]`}>
          <div className="px-8 py-6 border-b border-white/5 bg-[#181f2b]/50 backdrop-blur-xl flex justify-between items-center sticky top-0 z-20">
            <h2 className="text-2xl font-black text-white tracking-tight">{title}</h2>
            <button type="button" onClick={onClose} className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors border border-white/5"><X size={20} /></button>
          </div>

          <div className="p-8 overflow-y-auto relative custom-scrollbar flex-1">
            {children}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default Modal;
