/* eslint-disable @typescript-eslint/no-unused-vars */
import { create } from 'zustand';

interface TaskUpdateStore {
  updatedTasks: Record<string, number>; // taskId -> timestamp
  notifyTaskUpdate: (taskId: string) => void;
  subscribeToUpdates: (callback: (taskId: string) => void) => () => void;
  batchUpdate: (taskIds: string[]) => void;
  listeners: ((taskId: string) => void)[];
}

const useTaskUpdates = create<TaskUpdateStore>((set, get) => ({
  updatedTasks: {},
  listeners: [],
  
  notifyTaskUpdate: (taskId: string) => {
    const timestamp = Date.now();
    set(state => {
      // Update timestamp
      const updatedTasks = {
        ...state.updatedTasks,
        [taskId]: timestamp
      };
      
      // Notify listeners using a setTimeout to avoid blocking the UI
      setTimeout(() => {
        state.listeners.forEach(listener => listener(taskId));
      }, 0);
      
      return { updatedTasks };
    });
  },
  
  batchUpdate: (taskIds: string[]) => {
    const timestamp = Date.now();
    set(state => {
      // Update timestamps for all tasks in batch
      const updatedTasks = { ...state.updatedTasks };
      taskIds.forEach(taskId => {
        updatedTasks[taskId] = timestamp;
      });
      
      // Notify listeners for each task using a single setTimeout
      setTimeout(() => {
        taskIds.forEach(taskId => {
          state.listeners.forEach(listener => listener(taskId));
        });
      }, 0);
      
      return { updatedTasks };
    });
  },
  
  subscribeToUpdates: (callback) => {
    set(state => ({
      listeners: [...state.listeners, callback]
    }));
    
    // Return unsubscribe function
    return () => {
      set(state => ({
        listeners: state.listeners.filter(listener => listener !== callback)
      }));
    };
  }
}));

export default useTaskUpdates;