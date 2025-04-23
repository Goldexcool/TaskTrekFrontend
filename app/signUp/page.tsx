"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, Check, X, Eye, EyeOff, Loader2, 
  AlertCircle, CheckCircle, Menu, X as XIcon
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import useAuthStore from '../store/useAuthStore';

// Type definitions
type PasswordValidationKey = 'hasMinLength' | 'hasUpperCase' | 'hasLowerCase' | 'hasNumber' | 'hasSpecialChar' | 'passwordsMatch';

interface ValidationRequirement {
  key: PasswordValidationKey;
  label: string;
}

const SignUpPage = () => {
  const router = useRouter();
  
  // Get auth actions from Zustand store
  const { register, isLoading, error, clearError } = useAuthStore();
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    name: '', // Added name field
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Password validation
  const [passwordValidation, setPasswordValidation] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false,
  });
  
  // Define validation requirements
  const validationRequirements: ValidationRequirement[] = [
    { key: 'hasMinLength', label: 'At least 8 characters' },
    { key: 'hasUpperCase', label: 'At least one uppercase letter' },
    { key: 'hasLowerCase', label: 'At least one lowercase letter' },
    { key: 'hasNumber', label: 'At least one number' },
    { key: 'hasSpecialChar', label: 'At least one special character' },
    { key: 'passwordsMatch', label: 'Passwords match' },
  ];
  
  // GSAP animations
  const headerRef = useRef(null);
  const formRef = useRef(null);

  // Handle Zustand error syncing with form errors
  useEffect(() => {
    if (error) {
      // Determine which field the error relates to
      if (error.includes('email')) {
        setFormErrors({...formErrors, email: error});
      } else if (error.includes('username')) {
        setFormErrors({...formErrors, username: error});
      } else if (error.includes('password')) {
        setFormErrors({...formErrors, password: error});
      } else if (error.includes('name')) {
        setFormErrors({...formErrors, name: "Please add a name"});
        // If we're on step 2 and there's a name error, go back to step 1
        if (step === 2) {
          setStep(1);
        }
      }
      
      // Clear the global error
      clearError();
    }
  }, [error, clearError, formErrors, step]);
  
  // Validate password as user types
  useEffect(() => {
    setPasswordValidation({
      hasMinLength: formData.password.length >= 8,
      hasUpperCase: /[A-Z]/.test(formData.password),
      hasLowerCase: /[a-z]/.test(formData.password),
      hasNumber: /\d/.test(formData.password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
      passwordsMatch: 
        formData.confirmPassword.length > 0 && 
        formData.password === formData.confirmPassword,
    });
  }, [formData.password, formData.confirmPassword]);
  
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
  
  const validateStep1 = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = "Full name is required";
    }
    
    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const validateStep2 = () => {
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
    
    // Validate based on current step
    if (step === 1) {
      if (validateStep1()) {
        setStep(2);
      }
      return;
    }
    
    // Final validation
    if (!validateStep2()) {
      return;
    }
    
    try {
      // Call the register function from our auth store
      await register(formData.username, formData.email, formData.password, formData.name);
      
      // Show success message
      setSignupSuccess(true);
      
      // Redirect to login after delay
      setTimeout(() => {
        router.push('/signIn');
      }, 2000);
      
    } catch (error) {
      console.error("Sign up failed:", error);
      // Form errors will be handled by the useEffect
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB] relative overflow-hidden">
    
      {/* Header */}
      <header ref={headerRef} className="py-4 md:py-6 px-4 md:px-8 relative z-10 border-b border-gray-200 md:border-none">
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
                  href="/signIn" 
                  className="text-gray-600 hover:text-[#6366F1] transition-colors font-medium"
                >
                  Sign In
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
        <AnimatePresence>
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
                      href="/signIn" 
                      className="block px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign In
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
        </AnimatePresence>
      </header>
      
      {/* Main content */}
      <main className="flex-grow flex items-center justify-center px-4 py-6 md:py-12 relative z-10">
        <div 
          ref={formRef}
          className="w-full max-w-md mx-auto"
        >
          <AnimatePresence mode="wait">
            {signupSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl md:rounded-2xl shadow-xl border border-[#E5E7EB] p-6 md:p-8 text-center"
              >
                <div className="mx-auto w-14 h-14 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 md:mb-6">
                  <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-green-500" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#111827] mb-2">Account Created!</h2>
                <p className="text-gray-600 mb-6">
                  Your TaskTrek account has been successfully created. You&apos;ll be redirected to the login page shortly.
                </p>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="bg-white rounded-xl md:rounded-2xl shadow-xl border border-[#E5E7EB] overflow-hidden">
                  <div className="p-5 md:p-8">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <h1 className="text-2xl md:text-3xl font-bold text-[#111827] mb-2">
                        {step === 1 ? 'Create your account' : 'Set up your password'}
                      </h1>
                      <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8">
                        {step === 1 
                          ? 'Get started with TaskTrek and boost your productivity'
                          : 'Create a strong password to secure your account'
                        }
                      </p>
                      
                      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                        <AnimatePresence mode="wait">
                          {step === 1 ? (
                            <motion.div
                              key="step1"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-4 md:space-y-6"
                            >
                              <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                  Full Name
                                </label>
                                <input
                                  type="text"
                                  id="name"
                                  name="name"
                                  value={formData.name}
                                  onChange={handleChange}
                                  required
                                  className={`w-full px-3 md:px-4 py-2 md:py-3 text-gray-700 rounded-lg md:rounded-xl border ${formErrors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'} focus:border-[#6366F1] transition-colors`}
                                  placeholder="John Doe"
                                />
                                {formErrors.name && (
                                  <p className="mt-1 text-sm text-red-500 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                                    {formErrors.name}
                                  </p>
                                )}
                              </div>
                            
                              <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                  Username
                                </label>
                                <input
                                  type="text"
                                  id="username"
                                  name="username"
                                  value={formData.username}
                                  onChange={handleChange}
                                  required
                                  className={`w-full px-3 md:px-4 py-2 md:py-3 text-gray-700 rounded-lg md:rounded-xl border ${formErrors.username ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'} focus:border-[#6366F1] transition-colors`}
                                  placeholder="johndoe"
                                />
                                {formErrors.username && (
                                  <p className="mt-1 text-sm text-red-500 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                                    {formErrors.username}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                  Email Address
                                </label>
                                <input
                                  type="email"
                                  id="email"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleChange}
                                  required
                                  className={`w-full px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl text-gray-700 border ${formErrors.email ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'} focus:border-[#6366F1] transition-colors`}
                                  placeholder="john@example.com"
                                />
                                {formErrors.email && (
                                  <p className="mt-1 text-sm text-red-500 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                                    {formErrors.email}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="step2"
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-4 md:space-y-6"
                            >
                              <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                  Password
                                </label>
                                <div className="relative">
                                  <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className={`w-full px-3 md:px-4 py-2 md:py-3 pr-10 text-gray-700 rounded-lg md:rounded-xl border ${formErrors.password ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'} focus:border-[#6366F1] transition-colors`}
                                    placeholder="••••••••"
                                  />
                                  <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff size={16} className="md:h-[18px] md:w-[18px]" /> : <Eye size={16} className="md:h-[18px] md:w-[18px]" />}
                                  </button>
                                </div>
                                {formErrors.password && (
                                  <p className="mt-1 text-sm text-red-500 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                                    {formErrors.password}
                                  </p>
                                )}
                              </div>
                              
                              <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                  Confirm Password
                                </label>
                                <div className="relative">
                                  <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    className={`w-full text-gray-700 px-3 md:px-4 py-2 md:py-3 pr-10 rounded-lg md:rounded-xl border ${formErrors.confirmPassword ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-indigo-100'} focus:border-[#6366F1] transition-colors`}
                                    placeholder="••••••••"
                                  />
                                  <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  >
                                    {showConfirmPassword ? <EyeOff size={16} className="md:h-[18px] md:w-[18px]" /> : <Eye size={16} className="md:h-[18px] md:w-[18px]" />}
                                  </button>
                                </div>
                                {formErrors.confirmPassword && (
                                  <p className="mt-1 text-sm text-red-500 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-1 flex-shrink-0" />
                                    {formErrors.confirmPassword}
                                  </p>
                                )}
                              </div>
                              
                              {/* Password requirements checklist */}
                              <div className="bg-gray-50 p-3 md:p-4 rounded-lg md:rounded-xl">
                                <h3 className="text-xs md:text-sm font-medium text-gray-700 mb-2">
                                  Password requirements:
                                </h3>
                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-2 md:gap-y-2">
                                  {validationRequirements.map(({ key, label }) => (
                                    <li key={key} className="flex items-center text-xs md:text-sm">
                                      {passwordValidation[key] ? (
                                        <Check size={14} className="text-green-500 mr-1 md:mr-2 flex-shrink-0" />
                                      ) : (
                                        <X size={14} className="text-gray-400 mr-1 md:mr-2 flex-shrink-0" />
                                      )}
                                      <span className={passwordValidation[key] ? 'text-gray-700' : 'text-gray-500'}>
                                        {label}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        
                        <div className="flex items-center justify-between pt-2">
                          {step === 2 && (
                            <button
                              type="button"
                              onClick={() => setStep(1)}
                              className="text-gray-500 hover:text-gray-700 transition-colors flex items-center text-sm"
                            >
                              <ArrowRight className="h-3 w-3 md:h-4 md:w-4 mr-1 rotate-180" />
                              Back
                            </button>
                          )}
                          
                          <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`py-2 md:py-3 px-6 md:px-8 bg-[#6366F1] text-white text-sm md:text-base rounded-lg md:rounded-xl font-medium hover:bg-[#4F46E5] transition-colors shadow-md hover:shadow-lg flex items-center justify-center ${step === 1 ? 'ml-auto' : 'w-auto'}`}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 size={18} className="animate-spin mr-2" />
                            ) : null}
                            {step === 1 ? (
                              <>
                                Continue
                                <ArrowRight size={16} className="ml-2" />
                              </>
                            ) : (
                              'Create Account'
                            )}
                          </motion.button>
                        </div>
                      </form>
                      
                      <div className="mt-5 md:mt-6 text-center">
                        <p className="text-sm text-gray-600">
                          Already have an account?{' '}
                          <Link href="/signIn" className="text-[#6366F1] font-medium hover:text-[#4F46E5] transition-colors">
                            Sign in
                          </Link>
                        </p>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="bg-gray-50 p-3 md:p-4 flex justify-between items-center border-t border-[#E5E7EB]">
                    <div className="flex space-x-2">
                      <div className={`h-1.5 md:h-2 w-12 md:w-16 rounded-full ${step >= 1 ? 'bg-[#6366F1]' : 'bg-gray-200'}`}></div>
                      <div className={`h-1.5 md:h-2 w-12 md:w-16 rounded-full ${step >= 2 ? 'bg-[#6366F1]' : 'bg-gray-200'}`}></div>
                    </div>
                    <div className="text-xs md:text-sm text-gray-500">
                      Step {step} of 2
                    </div>
                  </div>
                </div>
                
               
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      
      {/* Footer - Responsive */}
      <footer className="py-4 md:py-6 px-4 md:px-8 text-center text-xs md:text-sm text-gray-500 relative z-10 border-t border-gray-200 mt-4">
        <p>© {new Date().getFullYear()} TaskTrek. All rights reserved.</p>
        <div className="flex justify-center flex-wrap gap-4 mt-2">
          <Link href="/privacy" className="hover:text-[#6366F1] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#6366F1] transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-[#6366F1] transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
};

export default SignUpPage;
