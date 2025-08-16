'use client';

import { Toaster } from "./ui/toaster";
import ClientProvider from './ClientProvider';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ClientProvider>
      <Toaster />
      {children}
    </ClientProvider>
  );
}