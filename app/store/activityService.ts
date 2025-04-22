/* eslint-disable @typescript-eslint/no-explicit-any */
import useAuthStore from './useAuthStore';
import { format } from 'timeago.js';

export interface ActivityItem {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  targetId: string;
  targetName: string;
  targetType: 'board' | 'task' | 'column' | 'team' | 'comment';
  boardId?: string;
  teamId?: string;
  timestamp: string;
}

export interface ActivityFilters {
  teamId?: string;
  boardId?: string;
  taskId?: string;
  userId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

/**
 * Format API parameters from filters object
 */
const formatQueryParams = (filters?: ActivityFilters): string => {
  if (!filters) return '';
  
  const params = new URLSearchParams();
  
  if (filters.teamId) params.append('teamId', filters.teamId);
  if (filters.boardId) params.append('boardId', filters.boardId);
  if (filters.taskId) params.append('taskId', filters.taskId);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.type) params.append('type', filters.type);
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.limit) params.append('limit', filters.limit.toString());
  
  return params.toString() ? `?${params.toString()}` : '';
};

/**
 * Fetch combined activity feed
 */
export const fetchActivityLog = async (filters?: ActivityFilters): Promise<ActivityItem[]> => {
  try {
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
      throw new Error('Authentication required');
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const queryParams = formatQueryParams(filters);
    
    const response = await fetch(`${apiUrl}/activities/feed${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch activities: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error: any) {
    console.error('Error fetching activity log:', error);
    return [];
  }
};

/**
 * Fetch activities for the current user
 */
export const fetchUserActivities = async (filters?: ActivityFilters): Promise<ActivityItem[]> => {
  try {
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
      throw new Error('Authentication required');
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const queryParams = formatQueryParams(filters);
    
    const response = await fetch(`${apiUrl}/activities/user${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user activities: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error: any) {
    console.error('Error fetching user activities:', error);
    return [];
  }
};

/**
 * Fetch activities for a specific team
 */
export const fetchTeamActivities = async (teamId: string, filters?: ActivityFilters): Promise<ActivityItem[]> => {
  try {
    const { accessToken } = useAuthStore.getState();
    
    if (!accessToken) {
      throw new Error('Authentication required');
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const queryParams = formatQueryParams(filters);
    
    const response = await fetch(`${apiUrl}/activities/team/${teamId}${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch team activities: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data || [];
  } catch (error: any) {
    console.error('Error fetching team activities:', error);
    return [];
  }
};

/**
 * Format time ago string
 */
export const formatTimeAgo = (timestamp: string): string => {
  return format(new Date(timestamp));
};