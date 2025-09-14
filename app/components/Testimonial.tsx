"use client";
import { motion } from "framer-motion";
import { Star, Quote, Users, Building2, Target } from "lucide-react";
import Image from "next/image";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Product Manager",
      company: "TechCorp",
      image: "/Images/user1.jpg",
      content: "TaskTrek has completely transformed how our team manages projects. The intuitive interface and powerful features have increased our productivity by 40%.",
      rating: 5,
      stat: "40% productivity increase"
    },
    {
      name: "Michael Rodriguez",
      role: "Team Lead",
      company: "StartupXYZ",
      image: "/Images/user2.jpg",
      content: "The collaboration features are incredible. We can track progress in real-time and keep everyone aligned on our goals.",
      rating: 5,
      stat: "90% faster project delivery"
    },
    {
      name: "Emily Johnson",
      role: "CEO",
      company: "InnovateCo",
      image: "/Images/user3.jpg",
      content: "Best project management tool we've ever used. The analytics and reporting features give us insights we never had before.",
      rating: 5,
      stat: "50% better team coordination"
    },
  ];

  const stats = [
    {
      icon: Users,
      value: "50,000+",
      label: "Active Users"
    },
    {
      icon: Building2,
      value: "2,500+",
      label: "Companies"
    },
    {
      icon: Target,
      value: "99.9%",
      label: "Uptime"
    },
    {
      icon: Star,
      value: "4.9/5",
      label: "User Rating"
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
    <section id="testimonials" className="py-20 sm:py-32 bg-black-50 dark:bg-black-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400 text-sm font-medium mb-6">
            <Star className="h-4 w-4 mr-2" />
            Customer Stories
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black dark:text-white mb-6">
            Loved by teams
            <br />
            <span className="text-green-600 dark:text-green-400">worldwide</span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Join thousands of teams who have transformed their workflow with TaskTrek
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
        >
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-4 bg-black dark:bg-black-900 rounded-xl flex items-center justify-center shadow-lg dark:shadow-gray-900/20">
                  <Icon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-white/70 text-sm">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Testimonials */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="bg-black dark:bg-black-900 rounded-2xl p-8 shadow-lg dark:shadow-gray-900/20 hover:shadow-xl dark:hover:shadow-gray-900/30 transition-all duration-300 border border-gray-200 dark:border-gray-800"
            >
              {/* Quote Icon */}
              <div className="w-10 h-10 bg-green-100 dark:bg-green-950/50 rounded-lg flex items-center justify-center mb-6">
                <Quote className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>

              {/* Rating */}
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                ))}
              </div>

              {/* Content */}
              <p className="text-white/70 mb-6 leading-relaxed">
                &ldquo;{testimonial.content}&rdquo;
              </p>

              {/* Stat Badge */}
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2 mb-6">
                <div className="text-green-600 dark:text-green-400 font-semibold text-sm">
                  {testimonial.stat}
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full mr-4 border-2 border-gray-200 dark:border-gray-700 relative overflow-hidden">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-black dark:text-white">
                    {testimonial.name}
                  </h4>
                  <p className="text-sm text-white/60">
                    {testimonial.role} at {testimonial.company}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-16 bg-black dark:bg-black-900 rounded-2xl p-8 shadow-lg dark:shadow-gray-900/20 border border-gray-200 dark:border-gray-800"
        >
          <h3 className="text-2xl font-bold text-black dark:text-white mb-4">
            Ready to join them?
          </h3>
          <p className="text-white/70 mb-6">
            Start your free trial today and see why teams choose TaskTrek
          </p>
          <button className="inline-flex items-center px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl">
            Get started for free
          </button>
        </motion.div>
      </div>
    </section>
  );
}