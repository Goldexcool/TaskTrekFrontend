"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Eye, EyeOff, Loader2, AlertCircle, Check, X, Lock, CheckCircle
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

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
  
  if (!token) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] relative overflow-hidden">
      {/* Animated background */}
      <div  className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 bg-[length:200%_200%] bg-[0%_0%]"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-100 rounded-full opacity-70 blur-3xl transform -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-100 rounded-full opacity-70 blur-3xl transform translate-y-1/2 -translate-x-1/4"></div>
      
      {/* Header */}
      <header  className="py-6 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-[#111827]">TaskTrek</span>
          </Link>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-grow flex items-center justify-center px-4 py-12 relative z-10">
        <div 
       
          className="w-full max-w-md"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {resetSuccess ? (
                  // Success state
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Password reset successful!</h2>
                    <p className="text-gray-600 mb-6">
                      Your password has been reset successfully. You will be redirected to the login page shortly.
                    </p>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-green-500"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 3 }}
                      />
                    </div>
                    <div className="mt-6">
                      <Link
                        href="/signIn"
                        className="inline-flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Go to login page
                      </Link>
                    </div>
                  </div>
                ) : (
                  // Reset password form
                  <>
                    <h1 className="text-3xl font-bold text-[#111827] mb-2">
                      Reset password
                    </h1>
                    <p className="text-gray-600 mb-8">
                      Create a new secure password for your account
                    </p>
                    
                    {/* General error message */}
                    {formErrors.general && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                          {formErrors.general}
                        </p>
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className={`w-full pl-10 pr-10 py-3 rounded-xl border ${formErrors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'} focus:border-[#6366F1] transition-colors`}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {formErrors.password && (
                          <p className="mt-1 text-sm text-red-500 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                            {formErrors.password}
                          </p>
                        )}
                        
                        {/* Password strength meter */}
                        {formData.password && (
                          <div className="mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-500">Password strength:</span>
                              <span 
                                className={`text-xs font-medium ${
                                  Object.values(passwordValidation).every(v => v)
                                    ? 'text-green-500' 
                                    : Object.values(passwordValidation).filter(v => v).length >= 3
                                      ? 'text-blue-500' 
                                      : Object.values(passwordValidation).filter(v => v).length >= 2
                                        ? 'text-yellow-500' 
                                        : 'text-red-500'
                                }`}
                              >
                                {Object.values(passwordValidation).every(v => v)
                                  ? 'Strong' 
                                  : Object.values(passwordValidation).filter(v => v).length >= 3
                                    ? 'Good' 
                                    : Object.values(passwordValidation).filter(v => v).length >= 2
                                      ? 'Fair' 
                                      : 'Weak'}
                              </span>
                            </div>
                            
                            <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                              <motion.div 
                                className={`h-full transition-all duration-300 ${
                                  Object.values(passwordValidation).every(v => v)
                                    ? 'bg-green-500' 
                                    : Object.values(passwordValidation).filter(v => v).length >= 3
                                      ? 'bg-blue-500' 
                                      : Object.values(passwordValidation).filter(v => v).length >= 2
                                        ? 'bg-yellow-500' 
                                        : 'bg-red-500'
                                }`}
                                initial={{ width: "0%" }}
                                animate={{ 
                                  width: Object.values(passwordValidation).filter(v => v).length / 5 * 100 + "%"
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                          Confirm Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className={`w-full pl-10 pr-10 py-3 rounded-xl border ${formErrors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'} focus:border-[#6366F1] transition-colors`}
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        {formErrors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-500 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                            {formErrors.confirmPassword}
                          </p>
                        )}
                        {formData.confirmPassword && formData.password === formData.confirmPassword && !formErrors.confirmPassword && (
                          <p className="mt-1 text-sm text-green-500 flex items-center">
                            <Check className="h-4 w-4 mr-1 flex-shrink-0" />
                            Passwords match
                          </p>
                        )}
                      </div>
                      
                      {/* Password requirements checklist */}
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                          Password requirements:
                        </h3>
                        <ul className="space-y-2">
                          {validationRequirements.map(({ key, label }) => (
                            <li key={key} className="flex items-center text-sm">
                              {passwordValidation[key] ? (
                                <Check size={16} className="text-green-500 mr-2 flex-shrink-0" />
                              ) : (
                                <X size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                              )}
                              <span className={passwordValidation[key] ? 'text-gray-700' : 'text-gray-500'}>
                                {label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 px-4 bg-[#6366F1] text-white rounded-xl font-medium hover:bg-[#4F46E5] transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 size={20} className="animate-spin mr-2" />
                        ) : null}
                        Reset Password
                      </motion.button>
                    </form>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-6 px-8 text-center text-sm text-gray-500 relative z-10">
        <p>© {new Date().getFullYear()} TaskTrek. All rights reserved.</p>
        <div className="flex justify-center space-x-4 mt-2">
          <Link href="/privacy" className="hover:text-[#6366F1] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#6366F1] transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}

// Main component that wraps with Suspense
const ResetPasswordPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9FAFB]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPasswordPage;