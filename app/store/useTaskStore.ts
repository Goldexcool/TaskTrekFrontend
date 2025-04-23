/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useAuthStore from './useAuthStore'; // Import normally
import { shallow } from 'zustand/shallow';

// Modify your Task interface to make it compatible with boardService.Task
export interface Task {
  _id: string;
  title: string;
  description?: string;
  status?: string | 'pending' | 'in-progress' | 'completed' | 'blocked'; // Make this more flexible
  priority?: 'low' | 'medium' | 'high' | 'critical';
  position?: number;
  column?: string; // Column ID
  columnId?: string; // For compatibility with different API responses
  boardId?: string; // Make this optional to accommodate boardService.Task
  dueDate?: string;
  assignedTo?: string;
  createdAt?: string;
  updatedAt?: string;
  labels?: string[];
  // Add any other fields you need
}

// Update the fetchUserTasks function:
export const fetchUserTasks = async (): Promise<Task[]> => {
  try {
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
      throw new Error('Authentication required');
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    const response = await fetch(`${apiUrl}/tasks/all`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Raw task response:', result); // Debug log
    
    // Handle the API response format you showed
    if (result.success && Array.isArray(result.data)) {
      return result.data.map((task: any) => ({
        _id: task.id || task._id,
        title: task.title || 'Untitled Task',
        description: task.description || '',
        status: task.completed ? 'completed' : 'pending',
        priority: task.priority || 'normal',
        dueDate: task.dueDate || null,
        assignedTo: task.assignedTo || null,
        assignedUser: task.createdBy || null,
        boardId: task.board?.id || '',
        columnId: task.column?.id || '',
        position: task.position || 0,
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: task.updatedAt || new Date().toISOString(),
        teamId: task.team?.id || '',
        team: task.team || null,
        board: task.board || null,
        column: task.column || null,
        completed: task.completed || false,
        labels: task.labels || []
      }));
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching user tasks:', error);
    return [];
  }
}

// Add the export keyword to make TaskState available for import
export interface TaskState {
  tasks: Record<string, Task[]>;
  isLoading: boolean;
  error: string | null;
  
  // Task actions
  fetchTasksByColumn: (columnId: string) => Promise<Task[]>;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (columnId: string, taskId: string) => Promise<void>;
  moveTask: (taskId: string, sourceColumnId: string, destinationColumnId: string, position: number) => Promise<void>;
  clearTasks: () => void;
}

const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: {},
      isLoading: false,
      error: null,
      
      fetchTasksByColumn: async (columnId: string) => {
        set(state => ({ ...state, isLoading: true, error: null }));
        
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const accessToken = useAuthStore.getState().accessToken;
          
          if (!accessToken) {
            throw new Error('Authentication required');
          }
          
          const response = await fetch(`${apiUrl}/tasks/column/${columnId}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
              message: `HTTP Error: ${response.status}` 
            }));
            throw new Error(errorData.message || 'Failed to fetch tasks');
          }
          
          const data = await response.json();
          const uniqueTasks = data.data.map((task: any) => ({
            ...task,
            column: columnId,
            // Make sure both status indicators are in sync
            completed: task.status === 'completed' || task.completed === true,
            status: task.completed === true ? 'completed' : (task.status || 'pending')
          }));
          
          set(state => ({
            ...state,
            tasks: {
              ...state.tasks,
              [columnId]: uniqueTasks
            },
            isLoading: false
          }));
          
          return uniqueTasks;
        } catch (error: any) {
          console.error(`Error fetching tasks for column ${columnId}:`, error);
          set(state => ({ 
            ...state, 
            error: error.message || 'Failed to fetch tasks', 
            isLoading: false 
          }));
          return [];
        }
      },
      
      addTask: (task: Task) => {
        set(state => {
          const columnId = task.column as string;
          const columnTasks = state.tasks[columnId] || [];
          
          return {
            ...state,
            tasks: {
              ...state.tasks,
              [columnId]: [...columnTasks, task]
            }
          };
        });
      },
      
      updateTask: (taskId: string, updates: Partial<Task>) => {
        set(state => {
          const newTasks = { ...state.tasks };
          let taskUpdated = false;
          
          // Find the task in all columns and update it
          Object.keys(newTasks).forEach(columnId => {
            const columnTasks = newTasks[columnId];
            const taskIndex = columnTasks.findIndex(task => task._id === taskId);
            
            if (taskIndex !== -1) {
              // Update the task
              newTasks[columnId] = [
                ...columnTasks.slice(0, taskIndex),
                { ...columnTasks[taskIndex], ...updates },
                ...columnTasks.slice(taskIndex + 1)
              ];
              taskUpdated = true;
            }
          });
          
          if (!taskUpdated) return state;
          
          return {
            ...state,
            tasks: newTasks
          };
        });
      },
      
      deleteTask: async (columnId: string, taskId: string) => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const accessToken = useAuthStore.getState().accessToken;
          
          if (!accessToken) {
            throw new Error('Authentication required');
          }
          
          // Optimistically update the UI
          set(state => {
            const columnTasks = state.tasks[columnId] || [];
            return {
              ...state,
              tasks: {
                ...state.tasks,
                [columnId]: columnTasks.filter(task => task._id !== taskId)
              }
            };
          });
          
          // Make API call to delete the task
          const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            // If API call fails, revert the optimistic update
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to delete task: ${response.status}`);
          }
        } catch (error: any) {
          console.error('Error deleting task:', error);
          // Fetch the column tasks again to revert any optimistic updates
          get().fetchTasksByColumn(columnId);
          throw error;
        }
      },
      
      moveTask: async (taskId: string, sourceColumnId: string, destinationColumnId: string, position: number) => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const accessToken = useAuthStore.getState().accessToken;
          
          if (!accessToken) {
            throw new Error('Authentication required');
          }
          
          // Find the task to move
          const sourceTasks = get().tasks[sourceColumnId] || [];
          const taskToMove = sourceTasks.find(task => task._id === taskId);
          
          if (!taskToMove) {
            throw new Error('Task not found');
          }
          
          // Optimistically update the UI
          set(state => {
            const newTasks = { ...state.tasks };
            const sourceTasks = [...(newTasks[sourceColumnId] || [])];
            const destTasks = [...(newTasks[destinationColumnId] || [])];
            
            // Remove task from source column
            newTasks[sourceColumnId] = sourceTasks.filter(task => task._id !== taskId);
            
            // Add task to destination column with new position
            const updatedTask = { ...taskToMove, column: destinationColumnId, position };
            newTasks[destinationColumnId] = [...destTasks, updatedTask]
              .sort((a, b) => (a.position || 0) - (b.position || 0));
            
            return {
              ...state,
              tasks: newTasks
            };
          });
          
          // Make API call to move the task
          const response = await fetch(`${apiUrl}/tasks/${taskId}/move`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sourceColumnId,
              destinationColumnId,
              position
            }),
          });
          
          if (!response.ok) {
            // If API call fails, revert the optimistic update
            const errorData = await response.json();
            throw new Error(errorData.message || `Failed to move task: ${response.status}`);
          }
          
          return;
        } catch (error: any) {
          console.error('Error moving task:', error);
          // Fetch both columns' tasks again to revert any optimistic updates
          get().fetchTasksByColumn(sourceColumnId);
          if (sourceColumnId !== destinationColumnId) {
            get().fetchTasksByColumn(destinationColumnId);
          }
          throw error;
        }
      },
      
      clearTasks: () => {
        set({ tasks: {} });
      }
    }),
    {
      name: 'task-storage',
      // Don't persist loading and error states
      partialize: (state) => ({ tasks: state.tasks }),
    }
  )
);

export default useTaskStore;