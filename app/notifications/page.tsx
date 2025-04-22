/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import {
  Bell, 
  Activity, 
  Filter, 
  CheckCircle, 
  Users, 
  Star, 
  Layers, 
  FileText, 
  MessageSquare,
  Trash2, 
  CheckSquare, 
  AlertTriangle, 
  Clock, 
  Calendar,
  UserPlus,
  Settings,
  X,
  ChevronDown,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import HeaderDash from '../components/HeaderDash';
import useAuthStore from '../store/useAuthStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { useRouter } from 'next/navigation';
import useActivityStore from '../store/activityStore';
import apiClient from '../utils/apiClient';

// Types
type NotificationCategory = 'all' | 'tasks' | 'teams' | 'boards' | 'mentions' | 'system';
type NotificationStatus = 'all' | 'unread' | 'read';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

// Enhanced activity interface to match API response
interface EnhancedActivity {
  _id: string;
  id?: string;
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  userName?: string;
  userId?: string;
  action?: string;
  taskId?: string;
  taskTitle?: string;
  targetName?: string;
  targetId?: string;
  targetType?: 'task' | 'board' | 'team' | 'comment' | 'column' | 'system';
  timestamp?: string;
  fromColumn?: string;
  toColumn?: string;
  boardId?: string;
  boardName?: string;
  columnId?: string;
  columnName?: string;
  teamId?: string;
  teamName?: string;
  createdAt: string;
  comment?: string;
  read?: boolean;
  priority?: 'normal' | 'high';
}

// Pagination interface from API
interface PaginationData {
  total: number;
  pages: number;
  currentPage: number;
  hasMore: boolean;
}

// API response interface
interface ActivityApiResponse {
  success: boolean;
  data: {
    activities: EnhancedActivity[];
    pagination?: PaginationData;
  };
}

// Safe wrapper for getUserInitials
const safeGetUserInitials = (notification: EnhancedActivity) => {
  try {
    // For system notifications, use "SYS"
    if (notification.targetType === 'system') {
      return "SYS";
    }
    
    // If notification has user object from API
    if (notification.user?.name) {
      const nameParts = notification.user.name.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      } else if (nameParts[0]) {
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    }
    
    // Check if notification has userName property
    if (notification.userName) {
      const nameParts = notification.userName.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      } else if (nameParts[0]) {
        return nameParts[0].substring(0, 2).toUpperCase();
      }
    }
    
    // If no userName but has userId
    if (notification.userId || notification.user?._id) {
      const id = notification.userId || notification.user?._id || '';
      return id.substring(0, 2).toUpperCase();
    }
    
    return "?";
  } catch (error) {
    console.error("Error getting user initials", error);
    return "?";
  }
};

// Safe wrapper for getUserDisplayName
const safeGetUserDisplayName = (notification: EnhancedActivity, currentUserId?: string) => {
  try {
    // First check if we have user data from the API
    if (notification.user?.name) {
      return notification.user._id === currentUserId ? "You" : notification.user.name;
    }
    
    // For system notifications, return "System"
    if (notification.targetType === 'system') {
      return "System";
    }
    
    // If we have a userName, use it
    if (notification.userName) {
      return notification.userName;
    }
    
    // Otherwise use the userId if available
    if (notification.userId) {
      return notification.userId === currentUserId ? "You" : `User ${notification.userId.substring(0, 6)}`;
    }
    
    // Last resort
    return "Unknown User";
  } catch (error) {
    console.error("Error getting user display name", error);
    return notification.userName || notification.user?.name || "Unknown User";
  }
};

