import { create } from 'zustand';
import api from '../api/mockAxios';

export const useDepartmentStore = create((set, get) => ({
  departments: [],
  isLoading: false,
  error: null,
  
  fetchDepartments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/departments');
      if (response.data) {
        // According to API spec, response could be an array straight up or wrapped in success
        const data = Array.isArray(response.data) ? response.data : response.data.departments || [];
        set({ departments: data, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch departments:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  addDepartment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/departments', data);
      set(state => ({ departments: [...state.departments, response.data], isLoading: false }));
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      return false;
    }
  },

  updateDepartment: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch(`/departments/${id}`, data);
      set(state => ({
        departments: state.departments.map(d => d._id === id ? response.data : d),
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      return false;
    }
  },

  deleteDepartment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/departments/${id}`);
      set(state => ({
        departments: state.departments.filter(d => d._id !== id),
        isLoading: false
      }));
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      return false;
    }
  },

  clearError: () => set({ error: null })
}));
