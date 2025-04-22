/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

// Define the API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface AuthState {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isRefreshing: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string, name: string) => Promise<boolean>;
  refreshAccessToken: () => Promise<boolean>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string) => Promise<boolean>; // Add this line
  setUser: (user: any) => void;
  clearError: () => void;
}

let refreshPromise: Promise<boolean> | null = null;

const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isRefreshing: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password,
          });
          
          const { accessToken, refreshToken, user } = response.data;
          
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          
          // Set the token in axios defaults for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          
          return true;
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to login';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          return false;
        }
      },
      
      logout: () => {
        // Remove token from axios defaults
        delete axios.defaults.headers.common['Authorization'];
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
      
      register: async (username: string, email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/signup`, {
            username,
            email,
            password,
            name
          });
          
          // Some APIs return tokens on register, others require login after
          if (response.data.accessToken) {
            set({
              user: response.data.user,
              accessToken: response.data.accessToken,
              refreshToken: response.data.refreshToken,
              isAuthenticated: true,
              isLoading: false,
            });
            
            // Set the token in axios defaults
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
            
            return true;
          } else {
            set({ isLoading: false });
            return true; // Registration successful but need to login
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to register';
          set({
            error: errorMessage,
            isLoading: false,
          });
          return false;
        }
      },
      
      refreshAccessToken: async () => {
        const { refreshToken, isRefreshing } = get();
        
        // If already refreshing, return the existing promise
        if (isRefreshing && refreshPromise) {
          return refreshPromise;
        }
        
        if (!refreshToken) {
          console.warn('No refresh token available');
          return false;
        }
        
        // Set refreshing state
        set({ isRefreshing: true });
        
        // Create a new refresh promise
        refreshPromise = (async () => {
          try {
            console.log('Attempting to refresh access token...');
            
            const response = await axios.post(
              `${API_BASE_URL}/auth/refresh-token`,
              { refreshToken },
              { 
                headers: { 'Content-Type': 'application/json' }
              }
            );
            
            if (!response.data.accessToken) {
              throw new Error('No access token received');
            }
            
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            
            console.log('Token refreshed successfully');
            
            set({
              accessToken,
              // Update refresh token if a new one was provided
              refreshToken: newRefreshToken || refreshToken,
              isAuthenticated: true,
              isRefreshing: false
            });
            
            // Update the token in axios defaults
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
            
            return true;
          } catch (error: any) {
            console.error('Failed to refresh token:', error);
            
            // Clear auth state on refresh failure
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              isRefreshing: false,
              error: 'Authentication expired. Please login again.'
            });
            
            // Remove token from axios defaults
            delete axios.defaults.headers.common['Authorization'];
            
            return false;
          } finally {
            refreshPromise = null;
          }
        })();
        
        return refreshPromise;
      },
      
      forgotPassword: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          // Call your existing backend API
          const response = await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
            email
          });
          
          // Check if the request was successful
          if (response.data.success) {
            set({ isLoading: false });
            return true;
          } else {
            throw new Error(response.data.message || 'Failed to send reset email');
          }
        } catch (error: any) {
          const errorMessage = 
            error.response?.data?.message || 
            error.message || 
            'Failed to send password reset email';
          
          set({
            error: errorMessage,
            isLoading: false
          });
          return false;
        }
      },

      resetPassword: async (token: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          // Call your backend API for password reset
          const response = await axios.post(`${API_BASE_URL}/auth/reset-password`, {
            token,
            password
          });
          
          // Check if the request was successful
          if (response.data.success) {
            set({ isLoading: false });
            return true;
          } else {
            throw new Error(response.data.message || 'Failed to reset password');
          }
        } catch (error: any) {
          const errorMessage = 
            error.response?.data?.message || 
            error.message || 
            'Failed to reset password';
          
          set({
            error: errorMessage,
            isLoading: false
          });
          return false;
        }
      },
      
      setUser: (user: any) => {
        set({ user });
      },
      
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage', // Name for the persisted data
    }
  )
);

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't attempted to refresh already
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshSuccess = await useAuthStore.getState().refreshAccessToken();
      
      if (refreshSuccess) {
        // Retry the original request with new token
        const token = useAuthStore.getState().accessToken;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return axios(originalRequest);
      }
    }
    
    return Promise.reject(error);
  }
);

// Initialize the authorization header if we have a token
const initializeAuth = () => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  }
};

if (typeof window !== 'undefined') {
  initializeAuth();
}

export default useAuthStore