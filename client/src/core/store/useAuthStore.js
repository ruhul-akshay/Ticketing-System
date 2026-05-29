import { create } from 'zustand';
import api from '../api/mockAxios';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      
      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      
      // Normalize role string (backend gave 'superadmin', UI expects 'Super Admin')
      const formattedRole = user.role === 'superadmin' ? 'Super Admin' 
        : user.role === 'admin' ? 'Admin' 
        : 'User';
        
      set({ 
        user: { ...user, role: formattedRole }, 
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
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, isAuthenticated: false, error: null });
  }
}));
