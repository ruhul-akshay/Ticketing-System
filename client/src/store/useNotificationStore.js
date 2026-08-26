import { create } from 'zustand';
import api from '../api/mockAxios';

const CACHE_TTL_MS = 4 * 1000; // 4 seconds for fast notification updates

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  lastFetched: null,       // timestamp of the last successful fetch
  _fetchPromise: null,     // shared in-flight promise for request deduplication

  fetchNotifications: async ({ force = false } = {}) => {
    const state = get();

    // Return cached data if fresh and not forced
    if (
      !force &&
      state.lastFetched &&
      Date.now() - state.lastFetched < CACHE_TTL_MS &&
      state.notifications.length > 0
    ) {
      return;
    }

    // Deduplicate concurrent fetches
    if (state._fetchPromise) {
      return state._fetchPromise;
    }

    set({ isLoading: true, error: null });

    const promise = api
      .get('/notifications')
      .then((response) => {
        set({
          notifications: Array.isArray(response.data) ? response.data : [],
          isLoading: false,
          lastFetched: Date.now(),
          _fetchPromise: null,
        });
      })
      .catch((error) => {
        console.error('[Notifications] Fetch failed:', error);
        set({
          error: error.response?.data?.message || error.message,
          isLoading: false,
          _fetchPromise: null,
        });
        throw error;
      });

    set({ _fetchPromise: promise });
    return promise;
  },

  broadcastNotification: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/notifications', payload);
      set({ isLoading: false });
      get().fetchNotifications({ force: true });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      return false;
    }
  },

  markAsRead: async (id) => {
    if (!id) return;
    const targetIdStr = String(id);

    // Optimistic update — immediately reflect in UI
    set((state) => ({
      notifications: state.notifications.map((n) =>
        String(n._id || n.id) === targetIdStr ? { ...n, read: true } : n
      ),
    }));
    try {
      await api.put(`/notifications/${targetIdStr}/read`);
    } catch (error) {
      // Rollback on failure
      console.error('[Notifications] markAsRead failed, rolling back:', error);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          String(n._id || n.id) === targetIdStr ? { ...n, read: false } : n
        ),
      }));
    }
  },

  // Fixed: use Promise.all for parallel requests instead of a sequential for-loop
  markAllAsRead: async () => {
    const unread = get().notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    // Optimistic bulk update
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));

    try {
      await Promise.all(unread.map((n) => api.put(`/notifications/${n._id}/read`)));
    } catch (error) {
      console.error('[Notifications] markAllAsRead failed:', error);
      // Re-fetch to restore accurate state from server
      get().fetchNotifications({ force: true });
    }
  },

  downloadAttachment: async (notificationId, attachmentId, filename) => {
    try {
      const response = await api.get(
        `/notifications/${notificationId}/attachment/${attachmentId}`,
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[Notifications] Download attachment failed:', error);
      alert('Failed to download attachment');
    }
  },
}));

