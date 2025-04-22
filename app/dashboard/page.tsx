/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus, ArrowRight, Clock, Calendar, Star, AlertCircle,
  CheckSquare, MoreHorizontal, Users, Layers, Activity,
  PieChart, TrendingUp, FileText, Edit, Trash2
} from 'lucide-react';
import HeaderDash from '../components/HeaderDash';
import { fetchTeams, Team, deleteTeam } from '../store/teamService';
import { fetchUserBoards, Board } from '../store/boardService';
import { fetchUserTasks, Task } from '../store/useTaskStore';
import useAuthStore from '../store/useAuthStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'timeago.js';
import useActivityStore, { ActivityItem } from '../store/activityStore';

// API response interfaces
interface TeamApiResponse {
  success?: boolean;
  count?: number;
  data?: Team[];
}

// Extended Task interface with all required properties
interface ExtendedTask extends Task {
  completed?: boolean;
  assignedUser?: {
    _id?: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
  assignedTo?: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked';
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
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
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
    const loadBoards = async () => {
      setLoadingBoards(true);
      try {
        const boardData = await fetchUserBoards();
        setBoards(boardData);
        setBoardsCount(boardData.length);
      } catch (error) {
        console.error('Failed to load boards:', error);
        setBoards([]);
        setBoardsCount(0);
      } finally {
        setLoadingBoards(false);
      }
    };

    loadBoards();
  }, []);

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      setLoadingTasks(true);
      try {
        const taskData = await fetchUserTasks();

        console.log('Fetched tasks:', taskData); // Debug log

        // Make sure we have task data
        if (Array.isArray(taskData)) {
          // Cast the task data to ExtendedTask[]
          setTasks(taskData as ExtendedTask[]);

          // Calculate completed tasks - handle both status='completed' and completed=true formats
          const completed = taskData.filter(task =>
            task.status === 'completed' || (task as ExtendedTask).completed === true
          ).length;

          setCompletedTaskCount(completed);
          setTotalTaskCount(taskData.length);

          // Calculate due today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);

          const dueTodayTasks = taskData.filter((task: any) => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate.getTime() === today.getTime();
          });

          setDueTodayCount(dueTodayTasks.length);
        } else {
          // Handle if taskData is not an array
        }
      } catch (error) {
        // Error handling
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
        // First try with /api prefix
        const result = await fetchCombinedFeed({ limit: 10 });

        if (result && result.length === 0) {
          console.log("No activities found with /api prefix - trying alternative endpoint");
          // If that doesn't work, try without /api prefix by directly using fetch
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
      } catch (error) {
        console.error('Failed to delete team:', error);
        alert('Failed to delete team. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <HeaderDash />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-400">
              Welcome back{user?.name ? `, ${user.name}` : ''}! Here&apos;s what&apos;s happening with your projects.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Link
              href="/teams/create"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Team
            </Link>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-900/50 rounded-md p-3">
                  <Users className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Total Teams</dt>
                    <dd>
                      <div className="text-lg font-bold text-white">
                        {loading ? <span className="inline-block w-6 h-4 bg-gray-700 animate-pulse rounded"></span> : teamsCount}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link href="/teams" className="font-medium text-indigo-400 hover:text-indigo-300 flex items-center transition-colors">
                  View all teams
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-900/50 rounded-md p-3">
                  <Layers className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Active Boards</dt>
                    <dd>
                      <div className="text-lg font-bold text-white">
                        {loadingBoards ? <span className="inline-block w-6 h-4 bg-gray-700 animate-pulse rounded"></span> : boardsCount}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link href="/boards" className="font-medium text-green-400 hover:text-green-300 flex items-center transition-colors">
                  View all boards
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-900/50 rounded-md p-3">
                  <CheckSquare className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Tasks Completed</dt>
                    <dd>
                      <div className="text-lg font-bold text-white">
                        {loadingTasks ?
                          <span className="inline-block w-12 h-4 bg-gray-700 animate-pulse rounded"></span> :
                          `${completedTaskCount}/${totalTaskCount}`
                        }
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link href="/tasks" className="font-medium text-purple-400 hover:text-purple-300 flex items-center transition-colors">
                  View all tasks
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 overflow-hidden shadow rounded-lg border border-gray-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-900/50 rounded-md p-3">
                  <Clock className="h-6 w-6 text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">Due Today</dt>
                    <dd>
                      <div className="text-lg font-bold text-white">
                        {loadingTasks ?
                          <span className="inline-block w-6 h-4 bg-gray-700 animate-pulse rounded"></span> :
                          dueTodayCount
                        }
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-700 px-5 py-3">
              <div className="text-sm">
                <Link href="/tasks?filter=today" className="font-medium text-yellow-400 hover:text-yellow-300 flex items-center transition-colors">
                  View due tasks
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Column 1: Your Teams */}
          <div>
            <div className="bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-700">
              <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-medium text-white flex items-center">
                  <Users className="h-5 w-5 mr-2 text-gray-400" />
                  Your Teams
                </h2>
                <Link
                  href="/teams"
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View all
                </Link>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-10">
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
                <ul className="divide-y divide-gray-700">
                  {teams.length > 0 && userOwnedTeams.length > 0 ? (
                    // Display user's owned teams if any exist
                    userOwnedTeams.slice(0, 3).map((team) => {
                      const avatarStyle = getTeamAvatarStyle(team.name);

                      return (
                        <li key={team._id} className="px-6 py-5 relative group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${team.avatar ? '' : avatarStyle.darkBg} flex items-center justify-center overflow-hidden ${team.avatar ? '' : avatarStyle.darkText} font-medium`}>
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
                              <div className="ml-4">
                                <h3 className="text-sm font-medium text-white">{team.name}</h3>
                                <div className="flex items-center mt-1">
                                  <Users className="h-3.5 w-3.5 text-gray-500" />
                                  <span className="ml-1 text-xs text-gray-500">
                                    {team.members ? team.members.length : 0} members
                                  </span>
                                  <span className="mx-1.5 text-gray-500">•</span>
                                  <Layers className="h-3.5 w-3.5 text-gray-500" />
                                  <span className="ml-1 text-xs text-gray-500">
                                    {boards.filter(board => board.teamId === team._id).length} boards
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="relative">
                              <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                                <Link
                                  href={`/teams/create?edit=true&id=${team._id}`}
                                  className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"
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
                                  className="p-1.5 text-gray-400 hover:text-red-400 rounded-full hover:bg-gray-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <Link
                            href={`/teams/${team._id}`}
                            className="absolute inset-0 z-0"
                            aria-hidden="true"
                          />
                        </li>
                      );
                    })
                  ) : teams.length > 0 && userMemberTeams.length > 0 ? (
                    // If user doesn't own any teams but is a member of some, show those
                    userMemberTeams.slice(0, 3).map((team) => {
                      const avatarStyle = getTeamAvatarStyle(team.name);

                      return (
                        <li key={team._id} className="px-6 py-5 relative group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${team.avatar ? '' : 'bg-blue-900/50'} flex items-center justify-center overflow-hidden ${team.avatar ? '' : 'text-blue-300'} font-medium`}>
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
                              <div className="ml-4">
                                <h3 className="text-sm font-medium text-white">{team.name}</h3>
                                <div className="flex items-center mt-1">
                                  <span className="px-1.5 py-0.5 text-xs bg-blue-900/30 text-blue-300 rounded-full">Member</span>
                                  <span className="mx-1.5 text-gray-500">•</span>
                                  <Users className="h-3.5 w-3.5 text-gray-500" />
                                  <span className="ml-1 text-xs text-gray-500">
                                    {team.members ? team.members.length : 0} members
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <Link
                            href={`/teams/${team._id}`}
                            className="absolute inset-0 z-0"
                            aria-hidden="true"
                          />
                        </li>
                      );
                    })
                  ) : teams.length > 0 ? (
                    // If there are teams but the user doesn't own any, show a message
                    <li className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center mb-3">
                          <Users className="h-6 w-6 text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-400">You don&apos;t manage any teams yet</p>
                        <p className="mt-1 text-xs text-gray-500">Teams you create will appear here</p>
                      </div>
                    </li>
                  ) : (
                    // If no teams at all, show a message
                    <li className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center">
                        <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center mb-3">
                          <Users className="h-6 w-6 text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-400">No teams found</p>
                        <p className="mt-1 text-xs text-gray-500">Create your first team to get started</p>
                      </div>
                    </li>
                  )}

                  {/* Create team item */}
                  <li className="px-6 py-4">
                    <Link
                      href="/teams/create"
                      className="flex items-center justify-center py-3 border-2 border-dashed border-gray-700 rounded-lg text-sm font-medium text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Create New Team
                    </Link>
                  </li>
                </ul>
              )}
            </div>

            {/* Recent Boards */}
            <div className="mt-8 bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-700">
              <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-medium text-white flex items-center">
                  <Layers className="h-5 w-5 mr-2 text-gray-400" />
                  Recent Boards
                </h2>
                <Link
                  href="/boards"
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View all
                </Link>
              </div>

              <ul className="divide-y divide-gray-700">
                {loadingBoards ? (
                  <li className="flex justify-center items-center py-10">
                    <LoadingSpinner size="md" />
                  </li>
                ) : recentBoards.length > 0 ? (
                  recentBoards.map((board) => {
                    const color = getBoardColor(board.title || 'Untitled');
                    const teamName = teams.find(t => t._id === board.teamId)?.name || 'Personal';
                    const updatedTime = format(new Date(board.updatedAt || Date.now()));

                    return (
                      <li key={board._id} className="px-6 py-4 relative">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-md ${getBoardColor(board.title || 'Untitled')} flex items-center justify-center text-white font-medium`}>
                            {(board.title || 'Untitled').substring(0, 1)}
                          </div>
                          <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-white">{board.title || 'Untitled Board'}</h3>
                            <div className="flex items-center mt-0.5">
                              <span className="text-xs text-gray-500">{teamName}</span>
                              <span className="mx-1.5 text-gray-500">•</span>
                              <Clock className="h-3 w-3 text-gray-500" />
                              <span className="ml-1 text-xs text-gray-500">{updatedTime}</span>
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/boards/${board._id}`}
                          className="absolute inset-0 z-0"
                          aria-hidden="true"
                        />
                      </li>
                    );
                  })
                ) : (
                  <li className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center mb-3">
                        <Layers className="h-6 w-6 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-400">No boards found</p>
                      <p className="mt-1 text-xs text-gray-500">Create your first board to get started</p>
                    </div>
                  </li>
                )}


              </ul>
            </div>
          </div>

          {/* Column 2: Upcoming Tasks and Activity */}
          <div>
            {/* Upcoming Tasks */}
            <div className="bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-700">
              <div className="px-6 py-5 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-medium text-white flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                  Upcoming Tasks
                </h2>
                <Link
                  href="/tasks"
                  className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  View all
                </Link>
              </div>

              <ul className="divide-y divide-gray-700">
                {loadingTasks ? (
                  <li className="flex justify-center items-center py-10">
                    <LoadingSpinner size="md" />
                  </li>
                ) : upcomingTasks.length > 0 ? (
                  upcomingTasks.map((task) => (
                    <li key={task._id} className="px-6 py-4 relative">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className={`w-2 h-2 rounded-full ${task.priority === 'high' || task.priority === 'critical' ? 'bg-red-500' :
                              task.priority === 'medium' ? 'bg-yellow-500' :
                                'bg-green-500'
                            }`}></div>
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium text-white">{task.title}</h3>
                          <div className="flex items-center mt-0.5">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="ml-1 text-xs text-gray-500">
                              Due {formatDueDate(task.dueDate)}
                            </span>
                            <span className="mx-1.5 text-gray-500">•</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${task.priority === 'high' || task.priority === 'critical' ? 'bg-red-900/50 text-red-300' :
                                task.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                                  'bg-green-900/50 text-green-300'
                              }`}>
                              {task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Normal'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          {task.assignedTo ? (
                            <div className="h-8 w-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300 font-medium text-xs">
                              {task.assignedUser && task.assignedUser.name ?
                                task.assignedUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() :
                                'U'}
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-700/50 flex items-center justify-center text-gray-400 font-medium text-xs">
                              <Users className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </div>
                      <Link
                        href={`/boards/${task.boardId}`}
                        className="absolute inset-0 z-0"
                        aria-hidden="true"
                      />
                    </li>
                  ))
                ) : (
                  <li className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <div className="h-12 w-12 rounded-full bg-gray-700 flex items-center justify-center mb-3">
                        <Calendar className="h-6 w-6 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-400">No upcoming tasks</p>
                      <p className="mt-1 text-xs text-gray-500">Create a task with a due date to see it here</p>
                    </div>
                  </li>
                )}

                {/* Create task item */}
                {/* <li className="px-6 py-4">
                  <div className="flex items-center justify-center py-3 border-2 border-dashed border-gray-700 rounded-lg text-sm font-medium text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors cursor-pointer">
                    <Plus className="h-5 w-5 mr-2" />
                    Add New Task
                  </div>
                </li> */}
              </ul>
            </div>

            {/* Activity Feed */}
            <div className="mt-8 bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-700">
              <div className="px-6 py-5 border-b border-gray-700">
                <h2 className="text-lg font-medium text-white flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-gray-400" />
                  Activity Feed
                  {!loadingActivity && combinedFeed.length > 0 && (
                    <span className="ml-2 text-xs bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded-full">
                      {combinedFeed.length}
                    </span>
                  )}
                </h2>
              </div>

              {loadingActivity ? (
                <div className="flex justify-center items-center py-10">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <div className="flow-root px-6 py-5">
                  <ul className="-mb-8">
                    {combinedFeed.length > 0 ? (
                      combinedFeed.slice(0, 4).map((activity, idx) => (
                        <li key={activity._id || activity.id || idx}>
                          <div className="relative pb-8">
                            {/* Timeline connector */}
                            {idx !== combinedFeed.slice(0, 4).length - 1 && (
                              <span className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-700" aria-hidden="true" />
                            )}

                            <div className="relative flex space-x-3">
                              {/* Avatar */}
                              <div className="h-10 w-10 rounded-full bg-indigo-900/50 flex items-center justify-center ring-8 ring-gray-800">
                                <span className="text-indigo-300 font-medium">
                                  {getUserInitials(activity)}
                                </span>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div>
                                  <div className="text-sm font-medium text-white">
                                    {getUserDisplayName(activity, user?._id)}
                                  </div>
                                  <p className="mt-0.5 text-sm text-gray-500">
                                    {getTimeAgo(activity.timestamp || activity.createdAt)}
                                  </p>
                                </div>
                                <div className="mt-2 text-sm text-gray-400">
                                  <p>{formatActivityText(activity)}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="text-center py-8">
                        <p className="text-sm text-gray-400">No recent activity</p>
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {combinedFeed.length > 4 && (
                <div className="px-6 py-3 bg-gray-700 text-center">
                  <Link
                    href="/notifications"
                    className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    View more activity
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;