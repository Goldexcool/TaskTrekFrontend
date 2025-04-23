"use client";

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {  Users, Layers, Calendar } from 'lucide-react';
import spot1 from '../Images/702.jpg'
import spot2 from '../Images/people-office-work-day.jpg'
import spot3 from '../Images/calendar-planner-agenda-schedule-concept.jpg'
const Spotlight = () => {
    const features = [
        {
            title: "Team Collaboration",
            description: "Create teams and invite members to work together seamlessly on shared projects.",
            icon: <Users className="w-6 h-6 text-indigo-500" />,
            image: spot2
        },
        {
            title: "Kanban Boards",
            description: "Visualize your workflow with customizable boards and drag-and-drop task management.",
            icon: <Layers className="w-6 h-6 text-indigo-500" />,
            image: spot1
        },
        {
            title: "Task Tracking",
            description: "Set priorities, deadlines, and assignees to keep everyone on the same page.",
            icon: <Calendar className="w-6 h-6 text-indigo-500" />,
            image: spot3
        },
    ];
    return (
        <section className="py-24 bg-[#F9FAFB]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                    >
                        <h2 className="text-3xl font-bold text-[#111827] mb-4">
                            Everything you need to manage your tasks
                        </h2>
                        <p className="text-xl text-gray-600">
                            TaskTrek provides powerful yet simple tools to help your team stay organized and focused on what matters most.
                        </p>
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="relative h-48 overflow-hidden">
                                <Image
                                    src={feature.image}
                                    alt={feature.title}
                                    fill
                                    className="object-cover transition-transform hover:scale-105 duration-500"
                                />
                            </div>
                            <div className="p-6">
                                <div className="h-12 w-12 bg-[#6366F1]/10 rounded-lg flex items-center justify-center mb-4">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold text-[#111827] mb-3">{feature.title}</h3>
                                <p className="text-gray-600 mb-4">{feature.description}</p>
                                {/* <Link
                                    href={`/features#${feature.title.toLowerCase().replace(/\s+/g, '-')}`}
                                    className="text-[#6366F1] font-medium flex items-center hover:text-[#4F46E5] transition-colors"
                                >
                                    Learn more
                                    <ChevronRight size={16} className="ml-1" />
                                </Link> */}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default Spotlight;
