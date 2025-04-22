import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
// import Trusted from './components/Trusted';
import Spotlight from './components/Spotlight';
import IntDem from './components/intDem';
import Testimonial from './components/Testimonial';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';

const Page = () => {

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans overflow-hidden">
      {/* Header/Nav */}
      <Navbar />

      {/* Hero Section */}
      <Hero />

      {/* Trusted by section */}
      {/* <Trusted /> */}

      {/* Features spotlight section */}
      <Spotlight />

      {/* Interactive demo section */}
      <IntDem />

      {/* Testimonial slider section */}
      <Testimonial />

      {/* CTA section */}
     <CtaSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Page;