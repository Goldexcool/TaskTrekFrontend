/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
export interface Column {
  _id: string;
  title?: string;
  name?: string; 
  position?: number;
  boardId?: string;
  board?: string;
  cards?: any[];
  cardsCount?: number;
  colorScheme?: string;
  backgroundColor?: string;
}

export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  completed?: boolean;
  isCompleted?: boolean;
  column: string;
  position: number;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string | undefined; // Using undefined is more TypeScript-friendly
  labels?: string[];
  assignedTo?: string;
  createdBy?: string;
  isStarred?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Board {
  _id: string;
  id?: string; // Add id as some API responses might use id instead of _id
  title?: string;
  name?: string; // Add name property that exists in your API data
  description?: string;
  backgroundColor?: string;
  colorScheme?: string;
  columns?: Column[];
  isStarred?: boolean;
  totalTasks?: number;
  cardsCount?: number;
  updatedAt?: string;
  createdAt?: string;
  createdBy?: string;
  team?: string | { _id: string; name: string; avatar?: string };
  teamId?: string;
}

export interface TeamMember {
  _id: string;
  user?: {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  name?: string;
  avatar?: string;
  role?: string;
}

// Example for updateTask function
const updateTask = async (taskId: string, updates: Partial<Task>) => {
  const apiUpdates = { ...updates };
  
  // Special handling for null/undefined
  if (updates.dueDate === undefined) {
    (apiUpdates as any).dueDate = null;
  }
  
  try {
    // API call with apiUpdates that has null instead of undefined
    const response = await fetch(`/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiUpdates)
    });
    
    // Rest of your code...
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

