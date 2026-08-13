import { create } from 'zustand';
import api from '../api/mockAxios';

export const useClientStore = create((set, get) => ({
  clients: [],
  stats: null,
  pagination: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastFetched: null,      // timestamp of last successful fetch
  _fetchPromise: null,    // shared in-flight promise for deduplication
  
  fetchClients: async (params = {}, { force = false } = {}) => {
    const state = get();
    const CACHE_TTL_MS = 60 * 1000; // 60 seconds
    const isDefaultParams = !params || Object.keys(params).length === 0;

    // Use cache if data is fresh, not forced, and no special query params
    if (!force && isDefaultParams && state.lastFetched && Date.now() - state.lastFetched < CACHE_TTL_MS && state.clients.length > 0) {
      return;
    }

    // Deduplicate concurrent fetches (only for default/no params calls)
    if (isDefaultParams && state._fetchPromise) {
      return state._fetchPromise;
    }

    set({ isLoading: true, error: null });

    const promise = api.get('/clients', { params })
      .then(response => {
        if (response.data && response.data.success) {
          set({
            clients: response.data.clients || [],
            pagination: response.data.pagination || null,
            isLoading: false,
            lastFetched: isDefaultParams ? Date.now() : state.lastFetched,
            _fetchPromise: null,
          });
        } else {
          set({ clients: response.data || [], isLoading: false, _fetchPromise: null });
        }
      })
      .catch(error => {
        console.error('Failed to fetch clients:', error);
        set({ error: error.response?.data?.message || 'Failed to fetch clients', isLoading: false, _fetchPromise: null });
        throw error;
      });

    if (isDefaultParams) set({ _fetchPromise: promise });
    return promise;
  },

  fetchStats: async () => {
    try {
      const response = await api.get('/clients/stats/overview');
      if (response.data && response.data.success) {
        set({ stats: response.data });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  addClient: async (clientData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/clients', clientData);
      if (response.data && response.data.success) {
        await get().fetchClients();
        await get().fetchStats();
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error' };
    } catch (error) {
      console.error('Failed to create client:', error);
      const msg = error.response?.data?.message || 'Failed to create client';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  updateClient: async (id, clientData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/clients/${id}`, clientData);
      if (response.data && response.data.success) {
        await get().fetchClients();
        await get().fetchStats();
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error' };
    } catch (error) {
      console.error('Failed to update client:', error);
      const msg = error.response?.data?.message || 'Failed to update client';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  refreshAnalytics: async () => {
    set({ isRefreshing: true, error: null });
    try {
      await api.post('/clients/refresh');
      await get().fetchClients();
      await get().fetchStats();
      set({ isRefreshing: false });
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
      set({ error: error.response?.data?.message || 'Failed to refresh', isRefreshing: false });
    }
  },

  renewClientContract: async (id, renewalData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/clients/${id}/renew`, renewalData);
      if (response.data && response.data.success) {
        await get().fetchClients();
        await get().fetchStats();
        set({ isLoading: false });
        return { success: true };
      }
      return { success: false, message: 'Unknown error' };
    } catch (error) {
      console.error('Failed to renew client contract:', error);
      const msg = error.response?.data?.message || 'Failed to renew contract';
      set({ error: msg, isLoading: false });
      return { success: false, message: msg };
    }
  },

  deleteClient: async (id) => {
    try {
      const res = await api.delete(`/clients/${id}`);
      if (res.data.success) {
        // Invalidate cache so the next fetch will be fresh
        set({ lastFetched: null });
        await get().fetchClients({ force: true });
        await get().fetchStats();
        return { success: true };
      }
      return { success: false, message: 'Delete did not succeed.' };
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Delete failed. Ensure there are no active employees under this client.';
      console.error('[Clients] Delete failed:', error);
      // Return the error instead of calling alert() which blocks the browser thread
      return { success: false, message: msg };
    }
  },

  suspendClient: async (id) => {
    try {
      const res = await api.patch(`/clients/${id}`, { status: 'suspended' });
      if(res.data.success) {
        await get().fetchClients();
      }
    } catch (error) {
      console.error('Suspend failed', error);
    }
  }
}));
