import axios from 'axios';

// Create Axios Instance attached to backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://ticketing-frontend-backend.gtm47p.easypanel.host/api',
  timeout: 55000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Let the browser set the correct multipart boundary for file uploads
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      if (config.headers.common) delete config.headers.common['Content-Type'];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────────────────────
// Handles session expiry (401) and forbidden (403) globally so individual
// stores and components don't each need to handle token invalidation.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      const currentPath = window.location.pathname;
      // Only redirect if not already on an auth page to prevent redirect loops
      if (!currentPath.includes('/login') && !currentPath.includes('/complete-profile')) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
