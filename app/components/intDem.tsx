"use client";

import React from 'react'
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {CheckCircle } from 'lucide-react';
import board from '../Images/stock-market-values-going-up-down-computer-monitor-empty-office.jpg';
import chart from '../Images/2629036.jpg'

const IntDem = () => {

    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row items-center gap-16">
                    <motion.div
                        className="lg:w-1/2"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <h2 className="text-3xl font-bold text-[#111827] mb-6">
                            Designed to enhance your team&apos;s productivity
                        </h2>
                        <p className="text-xl text-gray-600 mb-8">
                            TaskTrek streamlines your workflow so you can focus on what matters most - achieving your goals.
                        </p>

                        <ul className="space-y-5">
                            {[
                                "Intuitive drag-and-drop interface",
                                "Real-time collaboration with team members",
                                "Customizable boards and columns",
                                "Detailed task tracking with priority levels",
                                "Deadline reminders and notifications"
                            ].map((item, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-start"
                                >
                                    <div className="h-6 w-6 rounded-full bg-[#10B981]/10 flex items-center justify-center mr-3 flex-shrink-0">
                                        <CheckCircle className="h-4 w-4 text-[#10B981]" />
                                    </div>
                                    <span className="text-gray-700">{item}</span>
                                </motion.li>
                            ))}
                        </ul>

                        <div className="mt-8">
                            <Link
                                href="/features"
                                className="bg-[#F9FAFB] text-[#111827] border border-[#E5E7EB] hover:border-[#6366F1] py-3 px-8 rounded-xl font-medium transition-all shadow-sm hover:shadow flex items-center justify-center w-fit"
                            >
                                Explore all features
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        className="lg:w-1/2"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <div className="relative">
                            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-[#E5E7EB] bg-[#F9FAFB]">
                                <Image
                                    src={board}
                                    alt="TaskTrek Board Demo"
                                    width={800}
                                    height={500}
                                    className="object-cover rounded-2xl"
                                />
                            </div>

                            {/* Floating card */}
                            <motion.div
                                className="absolute -left-10 -bottom-10 rounded-xl overflow-hidden shadow-lg bg-white"
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
                            >
                                <div className="relative w-64 h-40">
                                    <Image
                                        src={chart}
                                        alt="Analytics Chart"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

export default IntDem
