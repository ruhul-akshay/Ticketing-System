import { create } from 'zustand';
import api from '../api/mockAxios';

// Helper to safely parse user from sessionStorage
const getSavedUser = () => {
  try {
    const saved = sessionStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('Failed to parse saved user:', e);
    return null;
  }
};

const normalizeRole = (role) => {
  const r = (role || '').toLowerCase().replace(/\s+/g, '');
  if (r === 'superadmin') return 'Super Admin';
  if (r === 'admin') return 'Admin';
  return 'Client User';
};

export const useAuthStore = create((set, get) => ({
  user: getSavedUser(),
  isAuthenticated: !!sessionStorage.getItem('token'),
  isLoading: false,
  error: null,
  
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      
      sessionStorage.setItem('token', token);
      
      const formattedRole = normalizeRole(user.role);
      const normalizedUser = { ...user, role: formattedRole };
      
      sessionStorage.setItem('user', JSON.stringify(normalizedUser));
      
      set({ 
        user: normalizedUser, 
        isAuthenticated: true, 
        isLoading: false 
      });
      return true;
    } catch (error) {
      console.error('Login failed', error);
      set({ error: error.response?.data?.message || 'Login failed. Please check your credentials.', isLoading: false });
      return false;
    }
  },
  
  checkAuth: async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      get().logout();
      return;
    }
    
    try {
      const response = await api.get('/auth/me');
      const { user } = response.data;
      
      const formattedRole = normalizeRole(user.role);
      const normalizedUser = { ...user, role: formattedRole };
      
      sessionStorage.setItem('user', JSON.stringify(normalizedUser));
      set({ 
        user: normalizedUser, 
        isAuthenticated: true 
      });
    } catch (error) {
      console.error('Check auth failed:', error);
      // If unauthorized, log out the user
      if (error.response?.status === 401) {
        get().logout();
      }
    }
  },
  
  updateUserProfile: async (userData) => {
    const currentUser = get().user;
    if (!currentUser) return false;
    
    set({ isLoading: true, error: null });
    try {
      const userId = currentUser._id || currentUser.id;
      const response = await api.put(`/client-users/${userId}`, userData);
      
      const { user: updatedUser } = response.data;
      
      const formattedRole = normalizeRole(updatedUser.role);
      const normalizedUser = { ...updatedUser, role: formattedRole };
      
      sessionStorage.setItem('user', JSON.stringify(normalizedUser));
      set({ 
        user: normalizedUser,
        isLoading: false 
      });
      return true;
    } catch (error) {
      console.error('Update profile failed:', error);
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      return false;
    }
  },

  updatePreferences: async (preferencesData) => {
    const currentUser = get().user;
    if (!currentUser) return false;
    
    try {
      const userId = currentUser._id || currentUser.id;
      const response = await api.put(`/client-users/${userId}`, { preferences: preferencesData });
      
      const { user: updatedUser } = response.data;
      
      const formattedRole = normalizeRole(updatedUser.role);
      const normalizedUser = { ...updatedUser, role: formattedRole };
      
      sessionStorage.setItem('user', JSON.stringify(normalizedUser));
      set({ user: normalizedUser });
      return true;
    } catch (error) {
      console.error('Update preferences failed:', error);
      return false;
    }
  },
  
  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, error: null });
  }
}));
