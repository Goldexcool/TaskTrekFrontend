import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";
import ClientWrapper from './components/ClientWrapper';
import { ThemeProvider } from './components/ThemeProvider';
import PageLoader from './components/PageLoader';
import { ToastProvider } from './components/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "TaskTrek - Project Management",
  description: "A modern project management tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <ToastProvider>
            <PageLoader />
            <ClientWrapper>
              {children}
            </ClientWrapper>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
