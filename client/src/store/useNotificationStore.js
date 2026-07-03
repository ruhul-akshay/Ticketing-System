import { create } from 'zustand';
import api from '../api/mockAxios';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  isLoading: false,
  error: null,
  
  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/notifications');
      set({ notifications: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  broadcastNotification: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/notifications', payload);
      set({ isLoading: false });
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      return false;
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set(state => ({
        notifications: state.notifications.map(n => 
          n._id === id ? { ...n, read: true } : n
        )
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },
  
  markAllAsRead: async () => {
    const { notifications, markAsRead } = get();
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await markAsRead(n._id);
    }
  },

  downloadAttachment: async (notificationId, attachmentId, filename) => {
    try {
      const response = await api.get(`/notifications/${notificationId}/attachment/${attachmentId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download notification attachment:', error);
      alert('Failed to download attachment');
    }
  }
}));
