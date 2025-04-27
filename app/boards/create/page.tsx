/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Layout, ArrowLeft, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/app/hooks/useToast';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { createBoard } from '@/app/store/boardService';
import useCardColorStore, { CARD_COLORS, DEFAULT_COLOR } from '@/app/store/useCardColorStore';
import BoardColorPicker from '@/app/components/BoardColorPicker';

// Board background options
const boardBackgrounds = [
  { color: 'from-blue-500 to-indigo-600', name: 'Blue' },
  { color: 'from-green-400 to-teal-500', name: 'Green' },
  { color: 'from-purple-500 to-pink-500', name: 'Purple' },
  { color: 'from-yellow-400 to-orange-500', name: 'Yellow' },
  { color: 'from-red-500 to-pink-600', name: 'Red' },
  { color: 'from-gray-700 to-gray-900', name: 'Dark' },
];

// Component that uses useSearchParams wrapped in Suspense
function BoardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { setCardColor } = useCardColorStore();
  
  // Get team info from query parameters
  const teamId = searchParams.get('teamId');
  const teamName = searchParams.get('teamName');
  
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedBackground, setSelectedBackground] = useState('from-blue-500 to-indigo-600');
  const [selectedColumnColor, setSelectedColumnColor] = useState(CARD_COLORS[0].value);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState('#6366F1');
  const [colorScheme, setColorScheme] = useState(CARD_COLORS[0].value);
  
  // Check if we have a valid team ID
  useEffect(() => {
    if (!teamId) {
      setError('Missing team information. Please return to the teams page and try again.');
    }
  }, [teamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!boardTitle.trim()) {
      setError('Board title is required');
      return;
    }
    
    try {
      setIsCreating(true);
      setError(null);
      
      // Create the board
      const response = await createBoard({
        title: boardTitle.trim(),
        description: boardDescription.trim(),
        teamId: teamId || '',
        backgroundColor: backgroundColor, // The hex color value
        colorScheme: colorScheme, // The full Tailwind classes string, don't split it
      });
      
      console.log('Board creation response:', response);
      
      // Check if the response contains columns and set colors for them
      if (response && response.columns) {
        const columns = response.columns;
        console.log('Assigning colors to new columns:', columns);
        
        // Assign a color for each column returned from the API
        columns.forEach((column: { _id: string; }) => {
          // Select a nice color from our predefined colors
          const colorIndex = Math.floor(Math.random() * CARD_COLORS.length);
          const selectedColor = CARD_COLORS[colorIndex].value;
          
          // Save this color for the column - use setCardColor instead of setColumnColor
          setCardColor(column._id, selectedColor);
          console.log(`Set color ${selectedColor} for new column ${column._id}`);
        });
      } else {
        console.log('No columns returned from board creation');
      }
      
      toast({
        title: "Success",
        description: "Board created successfully",
        variant: "success"
      });
      
      // Redirect to the team page or board page
      router.push(`/teams/${teamId}`);
      
    } catch (error: any) {
      console.error('Error creating board:', error);
      setError(error.message || 'Failed to create board');
    } finally {
      setIsCreating(false);
    }
  };

  if (error && !teamId) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex justify-center mb-6 text-red-500">
            <AlertCircle className="h-16 w-16" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">Invalid Request</h1>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8">{error}</p>
          <div className="flex justify-center">
            <Link
              href="/teams"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Return to Teams
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-8">
        <Link 
          href={`/teams/${teamId}`} 
          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to {teamName ? decodeURIComponent(teamName) : 'Team'}
        </Link>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Header with live preview - Add immediate feedback */}
        <div className={`bg-gradient-to-r ${selectedBackground} px-6 py-5 text-white`}>
          <div className="flex items-center mb-2">
            <Layout className="h-6 w-6 mr-2" />
            <h1 className="text-xl font-semibold">Create New Board</h1>
          </div>
          <div className="h-6"> {/* Fixed height container to prevent layout shifts */}
            <p className="text-white/90 font-medium truncate">
              {boardTitle ? boardTitle : "Enter a board title below"}
            </p>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Form content - same as original */}
          <div className="space-y-6">
            {/* Board Title */}
            <div>
              <label htmlFor="boardTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Board Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="boardTitle"
                value={boardTitle}
                onChange={(e) => {
                  setBoardTitle(e.target.value);
                  if (error && e.target.value.trim()) {
                    setError(null);
                  }
                }}
                placeholder="e.g. Marketing Campaign 2025"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Give your board a clear, descriptive name.
              </p>
            </div>

            {/* Board Description */}
            <div>
              <label htmlFor="boardDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optional)
              </label>
              <textarea
                id="boardDescription"
                value={boardDescription}
                onChange={(e) => setBoardDescription(e.target.value)}
                placeholder="Add details about this board's purpose and goals..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Board Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Board Visibility
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${
                    isPublic 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">Public Board</h3>
                    {isPublic && <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All team members can see and edit this board.
                  </p>
                </div>

                <div
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all ${
                    !isPublic 
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">Private Board</h3>
                    {!isPublic && <Check className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Only specific members you invite can see and edit this board.
                  </p>
                </div>
              </div>
            </div>

            {/* Board Background */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Board Background
              </label>
              <BoardColorPicker
                initialBackgroundColor={backgroundColor}
                initialColorScheme={colorScheme}
                onBackgroundColorChange={setBackgroundColor}
                onColorSchemeChange={setColorScheme}
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Select a color theme for your board&apos;s header.
              </p>
            </div>

            {/* Column Color Scheme */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Column Color Scheme
              </label>
              <div className="flex flex-wrap gap-2">
                {CARD_COLORS.map(color => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColumnColor(color.value)}
                    className={`h-8 px-3 py-1 rounded-full ${color.value} ${
                      selectedColumnColor === color.value ? 'ring-2 ring-offset-2 ring-indigo-500' : 'hover:ring-1 hover:ring-indigo-300'
                    }`}
                    title={color.name}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview</h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
                <div className={`h-20 bg-gradient-to-r ${selectedBackground} relative`}>
                  {/* Enhanced board title overlay with improved visibility */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/50 to-transparent">
                    <h3 className="font-semibold text-white truncate">
                      {boardTitle ? boardTitle : "Your New Board"}
                    </h3>
                    {boardDescription && (
                      <p className="text-xs text-white/80 truncate mt-1">{boardDescription}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Show error message if any */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-md">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Link
                href={`/teams/${teamId}`}
                className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isCreating || !boardTitle.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
              >
                {isCreating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Board'
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Main component that wraps the form in a Suspense boundary
const CreateBoardPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="container max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading board creation form...</p>
        </div>
      </div>
    }>
      <BoardForm />
    </Suspense>
  );
};

export default CreateBoardPage;