import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  History,
  MessageSquare,
  Lock,
  UploadCloud,
  Send,
  File,
  Eye,
  Download,
  X,
  Image as ImageIcon,
  ZoomIn,
  ClipboardPaste
} from 'lucide-react';
import { formatDateTime, formatFileSize } from '../../../utils/formatters';

/**
 * Extract image files from a native ClipboardEvent.
 * Tries clipboardData.files first, then clipboardData.items.
 * Returns an array of File objects.
 */
export function extractPastedImages(event) {
  const cd = event.clipboardData || event.originalEvent?.clipboardData || window.clipboardData;
  if (!cd) return [];

  const result = [];
  const ts = Date.now();

  // Method 1: Check .files (FileList) — works in most modern browsers
  try {
    if (cd.files && cd.files.length > 0) {
      for (let i = 0; i < cd.files.length; i++) {
        const f = cd.files[i];
        if (f && f.type && f.type.startsWith('image/')) {
          result.push(f);
        }
      }
    }
  } catch (err) {
    console.warn('[Paste] Error reading clipboardData.files:', err);
  }

  // Method 2: Check .items (DataTransferItemList) — more reliable for screenshots
  if (result.length === 0) {
    try {
      if (cd.items && cd.items.length > 0) {
        for (let i = 0; i < cd.items.length; i++) {
          const item = cd.items[i];
          if (item.kind === 'file') {
            const blob = item.getAsFile();
            if (blob && blob.type && blob.type.startsWith('image/')) {
              const ext = blob.type.split('/')[1]?.replace('+xml', '') || 'png';
              const file = new File(
                [blob],
                `screenshot_${ts}_${i}.${ext}`,
                { type: blob.type }
              );
              result.push(file);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[Paste] Error reading clipboardData.items:', err);
    }
  }

  return result;
}

// Local thumbnail preview badge
function LocalFilePreviewItem({ file, onRemove }) {
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
    <div className="relative group/thumb flex items-center gap-2 p-1.5 pr-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl shadow-sm">
      {isImage && previewUrl ? (
        <img
          src={previewUrl}
          alt={file.name}
          className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-white/10"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
          <File size={18} />
        </div>
      )}
      <div className="min-w-0 max-w-[130px] sm:max-w-[170px]">
        <p className="text-xs font-bold text-slate-800 dark:text-white truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-[10px] text-slate-400 font-medium">
          {formatFileSize(file.size)}
        </p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 p-1 hover:bg-red-500/10 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
        title="Remove attachment"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function TicketConversation({
  ticket,
  currentUser,
  rawTicketId,
  reply,
  setReply,
  remarkFiles = [],
  setRemarkFiles,
  isInternal,
  setIsInternal,
  isSendingChat,
  onSendRemark,
  onViewAttachment,
  onDownloadAttachment
}) {
  const remarkFileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const replyContainerRef = useRef(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [pasteFlash, setPasteFlash] = useState(false);
  const remarks = ticket?.original?.remarks || ticket?.remarks || [];
  const isResolved = ticket?.status === 'Resolved';

  // Use a ref to always have the latest setRemarkFiles without re-attaching listeners
  const setRemarkFilesRef = useRef(setRemarkFiles);
  useEffect(() => {
    setRemarkFilesRef.current = setRemarkFiles;
  }, [setRemarkFiles]);

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      setRemarkFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setRemarkFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // ──────────────────────────────────────────
  // NATIVE paste event listener (bypasses React synthetic events entirely)
  // Attached to both the textarea element AND the document
  // ──────────────────────────────────────────
  useEffect(() => {
    if (isResolved) return;

    const onPasteNative = (e) => {
      // Skip if user is in an unrelated text input
      const active = document.activeElement;
      const tag = active?.tagName?.toLowerCase();
      if (tag === 'input' && active.type !== 'search') return;

      const images = extractPastedImages(e);
      if (images.length > 0) {
        e.preventDefault();
        e.stopPropagation();
        setRemarkFilesRef.current((prev) => [...prev, ...images]);
        // Flash feedback
        setPasteFlash(true);
        setTimeout(() => setPasteFlash(false), 1200);
        console.log('[Paste] Successfully captured', images.length, 'screenshot(s)');
      }
    };

    // Attach to textarea element directly (native DOM)
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('paste', onPasteNative);
    }

    // Also attach to the reply container div
    const container = replyContainerRef.current;
    if (container) {
      container.addEventListener('paste', onPasteNative);
    }

    // Also attach to document as ultimate fallback
    document.addEventListener('paste', onPasteNative);

    return () => {
      if (textarea) textarea.removeEventListener('paste', onPasteNative);
      if (container) container.removeEventListener('paste', onPasteNative);
      document.removeEventListener('paste', onPasteNative);
    };
  }, [isResolved]);

  // Drag and Drop Handler
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer?.files?.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setRemarkFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  // Direct Clipboard Read Button (uses async Clipboard API)
  const handlePasteFromClipboardClick = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.read === 'function') {
        const clipboardItems = await navigator.clipboard.read();
        const extracted = [];
        for (const item of clipboardItems) {
          const imageType = item.types.find((type) => type.startsWith('image/'));
          if (imageType) {
            const blob = await item.getType(imageType);
            const timestamp = Date.now();
            const ext = imageType.split('/')[1] || 'png';
            const file = new File([blob], `screenshot_${timestamp}.${ext}`, { type: imageType });
            extracted.push(file);
          }
        }
        if (extracted.length > 0) {
          setRemarkFiles((prev) => [...prev, ...extracted]);
          setPasteFlash(true);
          setTimeout(() => setPasteFlash(false), 1200);
          return;
        }
      }
    } catch (err) {
      console.log('[Paste Button] Clipboard API error:', err.message);
    }
    // Fallback — just focus the textarea so user can Ctrl+V
    textareaRef.current?.focus();
    alert('Click inside the text box and press Ctrl+V (or Cmd+V on Mac) to paste your screenshot.');
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History size={18} className="text-indigo-500 dark:text-indigo-400" />
          <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
            Transmission History
          </h3>
        </div>
        <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          {remarks.length} Events Logged
        </span>
      </div>

      <div className="space-y-6 bg-slate-100/50 dark:bg-black/40 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-white/5 relative overflow-hidden">
        {remarks.length === 0 ? (
          <div className="text-center py-10 sm:py-14 bg-slate-50/50 dark:bg-white/[0.01] rounded-2xl border border-slate-200 dark:border-white/5">
            <MessageSquare size={36} className="text-slate-400 dark:text-slate-800 mx-auto mb-3 opacity-50" />
            <p className="text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.3em]">
              Awaiting transmission
            </p>
          </div>
        ) : (
          remarks.map((remark, index) => {
            const isConsultantRole =
              remark.addedBy?.role === 'consultant' ||
              remark.addedBy?.role === 'admin' ||
              remark.addedBy?.role === 'superadmin' ||
              remark.addedBy?.role === 'Consultant' ||
              remark.addedBy?.role === 'Super Admin';

            const senderName = remark.addedBy?.name || 'Staff';
            const alignLeft = !isConsultantRole || remark.isInternal;
            const isBlueBubble = isConsultantRole && !remark.isInternal;

            return (
              <div
                key={index}
                className={`flex ${alignLeft ? 'justify-start' : 'justify-end'} w-full group`}
              >
                <div className={`max-w-[92%] sm:max-w-[85%] flex flex-col ${alignLeft ? 'items-start' : 'items-end'}`}>
                  {/* Sender Header */}
                  <div className={`flex items-center gap-2.5 mb-1.5 px-2 ${alignLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-[11px] font-black shadow-sm shrink-0 ${
                        remark.isInternal
                          ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-black ring-2 ring-amber-500/20'
                          : isConsultantRole
                          ? 'bg-blue-600 text-white ring-2 ring-blue-600/20'
                          : 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {senderName[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className={`flex flex-col ${alignLeft ? 'items-start' : 'items-end'}`}>
                      <div className={`flex items-center gap-1.5 ${alignLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                        <span className="text-xs font-bold text-slate-800 dark:text-white">{senderName}</span>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            remark.isInternal
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                              : isConsultantRole
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {remark.isInternal ? 'Internal Note' : isConsultantRole ? 'Support' : 'Client'}
                        </span>
                      </div>
                      <span className="text-[9px] text-slate-500 font-bold mt-0.5">{formatDateTime(remark.addedAt)}</span>
                    </div>
                  </div>

                  {/* Bubble Content */}
                  <div
                    className={`relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border transition-all ${
                      remark.isInternal
                        ? 'bg-amber-50/70 dark:bg-[#1c160e]/50 border-amber-200/50 dark:border-white/5 border-l-4 border-l-amber-500 text-slate-800 dark:text-slate-200 rounded-tl-none'
                        : isConsultantRole
                        ? 'bg-blue-600 border-blue-400/30 text-white rounded-tr-none'
                        : 'bg-slate-200 dark:bg-[#1e293b] border-slate-300 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {remark.text && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">{remark.text}</p>
                    )}

                    {/* Attachments */}
                    {Array.isArray(remark.attachments) && remark.attachments.length > 0 && (
                      <div
                        className={`space-y-2.5 ${remark.text ? 'mt-3 pt-3 border-t' : ''} ${
                          isBlueBubble ? 'border-white/20' : 'border-slate-300 dark:border-white/5'
                        }`}
                      >
                        {remark.attachments.map((file, fIdx) => {
                          const fileName = file.originalName || file.filename || 'Attachment';
                          const ext = fileName.split('.').pop().toLowerCase();
                          const isImage =
                            ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext) ||
                            file.mimeType?.startsWith('image/') ||
                            file.contentType?.startsWith('image/');

                          const token = sessionStorage.getItem('token');
                          const baseUrl =
                            import.meta.env.VITE_API_URL ||
                            'https://ticketing-backend-61yr.onrender.com/api';
                          const inlineImageUrl = `${baseUrl}/tickets/${rawTicketId}/view/${file._id}?token=${token}`;

                          return isImage ? (
                            <div
                              key={fIdx}
                              className={`rounded-xl overflow-hidden border ${
                                isBlueBubble
                                  ? 'bg-black/20 border-white/20'
                                  : 'bg-white dark:bg-black/30 border-slate-200 dark:border-white/10'
                              }`}
                            >
                              <div
                                onClick={(e) =>
                                  onViewAttachment(e, rawTicketId, file._id, fileName, file.mimeType || file.contentType || 'image/png')
                                }
                                className="relative group/img cursor-pointer overflow-hidden max-h-64 bg-black/10 flex items-center justify-center p-1"
                              >
                                <img
                                  src={inlineImageUrl}
                                  alt={fileName}
                                  className="max-h-60 w-auto object-contain rounded-lg"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
                                  <ZoomIn size={18} /> Click to View
                                </div>
                              </div>
                              <div className="flex items-center justify-between p-2 px-3 text-xs gap-2">
                                <div className="min-w-0 flex items-center gap-1.5">
                                  <ImageIcon size={13} className="shrink-0 text-blue-400" />
                                  <span className="truncate font-bold text-[11px]" title={fileName}>{fileName}</span>
                                  <span className="text-[9px] opacity-60 shrink-0">({formatFileSize(file.size)})</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => onViewAttachment(e, rawTicketId, file._id, fileName, file.mimeType || file.contentType || 'image/png')}
                                    className="p-1.5 hover:bg-white/20 rounded-lg cursor-pointer"
                                    title="View Full Size"
                                  ><Eye size={13} /></button>
                                  <button
                                    type="button"
                                    onClick={(e) => onDownloadAttachment(e, rawTicketId, file._id, fileName)}
                                    className="p-1.5 hover:bg-white/20 rounded-lg cursor-pointer"
                                    title="Download"
                                  ><Download size={13} /></button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              key={fIdx}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border w-full ${
                                isBlueBubble
                                  ? 'bg-white/10 border-white/10 hover:bg-white/20'
                                  : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-black/30'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${isBlueBubble ? 'bg-white/20 text-white' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'}`}>
                                <File size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate" title={fileName}>{fileName}</p>
                                <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button type="button" onClick={(e) => onViewAttachment(e, rawTicketId, file._id, fileName, file.mimeType || file.contentType)}
                                  className={`p-1.5 rounded-lg border ${isBlueBubble ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 hover:text-blue-600'} cursor-pointer`}
                                  title="View File"><Eye size={13} /></button>
                                <button type="button" onClick={(e) => onDownloadAttachment(e, rawTicketId, file._id, fileName)}
                                  className={`p-1.5 rounded-lg border ${isBlueBubble ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-500 hover:text-emerald-600'} cursor-pointer`}
                                  title="Download"><Download size={13} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Reply Console */}
        {!isResolved && (
          <div
            ref={replyContainerRef}
            onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            className={`border-t border-slate-200 dark:border-white/10 pt-4 mt-4 space-y-3 relative z-10 transition-colors ${
              isDraggingOver ? 'bg-blue-500/5 rounded-2xl ring-2 ring-blue-500/40 p-2' : ''
            }`}
          >
            {/* Paste success flash */}
            {pasteFlash && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg z-50 animate-bounce">
                ✅ Screenshot captured!
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 mb-1 ml-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Reply Destination
                </span>
                <div className="flex bg-slate-200/60 dark:bg-white/5 p-0.5 rounded-xl border border-slate-200 dark:border-white/5 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setIsInternal(false)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      !isInternal ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <MessageSquare size={11} /> Public Update
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternal(true)}
                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      isInternal ? 'bg-amber-500 text-black shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Lock size={11} /> Internal Note
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePasteFromClipboardClick}
                className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                title="Click to paste screenshot from clipboard"
              >
                <ClipboardPaste size={12} /> Paste Screenshot
              </button>
            </div>

            {/* Attached Screenshots Preview */}
            {remarkFiles.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block ml-1">
                  📎 {remarkFiles.length} Screenshot{remarkFiles.length > 1 ? 's' : ''} / File{remarkFiles.length > 1 ? 's' : ''} Attached
                </span>
                <div className="flex flex-wrap gap-2 p-2.5 bg-slate-200/50 dark:bg-[#111620] border border-emerald-500/30 rounded-2xl">
                  {remarkFiles.map((file, fIdx) => (
                    <LocalFilePreviewItem
                      key={`${file.name}-${fIdx}`}
                      file={file}
                      onRemove={() => handleRemoveFile(fIdx)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="relative group/reply">
              <textarea
                ref={textareaRef}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={3}
                placeholder={
                  isInternal
                    ? 'Share confidential notes (Ctrl+V / Cmd+V to paste screenshot)...'
                    : 'Provide conversational updates (Ctrl+V / Cmd+V to paste screenshot)...'
                }
                className={`w-full bg-slate-50 dark:bg-[#0f172a] border rounded-2xl px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-medium text-slate-800 dark:text-white focus:outline-none transition-all resize-none shadow-inner pr-24 sm:pr-28 ${
                  isInternal
                    ? 'border-amber-500/30 focus:border-amber-500/60 shadow-amber-500/5'
                    : 'border-slate-200 dark:border-white/10 focus:border-blue-500/50'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    onSendRemark?.();
                  }
                }}
              />

              <div className="absolute right-2.5 sm:right-3 bottom-2.5 sm:bottom-3 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => remarkFileInputRef.current?.click()}
                  className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b]/60 dark:hover:bg-blue-500/20 text-slate-500 hover:text-blue-600 rounded-xl border border-slate-200 dark:border-white/5 transition-all shadow-sm cursor-pointer"
                  title="Attach Files"
                >
                  <UploadCloud size={16} />
                </button>
                <input type="file" ref={remarkFileInputRef} multiple className="hidden" onChange={handleFileChange} />
                <button
                  type="button"
                  onClick={onSendRemark}
                  disabled={isSendingChat || (!reply.trim() && remarkFiles.length === 0)}
                  className={`p-2 sm:p-2.5 rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer ${
                    isInternal
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-600/20'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/20'
                  }`}
                  title={isInternal ? 'Send Internal Note' : 'Send Message'}
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
