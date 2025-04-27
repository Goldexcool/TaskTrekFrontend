import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

// Log the base URL for debugging
console.log('API base URL:', process.env.NEXT_PUBLIC_API_URL);

// Create an axios instance with the base URL from environment variables
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token and debugging
api.interceptors.request.use(
  (config) => {
    // Log the full URL being requested (helpful for debugging)
    console.log(`Making request to: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    
    // Make sure we're not in SSR context
    if (typeof window !== 'undefined') {
      const accessToken = useAuthStore.getState().accessToken;
      
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log(`Response from ${response.config.url}:`, 
      response.status, 
      response.data ? (typeof response.data === 'object' ? 'data received' : response.data) : 'no data'
    );
    return response;
  },
  (error) => {
    // Enhanced error logging
    console.error('API Error:', {
      url: `${error.config?.baseURL || ''}${error.config?.url || ''}`,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Log possible issues with API endpoint format
    if (error.response?.status === 404) {
      console.error('404 Not Found - Check if endpoint path is correct:', error.config?.url);
      
      // Check for common URL errors
      if (error.config?.url?.includes('undefined')) {
        console.error('URL contains "undefined" - Check your parameters');
      }
      
      if (error.config?.url?.startsWith('http')) {
        console.error('URL starts with http - You may be using a full URL instead of a relative path');
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;