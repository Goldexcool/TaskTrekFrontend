/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useAuthStore from './useAuthStore';
import { format } from 'timeago.js';

export interface ActivityItem {
  _id?: string;
  id?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  action?: string;
  actionType?: string; // Added to match API
  targetId?: string;
  targetName?: string;
  targetType?: 'board' | 'task' | 'column' | 'team' | 'comment';
  boardId?: string;
  teamId?: string;
  timestamp?: string;
  createdAt?: string;
  updatedAt?: string;
  type?: string;
  description?: string;
  metadata?: any;
  user?: {
    _id?: string; 
    id?: string;
    name?: string;
    username?: string;
    email?: string;
    avatar?: string;
  };
  team?: {
    _id?: string; // Use _id to match API response
    id?: string;
    name?: string;
  };
  board?: {
    _id?: string; // Use _id to match API response
    id?: string;
    title?: string;
  };
  task?: {
    _id?: string; // Use _id to match API response
    id?: string;
    title?: string;
    description?: string;
  };
  targetUser?: {
    _id?: string;
    name?: string;
    username?: string;
  };
  personalTask?: {
    _id?: string;
    title?: string;
  };
  entityId?: string;
  entityType?: string;
  entityName?: string;
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ActivityResponse {
  success: boolean;
  data: ActivityItem[];
  pagination: PaginationData;
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  teamId?: string;
  boardId?: string;
  taskId?: string;
  userId?: string;
  type?: string;
  actionType?: string; // Added to match API
  startDate?: string;
  endDate?: string;
}

export interface ActivityState {
  combinedFeed: ActivityItem[];
  userActivities: ActivityItem[];
  teamActivities: Record<string, ActivityItem[]>;
  boardActivities: Record<string, ActivityItem[]>;
  taskActivities: Record<string, ActivityItem[]>;
  personalTaskActivities: ActivityItem[];
  pagination: Record<string, PaginationData>; // Store pagination for different feed types
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCombinedFeed: (filters?: ActivityFilters) => Promise<ActivityItem[]>;
  fetchUserActivities: (filters?: ActivityFilters) => Promise<ActivityItem[]>;
  fetchTeamActivities: (teamId: string, filters?: ActivityFilters) => Promise<ActivityItem[]>;
  fetchBoardActivities: (boardId: string, filters?: ActivityFilters) => Promise<ActivityItem[]>;
  fetchTaskActivities: (taskId: string, filters?: ActivityFilters) => Promise<ActivityItem[]>;
  fetchPersonalTaskActivities: (filters?: ActivityFilters) => Promise<ActivityItem[]>;
  clearActivities: () => void;

  // Utility methods
  getTimeAgo: (timestamp: string | undefined) => string;
  getActivityIcon: (activityType: string | undefined) => string;
  formatActivityText: (activity: ActivityItem) => string;
  getUserInitials: (activity: ActivityItem) => string;
  getUserDisplayName: (activity: ActivityItem, currentUserId?: string) => string;
}

/**
 * Format API parameters from filters object
 */
const formatQueryParams = (filters?: ActivityFilters): string => {
  if (!filters) return '';
  
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.teamId) params.append('teamId', filters.teamId);
  if (filters.boardId) params.append('boardId', filters.boardId);
  if (filters.taskId) params.append('taskId', filters.taskId);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.type) params.append('type', filters.type);
  if (filters.actionType) params.append('actionType', filters.actionType);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  
  return params.toString() ? `?${params.toString()}` : '';
};

