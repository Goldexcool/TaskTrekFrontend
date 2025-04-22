"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import user1 from '../Images/user1.jpg';
import user2 from '../Images/user2.jpg';
import user3 from '../Images/user3.jpg';
const Testimonial = () => {
    const [activeTestimonial, setActiveTestimonial] = useState<number>(0);
    const testimonials = [
        {
            quote: "TaskTrek has transformed how our team collaborates. We've increased productivity by 30% since implementing it.",
            author: "Sarah Johnson",
            role: "Product Manager at Acme Inc.",
            avatar: user1,
            // company: "/company-logo1.png"
        },
        {
            quote: "The intuitive interface makes it easy for everyone on the team to stay organized and focused on their priorities.",
            author: "Michael Chen",
            role: "Tech Lead at InnovateCo",
            avatar: user3,
            // company: "/company-logo2.png"
        },
        {
            quote: "After trying multiple project management tools, TaskTrek is the only one that truly understood our workflow needs.",
            author: "Jessica Williams",
            role: "Operations Director at TechFlow",
            avatar: user2,
            // company: "/company-logo3.png"
        }
    ];
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [testimonials.length]);
    return (
        <section className="py-24 bg-[#F9FAFB] overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <h2 className="text-3xl font-bold text-[#111827] mb-4">
                            Loved by teams everywhere
                        </h2>
                        <p className="text-xl text-gray-600">
                            See why thousands of teams choose TaskTrek to manage their work
                        </p>
                    </motion.div>
                </div>

                <div className="relative">
                    <div className="overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTestimonial}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.5 }}
                                className="bg-white rounded-2xl shadow-md p-8 md:p-12 border border-[#E5E7EB] max-w-3xl mx-auto"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center">
                                        <div className="h-16 w-16 rounded-full overflow-hidden relative mr-4">
                                            <Image
                                                src={testimonials[activeTestimonial].avatar}
                                                alt={testimonials[activeTestimonial].author}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg text-[#111827]">{testimonials[activeTestimonial].author}</h4>
                                            <p className="text-gray-600">{testimonials[activeTestimonial].role}</p>
                                        </div>
                                    </div>
                                    
                                </div>

                                <div className="mb-8">
                                    <div className="flex mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className="h-5 w-5 text-[#F59E0B]" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-xl italic text-[#111827] mb-6">
                                    &quot;{testimonials[activeTestimonial].quote}&quot;
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex justify-center mt-8 space-x-2">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setActiveTestimonial(index)}
                                className={`w-2.5 h-2.5 rounded-full transition-colors ${activeTestimonial === index ? 'bg-[#6366F1]' : 'bg-gray-300'
                                    }`}
                                aria-label={`View testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Testimonial