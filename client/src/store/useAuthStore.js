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

/**
 * Helper to parse backend, network, server, and authentication errors into user-friendly message and category
 */
export const parseAuthError = (error, defaultMessage = 'Login failed.') => {
  // 1. Network / Connection Error (e.g. backend server down, no internet, CORS, timeout)
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED' || error?.message?.toLowerCase().includes('timeout')) {
      return {
        message: 'Server request timed out. Please try again.',
        type: 'timeout',
        status: null,
      };
    }
    if (
      error?.code === 'ERR_NETWORK' ||
      error?.message?.toLowerCase().includes('network error') ||
      error?.message?.toLowerCase().includes('failed to fetch')
    ) {
      return {
        message: 'Cannot connect to server. Check your network or server status.',
        type: 'network',
        status: null,
      };
    }
    return {
      message: error?.message || 'Cannot communicate with server. Check your network.',
      type: 'network',
      status: null,
    };
  }

  const status = error.response.status;
  const backendMsg = error.response.data?.message;

  // 2. Specific HTTP Status Codes
  if (status === 401) {
    return {
      message: backendMsg || 'Invalid email or password.',
      type: 'credentials',
      status,
    };
  }

  if (status === 400) {
    return {
      message: backendMsg || 'Please enter a valid email and password.',
      type: 'validation',
      status,
    };
  }

  if (status === 403) {
    return {
      message: backendMsg || 'Account is inactive or access is restricted.',
      type: 'forbidden',
      status,
    };
  }

  if (status === 404) {
    return {
      message: backendMsg || 'No account found with this email address.',
      type: 'not_found',
      status,
    };
  }

  if (status === 429) {
    return {
      message: backendMsg || 'Too many attempts. Please wait a few minutes.',
      type: 'rate_limit',
      status,
    };
  }

  if (status >= 500) {
    return {
      message: backendMsg
        ? `Server error (${status}): ${backendMsg}`
        : `Server error (${status}). Please try again later.`,
      type: 'server',
      status,
    };
  }

  return {
    message: backendMsg || defaultMessage,
    type: 'general',
    status,
  };
};

export const useAuthStore = create((set, get) => ({
  user: getInitialUser(),
  isAuthenticated: getInitialAuth(),
  isLoading: false,
  error: null,
  errorType: null,
  errorStatus: null,
  needsProfileCompletion: getInitialUser()?.isFirstLogin === true,
  isResetting: false,
  resetError: null,
  resetErrorType: null,
  resetSuccess: false,
  
  clearError: () => set({ error: null, errorType: null, errorStatus: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null, errorType: null, errorStatus: null });
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
        error: null,
        errorType: null,
        errorStatus: null,
        needsProfileCompletion: normalizedUser.isFirstLogin === true
      });
      return true;
    } catch (error) {
      console.error('Login failed', error);
      const parsed = parseAuthError(error, 'Login failed. Please check your credentials.');
      set({ 
        error: parsed.message, 
        errorType: parsed.type, 
        errorStatus: parsed.status, 
        isLoading: false 
      });
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
    set({ isResetting: true, resetError: null, resetErrorType: null, resetSuccess: false });
    try {
      await api.post('/auth/forgot-password', { email });
      set({ isResetting: false, resetSuccess: true });
      return true;
    } catch (error) {
      const parsed = parseAuthError(error, 'Unable to send temporary password. Please try again.');
      set({ 
        isResetting: false, 
        resetError: parsed.message,
        resetErrorType: parsed.type 
      });
      return false;
    }
  },

  clearResetState: () => set({ isResetting: false, resetError: null, resetErrorType: null, resetSuccess: false }),

  logout: () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, error: null });
  }
}));
