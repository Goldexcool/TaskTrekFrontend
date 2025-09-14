/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus, ArrowRight, Clock, Calendar, CheckSquare, Users, Layers, Activity,
  Edit, Trash2, Filter, X, Search, Square
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchTeams, Team, deleteTeam } from '../store/teamService';
import { Task } from '../store/useTaskStore';
import useAuthStore from '../store/useAuthStore';
import LoadingSpinner from '../components/LoadingSpinner';
import useActivityStore from '../store/activityStore';
import { Board } from '../store/boardService';
import apiClient from '../utils/apiClient';
import { useToast } from '../components/Toast';

// API response interfaceschdkc 
interface TeamApiResponse {
  success?: boolean;
  count?: number;
  data?: Team[];
}

interface ExtendedTask extends Task {
  completed?: boolean;
  isCompleted?: boolean;
  id?: string;
  assignedUser?: {
    id?: string;
    _id?: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
  assignedTo?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'done' | 'in_progress';
  boardId?: string;
  board?: string;
  dueDate?: string;
}

// Helper function for team avatars
const getTeamAvatarStyle = (name: string) => {
  const colors = [
    { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200', darkBg: 'bg-indigo-900/50', darkText: 'text-indigo-300' },
    { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200', darkBg: 'bg-violet-900/50', darkText: 'text-violet-300' },
    { bg: 'bg-sky-100', text: 'text-sky-600', border: 'border-sky-200', darkBg: 'bg-sky-900/50', darkText: 'text-sky-300' },
    { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200', darkBg: 'bg-emerald-900/50', darkText: 'text-emerald-300' },
    { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200', darkBg: 'bg-amber-900/50', darkText: 'text-amber-300' },
    { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200', darkBg: 'bg-rose-900/50', darkText: 'text-rose-300' },
  ];

  // Simple hash function to get consistent color
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Helper function for board colors
const getBoardColor = (boardName: string) => {
  const colors = [
    'bg-pink-500', 'bg-blue-500', 'bg-purple-500', 'bg-green-500',
    'bg-yellow-500', 'bg-indigo-500', 'bg-red-500', 'bg-emerald-500'
  ];

  const hash = boardName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Add these date formatting utilities
const formatRelativeTime = (date: Date | string | undefined): string => {
  if (!date) return 'Unknown';

  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Ensure valid date
  if (isNaN(dateObj.getTime())) return 'Invalid date';

  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);

  if (diffSec < 60) return `just now`;
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  if (diffDay < 30) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  if (diffMonth < 12) return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
  return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`;
};

const formatDueDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Not set';

  const dueDate = new Date(dateString);
  if (isNaN(dueDate.getTime())) return 'Invalid date';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueDay = new Date(dueDate);
  dueDay.setHours(0, 0, 0, 0);

  if (dueDay.getTime() === today.getTime()) {
    return 'Today';
  } else if (dueDay.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else {
    const diffMs = dueDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      return `${absDays} ${absDays === 1 ? 'day' : 'days'} overdue`;
    } else if (diffDays <= 7) {
      return `In ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    } else if (diffDays <= 30) {
      const weeks = Math.floor(diffDays / 7);
      return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `In ${months} ${months === 1 ? 'month' : 'months'}`;
    }
  }
};

const DashboardPage: React.FC = () => {
  // State variables
  const [teamMenuOpen, setTeamMenuOpen] = useState<number | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [tasks, setTasks] = useState<ExtendedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamsCount, setTeamsCount] = useState(0);
  const [boardsCount, setBoardsCount] = useState(0);
  const [completedTaskCount, setCompletedTaskCount] = useState(0);
  const [totalTaskCount, setTotalTaskCount] = useState(0);
  const [dueTodayCount, setDueTodayCount] = useState(0);

  const { user } = useAuthStore();
  const { success, error: toastError, info } = useToast();

  // New state variables for filtering
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [activeTaskTab, setActiveTaskTab] = useState<string>('all');

  const handleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      // First update the local state for immediate feedback
      setTasks(prevTasks => 
        prevTasks.map(task => {
          if (task._id === taskId || task.id === taskId) {
            // Update both flags to be consistent using the correct status values
            return { 
              ...task, 
              isCompleted: !completed,
              completed: !completed,
              status: !completed ? 'done' : 'todo'
            } as ExtendedTask; // Cast to ExtendedTask to satisfy TypeScript
          }
          return task;
        })
      );
      
      console.log(`Toggling task ${taskId} from ${completed ? 'completed' : 'incomplete'} to ${!completed ? 'completed' : 'incomplete'}`);
      
      // Immediately update completion count for better UX
      if (!completed) {
        setCompletedTaskCount(prev => prev + 1);
        success('Task completed!', 'Great job on completing this task!');
      } else {
        setCompletedTaskCount(prev => Math.max(0, prev - 1));
        info('Task reopened', 'Task has been marked as incomplete');
      }
      
      // Use relative paths with apiClient
      const endpoint = completed ? `/tasks/${taskId}/reopen` : `/tasks/${taskId}/complete`;
      const method = completed ? 'PATCH' : 'PATCH';
      
      const response = await apiClient({
        url: endpoint,
        method: method,
        data: {
          completed: !completed,
          status: !completed ? 'done' : 'todo'
        }
      });
      
      console.log('Task update response:', response.data);
      
      // Refresh all tasks to ensure our UI is in sync with server state
      setTimeout(() => {
        const loadTasks = async () => {
          try {
            const response = await apiClient.get('/tasks/all');
            const responseData = response.data;
            
            let taskData;
            if (responseData?.data && Array.isArray(responseData.data)) {
              taskData = responseData.data;
            } else if (Array.isArray(responseData)) {
              taskData = responseData;
            } else {
              taskData = [];
            }
            
            setTasks(taskData as ExtendedTask[]);
            
            // Recalculate completed count from fresh data
            const completedCount = taskData.filter((task: { status: string; completed: boolean; isCompleted: boolean; }) =>
              task.status === 'completed' || 
              task.status === 'done' || 
              task.completed === true || 
              task.isCompleted === true
            ).length;
            
            console.log('Updated completed tasks count:', completedCount);
            setCompletedTaskCount(completedCount);
          } catch (error) {
            console.error('Failed to refresh tasks:', error);
          }
        };
        
        loadTasks();
      }, 300);
      
    } catch (error) {
      console.error('Failed to update task status:', error);
      toastError('Failed to update task', 'Please try again later');
      
      // Revert optimistic update on failure
      setTasks(prevTasks => 
        prevTasks.map(task => 
          (task._id === taskId || task.id === taskId) ? 
            { ...task, completed, isCompleted: completed } as ExtendedTask : 
            task
        )
      );
      
      // Also revert the counter
      if (!completed) {
        setCompletedTaskCount(prev => Math.max(0, prev - 1));
      } else {
        setCompletedTaskCount(prev => prev + 1);
      }
    }
  };

  const {
    combinedFeed,
    fetchCombinedFeed,
    isLoading: loadingActivity,
    formatActivityText,
    getUserInitials,
    getUserDisplayName,
    getTimeAgo
  } = useActivityStore();

  // Load teams
  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      try {
        const response = await fetchTeams();

        if (response && typeof response === 'object') {
          if ('success' in response && response.success && 'data' in response) {
            if (Array.isArray(response.data)) {
              setTeams(response.data);
              setTeamsCount(response.data.length);
            } else {
              setTeams([]);
              setTeamsCount(0);
            }
          } else if (Array.isArray(response)) {
            setTeams(response);
            setTeamsCount(response.length);
          } else {
            setTeams([]);
            setTeamsCount(0);
          }
        } else {
          setTeams([]);
          setTeamsCount(0);
        }
      } catch (error) {
        console.error('Failed to load teams:', error);
        setError('Failed to load teams data. Please refresh the page.');
        setTeams([]);
        setTeamsCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  // Load boards
  useEffect(() => {
    const fetchBoards = async () => {
      setLoadingBoards(true);
      try {
        if (!user) {
          setBoards([]);
          setBoardsCount(0);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const { accessToken } = useAuthStore.getState();

        if (!accessToken) {
          setBoards([]);
          setBoardsCount(0);
          return;
        }

        // Set up the request with authentication
        const response = await fetch(`${apiUrl}/boards/complete`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch boards: ${response.status}`);
        }

        // Safely parse the response
        const result = await response.json();
        console.log('Raw board response from dashboard:', result); // Debug log

        // Handle different response formats
        let boardsData: any[] = [];

        if (Array.isArray(result)) {
          boardsData = result;
        } else if (result && result.success && Array.isArray(result.data)) {
          boardsData = result.data;
        } else if (result && result.boards && Array.isArray(result.boards)) {
          boardsData = result.boards;
        } else if (result && (result._id || result.id)) {
          // Handle single board object case
          boardsData = [result];
        } else {
          console.error('Unexpected response format:', result);
        }

        // Process the boards to ensure consistent properties
        const processedBoards: Board[] = boardsData.map(board => ({
          ...board,
          // Map id to _id for consistency with your components
          _id: board._id || board.id || Date.now().toString(),
          // Ensure title property exists
          title: board.title || board.name || 'Untitled Board',
          // Ensure other fields have defaults
          description: board.description || '',
          columns: Array.isArray(board.columns) ? board.columns : []
        }));

        console.log('Processed boards:', processedBoards);
        setBoards(processedBoards);
        setBoardsCount(processedBoards.length);
      } catch (error) {
        console.error('Error fetching boards:', error);
        setBoards([]);
        setBoardsCount(0);
      } finally {
        setLoadingBoards(false);
      }
    };

    fetchBoards();
  }, [user]);

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      setLoadingTasks(true);
      try {
        const response = await apiClient.get('/tasks/all');
        console.log('API Response for tasks:', response.data);
        
        let taskData;
        if (response.data?.data && Array.isArray(response.data.data)) {
          taskData = response.data.data;
        } else if (Array.isArray(response.data)) {
          taskData = response.data;
        } else {
          taskData = [];
        }

        // Make sure we have task data
        if (Array.isArray(taskData)) {
          // Cast the task data to ExtendedTask[]
          setTasks(taskData as ExtendedTask[]);

          // Calculate completed tasks - FIXED to correctly count
          const completedCount = taskData.filter(task =>
            task.status === 'completed' || 
            task.status === 'done' || 
            task.completed === true || 
            task.isCompleted === true
          ).length;

          console.log('Completed tasks count:', completedCount); // Log for debugging
          console.log('Total tasks count:', taskData.length);
          
          // Check each task's completion status to confirm
          taskData.forEach((task, index) => {
            console.log(`Task ${index + 1} - ${task.title}:`, {
              status: task.status,
              isCompleted: task.isCompleted,
              completed: task.completed
            });
          });

          setCompletedTaskCount(completedCount);
          setTotalTaskCount(taskData.length);

          // Calculate due today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const dueTodayCount = taskData.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
          }).length;

          setDueTodayCount(dueTodayCount);

          // Calculate overdue tasks
          const overdueCount = taskData.filter(task => {
            if (!task.dueDate) return false;
            if (task.status === 'completed' || task.status === 'done' || 
                task.completed === true || task.isCompleted === true) return false;
            
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            
            return dueDate < today;
          }).length;

          // Update other stats...
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
        setError('Failed to load tasks');
      } finally {
        setLoadingTasks(false);
      }
    };

    loadTasks();
  }, []);

  // Load activity
  useEffect(() => {
    const loadActivity = async () => {
      try {
        const result = await fetchCombinedFeed({ limit: 10 });

        if (result && result.length === 0) {
          console.log("No activities found with /api prefix - trying alternative endpoint");
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const { accessToken } = useAuthStore.getState();

          if (!accessToken) return;

          const response = await fetch(`${apiUrl}/activities/feed?limit=10`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              // Update the store manually
              useActivityStore.setState({
                combinedFeed: data.data,
                isLoading: false
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to load activities:', error);

        // If there's an error, set some mock data for display purposes
        const mockActivities = [
          {
            _id: 'mock-1',
            userName: user?.name || 'You',
            userId: user?._id || 'unknown',
            action: 'created task',
            targetName: 'Clean my room',
            timestamp: new Date().toISOString()
          },
          {
            _id: 'mock-2',
            userName: user?.name || 'You',
            userId: user?._id || 'unknown',
            action: 'updated board',
            targetName: 'GEMSPACE',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          }
        ];

        // Update the store with mock data
        useActivityStore.setState({
          combinedFeed: mockActivities,
          isLoading: false
        });
      }
    };

    loadActivity();
  }, [fetchCombinedFeed, user]);

  // Get user ID consistently
  const getUserId = (user: any): string | undefined => {
    if (!user) return undefined;
    return user._id || user.id;
  };

  // Filter teams the user owns
  const userOwnedTeams = teams.filter(team => {
    const userId = getUserId(user);
    if (!userId) return false;
    return team.owner === userId;
  });

  // Filter teams the user is a member of but doesn't own
  const userMemberTeams = teams.filter(team => {
    const userId = getUserId(user);
    if (!userId) return false;
    if (team.owner === userId) return false;

    if (Array.isArray(team.members)) {
      return team.members.some(member => {
        if (typeof member === 'string') {
          return member === userId;
        } else if (typeof member === 'object' && member !== null) {
          if (typeof member.user === 'string') {
            return member.user === userId;
          } else if (member.user && typeof member.user === 'object' && '_id' in member.user) {
            return member.user._id === userId;
          }
        }
        return false;
      });
    }
    return false;
  });

  // Get upcoming tasks (due in the next 7 days)
  const upcomingTasks = tasks
    .filter((task: ExtendedTask) => {
      if (!task.dueDate) return false;

      const dueDate = new Date(task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const inOneWeek = new Date(today);
      inOneWeek.setDate(inOneWeek.getDate() + 7);

      return dueDate >= today && dueDate <= inOneWeek;
    })
    .sort((a: ExtendedTask, b: ExtendedTask) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 3);

  // Get recent boards
  const recentBoards = boards
    .sort((a, b) => new Date(b.updatedAt || Date.now()).getTime() - new Date(a.updatedAt || Date.now()).getTime())
    .slice(0, 3);

  // Function to handle team deletion
  const handleDeleteTeam = async (teamId: string) => {
    if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      try {
        await deleteTeam(teamId);
        setTeams(teams.filter(team => team._id !== teamId));
        setTeamsCount(prev => prev - 1);
        success('Team deleted', 'Team has been successfully deleted');
      } catch (error) {
        console.error('Failed to delete team:', error);
        toastError('Failed to delete team', 'Please try again later');
      }
    }
  };

  // Filtered tasks function
  const filteredUpcomingTasks = useMemo(() => {
    return tasks
      .filter((task: ExtendedTask) => {
        // Check both completed and isCompleted fields
        const isTaskCompleted = task.completed || task.isCompleted;

        // Text search
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesTitle = task.title?.toLowerCase().includes(query);
          const matchesDescription = task.description?.toLowerCase().includes(query);
          
          if (!matchesTitle && !matchesDescription) {
            return false;
          }
        }
        
        // Tab filtering
        if (activeTaskTab === 'today') {
          if (!task.dueDate) return false;
          
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          return dueDate.toDateString() === today.toDateString();
        }
        
        if (activeTaskTab === 'upcoming') {
          if (!task.dueDate) return false;
          
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          
          return dueDate >= today && dueDate <= nextWeek;
        }
        
        if (activeTaskTab === 'overdue') {
          if (!task.dueDate) return false;
          if (isTaskCompleted) return false;
          
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          return dueDate < today;
        }
        
        if (activeTaskTab === 'completed') {
          return isTaskCompleted;
        }
        
        // Priority filtering
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
          return false;
        }
        
        // Due date filtering
        if (dueDateFilter !== 'all') {
          if (!task.dueDate) return false;
          
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (dueDateFilter === 'today') {
            return dueDate.toDateString() === today.toDateString();
          } else if (dueDateFilter === 'tomorrow') {
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return dueDate.toDateString() === tomorrow.toDateString();
          } else if (dueDateFilter === 'week') {
            const endOfWeek = new Date(today);
            endOfWeek.setDate(endOfWeek.getDate() + 7);
            return dueDate >= today && dueDate <= endOfWeek;
          } else if (dueDateFilter === 'month') {
            const endOfMonth = new Date(today);
            endOfMonth.setMonth(endOfMonth.getMonth() + 1);
            return dueDate >= today && dueDate <= endOfMonth;
          } else if (dueDateFilter === 'overdue') {
            return dueDate < today;
          }
        }
        
        // Completion status filtering
        if (completionFilter === 'completed' && !isTaskCompleted) {
          return false;
        }
        
        if (completionFilter === 'incomplete' && isTaskCompleted) {
          return false;
        }

        // If a task passes all filters, include it
        return true;
      })
      .sort((a: ExtendedTask, b: ExtendedTask) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [tasks, searchQuery, priorityFilter, dueDateFilter, completionFilter, activeTaskTab]);

  return (
    <div className="min-h-screen bg-black">        
      <motion.main 
        className="pt-6 pb-6 px-6 mx-auto space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
              <p className="text-white/70">
                Welcome back{user?.name ? `, ${user.name}` : ''}! Here&apos;s your project overview.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/tasks"
                className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-xl text-white bg-black border border-white/20 hover:border-white/40 hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                View All Tasks
              </Link>
              <Link
                href="/teams/create"
                className="inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Link>
            </div>
          </div>

          {/* Stats Overview */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.div 
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/20 backdrop-blur-sm"
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent" />
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {loading ? <div className="w-8 h-6 bg-black-700 animate-pulse rounded"></div> : teamsCount}
                    </div>
                    <div className="text-sm text-blue-200">Teams</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/teams" className="text-xs text-blue-300 hover:text-blue-200 flex items-center group transition-colors">
                    View teams
                    <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 border border-emerald-500/20 backdrop-blur-sm"
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent" />
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <Layers className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {loadingBoards ? <div className="w-8 h-6 bg-black-700 animate-pulse rounded"></div> : boardsCount}
                    </div>
                    <div className="text-sm text-emerald-200">Boards</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/boards" className="text-xs text-emerald-300 hover:text-emerald-200 flex items-center group transition-colors">
                    View boards
                    <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/20 backdrop-blur-sm"
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent" />
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <CheckSquare className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {loadingTasks ? <div className="w-12 h-6 bg-black-700 animate-pulse rounded"></div> : `${completedTaskCount}/${totalTaskCount}`}
                    </div>
                    <div className="text-sm text-purple-200">Completed</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/tasks" className="text-xs text-purple-300 hover:text-purple-200 flex items-center group transition-colors">
                    View tasks
                    <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600/20 to-amber-800/20 border border-amber-500/20 backdrop-blur-sm"
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/10 to-transparent" />
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-amber-500/20 rounded-xl">
                    <Clock className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {loadingTasks ? <div className="w-6 h-6 bg-black-700 animate-pulse rounded"></div> : dueTodayCount}
                    </div>
                    <div className="text-sm text-amber-200">Due Today</div>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href="/tasks?filter=today" className="text-xs text-amber-300 hover:text-amber-200 flex items-center group transition-colors">
                    View due tasks
                    <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Teams & Boards */}
            <div className="xl:col-span-2 space-y-6">
              {/* Your Teams Section */}
              <motion.div 
                className="bg-black-900/50 backdrop-blur-sm rounded-2xl border border-black-800 overflow-hidden"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="p-6 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Users className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">Your Teams</h2>
                        <p className="text-sm text-white/70">Manage and collaborate with your teams</p>
                      </div>
                    </div>
                    <Link
                      href="/teams"
                      className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      View all
                    </Link>
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <LoadingSpinner size="md" />
                  </div>
                ) : error ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-sm text-red-400">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="p-6">
                    <div className="space-y-4">
                      {teams.length > 0 && userOwnedTeams.length > 0 ? (
                        userOwnedTeams.slice(0, 3).map((team) => {
                          const avatarStyle = getTeamAvatarStyle(team.name);
                          return (
                            <div key={team._id} className="group relative">
                              <div className="flex items-center p-4 rounded-xl bg-black-800/50 hover:bg-black-800 transition-all duration-200">
                                <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${team.avatar ? '' : avatarStyle.darkBg} flex items-center justify-center overflow-hidden ${team.avatar ? '' : avatarStyle.darkText} font-semibold`}>
                                  {team.avatar ? (
                                    <img
                                      src={team.avatar}
                                      alt={team.name}
                                      className="h-full w-full object-cover"
                                    />
                                  ) : (
                                    team.name.substring(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div className="ml-4 flex-1">
                                  <h3 className="text-sm font-semibold text-white">{team.name}</h3>
                                  <div className="flex items-center mt-1 space-x-4">
                                    <div className="flex items-center text-xs text-white/70">
                                      <Users className="h-3.5 w-3.5 mr-1" />
                                      {team.members ? team.members.length : 0} members
                                    </div>
                                    <div className="flex items-center text-xs text-white/70">
                                      <Layers className="h-3.5 w-3.5 mr-1" />
                                      {boards.filter(board => board.teamId === team._id).length} boards
                                    </div>
                                  </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-2 transition-opacity">
                                  <Link
                                    href={`/teams/create?edit=true&id=${team._id}`}
                                    className="p-2 text-white/70 hover:text-white rounded-lg hover:bg-black/70"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      handleDeleteTeam(team._id);
                                    }}
                                    className="p-2 text-white/70 hover:text-red-400 rounded-lg hover:bg-black/70"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              <Link
                                href={`/teams/${team._id}`}
                                className="absolute inset-0 z-0"
                                aria-hidden="true"
                              />
                            </div>
                          );
                        })
                      ) : teams.length > 0 && userMemberTeams.length > 0 ? (
                        userMemberTeams.slice(0, 3).map((team) => (
                          <div key={team._id} className="group relative">
                            <div className="flex items-center p-4 rounded-xl bg-black-800/50 hover:bg-black-800 transition-all duration-200">
                              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-900/50 flex items-center justify-center text-blue-300 font-semibold">
                                {team.avatar ? (
                                  <img
                                    src={team.avatar}
                                    alt={team.name}
                                    className="h-full w-full object-cover rounded-xl"
                                  />
                                ) : (
                                  team.name.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="ml-4 flex-1">
                                <h3 className="text-sm font-semibold text-white">{team.name}</h3>
                                <div className="flex items-center mt-1 space-x-3">
                                  <span className="px-2 py-1 text-xs bg-blue-900/30 text-blue-300 rounded-full">Member</span>
                                  <div className="flex items-center text-xs text-white/70">
                                    <Users className="h-3.5 w-3.5 mr-1" />
                                    {team.members ? team.members.length : 0} members
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Link
                              href={`/teams/${team._id}`}
                              className="absolute inset-0 z-0"
                              aria-hidden="true"
                            />
                          </div>
                        ))
                      ) : teams.length > 0 ? (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto bg-black-800 rounded-full flex items-center justify-center mb-4">
                            <Users className="h-8 w-8 text-white/50" />
                          </div>
                          <p className="text-sm text-white/70">You don&apos;t manage any teams yet</p>
                          <p className="text-xs text-white/50 mt-1">Teams you create will appear here</p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto bg-black-800 rounded-full flex items-center justify-center mb-4">
                            <Users className="h-8 w-8 text-white/50" />
                          </div>
                          <p className="text-sm text-white/70">No teams found</p>
                          <p className="text-xs text-white/50 mt-1">Create your first team to get started</p>
                        </div>
                      )}

                      {(teams.length > 0 && (userOwnedTeams.length > 0 || userMemberTeams.length > 0)) && (
                        <div className="pt-4 border-t border-white/20">
                          <Link
                            href="/teams/create"
                            className="flex items-center justify-center py-3 px-4 border-2 border-dashed border-white/20 rounded-xl text-sm font-medium text-white/70 hover:border-indigo-500 hover:text-indigo-400 transition-colors group"
                          >
                            <Plus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                            Create New Team
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Recent Boards Section */}
              <motion.div 
                className="bg-black-900/50 backdrop-blur-sm rounded-2xl border border-black-800 overflow-hidden"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="p-6 border-b border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Layers className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">Recent Boards</h2>
                        <p className="text-sm text-white/70">Your most active project boards</p>
                      </div>
                    </div>
                    <Link
                      href="/boards"
                      className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      View all
                    </Link>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    {loadingBoards ? (
                      <div className="flex justify-center items-center py-12">
                        <LoadingSpinner size="md" />
                      </div>
                    ) : recentBoards.length > 0 ? (
                      recentBoards.map((board) => {
                        const teamName = teams.find(t => t._id === board.teamId)?.name || 'Personal';
                        const updatedTime = formatRelativeTime(new Date(board.updatedAt || Date.now()));
                        
                        return (
                          <div key={board._id} className="group relative">
                            <div className="flex items-center p-4 rounded-xl bg-black-800/50 hover:bg-black-800 transition-all duration-200">
                              <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${getBoardColor(board.title || 'Untitled')} flex items-center justify-center text-white font-semibold shadow-lg`}>
                                {(board.title || 'Untitled').substring(0, 1)}
                              </div>
                              <div className="ml-4 flex-1">
                                <h3 className="text-sm font-semibold text-white">{board.title || 'Untitled Board'}</h3>
                                <div className="flex items-center mt-1 space-x-4">
                                  <span className="text-xs text-white/70">{teamName}</span>
                                  <div className="flex items-center text-xs text-white/70">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {updatedTime}
                                  </div>
                                </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                              </div>
                            </div>
                            <Link
                              href={`/boards/${board._id}`}
                              className="absolute inset-0 z-0"
                              aria-hidden="true"
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto bg-black-800 rounded-full flex items-center justify-center mb-4">
                          <Layers className="h-8 w-8 text-white/50" />
                        </div>
                        <p className="text-sm text-white/70">No boards found</p>
                        <p className="text-xs text-white/50 mt-1">Create your first board to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Tasks & Activity */}
            <div className="space-y-6">
              {/* Tasks Overview */}
              <motion.div 
                className="bg-black-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="p-6 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">Tasks</h2>
                        <p className="text-sm text-white/70">
                          {!loadingTasks && filteredUpcomingTasks.length > 0 && (
                            <span>{filteredUpcomingTasks.length} upcoming tasks</span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-black-800 transition-colors"
                      >
                        <Filter className="h-4 w-4" />
                      </button>
                      <Link
                        href="/tasks"
                        className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        View all
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Task Tabs */}
                <div className="border-b border-white/20">
                  <div className="flex overflow-x-auto scrollbar-thin scrollbar-thumb-white/20">
                    <button
                      className={`px-4 py-3 text-sm font-medium transition-colors ${activeTaskTab === 'all' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/70 hover:text-white'}`}
                      onClick={() => setActiveTaskTab('all')}
                    >
                      All
                    </button>
                    <button
                      className={`px-4 py-3 text-sm font-medium transition-colors ${activeTaskTab === 'today' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/70 hover:text-white'}`}
                      onClick={() => setActiveTaskTab('today')}
                    >
                      Today
                    </button>
                    <button
                      className={`px-4 py-3 text-sm font-medium transition-colors ${activeTaskTab === 'upcoming' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/70 hover:text-white'}`}
                      onClick={() => setActiveTaskTab('upcoming')}
                    >
                      Upcoming
                    </button>
                    <button
                      className={`px-4 py-3 text-sm font-medium transition-colors ${activeTaskTab === 'overdue' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/70 hover:text-white'}`}
                      onClick={() => setActiveTaskTab('overdue')}
                    >
                      Overdue
                    </button>
                    <button
                      className={`px-4 py-3 text-sm font-medium transition-colors ${activeTaskTab === 'completed' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-white/70 hover:text-white'}`}
                      onClick={() => setActiveTaskTab('completed')}
                    >
                      Completed
                    </button>
                  </div>
                </div>

                {/* Task List */}
                <div className="p-6 max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {loadingTasks ? (
                      <div className="flex justify-center items-center py-12">
                        <LoadingSpinner size="md" />
                      </div>
                    ) : filteredUpcomingTasks.length > 0 ? (
                      filteredUpcomingTasks.slice(0, 6).map((task) => (
                        <div key={task._id} className="group relative">
                          <div className="flex items-center p-3 rounded-xl bg-black-800/50 hover:bg-black-800 transition-all duration-200">
                            <button
                              onClick={() => handleTaskCompletion(task._id || task.id || '', !!task.completed || !!task.isCompleted)}
                              className={`p-1.5 rounded-lg mr-3 transition-colors ${
                                task.completed || task.isCompleted
                                  ? 'text-green-500 bg-green-500/20' 
                                  : 'text-white/50 hover:text-white hover:bg-black-700'
                              }`}
                              aria-label={task.completed || task.isCompleted ? "Mark as incomplete" : "Mark as complete"}
                            >
                              {task.completed || task.isCompleted
                                ? <CheckSquare className="h-4 w-4" />
                                : <Square className="h-4 w-4" />
                              }
                            </button>
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-sm font-medium ${task.completed || task.isCompleted ? 'text-white/50 line-through' : 'text-white'}`}>
                                {task.title}
                              </h3>
                              <div className="flex items-center mt-1 space-x-3">
                                {task.dueDate && (
                                  <div className="flex items-center text-xs text-white/70">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Due {formatDueDate(task.dueDate)}
                                  </div>
                                )}
                                {task.priority && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${
                                    task.priority === 'high' || task.priority === 'critical' ? 'bg-red-900/50 text-red-300' :
                                    task.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                                    'bg-green-900/50 text-green-300'
                                  }`}>
                                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              {task.assignedTo ? (
                                <div className="w-8 h-8 rounded-lg bg-indigo-900/50 flex items-center justify-center text-indigo-300 font-medium text-xs">
                                  {task.assignedUser && task.assignedUser.name ?
                                    task.assignedUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() :
                                    'U'}
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-black-700/50 flex items-center justify-center text-white/70">
                                  <Users className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </div>
                          <Link
                            href={task.boardId ? `/boards/${task.boardId}` : '/tasks'}
                            className="absolute inset-0 z-0"
                            aria-hidden="true"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto bg-black-800 rounded-full flex items-center justify-center mb-4">
                          <Calendar className="h-8 w-8 text-white/50" />
                        </div>
                        <p className="text-sm text-white/70">No tasks match your filters</p>
                        <p className="text-xs text-white/50 mt-1">Try different filters or create a new task</p>
                      </div>
                    )}

                    {filteredUpcomingTasks.length > 6 && (
                      <div className="pt-4 border-t border-gray-800 text-center">
                        <Link
                          href="/tasks"
                          className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors group"
                        >
                          View {filteredUpcomingTasks.length - 6} more tasks
                          <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Activity Feed */}
              <motion.div 
                className="bg-black-900/50 backdrop-blur-sm rounded-2xl border border-black-800 overflow-hidden"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="p-6 border-b border-gray-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Activity className="h-5 w-5 text-orange-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">Activity Feed</h2>
                        <p className="text-sm text-white/70">Recent updates across your projects</p>
                      </div>
                    </div>
                    {!loadingActivity && combinedFeed.length > 0 && (
                      <span className="px-2 py-1 text-xs bg-orange-900/60 text-orange-300 rounded-full">
                        {combinedFeed.length}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {loadingActivity ? (
                    <div className="flex justify-center items-center py-12">
                      <LoadingSpinner size="md" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {combinedFeed.length > 0 ? (
                        combinedFeed.slice(0, 4).map((activity, idx) => (
                          <div key={activity._id || activity.id || idx} className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-900/50 flex items-center justify-center">
                              <span className="text-indigo-300 font-medium text-sm">
                                {getUserInitials(activity)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-medium text-white">
                                  {getUserDisplayName(activity, user?._id)}
                                </div>
                                <div className="text-xs text-white/50">
                                  {getTimeAgo(activity.timestamp || activity.createdAt)}
                                </div>
                              </div>
                              <div className="mt-1 text-sm text-white/70">
                                {formatActivityText(activity)}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 mx-auto bg-black-800 rounded-full flex items-center justify-center mb-4">
                            <Activity className="h-8 w-8 text-white/50" />
                          </div>
                          <p className="text-sm text-white/70">No recent activity</p>
                          <p className="text-xs text-gray-500 mt-1">Activity will appear here as you work</p>
                        </div>
                      )}

                      {combinedFeed.length > 4 && (
                        <div className="pt-4 border-t border-gray-800 text-center">
                          <Link
                            href="/notifications"
                            className="inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors group"
                          >
                            View more activity
                            <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.main>
      </div>
  );
};

export default DashboardPage;