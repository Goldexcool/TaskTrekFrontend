/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import AppLayout from '../components/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../components/ui/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import LoadingSpinner from '../components/LoadingSpinner';

// Icons
import { 
  CheckSquare, Square, Flag, AlertCircle, MoreHorizontal, 
  X, Plus, Search, Trash, Edit, Eye, Clock, 
  ArrowUpRight, LayoutDashboard, Calendar, Check,
  Clipboard, Filter
} from 'lucide-react';

// Store
import useAuthStore from '../store/useAuthStore';

// Types
interface TaskUser {
  id?: string;
  _id?: string;
  username?: string;
  name?: string;
  avatar?: string;
}

interface TaskColumn {
  id?: string;
  _id?: string;
  title?: string;
}

interface TaskBoard {
  id?: string;
  _id?: string;
  title?: string;
  backgroundColor?: string;
}

interface Task {
  id?: string;
  _id?: string;
  title?: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  completed?: boolean;
  status?: string;
  board?: TaskBoard;
  column?: TaskColumn;
  assignedTo?: TaskUser;
  createdBy?: TaskUser;
  labels?: string[];
  position?: number;
  createdAt?: string;
  updatedAt?: string;
  isOverdue?: boolean;
  team?: {
    id?: string;
    _id?: string;
    name?: string;
  };
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      duration: 0.4
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  }
};

// Priority to color mapping
const priorityColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
};

// Priority to icon mapping
const priorityIcons = {
  low: <Flag className="h-3 w-3" />,
  medium: <Flag className="h-3 w-3" />,
  high: <Flag className="h-3 w-3" />,
  critical: <AlertCircle className="h-3 w-3" />
};

// Loading fallback component
function TasksLoadingFallback() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="h-8 w-48 bg-gray-700 animate-pulse rounded-md"></div>
          <div className="h-10 w-32 bg-gray-700 animate-pulse rounded-md"></div>
        </div>
        <div className="mb-8 flex flex-col space-y-3">
          <div className="h-4 w-3/4 bg-gray-700 animate-pulse rounded-md"></div>
          <div className="h-4 w-1/2 bg-gray-700 animate-pulse rounded-md"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 flex flex-col space-y-2 animate-pulse">
              <div className="h-8 w-16 bg-gray-700 rounded-md"></div>
              <div className="h-4 w-24 bg-gray-700 rounded-md"></div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 flex justify-center">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-400">Loading your tasks...</span>
        </div>
      </div>
    </AppLayout>
  );
}

