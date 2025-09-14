'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Loader from './Loader';

const PageLoader: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500); // Show loader for 500ms minimum

    return () => clearTimeout(timer);
  }, [pathname]);

  if (!loading) return null;

  return (
    <Loader 
      fullScreen 
      size="lg" 
      text="Loading page..." 
    />
  );
};

export default PageLoader;
