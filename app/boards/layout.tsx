'use client';

import React from 'react';
import AuthGuard from '../components/AuthGuard';

export default function BoardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