const useActivityStore = create<ActivityState>()(
  persist(
    (set, get) => ({
      combinedFeed: [],
      userActivities: [],
      teamActivities: {},
      boardActivities: {},
      taskActivities: {},
      personalTaskActivities: [],
      pagination: {},
      isLoading: false,
      error: null,
      
      /**
       * Fetch combined activity feed for the current user
       */
      fetchCombinedFeed: async (filters?: ActivityFilters) => {
        set({ isLoading: true, error: null });
        try {
          const { accessToken } = useAuthStore.getState();
          
          if (!accessToken) {
            throw new Error('Authentication required');
          }
          
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const queryParams = formatQueryParams(filters);
          
          // Updated endpoint to match the API documentation
          const response = await fetch(`${apiUrl}/activities${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
              message: `HTTP Error: ${response.status}` 
            }));
            throw new Error(errorData.message || 'Failed to fetch activities');
          }
          
          const data: ActivityResponse = await response.json();
          const activities = data.data || [];
          
          set({ 
            combinedFeed: activities,
            pagination: { 
              ...get().pagination, 
              combinedFeed: data.pagination 
            },
            isLoading: false 
          });
          
          return activities;
        } catch (error: any) {
          console.error('Error fetching combined feed:', error);
          set({ error: error.message || 'Failed to fetch activities', isLoading: false });
          return [];
        }
      },
      
      /**
       * Fetch activities for the current user
       */
      fetchUserActivities: async (filters?: ActivityFilters) => {
        set({ isLoading: true, error: null });
        try {
          const { accessToken, user } = useAuthStore.getState();
          
          if (!accessToken || !user?._id) {
            throw new Error('Authentication required');
          }
          
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const queryParams = formatQueryParams(filters);
          
          // Use the user-specific endpoint from the API docs
          const response = await fetch(`${apiUrl}/activities/user/${user._id}${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
              message: `HTTP Error: ${response.status}` 
            }));
            throw new Error(errorData.message || 'Failed to fetch user activities');
          }
          
          const data: ActivityResponse = await response.json();
          const activities = data.data || [];
          
          set({ 
            userActivities: activities,
            pagination: { 
              ...get().pagination, 
              userActivities: data.pagination 
            },
            isLoading: false 
          });
          
          return activities;
        } catch (error: any) {
          console.error('Error fetching user activities:', error);
          set({ error: error.message || 'Failed to fetch activities', isLoading: false });
          return [];
        }
      },
      
      /**
       * Fetch activities for a specific team
       */
      fetchTeamActivities: async (teamId: string, filters?: ActivityFilters) => {
        set({ isLoading: true, error: null });
        try {
          const { accessToken } = useAuthStore.getState();
          
          if (!accessToken) {
            throw new Error('Authentication required');
          }
          
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const queryParams = formatQueryParams(filters);
          
          // Endpoint is correct according to API docs
          const response = await fetch(`${apiUrl}/activities/team/${teamId}${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
              message: `HTTP Error: ${response.status}` 
            }));
            throw new Error(errorData.message || 'Failed to fetch team activities');
          }
          
          const data: ActivityResponse = await response.json();
          const activities = data.data || [];
          
          set(state => ({
            ...state,
            teamActivities: {
              ...state.teamActivities,
              [teamId]: activities
            },
            pagination: {
              ...state.pagination,
              [`team_${teamId}`]: data.pagination
            },
            isLoading: false
          }));
          
          return activities;
        } catch (error: any) {
          console.error(`Error fetching activities for team ${teamId}:`, error);
          set({ error: error.message || 'Failed to fetch activities', isLoading: false });
          return [];
        }
      },
      
      /**
       * Fetch activities for a specific board
       */
      fetchBoardActivities: async (boardId: string, filters?: ActivityFilters) => {
        set({ isLoading: true, error: null });
        try {
          const { accessToken } = useAuthStore.getState();
          
          if (!accessToken) {
            throw new Error('Authentication required');
          }
          
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const queryParams = formatQueryParams(filters);
          
          // Endpoint is correct according to API docs
          const response = await fetch(`${apiUrl}/activities/board/${boardId}${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
              message: `HTTP Error: ${response.status}` 
            }));
            throw new Error(errorData.message || 'Failed to fetch board activities');
          }
          
          const data: ActivityResponse = await response.json();
          const activities = data.data || [];
          
          set(state => ({
            ...state,
            boardActivities: {
              ...state.boardActivities,
              [boardId]: activities
            },
            pagination: {
              ...state.pagination,
              [`board_${boardId}`]: data.pagination
            },
            isLoading: false
          }));
          
          return activities;
        } catch (error: any) {
          console.error(`Error fetching activities for board ${boardId}:`, error);
          set({ error: error.message || 'Failed to fetch activities', isLoading: false });
          return [];
        }
      },
      
      /**
       * Fetch activities for a specific task
       */
      fetchTaskActivities: async (taskId: string, filters?: ActivityFilters) => {
        set({ isLoading: true, error: null });
        try {
          const { accessToken } = useAuthStore.getState();
          
          if (!accessToken) {
            throw new Error('Authentication required');
          }
          
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const queryParams = formatQueryParams(filters);
          
          // Endpoint is correct according to API docs
          const response = await fetch(`${apiUrl}/activities/task/${taskId}${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
              message: `HTTP Error: ${response.status}` 
            }));
            throw new Error(errorData.message || 'Failed to fetch task activities');
          }
          
          const data: ActivityResponse = await response.json();
          const activities = data.data || [];
          
          set(state => ({
            ...state,
            taskActivities: {
              ...state.taskActivities,
              [taskId]: activities
            },
            pagination: {
              ...state.pagination,
              [`task_${taskId}`]: data.pagination
            },
            isLoading: false
          }));
          
          return activities;
        } catch (error: any) {
          console.error(`Error fetching activities for task ${taskId}:`, error);
          set({ error: error.message || 'Failed to fetch activities', isLoading: false });
          return [];
        }
      },
      
      /**
       * Fetch activities for personal tasks
       */
      fetchPersonalTaskActivities: async (filters?: ActivityFilters) => {
        set({ isLoading: true, error: null });
        try {
          const { accessToken } = useAuthStore.getState();
          
          if (!accessToken) {
            throw new Error('Authentication required');
          }
          
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const queryParams = formatQueryParams(filters);
          
          // Add the personal-tasks endpoint from the API docs
          const response = await fetch(`${apiUrl}/activities/personal-tasks${queryParams}`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ 
              message: `HTTP Error: ${response.status}` 
            }));
            throw new Error(errorData.message || 'Failed to fetch personal task activities');
          }
          
          const data: ActivityResponse = await response.json();
          const activities = data.data || [];
          
          set({ 
            personalTaskActivities: activities,
            pagination: { 
              ...get().pagination, 
              personalTasks: data.pagination 
            },
            isLoading: false 
          });
          
          return activities;
        } catch (error: any) {
          console.error('Error fetching personal task activities:', error);
          set({ error: error.message || 'Failed to fetch activities', isLoading: false });
          return [];
        }
      },
      
      /**
       * Clear all stored activities
       */
      clearActivities: () => {
        set({
          combinedFeed: [],
          userActivities: [],
          teamActivities: {},
          boardActivities: {},
          taskActivities: {},
          personalTaskActivities: [],
          pagination: {},
          error: null
        });
      },
      
      /**
       * Helper method to format time ago string
       */
      getTimeAgo: (timestamp: string | undefined) => {
        if (!timestamp) return '';
        try {
          return format(new Date(timestamp));
        } catch (error) {
          console.error('Error formatting time:', error);
          return '';
        }
      },
      
      /**
       * Helper method to get the appropriate icon for activity type
       */
      getActivityIcon: (activityType: string | undefined) => {
        if (!activityType) return 'Activity';
        
        // Updated icons to match the API's action types
        const icons: Record<string, string> = {
          'board_created': 'Layers',
          'create_board': 'Layers',
          'board_updated': 'Layers',
          'update_board': 'Layers',
          'task_created': 'CheckSquare',
          'create_task': 'CheckSquare',
          'task_updated': 'CheckSquare',
          'update_task': 'CheckSquare',
          'task_moved': 'ArrowRight',
          'move_task': 'ArrowRight',
          'column_created': 'List',
          'create_column': 'List',
          'column_updated': 'List',
          'update_column': 'List',
          'team_created': 'Users',
          'create_team': 'Users',
          'team_updated': 'Users',
          'update_team': 'Users',
          'team_joined': 'UserPlus',
          'join_team': 'UserPlus',
          'comment_created': 'MessageSquare',
          'create_comment': 'MessageSquare',
          'task_completed': 'CheckCircle',
          'complete_task': 'CheckCircle',
          'task_reopened': 'RefreshCw',
          'reopen_task': 'RefreshCw',
          'assign_task': 'UserCheck',
          'task_assigned': 'UserCheck',
          'complete_personal_task': 'CheckCircle',
          'create_personal_task': 'FileText',
          'default': 'Activity'
        };
        
        return icons[activityType.toLowerCase()] || icons.default;
      },
      
      /**
       * Format activity text based on activity type and data
       */
      formatActivityText: (activity: ActivityItem): string => {
        if (!activity) return '';
        
        // Use the description from the API response if available
        if (activity.description) {
          return activity.description;
        }
        
        // Handle different activity formats
        if (activity.action && activity.targetName) {
          return `${activity.action} ${activity.targetName}`;
        }
        
        // Handle the actionType from the API
        if (activity.actionType) {
          const type = activity.actionType.toLowerCase();
          
          // Get entity name based on the activity type
          let entityName = '';
          
          if (type.includes('task')) {
            entityName = activity.task?.title || '';
          } else if (type.includes('board')) {
            entityName = activity.board?.title || '';
          } else if (type.includes('team')) {
            entityName = activity.team?.name || '';
          } else if (type.includes('personal_task')) {
            entityName = activity.personalTask?.title || '';
          }
          
          const actionMap: Record<string, string> = {
            'create_board': 'created board',
            'update_board': 'updated board',
            'create_task': 'created task',
            'update_task': 'updated task',
            'complete_task': 'completed task',
            'reopen_task': 'reopened task',
            'move_task': 'moved task',
            'assign_task': 'assigned task',
            'create_column': 'created column',
            'update_column': 'updated column',
            'create_team': 'created team',
            'update_team': 'updated team',
            'join_team': 'joined team',
            'create_comment': 'commented on',
            'complete_personal_task': 'completed personal task',
            'create_personal_task': 'created personal task'
          };
          
          const action = actionMap[type] || 'interacted with';
          
          if (type === 'assign_task' && activity.targetUser) {
            return `${action} ${entityName} to ${activity.targetUser.name || 'someone'}`;
          }
          
          return `${action} ${entityName}`;
        }
        
        // Legacy format
        if (activity.type) {
          const type = activity.type.toLowerCase();
          const entityName = activity.entityName || activity.task?.title || activity.board?.title || '';
          
          const actionMap: Record<string, string> = {
            'board_created': 'created board',
            'board_updated': 'updated board',
            'task_created': 'created task',
            'task_updated': 'updated task',
            'task_moved': 'moved task',
            'column_created': 'created column',
            'column_updated': 'updated column',
            'team_created': 'created team',
            'team_updated': 'updated team',
            'team_joined': 'joined team',
            'comment_created': 'commented on'
          };
          
          const action = actionMap[type] || 'interacted with';
          return `${action} ${entityName}`;
        }
        
        return 'performed an action';
      },
      
      /**
       * Get user initials from activity
       */
      getUserInitials: (activity: ActivityItem): string => {
        if (!activity) return 'U';
        
        // Get from user object using both _id and id keys (API compatibility)
        const userName = activity.userName || 
                        activity.user?.name || 
                        activity.user?.username || '';
        
        if (userName && typeof userName === 'string') {
          return userName.split(' ')
                        .map(name => name[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2);
        }
        
        return 'U';
      },
      
      /**
       * Get user display name
       */
      getUserDisplayName: (activity: ActivityItem, currentUserId?: string): string => {
        if (!activity) return 'Unknown user';
        
        // Check if this is the current user
        const activityUserId = activity.userId || 
                              activity.user?._id || 
                              activity.user?.id;
        
        if (currentUserId && activityUserId === currentUserId) {
          return 'You';
        }
        
        // Otherwise return the name or username
        return activity.userName || 
               activity.user?.name || 
               activity.user?.username || 
               'Unknown user';
      }
    }),
    {
      name: 'activity-storage',
      partialize: (state) => ({
        combinedFeed: state.combinedFeed?.slice(0, 20) || [],
        userActivities: state.userActivities?.slice(0, 20) || [],
      }),
    }
  )
);

export default useActivityStore;