import React, { useRef, useState, useEffect } from 'react';
import {
  CheckCircle,
  UploadCloud,
  File,
  Eye,
  Download,
  X,
  Image as ImageIcon,
  ClipboardPaste
} from 'lucide-react';
import { formatFileSize } from '../../../utils/formatters';
import { extractPastedImages } from './TicketConversation';

// Helper component for local solution attachment preview
function LocalSolutionPreviewItem({ file, onRemove }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const isImage =
    file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(file.name);

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <div className="flex items-center gap-2 p-1.5 pr-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-500/20 rounded-xl shadow-xs">
      {isImage && previewUrl ? (
        <img src={previewUrl} alt={file.name} className="w-9 h-9 object-cover rounded-lg border border-blue-300 dark:border-blue-500/30" />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <File size={16} />
        </div>
      )}
      <div className="min-w-0 max-w-[130px] sm:max-w-[170px]">
        <p className="text-[11px] font-bold text-slate-800 dark:text-white truncate" title={file.name}>{file.name}</p>
        <p className="text-[9px] text-slate-400 font-medium">{formatFileSize(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 p-1 hover:bg-red-500/10 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
        title="Remove"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default function TicketResolutionSection({
  ticket,
  rawTicketId,
  status,
  solution,
  setSolution,
  adminFiles = [],
  setAdminFiles,
  onViewAttachment,
  onDownloadAttachment
}) {
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const sectionRef = useRef(null);
  const [pasteFlash, setPasteFlash] = useState(false);
  const isResolved = ticket?.status === 'Resolved';

  // Refs for latest state setters
  const setAdminFilesRef = useRef(setAdminFiles);
  const setSolutionRef = useRef(setSolution);
  useEffect(() => { setAdminFilesRef.current = setAdminFiles; }, [setAdminFiles]);
  useEffect(() => { setSolutionRef.current = setSolution; }, [setSolution]);

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      const newFiles = Array.from(e.target.files);
      setAdminFiles((prev) => {
        const next = [...prev, ...newFiles];
        const reflections = newFiles.map((f) => `\n[Attachment: ${f.name}]`).join('');
        setSolution((prevSol) => {
          let cleanSol = prevSol || '';
          if (!cleanSol.includes(reflections)) cleanSol += reflections;
          return cleanSol;
        });
        return next;
      });
    }
  };

  const handleRemoveAdminFile = (indexToRemove) => {
    const fileToRemove = adminFiles[indexToRemove];
    setAdminFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    if (fileToRemove) {
      setSolution((prevSol) => {
        return (prevSol || '')
          .replace(`\n[Attachment: ${fileToRemove.name}]`, '')
          .replace(`\n[Screenshot: ${fileToRemove.name}]`, '');
      });
    }
  };

  // ──────────────────────────────────────────
  // NATIVE paste event listener for solution textarea
  // ──────────────────────────────────────────
  useEffect(() => {
    if (isResolved) return;

    const onPasteNative = (e) => {
      const images = extractPastedImages(e);
      if (images.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        setAdminFilesRef.current((prev) => {
          const next = [...prev, ...images];
          const reflections = images.map((f) => `\n[Screenshot: ${f.name}]`).join('');
          setSolutionRef.current((prevSol) => (prevSol || '') + reflections);
          return next;
        });
        setPasteFlash(true);
        setTimeout(() => setPasteFlash(false), 1200);
        console.log('[Paste] Solution: captured', images.length, 'screenshot(s)');
      }
    };

    const textarea = textareaRef.current;
    const section = sectionRef.current;
    if (textarea) textarea.addEventListener('paste', onPasteNative);
    if (section) section.addEventListener('paste', onPasteNative);

    return () => {
      if (textarea) textarea.removeEventListener('paste', onPasteNative);
      if (section) section.removeEventListener('paste', onPasteNative);
    };
  }, [isResolved]);

  // Direct Clipboard Read Button
  const handlePasteFromClipboardClick = async () => {
    if (isResolved) return;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.read === 'function') {
        const clipboardItems = await navigator.clipboard.read();
        const extracted = [];
        for (const item of clipboardItems) {
          const imageType = item.types.find((t) => t.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const ts = Date.now();
            const ext = imageType.split('/')[1] || 'png';
            extracted.push(new File([blob], `solution_ss_${ts}.${ext}`, { type: imageType }));
          }
        }
        if (extracted.length > 0) {
          setAdminFiles((prev) => {
            const next = [...prev, ...extracted];
            const reflections = extracted.map((f) => `\n[Screenshot: ${f.name}]`).join('');
            setSolution((prevSol) => (prevSol || '') + reflections);
            return next;
          });
          setPasteFlash(true);
          setTimeout(() => setPasteFlash(false), 1200);
          return;
        }
      }
    } catch (err) {
      console.log('[Paste Button] Error:', err.message);
    }
    textareaRef.current?.focus();
    alert('Click inside the solution text box and press Ctrl+V (or Cmd+V on Mac) to paste your screenshot.');
  };

  const kbAttachments =
    ticket?.adminAttachments?.length > 0
      ? ticket.adminAttachments
      : ticket?.original?.adminAttachments || [];

  return (
    <section ref={sectionRef} className="space-y-6 relative">
      {/* Paste success flash */}
      {pasteFlash && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg z-50 animate-bounce">
          ✅ Screenshot captured!
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label
            className={`text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2 ${
              status === 'Resolved' ? 'text-emerald-500' : 'text-slate-500'
            }`}
          >
            {status === 'Resolved' && <CheckCircle size={14} />} Final Technical Solution{' '}
            {status === 'Resolved' && '*'}
          </label>

          {!isResolved && (
            <button
              type="button"
              onClick={handlePasteFromClipboardClick}
              className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
              title="Paste screenshot from clipboard"
            >
              <ClipboardPaste size={12} /> Paste Screenshot
            </button>
          )}
        </div>

        <div
          className={`w-full bg-slate-50 dark:bg-[#0f172a] border rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-4 transition-all shadow-sm ${
            status === 'Resolved'
              ? 'border-emerald-500/30 focus-within:border-emerald-500 shadow-emerald-500/5'
              : 'border-slate-200 dark:border-white/5 focus-within:border-blue-500/50'
          }`}
        >
          <textarea
            ref={textareaRef}
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            disabled={isResolved}
            rows={4}
            placeholder="Comprehensive summary of the permanent fix (Ctrl+V / Cmd+V to paste screenshot)..."
            className="w-full bg-transparent border-0 text-sm sm:text-[15px] font-medium text-slate-800 dark:text-white focus:outline-none resize-none disabled:opacity-60 disabled:cursor-not-allowed"
          />

          {/* Pasted / Attached Screenshots Preview */}
          {!isResolved && adminFiles.length > 0 && (
            <div className="border-t border-slate-200 dark:border-white/5 pt-3 space-y-2">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                📎 {adminFiles.length} Solution Screenshot{adminFiles.length > 1 ? 's' : ''} / File{adminFiles.length > 1 ? 's' : ''} Attached
              </span>
              <div className="flex flex-wrap gap-2">
                {adminFiles.map((file, i) => (
                  <LocalSolutionPreviewItem key={`${file.name}-${i}`} file={file} onRemove={() => handleRemoveAdminFile(i)} />
                ))}
              </div>
            </div>
          )}

          {/* File Upload */}
          {!isResolved && (
            <div className="border-t border-slate-200 dark:border-white/5 pt-3 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Upload or Paste Screenshots</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-xl text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                <UploadCloud size={13} /> Attach Files
              </button>
              <input type="file" ref={fileInputRef} multiple className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {/* Knowledge Base Attachments for Resolved tickets */}
          {isResolved && kbAttachments.length > 0 && (
            <div className="border-t border-slate-200 dark:border-white/5 pt-4 flex flex-col gap-3">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Knowledge Base Attachments</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {kbAttachments.map((file, i) => {
                  const fileName = file.originalName || file.filename || 'KB Attachment';
                  const ext = fileName.split('.').pop().toLowerCase();
                  const isImage =
                    ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext) ||
                    file.mimeType?.startsWith('image/') || file.contentType?.startsWith('image/');
                  const token = sessionStorage.getItem('token');
                  const baseUrl = import.meta.env.VITE_API_URL || 'https://ticketing-backend-61yr.onrender.com/api';
                  const inlineImageUrl = `${baseUrl}/tickets/${rawTicketId}/view/${file._id}?token=${token}`;

                  return (
                    <div key={file._id || i} className="bg-white dark:bg-black/30 border border-slate-200 dark:border-white/5 p-2.5 rounded-xl flex items-center justify-between shadow-xs gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isImage ? (
                          <img src={inlineImageUrl} alt={fileName}
                            className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-white/10 shrink-0 cursor-pointer"
                            onClick={(e) => onViewAttachment(e, rawTicketId, file._id, fileName, file.mimeType || file.contentType || 'image/png')}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 rounded-lg"><File size={16} /></div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate" title={fileName}>{fileName}</p>
                          <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={(e) => onViewAttachment(e, rawTicketId, file._id, fileName, file.mimeType || file.contentType)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-blue-600 rounded-lg cursor-pointer" title="View"><Eye size={14} /></button>
                        <button type="button" onClick={(e) => onDownloadAttachment(e, rawTicketId, file._id, fileName)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-emerald-600 rounded-lg cursor-pointer" title="Download"><Download size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
