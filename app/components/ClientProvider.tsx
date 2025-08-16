'use client';

import { useEffect } from 'react';
import { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import useAuthStore from '@/app/store/useAuthStore';
import { apiClient } from '@/app/utils/axiosConfig';

export default function ClientProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize axios interceptors only on client side
    const { getState } = useAuthStore;
    
    // Request interceptor
    const requestInterceptor = apiClient.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const { accessToken } = getState();
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Response interceptor
    const responseInterceptor = apiClient.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          const { logout } = getState();
          logout();
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      apiClient.interceptors.request.eject(requestInterceptor);
      apiClient.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return <>{children}</>;
}
