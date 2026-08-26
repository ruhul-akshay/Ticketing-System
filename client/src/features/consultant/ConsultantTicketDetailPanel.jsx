import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Settings, Activity, Tag, Lock, Send, MessageSquare, Wrench } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../../store/useAuthStore';
import { useTicketStore } from '../../store/useTicketStore';
import { useConsultantStore } from '../../store/useConsultantStore';
import { formatHoursToHM } from '../../utils/formatters';

// Sub-components
import TicketDetailHeader from './detail/TicketDetailHeader';
import TicketContextCards from './detail/TicketContextCards';
import TicketAssociatedFiles from './detail/TicketAssociatedFiles';
import TicketHistoryTimeline from './detail/TicketHistoryTimeline';
import TicketConversation from './detail/TicketConversation';
import TicketWorkLogsSection from './detail/TicketWorkLogsSection';
import TicketResolutionSection from './detail/TicketResolutionSection';
import TicketForwardingSection from './detail/TicketForwardingSection';
import FilePreviewModal from '../../components/ui/FilePreviewModal';

export default function ConsultantTicketDetailPanel({
  ticket: initialTicket,
  onClose,
  onUpdateStatus
}) {
  const liveTicket = useTicketStore((state) => {
    if (!initialTicket) return null;
    const raw = initialTicket.ticket ? initialTicket.ticket : initialTicket;
    const targetId = String(raw.id || raw._id || raw.original?._id || '').toLowerCase();
    const targetNum = String(raw.ticketNumber || '').toLowerCase();

    const found = state.tickets.find((t) => {
      const tid = String(t.id || t._id || t.original?._id || '').toLowerCase();
      const tnum = String(t.ticketNumber || '').toLowerCase();
      return (
        (targetId && (tid === targetId || tnum === targetId)) ||
        (targetNum && (tid === targetNum || tnum === targetNum))
      );
    });

    return found || raw;
  });

  const { fetchTickets, forwardTicket } = useTicketStore();
  const { consultants: admins, fetchConsultants: fetchAdmins, isLoading: adminsLoading } =
    useConsultantStore();

  const ticket = liveTicket;
  const { user } = useAuthStore();
  const rawTicketId = ticket?.original?._id || ticket?.id;

  // Responsive active view tab for mobile / tablet screens
  const [mobileTab, setMobileTab] = useState('overview'); // 'overview' | 'operations'

  // Forwarding State
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [forwardRemarks, setForwardRemarks] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);
  const [forwardCcConsultantIds, setForwardCcConsultantIds] = useState([]);
  const [forwardCcEmails, setForwardCcEmails] = useState('');
  const [forwardCcDropdownOpen, setForwardCcDropdownOpen] = useState(false);

  // Chat & Resolution State
  const [reply, setReply] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [solution, setSolution] = useState(ticket?.original?.solution || '');
  const [remarkFiles, setRemarkFiles] = useState([]);
  const [isInternal, setIsInternal] = useState(false);
  const [status, setStatus] = useState(ticket?.status || 'Open');
  const [adminFiles, setAdminFiles] = useState([]);
  const [isSavingEffort, setIsSavingEffort] = useState(false);

  // File Preview State
  const [previewFile, setPreviewFile] = useState(null);

  // Work Log State
  const [workLogEntries, setWorkLogEntries] = useState([
    { date: new Date().toISOString().slice(0, 10), hours: '', minutes: '' }
  ]);

  // Polling for ticket updates
  useEffect(() => {
    if (!initialTicket || !liveTicket) return;

    const interval = setInterval(() => {
      fetchTickets().catch((err) => console.error('Error polling tickets:', err));
    }, 4000);

    return () => clearInterval(interval);
  }, [liveTicket?.id, fetchTickets, initialTicket]);

  // Auto fetch consultants and mark ticket opened
  useEffect(() => {
    const isPrivileged =
      user?.role === 'consultant' ||
      user?.role === 'admin' ||
      user?.role === 'superadmin' ||
      user?.role === 'Consultant' ||
      user?.role === 'Admin' ||
      user?.role === 'Super Admin';

    if (isPrivileged) {
      fetchAdmins().catch((err) => console.error('Error fetching consultants:', err));
      if (liveTicket) {
        const ticketId = liveTicket.id || liveTicket._id || liveTicket.original?._id;
        const openedByList = (
          liveTicket.openedBy ||
          liveTicket.original?.openedBy ||
          []
        ).map((id) => id.toString());
        const userId = (user?.id || user?._id)?.toString();
        if (ticketId && userId && !openedByList.includes(userId)) {
          useTicketStore.getState().markTicketAsOpened(ticketId);
        }
      }
    }
  }, [user, liveTicket?.id, fetchAdmins]);

  // Work log helper calculations
  const addWorkLogRow = () =>
    setWorkLogEntries((prev) => [
      ...prev,
      { date: new Date().toISOString().slice(0, 10), hours: '', minutes: '' }
    ]);

  const removeWorkLogRow = (idx) =>
    setWorkLogEntries((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const updateWorkLogRow = (idx, field, value) =>
    setWorkLogEntries((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row))
    );

  const validEntries = workLogEntries
    .filter((r) => r.date && (Number(r.hours) > 0 || Number(r.minutes) > 0))
    .map((r) => ({
      date: r.date,
      hours: Number(r.hours || 0) + Number(r.minutes || 0) / 60
    }));

  const existingTotalHours = (ticket?.workLogs || []).reduce((sum, l) => sum + (l.hours || 0), 0);
  const grandTotalHours =
    existingTotalHours + validEntries.reduce((sum, r) => sum + Number(r.hours), 0);

  // Attachment Download
  const handleDownloadAttachment = async (e, ticketId, attachmentId, filename) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    try {
      const token = sessionStorage.getItem('token');
      const baseUrl =
        import.meta.env.VITE_API_URL || 'https://ticketing-backend-61yr.onrender.com/api';
      const response = await fetch(`${baseUrl}/tickets/${ticketId}/attachment/${attachmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download attachment');
    }
  };

  // Preview Attachment Inline
  const handleViewAttachment = async (e, ticketId, attachmentId, filename) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();

    const ext = filename?.split('.')?.pop()?.toLowerCase() || '';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
    const isPdf = ext === 'pdf';
    const isExcel = ['xlsx', 'xls'].includes(ext);
    const isCsv = ext === 'csv';
    const isText = ['txt', 'log', 'json', 'md'].includes(ext);

    if (isImage || isPdf || isExcel || isCsv || isText) {
      try {
        const token = sessionStorage.getItem('token');
        const baseUrl =
          import.meta.env.VITE_API_URL || 'https://ticketing-backend-61yr.onrender.com/api';
        const response = await fetch(`${baseUrl}/tickets/${ticketId}/view/${attachmentId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load inline preview.');

        if (isExcel) {
          const arrayBuffer = await response.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          setPreviewFile({
            name: filename,
            type: 'excel',
            excelData: jsonData,
            sheetNames: workbook.SheetNames
          });
        } else if (isCsv || isText) {
          const textData = await response.text();
          setPreviewFile({
            name: filename,
            type: isCsv ? 'csv' : 'text',
            textContent: textData
          });
        } else {
          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          setPreviewFile({
            name: filename,
            type: isImage ? 'image' : 'pdf',
            url: objectUrl
          });
        }
      } catch (err) {
        console.error('Preview error:', err);
        handleDownloadAttachment(e, ticketId, attachmentId, filename);
      }
    } else {
      handleDownloadAttachment(e, ticketId, attachmentId, filename);
    }
  };

  // Chat Submission Handler
  const handleSendRemark = async (e) => {
    e?.preventDefault?.();
    if (!reply.trim() && remarkFiles.length === 0) return;

    setIsSendingChat(true);
    try {
      const formData = new FormData();
      formData.append('remarks', reply);
      formData.append('isInternal', isInternal ? 'true' : 'false');
      remarkFiles.forEach((file) => formData.append('remarkAttachments', file));

      const token = sessionStorage.getItem('token');
      const baseUrl =
        import.meta.env.VITE_API_URL || 'https://ticketing-backend-61yr.onrender.com/api';
      const response = await fetch(`${baseUrl}/tickets/${rawTicketId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to send message.');
      }

      setReply('');
      setRemarkFiles([]);
      setIsInternal(false);
      await fetchTickets();
    } catch (err) {
      alert(err.message || 'Error updating ticket conversation');
    } finally {
      setIsSendingChat(false);
    }
  };

  // Work-logs-only Save Handler
  const handleSaveWorkLogsOnly = async () => {
    if (validEntries.length === 0) {
      return alert('Please enter effort hours before saving.');
    }
    setIsSavingEffort(true);
    try {
      const token = sessionStorage.getItem('token');
      const baseUrl =
        import.meta.env.VITE_API_URL || 'https://ticketing-backend-61yr.onrender.com/api';
      const response = await fetch(`${baseUrl}/tickets/${rawTicketId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workLogs: validEntries })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save effort hours.');
      }

      alert('Effort hours saved successfully!');
      setWorkLogEntries([
        { date: new Date().toISOString().slice(0, 10), hours: '', minutes: '' }
      ]);
      await fetchTickets();
    } catch (err) {
      alert(err.message || 'Error saving work logs');
    } finally {
      setIsSavingEffort(false);
    }
  };

  // Full Ticket Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'Resolved' && (!solution || solution.trim().length === 0)) {
      return alert('A written solution is required before resolving this ticket.');
    }

    try {
      const formData = new FormData();
      formData.append('status', status.toLowerCase());
      formData.append('solution', solution);
      if (reply.trim()) formData.append('remarks', reply);
      formData.append('isInternal', isInternal ? 'true' : 'false');
      formData.append('workLogs', JSON.stringify(validEntries));

      adminFiles.forEach((file) => formData.append('adminAttachments', file));
      remarkFiles.forEach((file) => formData.append('remarkAttachments', file));

      const token = sessionStorage.getItem('token');
      const baseUrl =
        import.meta.env.VITE_API_URL || 'https://ticketing-backend-61yr.onrender.com/api';
      const response = await fetch(`${baseUrl}/tickets/${rawTicketId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update ticket.');
      }

      onUpdateStatus?.(ticket.id, status);
      await fetchTickets();
      onClose();
    } catch (err) {
      alert(err.message || 'Error updating ticket');
    }
  };

  // Download Text Summary
  const handleDownloadTicketDetails = () => {
    const clientName =
      ticket.clientName ||
      ticket.original?.createdBy?.clientName ||
      ticket.original?.createdBy?.client?.name ||
      'Self/Internal';
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
Submitted By:   ${ticket.user || ticket.original?.createdBy?.name || '—'}
Email:          ${ticket.original?.createdBy?.email || '—'}
Client:         ${clientName}
Department:     ${ticket.department || '—'}
Assigned To:    ${ticket.assignee || 'Unassigned'}

3. ISSUE DESCRIPTION
--------------------------------------------------
${ticket.description || 'No description provided.'}

4. FINAL RESOLUTION
--------------------------------------------------
${ticket.original?.solution || solution || 'No solution recorded yet.'}

5. REMARKS / CONVERSATION
--------------------------------------------------
${(ticket.original?.remarks || [])
  .map((remark) => {
    const sender = remark.addedBy?.name || 'Staff';
    const dateStr = remark.addedAt ? new Date(remark.addedAt).toLocaleString() : '—';
    return `[${dateStr}] ${sender}:\n"${remark.text || ''}"\n`;
  })
  .join('\n--------------------------------------------------\n') || 'No remarks recorded.'}

6. ASSIGNMENT & ROUTING HISTORY
--------------------------------------------------
${(ticket.original?.assignmentHistory || [])
  .map((history) => {
    const dateStr = history.actionDate ? new Date(history.actionDate).toLocaleString() : '—';
    if (history.action === 'initial_assignment') {
      return `[${dateStr}] Auto Assigned to Super Admin: ${history.assignedTo?.name || 'Super Admin'}`;
    } else if (history.action === 'assign') {
      return `[${dateStr}] Assigned by ${history.assignedBy?.name || 'Super Admin'} to ${
        history.assignedTo?.name || 'Consultant'
      }`;
    } else {
      return `[${dateStr}] Forwarded by ${history.forwardedBy?.name || 'Consultant'} to ${
        history.forwardedTo?.name || 'Consultant'
      }`;
    }
  })
  .join('\n--------------------------------------------------\n') || 'No assignment history recorded.'}
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

  // Forward ticket handler
  const handleForwardSubmit = async () => {
    if (!selectedAdminId) return alert('Please select a consultant first.');
    setIsForwarding(true);
    try {
      const ccs = [...forwardCcConsultantIds];
      if (forwardCcEmails.trim()) {
        const extraEmails = forwardCcEmails
          .split(',')
          .map((e) => e.trim())
          .filter((e) => e.includes('@'));
        ccs.push(...extraEmails);
      }
      await forwardTicket(rawTicketId, selectedAdminId, forwardRemarks, ccs);
      setSelectedAdminId('');
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
  };

  if (!ticket) return null;

  const canForward =
    user &&
    (user.role === 'superadmin' ||
      user.role === 'Super Admin' ||
      String(ticket.original?.assignedTo?._id || ticket.original?.assignedTo || ticket.assignee) ===
        String(user._id || user.id));

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#020617]/80 dark:bg-[#020617]/90 backdrop-blur-md z-[60]"
      />

      {/* Main Modal Shell */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-1 sm:inset-3 md:inset-6 z-[70] flex flex-col bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden font-sans"
      >
        {/* Header */}
        <TicketDetailHeader
          ticket={ticket}
          status={status}
          onDownloadReport={handleDownloadTicketDetails}
          onClose={onClose}
        />

        {/* Responsive Tab Bar (Visible on mobile/tablets < xl) */}
        <div className="xl:hidden flex items-center border-b border-slate-200 dark:border-white/5 bg-slate-100/80 dark:bg-[#111620] px-3 py-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('overview')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mobileTab === 'overview'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5'
            }`}
          >
            <MessageSquare size={14} /> Overview & Chat
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('operations')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mobileTab === 'operations'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5'
            }`}
          >
            <Wrench size={14} /> Operations & Actions
          </button>
        </div>

        {/* Dual-column / Tabbed Content Layout */}
        <div className="flex-1 overflow-hidden flex flex-col xl:flex-row bg-slate-50/50 dark:bg-black/20">
          {/* Left Column: Details, Files, Timeline, Conversation */}
          <div
            className={`flex-[1.4] overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 custom-scrollbar border-r border-slate-200 dark:border-white/5 ${
              mobileTab === 'overview' ? 'block' : 'hidden xl:block'
            }`}
          >
            {/* Context Cards */}
            <TicketContextCards ticket={ticket} status={status} />

            {/* Issue Description Block */}
            <section>
              <div className="flex items-center gap-2.5 mb-3">
                <Shield size={16} className="text-blue-500" />
                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Issue Description
                </h3>
              </div>
              <div className="bg-slate-100/70 dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 p-4 sm:p-6 rounded-2xl shadow-inner relative group overflow-hidden">
                <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap relative z-10">
                  {ticket.description || 'No description provided.'}
                </p>
              </div>
            </section>

            {/* Associated Files */}
            <TicketAssociatedFiles
              ticket={ticket}
              rawTicketId={rawTicketId}
              onViewAttachment={handleViewAttachment}
              onDownloadAttachment={handleDownloadAttachment}
            />

            {/* Assignment & Routing History */}
            <TicketHistoryTimeline
              assignmentHistory={
                ticket.original?.assignmentHistory || ticket.assignmentHistory || []
              }
            />

            {/* Conversation Stream & Reply Input */}
            <TicketConversation
              ticket={ticket}
              currentUser={user}
              rawTicketId={rawTicketId}
              reply={reply}
              setReply={setReply}
              remarkFiles={remarkFiles}
              setRemarkFiles={setRemarkFiles}
              isInternal={isInternal}
              setIsInternal={setIsInternal}
              isSendingChat={isSendingChat}
              onSendRemark={handleSendRemark}
              onViewAttachment={handleViewAttachment}
              onDownloadAttachment={handleDownloadAttachment}
            />
          </div>

          {/* Right Column: Operational Controls, Forwarding, Work Logs, Resolution */}
          <div
            className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 bg-slate-100/40 dark:bg-[#1e293b]/20 custom-scrollbar ${
              mobileTab === 'operations' ? 'block' : 'hidden xl:block'
            }`}
          >
            {/* Operational Controls */}
            <section className="space-y-4">
              <div className="flex items-center gap-2.5">
                <Settings size={16} className="text-slate-500 dark:text-slate-400" />
                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Operational Controls
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-0.5">
                    Lifecycle Status
                  </label>
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      disabled={ticket.status === 'Resolved'}
                      className="w-full bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <option value="Open">Open</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                    <Tag
                      size={14}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-0.5">
                    Cumulative Effort
                  </label>
                  <div className="h-[42px] bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center px-4 shadow-sm">
                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 tabular-nums">
                      {formatHoursToHM(grandTotalHours)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Inline Forwarding Console */}
            <TicketForwardingSection
              canForward={canForward}
              ticket={ticket}
              admins={admins}
              adminsLoading={adminsLoading}
              currentUser={user}
              selectedAdminId={selectedAdminId}
              setSelectedAdminId={setSelectedAdminId}
              forwardCcConsultantIds={forwardCcConsultantIds}
              setForwardCcConsultantIds={setForwardCcConsultantIds}
              forwardCcEmails={forwardCcEmails}
              setForwardCcEmails={setForwardCcEmails}
              forwardRemarks={forwardRemarks}
              setForwardRemarks={setForwardRemarks}
              forwardCcDropdownOpen={forwardCcDropdownOpen}
              setForwardCcDropdownOpen={setForwardCcDropdownOpen}
              isForwarding={isForwarding}
              onForwardSubmit={handleForwardSubmit}
            />

            {/* Work Logs Section */}
            <TicketWorkLogsSection
              ticket={ticket}
              consultants={admins}
              currentUser={user}
              workLogEntries={workLogEntries}
              onAddRow={addWorkLogRow}
              onRemoveRow={removeWorkLogRow}
              onUpdateRow={updateWorkLogRow}
              onSaveWorkLogsOnly={handleSaveWorkLogsOnly}
              isSaving={isSavingEffort}
            />

            {/* Technical Resolution Section */}
            <TicketResolutionSection
              ticket={ticket}
              rawTicketId={rawTicketId}
              status={status}
              solution={solution}
              setSolution={setSolution}
              adminFiles={adminFiles}
              setAdminFiles={setAdminFiles}
              onViewAttachment={handleViewAttachment}
              onDownloadAttachment={handleDownloadAttachment}
            />
          </div>
        </div>

        {/* Global Bottom Actions Bar */}
        <div className="px-4 sm:px-8 py-3 sm:py-4 border-t border-slate-200 dark:border-white/5 bg-slate-50/90 dark:bg-[#0a0f1a]/95 backdrop-blur-md flex flex-wrap justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Total Effort
              </span>
              <p className="text-sm sm:text-base font-black text-slate-800 dark:text-white tabular-nums">
                {formatHoursToHM(grandTotalHours)}
              </p>
            </div>
            <div className="w-px h-6 bg-slate-200 dark:bg-white/10 hidden sm:block" />
            <div className="hidden sm:block">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                Assigned
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                {ticket.assignee || 'Unassigned'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all text-xs font-black uppercase tracking-wider cursor-pointer"
            >
              {ticket.status === 'Resolved' ? 'Close' : 'Discard'}
            </button>
            {ticket.status !== 'Resolved' && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                className={`px-5 sm:px-8 py-2 sm:py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isInternal
                    ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20'
                }`}
              >
                <span>{isInternal ? 'Submit Note' : 'Submit'}</span>
                {isInternal ? <Lock size={14} /> : <Send size={14} />}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Universal Inline File Preview Modal */}
      <FilePreviewModal previewFile={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  );
}
