import { AlertTriangle, Flag, Zap } from 'lucide-react';
import React from 'react';

export const priorityConfig = {
  low: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800/60',
    glow: 'hover:shadow-blue-500/10',
    icon: React.createElement(Flag, { size: 12, className: 'mr-1' })
  },
  medium: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800/60',
    glow: 'hover:shadow-green-500/10',
    icon: React.createElement(Flag, { size: 12, className: 'mr-1' })
  },
  high: {
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800/60',
    glow: 'hover:shadow-orange-500/10',
    icon: React.createElement(AlertTriangle, { size: 12, className: 'mr-1' })
  },
  critical: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800/60',
    glow: 'hover:shadow-red-500/10',
    icon: React.createElement(Zap, { size: 12, className: 'mr-1' })
  }
};