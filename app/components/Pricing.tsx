"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Star, ArrowRight, Users, Crown, Zap } from 'lucide-react';

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Free',
      description: 'Perfect for individuals getting started',
      price: { monthly: 0, annual: 0 },
      icon: Star,
      features: [
        'Up to 3 projects',
        '5 team members',
        'Basic task management',
        'Mobile apps',
        'Community support',
        '2GB storage'
      ],
      cta: 'Get started free',
      popular: false,
      color: 'gray'
    },
    {
      name: 'Pro',
      description: 'Best for growing teams and businesses',
      price: { monthly: 12, annual: 10 },
      icon: Users,
      features: [
        'Unlimited projects',
        'Unlimited team members',
        'Advanced task management',
        'Time tracking',
        'Custom fields',
        'Priority support',
        '100GB storage',
        'Advanced analytics',
        'Workflow automation'
      ],
      cta: 'Start free trial',
      popular: true,
      color: 'blue'
    },
    {
      name: 'Enterprise',
      description: 'Advanced features for large organizations',
      price: { monthly: 25, annual: 20 },
      icon: Crown,
      features: [
        'Everything in Pro',
        'Advanced security',
        'SAML SSO',
        'Advanced admin controls',
        'Custom integrations',
        'Dedicated support',
        'Unlimited storage',
        'Advanced reporting',
        'SLA guarantee',
        'Custom training'
      ],
      cta: 'Contact sales',
      popular: false,
      color: 'purple'
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
    <section id="pricing" className="py-20 sm:py-32 bg-black dark:bg-black">
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
            <Zap className="h-4 w-4 mr-2" />
            Simple Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black dark:text-white mb-6">
            Choose the perfect plan
            <br />
            <span className="text-blue-600 dark:text-blue-400">for your team</span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto mb-8">
            Start free and scale as you grow. All plans include our core features with no hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-black-100 dark:bg-black-900 rounded-lg p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                !isAnnual
                  ? 'bg-black dark:bg-black-800 text-black dark:text-white shadow-sm'
                  : 'text-white/70'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isAnnual
                  ? 'bg-black dark:bg-black-800 text-black dark:text-white shadow-sm'
                  : 'text-white/70'
              }`}
            >
              Annual
              <span className="ml-1 text-xs bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const price = isAnnual ? plan.price.annual : plan.price.monthly;
            
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className={`relative bg-black dark:bg-black-900 rounded-2xl border-2 p-8 ${
                  plan.popular
                    ? 'border-blue-500 dark:border-blue-400 shadow-lg dark:shadow-blue-900/20'
                    : 'border-gray-200 dark:border-gray-800'
                } hover:shadow-lg dark:hover:shadow-gray-900/20 transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                    plan.color === 'blue'
                      ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                      : plan.color === 'purple'
                      ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                      : 'bg-black-100 dark:bg-black-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-black dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-white/70 mb-6">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-black dark:text-white">
                      ${price}
                    </span>
                    <span className="text-white/70 ml-1">
                      {price > 0 ? `/user/${isAnnual ? 'year' : 'month'}` : ''}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-white/70">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                      : 'bg-black-100 dark:bg-black-800 text-black dark:text-white hover:bg-black-200 dark:hover:bg-black-700'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-white/70 mb-6">
            All plans include a 14-day free trial. No credit card required.
          </p>
          <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors group">
            Start your free trial
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
