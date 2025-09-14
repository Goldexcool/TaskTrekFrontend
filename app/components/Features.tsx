"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckSquare, 
  Users, 
  Calendar, 
  BarChart3, 
  Clock, 
  Layers, 
  Zap, 
  Shield, 
  Smartphone,
  Globe,
  ArrowRight,
  Star
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: CheckSquare,
      title: 'Task Management',
      description: 'Create, assign, and track tasks with priorities, due dates, and custom labels for perfect organization.',
      color: 'blue'
    },
    {
      icon: Layers,
      title: 'Project Boards',
      description: 'Visualize your workflow with Kanban boards that move with your team&apos;s pace and style.',
      color: 'green'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Invite team members, assign roles, and collaborate in real-time with comments and notifications.',
      color: 'purple'
    },
    {
      icon: Calendar,
      title: 'Calendar View',
      description: 'See all your tasks and deadlines in a beautiful calendar interface that keeps you on track.',
      color: 'orange'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Reports',
      description: 'Track productivity, monitor progress, and generate insightful reports for better decision making.',
      color: 'red'
    },
    {
      icon: Clock,
      title: 'Time Tracking',
      description: 'Built-in time tracking helps you understand where time goes and optimize your workflow.',
      color: 'indigo'
    }
  ];

  const additionalFeatures = [
    {
      icon: Zap,
      title: 'Automation',
      description: 'Automate repetitive tasks and workflows'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with SOC 2 compliance'
    },
    {
      icon: Smartphone,
      title: 'Mobile Apps',
      description: 'Access your work from anywhere on any device'
    },
    {
      icon: Globe,
      title: 'Integrations',
      description: 'Connect with 100+ popular tools and services'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section id="features" className="py-20 sm:py-32 bg-black-50 dark:bg-black-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
            <Star className="h-4 w-4 mr-2" />
            Powerful Features
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black dark:text-white mb-6">
            Everything you need to
            <br />
            <span className="text-blue-600 dark:text-blue-400">manage work better</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            From simple task tracking to complex project management, TaskTrek provides all the tools your team needs to stay organized and productive.
          </p>
        </motion.div>

        {/* Main Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colorClasses = {
              blue: 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
              green: 'bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400',
              purple: 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400',
              orange: 'bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400',
              red: 'bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400',
              indigo: 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
            };

            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white dark:bg-black-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300 group hover:border-blue-300 dark:hover:border-blue-700"
              >
                <div className={`w-12 h-12 rounded-xl ${colorClasses[feature.color as keyof typeof colorClasses]} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Additional Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-black-900 rounded-2xl p-8 sm:p-12 border border-gray-200 dark:border-gray-800"
        >
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-4">
              And so much more
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Discover additional features that make TaskTrek the complete solution for your team
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {additionalFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 bg-black-100 dark:bg-black-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-black dark:text-white mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors group">
              Explore all features
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
