import { create } from 'zustand';
import api from '../api/mockAxios';

export const useAttendanceStore = create((set, get) => ({
  attendanceList: [],
  summary: null,
  leaves: [],
  myLeaves: [],
  isLoading: false,
  error: null,

  checkIn: async (remarks = '') => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/attendance/check-in', { remarks });
      if (response.data && response.data.success) {
        // Refresh summary for the current month after successful check-in
        const now = new Date();
        await get().fetchMonthlySummary(null, now.getFullYear(), now.getMonth() + 1);
        set({ isLoading: false });
        return { success: true, attendance: response.data.attendance };
      }
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Check-in failed:', error);
      const msg = error.response?.data?.message || 'Check-in failed';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  checkOut: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/attendance/check-out');
      if (response.data && response.data.success) {
        // Refresh summary for the current month
        const now = new Date();
        await get().fetchMonthlySummary(null, now.getFullYear(), now.getMonth() + 1);
        set({ isLoading: false });
        return { success: true, attendance: response.data.attendance };
      }
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Check-out failed:', error);
      const msg = error.response?.data?.message || 'Check-out failed';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  fetchMonthlySummary: async (userId, year, month) => {
    set({ isLoading: true, error: null });
    try {
      const params = { year, month };
      if (userId) params.userId = userId;

      const response = await api.get('/attendance/summary', { params });
      if (response.data && response.data.success) {
        set({
          attendanceList: response.data.attendanceList || [],
          summary: response.data.summary || null,
          isLoading: false
        });
      } else {
        set({ attendanceList: [], summary: null, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch monthly attendance summary:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch attendance summary', 
        attendanceList: [], 
        summary: null,
        isLoading: false 
      });
    }
  },

  requestLeave: async (leaveData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/attendance/leaves', leaveData);
      if (response.data && response.data.success) {
        await get().fetchMyLeaves();
        // Refresh summary just in case they requested leave for current month
        const now = new Date();
        await get().fetchMonthlySummary(null, now.getFullYear(), now.getMonth() + 1);
        set({ isLoading: false });
        return { success: true, leave: response.data.leave };
      }
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Failed to request leave:', error);
      const msg = error.response?.data?.message || 'Failed to submit leave request';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  fetchMyLeaves: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/attendance/leaves/my');
      if (response.data && response.data.success) {
        set({ myLeaves: response.data.leaves || [], isLoading: false });
      } else {
        set({ myLeaves: [], isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch user leaves:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch leave history', isLoading: false });
    }
  },

  fetchAllLeaves: async (status = '', search = '') => {
    set({ isLoading: true, error: null });
    try {
      const params = {};
      if (status) params.status = status;
      if (search) params.search = search;

      const response = await api.get('/attendance/leaves', { params });
      if (response.data && response.data.success) {
        set({ leaves: response.data.leaves || [], isLoading: false });
      } else {
        set({ leaves: [], isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch all leaves:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch leaves list', isLoading: false });
    }
  },

  approveLeave: async (id, status) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/attendance/leaves/${id}`, { status });
      if (response.data && response.data.success) {
        await get().fetchAllLeaves();
        // Also refresh monthly summary in case approved leave is in current month
        const now = new Date();
        await get().fetchMonthlySummary(null, now.getFullYear(), now.getMonth() + 1);
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Failed to update leave status:', error);
      const msg = error.response?.data?.message || 'Failed to approve/reject leave';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  }
}));
