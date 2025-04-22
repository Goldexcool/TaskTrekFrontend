"use client"
import React  from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const CtaSection = () => {
  return (
    <section className="py-24 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[50%] -right-[10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-[50%] -left-[10%] w-[60%] h-[60%] bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-4xl font-bold text-white mb-4">
                Ready to boost your team&apos;s productivity?
              </h2>
              <p className="text-xl text-indigo-100 mb-10">
                Join thousands of teams already using TaskTrek to collaborate and get more done.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link
                  href="/signUp"
                  className="bg-white text-[#6366F1] py-3 px-8 rounded-xl font-medium hover:bg-opacity-95 transition-colors shadow-lg w-full sm:w-auto"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/contact"
                  className="bg-transparent text-white py-3 px-8 rounded-xl font-medium border border-white hover:bg-white/10 transition-colors w-full sm:w-auto"
                >
                  Contact Sales
                </Link>
              </div>
              <p className="mt-4 text-indigo-200 text-sm">No credit card required • 14-day free trial</p>
            </motion.div>
          </div>
        </div>
      </section>
  );
}

export default CtaSection;
