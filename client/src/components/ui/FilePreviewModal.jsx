import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { File, Download, X } from 'lucide-react';
import { parseCSV } from '../../utils/ticketHelpers';

function CSVTableRenderer({ textContent }) {
  const rows = parseCSV(textContent);
  if (!rows || rows.length === 0) {
    return <p className="text-slate-500 italic p-6">Empty CSV file</p>;
  }

  return (
    <div className="w-full h-full overflow-auto bg-[#0b0f19] border border-white/5 rounded-2xl custom-scrollbar shadow-inner text-left">
      <table className="w-full border-collapse text-[13px]">
        <thead className="sticky top-0 z-10 border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
          <tr>
            {rows[0].map((cell, idx) => (
              <th
                key={idx}
                className="p-4 text-left whitespace-nowrap border-r border-white/5 bg-[#181f2b] text-slate-300"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-slate-300">
          {rows.slice(1).map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className="p-4 min-w-[150px] whitespace-normal break-words border-r border-white/5"
                  title={cell}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExcelTableRenderer({ excelData }) {
  if (!excelData || excelData.length === 0) {
    return <p className="text-slate-500 italic p-6">Empty Excel sheet</p>;
  }

  return (
    <div className="w-full h-full overflow-auto bg-[#0b0f19] border border-white/5 rounded-2xl custom-scrollbar shadow-inner text-left">
      <table className="w-full border-collapse text-[13px]">
        <thead className="sticky top-0 z-10 border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
          <tr>
            {excelData[0].map((cell, idx) => (
              <th
                key={idx}
                className="p-4 text-left whitespace-nowrap border-r border-white/5 bg-[#181f2b] text-slate-300"
              >
                {cell !== undefined && cell !== null ? String(cell) : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-slate-300">
          {excelData.slice(1).map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className="p-4 min-w-[150px] whitespace-normal break-words border-r border-white/5"
                  title={cell !== undefined && cell !== null ? String(cell) : ''}
                >
                  {cell !== undefined && cell !== null ? String(cell) : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function FilePreviewModal({ previewFile, onClose }) {
  if (!previewFile) return null;

  const handleDownload = () => {
    try {
      const a = document.createElement('a');
      a.href = previewFile.url;
      a.download = previewFile.filename || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error('Download error:', e);
    }
  };

  const handleClose = () => {
    if (previewFile?.url?.startsWith('blob:')) {
      try {
        window.URL.revokeObjectURL(previewFile.url);
      } catch (e) {}
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-[#020617]/90 backdrop-blur-2xl z-[90]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-4 sm:inset-10 md:inset-16 z-[100] flex flex-col bg-[#111620] border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden font-sans"
      >
        {/* Modal Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-white/5 bg-[#181f2b] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <File size={22} className="text-blue-500 shrink-0" />
            <span
              className="text-[14px] font-black text-white truncate uppercase tracking-wider"
              title={previewFile.filename}
            >
              {previewFile.filename}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleDownload}
              className="p-2.5 bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-xl transition-all border border-white/5 cursor-pointer"
              title="Download File"
            >
              <Download size={18} />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-2.5 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all border border-white/5 cursor-pointer"
              title="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center justify-center bg-[#020617]">
          {previewFile.mimeType?.startsWith('image/') ? (
            <div className="flex-1 flex items-center justify-center max-w-full">
              <img
                src={previewFile.url}
                alt={previewFile.filename}
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-white/5"
              />
            </div>
          ) : previewFile.mimeType === 'application/pdf' ? (
            <iframe
              src={previewFile.url}
              className="w-full h-full min-h-[65vh] rounded-2xl border border-white/5 bg-white"
              title={previewFile.filename}
            />
          ) : previewFile.excelData ? (
            <div className="w-full h-full min-h-[55vh] flex flex-col items-stretch justify-stretch">
              <ExcelTableRenderer excelData={previewFile.excelData} />
            </div>
          ) : previewFile.filename?.toLowerCase()?.endsWith('.csv') ? (
            <div className="w-full h-full min-h-[55vh] flex flex-col items-stretch justify-stretch">
              <CSVTableRenderer textContent={previewFile.textContent} />
            </div>
          ) : previewFile.textContent ? (
            <pre className="w-full text-left bg-[#111620] text-slate-300 p-6 sm:p-8 rounded-2xl overflow-auto max-h-[70vh] font-mono text-[13px] whitespace-pre-wrap border border-white/5 shadow-inner custom-scrollbar">
              {previewFile.textContent}
            </pre>
          ) : (
            <div className="text-center p-8 sm:p-12 bg-white/[0.02] border border-white/5 rounded-3xl max-w-md">
              <File size={48} className="text-slate-600 mx-auto mb-4 opacity-50" />
              <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Inline Preview Unavailable
              </p>
              <p className="text-[11px] text-slate-500 font-medium mb-6">
                This file type ({previewFile.mimeType || 'unknown'}) cannot be displayed inline.
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg cursor-pointer inline-flex items-center gap-2"
              >
                <Download size={14} /> Download to View
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
