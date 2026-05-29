import { create } from 'zustand';
import api from '../api/mockAxios';

const mapTicketFromApi = (t) => {
  // Normalize status mapped to UI requirements
  let mappedStatus = 'Open';
  if (t.status?.toLowerCase() === 'pending') mappedStatus = 'Open';
  else if (t.status?.toLowerCase() === 'resolved') mappedStatus = 'Resolved';
  else mappedStatus = t.status ? (t.status.charAt(0).toUpperCase() + t.status.slice(1)) : 'Open';

  // Normalize priority
  const mappedPriority = t.priority ? (t.priority.charAt(0).toUpperCase() + t.priority.slice(1)) : 'Medium';

  return {
    id: t._id || t.id,
    ticketNumber: t.ticketNumber || `T-${Math.floor(Math.random()*1000)}`,
    title: t.title,
    description: t.description,
    status: mappedStatus,
    priority: mappedPriority,
    department: t.department?.name || t.department || 'Unassigned',
    user: t.createdBy?.name || t.user || 'System',
    creatorId: t.createdBy?._id || null,
    companyId: t.createdBy?.company?._id || t.createdBy?.company || null,
    companyName: t.createdBy?.company?.name || t.createdBy?.companyName || 'Unknown Corp',
    assignee: t.assignedTo?.name || t.assignee || null,
    createdAt: t.createdAt,
    original: t,
    workLogs: t.workLogs || [],
    attachments: t.attachments || [],
    adminAttachments: t.adminAttachments || [],
    supportingDocuments: t.supportingDocuments || []
  };
};

export const useTicketStore = create((set) => ({
  tickets: [],
  isLoading: false,
  error: null,
  
  fetchTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/tickets');
      const ticketsData = Array.isArray(response.data) ? response.data : (response.data.data || []);
      const mappedTickets = ticketsData.map(mapTicketFromApi);
      set({ tickets: mappedTickets, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      set({ error: error.message, isLoading: false });
    }
  },
  
  addTicket: async (ticketPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/tickets', ticketPayload);
      const newTicket = mapTicketFromApi(response.data.ticket || response.data);
      set((state) => ({ 
        tickets: [newTicket, ...state.tickets],
        isLoading: false 
      }));
      return true;
    } catch (error) {
      console.error('Failed to create ticket', error);
      set({ error: error.message, isLoading: false });
      return false;
    }
  },
  
  updateTicketStatus: async (id, newStatus, reply, solution, workLogs, adminFiles, remarkFiles) => {
    // workLogs is an array of { date, hours } entries
    const newEntries = Array.isArray(workLogs) ? workLogs.filter(r => r.date && r.hours && Number(r.hours) > 0) : [];

    // Optimistic cache update
    set((state) => ({
      tickets: state.tickets.map(t => t.id === id ? { 
        ...t, 
        status: newStatus,
        workLogs: newEntries.length > 0
          ? [...t.workLogs, ...newEntries.map(r => ({ date: r.date, hours: Number(r.hours) }))]
          : t.workLogs
      } : t)
    }));

    try {
      let apiStatus = 'pending';
      if (newStatus === 'Open') apiStatus = 'pending';
      else if (newStatus === 'Resolved') apiStatus = 'resolved';

      const isFormData = (adminFiles && adminFiles.length > 0) || (remarkFiles && remarkFiles.length > 0);
      let payload;

      if (isFormData) {
        payload = new FormData();
        payload.append('status', apiStatus);
        
        if (solution && solution.trim().length > 0) {
          payload.append('solution', solution);
          if (newStatus === 'Resolved') {
            payload.append('solvedAt', new Date().toISOString());
            payload.append('actualResolutionDate', new Date().toISOString());
          }
        }

        if (reply && reply.trim().length > 0) {
          payload.append('remarks', reply);
        }
        
        // Send all work log entries as a JSON array string
        if (newEntries.length > 0) {
          payload.append('workLogs', JSON.stringify(newEntries.map(r => ({ date: r.date, hours: Number(r.hours) }))));
        }

        adminFiles.forEach(file => {
          payload.append('adminAttachments', file);
        });
        
        if (remarkFiles && remarkFiles.length > 0) {
          remarkFiles.forEach(file => {
            payload.append('remarkAttachments', file);
          });
        }

        const response = await api.put(`/tickets/${id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const updatedTicket = mapTicketFromApi(response.data);
        set((state) => ({
          tickets: state.tickets.map(t => t.id === id ? updatedTicket : t)
        }));
      } else {
        payload = { status: apiStatus };
        if (solution && solution.trim().length > 0) {
          payload.solution = solution;
          if (newStatus === 'Resolved') {
            payload.solvedAt = new Date().toISOString();
            payload.actualResolutionDate = new Date().toISOString();
          }
        }
        if (reply && reply.trim().length > 0) {
          payload.remarks = reply;
        }
        if (newEntries.length > 0) {
          payload.workLogs = newEntries.map(r => ({ date: r.date, hours: Number(r.hours) }));
        }
        const response = await api.put(`/tickets/${id}`, payload);
        const updatedTicket = mapTicketFromApi(response.data);
        set((state) => ({
          tickets: state.tickets.map(t => t.id === id ? updatedTicket : t)
        }));
      }
    } catch (error) {
      console.error('Failed to update ticket status', error);
    }
  }
}));
