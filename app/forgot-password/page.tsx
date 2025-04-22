/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Loader2, AlertCircle, Mail, CheckCircle
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const ForgotPasswordPage = () => {
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
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 bg-[length:200%_200%] bg-[0%_0%]"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-100 rounded-full opacity-70 blur-3xl transform -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-100 rounded-full opacity-70 blur-3xl transform translate-y-1/2 -translate-x-1/4"></div>
      
      {/* Header */}
      <header className="py-6 px-8 relative z-10">
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
                {requestSent ? (
                  // Success state
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                      <CheckCircle className="h-10 w-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                    <p className="text-gray-600 mb-6">
                      We&apos;ve sent a password reset link to <span className="font-medium">{email}</span>. 
                      Please check your inbox and follow the instructions to reset your password.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                      If you don&apos;t see the email, check your spam folder or make sure the email address is correct.
                    </p>
                    <div className="flex flex-col space-y-3">
                      <button 
                        type="button"
                        onClick={() => setRequestSent(false)}
                        className="inline-flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Try different email
                      </button>
                      <Link
                        href="/signIn"
                        className="inline-flex justify-center py-2.5 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Back to sign in
                      </Link>
                    </div>
                  </div>
                ) : (
                  // Request form
                  <>
                    <Link href="/signIn" className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-6">
                      <ArrowLeft className="mr-1 h-4 w-4" />
                      Back to sign in
                    </Link>
                    
                    <h1 className="text-3xl font-bold text-[#111827] mb-2">
                      Forgot your password?
                    </h1>
                    <p className="text-gray-600 mb-8">
                      No worries, we&apos;ll send you reset instructions.
                    </p>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={handleChange}
                            required
                            className={`w-full pl-10 pr-4 text-gray-700 py-3 rounded-xl border ${formErrors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'} focus:border-[#6366F1] transition-colors`}
                            placeholder="you@example.com"
                          />
                        </div>
                        {formErrors.email && (
                          <p className="mt-1 text-sm text-red-500 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                            {formErrors.email}
                          </p>
                        )}
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
};

export default ForgotPasswordPage;