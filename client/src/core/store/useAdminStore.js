import { create } from 'zustand';
import api from '../api/mockAxios';

export const useAdminStore = create((set, get) => ({
  admins: [],
  stats: {
    totalAdmins: 0,
    activeAdmins: 0,
    inactiveAdmins: 0,
    departmentsCovered: 0
  },
  isLoading: false,
  error: null,
  
  fetchAdmins: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/users/role/admin');
      const adminsData = response.data?.users || response.data?.data || [];
      const statsData = response.data?.stats || null;
      
      set({ 
        admins: Array.isArray(adminsData) ? adminsData : [],
        stats: statsData || get().stats,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      set({ error: error.response?.data?.message || error.message, isLoading: false });
    }
  },

  addAdmin: async (adminData) => {
    try {
      const response = await api.post('/users', { ...adminData, role: 'admin' });
      if (response.data?.success || response.status === 200 || response.status === 201) {
        await get().fetchAdmins();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
       return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  updateAdmin: async (id, adminData) => {
    try {
      const response = await api.put(`/users/${id}`, { ...adminData, role: 'admin' });
      if (response.data?.success || response.status === 200) {
        await get().fetchAdmins();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  deleteAdmin: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      if (response.data?.success || response.status === 200) {
        await get().fetchAdmins();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  updateAdminStatus: async (id, newStatus, reason) => {
    try {
      const response = await api.patch(`/users/${id}/status`, { status: newStatus, statusReason: reason });
      if (response.data?.success || response.status === 200) {
        await get().fetchAdmins();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  resetAdminPassword: async (id, newPassword) => {
    try {
      const response = await api.post(`/users/${id}/reset-password`, { newPassword });
      return { success: response.data?.success || response.status === 200, message: response.data?.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }
}));
