/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/hooks/useToast';

interface TeamListRefresherProps {
  refreshInterval?: number; // in milliseconds
}

const TeamListRefresher: React.FC<TeamListRefresherProps> = ({ 
  refreshInterval = 300000 // 5 minutes default
}) => {
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    // Initial refresh when component mounts
    router.refresh();
    
    // Set up interval for refresh
    const intervalId = setInterval(() => {
      console.log('Refreshing team list data...');
      router.refresh();
    }, refreshInterval);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [router, refreshInterval]);
  
  return null; // This component doesn't render anything
};

export default TeamListRefresher;