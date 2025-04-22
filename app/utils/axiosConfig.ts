/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import useAuthStore from '../store/useAuthStore';

// Create an axios instance
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
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
    const originalRequest = error.config;
    
    // If the error is due to invalid token and we're not already refreshing
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
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
            
            // Redirect to login
            if (typeof window !== 'undefined') {
              window.location.href = '/signIn';
            }
            
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Redirect to login after failed refresh
          if (typeof window !== 'undefined') {
            window.location.href = '/signIn';
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/signIn';
        }
      }
    }
    
    // If we're already refreshing, add this request to the queue
    if (error.response?.status === 401 && isRefreshing) {
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