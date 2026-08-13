import { create } from 'zustand';
import api from '../api/mockAxios';

export const useDepartmentStore = create((set, get) => ({
  departments: [],
  isLoading: false,
  error: null,
  lastFetched: null,     // timestamp of last successful fetch
  _fetchPromise: null,   // shared in-flight promise for deduplication

  fetchDepartments: async ({ force = false } = {}) => {
    const state = get();
    const CACHE_TTL_MS = 60 * 1000; // 60 seconds

    // Use cached data if still fresh
    if (!force && state.lastFetched && Date.now() - state.lastFetched < CACHE_TTL_MS && state.departments.length > 0) {
      return;
    }

    // Deduplicate concurrent calls
    if (state._fetchPromise) {
      return state._fetchPromise;
    }

    set({ isLoading: true, error: null });

    const promise = api.get('/departments')
      .then(response => {
        if (response.data) {
          const data = Array.isArray(response.data) ? response.data : response.data.departments || [];
          set({ departments: data, isLoading: false, lastFetched: Date.now(), _fetchPromise: null });
        }
      })
      .catch(error => {
        console.error('Failed to fetch departments:', error);
        set({ error: error.message, isLoading: false, _fetchPromise: null });
        throw error;
      });

    set({ _fetchPromise: promise });
    return promise;
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
