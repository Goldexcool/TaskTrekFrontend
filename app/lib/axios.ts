/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import useAuthStore from '@/app/store/useAuthStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from auth store
    let token;
    
    // Make sure we're in a browser environment
    if (typeof window !== 'undefined') {
      // Access the Zustand store directly
      const { accessToken } = useAuthStore.getState();
      token = accessToken;
    }
    
    // Add token to request headers if available
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;