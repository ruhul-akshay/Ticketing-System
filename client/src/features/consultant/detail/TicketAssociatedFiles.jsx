import React from 'react';
import { File, Eye, Download } from 'lucide-react';
import { formatFileSize } from '../../../utils/formatters';

function AttachmentItem({ file, rawTicketId, color = 'blue', onView, onDownload }) {
  const colorStyles = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
  };

  const badgeStyle = colorStyles[color] || colorStyles.blue;
  const fileName = file.originalName || file.filename || 'Attachment';

  return (
    <div className="flex items-center gap-4 p-3.5 rounded-2xl border transition-all w-full text-left bg-white dark:bg-black/20 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-black/30 shadow-sm">
      <div className={`p-2.5 rounded-xl ${badgeStyle} shrink-0`}>
        <File size={16} strokeWidth={2.5} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[11px] font-black truncate uppercase tracking-tight text-slate-800 dark:text-white"
          title={fileName}
        >
          {fileName}
        </p>
        <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest text-slate-500 dark:text-slate-400">
          {formatFileSize(file.size)}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={(e) =>
            onView(e, rawTicketId, file._id, fileName, file.mimeType || file.contentType)
          }
          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-blue-500/20 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 cursor-pointer"
          title="View File"
        >
          <Eye size={14} />
        </button>
        <button
          type="button"
          onClick={(e) => onDownload(e, rawTicketId, file._id, fileName)}
          className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-emerald-500/20 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 cursor-pointer"
          title="Download File"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  );
}

export default function TicketAssociatedFiles({
  ticket,
  rawTicketId,
  onViewAttachment,
  onDownloadAttachment
}) {
  if (!ticket) return null;

  const userFiles = ticket.attachments?.length > 0 ? ticket.attachments : ticket.original?.attachments || [];
  const adminFiles =
    ticket.adminAttachments?.length > 0
      ? ticket.adminAttachments
      : ticket.original?.adminAttachments || [];
  const supportingFiles =
    ticket.supportingDocuments?.length > 0
      ? ticket.supportingDocuments
      : ticket.original?.supportingDocuments || [];

  const hasAnyFiles = userFiles.length > 0 || adminFiles.length > 0 || supportingFiles.length > 0;
  if (!hasAnyFiles) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <File size={18} className="text-blue-500" />
        <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
          Associated Files
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* User Attachments */}
        {userFiles.length > 0 && (
          <div className="bg-slate-100/50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3">
            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              User Attachments
            </h4>
            {userFiles.map((file, fIdx) => (
              <AttachmentItem
                key={file._id || fIdx}
                file={file}
                rawTicketId={rawTicketId}
                color="blue"
                onView={onViewAttachment}
                onDownload={onDownloadAttachment}
              />
            ))}
          </div>
        )}

        {/* Consultant Attachments */}
        {adminFiles.length > 0 && (
          <div className="bg-slate-100/50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3">
            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Consultant Attachments
            </h4>
            {adminFiles.map((file, fIdx) => (
              <AttachmentItem
                key={file._id || fIdx}
                file={file}
                rawTicketId={rawTicketId}
                color="emerald"
                onView={onViewAttachment}
                onDownload={onDownloadAttachment}
              />
            ))}
          </div>
        )}

        {/* Supporting Documents */}
        {supportingFiles.length > 0 && (
          <div className="bg-slate-100/50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-3 col-span-1 sm:col-span-2">
            <h4 className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Supporting Documents
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {supportingFiles.map((file, fIdx) => (
                <AttachmentItem
                  key={file._id || fIdx}
                  file={file}
                  rawTicketId={rawTicketId}
                  color="purple"
                  onView={onViewAttachment}
                  onDownload={onDownloadAttachment}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
