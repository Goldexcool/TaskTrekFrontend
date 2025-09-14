import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Pricing from './components/Pricing';
import Testimonial from './components/Testimonial';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';

const Page = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-black font-sans">
      {/* Header/Nav */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Features Section */}
      <Features />

      {/* Pricing Section */}
      <Pricing />

      {/* Testimonial Section */}
      <Testimonial />

      {/* CTA section */}
      <CtaSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Page;