/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/app/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { CheckCircle, Clock, Trash2, Save, X, User, Check } from 'lucide-react';
import { Task, TaskStatus, isTaskCompleted } from '@/app/types/task';
import { Column } from '@/app/store/boardService';
import { priorityConfig } from '@/app/utils/priorityConfig';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/app/components/ui/dropdown-menu';
import { Button } from '@/app/components/ui/button';
import { TeamMember } from '@/app/types/team';
import useTaskUpdates from '@/app/hooks/useTaskUpdates';

// Define the AssignedUser interface
interface AssignedUser {
  _id: string;
  name: string;
  avatar?: string;
}

// Import the helper functions or define them inline
function isAssignedUser(value: any): value is AssignedUser {
  return typeof value === 'object' && value !== null && '_id' in value && 'name' in value;
}

function getUserIdFromAssignedTo(assignedTo?: string | AssignedUser): string | undefined {
  if (!assignedTo) return undefined;
  if (typeof assignedTo === 'string') return assignedTo;
  return assignedTo._id;
}

interface TaskDetailsModalProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<any> | void;
  teamMembers?: TeamMember[];
  handleAssignTask?: (taskId: string, userId: string | undefined) => Promise<void> | void;
  onDeleteTask?: (columnId: string, taskId: string) => void;
  onMoveTask?: (taskId: string, destColumnId: string) => void;
  tasks?: Record<string, Task[]>;
  assignedUser?: TeamMember;
  children?: React.ReactNode;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  open,
  onOpenChange,
  columns,
  onUpdateTask,
  teamMembers,
  handleAssignTask,
  onDeleteTask
}) => {
  const [localTask, setLocalTask] = useState<Task>(task);
  const { subscribeToUpdates } = useTaskUpdates();
  const [, setUpdateCount] = useState(0);

  // Subscribe to updates
  useEffect(() => {
    const unsubscribe = subscribeToUpdates((updatedTaskId) => {
      if (updatedTaskId === task._id) {
        // Force re-render when this task is updated
        setUpdateCount(count => count + 1);
      }
    });
    
    return () => unsubscribe();
  }, [task._id, subscribeToUpdates]);

  // Sync local state with prop when task changes
  useEffect(() => {
    setLocalTask(task);
  }, [task]);

  if (!localTask) return null;

  // Format date for display
  const formatDate = (date: string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(d);
  };
  
  // Helper function to handle task deletion
  const handleDeleteTask = () => {
    if (onDeleteTask && localTask.column) {
      onDeleteTask(localTask.column, localTask._id);
      onOpenChange(false);
    } else {
      // Fall back to marking as deleted if onDeleteTask is not provided
      onUpdateTask(localTask._id, { deleted: true } as Partial<Task>);
      onOpenChange(false);
    }
  };
  
  // Helper function to get assigned user details
  const getAssignedUserDetails = (
    task: Task, 
    teamMembers?: TeamMember[]
  ): AssignedUser | null => {
    // Handle when assignedTo is null or undefined
    if (!task.assignedTo) {
      return null;
    }
    
    // Handle when assignedTo is an object 
    if (typeof task.assignedTo === 'object' && task.assignedTo !== null) {
      return task.assignedTo as AssignedUser;
    }
    
    // If assignedTo is a string ID, find the matching team member
    if (typeof task.assignedTo === 'string' && teamMembers?.length) {
      const member = teamMembers.find(m => 
        m._id === task.assignedTo || m.user?._id === task.assignedTo
      );
      
      if (member) {
        return {
          _id: member._id || member.user?._id || '',
          name: member.name || member.user?.name || 'Unknown',
          avatar: member.avatar || member.user?.avatar
        };
      }
    }
    
    return null;
  };
  
  const assignedUserDetails = getAssignedUserDetails(localTask, teamMembers);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Edit Task
          </DialogTitle>
          
          <DialogDescription>
            Make changes to your task details below
          </DialogDescription>
          
          <div className="flex flex-col space-y-2 mt-4">
            <input
              type="text"
              value={localTask.title}
              onChange={(e) => {
                setLocalTask({
                  ...localTask,
                  title: e.target.value
                });
              }}
              onBlur={() => {
                onUpdateTask(localTask._id, { title: localTask.title });
              }}
              className="text-xl font-semibold w-full p-1 border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded dark:bg-gray-800 dark:text-white"
              aria-label="Task title"
            />
            
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <div className={`px-2 py-1 rounded-md text-xs ${priorityConfig[localTask.priority as keyof typeof priorityConfig]?.color || 'bg-gray-100'}`}>
                {priorityConfig[localTask.priority as keyof typeof priorityConfig]?.icon}
                {localTask.priority || 'medium'}
              </div>
              
              {localTask.dueDate && (
                <div className={`flex items-center px-2 py-1 rounded-md text-xs ${
                  new Date(localTask.dueDate) < new Date() && localTask.status !== 'completed' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' 
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  <Clock size={12} className="mr-1" />
                  {formatDate(localTask.dueDate)}
                </div>
              )}
              
              {localTask.status === 'completed' && (
                <div className="flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <CheckCircle size={12} className="mr-1" />
                  Completed
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Priority</label>
                <select
                  value={localTask.priority || 'medium'}
                  onChange={(e) => {
                    const newPriority = e.target.value as 'low' | 'medium' | 'high' | 'critical';
                    setLocalTask({
                      ...localTask,
                      priority: newPriority
                    });
                    onUpdateTask(localTask._id, { priority: newPriority });
                  }}
                  className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  aria-label="Task priority"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
                <input
                  type="date"
                  value={localTask.dueDate ? new Date(localTask.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const newDueDate = value ? new Date(value).toISOString() : undefined;
                    setLocalTask({
                      ...localTask,
                      dueDate: newDueDate
                    });
                    onUpdateTask(localTask._id, { dueDate: newDueDate });
                  }}
                  className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  aria-label="Task due date"
                />
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assigned To
            </label>
            
            <div className="flex items-center gap-2">
              {assignedUserDetails ? (
                <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={assignedUserDetails.avatar} />
                    <AvatarFallback>{assignedUserDetails.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{assignedUserDetails.name}</span>
                  
                  <button 
                    onClick={() => handleAssignTask?.(localTask._id, undefined)}
                    className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <User size={14} className="mr-1" />
                      Assign Task
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    {teamMembers?.map(member => {
                      const memberId = member.user?._id || member._id || '';
                      const memberName = member.user?.name || member.name || 'Unknown';
                      const memberAvatar = member.user?.avatar || member.avatar;
                      const assignedUserId = typeof localTask.assignedTo === 'object' && localTask.assignedTo !== null
                        ? (localTask.assignedTo as AssignedUser)._id 
                        : localTask.assignedTo;
                      
                      return (
                        <DropdownMenuItem 
                          key={memberId}
                          onClick={() => handleAssignTask?.(localTask._id, memberId)}
                          className={assignedUserId === memberId ? "bg-gray-100 dark:bg-gray-800" : ""}
                        >
                          <div className="flex items-center w-full">
                            <Avatar className="h-5 w-5 mr-2">
                              {memberAvatar ? (
                                <AvatarImage src={memberAvatar} alt={memberName} />
                              ) : (
                                <AvatarFallback>{(memberName || 'U')[0]}</AvatarFallback>
                              )}
                            </Avatar>
                            <span className="flex-1">{memberName}</span>
                            {assignedUserId === memberId && <Check size={14} className="ml-auto" />}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                    
                    {(!teamMembers || teamMembers.length === 0) && (
                      <div className="px-2 py-1 text-sm text-gray-500">
                        No team members available
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          
          <div className="mt-2">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Description</label>
            <textarea
              value={localTask.description || ''}
              onChange={(e) => {
                setLocalTask({
                  ...localTask,
                  description: e.target.value
                });
              }}
              onBlur={() => {
                onUpdateTask(localTask._id, { description: localTask.description });
              }}
              placeholder="Add a description..."
              className="w-full p-2 min-h-24 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              aria-label="Task description"
            />
          </div>
          
          <div className="mt-4 flex justify-between">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Task Status</label>
              <select
                value={localTask.status || 'pending'}
                onChange={(e) => {
                  const newStatus = e.target.value as 'pending' | 'in-progress' | 'completed' | 'blocked';
                  setLocalTask({
                    ...localTask,
                    status: newStatus
                  });
                  onUpdateTask(localTask._id, { status: newStatus });
                }}
                className="p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                aria-label="Task status"
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Move to Column</label>
              <select
                value={localTask.column || ''}
                onChange={(e) => {
                  const newColumnId = e.target.value;
                  if (newColumnId && localTask.column && newColumnId !== localTask.column) {
                    onUpdateTask(localTask._id, { column: newColumnId });
                  }
                }}
                className="p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                aria-label="Move task to column"
              >
                {columns.map(col => (
                  <option key={col._id} value={col._id}>
                    {col.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </DialogHeader>
        
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <button
            onClick={handleDeleteTask}
            className="inline-flex items-center px-3 py-1.5 rounded-md text-sm text-red-600 hover:text-white hover:bg-red-600 border border-red-300 hover:border-transparent"
            aria-label="Delete task"
          >
            <Trash2 size={14} className="mr-1" />
            Delete Task
          </button>
          
          <DialogClose asChild>
            <button
              className="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-indigo-600 text-white hover:bg-indigo-700"
              aria-label="Close dialog"
            >
              <Save size={14} className="mr-1" />
              Done
            </button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal;