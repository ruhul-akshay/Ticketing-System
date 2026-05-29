import { create } from 'zustand';
import api from '../api/mockAxios';

export const useCompanyStore = create((set, get) => ({
  companies: [],
  stats: null,
  pagination: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  
  fetchCompanies: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/companies', { params });
      if (response.data && response.data.success) {
        set({ 
          companies: response.data.companies || [], 
          pagination: response.data.pagination || null,
          isLoading: false 
        });
      } else {
        set({ companies: response.data || [], isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      set({ error: error.response?.data?.message || 'Failed to fetch companies', isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const response = await api.get('/companies/stats/overview');
      if (response.data && response.data.success) {
        set({ stats: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  addCompany: async (companyData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/companies', companyData);
      if (response.data && response.data.success) {
        await get().fetchCompanies();
        await get().fetchStats();
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error' };
    } catch (error) {
      console.error('Failed to create company:', error);
      const msg = error.response?.data?.message || 'Failed to create company';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  updateCompany: async (id, companyData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/companies/${id}`, companyData);
      if (response.data && response.data.success) {
        await get().fetchCompanies();
        await get().fetchStats();
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error' };
    } catch (error) {
      console.error('Failed to update company:', error);
      const msg = error.response?.data?.message || 'Failed to update company';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  refreshAnalytics: async () => {
    set({ isRefreshing: true, error: null });
    try {
      await api.post('/companies/refresh');
      await get().fetchCompanies();
      await get().fetchStats();
      set({ isRefreshing: false });
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
      set({ error: error.response?.data?.message || 'Failed to refresh', isRefreshing: false });
    }
  },

  renewCompanyContract: async (id, renewalData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/companies/${id}/renew`, renewalData);
      if (response.data && response.data.success) {
        await get().fetchCompanies();
        await get().fetchStats();
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error' };
    } catch (error) {
      console.error('Failed to renew company contract:', error);
      const msg = error.response?.data?.message || 'Failed to renew contract';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  deleteCompany: async (id) => {
    try {
      const res = await api.delete(`/companies/${id}`);
      if(res.data.success) {
        await get().fetchCompanies();
        await get().fetchStats();
      }
    } catch (error) {
      console.error('Delete failed', error);
      alert(error.response?.data?.message || 'Delete failed. Ensure there are no active employees under this company.');
    }
  },

  suspendCompany: async (id) => {
    try {
      const res = await api.patch(`/companies/${id}`, { status: 'suspended' });
      if(res.data.success) {
        await get().fetchCompanies();
      }
    } catch (error) {
      console.error('Suspend failed', error);
    }
  }
}));
