/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Layout, ArrowLeft, Check, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/app/hooks/useToast';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { fetchBoardById, updateBoard, Board } from '@/app/store/boardService';

// Board background options
const boardBackgrounds = [
  { color: 'from-blue-500 to-indigo-600', name: 'Blue' },
  { color: 'from-green-400 to-teal-500', name: 'Green' },
  { color: 'from-purple-500 to-pink-500', name: 'Purple' },
  { color: 'from-yellow-400 to-orange-500', name: 'Yellow' },
  { color: 'from-red-500 to-pink-600', name: 'Red' },
  { color: 'from-gray-700 to-gray-900', name: 'Dark' },
  { color: 'from-blue-600 via-indigo-700 to-purple-800', name: 'Cosmic Blue' },
  { color: 'from-emerald-500 via-teal-600 to-cyan-700', name: 'Quantum Green' },
  { color: 'from-rose-500 via-pink-600 to-fuchsia-700', name: 'Neon Magenta' },
];

const EditBoardPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  
  const boardId = params?.id as string;
  
  const [board, setBoard] = useState<Board | null>(null);
  const [boardTitle, setBoardTitle] = useState('');
  const [boardDescription, setBoardDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedBackground, setSelectedBackground] = useState('from-blue-500 to-indigo-600');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch board data
  useEffect(() => {
    const loadBoardData = async () => {
      try {
        setIsLoading(true);
        const boardData = await fetchBoardById(boardId);
        setBoard(boardData);
        
        // Set form values from board data
        setBoardTitle(boardData.title || '');
        setBoardDescription(boardData.description || '');
        setSelectedBackground(boardData.backgroundColor || 'from-blue-500 to-indigo-600');
        setIsPublic(boardData.visibility !== 'private');
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching board:', err);
        setError('Failed to load board data. Please try again.');
        toast({
          title: "Error",
          description: "Could not load board data",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (boardId) {
      loadBoardData();
    }
  }, [boardId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!boardTitle.trim()) {
      toast({
        title: "Error",
        description: "Board title is required",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Update the board using the service function
      await updateBoard(boardId, {
        title: boardTitle,
        description: boardDescription,
        backgroundColor: selectedBackground,
        visibility: isPublic ? 'public' : 'private'
      });
      
      toast({
        title: "Success",
        description: "Board updated successfully",
        variant: "success"
      });
      
      // Redirect back to the board
      router.push(`/boards/${boardId}`);
      
    } catch (error: any) {
      console.error('Error updating board:', error);
      setError(typeof error === 'string' ? error : 'Failed to update board');
      
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : 'Failed to update board',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading board...</p>
        </div>
      </div>
    );
  }

  if (!board && !isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex justify-center mb-6 text-red-500">
            <AlertCircle className="h-16 w-16" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">Board Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
            The board you&apos;re trying to edit doesn&apos;t exist or you don&apos;t have permission to access it.
          </p>
          <div className="flex justify-center">
            <Link
              href="/boards"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Back to Boards
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
          href={`/boards/${boardId}`} 
          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center font-medium"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Board
        </Link>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        {/* Header with live preview */}
        <div className={`bg-gradient-to-r ${selectedBackground} px-6 py-5 text-white`}>
          <div className="flex items-center">
            <Layout className="h-6 w-6 mr-2" />
            <h1 className="text-xl font-semibold">Edit Board</h1>
          </div>
          {boardTitle && (
            <p className="mt-1 text-white/80 font-medium">{boardTitle}</p>
          )}
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
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
                onChange={(e) => setBoardTitle(e.target.value)}
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
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {boardBackgrounds.map((bg) => (
                  <button
                    key={bg.name}
                    type="button"
                    onClick={() => setSelectedBackground(bg.color)}
                    className={`h-16 rounded-lg bg-gradient-to-r ${bg.color} flex items-center justify-center transition-all
                      ${selectedBackground === bg.color ? 'ring-2 ring-offset-2 ring-indigo-600' : 'opacity-80 hover:opacity-100'}`}
                  >
                    {selectedBackground === bg.color && (
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Select a color theme for your board&apos;s header.
              </p>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Preview</h3>
              <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
                <div className={`h-20 bg-gradient-to-r ${selectedBackground} relative`}>
                  {/* Board title overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/40 to-transparent">
                    <h3 className="font-semibold text-white truncate">
                      {boardTitle || "Your Board"}
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
                href={`/boards/${boardId}`}
                className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSaving || !boardTitle.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditBoardPage;