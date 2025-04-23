/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"
import Link from 'next/link';
import React, { useState } from 'react';
import Image from 'next/image';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, X, CheckCircle, ChevronRight, Users, Layers, Calendar, Bell } from 'lucide-react';


const Navbar = () => {
      const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
      const controls = useAnimation();
    
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Link href="/" className="flex items-center">
                    <span className="text-xl font-bold text-[#111827]">TaskTrek</span>
                  </Link>
                </div>
                
                {/* Desktop navigation */}
                <div className="hidden md:flex items-center space-x-8">
                  {/* <Link href="/features" className="text-[#111827] hover:text-[#6366F1] transition-colors">
                    Features
                  </Link> */}
                  <Link href="/pricing" className="text-[#111827] hover:text-[#6366F1] transition-colors">
                    Pricing
                  </Link>
                  <Link href="/about" className="text-[#111827] hover:text-[#6366F1] transition-colors">
                    About
                  </Link>
                  <Link href="/signIn" className="text-[#6366F1] font-medium hover:text-[#4F46E5] transition-colors">
                    Sign in
                  </Link>
                  <Link 
                    href="/signUp" 
                    className="bg-[#6366F1] text-white py-2.5 px-5 rounded-xl font-medium hover:bg-[#4F46E5] transition-colors shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </Link>
                </div>
                
                {/* Mobile menu button */}
                <div className="md:hidden">
                  <button 
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="text-[#111827] hover:text-[#6366F1]"
                  >
                    {mobileMenuOpen ? (
                      <X size={24} />
                    ) : (
                      <Menu size={24} />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Mobile menu */}
              <AnimatePresence>
                {mobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="md:hidden py-4 overflow-hidden"
                  >
                    <div className="flex flex-col space-y-4">
                      {/* <Link 
                        href="/features" 
                        className="text-[#111827] hover:text-[#6366F1] transition-colors px-2 py-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Features
                      </Link> */}
                      <Link 
                        href="/" 
                        className="text-[#111827] hover:text-[#6366F1] transition-colors px-2 py-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Pricing
                      </Link>
                      <Link 
                        href="/" 
                        className="text-[#111827] hover:text-[#6366F1] transition-colors px-2 py-1"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        About
                      </Link>
                      <div className="pt-2 flex flex-col space-y-3">
                        <Link 
                          href="/signIn" 
                          className="text-[#6366F1] font-medium hover:text-[#4F46E5] transition-colors px-2 py-1"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Sign in
                        </Link>
                        <Link 
                          href="/signUp" 
                          className="bg-[#6366F1] text-white py-2 px-4 rounded-xl font-medium hover:bg-[#4F46E5] transition-colors text-center shadow-sm"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Get Started
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </nav>
          </header>
  );
}

export default Navbar;
