import { create } from 'zustand';
import api from '../api/mockAxios';

const getInitialUser = () => {
  try {
    const stored = sessionStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

const getInitialAuth = () => {
  return !!sessionStorage.getItem('token');
};

const normalizeRole = (role) => {
  const r = (role || '').toLowerCase().replace(/\s+/g, '');
  if (r === 'superadmin') return 'Super Admin';
  if (r === 'consultant') return 'Consultant';
  if (r === 'admin') return 'Consultant';
  return 'Client User';
};

export const useAuthStore = create((set, get) => ({
  user: getInitialUser(),
  isAuthenticated: getInitialAuth(),
  isLoading: false,
  error: null,
  needsProfileCompletion: getInitialUser()?.isFirstLogin === true,
  isResetting: false,
  resetError: null,
  resetSuccess: false,
  
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
        isLoading: false,
        needsProfileCompletion: normalizedUser.isFirstLogin === true
      });
      return true;
    } catch (error) {
      console.error('Login failed', error);
      set({ error: error.response?.data?.message || 'Login failed. Please check your credentials.', isLoading: false });
      return false;
    }
  },
  
  completeProfile: async ({ name, phoneNumber, position }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch('/auth/complete-profile', { name, phoneNumber, position });
      const { user: updatedUser } = response.data;
      
      const formattedRole = normalizeRole(updatedUser.role);
      const normalizedUser = { ...updatedUser, role: formattedRole, isFirstLogin: false };
      sessionStorage.setItem('user', JSON.stringify(normalizedUser));
      
      set({
        user: normalizedUser,
        isLoading: false,
        needsProfileCompletion: false
      });
      return true;
    } catch (error) {
      console.error('Profile completion failed', error);
      set({ error: error.response?.data?.message || 'Failed to complete profile.', isLoading: false });
      return false;
    }
  },

  checkAuth: async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return false;
    }
    try {
      const response = await api.get('/auth/me');
      const freshUser = response.data.user;
      
      const formattedRole = normalizeRole(freshUser.role);
      const normalizedUser = { ...freshUser, role: formattedRole };
      sessionStorage.setItem('user', JSON.stringify(normalizedUser));
      set({ user: normalizedUser, isAuthenticated: true });
      return true;
    } catch (error) {
      console.error('Session verification failed:', error);
      // Auto logout only on token expiration / invalidation (401 or 403)
      if (error.response && [401, 403].includes(error.response.status)) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        set({ user: null, isAuthenticated: false });
      }
      return false;
    }
  },

  updateUserProfile: async (idOrData, optionalData) => {
    set({ isLoading: true, error: null });
    
    // Support both signatures: updateUserProfile(id, data) AND updateUserProfile(data)
    let userId = idOrData;
    let userData = optionalData;
    
    if (typeof idOrData === 'object' && !optionalData) {
      userData = idOrData;
      userId = get().user?._id || get().user?.id;
    }
    
    if (!userId) {
      set({ error: 'User session not found', isLoading: false });
      return false;
    }

    try {
      const response = await api.put(`/client-users/${userId}`, userData);
      const updatedUser = response.data.user;
      
      const formattedRole = normalizeRole(updatedUser.role);
      const normalizedUser = { ...updatedUser, role: formattedRole };
      sessionStorage.setItem('user', JSON.stringify(normalizedUser));
      set({ user: normalizedUser, isLoading: false });
      return true;
    } catch (error) {
      console.error('Failed to update profile:', error);
      const msg = error.response?.data?.message || 'Failed to update profile';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  updatePreferences: async (idOrPreferences, optionalPreferences) => {
    // Support both signatures: updatePreferences(id, prefs) AND updatePreferences(prefs)
    let userId = idOrPreferences;
    let preferences = optionalPreferences;
    
    if (typeof idOrPreferences === 'object' && !optionalPreferences) {
      preferences = idOrPreferences;
      userId = get().user?._id || get().user?.id;
    }

    if (!userId) {
      return false;
    }

    try {
      const response = await api.put(`/client-users/${userId}`, { preferences });
      const updatedUser = response.data.user;
      
      const formattedRole = normalizeRole(updatedUser.role);
      const normalizedUser = { ...updatedUser, role: formattedRole };
      sessionStorage.setItem('user', JSON.stringify(normalizedUser));
      set({ user: normalizedUser });
      return true;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return false;
    }
  },
  
  forgotPassword: async (email) => {
    set({ isResetting: true, resetError: null, resetSuccess: false });
    try {
      await api.post('/auth/forgot-password', { email });
      set({ isResetting: false, resetSuccess: true });
      return true;
    } catch (error) {
      const msg = error.response?.data?.message || 'Something went wrong. Please try again.';
      set({ isResetting: false, resetError: msg });
      return false;
    }
  },

  clearResetState: () => set({ isResetting: false, resetError: null, resetSuccess: false }),

  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, error: null });
  }
}));
