import { create } from 'zustand';
import api from '../api/mockAxios';

export const usePriorityStore = create((set, get) => ({
  priorities: [],
  isLoading: false,
  error: null,

  fetchPriorities: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/priorities');
      set({ priorities: response.data || [], isLoading: false });
    } catch (error) {
      console.error('Failed to fetch priorities:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch priorities', isLoading: false });
    }
  },

  addPriority: async (priorityData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/priorities', priorityData);
      if (response.data) {
        await get().fetchPriorities();
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Failed to create priority:', error);
      const msg = error.response?.data?.message || 'Failed to create priority';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  deletePriority: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.delete(`/priorities/${id}`);
      if (response.data) {
        await get().fetchPriorities();
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Failed to delete priority:', error);
      const msg = error.response?.data?.message || 'Failed to delete priority';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  }
}));
