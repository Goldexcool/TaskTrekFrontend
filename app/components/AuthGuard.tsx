'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../store/useAuthStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Token verification function
const verifyToken = async (token: string): Promise<boolean> => {
  if (!token) return false;
  
  try {
    // Basic check for JWT format
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Parse the payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if the token has expired
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
};

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading, refreshAccessToken, logout } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    setIsVerifying(true);
    
    try {
      const { accessToken, refreshToken } = useAuthStore.getState();
      
      // If no access token, try to refresh if we have a refresh token
      if (!accessToken && refreshToken) {
        console.log('No access token, attempting to refresh...');
        const refreshed = await refreshAccessToken();
        
        if (!refreshed) {
          throw new Error('Failed to refresh token');
        }
        
        // After refreshing, get the new token
        const { accessToken: newToken } = useAuthStore.getState();
        if (!newToken) {
          throw new Error('Token refresh did not provide a new token');
        }
      } else if (!accessToken) {
        // No access token and no refresh token
        throw new Error('No access token found');
      }
      
      // Get the latest token (potentially refreshed)
      const currentToken = useAuthStore.getState().accessToken;
      
      // Verify the current token
      const isValid = await verifyToken(currentToken as string);
      
      if (!isValid) {
        // Token is invalid or expired, try to refresh
        console.log('Token is invalid or expired, attempting to refresh...');
        if (refreshToken) {
          const refreshed = await refreshAccessToken();
          
          if (!refreshed) {
            throw new Error('Failed to refresh invalid token');
          }
        } else {
          throw new Error('Invalid or expired token and no refresh token');
        }
      }
      
      // If we made it here, we have a valid token
      setIsVerifying(false);
    } catch (error) {
      console.error('Authentication check failed:', error);
      
      // Clear auth state
      logout();
      
      // Redirect to sign in
      router.push('/signIn');
    }
  }, [router, refreshAccessToken, logout]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading state
  if (isLoading || isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="h-16 w-16 relative">
            <div className="h-16 w-16 rounded-lg bg-indigo-600 flex items-center justify-center animate-pulse">
              <span className="text-white text-3xl font-bold">T</span>
            </div>
          </div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated or verification is in progress, render children
  return isAuthenticated ? <>{children}</> : null;
};

export default AuthGuard;