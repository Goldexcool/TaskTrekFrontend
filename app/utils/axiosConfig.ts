/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

// Get the base URL from environment variables
// Remove any trailing slashes to make path joining more predictable
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');

// Create an axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    // Log the full URL being requested (helpful for debugging)
    console.log(`Making request to: ${config.baseURL}${config.url}`);
    
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

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: {resolve: (value: unknown) => void; reject: (reason?: any) => void}[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Log detailed information about the error
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    
    // Handle 404 errors specifically
    if (error.response?.status === 404) {
      console.error(`Endpoint not found: ${error.config?.baseURL}${error.config?.url}`);
    }
    
    const originalRequest = error.config;
    
    // Skip refresh flow for specific endpoints to avoid loops
    const isAuthEndpoint = originalRequest.url?.includes('/auth/');
    
    // If the error is due to invalid token and we're not already refreshing
    // And we're not on an auth endpoint (to avoid refresh loops)
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !isRefreshing && 
        !isAuthEndpoint) {
      
      if (useAuthStore.getState().refreshToken) {
        originalRequest._retry = true;
        isRefreshing = true;
        
        try {
          // Try to refresh the token
          const refreshed = await useAuthStore.getState().refreshAccessToken();
          
          if (refreshed) {
            const newToken = useAuthStore.getState().accessToken;
            
            // Update the token in the failed request
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Process any requests that came in while refreshing
            processQueue(null, newToken);
            isRefreshing = false;
            
            // Retry the original request
            return apiClient(originalRequest);
          } else {
            // If refresh failed, process the queue with error
            processQueue(error, null);
            isRefreshing = false;
            
            // Clear auth state before redirecting
            useAuthStore.getState().logout();
            
            // Use next/router for client-side navigation instead of direct redirect
            // This allows proper Next.js transitions
            return Promise.reject({
              ...error,
              shouldRedirect: true,
              redirectTo: '/signIn'
            });
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Clear auth state before redirecting
          useAuthStore.getState().logout();
          
          return Promise.reject({
            ...error,
            shouldRedirect: true,
            redirectTo: '/signIn'
          });
        }
      } else {
        // No refresh token available
        // Clear auth state before redirecting
        useAuthStore.getState().logout();
        
        return Promise.reject({
          ...error,
          shouldRedirect: true,
          redirectTo: '/signIn'
        });
      }
    }
    
    // If we're already refreshing, add this request to the queue
    if (error.response?.status === 401 && isRefreshing && !isAuthEndpoint) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      }).catch(err => {
        return Promise.reject(err);
      });
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;