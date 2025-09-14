"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, Play, Star, Users, Layers, Clock } from 'lucide-react';
import Link from 'next/link';

const Hero = () => {
  return (
    <section className="relative py-20 sm:py-32 bg-white dark:bg-black overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full">
          <div className="w-full h-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(59,130,246,0.1),rgba(0,0,0,0))]"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto"
          >
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
              <Star className="h-4 w-4 mr-2" />
              Trusted by 10,000+ teams worldwide
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-black dark:text-white leading-tight mb-6">
              Organize work.
              <br />
              <span className="text-blue-600 dark:text-blue-400">Achieve more.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              TaskTrek is the all-in-one workspace where teams plan, track, and deliver outstanding work together.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link
                href="/signUp"
                className="w-full sm:w-auto bg-blue-600 text-white py-4 px-8 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center group"
              >
                Start for free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="w-full sm:w-auto bg-transparent border-2 border-gray-300 dark:border-gray-700 text-black dark:text-white py-4 px-8 rounded-lg font-semibold hover:border-blue-600 dark:hover:border-blue-400 transition-all flex items-center justify-center group">
                <Play className="mr-2 h-5 w-5" />
                Watch demo
              </button>
            </div>

            {/* Social proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 bg-black-300 dark:bg-black-700 rounded-full border-2 border-white dark:border-black flex items-center justify-center"
                    >
                      <Users className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                  ))}
                </div>
                <span>10,000+ active users</span>
              </div>
              <div className="flex items-center">
                <div className="flex mr-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <span>4.9/5 rating</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Project Boards</h3>
            <p className="text-gray-600 dark:text-gray-400">Organize work in flexible boards that adapt to your team&apos;s workflow.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950/50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Task Management</h3>
            <p className="text-gray-600 dark:text-gray-400">Create, assign, and track tasks with deadlines and priorities.</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-black dark:text-white mb-2">Time Tracking</h3>
            <p className="text-gray-600 dark:text-gray-400">Monitor progress and meet deadlines with built-in time tracking.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
