"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Eye, EyeOff, Loader2, AlertCircle, Check, X, Lock, CheckCircle, CheckSquare
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useTheme } from 'next-themes';

// Password validation type
type PasswordValidationKey = 'hasMinLength' | 'hasUpperCase' | 'hasLowerCase' | 'hasNumber' | 'hasSpecialChar';

interface ValidationRequirement {
  key: PasswordValidationKey;
  label: string;
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { theme, setTheme } = useTheme();
  
  // Get auth actions from Zustand store
  const { resetPassword, isLoading, error, clearError } = useAuthStore();
  
  // Form state
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Password validation
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  
  // Define validation requirements
  const validationRequirements: ValidationRequirement[] = [
    { key: 'hasMinLength', label: 'At least 8 characters' },
    { key: 'hasUpperCase', label: 'At least one uppercase letter' },
    { key: 'hasLowerCase', label: 'At least one lowercase letter' },
    { key: 'hasNumber', label: 'At least one number' },
    { key: 'hasSpecialChar', label: 'At least one special character' },
  ];
  
  // Handle Zustand error syncing with form errors
  useEffect(() => {
    if (error) {
      if (error.includes('token')) {
        setFormErrors({
          general: 'Invalid or expired token. Please request a new password reset link.'
        });
      } else if (error.includes('password')) {
        setFormErrors({
          password: error
        });
      } else {
        setFormErrors({
          general: error
        });
      }
      
      // Clear the global error
      clearError();
    }
  }, [error, clearError]);
  
  // Validate password as user types
  useEffect(() => {
    setPasswordValidation({
      hasMinLength: formData.password.length >= 8,
      hasUpperCase: /[A-Z]/.test(formData.password),
      hasLowerCase: /[a-z]/.test(formData.password),
      hasNumber: /\d/.test(formData.password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    });
  }, [formData.password]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing again
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (!passwordValidation.hasMinLength) {
      errors.password = "Password must be at least 8 characters";
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    // Check all password requirements
    const allRequirementsMet = Object.values(passwordValidation).every(value => value);
    if (!allRequirementsMet && !errors.password) {
      errors.password = "Password doesn't meet all requirements";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm() || !token) {
      return;
    }
    
    try {
      await resetPassword(token, formData.password);
      setResetSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/signIn');
      }, 3000);
      
    } catch (error) {
      console.error("Password reset failed:", error);
      // Error handling is managed by the useEffect watching the error state
    }
  };
  
  const getPasswordStrength = () => {
    const validCount = Object.values(passwordValidation).filter(v => v).length;
    return (validCount / 5) * 100;
  };
  
  const getPasswordStrengthLabel = () => {
    const validCount = Object.values(passwordValidation).filter(v => v).length;
    if (validCount === 5) return 'Strong';
    if (validCount >= 3) return 'Good';
    if (validCount >= 2) return 'Fair';
    return 'Weak';
  };
  
  const getPasswordStrengthColor = () => {
    const validCount = Object.values(passwordValidation).filter(v => v).length;
    if (validCount === 5) return 'text-green-500';
    if (validCount >= 3) return 'text-blue-500';
    if (validCount >= 2) return 'text-yellow-500';
    return 'text-destructive';
  };
  
  if (!token) {
    router.push('/forgot-password');
    return null;
  }
  
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
          {resetSuccess ? (
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
                  Password reset successful!
                </CardTitle>
                <CardDescription>
                  Your password has been reset successfully
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    You will be redirected to the login page shortly.
                  </p>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-green-500 w-full transition-all duration-300" />
                  </div>
                </div>
                
                <Button asChild className="w-full">
                  <Link href="/signIn">
                    Go to login page
                  </Link>
                </Button>
              </CardContent>
            </>
          ) : (
            // Reset password form
            <>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">
                  Reset password
                </CardTitle>
                <CardDescription>
                  Create a new secure password for your account
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* General error message */}
                {formErrors.general && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formErrors.general}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">New Password</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className={`pl-10 pr-10 ${formErrors.password ? 'border-destructive' : ''}`}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    
                    {/* Password strength meter */}
                    {formData.password && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Password strength:</span>
                          <span className={`text-xs font-medium ${getPasswordStrengthColor()}`}>
                            {getPasswordStrengthLabel()}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${getPasswordStrength()}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {formErrors.password && (
                      <p className="text-sm text-destructive flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        {formErrors.password}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className={`pl-10 pr-10 ${formErrors.confirmPassword ? 'border-destructive' : ''}`}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    
                    {formData.confirmPassword && formData.password === formData.confirmPassword && !formErrors.confirmPassword && (
                      <p className="text-sm text-green-500 flex items-center">
                        <Check className="h-4 w-4 mr-1 flex-shrink-0" />
                        Passwords match
                      </p>
                    )}
                    
                    {formErrors.confirmPassword && (
                      <p className="text-sm text-destructive flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                        {formErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                  
                  {/* Password requirements checklist */}
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">Password requirements:</p>
                    <div className="grid grid-cols-1 gap-1">
                      {validationRequirements.map(({ key, label }) => (
                        <div key={key} className="flex items-center text-xs">
                          {passwordValidation[key] ? (
                            <Check className="h-3 w-3 text-green-500 mr-2" />
                          ) : (
                            <X className="h-3 w-3 text-muted-foreground mr-2" />
                          )}
                          <span className={passwordValidation[key] ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || !Object.values(passwordValidation).every(v => v)}
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
}

// Main component that wraps with Suspense
const ResetPasswordPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;