"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Rocket, Users, Star } from 'lucide-react';

const CtaSection = () => {
  const benefits = [
    "Free 14-day trial",
    "No credit card required",
    "Setup in minutes",
    "Cancel anytime"
  ];

  return (
    <section className="py-20 sm:py-32 bg-white dark:bg-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-sm font-medium mb-8">
            <Rocket className="h-4 w-4 mr-2" />
            Ready to Get Started?
          </div>

          {/* Main headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-black dark:text-white mb-6">
            Transform your team&apos;s
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              productivity today
            </span>
          </h2>

          {/* Description */}
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            Join thousands of teams who have already transformed their workflow. 
            Start your free trial and experience the difference TaskTrek makes.
          </p>

          {/* Benefits list */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-2xl mx-auto"
          >
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center justify-center text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">{benefit}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link
              href="/signUp"
              className="group bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <button className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-black dark:text-white rounded-lg font-semibold text-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
              Watch Demo
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-2xl font-bold text-black dark:text-white">50K+</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Users</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-2xl font-bold text-black dark:text-white">4.9/5</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">User Rating</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-2xl font-bold text-black dark:text-white">99.9%</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Uptime</p>
            </div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            viewport={{ once: true }}
            className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Trusted by teams at
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="bg-black-200 dark:bg-black-700 px-6 py-2 rounded text-sm font-medium text-gray-600 dark:text-gray-300">
                TechCorp
              </div>
              <div className="bg-black-200 dark:bg-black-700 px-6 py-2 rounded text-sm font-medium text-gray-600 dark:text-gray-300">
                StartupXYZ
              </div>
              <div className="bg-black-200 dark:bg-black-700 px-6 py-2 rounded text-sm font-medium text-gray-600 dark:text-gray-300">
                InnovateCo
              </div>
              <div className="bg-black-200 dark:bg-black-700 px-6 py-2 rounded text-sm font-medium text-gray-600 dark:text-gray-300">
                BuildTech
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CtaSection;
