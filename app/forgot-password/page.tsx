"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Loader2, AlertCircle, Mail, CheckCircle, CheckSquare
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTheme } from 'next-themes';

const ForgotPasswordPage = () => {
  const { theme, setTheme } = useTheme();
  
  // Get auth actions from Zustand store
  const { forgotPassword, isLoading, error, clearError } = useAuthStore();
  
  // Form state
  const [email, setEmail] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [requestSent, setRequestSent] = useState(false);
  
  // Handle Zustand error syncing with form errors
  useEffect(() => {
    if (error) {
      setFormErrors({
        email: error.includes('email') ? error : 'Failed to process your request. Please try again.',
      });
      
      // Clear the global error
      clearError();
    }
  }, [error, clearError]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    
    // Clear error when user starts typing again
    if (formErrors.email) {
      setFormErrors({});
    }
  };
  
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await forgotPassword(email);
      setRequestSent(true);
    } catch (error) {
      console.error("Password reset request failed:", error);
      // Error handling is managed by the useEffect watching the error state
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
      
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
        <Link href="/" className="flex items-center space-x-2">
          <CheckSquare className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">TaskTrek</span>
        </Link>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </Button>
      </div>
      
      {/* Main content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md mx-auto relative z-10"
      >
        <Card className="border-border shadow-lg">
          {requestSent ? (
            // Success state
            <>
              <CardHeader className="space-y-1 text-center">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </motion.div>
                <CardTitle className="text-2xl font-bold">
                  Check your email
                </CardTitle>
                <CardDescription>
                  We&apos;ve sent a password reset link to your email address
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    We sent a password reset link to{' '}
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    If you don&apos;t see the email, check your spam folder or make sure the email address is correct.
                  </p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setRequestSent(false)}
                    className="w-full"
                  >
                    Try different email
                  </Button>
                  
                  <Button 
                    asChild
                    variant="ghost"
                    className="w-full"
                  >
                    <Link href="/signIn">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to sign in
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </>
          ) : (
            // Request form
            <>
              <CardHeader className="space-y-1">
                <div className="flex items-center mb-4">
                  <Button 
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground -ml-2"
                  >
                    <Link href="/signIn">
                      <ArrowLeft className="mr-1 h-4 w-4" />
                      Back to sign in
                    </Link>
                  </Button>
                </div>
                
                <CardTitle className="text-2xl font-bold">
                  Forgot your password?
                </CardTitle>
                <CardDescription>
                  No worries, we&apos;ll send you reset instructions.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Error message */}
                {formErrors.email && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formErrors.email}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className={`pl-10 ${formErrors.email ? 'border-destructive' : ''}`}
                        required
                      />
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reset Password
                  </Button>
                </form>
              </CardContent>
              
              <CardFooter>
                <p className="text-center text-sm text-muted-foreground w-full">
                  Remember your password?{' '}
                  <Link href="/signIn" className="text-primary font-medium hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </>
          )}
        </Card>
      </motion.div>
      
      {/* Footer */}
      <footer className="absolute bottom-6 left-6 right-6 text-center text-sm text-muted-foreground z-10">
        <p>© {new Date().getFullYear()} TaskTrek. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ForgotPasswordPage;