import { create } from 'zustand';
import api from '../api/mockAxios';

export const useConsultantStore = create((set, get) => ({
  consultants: [],
  stats: {
    totalConsultants: 0,
    activeConsultants: 0,
    inactiveConsultants: 0,
    departmentsCovered: 0
  },
  isLoading: false,
  error: null,
  
  fetchConsultants: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/client-users/role/consultant');
      const consultantsData = response.data?.users || response.data?.data || [];
      const statsData = response.data?.stats || null;
      
      set({ 
        consultants: Array.isArray(consultantsData) ? consultantsData : [],
        stats: statsData || get().stats,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch consultants:', error);
      set({ error: error.response?.data?.message || error.message, isLoading: false });
    }
  },

  addConsultant: async (consultantData) => {
    try {
      const response = await api.post('/client-users', { ...consultantData, role: 'consultant' });
      if (response.data?.success || response.status === 200 || response.status === 201) {
        await get().fetchConsultants();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
       return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  updateConsultant: async (id, consultantData) => {
    try {
      const response = await api.put(`/client-users/${id}`, { ...consultantData, role: 'consultant' });
      if (response.data?.success || response.status === 200) {
        await get().fetchConsultants();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  deleteConsultant: async (id) => {
    try {
      const response = await api.delete(`/client-users/${id}`);
      if (response.data?.success || response.status === 200) {
        await get().fetchConsultants();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  updateConsultantStatus: async (id, newStatus, reason) => {
    try {
      const response = await api.patch(`/client-users/${id}/status`, { status: newStatus, statusReason: reason });
      if (response.data?.success || response.status === 200) {
        await get().fetchConsultants();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  resetConsultantPassword: async (id, newPassword) => {
    try {
      const response = await api.post(`/client-users/${id}/reset-password`, { newPassword });
      return { success: response.data?.success || response.status === 200, message: response.data?.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }
}));
