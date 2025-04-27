/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '../lib/axios';
import axios from 'axios';
import useAuthStore from '@/app/store/useAuthStore';

const getAccessToken = (): string => {
  const { accessToken } = useAuthStore.getState();
  if (!accessToken) {
    throw new Error('Authentication required');
  }
  return accessToken;
};

export interface Column {
  _id: string;
  title?: string;
  name?: string;
  boardId?: string;
  board?: string;
  position: number;
  cards?: any[];
  createdAt?: string;
  updatedAt?: string;
  colorScheme?: string; 
}

export interface Task {
  _id: string;
  title: string;
  completed?: boolean;
  isCompleted?: boolean;
  description?: string;
  column: string;
  position: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked';
  assignedTo?: string | {
    _id: string;
    name?: string;
    username?: string;
    email?: string;
    avatar?: string;
  } | null;
  assignedAt?: string;
  labels?: string[];
  comments?: Array<{
    id: string;
    text: string;
    user: string;
    timestamp: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface Board {
  _id: string;
  title?: string;
  name?: string;
  description?: string;
  teamId?: string;
  team?: any;
  createdAt?: string;
  updatedAt?: string;
  backgroundColor?: string;
  isStarred?: boolean;
  owner?: string | { _id: string; name?: string };
  cardsCount?: number;
  completedCount?: number;
  visibility?: 'private' | 'public' | 'team';
  columns?: Column[];
}

export interface BoardWithColumns extends Board {
  columns: Column[];
}

export interface BoardApiResponse {
  data: Board[];
}

// Fetch board by ID
export async function fetchBoardById(boardId: string): Promise<Board> {
  try {
    const response = await api.get(`/boards/${boardId}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching board:', error);
    throw error;
  }
}

// Fetch columns for a specific board
export async function fetchColumnsByBoard(boardId: string): Promise<Column[]> {
  try {
    const response = await api.get(`/columns/board/${boardId}`);
    return response.data.data || response.data;
  } catch (error) {
    console.error('Error fetching columns:', error);
    throw error;
  }
}

// Create a new column
export async function createColumn(columnData: {
  title: string;
  boardId: string;
  position: number;
}): Promise<Column> {
  try {
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
      throw new Error('Authentication required');
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    const response = await fetch(`${apiUrl}/columns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(columnData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create column: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error creating column:', error);
    throw error;
  }
}

// Delete a column
export async function deleteColumn(columnId: string): Promise<void> {
  try {
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
      throw new Error('Authentication required');
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    const response = await fetch(`${apiUrl}/columns/${columnId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete column: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting column:', error);
    throw error;
  }
}

// Create a new task
export const createTask = async (taskData: any): Promise<Task> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    // If we're assigning the task at creation time, convert assignedTo to userId for API consistency
    if (taskData.assignedTo) {
      taskData.userId = taskData.assignedTo;
    }
    
    const response = await fetch(`${apiUrl}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to create task: ${response.status}`);
    }

    const responseData = await response.json();
    const taskResult = responseData.data || responseData;
    
    // Keep a consistent assignedTo field format
    return {
      ...taskResult,
      assignedTo: taskData.assignedTo || taskResult.assignedTo,
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

// Update a task
export async function updateTask(
  taskId: string, 
  updates: Partial<Omit<Task, '_id'>>
): Promise<Task> {
  try {
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
      throw new Error('Authentication required');
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

/**
 * Update board properties
 * @param boardId ID of the board to update
 * @param updates Updated board properties
 * @returns Updated board data
 */
export async function updateBoard(
  boardId: string, 
  updates: {
    title?: string;
    description?: string;
    backgroundColor?: string;
    visibility?: 'private' | 'public' | 'team';
    isStarred?: boolean;
  }
): Promise<Board> {
  try {
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
      throw new Error('Authentication required');
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    const response = await fetch(`${apiUrl}/boards/${boardId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `HTTP Error: ${response.status}` 
      }));
      throw new Error(errorData.message || 'Failed to update board');
    }

    const data = await response.json();
    return data.data || data;
  } catch (error: any) {
    console.error('Error updating board:', error);
    throw new Error(error.message || 'Failed to update board');
  }
}

/**
 * Fetch all boards for a specific team
 * @param teamId ID of the team
 * @returns Array of boards belonging to the team
 */
export async function fetchBoardsByTeam(teamId: string): Promise<BoardWithColumns[]> {
  try {
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
      throw new Error('Authentication required');
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    const response = await fetch(`${apiUrl}/boards/team/${teamId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch team boards: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error: any) {
    console.error('Error fetching team boards:', error);
    throw new Error(error.message || 'Failed to fetch team boards');
  }
}

/**
 * Create a new board
 * @param boardData Data for the new board
 * @returns Created board
 */
export async function createBoard(boardData: {
  title: string;
  description?: string;
  teamId?: string;
  backgroundColor?: string;
  colorScheme?: string;
}): Promise<BoardWithColumns> {
  try {
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
      throw new Error('Authentication required');
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    const response = await fetch(`${apiUrl}/boards`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(boardData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create board: ${response.status}`);
    }

    const data = await response.json();
    return data.data || data;
  } catch (error: any) {
    console.error('Error creating board:', error);
    throw new Error(error.message || 'Failed to create board');
  }
}

/**
 * Delete a board
 * @param boardId ID of the board to delete
 */
export async function deleteBoard(boardId: string): Promise<void> {
  try {
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
      throw new Error('Authentication required');
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    const response = await fetch(`${apiUrl}/boards/${boardId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete board: ${response.status}`);
    }
  } catch (error: any) {
    console.error('Error deleting board:', error);
    throw new Error(error.message || 'Failed to delete board');
  }
}

/**
 * Fetch all boards for the current user
 * @returns Array of boards belonging to the user
 */
export const fetchUserBoards = async (): Promise<Board[] | BoardApiResponse> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const { accessToken } = useAuthStore.getState();

    if (!accessToken) {
      console.warn("No access token available for fetching boards");
      return [];
    }

    // Make API request
    const response = await fetch(`${apiUrl}/boards`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch boards: ${response.status}`);
    }

    const data = await response.json();
    return data; // Return the raw data to be handled in the component
  } catch (error) {
    console.error('Error fetching boards:', error);
    return []; // Return empty array on error
  }
};

