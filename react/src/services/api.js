import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create a configured axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the auth token for authenticated requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for global error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle authentication errors globally
    if (error.response && error.response.status === 401) {
      // Clear invalid tokens
      localStorage.removeItem('authToken');
      
      // You could redirect to login page here if needed
      // window.location = '/login';
    }
    return Promise.reject(error);
  }
);

const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  
  socialAuth: async (provider, profile) => {
    const response = await api.post('/auth/social', { 
      provider,
      name: profile.name,
      email: profile.email
    });
    return response.data;
  },
  
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  resetPassword: async (token, password) => {
    const response = await api.put(`/auth/reset-password/${token}`, { password });
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/user');
    return response.data;
  }
};

export { api, authService };
