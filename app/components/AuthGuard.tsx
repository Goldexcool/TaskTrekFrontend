/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../store/useAuthStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Add this function to your AuthGuard component file
// This should be placed before your AuthGuard component
const verifyToken = async (token: string): Promise<boolean> => {
  if (!token) return false;
  
  try {
    // You can implement more robust token validation if needed
    // This basic check ensures it's at least a valid JWT format
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // For a more complete check, you would verify with your backend
    // but for client-side validation, this is a reasonable start
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
  const { isAuthenticated, isLoading } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    setIsVerifying(true);
    
    try {
      const { accessToken, refreshToken } = useAuthStore.getState();
      
      if (!accessToken) {
        throw new Error('No access token found');
      }
      
      // Now verify the token using our function
      const isValid = await verifyToken(accessToken);
      
      if (!isValid) {
        throw new Error('Invalid or expired token');
      }
      
      setIsVerifying(false);
    } catch (error) {
      console.error('Authentication check failed:', error);
      router.push('/login');
    }
  }, [router]);

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