// Safe wrapper for formatActivityText
const safeFormatActivityText = (notification: EnhancedActivity) => {
  try {
    // For system notifications, use a simple format
    if (notification.targetType === 'system') {
      return notification.action || "System notification";
    }
    
    // Format based on the action type and available data
    const action = notification.action || "performed an action";
    
    // Handle different activity types
    if (notification.taskTitle) {
      // Format task-related activities
      if (action === 'created') {
        return `created task "${notification.taskTitle}"`;
      } else if (action === 'updated') {
        return `updated task "${notification.taskTitle}"`;
      } else if (action === 'deleted') {
        return `deleted task "${notification.taskTitle}"`;
      } else if (action === 'moved') {
        return `moved task "${notification.taskTitle}" from ${notification.fromColumn} to ${notification.toColumn}`;
      } else if (action === 'completed') {
        return `completed task "${notification.taskTitle}"`;
      } else if (action === 'reopened') {
        return `reopened task "${notification.taskTitle}"`;
      } else if (action === 'commented') {
        return `commented on task "${notification.taskTitle}"${notification.comment ? ': ' + notification.comment : ''}`;
      }
    }
    
    // Board-related activities
    if (notification.boardName && !notification.taskTitle) {
      if (action === 'created') {
        return `created board "${notification.boardName}"`;
      } else if (action === 'updated') {
        return `updated board "${notification.boardName}"`;
      } else if (action === 'deleted') {
        return `deleted board "${notification.boardName}"`;
      }
    }
    
    // Team-related activities
    if (notification.teamName && !notification.boardName && !notification.taskTitle) {
      if (action === 'created') {
        return `created team "${notification.teamName}"`;
      } else if (action === 'updated') {
        return `updated team "${notification.teamName}"`;
      } else if (action === 'deleted') {
        return `deleted team "${notification.teamName}"`;
      } else if (action === 'joined') {
        return `joined team "${notification.teamName}"`;
      } else if (action === 'left') {
        return `left team "${notification.teamName}"`;
      } else if (action === 'added') {
        return `added a member to team "${notification.teamName}"`;
      } else if (action === 'removed') {
        return `removed a member from team "${notification.teamName}"`;
      }
    }
    
    // Simple formatting based on available data
    const target = notification.targetName || notification.taskTitle || notification.boardName || notification.teamName || "";
    const targetText = target ? `on "${target}"` : "";
    
    return `${action} ${targetText}`.trim();
  } catch (error) {
    console.error("Error formatting activity text", error);
    return notification.action || "Activity notification";
  }
};

// Helper function to format time in a readable format
const getTimeAgo = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) {
      return 'just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      // For longer periods, use date format
      return format(date, 'MMM d');
    }
  } catch (error) {
    console.error("Error formatting time:", error);
    return 'unknown time';
  }
};

// Determine target type based on activity
const determineTargetType = (activity: any): 'task' | 'board' | 'team' | 'comment' | 'column' | 'system' => {
  // Check for direct task reference
  if (activity.taskId || activity.taskTitle) {
    return 'task';
  }
  
  // Check for comment action
  if (activity.action === 'commented' || activity.comment) {
    return 'comment';
  }
  
  // Check for team-only actions
  if ((activity.teamId || activity.teamName) && !activity.boardId && !activity.boardName) {
    return 'team';
  }
  
  // Check for board-only actions
  if ((activity.boardId || activity.boardName) && !activity.taskId) {
    return 'board';
  }
  
  // Check for column actions
  if (activity.columnId || activity.columnName || activity.action === 'moved') {
    return 'column';
  }
  
  // For system notifications or anything that couldn't be identified
  return 'system';
};

