/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { User, X, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { TeamMember } from '@/app/types/team';
import { Task } from '@/app/types/task';

// Add this interface to properly type assigned users
interface AssignedUser {
  _id: string;
  name?: string;
  avatar?: string;
}

// Update the Task type to properly handle assignedTo
interface TaskAssignmentProps {
  task: Task & { assignedTo?: string | AssignedUser | null };
  teamMembers: TeamMember[];
  onUpdate: (updatedTask: Task) => void;
  handleAssignTask?: (taskId: string, memberId: string | undefined) => Promise<void> | void;
}

const TaskAssignment: React.FC<TaskAssignmentProps> = ({ 
  task, 
  teamMembers, 
  onUpdate,
  handleAssignTask 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Helper function to check if assignedTo is an AssignedUser object
  const isAssignedUser = (value: any): value is AssignedUser => {
    return typeof value === 'object' && value !== null && '_id' in value;
  };

  // Find currently assigned user from task.assignedTo with proper type guard
  const assignedUserId = isAssignedUser(task.assignedTo)
    ? task.assignedTo._id 
    : (task.assignedTo as string | undefined);

  // User is considered assigned if assignedUserId is not null/undefined and truthy
  const hasAssignedUser = Boolean(assignedUserId);
  
  // Find the team member that matches the assigned user ID
  const assignedUser = teamMembers.find(member => {
    const memberId = member.user?._id || member._id;
    return memberId === assignedUserId;
  });

  // Update the handleAssign function in TaskAssignment
  const handleAssign = async (userId: string) => {
    if (!userId || !handleAssignTask) return;
    
    try {
      // Set loading state
      setIsLoading(true);
      
      // Immediately update local state for faster UI feedback
      onUpdate({
        ...task,
        assignedTo: userId
      });
      
      // Call the API handler in the background
      const result = handleAssignTask(task._id, userId);
      if (result instanceof Promise) {
        result.catch(error => {
          // If the API call fails, show error and revert the assignment
          console.error('Error assigning task:', error);
          toast({
            title: "Error",
            description: "Failed to assign task. Changes reverted.",
            variant: "destructive"
          });
          
          // Revert the optimistic update
          onUpdate({
            ...task,
            assignedTo: task.assignedTo // Restore original value
          });
        });
      }
    } finally {
      // Even on error, we still need to remove the loading state
      setIsLoading(false);
    }
  };

  // Update the handleUnassign function
  const handleUnassign = async () => {
    if (!handleAssignTask) return;
    
    try {
      setIsLoading(true);
      console.log("TaskAssignment - Unassigning task");
      
      // Immediately update local state for a responsive UI
      onUpdate({
        ...task,
        assignedTo: undefined
      });
      
      // Call the actual handler with undefined to unassign
      await handleAssignTask(task._id, undefined);
    } catch (error) {
      console.error('Error unassigning task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-1">
      {/* Current assignee (if any) */}
      {hasAssignedUser && assignedUser && (
        <div className="px-3 py-2 mb-2 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <Avatar className="h-6 w-6 mr-2">
              {assignedUser.avatar || assignedUser.user?.avatar ? (
                <AvatarImage 
                  src={assignedUser.avatar || assignedUser.user?.avatar || ''} 
                  alt={assignedUser.name || assignedUser.user?.name || 'User'} 
                />
              ) : (
                <AvatarFallback>
                  {((assignedUser.name || assignedUser.user?.name || 'U')[0]).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="text-sm">{assignedUser.name || assignedUser.user?.name}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleUnassign} 
            disabled={isLoading}
            className="h-7 w-7 p-0"
          >
            <X size={16} />
          </Button>
        </div>
      )}

      {/* Team member list */}
      <div className="max-h-[250px] overflow-y-auto">
        <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 px-3">Team Members</h3>
        {teamMembers.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500">No team members available</div>
        ) : (
          <div className="space-y-1">
            {teamMembers.map((member) => {
              const memberId = member.user?._id || member._id || '';
              const memberName = member.user?.name || member.name || 'Unknown';
              const memberAvatar = member.user?.avatar || member.avatar;
              const isCurrentlyAssigned = memberId === assignedUserId;

              return (
                <button
                  key={memberId}
                  onClick={() => {
                    // Only call assign if this is not already the assigned user
                    if (!isCurrentlyAssigned) {
                      handleAssign(memberId);
                    }
                  }}
                  disabled={isLoading || isCurrentlyAssigned}
                  className={`w-full flex items-center px-3 py-1.5 text-sm rounded-sm ${
                    isCurrentlyAssigned 
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Avatar className="h-5 w-5 mr-2">
                    {memberAvatar ? (
                      <AvatarImage src={memberAvatar} alt={memberName} />
                    ) : (
                      <AvatarFallback>{memberName[0]}</AvatarFallback>
                    )}
                  </Avatar>
                  <span className="flex-1 text-left">{memberName}</span>
                  {isCurrentlyAssigned && <CheckCircle size={14} className="text-indigo-600 dark:text-indigo-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-xs">
          <div>Task ID: {task._id}</div>
          <div>AssignedTo: {assignedUserId || 'null'}</div>
        </div>
      )}
    </div>
  );
};

export default TaskAssignment;