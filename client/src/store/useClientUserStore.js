import { create } from 'zustand';
import api from '../api/mockAxios';

export const useClientUserStore = create((set, get) => ({
  clientUsers: [],
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    frozenUsers: 0,
    withClient: 0
  },
  isLoading: false,
  error: null,
  
  fetchClientUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/client-users/role/clientuser');
      const usersData = response.data?.users || response.data?.data || [];
      const statsData = response.data?.stats || null;
      
      set({ 
        clientUsers: Array.isArray(usersData) ? usersData : [],
        stats: statsData || get().stats,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch client users:', error);
      set({ error: error.response?.data?.message || error.message, isLoading: false });
    }
  },

  addClientUser: async (userData) => {
    try {
      const response = await api.post('/client-users', userData);
      if (response.data?.success || response.status === 200 || response.status === 201) {
        await get().fetchClientUsers();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
       return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  updateClientUser: async (id, userData) => {
    try {
      const response = await api.put(`/client-users/${id}`, userData);
      if (response.data?.success || response.status === 200) {
        await get().fetchClientUsers();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  deleteClientUser: async (id) => {
    try {
      const response = await api.delete(`/client-users/${id}`);
      if (response.data?.success || response.status === 200) {
        await get().fetchClientUsers();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  updateClientUserStatus: async (id, newStatus, reason) => {
    try {
      const response = await api.patch(`/client-users/${id}/status`, { status: newStatus, statusReason: reason });
      if (response.data?.success || response.status === 200) {
        await get().fetchClientUsers();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  resetClientUserPassword: async (id, newPassword) => {
    try {
      const response = await api.post(`/client-users/${id}/reset-password`, { newPassword });
      return { success: response.data?.success || response.status === 200, message: response.data?.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }
}));
