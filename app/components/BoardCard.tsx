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
    <div className={`group relative overflow-hidden rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:bg-black/60 transition-all duration-300 h-full ${isDeleting ? 'opacity-50' : ''}`}>
      {/* Make sure we have a valid board ID before creating the link */}
      <Link href={board._id ? `/boards/${board._id}` : '#'} className="block h-full">
        {/* Board header with background color */}
        <div 
          className={`h-24 relative overflow-hidden ${bgStyle.className || ''}`}
          style={bgStyle.style || {}}
        >
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          
          {/* Star indicator if starred */}
          {board.isStarred && (
            <div className="absolute top-3 left-3">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            </div>
          )}
        </div>
        
        {/* Board content */}
        <div className="p-4 flex flex-col h-[calc(100%-6rem)]">
          <h3 className="font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors line-clamp-1">
            {board.title || board.name || 'Untitled Board'}
          </h3>
          
          {board.description && (
            <p className="text-sm text-white/60 line-clamp-2 mb-4 flex-grow">
              {board.description}
            </p>
          )}
          
          {/* Stats row */}
          <div className="flex items-center justify-between text-xs text-white/50 mt-auto pt-3 border-t border-white/10">
            <div className="flex items-center space-x-1">
              <Clipboard className="h-3 w-3" />
              <span>{getTaskCount(board)} tasks</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <LucideClock className="h-3 w-3" />
              <span>{formatDate(board.updatedAt)}</span>
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
          className="absolute top-3 right-3 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
          aria-label="Delete board"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default BoardCard;