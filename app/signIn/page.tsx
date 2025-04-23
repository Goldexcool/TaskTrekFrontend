/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Eye, EyeOff, Loader2, AlertCircle, Mail, User, Lock,
  Menu, X as XIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../store/useAuthStore';

const SignInPage = () => {
  const router = useRouter();
  
  // Get auth actions from Zustand store
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  
  // Form state
  const [formData, setFormData] = useState({
    identifier: '', // Can be email or username
    password: '',
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [usernameExists, setUsernameExists] = useState<boolean | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  // Handle Zustand error syncing with form errors
  useEffect(() => {
    if (error) {
      // Handle different types of errors
      if (error.includes('credentials') || error.includes('password')) {
        setFormErrors({
          identifier: "Invalid username/email or password",
          password: "Invalid username/email or password"
        });
      } else if (error.includes('username') || error.includes('email')) {
        setFormErrors({
          identifier: error
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
  
  // Function to check if username exists (simulated)
  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) return;
    
    setIsCheckingUsername(true);
    
    try {
      // Simulate API call to check username
      // In production, you would call your actual API endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check-username?username=${username}`, {
        method: 'GET',
      }).catch(() => {
        // If endpoint doesn't exist, we'll just simulate for demo
        return new Response(JSON.stringify({ 
          exists: Math.random() > 0.5 // Randomly return true/false for demo
        }));
      });
      
      const data = await response.json();
      
      setUsernameExists(data.exists);
      
      if (data.exists) {
        setFormErrors({
          ...formErrors,
          identifier: "This username is already taken. Please try another or sign in."
        });
      } else {
        // Clear the error if username is available
        const newErrors = {...formErrors};
        delete newErrors.identifier;
        setFormErrors(newErrors);
      }
    } catch (error) {
      console.error("Error checking username:", error);
    } finally {
      setIsCheckingUsername(false);
    }
  };
  
  // Debounce the username check to avoid too many API calls
  useEffect(() => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier);
    
    if (!isEmail && formData.identifier.length >= 3) {
      const timer = setTimeout(() => {
        checkUsername(formData.identifier);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [formData.identifier]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset username exists state when typing
    if (name === 'identifier') {
      setUsernameExists(null);
    }
    
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
    
    if (!formData.identifier.trim()) {
      errors.identifier = "Username or email is required";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
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
      // Determine if the identifier is an email or username
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier);
      
      // Call the login function with appropriate parameters
      if (isEmail) {
        await login(formData.identifier, formData.password);
      } else {
        // Your API might need different parameters for username vs email login
        await login(formData.identifier, formData.password);
      }
      
      // If login is successful, router will redirect in the useEffect
      
    } catch (error) {
      console.error("Sign in failed:", error);
      // Error handling is managed by the useEffect that watches the error state
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] relative overflow-hidden">
      {/* Animated background - responsive & lighter on mobile */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 bg-[length:200%_200%] bg-[0%_0%]"></div>
      
      {/* Decorative elements - hidden on smaller screens */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-indigo-100 rounded-full opacity-70 blur-3xl transform -translate-y-1/2 translate-x-1/4 hidden sm:block"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-purple-100 rounded-full opacity-70 blur-3xl transform translate-y-1/2 -translate-x-1/4 hidden sm:block"></div>
      
      {/* Header */}
      <header className="py-4 md:py-6 px-4 md:px-8 relative z-10 border-b border-gray-200 md:border-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <span className="text-lg md:text-xl font-bold text-[#111827]">TaskTrek</span>
          </Link>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <XIcon size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Desktop navigation */}
          <nav className="hidden md:block">
            <ul className="flex space-x-8">
              <li>
                <Link 
                  href="/signUp" 
                  className="text-gray-600 hover:text-[#6366F1] transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </li>
              <li>
                <Link 
                  href="/pricing" 
                  className="text-gray-600 hover:text-[#6366F1] transition-colors font-medium"
                >
                  Pricing
                </Link>
              </li>
              <li>
                {/* <Link 
                  href="/features" 
                  className="text-gray-600 hover:text-[#6366F1] transition-colors font-medium"
                >
                  Features
                </Link> */}
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden mt-2 border-t border-gray-200"
          >
            <nav className="py-3">
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/signUp" 
                    className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/pricing" 
                    className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  {/* <Link 
                    href="/features" 
                    className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Features
                  </Link> */}
                </li>
              </ul>
            </nav>
          </motion.div>
        )}
      </header>
      
      {/* Main content */}
      <main className="flex-grow flex items-center justify-center px-4 py-6 md:py-12 relative z-10">
        <div className="w-full max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-white rounded-xl md:rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden p-5 md:p-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2">
                  Welcome back
                </h1>
                <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">
                  Sign in to your TaskTrek account
                </p>
                
                {/* General error message */}
                {formErrors.general && (
                  <div className="mb-5 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs md:text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2 flex-shrink-0" />
                      {formErrors.general}
                    </p>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div>
                    <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                      Username or Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.identifier) ? (
                          <Mail className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                        ) : (
                          <User className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                        )}
                      </div>
                      <input
                        type="text"
                        id="identifier"
                        name="identifier"
                        value={formData.identifier}
                        onChange={handleChange}
                        required
                        className={`w-full text-gray-700 pl-10 pr-4 py-2 md:py-3 text-sm md:text-base rounded-lg md:rounded-xl border ${formErrors.identifier ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'} focus:border-[#6366F1] transition-colors`}
                        placeholder="johndoe or john@example.com"
                      />
                      {isCheckingUsername && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 size={16} className="animate-spin text-gray-400 md:h-[18px] md:w-[18px]" />
                        </div>
                      )}
                      {usernameExists === false && !formErrors.identifier && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {formErrors.identifier && (
                      <p className="mt-1 text-xs md:text-sm text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                        {formErrors.identifier}
                      </p>
                    )}
                    {usernameExists === true && !formErrors.identifier && (
                      <p className="mt-1 text-xs md:text-sm text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                        This username is already taken. Please try another or sign in.
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                      </label>
                      <Link href="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className={`w-full text-gray-700 text-sm md:text-base pl-10 pr-10 py-2 md:py-3 rounded-lg md:rounded-xl border ${formErrors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'} focus:border-[#6366F1] transition-colors`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 
                          <EyeOff size={16} className="md:h-[18px] md:w-[18px]" /> : 
                          <Eye size={16} className="md:h-[18px] md:w-[18px]" />
                        }
                      </button>
                    </div>
                    {formErrors.password && (
                      <p className="mt-1 text-xs md:text-sm text-red-500 flex items-center">
                        <AlertCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 flex-shrink-0" />
                        {formErrors.password}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className="h-3 w-3 md:h-4 md:w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-xs md:text-sm text-gray-700">
                      Remember me
                    </label>
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full py-2 md:py-3 px-4 bg-[#6366F1] text-white text-sm md:text-base rounded-lg md:rounded-xl font-medium hover:bg-[#4F46E5] transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin mr-2 md:h-5 md:w-5" />
                    ) : null}
                    Sign in
                  </button>
                </form>
                
                <div className="mt-5 md:mt-6 text-center">
                  <p className="text-xs md:text-sm text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link href="/signUp" className="text-[#6366F1] font-medium hover:text-[#4F46E5] transition-colors">
                      Sign up
                    </Link>
                  </p>
                </div>
                
                {/* Social logins */}
                <div className="mt-6 md:mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-white text-xs md:text-sm text-gray-500">Or continue with</span>
                    </div>
                  </div>
                  
                  
                </div>
              </motion.div>
            </div>
            
          </motion.div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-4 md:py-6 px-4 md:px-8 text-center text-xs md:text-sm text-gray-500 relative z-10 border-t border-gray-200 mt-4">
        <p>© {new Date().getFullYear()} TaskTrek. All rights reserved.</p>
        <div className="flex flex-wrap justify-center gap-4 mt-2">
          <Link href="/privacy" className="hover:text-[#6366F1] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#6366F1] transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-[#6366F1] transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
};

export default SignInPage;