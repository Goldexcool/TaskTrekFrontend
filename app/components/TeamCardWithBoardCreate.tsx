/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Users, Plus, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useToast } from '@/app/hooks/useToast';
import LoadingSpinner from './LoadingSpinner';
import { createBoard } from '../store/boardService';
import useCardColorStore, { CARD_COLORS, DEFAULT_COLOR } from '@/app/store/useCardColorStore';
import BoardColorSelector from '@/app/components/BoardColorSelector';

interface TeamCardWithBoardCreateProps {
  team: {
    _id: string;
    name: string;
    description?: string;
    avatar?: string;
    members: any[];
  };
  onBoardCreated: () => void;
}

const TeamCardWithBoardCreate: React.FC<TeamCardWithBoardCreateProps> = ({ team, onBoardCreated }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [selectedColumnColor, setSelectedColumnColor] = useState<string>(DEFAULT_COLOR);
  const [selectedBoardColor, setSelectedBoardColor] = useState<string>('#6366F1'); // Default indigo color
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) {
      toast({
        title: "Error",
        description: "Board title is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsCreating(true);
      
      const requestBody = {
        title: newBoardTitle.trim(),
        description: newBoardDescription.trim(),
        teamId: team._id,
        backgroundColor: selectedBoardColor,
        colorScheme: selectedColumnColor, 
      };
      
      await createBoard(requestBody);
      
      // Reset form
      setNewBoardTitle('');
      setNewBoardDescription('');
      setSelectedBoardColor('#6366F1');
      setSelectedColumnColor(DEFAULT_COLOR);
      setShowCreateForm(false);
      
      toast({
        title: "Success",
        description: "Board created successfully",
        variant: "success"
      });
      
      // Notify parent component to refresh boards
      onBoardCreated();
      
    } catch (error: any) {
      console.error('Error creating board:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : error.message || 'Failed to create board',
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Generate a deterministic color for the team card
  const getColorClass = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-red-500',
      'bg-orange-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
      <div className={`h-24 ${getColorClass(team.name)} relative flex items-center justify-center`}>
        {team.avatar ? (
          <img
            src={team.avatar}
            alt={team.name}
            className="h-16 w-16 rounded-full border-4 border-white shadow-lg object-cover"
          />
        ) : (
          <span className="text-3xl font-bold text-white">
            {team.name.charAt(0).toUpperCase()}
          </span>
        )}

        {/* Team link button */}
        <Link 
          href={`/teams/${team._id}`}
          className="absolute right-3 top-3 bg-white/20 hover:bg-white/40 p-1.5 rounded-full text-white transition-colors backdrop-blur-sm"
          title="View team"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
        
        {/* Create board button */}
        <button
          onClick={() => setShowCreateForm(true)}
          className="absolute left-3 top-3 bg-white/20 hover:bg-white/40 p-1.5 rounded-full text-white transition-colors backdrop-blur-sm"
          title="Create new board"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      
      <div className="p-4">
        <Link href={`/teams/${team._id}`}>
          <h3 className="font-medium text-gray-800 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            {team.name}
          </h3>
        </Link>
        
        {team.description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
            {team.description}
          </p>
        )}
        
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <Users className="h-3.5 w-3.5 mr-1" />
            <span>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
      
      {/* Board creation form overlay */}
      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCreateForm(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Create Board in &quot;{team.name}&quot;
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="boardTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Board Name *
                </label>
                <input
                  id="boardTitle"
                  type="text"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  placeholder="Enter board name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="boardDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="boardDescription"
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  placeholder="Enter board description"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Board Color
                </label>
                <div className="flex items-center space-x-4">
                  <BoardColorSelector 
                    initialColor={selectedBoardColor}
                    onColorChange={(color) => setSelectedBoardColor(color)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Column Color Scheme
                </label>
                <div className="flex flex-wrap gap-2">
                  {CARD_COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColumnColor(color.value)}
                      className={`h-8 w-8 rounded-md ${color.value.split(' ')[0]} ${selectedColumnColor === color.value ? 'ring-2 ring-offset-2 ring-indigo-500' : 'hover:ring-1 hover:ring-indigo-300'
                        }`}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCreateBoard}
                  disabled={isCreating || !newBoardTitle.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isCreating ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>Create Board</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default TeamCardWithBoardCreate;