// Component that uses useSearchParams
function TasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, accessToken } = useAuthStore();
  
  // State for tasks data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [completionFilter, setCompletionFilter] = useState<string>('all');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('');
  const [selectedBoardFilter, setSelectedBoardFilter] = useState<string>('');
  const [assignedToMeFilter, setAssignedToMeFilter] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [viewMode, setViewMode] = useState<'list' | 'kanban' | 'calendar' | 'gantt'>('list');
  
  // State for task actions
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState<boolean>(false);
  
  // State for advanced features
  const [teams, setTeams] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  
  // Fetch tasks on mount
  useEffect(() => {
    fetchTasks();
    fetchTeamsAndBoards();
  }, []);

  // Apply URL parameters to filters on initial load
  useEffect(() => {
    if (searchParams) {
      const priority = searchParams.get('priority');
      if (priority && ['low', 'medium', 'high', 'critical', 'all'].includes(priority)) {
        setPriorityFilter(priority);
      }
      
      const dueDate = searchParams.get('dueDate');
      if (dueDate && ['today', 'week', 'month', 'overdue', 'all'].includes(dueDate)) {
        setDueDateFilter(dueDate);
      }
      
      const completed = searchParams.get('completed');
      if (completed === 'true' || completed === 'false') {
        setCompletionFilter(completed === 'true' ? 'completed' : 'incomplete');
      }
    }
  }, [searchParams]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!accessToken) {
        throw new Error('Authentication required');
      }
      
      // Build query parameters for filtering
      const queryParams = new URLSearchParams();
      
      if (priorityFilter !== 'all') {
        queryParams.append('priority', priorityFilter);
      }
      
      if (dueDateFilter !== 'all') {
        queryParams.append('dueDate', dueDateFilter);
      }
      
      if (completionFilter !== 'all') {
        queryParams.append('completed', completionFilter === 'completed' ? 'true' : 'false');
      }
      
      if (selectedTeamFilter) {
        queryParams.append('teamId', selectedTeamFilter);
      }
      
      if (selectedBoardFilter) {
        queryParams.append('boardId', selectedBoardFilter);
      }
      
      if (assignedToMeFilter && user?.id) {
        queryParams.append('assignedTo', user.id);
      }
      
      // Fetch tasks from the API
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const url = `${apiUrl}/tasks/all${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('Fetching tasks from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to load tasks: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('API Response:', responseData);
      
      if (responseData.success && Array.isArray(responseData.data)) {
        setTasks(responseData.data);
      } else if (Array.isArray(responseData)) {
        setTasks(responseData);
      } else {
        throw new Error('Unexpected API response format');
      }
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      setError(typeof error === 'string' ? error : error.message || 'Failed to load tasks');
      
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const fetchTeamsAndBoards = async () => {
    try {
      // Fetch teams data
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      if (!accessToken) {
        return;
      }
      
      const [teamsResponse, boardsResponse] = await Promise.all([
        fetch(`${apiUrl}/api/teams`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        }),
        fetch(`${apiUrl}/api/boards`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          }
        })
      ]);
      
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(Array.isArray(teamsData) ? teamsData : teamsData.data || []);
      }
      
      if (boardsResponse.ok) {
        const boardsData = await boardsResponse.json();
        setBoards(Array.isArray(boardsData) ? boardsData : boardsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching teams/boards data:', error);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleToggleTaskCompletion = async (taskId: string, completed: boolean, e?: React.MouseEvent) => {
    // Prevent event propagation if event is provided
    if (e) e.stopPropagation();
    
    try {
      // Optimistically update the UI
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, completed: !completed } : task
        )
      );
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      let endpoint;
      let method;
      
      if (completed) {
        // Reopening a completed task
        endpoint = `/api/tasks/${taskId}/reopen`;
        method = 'PUT';
      } else {
        // Completing a task
        endpoint = `/tasks/${taskId}/complete`;
        method = 'PATCH';
      }
      
      console.log(`Using ${method} request to endpoint: ${apiUrl}${endpoint}`);
      
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed: !completed,
          status: !completed ? 'completed' : 'in_progress' 
        })
      });
      
      // Check if response is not OK
      if (!response.ok) {
        // Revert changes if the API call fails
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, completed } : task
          )
        );
        
        // Get the error details from the response
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || `Error updating task: ${response.status}`;
        } catch (e) {
          errorMessage = `Error updating task: ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // If successful, show success toast
      toast({
        title: completed ? "Task Reopened" : "Task Completed",
        description: completed ? "Task has been marked as incomplete" : "Task has been marked as completed",
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error toggling task completion:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : error.message || 'Failed to update task status',
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }
    
    try {
      // Optimistically update UI
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      
      // Make API call to delete the task
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        // Restore the task in UI if deletion failed
        fetchTasks(); // Re-fetch all tasks
        
        // Get error message
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete task: ${response.status}`);
      }
      
      toast({
        title: "Success",
        description: "Task deleted successfully",
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : 'Failed to delete task',
        variant: "destructive"
      });
    }
  };
  
  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
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
        if (activeTab === 'today') {
          if (!task.dueDate) return false;
          
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          return dueDate.toDateString() === today.toDateString();
        }
        
        if (activeTab === 'upcoming') {
          if (!task.dueDate) return false;
          
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const nextWeek = new Date(today);
          nextWeek.setDate(today.getDate() + 7);
          
          return dueDate >= today && dueDate <= nextWeek;
        }
        
        if (activeTab === 'overdue') {
          if (!task.dueDate) return false;
          if (task.completed) return false;
          
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          return dueDate < today;
        }
        
        if (activeTab === 'completed') {
          return !!task.completed;
        }
        
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'dueDate':
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          
          case 'priority':
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            const aPriority = a.priority || 'low';
            const bPriority = b.priority || 'low';
            return (priorityOrder[aPriority as keyof typeof priorityOrder] || 4) - 
                   (priorityOrder[bPriority as keyof typeof priorityOrder] || 4);
            
          case 'title':
            return (a.title || '').localeCompare(b.title || '');
            
          case 'createdAt':
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

          default:
            return 0;
        }
      });
  }, [tasks, searchQuery, sortBy, activeTab]);
  
  // Group tasks by board
  const tasksByBoard = useMemo(() => {
    const groupedTasks: Record<string, { board: any, tasks: Task[] }> = {};
    
    filteredTasks.forEach(task => {
      if (!task.board?.id) return;
      
      const boardId = task.board.id;
      
      if (!groupedTasks[boardId]) {
        groupedTasks[boardId] = {
          board: task.board,
          tasks: []
        };
      }
      
      groupedTasks[boardId].tasks.push(task);
    });
    
    return Object.values(groupedTasks);
  }, [filteredTasks]);
  
  // Task stats
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const overdue = tasks.filter(task => !task.completed && task.isOverdue).length;
    const today = tasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      return dueDate.toDateString() === now.toDateString();
    }).length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, overdue, today, completionRate };
  }, [tasks]);
  
  // Format date for display
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    // Reset now to midnight for tomorrow comparison
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);
    
    const isTomorrow = date >= tomorrow && date <= tomorrowEnd;
    const isOverdue = date < now && !isToday;
    
    // Format the date based on how far it is
    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isOverdue) {
      return `Overdue: ${date.toLocaleDateString()}`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Check if a date is overdue
  const isOverdue = (dateString?: string): boolean => {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const now = new Date();
    
    return date < now && date.toDateString() !== now.toDateString();
  };
  
  // Loading view with improved visual experience
  if (loading) {
    return <TasksLoadingFallback />;
  }
  
  // Error view with retry
  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <div className="bg-red-900/20 p-4 rounded-full mb-4">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Failed to load tasks</h3>
          <p className="text-gray-400 text-center mb-6 max-w-md">{error}</p>
          <button 
            onClick={fetchTasks}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <CheckSquare className="h-8 w-8 mr-3 text-indigo-500" />
              My Tasks
            </h1>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-700/70 text-gray-300"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {showFilters ? (
                  <X className="h-4 w-4 ml-2" />
                ) : (
                  <Plus className="h-4 w-4 ml-2" />
                )}
              </button>
              
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center px-3 py-2 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-700/70 text-gray-300"
              >
                <svg className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24">
                  <path 
                    fill="currentColor" 
                    d="M17.65,6.35C16.2,4.9 14.21,4 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20C15.73,20 18.84,17.45 19.73,14H17.65C16.83,16.33 14.61,18 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6C13.66,6 15.14,6.69 16.22,7.78L13,11H20V4L17.65,6.35Z" 
                  />
                </svg>
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <Link
                href="/boards"
                className="flex items-center px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Link>
            </div>
          </div>
          
          <p className="mt-2 text-gray-400">
            Organize, track and complete tasks across all your projects
          </p>
          
          {/* Task Statistics */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 flex flex-col items-center shadow-sm"
            >
              <div className="text-3xl font-bold text-white mb-1">{taskStats.total}</div>
              <div className="text-sm text-gray-400 flex items-center">
                <CheckSquare className="h-4 w-4 mr-1.5" />
                Total Tasks
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 flex flex-col items-center shadow-sm"
            >
              <div className="flex items-center mb-1">
                <div className="text-3xl font-bold text-white">{taskStats.completionRate}</div>
                <div className="text-lg font-medium text-gray-500">%</div>
              </div>
              <div className="text-sm text-gray-400 flex items-center">
                <CheckSquare className="h-4 w-4 mr-1.5" />
                Completion Rate
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 flex flex-col items-center shadow-sm"
            >
              <div className="text-3xl font-bold text-green-400 mb-1">{taskStats.completed}</div>
              <div className="text-sm text-gray-400 flex items-center">
                <Check className="h-4 w-4 mr-1.5" />
                Completed
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 flex flex-col items-center shadow-sm"
            >
              <div className="text-3xl font-bold text-blue-400 mb-1">{taskStats.today}</div>
              <div className="text-sm text-gray-400 flex items-center">
                <Clock className="h-4 w-4 mr-1.5" />
                Due Today
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 flex flex-col items-center shadow-sm"
            >
              <div className="text-3xl font-bold text-red-400 mb-1">{taskStats.overdue}</div>
              <div className="text-sm text-gray-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1.5" />
                Overdue
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Tabs */}
        <div className="mb-6">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-5 mb-6 w-full bg-gray-800 border border-gray-700 rounded-xl p-1">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-indigo-600">
                <LayoutDashboard className="h-4 w-4 mr-2" />
                All Tasks
              </TabsTrigger>
              <TabsTrigger value="today" className="rounded-lg data-[state=active]:bg-indigo-600">
                <Clock className="h-4 w-4 mr-2" />
                Today
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:bg-indigo-600">
                <Calendar className="h-4 w-4 mr-2" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="overdue" className="rounded-lg data-[state=active]:bg-indigo-600">
                <AlertCircle className="h-4 w-4 mr-2" />
                Overdue
              </TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg data-[state=active]:bg-indigo-600">
                <Check className="h-4 w-4 mr-2" />
                Completed
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Filters and Controls */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gray-800 shadow-md rounded-xl border border-gray-700 p-5 mb-6">
                <div className="flex flex-col space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-400">Search</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input 
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Find tasks by name or description"
                          className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-400">Priority</label>
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      >
                        <option value="all">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-400">Due Date</label>
                      <select
                        value={dueDateFilter}
                        onChange={(e) => setDueDateFilter(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="tomorrow">Tomorrow</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="overdue">Overdue</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-400">Completion Status</label>
                      <select
                        value={completionFilter}
                        onChange={(e) => setCompletionFilter(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      >
                        <option value="all">All Statuses</option>
                        <option value="completed">Completed</option>
                        <option value="incomplete">Incomplete</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-400">Sort By</label>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      >
                        <option value="dueDate">Due Date</option>
                        <option value="priority">Priority</option>
                        <option value="title">Title</option>
                        <option value="createdAt">Creation Date</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block mb-2 text-sm font-medium text-gray-400">View Mode</label>
                      <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as 'list' | 'kanban' | 'calendar' | 'gantt')}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      >
                        <option value="list">List View</option>
                        <option value="kanban">Kanban View</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        checked={assignedToMeFilter}
                        onChange={() => setAssignedToMeFilter(!assignedToMeFilter)}
                        className="form-checkbox h-4 w-4 bg-gray-700 border-gray-600 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-400">Only tasks assigned to me</span>
                    </label>
                    
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setPriorityFilter('all');
                        setDueDateFilter('all');
                        setCompletionFilter('all');
                        setSortBy('dueDate');
                        setAssignedToMeFilter(false);
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg flex items-center transition-colors"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* No tasks state */}
        {filteredTasks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 shadow-md rounded-xl border border-gray-700 p-10 text-center"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6">
              <CheckSquare className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">
              {searchQuery || priorityFilter !== 'all' || dueDateFilter !== 'all' || 
              completionFilter !== 'all' || selectedTeamFilter || selectedBoardFilter || assignedToMeFilter
                ? 'No tasks match your filters' 
                : 'You don\'t have any tasks yet'}
            </h3>
            <p className="text-gray-400 max-w-md mx-auto mb-8">
              {searchQuery || priorityFilter !== 'all' || dueDateFilter !== 'all' || 
              completionFilter !== 'all' || selectedTeamFilter || selectedBoardFilter || assignedToMeFilter
                ? 'Try adjusting your search or filters to find what you\'re looking for.' 
                : 'Create your first task to start organizing your work.'}
            </p>
            
            <div className="flex justify-center space-x-4">
              {searchQuery || priorityFilter !== 'all' || dueDateFilter !== 'all' || 
              completionFilter !== 'all' || selectedTeamFilter || selectedBoardFilter ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPriorityFilter('all');
                    setDueDateFilter('all');
                    setCompletionFilter('all');
                    setSelectedTeamFilter('');
                    setSelectedBoardFilter('');
                    setAssignedToMeFilter(false);
                  }}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Clear Filters
                </button>
              ) : (
                <Link 
                  href="/boards"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create First Task
                </Link>
              )}
            </div>
          </motion.div>
        )}
        
        {/* List view */}
        {filteredTasks.length > 0 && viewMode === 'list' && (
          <motion.div
            className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-800/80">
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-10">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Task
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Priority
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Due Date
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Board
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th scope="col" className="relative px-3 py-3.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filteredTasks.map(task => (
                    <motion.tr 
                      key={task.id}
                      variants={itemVariants}
                      className={`hover:bg-gray-700 transition-colors ${
                        task.completed ? 'bg-gray-800/50' : ''
                      }`}
                    >
                      <td className="px-3 py-4 whitespace-nowrap">
                        <button
                          onClick={() => task.id && handleToggleTaskCompletion(task.id, !!task.completed)}
                          className={`p-1.5 rounded-md hover:bg-gray-700 ${
                            task.completed 
                              ? 'text-green-500' 
                              : 'text-gray-500 hover:text-white'
                          }`}
                          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                        >
                          {task.completed 
                            ? <CheckSquare className="h-5 w-5" />
                            : <Square className="h-5 w-5" />
                          }
                        </button>
                      </td>
                      <td className="px-3 py-4">
                        <div className={`flex flex-col ${task.completed ? 'line-through text-gray-500' : 'text-white'}`}>
                          <span className="font-medium">{task.title}</span>
                          {task.description && (
                            <span className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                              {task.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {task.priority && (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${priorityColors[task.priority]}`}>
                            {priorityIcons[task.priority]}
                            <span className="ml-1 capitalize">{task.priority}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`text-sm ${
                          isOverdue(task.dueDate) && !task.completed
                            ? 'text-red-400' 
                            : 'text-gray-300'
                        }`}>
                          {formatDate(task.dueDate)}
                        </span>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {task.board ? (
                          <span className="inline-flex items-center">
                            <span 
                              className="w-2 h-2 rounded-full mr-2" 
                              style={{ backgroundColor: task.board.backgroundColor || '#6366F1' }}
                            ></span>
                            <span className="text-sm text-gray-300">{task.board.title}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">No board</span>
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        {task.assignedTo ? (
                          <div className="flex items-center">
                            {task.assignedTo.avatar ? (
                              <img 
                                src={task.assignedTo.avatar} 
                                alt={task.assignedTo.name || ''} 
                                className="h-6 w-6 rounded-full mr-2"
                              />
                            ) : (
                              <div className="h-6 w-6 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300 text-xs font-medium mr-2">
                                {task.assignedTo.name?.substring(0, 1).toUpperCase() || 'U'}
                              </div>
                            )}
                            <span className="text-sm text-gray-300">{task.assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white">
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 bg-gray-800 border border-gray-700">
                            <DropdownMenuItem 
                              onClick={() => {
                                setSelectedTask(task);
                                setShowTaskDetails(true);
                              }}
                              className="hover:bg-gray-700 text-gray-300 hover:text-white cursor-pointer"
                            >
                              <Eye className="h-4 w-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => task.board?.id && router.push(`/boards/${task.board.id}?task=${task.id}`)}
                              className="hover:bg-gray-700 text-gray-300 hover:text-white cursor-pointer"
                            >
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => task.id && handleToggleTaskCompletion(task.id, !!task.completed)}
                              className="hover:bg-gray-700 text-gray-300 hover:text-white cursor-pointer"
                            >
                              {task.completed ? (
                                <>
                                  <Square className="h-4 w-4 mr-2" /> Mark Incomplete
                                </>
                              ) : (
                                <>
                                  <CheckSquare className="h-4 w-4 mr-2" /> Mark Complete
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => task.id && handleDeleteTask(task.id)}
                              className="hover:bg-red-900/50 text-red-400 hover:text-red-300 cursor-pointer"
                            >
                              <Trash className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
        
        {/* Kanban board view */}
        {filteredTasks.length > 0 && viewMode === 'kanban' && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {tasksByBoard.map(({ board, tasks }) => (
              <motion.div
                key={board.id}
                variants={itemVariants}
                className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow"
              >
                <div className="p-4 flex justify-between items-center" style={{ backgroundColor: board.backgroundColor || '#6366F1' }}>
                  <h3 className="font-medium text-white flex items-center">
                    <Clipboard className="h-4 w-4 mr-2" />
                    {board.title || 'Unknown Board'}
                  </h3>
                  <Link 
                    href={`/boards/${board.id}`}
                    className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="p-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                  {tasks.map(task => (
                    <motion.div
                      key={task.id}
                      variants={itemVariants}
                      className={`mb-3 p-3 rounded-lg border ${
                        task.completed
                          ? 'border-gray-700 bg-gray-700/30'
                          : 'border-gray-700 bg-gray-800/80'
                      } hover:shadow-md transition-all`}
                    >
                      <div className="flex items-start">
                        <button
                          onClick={(e) => task.id && handleToggleTaskCompletion(task.id, !!task.completed, e)}
                          className={`p-1 rounded-md mt-0.5 hover:bg-gray-700 ${
                            task.completed 
                              ? 'text-green-500' 
                              : 'text-gray-500 hover:text-white'
                          }`}
                          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
                        >
                          {task.completed 
                            ? <CheckSquare className="h-4 w-4" />
                            : <Square className="h-4 w-4" />
                          }
                        </button>
                        <div className="ml-2 flex-grow">
                          <div className="flex justify-between items-start">
                            <h4 
                              className={`text-sm font-medium ${
                                task.completed
                                  ? 'text-gray-400 line-through'
                                  : 'text-white'
                              }`}
                            >
                              {task.title}
                            </h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 rounded-md hover:bg-gray-700 text-gray-400 hover:text-white">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36 bg-gray-800 border border-gray-700">
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setShowTaskDetails(true);
                                  }}
                                  className="hover:bg-gray-700 text-gray-300 hover:text-white cursor-pointer"
                                >
                                  <Eye className="h-4 w-4 mr-2" /> View
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => task.board?.id && router.push(`/boards/${task.board.id}?task=${task.id}`)}
                                  className="hover:bg-gray-700 text-gray-300 hover:text-white cursor-pointer"
                                >
                                  <Edit className="h-4 w-4 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => task.id && handleToggleTaskCompletion(task.id, !!task.completed, e)}
                                  className="hover:bg-gray-700 text-gray-300 hover:text-white cursor-pointer"
                                >
                                  {task.completed ? (
                                    <>
                                      <Square className="h-4 w-4 mr-2" /> Mark Incomplete
                                    </>
                                  ) : (
                                    <>
                                      <CheckSquare className="h-4 w-4 mr-2" /> Mark Complete
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => task.id && handleDeleteTask(task.id)}
                                  className="hover:bg-red-900/50 text-red-400 hover:text-red-300 cursor-pointer"
                                >
                                  <Trash className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          {task.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="mt-2 flex justify-between items-center text-xs">
                            <div className="space-x-2">
                              {task.priority && (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs ${priorityColors[task.priority]}`}>
                                  {priorityIcons[task.priority]}
                                  <span className="ml-1 capitalize">{task.priority}</span>
                                </span>
                              )}
                              
                              {task.dueDate && (
                                <span className={`inline-flex items-center ${
                                  isOverdue(task.dueDate) && !task.completed
                                    ? 'text-red-400' 
                                    : 'text-gray-400'
                                }`}>
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDate(task.dueDate)}
                                </span>
                              )}
                            </div>
                            
                            {task.assignedTo && (
                              <div className="flex items-center text-gray-400">
                                {task.assignedTo.avatar ? (
                                  <img 
                                    src={task.assignedTo.avatar} 
                                    alt={task.assignedTo.name || ''} 
                                    className="h-4 w-4 rounded-full"
                                    title={task.assignedTo.name || ''}
                                  />
                                ) : (
                                  <div 
                                    className="h-4 w-4 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300 text-[10px] font-medium"
                                    title={task.assignedTo.name || ''}
                                  >
                                    {task.assignedTo.name?.substring(0, 1).toUpperCase() || 'U'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {task.labels && task.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {task.labels.slice(0, 3).map((label, idx) => (
                                <span 
                                  key={idx}
                                  className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-800/50"
                                >
                                  {label}
                                </span>
                              ))}
                              {task.labels.length > 3 && (
                                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-gray-700 text-gray-300">
                                  +{task.labels.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}

// The main page component wrapped with Suspense
export default function TasksPage() {
  return (
    <Suspense fallback={<TasksLoadingFallback />}>
      <TasksContent />
    </Suspense>
  );
}