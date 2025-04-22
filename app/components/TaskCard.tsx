/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Clock, Star, Check, CheckCircle } from 'lucide-react';
import useCardColorStore, { CARD_COLORS, DEFAULT_COLOR } from '@/app/store/useCardColorStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import Draggable from 'react-draggable';
import { Avatar, AvatarImage, AvatarFallback } from '@/app/components/ui/avatar';
import { Task } from '@/app/types/board';
import { priorityConfig } from '@/app/utils/priorityConfig';

// Your store interface should have:
interface CardColorState {
  colors: Record<string, string>;
  getCardColor: (id: string) => string;
  setCardColor: (id: string, color: string) => void;  
  removeCardColor: (id: string) => void;
}

// Task color picker component
const TaskColorPicker = ({ taskId, onClose }: { taskId: string, onClose: () => void }) => {
  const { getCardColor, setCardColor } = useCardColorStore();
  const currentColor = getCardColor(taskId);
  
  return (
    <div className="absolute z-50 mt-1 right-0 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[150px]">
      <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">Card Color</h4>
      <div className="grid grid-cols-3 gap-1">
        {CARD_COLORS.map((colorOption) => (
          <button
            key={colorOption.name}
            className={`h-6 w-6 rounded-md ${colorOption.value} border border-gray-200 dark:border-gray-700 hover:ring-2 hover:ring-indigo-500 ${
              currentColor === colorOption.value ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={() => {
              setCardColor(taskId, colorOption.value);
              onClose();
            }}
            aria-label={`Set card color to ${colorOption.name}`}
          />
        ))}
      </div>
    </div>
  );
};

interface TaskCardProps {
  task: Task;
  columnId: string;
  isDragging?: boolean;
  targetColumnId?: string | null;
  onClick: () => void;
  onStatusToggle: (isCompleted: boolean) => void;
  onChangePriority?: (taskId: string, priority: 'low' | 'medium' | 'high' | 'critical') => void;
  onMoveToColumn?: (taskId: string, destColumnId: string) => void;
  availableColumns?: { id: string, title: string }[];
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  columnId,
  isDragging = false,
  targetColumnId = null,
  onClick,
  onStatusToggle,
  onChangePriority,
  onMoveToColumn,
  availableColumns = [],
}) => {
  // Determine if task is completed (check status field only)
  const isCompleted = task.status === 'completed';
  
  // Get the proper priority config
  const priority = task.priority ? priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium : priorityConfig.medium;
  
  // Check if task is overdue
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
  
  // Format due date properly
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const formattedDueDate = task.dueDate ? formatDate(task.dueDate) : null;
  
  // Visual feedback when dragging to a different column
  const isMovingToNewColumn = isDragging && targetColumnId && targetColumnId !== columnId;
  
  const handleChangePriority = (taskId: string, priority: string) => {
    // Logic to change priority
  };

  return (
    <div
      className={`group bg-white dark:bg-gray-800/90 rounded-lg shadow-sm border transition-all duration-200
        ${isCompleted ? 
          'opacity-75 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50' : 
          `${priority.border} ${priority.glow}`}
        ${isOverdue ? 'border-red-300 dark:border-red-700 shadow-red-500/20' : ''}
        hover:shadow-md focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-700
        backdrop-blur-sm`}
    >
      {/* Drag handle at the top of the card */}
      <div className="drag-handle flex justify-center items-center h-1.5 cursor-grab active:cursor-grabbing mb-1 rounded-t-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600">
        <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      </div>
      
      {/* Card header with priority indicator */}
      <div className="flex justify-between items-center p-3 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={isCompleted}
            onChange={(e) => {
              onStatusToggle(!isCompleted); // Pass the intended NEW state
            }}
            className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:checked:bg-indigo-600 dark:border-gray-600"
            onClick={(e) => e.stopPropagation()}
          />
          
          <span
            className={`ml-2 px-1.5 py-0.5 rounded-sm text-xs flex items-center ${priority.color}`}
          >
            {priority.icon} {task.priority || 'medium'}
          </span>
        </div>
        
        {task.isStarred && (
          <Star className="h-3.5 w-3.5 text-amber-400" fill="currentColor" />
        )}
      </div>
      
      {/* Card content with strikethrough for completed tasks */}
      <div className={`px-3 pt-2 pb-1 ${isCompleted ? 'opacity-75' : ''}`} onClick={onClick}>
        <h4 className={`text-sm font-medium mb-1 ${isCompleted ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
          {task.title}
          
          {/* Visual indication for completed tasks */}
          {isCompleted && (
            <span className="ml-2 inline-flex items-center">
              <CheckCircle size={14} className="text-green-500" />
            </span>
          )}
        </h4>
        
        {task.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {/* Due date */}
          {formattedDueDate && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs 
              ${isOverdue ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}
            >
              <Clock size={12} className="mr-1" />
              {formattedDueDate}
            </span>
          )}
        </div>
      </div>

      {/* Priority dropdown menu */}
      <DropdownMenu>
        <DropdownMenuTrigger>
          <button className="text-xs text-gray-500 dark:text-gray-400">Change Priority</button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={(e: React.MouseEvent) => { 
            e.stopPropagation(); 
            handleChangePriority(task._id, 'low');
          }}>
            <div className="flex items-center w-full">
              <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
              Low
              {task.priority === 'low' && <Check size={14} className="ml-auto" />}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e: React.MouseEvent) => { 
            e.stopPropagation(); 
            handleChangePriority(task._id, 'medium');
          }}>
            <div className="flex items-center w-full">
              <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></div>
              Medium
              {task.priority === 'medium' && <Check size={14} className="ml-auto" />}
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e: React.MouseEvent) => { 
            e.stopPropagation(); 
            handleChangePriority(task._id, 'high');
          }}>
            <div className="flex items-center w-full">
              <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
              High
              {task.priority === 'high' && <Check size={14} className="ml-auto" />}
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TaskCard;