import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: () => api.post('/auth/resend-verification'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  changePassword: (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword }),
  logout: () => api.post('/auth/logout'),
};

// Resume API
export const resumeAPI = {
  upload: (formData) => api.post('/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getAll: (params) => api.get('/resume', { params }),
  getById: (id) => api.get(`/resume/${id}`),
  update: (id, data) => api.put(`/resume/${id}`, data),
  delete: (id) => api.delete(`/resume/${id}`),
};

// Interview API
export const interviewAPI = {
  create: (interviewData) => {
    console.log('Creating interview with data:', interviewData);
    return api.post('/interview', interviewData);
  },
  getAll: (params) => api.get('/interview', { params }),
  getById: (id) => {
    console.log('Getting interview by ID:', id);
    return api.get(`/interview/${id}`);
  },
  start: (id) => api.post(`/interview/${id}/start`),
  pause: (id) => api.post(`/interview/${id}/pause`),
  resume: (id) => api.post(`/interview/${id}/resume`),
  submitAnswer: (id, answerData) => api.post(`/interview/${id}/submit-answer`, answerData),
  end: (id) => api.post(`/interview/${id}/end`),
  delete: (id) => api.delete(`/interview/${id}`),
};

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getAnalytics: (period = '30d') => api.get(`/analytics?period=${period}`),
  getInterviewPerformance: (interviewId) => api.get(`/analytics/performance/${interviewId}`),
};

// File upload helper
export const uploadFile = async (file, onProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);

  return api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    },
  });
};

// Health check
export const healthCheck = () => api.get('/health');

export default api;