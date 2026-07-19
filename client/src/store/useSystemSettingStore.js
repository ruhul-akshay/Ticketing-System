import { create } from 'zustand';
import api from '../api/mockAxios';

export const useSystemSettingStore = create((set, get) => ({
  settings: {
    showBillingToConsultants: false
  },
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/system-settings');
      if (response.data && response.data.success) {
        set({ 
          settings: response.data.settings || { showBillingToConsultants: false }, 
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch settings', isLoading: false });
    }
  },

  updateSetting: async (key, value) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/system-settings', { key, value });
      if (response.data && response.data.success) {
        set((state) => ({
          settings: {
            ...state.settings,
            [key]: value
          },
          isLoading: false
        }));
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Failed to update setting' };
    } catch (error) {
      console.error('Failed to update system setting:', error);
      const msg = error.response?.data?.message || 'Failed to update system setting';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  }
}));
