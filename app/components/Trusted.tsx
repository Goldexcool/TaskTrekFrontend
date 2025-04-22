/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import Link from 'next/link';
import Image from 'next/image';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { ArrowRight, Menu, X, CheckCircle, ChevronRight, Users, Layers, Calendar, Bell } from 'lucide-react';

const Trusted = () => {
  return (
   <section className="py-16 bg-white">
           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
             <div className="text-center mb-10">
               <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Trusted by innovative teams worldwide</p>
             </div>
             <div className="flex flex-wrap justify-center items-center gap-x-16 gap-y-8">
               {/* Logos */}
               {[1, 2, 3, 4, 5].map((i) => (
                 <div key={i} className="h-10 relative w-32">
                   <Image
                     src={`/company${i}.png`}
                     alt={`Company ${i} logo`}
                     fill
                     className="object-contain filter grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                   />
                 </div>
               ))}
             </div>
           </div>
         </section>
  )
}

export default Trusted