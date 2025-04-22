/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '../lib/axios';
import axios from 'axios';
import useAuthStore from './useAuthStore';
import { ReactNode } from 'react';
import { Types } from 'mongoose';

// Define the TeamUserData interface based on your API
export interface TeamUserData {
  _id: string;
  username?: string;
  email?: string;
  name?: string;
  avatar?: string;
  image?: string;
}

// Define the TeamMember interface to align with your API
export interface TeamMember {
  user: TeamUserData | string;
  role: 'owner' | 'admin' | 'member';
  joinedAt?: string;
}

// Define Team interface to match your API
export interface Team {
  user: ReactNode;
  _id: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
  owner: TeamUserData | string;
  members: TeamMember[];
  avatar?: string;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
}

// API response format
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

// Base URL for API requests - use the render URL for production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const { accessToken } = useAuthStore.getState();
  
  if (!accessToken) {
    throw new Error('Authentication required');
  }
  
  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
};

// Create a new team
export const createTeam = async (teamData: {
  name: string;
  description?: string;
  isPrivate?: boolean;
  members?: string[]; // Email strings
  avatar: string | null;
}): Promise<Team> => {
  try {
    console.log('Creating team with data:', teamData);
    
    // Format members properly for the API
    const formattedData = {
      ...teamData,
      members: teamData.members ? teamData.members.map(email => ({ email })) : undefined
    };
    
    console.log('Formatted team data for API:', formattedData);
    console.log('API URL:', `${API_BASE_URL}/teams`);
    
    const response = await api.post<ApiResponse<Team>>(
      `/teams`, 
      formattedData
    );
    
    console.log('Create team response:', response.data);
    return response.data.data;
  } catch (error: any) {
    console.error('Error creating team:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// Fetch a specific team by ID
export const fetchTeam = async (teamId: string): Promise<Team> => {
  try {
    console.log(`Fetching team with ID: ${teamId}`);
    
    const response = await api.get<ApiResponse<Team>>(`/teams/${teamId}`);
    
    // If the server returns success: false, throw an error with the message
    if (response.data && response.data.success === false) {
      throw new Error(response.data.message || 'Failed to load team data');
    }
    
    // Ensure we have valid data before returning
    if (!response.data?.data || !response.data?.data._id) {
      throw new Error('Invalid team data received from server');
    }
    
    return response.data.data;
  } catch (error: any) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      // Server returned an error response
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data as any;
        
        console.error(`Server error ${status}:`, data);
        
        // Handle specific status codes
        if (status === 404) {
          throw new Error('Team not found');
        } else if (status === 403) {
          throw new Error('You don\'t have permission to access this team');
        } else if (status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (status === 500) {
          // Special handling for the specific error we're seeing
          if (data?.message?.includes('Cannot read properties of undefined')) {
            throw new Error('Team not found or has been deleted');
          } else {
            throw new Error(`Server error: ${data?.message || 'Unknown server error'}`);
          }
        }
        
        // Generic error with server message if available
        throw new Error(data?.message || `Error: ${status}`);
      } 
      // Network error or timeout
      else if (error.request) {
        console.error('Network error:', error.message);
        throw new Error('Network error. Please check your connection and try again.');
      }
    }
    
    // For non-axios errors, pass along the message
    console.error('Error fetching team:', error);
    throw error instanceof Error 
      ? error 
      : new Error('An unknown error occurred while loading the team');
  }
};

// Alias for backward compatibility
export const fetchTeamById = async (teamId: string) => {
  try {
    const response = await axios.get(`/teams/${teamId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching team:', error);
    // Check for network errors
    if ((error as Error).message === 'Network Error') {
      throw new Error('Network connection issue. Please check your internet connection.');
    }
    // Handle 404 specially
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      throw new Error('Team not found');
    }
    // Handle other errors
    throw error;
  }
};

// Create a PUT-specific function to ensure update uses PUT
export const putTeamUpdate = async (teamId: string, data: any): Promise<ApiResponse<Team>> => {
  console.log(`PUT Update for team ${teamId}:`, data);
  
  // Force PUT method and explicitly set Content-Type to prevent any ambiguity
  const response = await api({
    method: 'PUT',
    url: `/teams/${teamId}`,
    data,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return response.data;
};

// Update an existing team
export const updateTeam = async (teamId: string, teamData: any) => {
  try {
    const teamCheck = await checkTeamExists(teamId);
    
    if (!teamCheck.exists) {
      throw new Error(teamCheck.message || 'This team no longer exists and cannot be updated.');
    }
    
    const result = await putTeamUpdate(teamId, teamData);
    return result;
  } catch (error: any) {
    console.error('Error in updateTeam:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('This team no longer exists and cannot be updated.');
      }
      if (error.response?.status === 403) {
        throw new Error('You do not have permission to update this team.');
      }
      if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
    }
    
    // Re-throw original error if it's already an Error instance
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error('Failed to update team');
  }
};

// Fetch all teams
export const fetchTeams = async (): Promise<ApiResponse<Team[]>> => {
  try {
    console.log('Fetching all teams');
    console.log('API URL:', `${API_BASE_URL}/teams`);
    
    const response = await api.get<ApiResponse<Team[]>>(`/teams`);
    
    console.log('Teams response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching teams:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to load teams');
  }
};

// Delete a team
export const deleteTeam = async (teamId: string): Promise<ApiResponse<{ message: string }>> => {
  try {
    console.log(`Deleting team with ID: ${teamId}`);
    
    // Validate teamId
    if (!teamId || !/^[a-f\d]{24}$/i.test(teamId)) { 
      throw new Error('Invalid team ID format');
    }
    
    const response = await api.delete<ApiResponse<{ message: string }>>(`/teams/${teamId}`);
    console.log('Delete team response:', response.data);
    
    if (!response.data || response.data.success === false) {
      throw new Error(response.data?.message || 'Failed to delete team');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Error deleting team:', error);
    
    // Handle specific error cases
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 404) {
        // If team not found, treat as success (it's already gone)
        console.log('Team not found during deletion - treating as already deleted');
        return {
          success: true,
          message: 'Team already deleted',
          data: { message: 'Team was already deleted or does not exist' }
        };
      } else if (status === 403) {
        throw new Error('You do not have permission to delete this team');
      } else if (data && data.message) {
        throw new Error(data.message);
      }
    }
    
    // Re-throw with descriptive message
    throw error instanceof Error 
      ? error 
      : new Error('Failed to delete team due to an unknown error');
  }
};

// Add a member to a team
export const addTeamMember = async (teamId: string, email: string): Promise<ApiResponse<{
  teamId: string;
  newMember: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}>> => {
  try {
    const response = await api.post<ApiResponse<{
      teamId: string;
      newMember: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
    }>>(`/teams/${teamId}/members`, { email });
    
    return response.data;
  } catch (error: any) {
    console.error('Error adding team member:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// Remove a member from a team
export const removeTeamMember = async (teamId: string, userId: string): Promise<ApiResponse<object>> => {
  try {
    const response = await api.delete<ApiResponse<object>>(`/teams/${teamId}/members/${userId}`);
    
    return response.data;
  } catch (error: any) {
    console.error('Error removing team member:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

// Change a member's role in a team
export const changeTeamMemberRole = async (
  teamId: string, 
  userId: string, 
  role: 'admin' | 'member'
): Promise<ApiResponse<{
  teamId: string;
  userId: string;
  newRole: string;
  owner: string;
}>> => {
  try {
    const response = await api.put<ApiResponse<{
      teamId: string;
      userId: string;
      newRole: string;
      owner: string;
    }>>(`/teams/${teamId}/members/${userId}/role`, { role });
    
    return response.data;
  } catch (error: any) {
    console.error('Error changing member role:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

export const transferTeamOwnership = async (
  teamId: string, 
  userId: string
): Promise<ApiResponse<{
  teamId: string;
  newOwner: string;
}>> => {
  try {
    const response = await api.put<ApiResponse<{
      teamId: string;
      newOwner: string;
    }>>(`/teams/${teamId}/transfer-ownership`, { userId });
    
    return response.data;
  } catch (error: any) {
    console.error('Error transferring team ownership:', error.response?.data || error.message);
    throw error.response?.data || error;
  }
};

/**
 * Check if a team exists without loading all its data
 * Uses a lightweight API endpoint instead of Mongoose validation
 * @param teamId ID of the team to check
 * @returns Boolean indicating if the team exists and team data if available
 */
export const checkTeamExists = async (teamId: string): Promise<{
  exists: boolean;
  team?: any;
  message?: string;
  success?: boolean;
}> => {
  try {
    if (!teamId || !teamId.match(/^[0-9a-fA-F]{24}$/)) {
      return { 
        exists: false, 
        message: 'Invalid team ID format',
        success: false
      };
    }
    
    // Use the direct backend API endpoint
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const response = await api.get(`${apiUrl}/teams/exists/${teamId}`);
    
    // Return the response data which should include exists, success, and team
    return response.data;
  } catch (error: any) {
    console.error(`Error checking if team ${teamId} exists:`, error);
    
    // Handle specific error responses
    if (error.response?.status === 404) {
      return { 
        exists: false, 
        message: 'Team not found',
        success: false
      };
    }
    
    // Return any error message from the API
    if (error.response?.data?.message) {
      return {
        exists: false,
        message: error.response.data.message,
        success: false
      };
    }
    
    // Generic error message for other cases
    return { 
      exists: false, 
      message: 'Error checking team existence',
      success: false
    };
  }
};