import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, User, Clock, AlertCircle, Building2, Tag, 
  Download, File, UploadCloud, Plus, Trash2, 
  ClipboardList, MessageSquare, CheckCircle, Shield, 
  History, Settings, Activity, Briefcase, Eye, Lock
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTicketStore } from '../../store/useTicketStore';
import { useConsultantStore } from '../../store/useConsultantStore';
import * as XLSX from 'xlsx';

const formatHoursToHM = (hoursVal) => {
  const totalMinutes = Math.round(Number(hoursVal || 0) * 60);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hrs > 0 && mins > 0) {
    return `${hrs} ${hrs === 1 ? 'hour' : 'hours'} and ${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  }
  if (hrs > 0) {
    return `${hrs} ${hrs === 1 ? 'hour' : 'hours'}`;
  }
  if (mins > 0) {
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`;
  }
  return '0 hours';
};

const parseCSV = (text) => {
  if (!text) return [];
  const lines = [];
  let row = [""];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i+1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push("");
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && next === '\n') {
        i++;
      }
      lines.push(row);
      row = [""];
    } else {
      row[row.length - 1] += char;
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
};

const renderCSVTable = (text) => {
  const rows = parseCSV(text);
  if (rows.length === 0) return <p className="text-slate-500">Empty CSV file</p>;
  return (
    <div className="w-full max-w-5xl overflow-auto max-h-[70vh] bg-slate-900 border border-white/10 rounded-2xl custom-scrollbar shadow-inner text-left">
      <table className="w-full border-collapse text-[13px]">
        <thead className="bg-slate-800/80 sticky top-0 border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
          <tr>
            {rows[0].map((cell, idx) => (
              <th key={idx} className="p-4 whitespace-nowrap">{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-slate-300">
          {rows.slice(1).map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="p-4 min-w-[120px] max-w-[300px] truncate" title={cell}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderExcelTable = (excelData) => {
  if (!excelData || excelData.length === 0) return <p className="text-slate-500">Empty Excel sheet</p>;
  return (
    <div className="w-full max-w-5xl overflow-auto max-h-[70vh] bg-slate-900 border border-white/10 rounded-2xl custom-scrollbar shadow-inner text-left">
      <table className="w-full border-collapse text-[13px]">
        <thead className="bg-slate-800/80 sticky top-0 border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
          <tr>
            {excelData[0].map((cell, idx) => (
              <th key={idx} className="p-4 whitespace-nowrap">{cell !== undefined && cell !== null ? String(cell) : ''}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-slate-300">
          {excelData.slice(1).map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="p-4 min-w-[120px] max-w-[300px] truncate" title={cell !== undefined && cell !== null ? String(cell) : ''}>
                  {cell !== undefined && cell !== null ? String(cell) : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function ConsultantTicketDetailPanel({ ticket: initialTicket, onClose, onUpdateStatus }) {
  const liveTicket = useTicketStore((state) => 
    state.tickets.find((t) => t.id === (initialTicket?.id || initialTicket?.original?._id)) || initialTicket
  );

  const { fetchTickets, forwardTicket } = useTicketStore();
  const { consultants: admins, fetchConsultants: fetchAdmins } = useConsultantStore();

  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [forwardRemarks, setForwardRemarks] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  React.useEffect(() => {
    if (!initialTicket || !liveTicket) return;

    const interval = setInterval(() => {
      fetchTickets().catch(err => console.error('Error polling tickets:', err));
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, [liveTicket?.id, fetchTickets]);

  const ticket = liveTicket;
  const { user } = useAuthStore();

  React.useEffect(() => {
    const isPrivileged = user?.role === 'consultant' || user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'Consultant' || user?.role === 'Admin' || user?.role === 'Super Admin';
    if (isPrivileged) {
      fetchAdmins().catch(err => console.error('Error fetching consultants:', err));
    }
  }, [user]);

  const [reply, setReply] = useState('');
  const [solution, setSolution] = useState(ticket.original?.solution || '');
  const [remarkFiles, setRemarkFiles] = useState([]);
  const [isInternal, setIsInternal] = useState(false);
  const [status, setStatus] = useState(ticket.status);
  const [adminFiles, setAdminFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null); // { url, filename, mimeType, textContent }
  const fileInputRef = useRef(null);
  const remarkFileInputRef = useRef(null);

  const [workLogEntries, setWorkLogEntries] = useState([
    { date: new Date().toISOString().slice(0, 10), hours: '', minutes: '' }
  ]);

  const addWorkLogRow = () => setWorkLogEntries(prev => [...prev, { date: new Date().toISOString().slice(0, 10), hours: '', minutes: '' }]);
  const removeWorkLogRow = (idx) => setWorkLogEntries(prev => prev.length === 1 ? prev : prev.filter((_, i) => i !== idx));
  const updateWorkLogRow = (idx, field, value) => setWorkLogEntries(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row));

  const validEntries = workLogEntries
    .filter(r => r.date && (Number(r.hours) > 0 || Number(r.minutes) > 0))
    .map(r => ({
      date: r.date,
      hours: Number(r.hours || 0) + (Number(r.minutes || 0) / 60)
    }));
  const existingTotalHours = (ticket.workLogs || []).reduce((sum, l) => sum + (l.hours || 0), 0);
  const grandTotalHours = existingTotalHours + validEntries.reduce((sum, r) => sum + Number(r.hours), 0);

  const rawTicketId = ticket.original?._id || ticket.id;

  const handleDownloadAttachment = async (e, ticketId, attachmentId, filename) => {
    e.stopPropagation(); e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'https://ticketing-backend-61yr.onrender.com/api';
      const response = await fetch(`${baseUrl}/tickets/${ticketId}/attachment/${attachmentId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); window.URL.revokeObjectURL(url); }, 5000);
    } catch (err) { console.error('Download error:', err); alert('Failed to download file'); }
  };

  const handleViewAttachment = async (e, ticketId, attachmentId, filename, mimeType) => {
    e.stopPropagation(); e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'https://ticketing-backend-61yr.onrender.com/api';
      const response = await fetch(`${baseUrl}/tickets/${ticketId}/view/${attachmentId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Failed to load file preview');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      let textContent = '';
      let excelData = null;
      
      const fileLower = filename.toLowerCase();
      const isExcel = fileLower.endsWith('.xlsx') || fileLower.endsWith('.xls') || 
                      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                      mimeType === 'application/vnd.ms-excel';
      const isCSV = fileLower.endsWith('.csv') || mimeType === 'text/csv';
      
      if (isExcel) {
        const arrayBuffer = await blob.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        excelData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      } else if (isCSV || mimeType?.startsWith('text/') || fileLower.endsWith('.json') || fileLower.endsWith('.txt')) {
        textContent = await blob.text();
      }
      
      setPreviewFile({ url, filename, mimeType, textContent, excelData });
    } catch (err) {
      console.error('Preview error:', err);
      alert('Failed to view file');
    }
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (status === 'Resolved' && !solution.trim()) {
      alert("Validation Required: You must provide a written 'Final Solution' before marking this ticket as Resolved.");
      return;
    }
    const hasChanges = status !== ticket.status || reply.trim().length > 0 || solution !== (ticket.original?.solution || '') || validEntries.length > 0 || adminFiles.length > 0 || remarkFiles.length > 0;
    if (hasChanges) {
      onUpdateStatus(ticket.id, status, reply, solution, validEntries, adminFiles, remarkFiles, isInternal);
      setReply(''); setRemarkFiles([]); setIsInternal(false);
    } else { onClose(); }
  };

  const handleDownloadTicketDetails = () => {
    const clientName = ticket.clientName || ticket.original?.createdBy?.clientName || ticket.original?.createdBy?.client?.name || 'Self/Internal';
    const reportText = `==================================================
TICKET DETAILS REPORT
==================================================
Generated on: ${new Date().toLocaleString()}

1. BASIC DETAILS
--------------------------------------------------
Ticket Number:  ${ticket.ticketNumber || ticket.id || '—'}
Title:          ${ticket.title || '—'}
Status:         ${ticket.status || '—'}
Priority:       ${ticket.priority || '—'}
Category:       ${ticket.category || '—'}
Reason:         ${ticket.reason || '—'}
Created At:     ${ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '—'}
Updated At:     ${ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '—'}

2. CREATOR & ASSIGNEE DETAILS
--------------------------------------------------
Submitted By:   ${ticket.createdBy?.name || ticket.createdBy || '—'}
Email:          ${ticket.createdBy?.email || '—'}
Client:         ${clientName}
Department:     ${ticket.department?.name || ticket.department || '—'}
Assigned To:    ${ticket.assignedTo?.name || ticket.original?.assignedTo?.name || 'Unassigned'}
Email:          ${ticket.assignedTo?.email || ticket.original?.assignedTo?.email || '—'}

3. ISSUE DESCRIPTION
--------------------------------------------------
${ticket.description || 'No description provided.'}

4. FINAL SOLUTION / RESOLUTION
--------------------------------------------------
${ticket.original?.solution || ticket.solution || 'No solution recorded yet.'}

5. REMARKS / CONVERSATION HISTORY
--------------------------------------------------
${(ticket.original?.remarks || []).map((remark, idx) => {
  const sender = remark.addedBy?.name || 'System';
  const role = remark.addedBy?.role || 'Staff';
  const dateStr = remark.addedAt ? new Date(remark.addedAt).toLocaleString() : '—';
  const text = remark.text || '';
  const fileList = (remark.attachments || []).map(att => att.originalName || att.filename).join(', ');
  const filesInfo = fileList ? `\nAttachments: ${fileList}` : '';
  return `[${dateStr}] ${sender} (${role}):\n"${text}"${filesInfo}\n`;
}).join('\n--------------------------------------------------\n') || 'No remarks recorded.'}

6. ASSIGNMENT & ROUTING HISTORY
--------------------------------------------------
${(ticket.assignmentHistory || []).map((history, idx) => {
  const dateStr = history.actionDate ? new Date(history.actionDate).toLocaleString() : '—';
  const action = history.action === 'initial_assignment' ? 'Auto Assign' : history.action === 'assign' ? 'Assign' : 'Forward';
  const remarks = history.remarks ? `\nRemarks: "${history.remarks}"` : '';
  if (history.action === 'initial_assignment') {
    return `[${dateStr}] Auto Assigned to Super Admin: ${history.assignedTo?.name || 'Super Admin'}${remarks}`;
  } else if (history.action === 'assign') {
    return `[${dateStr}] Assigned by ${history.assignedBy?.name || 'Super Admin'} to ${history.assignedTo?.name || 'Consultant'}${remarks}`;
  } else {
    return `[${dateStr}] Forwarded by ${history.forwardedBy?.name || 'Consultant'} to ${history.forwardedTo?.name || 'Consultant'}${remarks}`;
  }
}).join('\n--------------------------------------------------\n') || 'No assignment history recorded.'}
==================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ticket_${ticket.ticketNumber || 'Details'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e) => {
    if (e.target.files?.length) {
      setAdminFiles(Array.from(e.target.files));
    }
  };

  const handleRemarkFileChange = (e) => {
    if (e.target.files?.length) {
      setRemarkFiles(Array.from(e.target.files));
    }
  };

  if (!ticket) return null;

  const canForward = user && (
    user.role === 'superadmin' || user.role === 'Super Admin' || 
    String(ticket.original?.assignedTo?._id || ticket.original?.assignedTo || ticket.assignee) === String(user._id || user.id)
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#020617]/80 dark:bg-[#020617]/90 backdrop-blur-xl z-[60]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed inset-2 sm:inset-4 md:inset-10 z-[70] flex flex-col bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden font-sans"
      >
        {/* Modern Header */}
        <div className="px-4 sm:px-10 py-6 sm:py-8 border-b border-slate-200 dark:border-white/5 bg-gradient-to-r from-slate-100/50 to-slate-50/50 dark:from-[#1e293b]/50 dark:to-[#0f172a]/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden shrink-0">
          <div className="absolute top-0 left-0 w-full h-full bg-blue-600/5 blur-[100px] pointer-events-none" />
          
          <div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full sm:w-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/20 ring-4 ring-blue-500/10 shrink-0">
              <ClipboardList size={24} className="sm:hidden" />
              <ClipboardList size={32} className="hidden sm:block" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-1.5">
                <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[9px] sm:text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em]">
                  {ticket.ticketNumber || ticket.id.slice(-8).toUpperCase()}
                </span>
                <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest border ${
                  status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20' :
                  status === 'On Hold' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' :
                  status === 'Cancelled' ? 'bg-slate-500/10 text-slate-505 dark:text-slate-400 border-slate-500/20' :
                  'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                }`}>
                  {status}
                </span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight leading-tight truncate">{ticket.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto justify-between sm:justify-end">
            <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest ${
              ticket.priority === 'High' || ticket.priority === 'Critical' ? 'bg-red-500/10 text-red-550 dark:text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
            }`}>
              <AlertCircle size={14} /> {ticket.priority} Priority
            </div>
            <button 
              onClick={handleDownloadTicketDetails}
              className="p-2 sm:p-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-blue-500/20 text-slate-655 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl sm:rounded-2xl transition-all border border-slate-200 dark:border-white/5 flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer"
              title="Download Ticket Details"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button onClick={onClose} className="p-2 sm:p-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-red-500/20 text-slate-655 dark:text-slate-400 hover:text-red-655 dark:hover:text-red-500 rounded-xl sm:rounded-2xl transition-all border border-slate-200 dark:border-white/5 cursor-pointer">
              <X size={20} className="sm:hidden" />
              <X size={24} className="hidden sm:block" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50/30 dark:bg-black/20">
          
          {/* Left Column: Details & History (Scrollable) */}
          <div className="flex-[1.5] overflow-y-auto p-4 sm:p-10 space-y-8 sm:space-y-12 custom-scrollbar border-r border-slate-200 dark:border-white/5 order-2 lg:order-1">
            
            {/* Context Grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${status === 'Resolved' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6`}>
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-3xl p-6 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors group shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-550 dark:text-blue-400 group-hover:scale-110 transition-transform">
                     <User size={20} />
                   </div>
                   <span className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Reporter</span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-white truncate">{ticket.user || ticket.original?.createdBy?.name || 'Unknown'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-1">{ticket.original?.createdBy?.email || 'No email provided'}</p>
              </div>

              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-3xl p-6 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors group shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-550 dark:text-purple-400 group-hover:scale-110 transition-transform">
                     <Building2 size={20} />
                   </div>
                   <span className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Department</span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-white truncate">{ticket.department}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-1">{ticket.original?.category || 'General Category'}</p>
              </div>

              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-3xl p-6 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors group shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-555 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                     <Briefcase size={20} />
                   </div>
                   <span className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Client</span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-white truncate">{ticket.clientName || ticket.original?.createdBy?.client?.name || 'N/A'}</p>
                <p className="text-xs text-slate-505 dark:text-slate-400 font-medium truncate mt-1">Ticket Raised By</p>
              </div>

              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-3xl p-6 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors group shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-550 dark:text-amber-400 group-hover:scale-110 transition-transform">
                     <Clock size={20} />
                   </div>
                   <span className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Logged On</span>
                </div>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>

              {status === 'Resolved' && (
                <div className="bg-white dark:bg-white/5 border border-emerald-500/10 rounded-3xl p-6 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-colors group shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                     <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-555 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                       <CheckCircle size={20} />
                     </div>
                     <span className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest">Solved On</span>
                  </div>
                  {ticket.original?.solvedAt || ticket.original?.actualResolutionDate ? (
                    <>
                      <p className="text-lg font-bold text-emerald-650 dark:text-emerald-400">{new Date(ticket.original.solvedAt || ticket.original.actualResolutionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">{new Date(ticket.original.solvedAt || ticket.original.actualResolutionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </>
                  ) : (
                    <p className="text-lg font-bold text-slate-500 dark:text-slate-400">N/A</p>
                  )}
                </div>
              )}
            </div>

            {/* Description Block */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Shield size={18} className="text-blue-500" />
                <h3 className="text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-[0.2em]">Issue Foundation</h3>
              </div>
              <div className="bg-slate-100/70 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 p-8 rounded-[2rem] shadow-inner relative group overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Activity size={100} className="text-blue-500/10" />
                </div>
                <p className="text-lg text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap relative z-10">{ticket.description}</p>
              </div>
            </section>

            {/* Associated Files */}
            {((ticket.attachments?.length > 0 || ticket.original?.attachments?.length > 0) ||
              (ticket.adminAttachments?.length > 0 || ticket.original?.adminAttachments?.length > 0) ||
              (ticket.supportingDocuments?.length > 0 || ticket.original?.supportingDocuments?.length > 0)) && (
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <File size={18} className="text-blue-500" />
                  <h3 className="text-xs font-black text-slate-555 dark:text-slate-400 uppercase tracking-[0.2em]">Associated Files</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* User/Ticket Attachments */}
                  {(ticket.attachments?.length > 0 || ticket.original?.attachments?.length > 0) && (
                    <div className="bg-slate-100/50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 space-y-3">
                      <h4 className="text-[11px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-2">User Attachments</h4>
                      {(ticket.attachments?.length > 0 ? ticket.attachments : (ticket.original?.attachments || [])).map((file, fIdx) => (
                        <div 
                          key={file._id || fIdx} 
                          className="flex items-center gap-4 p-3.5 rounded-2xl border transition-all w-full text-left bg-white dark:bg-black/20 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-black/30 shadow-sm"
                        >
                          <div className="p-2.5 rounded-xl bg-blue-500/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 shrink-0">
                            <File size={16} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black truncate uppercase tracking-tight text-slate-800 dark:text-white" title={file.originalName || file.filename}>
                              {file.originalName || file.filename}
                            </p>
                            <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest text-slate-500 dark:text-slate-400">
                              {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button 
                              onClick={(e) => handleViewAttachment(e, rawTicketId, file._id, file.originalName || file.filename, file.mimeType || file.contentType)}
                              className="p-2 bg-slate-100 hover:bg-slate-205 dark:bg-white/5 dark:hover:bg-blue-500/20 text-slate-505 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 cursor-pointer"
                              title="View File"
                            >
                              <Eye size={14} />
                            </button>
                            <button 
                              onClick={(e) => handleDownloadAttachment(e, rawTicketId, file._id, file.originalName || file.filename)}
                              className="p-2 bg-slate-100 hover:bg-slate-205 dark:bg-white/5 dark:hover:bg-emerald-500/20 text-slate-505 dark:text-slate-400 hover:text-emerald-650 dark:hover:text-emerald-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 cursor-pointer"
                              title="Download File"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Consultant Attachments */}
                  {(ticket.adminAttachments?.length > 0 || ticket.original?.adminAttachments?.length > 0) && (
                    <div className="bg-slate-100/50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 space-y-3">
                      <h4 className="text-[11px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-2">Consultant Attachments</h4>
                      {(ticket.adminAttachments?.length > 0 ? ticket.adminAttachments : (ticket.original?.adminAttachments || [])).map((file, fIdx) => (
                        <div 
                          key={file._id || fIdx} 
                          className="flex items-center gap-4 p-3.5 rounded-2xl border transition-all w-full text-left bg-white dark:bg-black/20 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-black/30 shadow-sm"
                        >
                          <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <File size={16} strokeWidth={2.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black truncate uppercase tracking-tight text-slate-800 dark:text-white" title={file.originalName || file.filename}>
                              {file.originalName || file.filename}
                            </p>
                            <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest text-slate-500 dark:text-slate-400">
                              {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'N/A'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button 
                              onClick={(e) => handleViewAttachment(e, rawTicketId, file._id, file.originalName || file.filename, file.mimeType || file.contentType)}
                              className="p-2 bg-slate-100 hover:bg-slate-205 dark:bg-white/5 dark:hover:bg-blue-500/20 text-slate-505 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 cursor-pointer"
                              title="View File"
                            >
                              <Eye size={14} />
                            </button>
                            <button 
                              onClick={(e) => handleDownloadAttachment(e, rawTicketId, file._id, file.originalName || file.filename)}
                              className="p-2 bg-slate-100 hover:bg-slate-205 dark:bg-white/5 dark:hover:bg-emerald-500/20 text-slate-505 dark:text-slate-400 hover:text-emerald-650 dark:hover:text-emerald-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 cursor-pointer"
                              title="Download File"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Supporting Documents */}
                  {(ticket.supportingDocuments?.length > 0 || ticket.original?.supportingDocuments?.length > 0) && (
                    <div className="bg-slate-100/50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-6 space-y-3 col-span-1 sm:col-span-2">
                      <h4 className="text-[11px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest mb-2">Supporting Documents</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(ticket.supportingDocuments?.length > 0 ? ticket.supportingDocuments : (ticket.original?.supportingDocuments || [])).map((file, fIdx) => (
                          <div 
                            key={file._id || fIdx} 
                            className="flex items-center gap-4 p-3.5 rounded-2xl border transition-all w-full text-left bg-white dark:bg-black/20 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-black/30 shadow-sm"
                          >
                            <div className="p-2.5 rounded-xl bg-purple-500/10 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 shrink-0">
                              <File size={16} strokeWidth={2.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-black truncate uppercase tracking-tight text-slate-800 dark:text-white" title={file.originalName || file.filename}>
                                {file.originalName || file.filename}
                              </p>
                              <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'N/A'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button 
                                onClick={(e) => handleViewAttachment(e, rawTicketId, file._id, file.originalName || file.filename, file.mimeType || file.contentType)}
                                className="p-2 bg-slate-100 hover:bg-slate-205 dark:bg-white/5 dark:hover:bg-blue-500/20 text-slate-505 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 cursor-pointer"
                                title="View File"
                              >
                                <Eye size={14} />
                              </button>
                              <button 
                                onClick={(e) => handleDownloadAttachment(e, rawTicketId, file._id, file.originalName || file.filename)}
                                className="p-2 bg-slate-100 hover:bg-slate-205 dark:bg-white/5 dark:hover:bg-emerald-500/20 text-slate-505 dark:text-slate-400 hover:text-emerald-650 dark:hover:text-emerald-400 rounded-xl transition-all border border-slate-200 dark:border-white/5 cursor-pointer"
                                title="Download File"
                              >
                                <Download size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Assignment & Forwarding History */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Clock size={18} className="text-blue-500 dark:text-blue-400" />
                <h3 className="text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-[0.2em]">Assignment & Forwarding History</h3>
              </div>
              <div className="bg-slate-100/50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-[2rem] p-8 shadow-inner">
                {(!ticket.original?.assignmentHistory || ticket.original.assignmentHistory.length === 0) ? (
                  <p className="text-[13px] text-slate-550 dark:text-slate-500 italic">No assignment history logged.</p>
                ) : (
                  <div className="relative border-l border-slate-200 dark:border-white/10 pl-6 ml-2.5 space-y-6">
                    {ticket.original.assignmentHistory.map((item, index) => {
                      const isInitial = item.action === 'initial_assignment';
                      const isAssign = item.action === 'assign';
                      const isForward = item.action === 'forward';

                      return (
                        <div key={index} className="relative">
                          <div className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 ${
                            isInitial ? 'bg-blue-500 border-white dark:border-[#0f172a]' : isAssign ? 'bg-purple-500 border-white dark:border-[#0f172a]' : 'bg-amber-500 border-white dark:border-[#0f172a]'
                          }`} />
                          
                          <div className="flex flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-700 dark:text-slate-300">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                                isInitial ? 'bg-blue-500/10 text-blue-650 dark:text-blue-400' : isAssign ? 'bg-purple-500/10 text-purple-655 dark:text-purple-400' : 'bg-amber-500/10 text-amber-655 dark:text-amber-400'
                              }`}>
                                {isInitial ? 'Auto Assign' : isAssign ? 'Assign' : 'Forward'}
                              </span>
                              <span className="font-bold text-slate-800 dark:text-white">
                                {isInitial ? (
                                  `Assigned to Super Admin: ${item.assignedTo?.name || 'Super Admin'}`
                                ) : isAssign ? (
                                  `${item.assignedBy?.name || 'Super Admin'} assigned to ${item.assignedTo?.name || 'Consultant'}`
                                ) : (
                                  `${item.forwardedBy?.name || 'Consultant'} forwarded to ${item.forwardedTo?.name || 'Consultant'}`
                                )}
                              </span>
                            </div>
                            
                            {item.remarks && (
                              <p className="text-[12px] text-slate-600 dark:text-slate-400 font-medium italic mt-1 bg-slate-200/50 dark:bg-black/20 p-2.5 rounded-xl border border-slate-200 dark:border-white/5">
                                "{item.remarks}"
                              </p>
                            )}
                            
                            <span className="text-[10px] text-slate-505 font-semibold tracking-wider uppercase mt-1">
                              {new Date(item.actionDate).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Conversation Flow */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History size={18} className="text-indigo-500 dark:text-indigo-400" />
                  <h3 className="text-xs font-black text-slate-555 dark:text-slate-400 uppercase tracking-[0.2em]">Transmission History</h3>
                </div>
                <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {ticket.original?.remarks?.length || 0} Events Logged
                </span>
              </div>

              <div className="space-y-8 bg-slate-100/50 dark:bg-black/40 rounded-[3rem] p-10 border border-slate-200 dark:border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                
                {(!ticket.original?.remarks || ticket.original.remarks.length === 0) ? (
                  <div className="text-center py-20 bg-slate-50/50 dark:bg-white/[0.01] rounded-[2rem] border border-slate-200 dark:border-white/5">
                    <MessageSquare size={48} className="text-slate-450 dark:text-slate-800 mx-auto mb-4 opacity-50" />
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.4em]">Awaiting protocol initiation</p>
                  </div>
                ) : (
                  ticket.original.remarks.map((remark, index) => {
                     const isConsultantRole = remark.addedBy?.role === 'consultant' || remark.addedBy?.role === 'admin' || remark.addedBy?.role === 'superadmin';
                     const senderName = remark.addedBy?.name || 'System';
                     const isMe = String(remark.addedBy?._id || remark.addedBy) === String(user?._id || user?.id);
                     
                     return (
                       <div key={index} className={`flex ${isConsultantRole ? 'justify-end' : 'justify-start'} w-full group animate-in fade-in slide-in-from-bottom-6 duration-700`}>
                         <div className={`max-w-[85%] flex flex-col ${isConsultantRole ? 'items-end' : 'items-start'}`}>
                           <div className={`flex items-center gap-3 mb-3 px-4 ${isConsultantRole ? 'flex-row-reverse' : 'flex-row'}`}>
                             <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-[12px] font-black shadow-2xl transition-all group-hover:rotate-6 ${
                               remark.isInternal
                                 ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white ring-4 ring-amber-500/10'
                                 : isConsultantRole ? 'bg-blue-600 text-white ring-4 ring-blue-600/10' : 'bg-slate-350 dark:bg-slate-700 text-slate-850 dark:text-slate-300 ring-4 ring-slate-700/10'
                             }`}>
                               {senderName[0].toUpperCase()}
                             </div>
                             <div className={`flex flex-col ${isConsultantRole ? 'items-end' : 'items-start'}`}>
                                <div className={`flex items-center gap-1.5 ${isConsultantRole ? 'flex-row-reverse' : 'flex-row'}`}>
                                  <span className={`text-[10px] font-black uppercase tracking-widest ${remark.isInternal ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {senderName}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                                    remark.isInternal
                                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                      : isConsultantRole 
                                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                                        : 'bg-red-500/10 text-[#ED1B2F] border border-red-500/20'
                                  }`}>
                                    {remark.isInternal && <Lock size={8} />}
                                    {remark.isInternal ? 'Internal' : isConsultantRole ? 'Support' : 'Client'}
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-500 dark:text-slate-655 font-bold tracking-tighter mt-0.5">{new Date(remark.addedAt).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                             </div>
                           </div>
                           
                           <div className={`relative p-6 rounded-[2.5rem] shadow-sm dark:shadow-2xl border transition-all duration-500 hover:scale-[1.01] ${
                             remark.isInternal
                               ? 'bg-gradient-to-br from-amber-600 to-orange-600 border-amber-500/30 text-white rounded-tr-none shadow-amber-900/20'
                               : isConsultantRole ? 'bg-blue-600 border-blue-400/30 text-white rounded-tr-none' : 'bg-slate-200 dark:bg-[#1e293b] border-slate-300 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none'
                           }`}>
                             <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{remark.text}</p>
                             
                             {remark.attachments?.length > 0 && (
                                <div className={`mt-6 pt-5 border-t space-y-3 ${isConsultantRole ? 'border-white/20' : 'border-slate-300 dark:border-white/5'}`}>
                                  {remark.attachments.map((file, fIdx) => (
                                    <div key={fIdx} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all w-full text-left ${
                                      isConsultantRole ? 'bg-white/10 border-white/10 hover:bg-white/20' : 'bg-white dark:bg-black/20 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-black/30'
                                    }`}>
                                      <div className={`p-2.5 rounded-xl ${isConsultantRole ? 'bg-white/20' : 'bg-blue-500/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400'}`}>
                                        <File size={16} strokeWidth={2.5} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black truncate uppercase tracking-tight text-slate-800 dark:text-white" title={file.originalName || file.filename}>{file.originalName || file.filename}</p>
                                        <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button 
                                          onClick={(e) => handleViewAttachment(e, rawTicketId, file._id, file.originalName || file.filename, file.mimeType || file.contentType)}
                                          className={`p-2 rounded-xl transition-all border ${
                                            isConsultantRole 
                                              ? 'bg-white/5 hover:bg-white/20 border-white/10 text-white' 
                                              : 'bg-slate-100 hover:bg-slate-205 dark:bg-white/5 dark:hover:bg-blue-500/20 border-slate-200 dark:border-white/5 text-slate-505 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                                          } cursor-pointer`}
                                          title="View File"
                                        >
                                          <Eye size={14} />
                                        </button>
                                        <button 
                                          onClick={(e) => handleDownloadAttachment(e, rawTicketId, file._id, file.originalName || file.filename)}
                                          className={`p-2 rounded-xl transition-all border ${
                                            isConsultantRole 
                                              ? 'bg-white/5 hover:bg-white/20 border-white/10 text-white' 
                                              : 'bg-slate-100 hover:bg-slate-250 dark:bg-white/5 dark:hover:bg-emerald-500/20 border-slate-200 dark:border-white/5 text-slate-505 dark:text-slate-400 hover:text-emerald-655 dark:hover:text-emerald-400'
                                          } cursor-pointer`}
                                          title="Download File"
                                        >
                                          <Download size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                             )}
                           </div>
                         </div>
                       </div>
                     );
                  })
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Resolution Console & Documents (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-10 space-y-8 sm:space-y-12 bg-slate-100/60 dark:bg-[#1e293b]/20 custom-scrollbar order-1 lg:order-2 lg:max-h-full max-h-[60vh] lg:h-auto border-b lg:border-b-0 border-slate-200 dark:border-white/5">
            
            {/* Status & Effort */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <Settings size={18} className="text-slate-500 dark:text-slate-400" />
                <h3 className="text-xs font-black text-slate-555 dark:text-slate-400 uppercase tracking-[0.2em]">Operational Controls</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-550 dark:text-slate-500 uppercase tracking-widest ml-1">Lifecycle Status</label>
                  <div className="relative">
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-[1.2rem] px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer shadow-sm">
                      <option value="Open">Open Protocol</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Resolved">Resolution Complete</option>
                    </select>
                    <Tag size={16} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-555 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-555 dark:text-slate-500 uppercase tracking-widest ml-1">Total Effort</label>
                  <div className="h-[58px] bg-gradient-to-br from-blue-600/10 to-indigo-600/10 dark:from-blue-600/20 dark:to-indigo-600/20 border border-blue-500/20 rounded-[1.2rem] flex items-center px-6 shadow-sm dark:shadow-xl">
                    <span className="text-[13px] font-black text-blue-600 dark:text-blue-400 tabular-nums">{formatHoursToHM(grandTotalHours)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Forwarding Console */}
            {canForward && ticket.status !== 'Resolved' && (
              <section className="space-y-4 bg-white dark:bg-[#1e293b]/40 p-6 rounded-[2rem] border border-blue-500/25 dark:border-blue-500/20 shadow-sm">
                <div className="flex items-center gap-3">
                  <Shield size={18} className="text-blue-500 dark:text-blue-400" />
                  <h3 className="text-xs font-black text-blue-550 dark:text-blue-450 uppercase tracking-[0.2em]">Forwarding Console</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-550 dark:text-slate-500 uppercase tracking-widest ml-1">Select Consultant to Forward To</label>
                    <select
                      value={selectedAdminId}
                      onChange={(e) => setSelectedAdminId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-blue-500/50 shadow-inner cursor-pointer"
                    >
                      <option value="">-- Choose Consultant --</option>
                      {admins.filter(a => (a._id || a.id) !== (user?._id || user?.id) && a.status === 'active').map(consultant => (
                        <option key={consultant._id || consultant.id} value={consultant._id || consultant.id} className="bg-white dark:bg-[#0f172a] text-slate-800 dark:text-white">
                          {consultant.name} ({consultant.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-555 dark:text-slate-500 uppercase tracking-widest ml-1">Forwarding Remarks</label>
                    <textarea
                      placeholder="Reason for forwarding or instructions..."
                      value={forwardRemarks}
                      onChange={(e) => setForwardRemarks(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl p-3 text-xs font-medium focus:outline-none focus:border-blue-500/50 min-h-[60px] resize-none"
                    />
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!selectedAdminId) return alert('Please select a consultant first.');
                        setIsForwarding(true);
                        try {
                          await forwardTicket(rawTicketId, selectedAdminId, forwardRemarks);
                          setSelectedAdminId('');
                          setForwardRemarks('');
                          alert('Ticket forwarded successfully!');
                        } catch (err) {
                          alert(err.response?.data?.message || 'Failed to forward ticket.');
                        } finally {
                          setIsForwarding(false);
                        }
                      }}
                      disabled={isForwarding || !selectedAdminId}
                      className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isForwarding ? 'Forwarding...' : 'Forward Ticket'}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Work Logs */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Activity size={18} className="text-emerald-500 dark:text-emerald-400" />
                  <h3 className="text-xs font-black text-slate-550 dark:text-slate-400 uppercase tracking-[0.2em]">Effort Logging</h3>
                </div>
                <button onClick={addWorkLogRow} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-650 dark:text-emerald-400 uppercase tracking-widest transition-all cursor-pointer">
                  <Plus size={12} strokeWidth={3} /> Append Entry
                </button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {workLogEntries.map((entry, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="flex gap-3 items-center group">
                      <input type="date" value={entry.date} onChange={e => updateWorkLogRow(idx, 'date', e.target.value)} className="flex-[2] bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner" />
                      <div className="relative flex-1">
                        <input type="number" min="0" placeholder="Hours" value={entry.hours} onChange={e => updateWorkLogRow(idx, 'hours', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl pl-4 pr-10 py-3 text-sm font-black focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner tabular-nums text-right" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-bold uppercase">hrs</span>
                      </div>
                      <div className="relative flex-1">
                        <input type="number" min="0" max="59" placeholder="Mins" value={entry.minutes} onChange={e => updateWorkLogRow(idx, 'minutes', e.target.value)} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-xl pl-4 pr-10 py-3 text-sm font-black focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner tabular-nums text-right" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-bold uppercase">mins</span>
                      </div>
                      <button onClick={() => removeWorkLogRow(idx)} disabled={workLogEntries.length === 1} className="p-3 text-slate-500 hover:text-red-600 disabled:opacity-0 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer">
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>

            {/* Resolution Form */}
            <section className="space-y-6">
              <div className="space-y-3">
                <label className={`text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2 ${status === 'Resolved' ? 'text-emerald-500' : 'text-slate-500'}`}>
                  {status === 'Resolved' && <CheckCircle size={14} />} Final Technical Solution {status === 'Resolved' && '*'}
                </label>
                <textarea 
                  value={solution} 
                  onChange={(e) => setSolution(e.target.value)} 
                  rows={5} 
                  placeholder="Comprehensive summary of the permanent fix..." 
                  className={`w-full bg-slate-50 dark:bg-[#0f172a] border rounded-[2rem] px-6 py-5 text-[15px] font-medium text-slate-800 dark:text-white focus:outline-none transition-all resize-none shadow-sm ${
                    status === 'Resolved' ? 'border-emerald-500/30 focus:border-emerald-500 shadow-emerald-500/5' : 'border-slate-200 dark:border-white/5 focus:border-blue-500/50'
                  }`}
                />
              </div>

                             <div className="space-y-3">
                 <div className="flex items-center justify-between mb-1.5">
                   <label className="text-[10px] font-black text-slate-550 dark:text-slate-500 uppercase tracking-widest ml-1">Communication / Internal Collaboration</label>
                   <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 cursor-pointer select-none uppercase tracking-wider transition-colors hover:text-amber-500">
                     <input 
                       type="checkbox" 
                       checked={isInternal} 
                       onChange={(e) => setIsInternal(e.target.checked)}
                       className="rounded bg-[#111620] border-white/20 text-amber-500 focus:ring-amber-500" 
                     />
                     <span className="flex items-center gap-1">
                       <Lock size={10} />
                       Internal Collaboration Note (Hidden from Client)
                     </span>
                   </label>
                 </div>
                 <div className="relative group/reply">
                   <textarea 
                     value={reply} 
                     onChange={(e) => setReply(e.target.value)} 
                     rows={4} 
                     placeholder={isInternal ? "Share technical notes or collaborate with other assigned consultants..." : "Provide conversational updates to the user..."} 
                     className={`w-full bg-slate-50 dark:bg-[#0f172a] border rounded-[2rem] px-6 py-5 text-[15px] font-medium text-slate-800 dark:text-white focus:outline-none transition-all resize-none shadow-sm pr-24 ${
                       isInternal 
                         ? 'border-amber-500/30 focus:border-amber-500/60 shadow-amber-500/5' 
                         : 'border-slate-200 dark:border-white/10 focus:border-blue-500/50'
                     }`}
                   />
                   <div className="absolute right-4 bottom-4 flex items-center gap-2">
                     {remarkFiles.length > 0 && <span className={`text-[9px] px-2.5 py-1 rounded-full font-black animate-pulse ${isInternal ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white'}`}>{remarkFiles.length} FILES</span>}
                     <button type="button" onClick={() => remarkFileInputRef.current?.click()} className="p-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-blue-500/20 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-2xl border border-slate-200 dark:border-white/5 transition-all shadow-lg cursor-pointer">
                       <UploadCloud size={20} />
                     </button>
                     <input type="file" ref={remarkFileInputRef} multiple className="hidden" onChange={handleRemarkFileChange} />
                   </div>
                 </div>
               </div>

            </section>

            {/* Supporting Media */}
            <section className="space-y-4">
              <label className="text-[10px] font-black text-slate-555 dark:text-slate-500 uppercase tracking-widest ml-1">Knowledge Base Attachments</label>
              <div onClick={() => fileInputRef.current?.click()} className="group w-full bg-slate-50 dark:bg-black/40 border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-blue-500/50 rounded-[2.5rem] p-10 text-center cursor-pointer transition-all hover:bg-blue-600/[0.02]">
                <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-505 dark:text-blue-400 mx-auto mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-md">
                  <UploadCloud size={32} />
                </div>
                <p className="text-slate-800 dark:text-white font-bold text-sm tracking-wide group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">Synchronize Support Data</p>
                <p className="text-[10px] text-slate-505 dark:text-slate-655 font-black uppercase tracking-widest mt-2">All assets accepted • 10MB Threshold</p>
                {adminFiles.length > 0 && <div className="mt-6 flex flex-wrap justify-center gap-2">
                   {adminFiles.map((f, i) => <span key={i} className="px-3 py-1.5 bg-blue-600 text-white text-[10px] font-black rounded-lg uppercase tracking-tighter animate-in zoom-in">{f.name}</span>)}
                </div>}
                <input type="file" ref={fileInputRef} multiple className="hidden" onChange={handleFileChange} />
              </div>
            </section>
          </div>
        </div>

        {/* Global Footer */}
        <div className="px-6 sm:px-10 py-6 sm:py-8 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0a0f1a]/80 backdrop-blur-2xl flex flex-col sm:flex-row justify-between items-center gap-6 sticky bottom-0 z-[80] shrink-0">
           <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex flex-col">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Cumulative Effort</span>
                <p className="text-lg sm:text-xl font-black text-slate-850 dark:text-white tabular-nums tracking-tighter">{formatHoursToHM(grandTotalHours)}</p>
              </div>
              <div className="w-px h-8 sm:h-10 bg-slate-200 dark:bg-white/10 hidden xs:block" />
              <div className="flex flex-col hidden xs:flex">
                <span className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Assigned To</span>
                <p className="text-[12px] sm:text-[14px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px] sm:max-w-none">{ticket.assignee || 'Unassigned Support'}</p>
              </div>
           </div>

           <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
            <button onClick={onClose} className="flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] cursor-pointer">Discard</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit} className="flex-[2] sm:flex-none px-6 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2 sm:gap-3 transition-all shadow-[0_20px_40px_rgba(37,99,235,0.2)] cursor-pointer">
              Transmit <Send size={16} strokeWidth={3} className="hidden sm:block" /> <Send size={14} strokeWidth={3} className="sm:hidden" />
            </motion.button>
           </div>
        </div>
      </motion.div>

      {/* Inline File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                window.URL.revokeObjectURL(previewFile.url);
                setPreviewFile(null);
              }}
              className="fixed inset-0 bg-[#020617]/90 backdrop-blur-2xl z-[90]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-4 sm:inset-10 md:inset-20 z-[100] flex flex-col bg-[#0f172a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden font-sans"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-white/5 bg-[#1e293b]/50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <File size={20} className="text-blue-400" />
                  <span className="text-[14px] font-black text-white truncate max-w-xs sm:max-w-md uppercase tracking-wider">{previewFile.filename}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = previewFile.url;
                      a.download = previewFile.filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="p-2.5 bg-white/5 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 rounded-xl transition-all border border-white/5 cursor-pointer"
                    title="Download File"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={() => {
                      window.URL.revokeObjectURL(previewFile.url);
                      setPreviewFile(null);
                    }}
                    className="p-2.5 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-white/5 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-slate-950/20">
                {previewFile.mimeType?.startsWith('image/') ? (
                  <img
                    src={previewFile.url}
                    alt={previewFile.filename}
                    className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl border border-white/5"
                  />
                ) : previewFile.mimeType === 'application/pdf' ? (
                  <iframe
                    src={previewFile.url}
                    className="w-full h-full min-h-[60vh] rounded-2xl border border-white/5 bg-white"
                    title={previewFile.filename}
                  />
                ) : previewFile.excelData ? (
                  renderExcelTable(previewFile.excelData)
                ) : previewFile.filename?.toLowerCase()?.endsWith('.csv') ? (
                  renderCSVTable(previewFile.textContent)
                ) : previewFile.textContent ? (
                  <pre className="w-full max-w-4xl text-left bg-slate-900 text-slate-350 p-8 rounded-2xl overflow-auto max-h-[70vh] font-mono text-[13px] whitespace-pre-wrap border border-white/5 shadow-inner custom-scrollbar">
                    {previewFile.textContent}
                  </pre>
                ) : (
                  <div className="text-center p-12 bg-white/[0.02] border border-white/5 rounded-3xl max-w-md">
                    <File size={48} className="text-slate-655 mx-auto mb-4 opacity-50" />
                    <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest mb-4">Inline Preview Unavailable</p>
                    <p className="text-[11px] text-slate-500 font-medium mb-6">This file type ({previewFile.mimeType || 'unknown'}) cannot be displayed inline.</p>
                    <button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = previewFile.url;
                        a.download = previewFile.filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg cursor-pointer"
                    >
                      Download to View
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
