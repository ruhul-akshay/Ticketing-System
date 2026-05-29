import { create } from 'zustand';
import api from '../api/mockAxios';

export const useUserStore = create((set, get) => ({
  users: [],
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    frozenUsers: 0,
    withCompany: 0
  },
  isLoading: false,
  error: null,
  
  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/users/role/user');
      const usersData = response.data?.users || response.data?.data || [];
      const statsData = response.data?.stats || null;
      
      set({ 
        users: Array.isArray(usersData) ? usersData : [],
        stats: statsData || get().stats,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
      set({ error: error.response?.data?.message || error.message, isLoading: false });
    }
  },

  addUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      if (response.data?.success || response.status === 200 || response.status === 201) {
        await get().fetchUsers();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
       return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/users/${id}`, userData);
      if (response.data?.success || response.status === 200) {
        await get().fetchUsers();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/users/${id}`);
      if (response.data?.success || response.status === 200) {
        await get().fetchUsers();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  updateUserStatus: async (id, newStatus, reason) => {
    try {
      const response = await api.patch(`/users/${id}/status`, { status: newStatus, statusReason: reason });
      if (response.data?.success || response.status === 200) {
        await get().fetchUsers();
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed' };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  },

  resetUserPassword: async (id, newPassword) => {
    try {
      const response = await api.post(`/users/${id}/reset-password`, { newPassword });
      return { success: response.data?.success || response.status === 200, message: response.data?.message };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || error.message };
    }
  }
}));
