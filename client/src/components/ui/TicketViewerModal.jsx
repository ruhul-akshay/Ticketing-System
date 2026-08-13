import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Clock, AlertCircle, Building2, Tag, CheckCircle, Download, File, Star, Send, MessageSquare, UploadCloud, Radio, Shield, User, Settings, Trash2, ChevronDown, Eye, Lock, ExternalLink } from 'lucide-react';
import api from '../../api/mockAxios';
import { useTicketStore } from '../../store/useTicketStore';
import { useAuthStore } from '../../store/useAuthStore';
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
    <div className="w-full h-full overflow-auto bg-[#111620] border border-white/5 rounded-2xl custom-scrollbar shadow-inner text-left">
      <table className="w-full border-collapse text-[13px]">
        <thead className="sticky top-0 z-10 border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
          <tr>
            {rows[0].map((cell, idx) => (
              <th key={idx} className="p-4 text-left whitespace-nowrap border-r border-white/5 bg-[#181f2b] text-slate-300">{cell}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-slate-300">
          {rows.slice(1).map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="p-4 min-w-[150px] whitespace-normal break-words border-r border-white/5" title={cell}>{cell}</td>
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
    <div className="w-full h-full overflow-auto bg-[#111620] border border-white/5 rounded-2xl custom-scrollbar shadow-inner text-left">
      <table className="w-full border-collapse text-[13px]">
        <thead className="sticky top-0 z-10 border-b border-white/10 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
          <tr>
            {excelData[0].map((cell, idx) => (
              <th key={idx} className="p-4 text-left whitespace-nowrap border-r border-white/5 bg-[#181f2b] text-slate-300">{cell !== undefined && cell !== null ? String(cell) : ''}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-slate-300">
          {excelData.slice(1).map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="p-4 min-w-[150px] whitespace-normal break-words border-r border-white/5" title={cell !== undefined && cell !== null ? String(cell) : ''}>
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

const getStatusColor = (status) => {
  switch (status) {
    case 'Open': return 'bg-red-500/20 text-red-500 border-red-500/30';
    case 'Resolved': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
    case 'On Hold': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
    case 'Cancelled': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High': case 'Critical': return 'text-red-400';
    case 'Medium': return 'text-yellow-400';
    case 'Low': return 'text-emerald-400';
    default: return 'text-gray-400';
  }
};

export default function TicketViewerModal({ ticket: initialTicket, isOpen, onClose }) {
  const liveTicket = useTicketStore((state) => {
    const targetId = String(initialTicket?.id || initialTicket?._id || initialTicket?.original?._id || '');
    return state.tickets.find((t) => String(t.id || t._id || t.original?._id) === targetId) || initialTicket;
  });

  const { fetchTickets } = useTicketStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [previewFile, setPreviewFile] = React.useState(null); // { url, filename, mimeType, textContent }

  // Auto-open feedback form for resolved tickets without a rating (for the ticket owner)
  const [showFeedbackForm, setShowFeedbackForm] = React.useState(false);
  const [rating, setRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const { consultants, fetchConsultants, isLoading: consultantsLoading } = useConsultantStore();
  const { assignTicket, forwardTicket, deleteTicket, updateTicketStatus } = useTicketStore();
  
  const [selectedConsultantId, setSelectedConsultantId] = React.useState('');
  const [assignRemarks, setAssignRemarks] = React.useState('');
  const [isAssigning, setIsAssigning] = React.useState(false);
  const [ccConsultantIds, setCcConsultantIds] = React.useState([]);
  const [assignCcDropdownOpen, setAssignCcDropdownOpen] = React.useState(false);

  const [selectedForwardConsultantId, setSelectedForwardConsultantId] = React.useState('');
  const [forwardRemarks, setForwardRemarks] = React.useState('');
  const [isForwarding, setIsForwarding] = React.useState(false);
  const [forwardCcConsultantIds, setForwardCcConsultantIds] = React.useState([]);
  const [forwardCcDropdownOpen, setForwardCcDropdownOpen] = React.useState(false);
  const [forwardCcEmails, setForwardCcEmails] = React.useState('');

  const [activeConsoleTab, setActiveConsoleTab] = React.useState('assign'); // 'assign' | 'forward' | 'status' | 'worklog'
  const [solutionText, setSolutionText] = React.useState('');
  const [workLogHoursInput, setWorkLogHoursInput] = React.useState('');
  const [workLogMinutesInput, setWorkLogMinutesInput] = React.useState('');
  const [workLogDate, setWorkLogDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [statusInput, setStatusInput] = React.useState('');

  // Conversation input state
  const [replyText, setReplyText] = React.useState('');
  const [replyFiles, setReplyFiles] = React.useState([]);
  const [isInternal, setIsInternal] = React.useState(false);
  const replyFileRef = useRef(null);

  const ticket = liveTicket || {};

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
  const userRoleLower = user?.role?.toLowerCase()?.replace(/\s+/g, '') || '';
  const isCurrentSuperAdmin = userRoleLower === 'superadmin';
  const isCurrentConsultant = userRoleLower === 'consultant' || userRoleLower === 'admin' || isCurrentSuperAdmin;
  const isClientRole = user && (user.role === 'User' || user.role === 'user' || userRoleLower === 'user' || user.role === 'Client User' || userRoleLower === 'clientuser');
  const isSameClient = isClientRole && user.client && (ticket.createdBy?.client?._id === user.client || ticket.createdBy?.client === user.client || ticket.clientName === user.clientName);
  const isOwner = ticket.creatorId && user && isClientRole && (ticket.creatorId === user.id || ticket.creatorId === user._id || (user.isPrimaryContact && isSameClient));
  const hasNoFeedback = !ticket.original?.feedback?.rating;
  const isResolved = ticket.status === 'Resolved';
  const rawTicketId = ticket.original?._id || ticket.id;

  const grandTotalHours = React.useMemo(() => {
    const logs = ticket.workLogs || ticket.original?.workLogs || [];
    return logs.reduce((sum, log) => sum + (Number(log.hours) || 0), 0);
  }, [ticket.workLogs, ticket.original?.workLogs]);

  React.useEffect(() => {
    if (!isOpen || !liveTicket) return;

    const interval = setInterval(() => {
      fetchTickets().catch(err => console.error('Error polling tickets:', err));
    }, 4000); // Poll every 4 seconds

    return () => clearInterval(interval);
  }, [isOpen, liveTicket?.id, fetchTickets]);

  // Reset/sync state when the ticket changes or modal opens
  React.useEffect(() => {
    if (isOpen && liveTicket) {
      const isLiveClientRole = user && (user.role === 'User' || user.role === 'user' || user.role === 'Client User' || user?.role?.toLowerCase() === 'client user' || user?.role?.toLowerCase() === 'clientuser');
      const isLiveSameClient = isLiveClientRole && user.client && (liveTicket.createdBy?.client?._id === user.client || liveTicket.createdBy?.client === user.client || liveTicket.clientName === user.clientName);
      const liveIsOwner = isLiveClientRole && (liveTicket.creatorId === user?.id || liveTicket.creatorId === user?._id || (user.isPrimaryContact && isLiveSameClient));
      const liveHasNoFeedback = !liveTicket.original?.feedback?.rating;
      const liveIsResolved = liveTicket.status === 'Resolved';
      setShowFeedbackForm(!!(liveIsOwner && liveIsResolved && liveHasNoFeedback));
      setRating(0);
      setHoverRating(0);
      setComment('');
      setIsSubmitting(false);
      setReplyText('');
      setReplyFiles([]);
      setStatusInput(liveTicket.status || 'Open');
      setSolutionText(liveTicket.original?.solution || '');
      setActiveConsoleTab(isCurrentSuperAdmin ? 'assign' : 'forward');

      if (isCurrentConsultant) {
        // Always fetch (caching prevents redundant network calls)
        fetchConsultants().catch(err => console.error('Error fetching consultants:', err));
        const ticketId = liveTicket.id || liveTicket._id || liveTicket.original?._id;
        const openedByList = (liveTicket.openedBy || liveTicket.original?.openedBy || []).map(id => id.toString());
        const userId = (user?.id || user?._id)?.toString();
        if (ticketId && userId && !openedByList.includes(userId)) {
          useTicketStore.getState().markTicketAsOpened(ticketId);
        }
      }
      if (isCurrentSuperAdmin) {
        // SuperAdmin also needs consultants for assign/forward tabs
        fetchConsultants().catch(err => console.error('Error fetching consultants (superadmin):', err));
      }
    }
  }, [liveTicket?.id, isOpen, user]);

  const handleSubmitFeedback = async () => {
    if (rating === 0) return alert('Please select a rating');
    setIsSubmitting(true);
    try {
      const ticketId = ticket.original?._id || ticket.id;
      await api.post(`/tickets/${ticketId}/feedback`, { rating, comment });
      
      // Update local state before closing for immediate feedback
      setShowFeedbackForm(false);
      await fetchTickets();
      
      // Show success briefly or just close
      onClose();
    } catch (err) {
      console.error('Feedback Error:', err);
      const msg = err.response?.data?.message || 'Failed to submit feedback. Please try again.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendRemark = async () => {
    const text = replyText.trim();
    const files = replyFiles;
    if (!text && files.length === 0) return;

    setIsSubmitting(true);
    try {
      await useTicketStore.getState().updateTicketStatus(ticket.id, ticket.status, text, null, [], [], files, isInternal);
      setReplyText('');
      setReplyFiles([]);
      setIsInternal(false);
      if (replyFileRef.current) replyFileRef.current.value = '';
      await fetchTickets();
    } catch (err) {
      console.error('Send remark error:', err);
      alert(err?.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLifecycleStatus = async () => {
    if (!statusInput) return alert('Please select a status.');
    setIsSubmitting(true);
    try {
      await updateTicketStatus(ticket.id, statusInput, null, solutionText || null, []);
      alert('Ticket status updated successfully!');
      await fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddWorkLogHours = async () => {
    const hrsVal = Number(workLogHoursInput || 0);
    const minsVal = Number(workLogMinutesInput || 0);
    if (hrsVal < 0 || minsVal < 0 || (hrsVal === 0 && minsVal === 0)) {
      return alert('Please enter a valid amount of time.');
    }
    const hours = hrsVal + (minsVal / 60);
    setIsSubmitting(true);
    try {
      const logs = [{ date: workLogDate, hours }];
      await updateTicketStatus(ticket.id, ticket.status, null, null, logs);
      setWorkLogHoursInput('');
      setWorkLogMinutesInput('');
      alert('Effort logged successfully!');
      await fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to log effort.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (window.confirm('WARNING: Are you sure you want to completely erase this ticket from existence? This action is irreversible.')) {
      try {
        await deleteTicket(ticket.id);
        alert('Ticket deleted successfully.');
        onClose();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete ticket.');
      }
    }
  };

  const handleDownloadAttachment = async (e, ticketId, attachmentId, filename) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'https://ticketing-backend-61yr.onrender.com/api';
      const response = await fetch(`${baseUrl}/tickets/${ticketId}/attachment/${attachmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 5000);
    } catch (err) {
      console.error('Error downloading file:', err);
      alert('Failed to download file'); 
    }
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

  return (
    <AnimatePresence>
      {(isOpen && initialTicket && liveTicket) ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#020617]/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
          className="bg-[#111620] border border-white/10 w-full max-w-2xl rounded-[2rem] shadow-[0_0_80px_rgba(0,0,0,0.6)] overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-white/5 bg-[#181f2b]/50 backdrop-blur-xl flex justify-between items-start sticky top-0 z-20">
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">{ticket.ticketNumber || ticket.id}</span>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(ticket.status)} uppercase tracking-wider`}>
                  {ticket.status}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight pr-8">{ticket.title}</h2>
            </div>
            <div className="flex items-center gap-3 absolute right-6 top-6">
              {isCurrentConsultant && ticket.status !== 'Resolved' && (
                <button 
                  onClick={() => {
                    setActiveConsoleTab('forward');
                    setTimeout(() => {
                      const bodyEl = document.querySelector('.overflow-y-auto.relative.scroll-smooth');
                      if (bodyEl) bodyEl.scrollTop = bodyEl.scrollHeight;
                    }, 50);
                  }} 
                  className="p-2 bg-white/5 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400 rounded-xl transition-all border border-white/5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                  title="Forward Ticket"
                >
                  <Send size={13} />
                  <span className="hidden sm:inline">Forward</span>
                </button>
              )}
              {isCurrentConsultant && (
                <button
                  onClick={() => {
                    const tid = ticket.ticketNumber || ticket.id || ticket._id;
                    onClose();
                    navigate(`/consultant/tickets?ticketId=${tid}`);
                  }}
                  className="p-2 bg-white/5 hover:bg-violet-500/20 text-slate-400 hover:text-violet-400 rounded-xl transition-all border border-white/5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                  title="Open Full Ticket Panel"
                >
                  <ExternalLink size={13} />
                  <span className="hidden sm:inline">Open Ticket</span>
                </button>
              )}
              <button 
                onClick={handleDownloadTicketDetails}
                className="p-2 bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 rounded-xl transition-all border border-white/5 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                title="Download Ticket Details"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Download</span>
              </button>
              <button 
                onClick={onClose} 
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors border border-white/5 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 overflow-y-auto relative scroll-smooth flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/5 blur-[100px] pointer-events-none" />
            
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8 relative z-10">
              <div className="bg-[#1d2633]/50 border border-white/5 p-4 rounded-[1.2rem] flex flex-col gap-1.5 items-start shadow-inner">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><AlertCircle size={13} /> Priority</span>
                <span className={`text-[14px] font-black tracking-wide uppercase ${getPriorityColor(ticket.priority)}`}>{ticket.priority}</span>
              </div>
              <div className="bg-[#1d2633]/50 border border-white/5 p-4 rounded-[1.2rem] flex flex-col gap-1.5 items-start shadow-inner">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Building2 size={13} className="text-blue-400" /> Client</span>
                <span className="text-[14px] font-bold text-white tracking-wide truncate w-full" title={ticket.clientName || ticket.original?.createdBy?.clientName || ticket.original?.createdBy?.client?.name || 'Self/Internal'}>
                  {ticket.clientName || ticket.original?.createdBy?.clientName || ticket.original?.createdBy?.client?.name || 'Self/Internal'}
                </span>
              </div>
              <div className="bg-[#1d2633]/50 border border-white/5 p-4 rounded-[1.2rem] flex flex-col gap-1.5 items-start shadow-inner">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><User size={13} className="text-purple-400" /> Assigned To</span>
                <span className="text-[14px] font-bold text-white tracking-wide truncate w-full" title={ticket.assignedTo?.name || ticket.original?.assignedTo?.name || 'Unassigned'}>
                  {ticket.assignedTo?.name || ticket.original?.assignedTo?.name || 'Unassigned'}
                </span>
              </div>
              <div className="bg-[#1d2633]/50 border border-white/5 p-4 rounded-[1.2rem] flex flex-col gap-1.5 items-start shadow-inner">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Clock size={13} className="text-emerald-400" /> Effort Logging</span>
                <span className="text-[13px] font-black text-emerald-400 tracking-wide">{formatHoursToHM(grandTotalHours)}</span>
              </div>
              <div className="bg-[#1d2633]/50 border border-white/5 p-4 rounded-[1.2rem] flex flex-col gap-1.5 items-start shadow-inner">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Building2 size={13} /> Dept</span>
                <span className="text-[14px] font-bold text-white tracking-wide truncate w-full">{ticket.department}</span>
              </div>
              <div className="bg-[#1d2633]/50 border border-white/5 p-4 rounded-[1.2rem] flex flex-col gap-1.5 items-start shadow-inner">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Tag size={13} /> Category</span>
                <span className="text-[14px] font-bold text-white tracking-wide truncate w-full">{ticket.original?.category || 'General'}</span>
              </div>
              <div className="bg-[#1d2633]/50 border border-white/5 p-4 rounded-[1.2rem] flex flex-col gap-1.5 items-start shadow-inner col-span-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><Clock size={13} /> Created</span>
                <span className="text-[13px] font-bold text-white tracking-wide">
                  {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {isResolved && (
                <div className="bg-[#1d2633]/50 border border-emerald-500/20 p-4 rounded-[1.2rem] flex flex-col gap-1.5 items-start shadow-inner col-span-2 sm:col-span-1">
                  <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5"><CheckCircle size={13} /> Solved</span>
                  <span className="text-[13px] font-bold text-emerald-400 tracking-wide">
                    {ticket.original?.solvedAt || ticket.original?.actualResolutionDate ? (
                      <>
                        {new Date(ticket.original.solvedAt || ticket.original.actualResolutionDate).toLocaleDateString()}
                      </>
                    ) : (
                      'N/A'
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="relative z-10 mb-8">
              <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">Description</h3>
              <div className="bg-[#1d2633] border border-white/5 p-6 rounded-2xl text-[14px] text-slate-300 leading-relaxed font-medium shadow-inner whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>

            {/* Attachments */}
            <div className="relative z-10 mb-8">
              <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">User Attachments</h3>
              {(!ticket.attachments?.length && !ticket.original?.attachments?.length) ? (
                <div className="bg-[#1d2633]/50 border border-white/5 p-4 rounded-xl text-center text-slate-500 text-[13px] font-medium italic shadow-inner">
                  No user attachments provided
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {(ticket.attachments?.length > 0 ? ticket.attachments : (ticket.original?.attachments || [])).map((file) => (
                    <div key={file._id} className="bg-[#1d2633] border border-white/5 p-4 rounded-xl flex items-center justify-between shadow-inner">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
                          <File size={16} className="text-blue-400" />
                        </div>
                        <span className="text-[14px] font-medium text-slate-200 truncate">{file.originalName || file.filename}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={(e) => handleViewAttachment(e, rawTicketId, file._id, file.originalName || file.filename, file.mimeType || file.contentType)}
                          className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5 cursor-pointer"
                          title="View Attachment"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDownloadAttachment(e, rawTicketId, file._id, file.originalName || file.filename)}
                          className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors border border-white/5 cursor-pointer"
                          title="Download Attachment"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Final Technical Solution & Knowledge Base Attachments */}
            {(ticket.original?.solution || ticket.solution || ticket.adminAttachments?.length > 0 || ticket.original?.adminAttachments?.length > 0) && (
              <div className="relative z-10 mb-8">
                <h3 className="text-[13px] font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <CheckCircle size={15} /> Final Technical Solution & Knowledge Base Attachments
                </h3>
                <div className="bg-[#1d2633] border border-emerald-500/20 p-6 rounded-2xl space-y-4 shadow-inner">
                  {(ticket.original?.solution || ticket.solution) ? (
                    <div className="text-[14px] text-slate-200 leading-relaxed font-semibold whitespace-pre-wrap">
                      {ticket.original?.solution || ticket.solution}
                    </div>
                  ) : (
                    <p className="text-[13px] text-slate-500 italic">No solution text recorded.</p>
                  )}
                  
                  {/* Knowledge Base Attachments inside Solution */}
                  {(ticket.adminAttachments?.length > 0 || ticket.original?.adminAttachments?.length > 0) && (
                    <div className="border-t border-white/5 pt-4">
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Knowledge Base Attachments</h4>
                      <div className="flex flex-col gap-2">
                        {(ticket.adminAttachments?.length > 0 ? ticket.adminAttachments : (ticket.original?.adminAttachments || [])).map((file) => (
                          <div key={file._id} className="bg-black/25 border border-white/5 p-3 rounded-xl flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="p-2 bg-emerald-500/10 rounded-lg shrink-0">
                                <File size={14} className="text-emerald-400" />
                              </div>
                              <span className="text-[13px] font-medium text-slate-200 truncate">{file.originalName || file.filename}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span 
                                onClick={(e) => handleViewAttachment(e, rawTicketId, file._id, file.originalName || file.filename, file.mimeType || file.contentType)}
                                className="p-2 bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-white rounded-lg transition-colors border border-emerald-500/20 cursor-pointer flex items-center justify-center"
                                title="View Attachment"
                              >
                                <Eye size={14} />
                              </span>
                              <span 
                                onClick={(e) => handleDownloadAttachment(e, rawTicketId, file._id, file.originalName || file.filename)}
                                className="p-2 bg-white/5 hover:bg-white/10 text-emerald-400 hover:text-white rounded-lg transition-colors border border-emerald-500/20 cursor-pointer flex items-center justify-center"
                                title="Download Attachment"
                              >
                                <Download size={14} />
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Supporting Documents */}
            <div className="relative z-10 mb-8">
              <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">Supporting Documents</h3>
              {(!ticket.supportingDocuments?.length && !ticket.original?.supportingDocuments?.length) ? (
                <div className="bg-[#1d2633]/50 border border-purple-500/5 p-4 rounded-xl text-center text-slate-500 text-[13px] font-medium italic shadow-inner">
                  No supporting documents provided
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {(ticket.supportingDocuments?.length > 0 ? ticket.supportingDocuments : (ticket.original?.supportingDocuments || [])).map((file) => (
                    <div key={file._id} className="bg-[#1d2633] border border-purple-500/10 p-4 rounded-xl flex items-center justify-between shadow-inner">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
                          <File size={16} className="text-purple-400" />
                        </div>
                        <span className="text-[14px] font-medium text-slate-200 truncate">{file.originalName || file.filename}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={(e) => handleViewAttachment(e, rawTicketId, file._id, file.originalName || file.filename, file.mimeType || file.contentType)}
                          className="p-2 bg-white/5 hover:bg-white/10 text-purple-400 hover:text-white rounded-lg transition-colors border border-purple-500/20 cursor-pointer"
                          title="View Supporting Document"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => handleDownloadAttachment(e, rawTicketId, file._id, file.originalName || file.filename)}
                          className="p-2 bg-white/5 hover:bg-white/10 text-purple-400 hover:text-white rounded-lg transition-colors border border-purple-500/20 cursor-pointer"
                          title="Download Supporting Document"
                        >
                          <Download size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reason */}
            {ticket.original?.reason && (
              <div className="relative z-10 mb-8">
                 <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-3">Reported Reason</h3>
                 <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400 text-[13px] font-bold tracking-wide">
                    <AlertCircle size={16} /> {ticket.original.reason}
                 </div>
              </div>
            )}

            {/* Assignment & Forwarding History */}
            <div className="relative z-10 mb-8 bg-[#1e293b]/30 p-6 rounded-2xl border border-white/5 shadow-inner">
              <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Clock size={14} className="text-blue-400" /> Assignment & Forwarding History
              </h3>
              {(!ticket.assignmentHistory || ticket.assignmentHistory.length === 0) ? (
                <p className="text-[13px] text-slate-500 italic">No assignment history logged.</p>
              ) : (
                <div className="relative border-l border-white/10 pl-6 ml-2.5 space-y-6">
                  {ticket.assignmentHistory.map((item, index) => {
                    const isInitial = item.action === 'initial_assignment';
                    const isAssign = item.action === 'assign';
                    const isForward = item.action === 'forward';

                    return (
                      <div key={index} className="relative">
                        {/* Dot */}
                        <div className={`absolute -left-[31px] top-1.5 w-3 h-3 rounded-full border-2 ${
                          isInitial ? 'bg-blue-500 border-[#111620]' : isAssign ? 'bg-purple-500 border-[#111620]' : 'bg-amber-500 border-[#111620]'
                        }`} />
                        
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-slate-300">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                              isInitial ? 'bg-blue-500/10 text-blue-400' : isAssign ? 'bg-purple-500/10 text-purple-400' : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {isInitial ? 'Auto Assign' : isAssign ? 'Assign' : 'Forward'}
                            </span>
                            <span className="font-bold text-white">
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
                            <p className="text-[12px] text-slate-400 font-medium italic mt-1 bg-black/20 p-2.5 rounded-xl border border-white/5">
                              "{item.remarks}"
                            </p>
                          )}
                          
                          <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-1">
                            {new Date(item.actionDate).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Super Admin / Consultant Ticket Operations Console */}
            {isCurrentConsultant && ticket.status !== 'Resolved' && (
              <div className="relative z-10 mb-8 bg-slate-50 dark:bg-[#181f2b]/95 p-6 rounded-[2rem] border border-slate-200 dark:border-blue-500/20 shadow-xl space-y-6">
                <h3 className="text-[14px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 dark:border-white/5 pb-3">
                  <Shield size={16} /> {isCurrentSuperAdmin ? 'Super Admin Control Console' : 'Consultant Operations Console'}
                </h3>
                
                {/* Tab controls */}
                <div className="flex flex-wrap gap-2 bg-slate-200/50 dark:bg-[#111620] p-1.5 rounded-2xl border border-slate-200/60 dark:border-white/5">
                  {isCurrentSuperAdmin && (
                    <button
                      type="button"
                      onClick={() => setActiveConsoleTab('assign')}
                      className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeConsoleTab === 'assign' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'}`}
                    >
                      <User size={14} /> Assign
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveConsoleTab('forward')}
                    className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeConsoleTab === 'forward' ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'}`}
                  >
                    <Send size={14} /> Forward
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConsoleTab('status')}
                    className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeConsoleTab === 'status' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'}`}
                  >
                    <Settings size={14} /> Status
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveConsoleTab('worklog')}
                    className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeConsoleTab === 'worklog' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-white/5'}`}
                  >
                    <Clock size={14} /> Log Hours
                  </button>
                  {isCurrentSuperAdmin && (
                    <button
                      type="button"
                      onClick={handleDeleteTicket}
                      className="py-2.5 px-4 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>

                {/* Tab content panel */}
                <div className="bg-white dark:bg-[#111620] p-5 rounded-2xl border border-slate-200 dark:border-white/5 min-h-[180px] flex flex-col justify-between shadow-inner">
                  {activeConsoleTab === 'assign' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[12px] font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span> Manual Assignment
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">Assign or update the primary consultant key for this ticket scope.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest ml-0.5">Select Consultant</label>
                          <select
                            value={selectedConsultantId}
                            onChange={(e) => setSelectedConsultantId(e.target.value)}
                            className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-white text-[12px] font-bold focus:outline-none focus:border-purple-500/50 shadow-inner cursor-pointer w-full disabled:opacity-60"
                            disabled={consultantsLoading && consultants.length === 0}
                          >
                            <option value="">
                              {consultantsLoading && consultants.length === 0 ? 'Loading consultants...' : '-- Choose Consultant --'}
                            </option>
                            {consultants.filter(c => c.status === 'active').map(consultant => (
                              <option key={consultant._id || consultant.id} value={consultant._id || consultant.id}>
                                {consultant.name} ({consultant.email})
                              </option>
                            ))}
                          </select>
                        </div>
 
                        <div className="flex flex-col gap-1.5 relative">
                          <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest ml-0.5">CC Consultants (Optional)</label>
                          <div 
                            onClick={() => setAssignCcDropdownOpen(!assignCcDropdownOpen)}
                            className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-slate-850 dark:text-white text-[12px] font-bold flex justify-between items-center cursor-pointer select-none shadow-inner"
                          >
                            <span className="truncate">
                              {ccConsultantIds.length === 0 
                                ? '-- Choose CCs --' 
                                : `${ccConsultantIds.length} Selected`}
                            </span>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${assignCcDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                          {assignCcDropdownOpen && (
                            <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-white/10 rounded-xl max-h-[120px] overflow-y-auto p-2.5 z-20 space-y-1.5 shadow-xl custom-scrollbar">
                              {consultants.filter(c => c.status === 'active' && String(c._id || c.id) !== String(selectedConsultantId)).map(c => {
                                const isChecked = ccConsultantIds.includes(c._id || c.id);
                                return (
                                  <label 
                                    key={c._id || c.id} 
                                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer select-none text-[11px]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setCcConsultantIds(prev => prev.includes(c._id || c.id) ? prev.filter(id => id !== (c._id || c.id)) : [...prev, (c._id || c.id)]);
                                      }}
                                      className="rounded text-purple-600 focus:ring-0 cursor-pointer"
                                    />
                                    <span className="truncate text-slate-700 dark:text-slate-200">{c.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest ml-0.5">Remarks / Directives</label>
                          <textarea
                            placeholder="Add assignment instructions..."
                            value={assignRemarks}
                            onChange={(e) => setAssignRemarks(e.target.value)}
                            className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[12px] text-slate-800 dark:text-white focus:outline-none focus:border-purple-500/50 min-h-[50px] resize-none w-full shadow-inner placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!selectedConsultantId) return alert('Please select a consultant first.');
                            setIsAssigning(true);
                            try {
                              await assignTicket(rawTicketId, selectedConsultantId, assignRemarks, ccConsultantIds);
                              setSelectedConsultantId('');
                              setAssignRemarks('');
                              setCcConsultantIds([]);
                              setAssignCcDropdownOpen(false);
                              alert('Ticket assigned successfully!');
                            } catch (err) {
                              alert(err.response?.data?.message || 'Failed to assign ticket.');
                            } finally {
                              setIsAssigning(false);
                            }
                          }}
                          disabled={isAssigning || !selectedConsultantId}
                          className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-purple-500/10 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {isAssigning ? 'Assigning...' : 'Confirm Assignment'}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConsoleTab === 'forward' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[12px] font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Forward Routing
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">Forward this ticket payload to another consultant node dynamically.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest ml-0.5">Target Consultant Node</label>
                          <select
                            value={selectedForwardConsultantId}
                            onChange={(e) => setSelectedForwardConsultantId(e.target.value)}
                            className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-white text-[12px] font-bold focus:outline-none focus:border-amber-500/50 shadow-inner cursor-pointer w-full disabled:opacity-60"
                            disabled={consultantsLoading && consultants.length === 0}
                          >
                            <option value="">
                              {consultantsLoading && consultants.length === 0 ? 'Loading consultants...' : '-- Choose Consultant --'}
                            </option>
                            {consultants.filter(c => {
                              const assignedId = ticket.assignedTo?._id || ticket.assignedTo?.id || ticket.original?.assignedTo?._id || ticket.original?.assignedTo?.id;
                              return c.status === 'active' && String(c._id || c.id) !== String(assignedId);
                            }).map(consultant => (
                              <option key={consultant._id || consultant.id} value={consultant._id || consultant.id}>
                                {consultant.name} ({consultant.email})
                              </option>
                            ))}
                          </select>
                        </div>
 
                        <div className="flex flex-col gap-1.5 relative">
                          <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest ml-0.5">CC Consultants (Optional)</label>
                          <div 
                            onClick={() => setForwardCcDropdownOpen(!forwardCcDropdownOpen)}
                            className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-slate-850 dark:text-white text-[12px] font-bold flex justify-between items-center cursor-pointer select-none shadow-inner"
                          >
                            <span className="truncate">
                              {forwardCcConsultantIds.length === 0 
                                ? '-- Choose CCs --' 
                                : `${forwardCcConsultantIds.length} Selected`}
                            </span>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${forwardCcDropdownOpen ? 'rotate-180' : ''}`} />
                          </div>
                          {forwardCcDropdownOpen && (
                            <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white dark:bg-[#1a202c] border border-slate-200 dark:border-white/10 rounded-xl max-h-[120px] overflow-y-auto p-2.5 z-20 space-y-1.5 shadow-xl custom-scrollbar">
                              {consultants.filter(c => {
                                const assignedId = ticket.assignedTo?._id || ticket.assignedTo?.id || ticket.original?.assignedTo?._id || ticket.original?.assignedTo?.id;
                                return c.status === 'active' && 
                                  String(c._id || c.id) !== String(assignedId) && 
                                  String(c._id || c.id) !== String(selectedForwardConsultantId);
                              }).map(c => {
                                const isChecked = forwardCcConsultantIds.includes(c._id || c.id);
                                return (
                                  <label 
                                    key={c._id || c.id} 
                                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer select-none text-[11px]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setForwardCcConsultantIds(prev => prev.includes(c._id || c.id) ? prev.filter(id => id !== (c._id || c.id)) : [...prev, (c._id || c.id)]);
                                      }}
                                      className="rounded text-amber-600 focus:ring-0 cursor-pointer"
                                    />
                                    <span className="truncate text-slate-700 dark:text-slate-200">{c.name}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
 
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest ml-0.5">Additional CC Email Addresses (Optional)</label>
                          <input
                            type="text"
                            placeholder="e.g. manager@example.com, tech@example.com"
                            value={forwardCcEmails}
                            onChange={(e) => setForwardCcEmails(e.target.value)}
                            className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-white text-[12px] font-bold focus:outline-none focus:border-amber-500/50 w-full placeholder:text-slate-400 shadow-inner"
                          />
                          <span className="text-[9px] text-slate-500 font-medium ml-0.5">Separate multiple email addresses with commas.</span>
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest ml-0.5">Remarks / Reason</label>
                          <textarea
                            placeholder="Add forwarding details..."
                            value={forwardRemarks}
                            onChange={(e) => setForwardRemarks(e.target.value)}
                            className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[12px] text-slate-800 dark:text-white focus:outline-none focus:border-amber-500/50 min-h-[50px] resize-none w-full shadow-inner placeholder:text-slate-400"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!selectedForwardConsultantId) return alert('Please select a consultant first.');
                            setIsForwarding(true);
                            try {
                              const ccs = [...forwardCcConsultantIds];
                              if (forwardCcEmails.trim()) {
                                const extraEmails = forwardCcEmails.split(',').map(e => e.trim()).filter(e => e.includes('@'));
                                ccs.push(...extraEmails);
                              }
                              await forwardTicket(rawTicketId, selectedForwardConsultantId, forwardRemarks, ccs);
                              setSelectedForwardConsultantId('');
                              setForwardRemarks('');
                              setForwardCcConsultantIds([]);
                              setForwardCcEmails('');
                              setForwardCcDropdownOpen(false);
                              alert('Ticket forwarded successfully!');
                            } catch (err) {
                              alert(err.response?.data?.message || 'Failed to forward ticket.');
                            } finally {
                              setIsForwarding(false);
                            }
                          }}
                          disabled={isForwarding || !selectedForwardConsultantId}
                          className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-xl text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/10 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {isForwarding ? 'Forwarding...' : 'Confirm Forward'}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConsoleTab === 'status' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[12px] font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Lifecycle Status Control
                        </h4>
                        <p className="text-[10px] text-slate-505 font-medium">Override the ticket status index. Solutions are required for resolved status.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest ml-0.5">Select State Override</label>
                          <select
                            value={statusInput}
                            onChange={(e) => setStatusInput(e.target.value)}
                            className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-white text-[12px] font-bold focus:outline-none focus:border-blue-500/50 shadow-inner cursor-pointer w-full"
                          >
                            <option value="Open">Open Protocol</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Resolved">Resolution Complete</option>
                          </select>
                        </div>
                        
                        {statusInput === 'Resolved' && (
                          <div className="flex flex-col gap-1.5 animate-in fade-in duration-300">
                            <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest ml-0.5">Resolution Solution *</label>
                            <textarea
                              placeholder="Describe the resolution steps taken..."
                              value={solutionText}
                              onChange={(e) => setSolutionText(e.target.value)}
                              className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl p-3 text-[12px] text-slate-800 dark:text-white focus:outline-none focus:border-blue-500/50 min-h-[50px] resize-none w-full shadow-inner placeholder:text-slate-400"
                              required
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleUpdateLifecycleStatus}
                          disabled={isSubmitting || (statusInput === 'Resolved' && !solutionText.trim())}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/10 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {isSubmitting ? 'Updating...' : 'Commit Status Override'}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeConsoleTab === 'worklog' && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-[12px] font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Effort Logging
                        </h4>
                        <p className="text-[10px] text-slate-505 font-medium">Record work hours directly to accumulate on client's AMC contract balance.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest ml-0.5">Effort Time</label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type="number"
                                min="0"
                                placeholder="Hours"
                                value={workLogHoursInput}
                                onChange={(e) => setWorkLogHoursInput(e.target.value)}
                                className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl pl-3 pr-8 py-2.5 text-slate-800 dark:text-white text-[12px] font-bold focus:outline-none focus:border-emerald-500/50 shadow-inner w-full text-right placeholder:text-slate-405"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-bold uppercase pointer-events-none">hrs</span>
                            </div>
                            <div className="relative flex-1">
                              <input
                                type="number"
                                min="0"
                                max="59"
                                placeholder="Minutes"
                                value={workLogMinutesInput}
                                onChange={(e) => setWorkLogMinutesInput(e.target.value)}
                                className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl pl-3 pr-8 py-2.5 text-slate-800 dark:text-white text-[12px] font-bold focus:outline-none focus:border-emerald-500/50 shadow-inner w-full text-right placeholder:text-slate-405"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-500 font-bold uppercase pointer-events-none">mins</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-widest ml-0.5">Execution Date</label>
                          <input
                            type="date"
                            value={workLogDate}
                            onChange={(e) => setWorkLogDate(e.target.value)}
                            className="bg-slate-50 dark:bg-[#181f2b] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2.5 text-slate-800 dark:text-white text-[12px] font-bold focus:outline-none focus:border-emerald-500/50 shadow-inner w-full"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={handleAddWorkLogHours}
                          disabled={isSubmitting || (!workLogHoursInput && !workLogMinutesInput)}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-white text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/10 disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {isSubmitting ? 'Logging...' : 'Commit Effort'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="relative z-10 mb-8 bg-[#0a0f1a]/80 p-8 rounded-[3rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden">
              {/* Mesh background for the conversation area */}
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
              
              <h3 className="text-[14px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3 relative z-10">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Secure Transmission Logs
              </h3>
              
              <div className="space-y-8 max-h-[500px] overflow-y-auto pr-4 mb-8 scroll-smooth custom-scrollbar relative z-10">
                {(!ticket.original?.remarks || ticket.original.remarks.length === 0) ? (
                  <div className="bg-white/[0.01] border border-white/5 p-20 rounded-[2.5rem] text-center backdrop-blur-sm">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
                      <Radio size={32} className="text-slate-800 animate-pulse" />
                    </div>
                    <p className="text-slate-600 text-[12px] font-black uppercase tracking-[0.4em]">Standby for Data Stream</p>
                  </div>
                ) : (
                  ticket.original.remarks.map((remark, index) => {
                    const remarkRoleLower = remark.addedBy?.role?.toLowerCase()?.replace(/\s+/g, '') || '';
                    const isAdmin = remarkRoleLower === 'consultant' || remarkRoleLower === 'admin' || remarkRoleLower === 'superadmin';
                    const senderName = remark.addedBy?.name || 'System';
                    const isMe = String(remark.addedBy?._id || remark.addedBy) === String(user?._id || user?.id);
                    const alignLeft = !isMe || remark.isInternal;
                    const alignSelf = alignLeft ? 'justify-start' : 'justify-end';
                    const itemsAlign = alignLeft ? 'items-start' : 'items-end';
                    const flexDir = alignLeft ? 'flex-row' : 'flex-row-reverse';
                    const roundedCorner = alignLeft ? 'rounded-tl-none' : 'rounded-tr-none';
                    const isRightBubble = !alignLeft;
                    
                    return (
                      <div key={index} className={`flex ${alignSelf} w-full animate-in fade-in slide-in-from-bottom-6 duration-500`}>
                        <div className={`max-w-[85%] flex flex-col ${itemsAlign}`}>
                          {/* Chat Header */}
                          <div className={`flex items-center gap-3 mb-2 px-2.5 ${flexDir}`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shadow-lg transition-transform hover:rotate-12 select-none ${
                              remark.isInternal
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white ring-4 ring-amber-500/10'
                                : isAdmin 
                                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white ring-4 ring-emerald-500/10' 
                                  : 'bg-gradient-to-br from-red-500 to-[#ED1B2F] text-white ring-4 ring-red-500/10'
                            }`}>
                              {senderName[0].toUpperCase()}
                            </div>
                            
                            <div className={`flex flex-col ${alignLeft ? 'items-start' : 'items-end'}`}>
                              <div className={`flex items-center gap-2 ${alignLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                                <span className="text-[11px] font-black text-slate-350">
                                  {isMe ? 'Me' : senderName}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${
                                  remark.isInternal
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : isAdmin 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                      : 'bg-red-500/10 text-[#ED1B2F] border border-red-500/20'
                                }`}>
                                  {remark.isInternal && <Lock size={8} />}
                                  {remark.isInternal ? 'Internal Collaboration' : isAdmin ? 'Support' : 'Client'}
                                </span>
                              </div>
                              <span className="text-[9px] text-slate-500 font-semibold mt-0.5">
                                {new Date(remark.addedAt).toLocaleDateString()} {new Date(remark.addedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                              </span>
                            </div>
                          </div>

                          {/* Message Bubble */}
                          <div className={`group relative p-5 rounded-2xl shadow-xl border transition-all duration-300 hover:shadow-2xl/20 ${roundedCorner} ${
                            remark.isInternal
                              ? 'bg-[#241a12] border-white/5 border-l-4 border-l-amber-500 text-slate-200 shadow-black/40'
                              : isMe
                                ? isAdmin
                                  ? 'bg-gradient-to-br from-emerald-600/90 to-teal-700/90 border-emerald-500/30 text-white shadow-emerald-900/20'
                                  : 'bg-gradient-to-br from-red-600/90 to-[#ED1B2F]/90 border-red-500/30 text-white shadow-red-900/20'
                                : isAdmin
                                  ? 'bg-[#121c24] border-white/5 border-l-4 border-l-emerald-500 text-slate-200 shadow-black/40'
                                  : 'bg-[#1e1315] border-white/5 border-l-4 border-l-[#ED1B2F] text-slate-200 shadow-black/40'
                          }`}>
                            <p className="text-[14px] leading-relaxed whitespace-pre-wrap font-medium tracking-tight selection:bg-white/20 select-text">{remark.text}</p>
                            
                            {/* Remark Attachments */}
                            {remark.attachments?.length > 0 && (
                              <div className={`mt-4 pt-4 border-t space-y-2.5 ${isRightBubble ? 'border-white/20' : 'border-white/5'}`}>
                                {remark.attachments.map((file, fIdx) => (
                                  <div 
                                    key={fIdx}
                                    className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all w-full text-left overflow-hidden relative ${
                                      isRightBubble 
                                        ? 'bg-white/10 border-white/10 hover:bg-white/15' 
                                        : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.06]'
                                    }`}
                                  >
                                    <div className={`p-2.5 rounded-lg transition-all duration-300 ${
                                      isRightBubble ? 'bg-white/10 text-white' : isAdmin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-[#ED1B2F]'
                                    }`}>
                                      <File size={16} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-black truncate tracking-tight uppercase text-slate-200">{file.originalName || file.filename}</p>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                         <span className="text-[8px] font-bold opacity-60 tracking-wider">{(file.size / 1024).toFixed(1)} KB</span>
                                         <div className="w-1 h-1 bg-white/20 rounded-full" />
                                         <span className={`text-[8px] font-extrabold tracking-wider uppercase ${isRightBubble ? 'text-white/80' : isAdmin ? 'text-emerald-400/80' : 'text-red-400/80'}`}>Secure Attachment</span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <button 
                                        onClick={(e) => handleViewAttachment(e, rawTicketId, file._id, file.originalName || file.filename, file.mimeType || file.contentType)}
                                        className={`p-2 rounded-lg border transition-all ${
                                          isRightBubble 
                                            ? 'bg-white/5 hover:bg-white/25 border-white/10 text-white' 
                                            : 'bg-white/5 hover:bg-white/15 border-white/5 text-slate-400 hover:text-white'
                                        } cursor-pointer`}
                                        title="View File"
                                      >
                                        <Eye size={14} />
                                      </button>
                                      <button 
                                        onClick={(e) => handleDownloadAttachment(e, rawTicketId, file._id, file.originalName || file.filename)}
                                        className={`p-2 rounded-lg border transition-all ${
                                          isRightBubble 
                                            ? 'bg-white/5 hover:bg-white/25 border-white/10 text-white' 
                                            : 'bg-white/5 hover:bg-white/15 border-white/5 text-slate-400 hover:text-white'
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

              {/* Conversation Reply Input — visible for all non-Resolved tickets */}
              {ticket.status !== 'Resolved' && (
                <div className="relative group">
                  <div className={`absolute -inset-1 rounded-[2rem] blur opacity-5 group-focus-within:opacity-20 transition duration-1000 ${isInternal ? 'bg-gradient-to-r from-amber-600 to-orange-600' : 'bg-gradient-to-r from-red-600 to-[#ED1B2F]'}`}></div>
                  <div className="relative">
                    {['consultant', 'admin', 'superadmin'].includes(user?.role?.toLowerCase()) && (
                      <div className="flex flex-wrap items-center gap-3 mb-2.5 ml-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest select-none">Reply Destination / Visibility</span>
                        <div className="flex bg-[#181f2b] p-1 rounded-xl border border-white/5 shadow-inner">
                          <button
                            type="button"
                            onClick={() => setIsInternal(false)}
                            className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                              !isInternal
                                ? 'bg-gradient-to-r from-red-650 to-[#ED1B2F] text-white shadow-md'
                                : 'text-slate-500 hover:text-white'
                            }`}
                          >
                            <MessageSquare size={11} /> Public Update
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsInternal(true)}
                            className={`px-3.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                              isInternal
                                ? 'bg-amber-500 text-black shadow-md font-bold'
                                : 'text-slate-500 hover:text-white'
                            }`}
                          >
                            <Lock size={11} /> Internal Note
                          </button>
                        </div>
                      </div>
                    )}
                    <textarea 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={isInternal ? "Type internal collaborative note (only visible to support team)..." : "Type your message here..."}
                      className={`w-full bg-[#131924] border rounded-[2rem] p-5 text-[14px] text-white focus:outline-none transition-all resize-none h-28 shadow-2xl pr-28 scrollbar-none font-medium placeholder:text-slate-650 ${
                        isInternal 
                          ? 'border-amber-500/30 focus:border-amber-500/60' 
                          : 'border-white/10 focus:border-red-500/40'
                      }`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          handleSendRemark();
                        }
                      }}
                    />
                    <div className="absolute right-4 bottom-4 flex items-center gap-2">
                       <input 
                         type="file" 
                         ref={replyFileRef}
                         multiple 
                         className="hidden" 
                         onChange={(e) => setReplyFiles(Array.from(e.target.files || []))}
                       />
                       {replyFiles.length > 0 && (
                         <span className={`text-[9px] font-black uppercase tracking-widest animate-pulse mr-1 ${isInternal ? 'text-amber-500' : 'text-[#ED1B2F]'}`}>
                           {replyFiles.length} FILES
                         </span>
                       )}
                       <button 
                         onClick={() => replyFileRef.current?.click()}
                         className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl border border-white/10 transition-all cursor-pointer"
                         title="Attach Files"
                       >
                         <UploadCloud size={18} />
                       </button>
                       <button 
                        onClick={handleSendRemark}
                        disabled={isSubmitting || (!replyText.trim() && replyFiles.length === 0)}
                        className={`p-3 rounded-2xl transition-all shadow-lg disabled:opacity-50 cursor-pointer ${
                          isInternal
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-amber-600/20'
                            : 'bg-gradient-to-r from-red-600 to-[#ED1B2F] hover:from-red-500 hover:to-red-400 text-white shadow-red-600/20'
                        }`}
                        title={isInternal ? 'Send Internal Note' : 'Send Message'}
                      >
                        {isInternal ? <Lock size={18} /> : <Send size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Feedback Section */}
            {isResolved && (
              <div className="relative z-10 mt-6 border-t border-white/5 pt-6">
                {(ticket.original?.feedback?.rating && !showFeedbackForm) ? (
                   <div className="bg-[#1d2633]/50 border border-yellow-500/20 p-5 rounded-2xl shadow-inner">
                     <h3 className="text-[13px] font-bold text-yellow-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                       <Star size={14} className="fill-yellow-500" /> Your Review
                     </h3>
                     <div className="flex items-center gap-1 mb-3">
                       {[1,2,3,4,5].map(star => (
                         <Star key={star} size={16} className={star <= ticket.original.feedback.rating ? "text-yellow-500 fill-yellow-500" : "text-white/10 fill-transparent"} />
                       ))}
                       <span className="ml-2 text-[13px] font-bold text-yellow-400">{ticket.original.feedback.rating}.0 / 5</span>
                     </div>
                     <p className="text-[14px] text-slate-300 font-medium italic">"{ticket.original.feedback.comment || 'No additional comments.'}"​</p>
                   </div>
                ) : showFeedbackForm ? (
                   <div className="bg-[#1d2633] border border-yellow-500/20 p-6 rounded-2xl shadow-xl">
                     <div className="flex items-center gap-2 mb-1">
                       <Star size={16} className="text-yellow-400 fill-yellow-400" />
                       <h3 className="text-[13px] font-bold text-yellow-400 uppercase tracking-widest">Rate This Resolution</h3>
                     </div>
                     <p className="text-[12px] text-slate-500 font-medium mb-5">Your feedback helps us improve our support quality.</p>
                     
                     <div className="mb-5">
                       <p className="text-[12px] font-bold text-slate-400 mb-3">How satisfied were you with the resolution? *</p>
                       <div className="flex gap-1">
                         {[1,2,3,4,5].map(star => (
                           <button 
                             key={star} 
                             onMouseEnter={() => setHoverRating(star)} 
                             onMouseLeave={() => setHoverRating(0)}
                             onClick={() => setRating(star)}
                             className="p-1 transition-transform hover:scale-110 outline-none"
                           >
                             <Star size={32} className={(hoverRating || rating) >= star ? "text-yellow-400 fill-yellow-400" : "text-white/10 fill-transparent"} />
                           </button>
                         ))}
                         {rating > 0 && (
                           <span className="ml-3 self-center text-[13px] font-bold text-yellow-400">
                             {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                           </span>
                         )}
                       </div>
                     </div>
                     
                     <div className="mb-5">
                        <p className="text-[12px] font-bold text-slate-400 mb-2">Additional Comments (optional)</p>
                        <textarea 
                          value={comment} 
                          onChange={e => setComment(e.target.value)}
                          placeholder="How was the support experience? Any suggestions?"
                          className="w-full bg-black/20 border border-white/5 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-yellow-500/50 resize-none h-24 shadow-inner"
                        />
                     </div>
                     
                     <div className="flex justify-end gap-3">
                        <button onClick={() => setShowFeedbackForm(false)} className="px-4 py-2 text-[12px] font-bold text-slate-400 hover:text-white transition-colors">Cancel</button>
                        <button 
                          onClick={handleSubmitFeedback} 
                          disabled={rating === 0 || isSubmitting}
                          className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 rounded-xl text-white font-bold text-[12px] shadow-lg disabled:opacity-50 flex items-center gap-2"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Review'}
                          {!isSubmitting && <Send size={14} />}
                        </button>
                     </div>
                   </div>
                ) : isOwner ? (
                  <button
                    onClick={() => setShowFeedbackForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-[13px] font-bold hover:bg-yellow-500/20 transition-all"
                  >
                    <Star size={16} /> Rate This Resolution
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-white/5 bg-[#181f2b]/80 backdrop-blur-xl flex justify-end gap-4 sticky bottom-0 z-20">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-all text-[13px] font-bold"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
      ) : null}

      {/* Inline File Preview Modal */}
      {previewFile && (
        <>
          <div
            onClick={() => {
              window.URL.revokeObjectURL(previewFile.url);
              setPreviewFile(null);
            }}
            className="fixed inset-0 bg-[#020617]/90 backdrop-blur-2xl z-[90]"
          />
          <div
            className="fixed inset-4 sm:inset-10 md:inset-16 z-[100] flex flex-col bg-[#111620] border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden font-sans"
          >
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-white/5 bg-[#181f2b] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <File size={22} className="text-blue-500" />
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
                  className="p-2.5 bg-white/5 hover:bg-emerald-500/20 text-slate-455 hover:text-emerald-400 rounded-xl transition-all border border-white/5 cursor-pointer"
                  title="Download File"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => {
                    window.URL.revokeObjectURL(previewFile.url);
                    setPreviewFile(null);
                  }}
                  className="p-2.5 bg-white/5 hover:bg-red-500/20 text-slate-455 hover:text-red-400 rounded-xl transition-all border border-white/5 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-auto p-8 flex flex-col items-center justify-center bg-[#020617]">
              {previewFile.mimeType?.startsWith('image/') ? (
                <div className="flex-1 flex items-center justify-center">
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
                  {renderExcelTable(previewFile.excelData)}
                </div>
              ) : previewFile.filename?.toLowerCase()?.endsWith('.csv') ? (
                <div className="w-full h-full min-h-[55vh] flex flex-col items-stretch justify-stretch">
                  {renderCSVTable(previewFile.textContent)}
                </div>
              ) : previewFile.textContent ? (
                <pre className="w-full text-left bg-[#111620] text-slate-300 p-8 rounded-2xl overflow-auto max-h-[70vh] font-mono text-[13px] whitespace-pre-wrap border border-white/5 shadow-inner custom-scrollbar">
                  {previewFile.textContent}
                </pre>
              ) : (
                <div className="text-center p-12 bg-white/[0.02] border border-white/5 rounded-3xl max-w-md">
                  <File size={48} className="text-slate-600 mx-auto mb-4 opacity-50" />
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
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
