"use client"
import React, { useEffect } from 'react'
import Image from 'next/image';
import { motion, useAnimation } from 'framer-motion';
import { ArrowRight, CheckCircle, Bell } from 'lucide-react';
import Link from 'next/link';
import heroImage from '../Images/clipboard_with_pen_and_bell_notification_checklist_form_report_checkbox_business_3d_background_illustration.jpg';
import user1 from '../Images/user1.jpg';
import user2 from '../Images/user2.jpg';
import user3 from '../Images/user3.jpg';
import user4 from '../Images/user1.jpg';

const Hero = () => {
      const controls = useAnimation();
      useEffect(() => {
        const handleScroll = () => {
          const scrollY = window.scrollY;
          controls.start({ y: scrollY * 0.1 });
        };
    
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
      }, [controls]);
    return (
        <section className="relative py-24 overflow-hidden bg-gradient-to-b from-[#F9FAFB] to-white">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-50 rounded-full opacity-70 blur-3xl"></div>
                <div className="absolute top-[20%] -left-[5%] w-[30%] h-[30%] bg-amber-50 rounded-full opacity-70 blur-3xl"></div>
                <div className="absolute -bottom-[10%] left-[30%] w-[40%] h-[40%] bg-violet-50 rounded-full opacity-70 blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                <div className="flex flex-col lg:flex-row items-center gap-12">
                    <div className="lg:w-1/2 z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                        >
                            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#111827] leading-tight mb-6">
                                Simplify your workflow with <span className="text-[#6366F1]">TaskTrek</span>
                            </h1>
                            <p className="text-xl text-gray-600 mb-8 max-w-lg">
                                The all-in-one platform for teams to organize tasks, collaborate seamlessly, and boost productivity.
                            </p>
                            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
                                <Link
                                    href="/signUp"
                                    className="bg-[#6366F1] text-white py-3 px-8 rounded-xl font-medium hover:bg-[#4F46E5] transition-all shadow-md hover:shadow-lg flex items-center justify-center group"
                                >
                                    Get Started Free
                                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/demo"
                                    className="bg-white text-[#111827] py-3 px-8 rounded-xl font-medium border border-[#E5E7EB] hover:border-[#6366F1] transition-all shadow-sm hover:shadow flex items-center justify-center"
                                >
                                    Watch Demo
                                </Link>
                            </div>

                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <div className="flex -space-x-2">
                                    {[user1, user2, user3, user4].map((userImg, i) => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden relative">
                                            <Image
                                                src={userImg}
                                                alt={`User ${i+1}`}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center">
                                    <span className="text-[#10B981] mr-1">★</span>
                                    <span className="text-[#10B981] mr-1">★</span>
                                    <span className="text-[#10B981] mr-1">★</span>
                                    <span className="text-[#10B981] mr-1">★</span>
                                    <span className="text-[#10B981] mr-1">★</span>
                                    <span className="ml-1 font-medium">4.9/5</span>
                                </div>
                                <span>from 500+ reviews</span>
                            </div>
                        </motion.div>
                    </div>

                    <div className="lg:w-1/2 z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7, delay: 0.3 }}
                            className="relative"
                        >
                            {/* Main dashboard image */}
                            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-[#E5E7EB]">
                                <Image
                                    src={heroImage}
                                    alt="TaskTrek Dashboard"
                                    width={800}
                                    height={500}
                                    className="object-cover rounded-2xl"
                                />
                            </div>

                            {/* Floating elements */}
                            <motion.div
                                className="absolute -right-10 -bottom-10 w-48 rounded-xl overflow-hidden shadow-lg bg-white p-3"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
                            >
                                <div className="bg-green-50 rounded-lg p-2 mb-2">
                                    <div className="flex items-center">
                                        <CheckCircle className="h-5 w-5 text-[#10B981] mr-2" />
                                        <span className="text-sm font-medium text-gray-800">Task completed</span>
                                    </div>
                                </div>
                                <div className="flex items-center text-sm">
                                    <div className="w-6 h-6 rounded-full overflow-hidden relative mr-2">
                                        <Image
                                            src={user1}
                                            alt="User Avatar"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <span className="text-gray-600">Just now</span>
                                </div>
                            </motion.div>

                            <motion.div
                                className="absolute -left-8 top-10 w-44 rounded-xl overflow-hidden shadow-lg bg-white p-3"
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 6, repeat: Infinity, repeatType: "reverse", delay: 1 }}
                            >
                                <div className="flex items-center mb-2">
                                    <Bell className="h-5 w-5 text-[#F59E0B] mr-2" />
                                    <span className="text-sm font-medium text-gray-800">Reminder</span>
                                </div>
                                <p className="text-xs text-gray-600">Team meeting in 30 minutes</p>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Hero
