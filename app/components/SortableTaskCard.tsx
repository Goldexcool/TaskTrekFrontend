/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { Task } from '@/app/types/task';
import TaskCard from './TaskCard';

interface SortableTaskCardProps {
  task: Task;
  columnId: string;
  onMoveTask?: (taskId: string, targetColumnId: string, position?: number) => Promise<void>;
  onSelectTask?: (task: Task) => void;
  onToggleTaskCompletion?: (columnId: string, taskId: string, isCompleted: boolean) => void;
  teamMembers?: any[];
  handleAssignTask?: (taskId: string, memberId: string | undefined) => Promise<void> | void;
  onUpdateTask?: (taskId: string, updatedTask: Partial<Task>) => Promise<any> | void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  columnId,
  onMoveTask,
  onSelectTask,
  onToggleTaskCompletion,
  teamMembers = [],
  handleAssignTask,
  onUpdateTask,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${columnId}-${task._id}`, // Use composite key to prevent duplicate ID issues
    data: {
      type: 'task',
      task,
      columnId, // This is fine for the internal data prop
    },
  });

  const handleMoveTaskToColumn = async (taskId: string, destinationColumnId: string) => {
    try {
      await onMoveTask?.(taskId, destinationColumnId);
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  const handleAssignTaskAdapter = handleAssignTask 
    ? (taskId: string, memberId: string | undefined) => {
        return handleAssignTask(taskId, memberId);
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
      }}
      className={`mb-3 ${isDragging ? 'shadow-lg' : ''} touch-none`}
      {...attributes}
      {...listeners}
    >
      <div className="cursor-grab">
        <TaskCard
          task={task}
          columnId={columnId}
          onClick={() => {
            if (!isDragging) {
              onSelectTask?.(task);
            }
          }}
          onStatusToggle={(isCompleted) => {
            onToggleTaskCompletion?.(columnId, task._id, isCompleted);
          }}
          teamMembers={teamMembers}
          handleAssignTask={handleAssignTaskAdapter}
          onUpdateTask={onUpdateTask}
        />
      </div>
    </div>
  );
};

export default SortableTaskCard;