import axios from 'axios';

// For production, use relative path since both are on same domain (if using custom domain)
// Or use absolute path if using different domains
const getApiUrl = () => {
  // If using same domain for frontend/backend
  if (window.location.hostname === 'your-frontend-app.vercel.app') {
    return 'https://your-backend-app.onrender.com';
  }
  // For local development
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

const API_URL = getApiUrl();

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false, // Important for cross-domain requests
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('Making API request to:', config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/profile'),
};

// Users API endpoints - MAKE SURE THIS EXPORT EXISTS
export const usersAPI = {
  getUsers: () => api.get('/api/users'),
  createUser: (data) => api.post('/api/users', data),
  getUser: (id) => api.get(`/api/users/${id}`),
  updateUser: (id, data) => api.put(`/api/users/${id}`, data),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
};

// Messages API endpoints
export const messagesAPI = {
  getMessages: (userId) => api.get(`/api/messages/${userId}`),
  sendMessage: (data) => api.post('/api/messages/send', data),
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // Longer timeout for file uploads
    });
  },
};

// Health check function
export const healthCheck = () => api.get('/api/health');

export default api;