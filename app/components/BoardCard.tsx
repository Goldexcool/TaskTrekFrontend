/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, ListFilter, Grid, List, Clipboard, LucideClock, Star } from 'lucide-react';
import AppLayout from '@/app/components/AppLayout';
import { useToast } from '@/app/hooks/useToast';
import useAuthStore from '@/app/store/useAuthStore';
import Link from 'next/link';
import { Board } from '@/app/types/board';

// Import the API function
// import { fetchAllBoards } from '@/app/store/boardService';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};

export interface BoardCardProps {
  board: Board;
  formatDate: (date?: string) => string;
  getTaskCount: (board: Board) => number;
  onDelete?: (boardId: string) => Promise<void>;
  deletingId?: string;
}

const BoardCard: React.FC<BoardCardProps> = ({ 
  board, 
  formatDate,
  getTaskCount,
  onDelete,
  deletingId
}) => {
  // Process the background color/scheme 
  const getBoardBackgroundStyle = () => {
    // First check if colorScheme exists and contains a gradient
    if (board.colorScheme) {
      // Return the full class string without modification
      return {
        className: board.colorScheme
      };
    }
    
    // Fall back to backgroundColor if no colorScheme
    if (board.backgroundColor) {
      if (board.backgroundColor.startsWith('#')) {
        // It's a hex color
        return { 
          style: { backgroundColor: board.backgroundColor } 
        };
      } else {
        // It's a Tailwind class
        return {
          className: board.backgroundColor
        };
      }
    }
    
    // Default if nothing else works
    return {
      className: 'bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-800'
    };
  };
  
  const bgStyle = getBoardBackgroundStyle();
  const isDeleting = deletingId === board._id;

  return (
    <div className={`group relative overflow-hidden rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow h-full ${isDeleting ? 'opacity-50' : ''}`}>
      {/* Make sure we have a valid board ID before creating the link */}
      <Link href={board._id ? `/boards/${board._id}` : '#'} className="block h-full">
        {/* Board header with background color */}
        <div 
          className={`h-32 relative overflow-hidden ${bgStyle.className || ''}`}
          style={bgStyle.style || {}}
        >
          {/* Content */}
        </div>
        
        {/* Board content */}
        <div className="p-4 bg-white dark:bg-gray-800 flex flex-col h-[calc(100%-8rem)]">
          <h3 className="font-medium text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {board.title || board.name || 'Untitled Board'}
          </h3>
          
          {board.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-grow">
              {board.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <div className="flex items-center">
              <LucideClock className="h-3 w-3 mr-1" />
              <span>{formatDate(board.updatedAt)}</span>
            </div>
            
            <div className="flex items-center">
              <Clipboard className="h-3 w-3 mr-1" />
              <span>{getTaskCount(board)} tasks</span>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onDelete) onDelete(board._id);
          }}
          disabled={isDeleting}
          className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete board"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default BoardCard;