import { create } from 'zustand';
import api from '../api/mockAxios';

export const useCcEmailStore = create((set, get) => ({
  configs: [],
  isLoading: false,
  error: null,

  fetchConfigs: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/cc-emails');
      if (response.data && response.data.success) {
        set({ configs: response.data.configs || [], isLoading: false });
      } else {
        set({ configs: [], isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch CC email configurations:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch CC configurations', isLoading: false });
    }
  },

  addConfig: async (configData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/cc-emails', configData);
      if (response.data && response.data.success) {
        await get().fetchConfigs();
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Failed to create CC config:', error);
      const msg = error.response?.data?.message || 'Failed to create CC configuration';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  updateConfig: async (id, configData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/cc-emails/${id}`, configData);
      if (response.data && response.data.success) {
        await get().fetchConfigs();
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Failed to update CC config:', error);
      const msg = error.response?.data?.message || 'Failed to update CC configuration';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  deleteConfig: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.delete(`/cc-emails/${id}`);
      if (response.data && response.data.success) {
        await get().fetchConfigs();
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Failed to delete CC config:', error);
      const msg = error.response?.data?.message || 'Failed to delete CC configuration';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  }
}));
