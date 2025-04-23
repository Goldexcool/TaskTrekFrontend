'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import HeaderDash from './HeaderDash';

// Create a context to share sidebar state across components
interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  
  // Close sidebar on route change
  useEffect(() => {
    console.log('Route changed, closing sidebar');
    setSidebarOpen(false);
  }, [pathname]);

  // Toggle sidebar function with debug log
  const toggleSidebar = () => {
    console.log('Toggle sidebar called, current state:', sidebarOpen);
    setSidebarOpen(prevState => !prevState);
  };

  // Close sidebar function
  const closeSidebar = () => {
    console.log('Close sidebar called');
    setSidebarOpen(false);
  };
  
  // Log when sidebar state changes
  useEffect(() => {
    console.log('Sidebar state changed:', sidebarOpen);
  }, [sidebarOpen]);
  
  return (
    <SidebarContext.Provider value={{ isOpen: sidebarOpen, toggle: toggleSidebar, close: closeSidebar }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
        
        {/* Mobile sidebar */}
        <div id="app-sidebar" className="md:hidden">
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        </div>
        
        {/* Main header */}
        <HeaderDash onMenuClick={toggleSidebar} />
        
        {/* Main content */}
        <main className="pt-16 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
};

export default AppLayout;