import { create } from 'zustand';
import api from '../api/mockAxios';

export const useHolidayStore = create((set, get) => ({
  holidays: [],
  weekendConfig: null,
  auditLogs: [],
  isLoading: false,
  error: null,

  fetchHolidays: async (financialYear, search = '') => {
    set({ isLoading: true, error: null });
    try {
      const params = {};
      if (financialYear) params.financialYear = financialYear;
      if (search) params.search = search;
      
      const response = await api.get('/holidays', { params });
      if (response.data && response.data.success) {
        set({ holidays: response.data.holidays || [], isLoading: false });
      } else {
        set({ holidays: [], isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch holidays:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch holidays', isLoading: false });
    }
  },

  addHoliday: async (holidayData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/holidays', holidayData);
      if (response.data && response.data.success) {
        await get().fetchHolidays(holidayData.financialYear);
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Failed to add holiday:', error);
      const msg = error.response?.data?.message || 'Failed to add holiday';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  updateHoliday: async (id, holidayData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/holidays/${id}`, holidayData);
      if (response.data && response.data.success) {
        await get().fetchHolidays(holidayData.financialYear);
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Failed to update holiday:', error);
      const msg = error.response?.data?.message || 'Failed to update holiday';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  deleteHoliday: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Find the holiday we are deleting to refresh that specific FY list afterwards
      const toDelete = get().holidays.find(h => h._id === id);
      const financialYear = toDelete ? toDelete.financialYear : '';

      const response = await api.delete(`/holidays/${id}`);
      if (response.data && response.data.success) {
        if (financialYear) {
          await get().fetchHolidays(financialYear);
        }
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Failed to delete holiday:', error);
      const msg = error.response?.data?.message || 'Failed to delete holiday';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  fetchWeekendConfig: async (financialYear) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/holidays/weekend-config', { params: { financialYear } });
      if (response.data && response.data.success) {
        set({ weekendConfig: response.data.config, isLoading: false });
      } else {
        set({ weekendConfig: null, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch weekend config:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch weekend config', isLoading: false });
    }
  },

  saveWeekendConfig: async (configData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/holidays/weekend-config', configData);
      if (response.data && response.data.success) {
        set({ weekendConfig: response.data.config, isLoading: false });
        if (configData.autoGenerate) {
          // If we auto-generated weekend holidays, refresh the list
          await get().fetchHolidays(configData.financialYear);
        }
        return { success: true, message: response.data.message };
      }
      return { success: false, message: 'Unknown error occurred' };
    } catch (error) {
      console.error('Failed to save weekend config:', error);
      const msg = error.response?.data?.message || 'Failed to save weekend config';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  fetchAuditLogs: async (action = '', search = '') => {
    set({ isLoading: true, error: null });
    try {
      const params = {};
      if (action) params.action = action;
      if (search) params.search = search;

      const response = await api.get('/holidays/audit-logs', { params });
      if (response.data && response.data.success) {
        set({ auditLogs: response.data.logs || [], isLoading: false });
      } else {
        set({ auditLogs: [], isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch holiday audit logs:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch audit logs', isLoading: false });
    }
  }
}));
