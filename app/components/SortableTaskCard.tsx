/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import Draggable, { DraggableEventHandler } from 'react-draggable';
import { Task } from '@/app/types/board';
import TaskCard from './TaskCard';

interface SortableTaskCardProps {
  task: Task;
  columnId: string;
  onMoveTask?: (taskId: string, targetColumnId: string, position?: number) => Promise<void>;
  onSelectTask?: (task: Task) => void;
  onToggleTaskCompletion?: (columnId: string, taskId: string, isCompleted: boolean) => void;
  activeTaskId?: string | null;
  setActiveTaskId?: (taskId: string | null) => void;
}

const SortableTaskCard: React.FC<SortableTaskCardProps> = ({
  task,
  columnId,
  onMoveTask,
  onSelectTask,
  onToggleTaskCompletion,
  activeTaskId,
  setActiveTaskId
}) => {
  // Fix: specify non-null assertion to satisfy the RefObject<HTMLElement> requirement
  const nodeRef = React.useRef<HTMLDivElement>(null!);
  const [isDragging, setIsDragging] = useState(false);
  
  // Track which column we're hovering over
  const [hoverColumnId, setHoverColumnId] = useState<string | null>(null);
  
  const handleStart: DraggableEventHandler = (e, _data) => {
    e.stopPropagation();
    setIsDragging(true);
    setActiveTaskId?.(task._id);
  };
  
  const handleDrag: DraggableEventHandler = (e, _data) => {
    // Fix: Extract coordinates safely from the event
    const clientX = 'clientX' in e ? e.clientX : (e as any).touches?.[0]?.clientX;
    const clientY = 'clientY' in e ? e.clientY : (e as any).touches?.[0]?.clientY;
    
    if (typeof clientX !== 'number' || typeof clientY !== 'number') return;
    
    // Find column under pointer for visual feedback
    const elementsUnder = document.elementsFromPoint(clientX, clientY);
    
    // Find element with data-column-id attribute
    const columnElement = elementsUnder.find(el => {
      if (el instanceof HTMLElement) {
        return el.hasAttribute('data-column-id');
      }
      return false;
    }) as HTMLElement | undefined;
    
    if (columnElement) {
      const newColumnId = columnElement.dataset.columnId;
      if (newColumnId !== hoverColumnId) {
        setHoverColumnId(newColumnId || null);
      }
    } else {
      setHoverColumnId(null);
    }
  };
  
  // Fix: Remove async and properly handle promise
  const handleStop: DraggableEventHandler = (e, _data) => {
    setIsDragging(false);
    setActiveTaskId?.(null);
    
    // Fix: Extract coordinates safely from the event
    const clientX = 'clientX' in e ? e.clientX : (e as any).touches?.[0]?.clientX;
    const clientY = 'clientY' in e ? e.clientY : (e as any).touches?.[0]?.clientY;
    
    if (typeof clientX !== 'number' || typeof clientY !== 'number') return;
    
    // Find column we dropped on
    const elementsUnder = document.elementsFromPoint(clientX, clientY);
    
    // Find element with data-column-id attribute
    const columnElement = elementsUnder.find(el => {
      if (el instanceof HTMLElement) {
        return el.hasAttribute('data-column-id');
      }
      return false;
    }) as HTMLElement | undefined;
    
    if (columnElement) {
      const targetColumnId = columnElement.dataset.columnId;
      if (targetColumnId && targetColumnId !== columnId && onMoveTask) {
        console.log(`Moving task ${task._id} to column ${targetColumnId}`);
        // Use void to ignore Promise result
        void onMoveTask(task._id, targetColumnId).catch(error => {
          console.error('Error moving task:', error);
        });
      }
    }
    
    setHoverColumnId(null);
  };
  
  return (
    <div 
      ref={nodeRef} 
      className={`mb-3 ${isDragging ? 'shadow-lg' : ''} touch-none`}
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
        />
      </div>
    </div>
  );
};

export default SortableTaskCard;