const NotificationsPage: React.FC = () => {
  const router = useRouter();
  const { user, accessToken } = useAuthStore();
  const { combinedFeed } = useActivityStore();
  const [notifications, setNotifications] = useState<EnhancedActivity[]>([]);
  const [visibleNotifications, setVisibleNotifications] = useState<EnhancedActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<NotificationCategory>('all');
  const [statusFilter, setStatusFilter] = useState<NotificationStatus>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<EnhancedActivity | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  
  // Fetch parameters
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;
  
  // Virtual scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLLIElement>(null);
  
  // Define fetchActivities INSIDE the component
  const fetchActivities = async (page = 1, limit = PAGE_SIZE) => {
    try {
      setLoading(true);
      
      // Try directly using the endpoint that works
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/activities?limit=${limit}&page=${page}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          // Process activities
          const fetchedActivities = data.data.map((activity: any) => ({
            ...activity,
            targetType: determineTargetType(activity),
            read: Math.random() > 0.3, // Mock read status for now
            timestamp: activity.createdAt || activity.timestamp,
            // Map API response fields to our expected structure
            action: activity.actionType,
            userName: activity.user?.name,
            userId: activity.user?._id,
            taskTitle: activity.task?.title,
            taskId: activity.task?._id,
            boardName: activity.board?.title,
            boardId: activity.board?._id,
            targetName: activity.task?.title || activity.board?.title
          }));
          
          // Update activity store
          if (page === 1) {
            useActivityStore.setState({
              combinedFeed: data.data,
              isLoading: false
            });
          }
          
          // Update state with the fetched activities
          if (page === 1) {
            setNotifications(fetchedActivities);
          } else {
            setNotifications(prev => [...prev, ...fetchedActivities]);
          }
          
          // Update pagination info
          if (data.pagination) {
            setPagination(data.pagination);
            setHasMore(data.pagination.pages > data.pagination.page);
          } else {
            setHasMore(fetchedActivities.length === limit);
          }
          
          // Count unread
          const unreadActivities = fetchedActivities.filter((n: { read: any; }) => !n.read).length;
          setUnreadCount(unreadActivities);
          
          // Update visible notifications
          updateVisibleNotifications(
            page === 1 ? fetchedActivities : [...notifications, ...fetchedActivities],
            categoryFilter,
            statusFilter,
            timeFilter,
            searchQuery
          );
          
          return fetchedActivities;
        }
      }
      
      throw new Error("No data received from API");
      
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      
      // Use fallback data only for initial page
      if (page === 1) {
        const fallbackData = generateFallbackNotifications();
        setNotifications(fallbackData);
        updateVisibleNotifications(fallbackData, categoryFilter, statusFilter, timeFilter, searchQuery);
        setUnreadCount(fallbackData.filter(n => !n.read).length);
        setHasMore(false);
        return fallbackData;
      }
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Generate fallback notifications for demo
  const generateFallbackNotifications = (): EnhancedActivity[] => {
    return [
      {
        _id: '1',
        userName: 'System',
        userId: 'system',
        action: 'Welcome to TaskTrek',
        targetName: 'Welcome Message',
        targetType: 'system',
        createdAt: new Date().toISOString(),
        read: false,
        priority: 'high',
      },
      {
        _id: '2',
        userName: 'Jane Smith',
        userId: 'user123',
        action: 'mentioned you in a comment',
        taskTitle: 'Project Plan',
        taskId: 'task1',
        targetType: 'comment',
        createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        read: false,
        priority: 'high',
        comment: "Hey @you, could you review this?"
      },
      {
        _id: '3',
        userName: 'Mike Johnson',
        userId: 'user456',
        action: 'completed',
        taskTitle: 'Design Homepage',
        taskId: 'task2',
        targetType: 'task',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        read: true,
        priority: 'normal',
      },
      {
        _id: '4',
        userName: 'Sarah Lee',
        userId: 'user789',
        action: 'invited you to team',
        teamName: 'Marketing Team',
        teamId: 'team1',
        targetType: 'team',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        read: false,
        priority: 'high',
      },
      {
        _id: '5',
        userName: 'System',
        userId: 'system',
        action: 'New feature available',
        targetName: 'Calendar View',
        targetId: 'feature1',
        targetType: 'system',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        read: true,
        priority: 'normal',
      }
    ];
  };

  // Fetch notifications on initial load
  useEffect(() => {
    if (!accessToken) return;
    fetchActivities(1);
  }, [accessToken]);
  
  // Update visible notifications when filters change
  useEffect(() => {
    updateVisibleNotifications(notifications, categoryFilter, statusFilter, timeFilter, searchQuery);
  }, [categoryFilter, statusFilter, timeFilter, searchQuery, notifications]);
  
  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (loading || !hasMore) return;

    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5,
    };

    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading && !refreshing) {
        // Load more notifications when scrolled to the bottom
        loadMoreActivities();
      }
    }, options);
    
    if (lastItemRef.current) {
      observer.current.observe(lastItemRef.current);
    }
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [loading, hasMore, refreshing, lastItemRef.current]);

  // Load more activities for infinite scroll
  const loadMoreActivities = async () => {
    if (!hasMore || loading || refreshing) return;
    
    const nextPage = pagination?.currentPage ? pagination.currentPage + 1 : currentPage + 1;
    setCurrentPage(nextPage);
    
    const moreActivities = await fetchActivities(nextPage);
    updateVisibleNotifications([...notifications, ...moreActivities], categoryFilter, statusFilter, timeFilter, searchQuery);
  };

  // Filter notifications
  const updateVisibleNotifications = (
    allNotifications: EnhancedActivity[], 
    category: NotificationCategory,
    status: NotificationStatus,
    time: TimeFilter,
    query: string
  ) => {
    // Apply category filter
    let filtered = allNotifications;
    if (category !== 'all') {
      filtered = filtered.filter(n => {
        if (category === 'tasks') return n.targetType === 'task' || !!n.taskId;
        if (category === 'teams') return n.targetType === 'team' || (!!n.teamId && !n.boardId && !n.taskId);
        if (category === 'boards') return n.targetType === 'board' || (!!n.boardId && !n.taskId);
        if (category === 'mentions') return n.action?.includes('mention') || n.comment?.includes('@');
        if (category === 'system') return n.targetType === 'system';
        return true;
      });
    }
    
    // Apply status filter
    if (status !== 'all') {
      filtered = filtered.filter(n => status === 'read' ? n.read : !n.read);
    }
    
    // Apply time filter
    if (time !== 'all') {
      filtered = filtered.filter(n => {
        const date = new Date(n.timestamp || n.createdAt);
        if (time === 'today') return isToday(date);
        if (time === 'week') return isThisWeek(date);
        if (time === 'month') return isThisMonth(date);
        return true;
      });
    }
    
    // Apply search query
    if (query.trim()) {
      const lowercaseQuery = query.toLowerCase();
      filtered = filtered.filter(n => 
        n.taskTitle?.toLowerCase().includes(lowercaseQuery) ||
        n.teamName?.toLowerCase().includes(lowercaseQuery) ||
        n.boardName?.toLowerCase().includes(lowercaseQuery) ||
        n.user?.name?.toLowerCase().includes(lowercaseQuery) ||
        n.userName?.toLowerCase().includes(lowercaseQuery) ||
        n.action?.toLowerCase().includes(lowercaseQuery) ||
        safeFormatActivityText(n).toLowerCase().includes(lowercaseQuery)
      );
    }
    
    setVisibleNotifications(filtered);
  };
  
  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setCurrentPage(1);
      await fetchActivities(1);
    } catch (error) {
      console.error("Failed to refresh notifications:", error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Mark notification as read
  const markAsRead = (id: string) => {
    // In a real implementation, you'd make an API call to update the read status
    // For now, we'll just update it locally
    
    const updatedNotifications = notifications.map(n => {
      if (n._id === id) {
        return { ...n, read: true };
      }
      return n;
    });
    
    setNotifications(updatedNotifications);
    updateVisibleNotifications(updatedNotifications, categoryFilter, statusFilter, timeFilter, searchQuery);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  // Mark all as read
  const markAllAsRead = () => {
    // In a real implementation, you'd make an API call to update all read statuses
    // For now, we'll just update them locally
    
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    updateVisibleNotifications(updatedNotifications, categoryFilter, statusFilter, timeFilter, searchQuery);
    setUnreadCount(0);
  };
  
  // Notification icon based on type
  const getNotificationIcon = (notification: EnhancedActivity) => {
    // Check action first for more specific icons
    if (notification.action) {
      if (notification.action.includes('complete')) return <CheckSquare className="h-5 w-5 text-emerald-400" />;
      if (notification.action.includes('comment')) return <MessageSquare className="h-5 w-5 text-teal-400" />;
      if (notification.action.includes('invite') || notification.action.includes('add')) return <UserPlus className="h-5 w-5 text-purple-400" />;
    }
    
    // Then check target type
    switch (notification.targetType) {
      case 'task':
        return <Clock className="h-5 w-5 text-indigo-400" />;
      case 'team':
        return <Users className="h-5 w-5 text-blue-400" />;
      case 'board':
        return <Layers className="h-5 w-5 text-amber-400" />;
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-teal-400" />;
      case 'column':
        return <FileText className="h-5 w-5 text-violet-400" />;
      case 'system':
        return <Bell className="h-5 w-5 text-rose-400" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };
  
  // Group notifications by date
  const groupNotificationsByDate = (notifications: EnhancedActivity[]) => {
    const groups: { [key: string]: EnhancedActivity[] } = {};
    
    notifications.forEach(notification => {
      const date = new Date(notification.timestamp || notification.createdAt);
      let groupKey: string;
      
      if (isToday(date)) {
        groupKey = 'Today';
      } else if (isYesterday(date)) {
        groupKey = 'Yesterday';
      } else if (isThisWeek(date)) {
        groupKey = 'This Week';
      } else if (isThisMonth(date)) {
        groupKey = 'This Month';
      } else {
        groupKey = 'Older';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      
      groups[groupKey].push(notification);
    });
    
    return groups;
  };
  
  // Get navigation path based on notification type
  const getNavigationPath = (notification: EnhancedActivity): string => {
    // Use direct IDs from the API response format when possible
    if (notification.taskId) {
      return `/tasks?id=${notification.taskId}`;
    }
    
    if (notification.boardId) {
      return `/boards/${notification.boardId}`;
    }
    
    if (notification.teamId) {
      return `/teams/${notification.teamId}`;
    }
    
    // Fallback to the older format
    switch (notification.targetType) {
      case 'task':
        return `/tasks?id=${notification.targetId}`;
      case 'team':
        return `/teams/${notification.targetId}`;
      case 'board':
        return `/boards/${notification.targetId}`;
      case 'comment':
        // Assuming comments are attached to tasks
        return `/tasks?id=${notification.targetId || notification.taskId}`;
      default:
        return '/dashboard';
    }
  };
  
  // Notification detail view
  const NotificationDetail = ({ notification }: { notification: EnhancedActivity }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      onClick={() => setSelectedActivity(null)}
    >
      <div 
        className="w-full max-w-lg bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="border-b border-gray-700 p-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-3 p-2 rounded-lg bg-gray-700">
              {getNotificationIcon(notification)}
            </div>
            <h3 className="text-lg font-medium text-white">
              Notification Details
            </h3>
          </div>
          <button onClick={() => setSelectedActivity(null)} className="p-1 hover:bg-gray-700 rounded-full">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300 font-medium">
              {safeGetUserInitials(notification)}
            </div>
            <div className="ml-4 flex-1">
              <p className="text-white font-medium">
                {safeGetUserDisplayName(notification, user?._id)}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                {safeFormatActivityText(notification)}
              </p>
              
              <div className="mt-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600/50">
                <div className="flex items-center text-sm text-gray-300">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  {new Date(notification.timestamp || notification.createdAt).toLocaleString()}
                </div>
                
                {(notification.targetType === 'task' || notification.taskId) && (
                  <div className="mt-2 flex items-center text-sm text-gray-300">
                    <CheckSquare className="h-4 w-4 mr-2 text-gray-500" />
                    Related to task: {notification.taskTitle || notification.targetName}
                  </div>
                )}
                
                {(notification.targetType === 'team' || (notification.teamId && !notification.boardId && !notification.taskId)) && (
                  <div className="mt-2 flex items-center text-sm text-gray-300">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    Related to team: {notification.teamName || notification.targetName}
                  </div>
                )}
                
                {(notification.targetType === 'board' || (notification.boardId && !notification.taskId)) && (
                  <div className="mt-2 flex items-center text-sm text-gray-300">
                    <Layers className="h-4 w-4 mr-2 text-gray-500" />
                    Related to board: {notification.boardName || notification.targetName}
                  </div>
                )}
                
                {notification.comment && (
                  <div className="mt-2 text-sm text-gray-300 p-2 bg-gray-800 rounded border border-gray-600">
                    <MessageSquare className="h-4 w-4 mr-2 text-gray-500 inline-block" />
                    <span className="italic">&quot;{notification.comment}&quot;</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            {notification.targetType !== 'system' && (
              <button
                onClick={() => {
                  // Navigate to the relevant page based on notification type
                  router.push(getNavigationPath(notification));
                  setSelectedActivity(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-700 text-white rounded-lg shadow-lg text-sm font-medium"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-indigo-950">
      <HeaderDash />
      
      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-indigo-900/50 rounded-xl flex items-center justify-center mr-4 border border-indigo-800/50 shadow-lg">
              <Bell className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Notifications</h1>
              <p className="text-gray-400 text-sm mt-1">Stay updated on activities and mentions</p>
            </div>
          </div>
          
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={handleRefresh}
              className="flex items-center px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 text-sm font-medium transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin text-indigo-400' : 'text-gray-500'}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            
            <button 
              onClick={markAllAsRead}
              className="flex items-center px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 text-sm font-medium transition-colors"
              disabled={unreadCount === 0}
            >
              <CheckCircle className="h-4 w-4 mr-2 text-gray-500" />
              Mark all as read
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-xl p-4 mb-6 border border-gray-700/50 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="relative w-full sm:max-w-xs">
              <input 
                type="text" 
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 pl-10 pr-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 text-sm transition-colors"
              >
                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                Filters
                <ChevronDown className={`ml-2 h-4 w-4 text-gray-500 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-400">Status:</span>
                <div className="relative inline-block">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as NotificationStatus)}
                    className="bg-gray-700 border border-gray-600 rounded-lg py-1.5 px-3 pr-8 text-sm text-white appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All</option>
                    <option value="unread">Unread</option>
                    <option value="read">Read</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Filter by category</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setCategoryFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          categoryFilter === 'all' 
                            ? 'bg-indigo-900/70 text-indigo-300 border border-indigo-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setCategoryFilter('tasks')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          categoryFilter === 'tasks' 
                            ? 'bg-blue-900/70 text-blue-300 border border-blue-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        Tasks
                      </button>
                      <button
                        onClick={() => setCategoryFilter('teams')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          categoryFilter === 'teams' 
                            ? 'bg-purple-900/70 text-purple-300 border border-purple-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        Teams
                      </button>
                      <button
                        onClick={() => setCategoryFilter('boards')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          categoryFilter === 'boards' 
                            ? 'bg-amber-900/70 text-amber-300 border border-amber-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        Boards
                      </button>
                      <button
                        onClick={() => setCategoryFilter('mentions')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          categoryFilter === 'mentions' 
                            ? 'bg-emerald-900/70 text-emerald-300 border border-emerald-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        Mentions
                      </button>
                      <button
                        onClick={() => setCategoryFilter('system')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          categoryFilter === 'system' 
                            ? 'bg-rose-900/70 text-rose-300 border border-rose-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        System
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">Filter by time</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setTimeFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          timeFilter === 'all' 
                            ? 'bg-indigo-900/70 text-indigo-300 border border-indigo-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        All Time
                      </button>
                      <button
                        onClick={() => setTimeFilter('today')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          timeFilter === 'today' 
                            ? 'bg-teal-900/70 text-teal-300 border border-teal-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        Today
                      </button>
                      <button
                        onClick={() => setTimeFilter('week')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          timeFilter === 'week' 
                            ? 'bg-cyan-900/70 text-cyan-300 border border-cyan-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        This Week
                      </button>
                      <button
                        onClick={() => setTimeFilter('month')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          timeFilter === 'month' 
                            ? 'bg-violet-900/70 text-violet-300 border border-violet-700'
                            : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700'
                        }`}
                      >
                        This Month
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Notifications List */}
        <div className="space-y-8">
          {loading ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-16 flex flex-col items-center justify-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-400">Loading notifications...</p>
            </div>
          ) : visibleNotifications.length === 0 ? (
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-16 flex flex-col items-center justify-center">
              <div className="h-16 w-16 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No notifications found</h3>
              <p className="text-gray-400 text-center max-w-md">
                {searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || timeFilter !== 'all' ? 
                  'Try adjusting your filters to see more results.' : 
                  'You\'re all caught up! New notifications will appear here.'}
              </p>
              
              {(searchQuery || categoryFilter !== 'all' || statusFilter !== 'all' || timeFilter !== 'all') && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setStatusFilter('all');
                    setTimeFilter('all');
                  }}
                  className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Stats bar */}
              <div className="bg-gray-800/60 backdrop-blur-sm px-4 py-3 rounded-lg border border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  {statusFilter === 'all' ? (
                    <>Showing <span className="text-white font-medium">{visibleNotifications.length}</span> notifications</>
                  ) : statusFilter === 'unread' ? (
                    <>Showing <span className="text-white font-medium">{visibleNotifications.length}</span> unread notifications</>
                  ) : (
                    <>Showing <span className="text-white font-medium">{visibleNotifications.length}</span> read notifications</>
                  )}
                </div>
                
                <div className="flex items-center text-sm">
                  <div className="flex items-center mr-4">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 mr-2"></div>
                    <span className="text-gray-400">Unread: <span className="text-white font-medium">{unreadCount}</span></span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-2 w-2 rounded-full bg-gray-500 mr-2"></div>
                    <span className="text-gray-400">Read: <span className="text-white font-medium">{notifications.length - unreadCount}</span></span>
                  </div>
                </div>
              </div>
              
              {/* Group notifications by date */}
              {Object.entries(groupNotificationsByDate(visibleNotifications)).map(([dateGroup, groupNotifications]) => (
                <div key={dateGroup} className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-400 px-2">{dateGroup}</h3>
                  <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-700 overflow-hidden">
                    <ul className="divide-y divide-gray-700">
                      {groupNotifications.map((notification, index) => {
                        // Check if this is the last notification to observe
                        const isLastElement = index === groupNotifications.length - 1 && 
                                           visibleNotifications[visibleNotifications.length - 1]._id === notification._id;
                        
                        return (
                          <motion.li
                            key={notification._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`relative group ${!notification.read ? 'bg-indigo-900/10' : ''}`}
                            ref={isLastElement ? lastItemRef : null}
                          >
                            <div
                              className="p-4 flex items-start cursor-pointer hover:bg-gray-700/30 transition-colors"
                              onClick={() => {
                                if (!notification.read) {
                                  markAsRead(notification._id);
                                }
                                setSelectedActivity(notification);
                              }}
                            >
                              {!notification.read && (
                                <div className="absolute top-4 left-4 h-2 w-2 rounded-full bg-indigo-500"></div>
                              )}
                              
                              <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center mr-4 ${
                                notification.priority === 'high' ? 'bg-rose-900/50 text-rose-300' : 'bg-indigo-900/50 text-indigo-300'
                              }`}>
                                {safeGetUserInitials(notification)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <p className="text-sm font-medium text-white">
                                    {safeGetUserDisplayName(notification, user?._id)}
                                  </p>
                                  <div className="ml-2 flex items-center">
                                    <span className="text-xs text-gray-500">
                                      {getTimeAgo(notification.timestamp || notification.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mt-1 flex items-center">
                                  <div className="mr-2">
                                    {getNotificationIcon(notification)}
                                  </div>
                                  <p className="text-sm text-gray-300">
                                    {safeFormatActivityText(notification)}
                                  </p>
                                </div>
                                
                                {(notification.targetName || notification.taskTitle || notification.teamName || notification.boardName) && (
                                  <div className="mt-1.5 flex items-center">
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                                      {notification.taskTitle || notification.teamName || notification.boardName || notification.targetName}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="ml-4 flex-shrink-0">
                                <div className="opacity-0 group-hover:opacity-100 flex transition-opacity">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification._id);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 transition-colors"
                                  >
                                    {notification.read ? (
                                      <Eye className="h-4 w-4" />
                                    ) : (
                                      <EyeOff className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ))}
              
              {/* Loading indicator for infinite scroll */}
              {hasMore && (
                <div className="flex justify-center py-5">
                  <LoadingSpinner size="md" />
                </div>
              )}
            </>
          )}
        </div>
      </main>
      
      {/* Notification detail modal */}
      <AnimatePresence>
        {selectedActivity && <NotificationDetail notification={selectedActivity} />}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPage;