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
        // Clear all auth data
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
      
      refreshAccessToken: async (): Promise<boolean> => {
        const refreshToken = get().refreshToken;
        
        if (!refreshToken) {
          return false;
        }
        
        try {
          set({ isLoading: true });
          
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const response = await fetch(`${apiUrl}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });
          
          if (!response.ok) {
            throw new Error('Token refresh failed');
          }
          
          const data = await response.json();
          
          // Update auth state with new tokens
          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken || get().refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          
          return true;
        } catch (error) {
          console.error('Error refreshing token:', error);
          set({ isLoading: false });
          return false;
        }
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
      name: 'auth-storage',
      // Only persist these fields
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
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

export default useAuthStore;