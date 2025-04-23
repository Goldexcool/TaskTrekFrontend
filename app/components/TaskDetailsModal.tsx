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
import { Task, Column } from '@/app/store/boardService';
import { priorityConfig } from '@/app/utils/priorityConfig';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/app/components/ui/dropdown-menu';
import { Button } from '@/app/components/ui/button';

// Update the interface definition
interface TaskDetailsModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: Column[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<any>;
  onDeleteTask: (columnId: string, taskId: string) => void;
  onMoveTask: (taskId: string, newColumnId: string) => void;
  tasks: Record<string, any[]>;
  teamMembers: any[];
  assignedUser: any | null;
  handleAssignTask: ((taskId: string, memberId: string | null) => void) | undefined;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  open,
  onOpenChange,
  columns,
  onUpdateTask,
  onDeleteTask,
  onMoveTask,
  tasks,
  teamMembers,
  assignedUser,
  handleAssignTask
}) => {
  const [localTask, setLocalTask] = useState<Task | null>(task);

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

  // Find which column the task is currently in
  const findCurrentColumnId = () => {
    let currentColumnId = '';
    Object.entries(tasks).forEach(([colId, colTasks]) => {
      if ((colTasks).some(t => t._id === localTask?._id)) {
        currentColumnId = colId;
      }
    });
    return currentColumnId;
  };

  const currentColumnId = findCurrentColumnId();

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
              {assignedUser ? (
                <div className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={assignedUser.avatar || assignedUser.user?.avatar} />
                    <AvatarFallback>{(assignedUser.name || assignedUser.user?.name || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span>{assignedUser.name || assignedUser.user?.name}</span>
                  
                  {task && (
                    <button 
                      onClick={() => handleAssignTask && handleAssignTask(task._id, null)}
                      className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X size={14} />
                    </button>
                  )}
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
                    {teamMembers.map(member => {
                      // Handle different API response formats
                      const memberId = member.user?._id || member._id;
                      const memberName = member.user?.name || member.name || 'Unknown User';
                      const memberAvatar = member.user?.avatar || member.avatar;
                      
                      // Only mark as selected if this member is assigned to the task
                      const isAssigned = task?.assignedTo === memberId;
                      
                      return (
                        <DropdownMenuItem 
                          key={memberId || Math.random().toString()}
                          onClick={() => task && handleAssignTask && handleAssignTask(task._id, memberId)}
                          className={isAssigned ? "bg-gray-100 dark:bg-gray-800" : ""}
                        >
                          <div className="flex items-center w-full">
                            <Avatar className="h-5 w-5 mr-2">
                              {memberAvatar ? (
                                <AvatarImage src={memberAvatar} alt={memberName} />
                              ) : (
                                <AvatarFallback>{memberName[0]}</AvatarFallback>
                              )}
                            </Avatar>
                            <span className="flex-1">{memberName}</span>
                            {isAssigned && <Check size={14} className="ml-auto" />}
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                    
                    {teamMembers.length === 0 && (
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
                value={currentColumnId || ''}
                onChange={(e) => {
                  const newColumnId = e.target.value;
                  if (newColumnId && currentColumnId && newColumnId !== currentColumnId) {
                    onMoveTask(localTask._id, newColumnId);
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
            onClick={() => onDeleteTask(currentColumnId, localTask._id)}
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