import React, { useState } from 'react';
import { 
  Clock, Tag, MoreVertical, 
  CheckSquare, Edit, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskProps {
  id: string;
  task: {
    id: number;
    title: string;
    description?: string;
    assignee?: string;
    dueDate?: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'todo' | 'inProgress' | 'done';
    tags?: string[];
  };
  containerId: string;
}

export const SortableTask: React.FC<TaskProps> = ({ id, task, containerId }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ 
    id,
    data: {
      type: 'task',
      task,
      containerId
    }
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };
  
  // Get formatted date
  const formattedDate = task.dueDate 
    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null;
  
  // Determine priority styles
  const priorityStyles = {
    High: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    Medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    Low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  };
  
  // Function to truncate text
  const truncate = (str: string, length: number) => {
    if (!str) return '';
    return str.length > length ? `${str.substring(0, length)}...` : str;
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white dark:bg-black-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 mb-3 cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-grow">
            <h4 
              className="text-sm font-medium text-gray-900 dark:text-white"
              {...listeners}
            >
              {task.title}
            </h4>
          </div>
          <div className="flex items-center ml-2">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 rounded-full hover:bg-black-100 dark:hover:bg-black-700"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-black-800 rounded-md shadow-lg z-10 border border-gray-200 dark:border-gray-700">
                <div className="py-1">
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-black-100 dark:hover:bg-black-700"
                    onClick={() => {
                      setMenuOpen(false);
                      // Handle edit task
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2 text-gray-500" />
                    Edit Task
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-black-100 dark:hover:bg-black-700"
                  >
                    <CheckSquare className="h-4 w-4 mr-2 text-gray-500" />
                    Mark Complete
                  </button>
                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-black-100 dark:hover:bg-black-700"
                    onClick={() => {
                      setMenuOpen(false);
                      // Handle delete task
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                    Delete Task
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {task.description && (
          <div className="mb-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {expanded ? task.description : truncate(task.description, 100)}
            </p>
            {task.description.length > 100 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-1 flex items-center"
              >
                {expanded ? 'Show less' : 'Show more'}
                {expanded ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </button>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            {task.dueDate && (
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
                {formattedDate}
              </div>
            )}
            <div className={`text-xs px-1.5 py-0.5 rounded-full ${priorityStyles[task.priority]}`}>
              {task.priority}
            </div>
          </div>
          
          {task.assignee && (
            <div className="h-6 w-6 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 font-medium text-xs">
              {task.assignee}
            </div>
          )}
        </div>
        
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap mt-2 gap-1">
            {task.tags.map((tag, index) => (
              <div 
                key={index}
                className="flex items-center text-xs px-2 py-0.5 rounded-full bg-black-100 dark:bg-black-700 text-gray-600 dark:text-gray-300"
              >
                <Tag className="h-3 w-3 mr-1 text-gray-500 dark:text-gray-400" />
                {tag}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};