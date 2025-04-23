/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useCallback, useRef, ReactNode, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import Draggable, { DraggableEventHandler } from 'react-draggable';

// Services & Hooks
import { fetchBoardById, createColumn, fetchColumnsByBoard, createTask, updateTask, deleteColumn } from '@/app/store/boardService';
import { Column, Task, Board } from '@/app/store/boardService';
import { useToast } from '@/app/hooks/useToast';
import useAuthStore from '@/app/store/useAuthStore';
import useTaskStore, { TaskState } from '@/app/store/useTaskStore';
import { shallow } from 'zustand/shallow';
import api from '../../utils/apiClient';

// Components
import AppLayout from '../../components/AppLayout';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Switch } from '@/app/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import TaskDetailsModal from '@/app/components/TaskDetailsModal';
import {
  Sheet, 
  SheetContent, 
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/app/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

// DnD utilities
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  UniqueIdentifier,
  closestCorners,
  pointerWithin,
  getFirstCollision,
  MeasuringStrategy,
  DropAnimation,
  defaultDropAnimation,
  MouseSensor,
  CollisionDetection,
  DroppableContainer
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Icons
import {
  Plus, 
  MoreHorizontal, 
  Clock,
  Users, 
  Tag, 
  AlertCircle, 
  Search,
  Filter as FilterIcon, 
  SortAsc, 
  Star, 
  Edit, 
  Trash2, 
  ChevronDown,
  X, 
  ArrowLeft, 
  Calendar, 
  User, 
  Flag,
  BarChart2,
  Settings,
  Share2,
  Zap,
  Info,
  HelpCircle,
  Clipboard,
  ChevronRight,
  Grid,
  List,
  MessageSquare,
  EyeOff,
  Eye,
  LayoutGrid,
  Database,
  LineChart,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Download,
  CloudSnow,
  CircleOff,
  Bookmark,
  Check,
  Sparkles,
  MenuSquare,
  PanelLeft,
  PanelRight,
  Maximize,
  Minimize,
  Moon,
  Sun,
  Palette,
  Activity,
  BarChart,
  Wifi,
  Shield,
  PlusCircle,
  Save,
  ChevronsUp,
  ChevronsDown,
  BellOff,
  Bell,
  Mail
} from 'lucide-react';

// CSS modules and styles

// Task Priority Configuration with advanced styling
const priorityConfig = {
  low: {
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    icon: <Flag size={12} className="mr-1 text-blue-600 dark:text-blue-400" />,
    border: 'border-blue-200 dark:border-blue-800',
    glow: 'shadow-blue-500/20',
    badgeColor: 'bg-gradient-to-r from-blue-500/80 to-blue-600/80'
  },
  medium: {
    color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    icon: <Flag size={12} className="mr-1 text-green-600 dark:text-green-400" />,
    border: 'border-green-200 dark:border-green-800',
    glow: 'shadow-green-500/20',
    badgeColor: 'bg-gradient-to-r from-green-500/80 to-green-600/80'
  },
  high: {
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    icon: <Flag size={12} className="mr-1 text-orange-600 dark:text-orange-400" />,
    border: 'border-orange-200 dark:border-orange-800',
    glow: 'shadow-orange-500/20',
    badgeColor: 'bg-gradient-to-r from-orange-500/80 to-orange-600/80'
  },
  critical: {
    color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    icon: <Flag size={12} className="mr-1 text-red-600 dark:text-red-400" />,
    border: 'border-red-200 dark:border-red-800',
    glow: 'shadow-red-500/30',
    badgeColor: 'bg-gradient-to-r from-red-500/80 to-red-600/80'
  }
};

// Animation variants
const pageTransition = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.5 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3 }
  }
};

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

const scaleAnimation = {
  tap: { scale: 0.98 },
  hover: { scale: 1.02 }
};

// Task labels for categorization
const taskLabels = [
  { name: 'Feature', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30', icon: <Zap size={12} className="mr-1" /> },
  { name: 'Bug', color: 'bg-red-100 text-red-800 dark:bg-red-900/30', icon: <AlertCircle size={12} className="mr-1" /> },
  { name: 'Documentation', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30', icon: <Clipboard size={12} className="mr-1" /> },
  { name: 'Design', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30', icon: <Palette size={12} className="mr-1" /> },
  { name: 'Research', color: 'bg-green-100 text-green-800 dark:bg-green-900/30', icon: <Search size={12} className="mr-1" /> },
  { name: 'Testing', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30', icon: <CheckCircle size={12} className="mr-1" /> }
];

// View modes for board display
enum BoardViewMode {
  Cards = 'cards',
  List = 'list',
  Timeline = 'timeline',
  Calendar = 'calendar'
}

// Different filter options
interface FilterOptions {
  priority: string[];
  labels: string[];
  assignedToMe: boolean;
  showCompleted: boolean;
  dueDate: 'today' | 'this-week' | 'this-month' | 'overdue' | 'all';
}

// Status types
type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';

// Update or extend the Task interface
interface ExtendedTask extends Task {
  assignedAt?: string;
}

interface BoardPageTask extends Omit<Task, 'status'> {
  _id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked';
  completed?: boolean; // Add this field to handle both types of completion indicators
  boardId: string;
  column: string;
  position: number;
  dueDate?: string;
  assignedTo?: string;
  labels?: string[];
}

// User avatar component for task assignment
const UserAvatarSelectionMenu: React.FC<{
  onSelectUser: (userId: string) => void;
  currentUserId?: string;
  teamMembers: any[];
}> = ({ onSelectUser, currentUserId, teamMembers }) => {
  return (
    <div className="p-2 w-56">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
        Assign to:
      </h3>
      
      <div className="space-y-1">
        {teamMembers.map(member => (
          <button
            key={member._id || member.user._id}
            className={`w-full flex items-center px-2 py-1.5 rounded-md text-sm ${
              (currentUserId === member._id || currentUserId === member.user?._id) 
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => onSelectUser(member._id || member.user._id)}
          >
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={member.avatar || member.user?.avatar} />
              <AvatarFallback className="text-xs">
                {(member.name || member.user?.name || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            {member.name || member.user?.name || 'Unknown User'}
          </button>
        ))}

        {teamMembers.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-2 px-2">
            No team members available
          </p>
        )}
        
        {/* Option to remove assignment */}
        {currentUserId && (
          <button
            className="w-full flex items-center px-2 py-1.5 rounded-md text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 mt-2"
            onClick={() => onSelectUser('')}
          >
            <CircleOff className="h-4 w-4 mr-2" />
            Remove assignment
          </button>
        )}
      </div>
    </div>
  );
};

// Task Priority Menu for changing priority
const TaskPriorityMenu: React.FC<{
  onSelectPriority: (priority: string) => void;
  currentPriority: string;
}> = ({ onSelectPriority, currentPriority }) => {
  const priorities = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' }
  ];
  
  return (
    <div className="p-2 w-48">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
        Set priority:
      </h3>
      
      <div className="space-y-1">
        {priorities.map(priority => {
          const config = priorityConfig[priority.value as keyof typeof priorityConfig];
          
          return (
            <button
              key={priority.value}
              className={`w-full flex items-center px-2 py-1.5 rounded-md text-sm ${
                currentPriority === priority.value
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => onSelectPriority(priority.value)}
            >
              <span className={`mr-2 px-1.5 py-0.5 rounded text-xs flex items-center ${config.color}`}>
                {config.icon} {priority.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Column Selection Menu for manually moving tasks
const ColumnSelectionMenu: React.FC<{
  columns: Column[];
  currentColumnId: string;
  onSelectColumn: (columnId: string) => void;
}> = ({ columns, currentColumnId, onSelectColumn }) => {
  return (
    <div className="p-2 w-56">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-2">
        Move to column:
      </h3>
      
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {columns.map(column => (
          <button
            key={column._id}
            className={`w-full flex items-center px-2 py-1.5 rounded-md text-sm ${
              currentColumnId === column._id
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => onSelectColumn(column._id)}
          >
            {column.title}
          </button>
        ))}
      </div>
    </div>
  );
};

// Enhanced drag and drop functionality with context-aware indicators
const BoardPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, accessToken } = useAuthStore();
  const boardId = params?.id as string;
  
  // State hooks for board data
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  
  // Create a memoized selector function that only changes when its dependencies change
  const taskSelector = useMemo(
    () => (state: TaskState) => ({
      tasks: state.tasks,
      fetchTasksByColumn: state.fetchTasksByColumn,
      addTask: state.addTask,
      updateTask: state.updateTask,
      deleteTask: state.deleteTask,
      moveTask: state.moveTask,
    }),
    [] // No dependencies, so this selector will be created only once
  );
  
  // Use the selector without shallow
  const tasks = useTaskStore((state) => state.tasks);
  const fetchTasksByColumn = useTaskStore((state) => state.fetchTasksByColumn);
  const addTaskToStore = useTaskStore((state) => state.addTask);
  const updateTaskInStore = useTaskStore((state) => state.updateTask);
  const deleteTaskInStore = useTaskStore((state) => state.deleteTask);
  const moveTaskInStore = useTaskStore((state) => state.moveTask);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dataFetched, setDataFetched] = useState<boolean>(false);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showMembersSheet, setShowMembersSheet] = useState<boolean>(false);
  const [membersTab, setMembersTab] = useState<'active'>('active');
  const [showTeamSheet, setShowTeamSheet] = useState(false);

  // UI state hooks
  const [viewMode, setViewMode] = useState<BoardViewMode>(BoardViewMode.Cards);
  const [showSidebar, setShowSidebar] = useState<boolean>(true);
  const [sidebarTab, setSidebarTab] = useState<'info' | 'activity' | 'members'>('info');
  const [isStarred, setIsStarred] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [showCompletedTasks, setShowCompletedTasks] = useState<boolean>(true);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    priority: [],
    labels: [],
    assignedToMe: false,
    showCompleted: true,
    dueDate: 'all'
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const [editMode, setEditMode] = useState<boolean>(false);

  // Modals state
  const [showCreateColumn, setShowCreateColumn] = useState<boolean>(false);
  const [showTaskDetails, setShowTaskDetails] = useState<boolean>(false);
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [showBoardSettings, setShowBoardSettings] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // DnD state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  
  // Refs
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const activityLogRef = useRef<HTMLDivElement>(null);

  // Stats and analytics
  const [boardStats, setBoardStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    tasksByPriority: {} as Record<string, number>,
    recentActivity: [] as any[],
    memberActivity: {} as Record<string, number>,
  });
  
  // Add these variables to track owner/admin status
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Add a distance constraint to prevent drag from triggering on slight movements
      activationConstraint: {
        distance: 10, // Must move 10px before drag starts
      },
    }),
    useSensor(PointerSensor, {
      // Customized for touch devices
      activationConstraint: {
        distance: 10, // Must move 10px before drag starts
        tolerance: 5, // Allow some wiggle room
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Add collision detection with improved algorithm
  const collisionDetectionStrategy: CollisionDetection = useCallback((args) => {
    // First, detect any collisions with the pointer
    const pointerCollisions = pointerWithin(args);
    
    if (pointerCollisions.length > 0) {
      // Return the most relevant intersection
      const closestCollisions = closestCorners(args);
      return closestCollisions.length > 0 ? [closestCollisions[0]] : [];
    }
    
    // If no pointer collisions, use closest center
    return closestCenter(args);
  }, []);

  // Helper function to get team ID
  const getTeamId = (board: any): string => {
    if (!board) return '';
    
    if (!board.team) return '';
    
    if (typeof board.team === 'string') {
      return board.team;
    }
    
    if (typeof board.team === 'object') {
      return board.team?._id || board.team?.id || '';
    }
    
    return '';
  };

  // Add this function to check if current user is owner or admin of the team
  const checkUserPermissions = useCallback(() => {
    if (!user || !board || !board.team) return;
    
    const teamId = typeof board.team === 'string' ? board.team : board.team._id;
    
    if (!teamId) return;
    
    // Try to fetch team details to check permissions
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    fetch(`${apiUrl}/teams/${teamId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
      .then(response => response.json())
      .then(data => {
        const teamData = data.data || data;
        
        // Check if user is owner
        const ownerId = typeof teamData.owner === 'string' ? teamData.owner : teamData.owner?._id;
        setIsOwner(user._id === ownerId);
        
        // Check if user is admin
        const userMember = teamData.members?.find((member: any) => {
          const memberId = typeof member.user === 'string' ? member.user : member.user?._id;
          return user._id === memberId;
        });
        
        setIsAdmin(userMember?.role === 'admin' || user._id === ownerId);
      })
      .catch(error => {
        console.error('Error checking user permissions:', error);
      });
  }, [user, board, accessToken]);

  // Fetch board data
  const fetchBoardData = useCallback(async () => {
    // Exit early if board ID is undefined or invalid
    if (!boardId || boardId === 'undefined') {
      setError("Invalid board ID");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);

      // Fetch board details
      const boardData = await fetchBoardById(boardId);
      setBoard(boardData);
      setIsStarred(boardData.isStarred || false);

      // Fetch columns for the board
      try {
        const columnsData = await fetchColumnsByBoard(boardId);
        
        if (Array.isArray(columnsData)) {
          // Sort columns by position
          const sortedColumns = [...columnsData].sort((a, b) => a.position - b.position);
          setColumns(sortedColumns);
          
          // Create a new tasks object to populate
          let totalTasks = 0;
          let completedTasks = 0;
          const tasksByPriority: Record<string, number> = {
            low: 0,
            medium: 0, 
            high: 0,
            critical: 0
          };
          
          // For each column, fetch its tasks
          const columnPromises = sortedColumns.map(async (column) => {
            try {
              // Use the task store to fetch tasks for this column
              const columnTasks = await fetchTasksByColumn(column._id);
              
              // Update stats
              totalTasks += columnTasks.length;
              completedTasks += (columnTasks as any[]).filter(task => task.status !== undefined && task.status === 'completed').length;
              
              // Count by priority
                (columnTasks as any[]).forEach(task => {
                const priority: keyof typeof tasksByPriority = (task.priority as keyof typeof tasksByPriority) || 'medium';
                tasksByPriority[priority] = (tasksByPriority[priority] || 0) + 1;
                });
              
              return { columnId: column._id, tasks: columnTasks };
            } catch (error) {
              console.error(`Error fetching tasks for column ${column._id}:`, error);
              return { columnId: column._id, tasks: [] };
            }
          });
          
          // Wait for all column tasks to be fetched
          await Promise.all(columnPromises);
          
          // Update board stats
          setBoardStats(prev => ({
            ...prev,
            totalTasks,
            completedTasks,
            tasksByPriority
          }));
        } else {
          setColumns([]);
        }
      } catch (columnError) {
        console.log('No columns found or error fetching columns:', columnError);
        setColumns([]);
      }
      
      setDataFetched(true);
      
      // Generate mock activity data or fetch real activity
      const mockActivity = generateMockActivity(10);
      setBoardStats(prev => ({
        ...prev,
        recentActivity: mockActivity
      }));
      
    } catch (error: any) {
      console.error('Error loading board:', error);
      setError(typeof error === 'string' ? error : 'Failed to load board data');
      
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : 'Failed to load board data',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [boardId, fetchTasksByColumn, toast]);

  // Generate mock activity data
  const generateMockActivity = (count: number) => {
    const activities = [];
    const activityTypes = [
      'created a task',
      'completed a task',
      'moved a task',
      'commented on a task',
      'added a label',
      'changed priority',
      'set a due date',
      'assigned a task',
      'created a column'
    ];
    
    const names = ['Alex Johnson', 'Taylor Smith', 'Jordan Lee', 'Casey Wilson', 'Morgan Zhang'];
    
    for (let i = 0; i < count; i++) {
      const date = new Date();
      date.setMinutes(date.getMinutes() - i * Math.floor(Math.random() * 300));
      
      activities.push({
        id: `activity-${i}`,
        userName: names[Math.floor(Math.random() * names.length)],
        action: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        taskName: `Task ${Math.floor(Math.random() * 100) + 1}`,
        timestamp: date.toISOString(),
      });
    }
    
    return activities;
  };

  // Fetch team members
  const fetchTeamMembers = async () => {
    try {
      if (!board) return;
      
      const teamId = getTeamId(board);
      if (!teamId) return;
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/teams/${teamId}/members`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team members: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setTeamMembers(data.data);
      } else if (Array.isArray(data)) {
        setTeamMembers(data);
      } else {
        console.warn('Unexpected team members response format:', data);
        setTeamMembers([]);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  // Create column handler
  const handleCreateColumn = async (title: string) => {
    if (!title.trim()) return;

    try {
      // Calculate position (add to the end)
      const position = columns.length + 1;

      const newColumn = await createColumn({
        title,
        boardId,
        position
      });

      // Add new column to the columns list
      setColumns([...columns, newColumn]);

      toast({
        title: "Success",
        description: "Column created successfully",
        variant: "success"
      });

      // Close modal
      setShowCreateColumn(false);
      
      // Update activity
      const newActivity = {
        id: `activity-${Date.now()}`,
        userName: user?.name || 'You',
        action: 'created a column',
        taskName: title,
        timestamp: new Date().toISOString(),
      };
      
      setBoardStats(prev => ({
        ...prev,
        recentActivity: [newActivity, ...prev.recentActivity]
      }));
      
    } catch (error: any) {
      console.error('Error creating column:', error);

      toast({
        title: "Error",
        description: typeof error === 'string' ? error : 'Failed to create column',
        variant: "destructive"
      });
    }
  };

  // Updated handleAddTask function to correctly adapt types
  const handleAddTask = async (columnId: string, title: string, priority: string = 'medium', description: string = '', dueDate?: string) => {
    if (!title.trim()) return;

    try {
      const columnTasks = tasks[columnId] || [];
      const position = columnTasks.length + 1;

      // Create task using the board service
      const newTask = await createTask({
        title,
        columnId,
        position,
        description,
        priority: priority as 'low' | 'medium' | 'high' | 'critical',
        dueDate
      });

      // Create a properly typed task object with all required fields
      const adaptedTask: BoardPageTask = {
        ...newTask,
        _id: newTask._id,
        boardId: boardId, // Add boardId from params
        column: columnId, // Ensure column is set
        position: position,
        // Set proper status if not coming from API
        status: newTask.status || 'pending'
      };

      // Add the adapted task to the store
      addTaskToStore(adaptedTask as any); // Use type assertion since we know our object is compatible
      
      // Update stats
      setBoardStats(prev => ({
        ...prev,
        totalTasks: prev.totalTasks + 1,
        tasksByPriority: {
          ...prev.tasksByPriority,
          [priority]: (prev.tasksByPriority[priority] || 0) + 1
        },
        recentActivity: [
          {
            id: `activity-${Date.now()}`,
            userName: user?.name || 'You',
            action: 'created a task',
            taskName: title,
            timestamp: new Date().toISOString(),
          },
          ...prev.recentActivity
        ]
      }));

      toast({
        title: "Success",
        description: "Task created successfully",
        variant: "success"
      });

      // Clear active column
      setActiveColumn(null);
      
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : 'Failed to create task',
        variant: "destructive"
      });
    }
  };

  // Fix handleToggleTaskCompletion to properly check current status before making API calls
  const handleToggleTaskCompletion = async (columnId: string, taskId: string, isCompleted: boolean) => {
    try {
      // Find the task that's being updated
      const columnTasks = tasks[columnId] || [];
      const taskToUpdate = (columnTasks as any[]).find(task => task._id === taskId);
      
      if (!taskToUpdate) return;
      
      // Check if task is already in the desired state to avoid unnecessary API calls
      if ((taskToUpdate.status === 'completed' || taskToUpdate.completed === true) && isCompleted) {
        toast({
          title: "Info",
          description: "This task is already completed",
          variant: "default"
        });
        return;
      }
  
      if ((taskToUpdate.status !== 'completed' && !taskToUpdate.completed) && !isCompleted) {
        toast({
          title: "Info",
          description: "This task is already open",
          variant: "default"
        });
        return;
      }
      
      // Show immediate feedback
      toast({
        title: isCompleted ? "Marking task complete..." : "Reopening task...",
        variant: "loading",
      });
      
      const newStatus: TaskStatus = isCompleted ? 'completed' : 'pending';
      
      // Update the task in the store first (optimistic update)
      updateTaskInStore(taskId, { 
        status: newStatus,
        completed: isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : undefined
      } as any);
      
      // Update board stats for completion status
      setBoardStats(prev => ({
        ...prev,
        completedTasks: isCompleted 
          ? prev.completedTasks + 1 
          : Math.max(0, prev.completedTasks - 1),
        recentActivity: [
          {
            id: `activity-${Date.now()}`,
            userName: user?.name || 'You',
            action: isCompleted ? 'completed a task' : 'reopened a task',
            taskName: taskToUpdate.title,
            timestamp: new Date().toISOString(),
          },
          ...prev.recentActivity
        ]
      }));
      
      // Use the proper API endpoint based on the desired state
      const endpoint = isCompleted ? 'complete' : 'reopen';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${apiUrl}/tasks/${taskId}/${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          boardId: boardId,
          columnId: columnId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If the first API call fails, try using the PUT endpoint to update the task directly
        console.log("Using fallback task update method");
        
        const updateResponse = await fetch(`${apiUrl}/tasks/${taskId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            status: newStatus,
            completed: isCompleted,
            boardId: boardId,
            columnId: columnId
          })
        });
        
        if (!updateResponse.ok) {
          throw new Error(`Failed to ${isCompleted ? 'complete' : 'reopen'} task`);
        }
      }
      
      // Show success message
      toast({
        title: isCompleted ? "Task completed" : "Task reopened",
        variant: isCompleted ? "success" : "default"
      });
      
    } catch (error: any) {
      console.error('Error updating task completion:', error);
      toast({
        title: "Error",
        description: error.message || `Failed to ${isCompleted ? 'complete' : 'reopen'} task`,
        variant: "destructive"
      });
      
      // Revert the optimistic update
      updateTaskInStore(taskId, { 
        status: !isCompleted ? 'completed' : 'pending',
        completed: !isCompleted
      } as any);
      
      // On error, refresh the column data to ensure UI consistency
      fetchTasksByColumn(columnId);
    }
  };

  // Fix the handleDeleteTask function API endpoint
  const handleDeleteTask = async (columnId: string, taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      // If the task details modal is open, close it
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask(null);
        setShowTaskDetails(false);
      }
      
      // Find the task to keep a reference for activity log
      const columnTasks = tasks[columnId] || [];
      const taskToDelete = (columnTasks as any[]).find(task => task._id === taskId);
      
      // Delete the task via the API first to ensure it succeeds
      // Fix API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete task');
      }
      
      // Then update the local state
      deleteTaskInStore(columnId, taskId);
      
      toast({
        title: "Success",
        description: "Task deleted successfully",
        variant: "success"
      });
      
      // Add to activity log
      if (taskToDelete) {
        setBoardStats(prev => ({
          ...prev,
          totalTasks: prev.totalTasks - 1,
          completedTasks: taskToDelete.status === 'completed' ? prev.completedTasks - 1 : prev.completedTasks,
          recentActivity: [
            {
              id: `activity-${Date.now()}`,
              userName: user?.name || 'You',
              action: 'deleted a task',
              taskName: taskToDelete.title || 'Unknown task',
              timestamp: new Date().toISOString(),
            },
            ...prev.recentActivity
          ]
        }));
      }
      
    } catch (error: any) {
      console.error('Error deleting task:', error);
      
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : 'Failed to delete task',
        variant: "destructive"
      });
    }
  };

  // Function to handle task assignment using the specific API endpoint
  const handleAssignTask = async (taskId: string, userId: string | null) => {
    try {
      // Find the current assignment state
      let currentlyAssigned = null;
      Object.values(tasks).forEach((columnTasks: any[]) => {
        const task = columnTasks.find(t => t._id === taskId);
        if (task) {
          currentlyAssigned = task.assignedTo;
        }
      });
      
      // If task is already in the desired state, don't make the API call
      if (currentlyAssigned === userId) {
        return; // Already in the requested state
      }
      
      // Show loading toast
      toast({
        title: userId ? "Assigning task..." : "Removing assignment...",
        variant: "loading"
      });
      
      let response;
      
      if (userId) {
        // Use axios for the assign endpoint
        response = await api.patch(`/tasks/${taskId}/assign`, { userId });
      } else {
        // Use axios for the unassign endpoint
        response = await api.patch(`/tasks/${taskId}/unassign`);
      }
      
      // Update local state (no need to check response.ok with axios)
      const data = response.data;
      
      // Find which column this task belongs to
      let sourceColumnId = null;
      Object.entries(tasks).forEach(([colId, colTasks]) => {
        if ((colTasks as any[]).some(t => t._id === taskId)) {
          sourceColumnId = colId;
        }
      });
      
      if (sourceColumnId) {
        // Update task in store
        updateTaskInStore(taskId, { 
          assignedTo: userId || undefined,
          assignedAt: userId ? new Date().toISOString() : undefined
        } as any);
        
        // If task details modal is open, update the selected task
        if (selectedTask && selectedTask._id === taskId) {
          setSelectedTask({
            ...selectedTask,
            assignedTo: userId || undefined,
            assignedAt: userId ? new Date().toISOString() : undefined
          } as ExtendedTask);  // Use type assertion to fix TypeScript error
        }
      }
      
      // Show success message
      toast({
        title: "Success",
        description: userId ? "Task assigned successfully" : "Task unassigned successfully",
        variant: "success"
      });
      
    } catch (error: any) {
      console.error('Error managing task assignment:', error);
      
      // Better error handling with axios
      const errorMessage = error.response?.data?.message || error.message || "Failed to update task assignment";
      
      // Check if it's "already" error, which we can ignore
      if (errorMessage.includes('already')) {
        console.log('Task is already in the requested assignment state');
        return;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleChangePriority = async (taskId: string, priority: 'low' | 'medium' | 'high' | 'critical') => {
    // Declare variables outside try block to make them available in catch
    let localSourceColumnId: string | undefined;
    let taskToUpdate: any = null;
    
    try {
      Object.entries(tasks).forEach(([colId, colTasks]) => {
        const typedTasks = colTasks as any[];
        const task = typedTasks.find(t => t._id === taskId);
        if (task) {
          localSourceColumnId = colId;
          taskToUpdate = task;
        }
      });
      
      if (!localSourceColumnId || !taskToUpdate) {
        throw new Error("Task not found");
      }
      
      // Show immediate feedback
      toast({
        title: "Updating priority...",
        variant: "loading",
      });
      
      // Update in the store first (optimistic update)
      updateTaskInStore(taskId, { priority } as any);
      
      if (selectedTask && selectedTask._id === taskId) {
        setSelectedTask({
          ...selectedTask,
          priority,
        });
      }
      
      // Fix API URL
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ priority })
      });
      
      if (!response.ok) throw new Error('Failed to update task priority');
      
      toast({
        title: "Success",
        description: `Task priority updated to ${priority}`,
        variant: "success"
      });
      
      // Add to activity log
      setBoardStats(prev => ({
        ...prev,
        tasksByPriority: {
          ...prev.tasksByPriority,
          [taskToUpdate.priority]: Math.max(0, (prev.tasksByPriority[taskToUpdate.priority] || 0) - 1),
          [priority]: (prev.tasksByPriority[priority] || 0) + 1,
        },
        recentActivity: [
          {
            id: `activity-${Date.now()}`,
            userName: user?.name || 'You',
            action: 'changed priority',
            taskName: taskToUpdate?.title || 'Unknown task',
            timestamp: new Date().toISOString(),
          },
          ...prev.recentActivity
        ]
      }));
    } catch (error: any) {
      console.error('Error changing task priority:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : 'Failed to update task priority',
        variant: "destructive"
      });
      
      if (localSourceColumnId) {
        fetchTasksByColumn(localSourceColumnId);
      }
    }
  };

  const handleMoveTaskToColumn = async (taskId: string, destinationColumnId: string) => {
    let sourceColumnId: string | undefined;
    let taskToMove: any = null;
    
    Object.entries(tasks).forEach(([colId, colTasks]) => {
      const typedTasks = colTasks as any[];
      const task = typedTasks.find(t => t._id === taskId);
      if (task) {
        sourceColumnId = colId;
        taskToMove = task;
      }
    });
    
    if (!sourceColumnId || !taskToMove) {
      toast({
        title: "Error",
        description: "Task not found",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const destTasks = tasks[destinationColumnId] || [];
      const position = destTasks.length > 0 
        ? Math.max(...(destTasks as any[]).map(t => t.position || 0)) + 1 
        : 1;
      
      // Show loading toast
      toast({
        title: "Moving task...",
        variant: "loading"
      });
      
      await moveTaskInStore(taskId, sourceColumnId, destinationColumnId, position);
      
      toast({
        title: "Success",
        description: "Task moved successfully",
        variant: "success"
      });
      
      // Add to activity log
      setBoardStats(prev => ({
        ...prev,
        recentActivity: [
          {
            id: `activity-${Date.now()}`,
            userName: user?.name || 'You',
            action: 'moved a task',
            taskName: taskToMove?.title || 'Unknown task',
            timestamp: new Date().toISOString(),
          },
          ...prev.recentActivity
        ]
      }));
      
    } catch (error) {
      console.error('Error moving task:', error);
      toast({
        title: "Error",
        description: "Failed to move task",
        variant: "destructive"
      });
    }
  };
  
  const calculateNewPosition = (tasksInColumn: Task[], overTaskPosition: number): number => {
    const positions = tasksInColumn.map(task => task.position || 0);
    const before = positions.filter(pos => pos < overTaskPosition);
    const after = positions.filter(pos => pos > overTaskPosition);
    if (before.length === 0) return overTaskPosition - 1;
    if (after.length === 0) return overTaskPosition + 1;
    return (before[before.length - 1] + after[0]) / 2;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);
    setActiveTaskId(null);
    setActiveColumn(null);

    // Exit if no drop target
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    
    if (activeId === overId) return;

    const activeData = active.data.current as any;
    const overData = over.data.current as any;
    
    if (!activeData || activeData.type !== 'task') return;
    
    const { task, columnId: sourceColumnId } = activeData;
    const taskId = task._id;
    
    try {
      // Handle drop onto a column
      if (overData && overData.type === 'column') {
        const destinationColumnId = overData.id;
        
        // Calculate position at the end of the column
        const destTasks = tasks[destinationColumnId] || [];
        const position = destTasks.length > 0 
          ? Math.max(...(destTasks as any[]).map(t => t.position || 0)) + 1 
          : 1;
        
        // Call moveTask directly
        await moveTaskInStore(taskId, sourceColumnId, destinationColumnId, position);
        
        // Show feedback
        toast({
          title: "Success",
          description: "Task moved to column",
          variant: "success"
        });
      }
      // Handle drop onto another task
      else if (overData && overData.type === 'task') {
        const { task: overTask, columnId: destinationColumnId } = overData;
        const overPosition = overTask.position || 0;
        
        // Calculate position based on surrounding tasks
        const destTasks = tasks[destinationColumnId] || [];
        const position = calculateNewPosition(destTasks as any[], overPosition);
        
        // Call moveTask
        await moveTaskInStore(taskId, sourceColumnId, destinationColumnId, position);
        
        toast({
          title: "Success",
          description: "Task moved successfully",
          variant: "success"
        });
      }
    } catch (error) {
      console.error('Error in drag and drop:', error);
      toast({
        title: "Error",
        description: "Failed to move task",
        variant: "destructive"
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setIsDragging(true);
    setActiveTaskId(active.id as string);
    
    // Get the source column id from the data attributes
    const activeData = active.data.current;
    if (activeData && activeData.type === 'task') {
      // Keep track of which column this task is coming from
      setActiveColumn(activeData.columnId);
    }
  };

  // Effect to fetch data when component mounts
  useEffect(() => {
  
    if (boardId && !dataFetched && accessToken) {
      console.log(`Fetching board data for ID: ${boardId}`);
      fetchBoardData();
    }
  }, [fetchBoardData, boardId, dataFetched, accessToken]);

  useEffect(() => {
    if (board) {
      fetchTeamMembers();
    }
  }, [board]);

  // Call this function after board loads
  useEffect(() => {
    if (board && user) {
      checkUserPermissions();
    }
  }, [board, user, checkUserPermissions]);

  // Apply filters and search to tasks
  const getFilteredTasks = (columnId: string): Task[] => {
    const columnTasks = tasks[columnId] || [];
    const typedTasks = columnTasks as Task[];
    
    // Return filtered tasks with proper typing
    return typedTasks.filter((task) => {
      // Filter by completion status
      if (!showCompletedTasks && task.status === 'completed') {
        return false;
      }
      
      // Filter by search query
      if (searchQuery && !(
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      )) {
        return false;
      }
      
      // Filter by priority if any are selected
      if (filterOptions.priority.length > 0 && !filterOptions.priority.includes(task.priority || 'medium')) {
        return false;
      }
      
      // Filter by labels if any are selected (with type checking)
      if (filterOptions.labels.length > 0 && task.labels) {
        const hasSelectedLabel = task.labels.some(label => 
          filterOptions.labels.includes(label)
        );
        if (!hasSelectedLabel) return false;
      } else if (filterOptions.labels.length > 0) {
        return false; // No labels on this task but labels are filtered
      }
      
      // Filter by assignee
      if (filterOptions.assignedToMe && task.assignedTo !== user?._id) {
        return false;
      }
      
      // Filter by due date
      if (task.dueDate && filterOptions.dueDate !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        
        const thisWeekStart = new Date(today);
        thisWeekStart.setDate(today.getDate() - today.getDay());
        
        const thisWeekEnd = new Date(thisWeekStart);
        thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
        
        const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        switch (filterOptions.dueDate) {
          case 'today':
            if (taskDate.getTime() !== today.getTime()) return false;
            break;
          case 'this-week':
            if (taskDate < thisWeekStart || taskDate > thisWeekEnd) return false;
            break;
          case 'this-month':
            if (taskDate < thisMonthStart || taskDate > thisMonthEnd) return false;
            break;
          case 'overdue':
            if (taskDate >= today) return false;
            break;
        }
      }
      
      return true;
    });
  };

  // Format date helper
  const formatDate = (date: string) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(d);
  };

  // Updated TaskCard component
  const TaskCard: React.FC<{
    task: Task;
    columnId: string;
    onClick: () => void;
    onStatusToggle: (isCompleted: boolean) => void;
    isDragging?: boolean;
    targetColumnId?: string | null;
    onChangePriority?: (taskId: string, priority: 'low' | 'medium' | 'high' | 'critical') => void;
    onMoveToColumn?: (taskId: string, destColumnId: string) => void;
    availableColumns?: { id: string, title: string }[];
  }> = ({ 
    task, 
    columnId, 
    onClick, 
    onStatusToggle,
    isDragging = false,
    targetColumnId = null,
    onChangePriority,
    onMoveToColumn,
    availableColumns = []
  }) => {
    // Local state for dropdowns
    const [showAssignMenu, setShowAssignMenu] = useState(false);
    const [showMoveMenu, setShowMoveMenu] = useState(false);
    
    // Determine if task is completed
    const isCompleted = task.status === 'completed';
    
    // Get the proper priority config
    const priority = task.priority ? priorityConfig[task.priority as keyof typeof priorityConfig] : priorityConfig.medium;
    
    // Check if task is overdue
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !isCompleted;
    
    // Find assigned user info
    const assignedUser = teamMembers.find(member => 
      member.user?._id === task.assignedTo || member._id === task.assignedTo
    );

    const handlePriorityChange = (priority: 'low' | 'medium' | 'high' | 'critical') => {
      if (onChangePriority) {
        onChangePriority(task._id, priority);
      }
    };

    return (
      <div
        className={`group bg-white dark:bg-gray-800/90 rounded-lg shadow-sm border transition-all duration-200
          ${isCompleted ? 
            'opacity-75 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50' : 
            `${priority.border} ${priority.glow}`}
          ${isOverdue ? 'border-red-300 dark:border-red-700 shadow-red-500/20' : ''}
          hover:shadow-md focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-700
          backdrop-blur-sm`}
      >
        {/* Card header with priority indicator */}
        <div className="flex justify-between items-center p-3 border-b border-gray-100 dark:border-gray-700/50">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={(e) => {
                onStatusToggle(e.target.checked);
              }}
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 dark:bg-gray-700 dark:checked:bg-indigo-600 dark:border-gray-600"
              onClick={(e) => e.stopPropagation()}
            />
            
            <span className={`ml-3 px-1.5 py-0.5 rounded-sm text-xs flex items-center ${priority.color}`}>
              {priority.icon} {task.priority || 'medium'}
            </span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button 
                className="p-0.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={(e: React.MouseEvent) => { 
                e.stopPropagation();
                setSelectedTask(task);
                setShowTaskDetails(true);
              }}>
                <Edit size={14} className="mr-2" /> Edit Task
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={(e: React.MouseEvent) => { e.stopPropagation(); onStatusToggle(!isCompleted); }}>
                {isCompleted ? 
                  <><RefreshCw size={14} className="mr-2" /> Reopen</> : 
                  <><CheckCircle size={14} className="mr-2" /> Complete</>
                }
              </DropdownMenuItem>
              
              {/* Priority submenu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full px-2 py-1.5 text-sm text-left flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm">
                    <Flag size={14} className="mr-2" /> Change Priority
                    <ChevronRight size={14} className="ml-auto" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" className="w-36">
                  <DropdownMenuItem onClick={(e: React.MouseEvent) => { 
                    e.stopPropagation(); 
                    handlePriorityChange('low');
                  }}>
                    <div className="flex items-center w-full">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                      Low
                      {task.priority === 'low' && <Check size={14} className="ml-auto" />}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e: React.MouseEvent) => { 
                    e.stopPropagation(); 
                    handlePriorityChange('medium');
                  }}>
                    <div className="flex items-center w-full">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      Medium
                      {task.priority === 'medium' && <Check size={14} className="ml-auto" />}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e: React.MouseEvent) => { 
                    e.stopPropagation(); 
                    handlePriorityChange('high');
                  }}>
                    <div className="flex items-center w-full">
                      <div className="h-2 w-2 rounded-full bg-orange-500 mr-2"></div>
                      High
                      {task.priority === 'high' && <Check size={14} className="ml-auto" />}
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e: React.MouseEvent) => { 
                    e.stopPropagation(); 
                    handlePriorityChange('critical');
                  }}>
                    <div className="flex items-center w-full">
                      <div className="h-2 w-2 rounded-full bg-red-500 mr-2"></div>
                      Critical
                      {task.priority === 'critical' && <Check size={14} className="ml-auto" />}
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Move to column submenu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full px-2 py-1.5 text-sm text-left flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm">
                    <MenuSquare size={14} className="mr-2" /> Move to Column
                    <ChevronRight size={14} className="ml-auto" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" className="w-48">
                  {availableColumns && availableColumns.length > 0 && availableColumns
                    .filter(col => col.id !== columnId)
                    .map(column => (
                      <DropdownMenuItem
                        key={column.id}
                        onClick={(e: React.MouseEvent) => { 
                          e.stopPropagation();
                          if (onMoveToColumn) onMoveToColumn(task._id, column.id);
                        }}
                      >
                        <div className="flex items-center w-full">
                          {column.title}
                        </div>
                      </DropdownMenuItem>
                    ))
                  }
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Assign to submenu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full px-2 py-1.5 text-sm text-left flex items-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-sm">
                    <User size={14} className="mr-2" /> Assign To
                    <ChevronRight size={14} className="ml-auto" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" className="w-48">
                  <DropdownMenuItem 
                    key="unassigned-option"
                    onClick={(e: React.MouseEvent) => { 
                      e.stopPropagation(); 
                      handleAssignTask(task._id, null); 
                    }}
                  >
                    <div className="flex items-center w-full">
                      Unassigned
                      {!task.assignedTo && <Check size={14} className="ml-auto" />}
                    </div>
                  </DropdownMenuItem>
                  
                  {teamMembers.length > 0 ? (
                    teamMembers.map(member => {
                      // Handle different API response formats
                      const memberId = member.user?._id || member._id;
                      const memberName = member.user?.name || member.name || 'Unknown User';
                      const memberAvatar = member.user?.avatar || member.avatar;
                      
                      return (
                        <DropdownMenuItem
                          key={`member-${memberId || Math.random().toString()}`} // Ensure unique key even if memberId is undefined
                          onClick={(e: React.MouseEvent) => { 
                            e.stopPropagation(); 
                            handleAssignTask(task._id, memberId); 
                          }}
                        >
                          <div className="flex items-center w-full">
                            <Avatar className="h-5 w-5 mr-2">
                              {memberAvatar ? (
                                <AvatarImage src={memberAvatar} alt={memberName} />
                              ) : (
                                <AvatarFallback>{memberName[0]}</AvatarFallback>
                              )}
                            </Avatar>
                            <span className="truncate">{memberName}</span>
                            {task.assignedTo === memberId && <Check size={14} className="ml-auto" />}
                          </div>
                        </DropdownMenuItem>
                      );
                    })
                  ) : (
                    <DropdownMenuItem key="no-members" disabled>
                      <div className="flex items-center w-full">
                        No team members found
                      </div>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenuItem 
                onClick={(e: React.MouseEvent) => { 
                  e.stopPropagation();
                  handleDeleteTask(columnId, task._id);
                }}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 size={14} className="mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Card content - add a special style for completed tasks */}
        <div className={`px-3 pt-2 pb-1 ${isCompleted ? 'opacity-75' : ''}`} onClick={onClick}>
          <h4 className={`text-sm font-medium mb-1 ${isCompleted ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
            {task.title}
            
            {/* Visual indication for completed tasks */}
            {isCompleted && (
              <span className="ml-2 inline-flex items-center">
                <CheckCircle size={14} className="text-green-500" />
              </span>
            )}
          </h4>
          
          {task.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Due date */}
            {task.dueDate && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs 
                ${isOverdue ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}`}>
                <Clock size={12} className="mr-1" />
                {formatDate(task.dueDate)}
              </span>
            )}
            
            {/* Task labels */}
            {task.labels && task.labels.length > 0 && (
              <>
                {task.labels.slice(0, 2).map((labelName: string, i: number) => {
                  const label = taskLabels.find(l => l.name === labelName);
                  return label ? (
                    <span 
                      key={`${task._id}-label-${labelName}-${i}`} // Ensure unique key with multiple factors
                      className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs ${label.color}`}
                    >
                      {label.icon}
                      {labelName}
                    </span>
                  ) : null;
                })}
                
                {/* Additional labels counter */}
                {task.labels.length > 2 && (
                  <span 
                    key={`${task._id}-label-more`} 
                    className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                  >
                    +{task.labels.length - 2} more
                  </span>
                )}
              </>
            )}
          </div>
          
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700/50 flex items-center justify-between text-xs">
            {assignedUser ? (
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Avatar className="h-4 w-4 mr-1">
                  {assignedUser.user?.avatar || assignedUser.avatar ? (
                    <AvatarImage src={assignedUser.user?.avatar || assignedUser.avatar} alt={assignedUser.user?.name || assignedUser.name || 'User'} />
                  ) : (
                    <AvatarFallback className="text-[10px]">{(assignedUser.user?.name || assignedUser.name || 'U')[0]}</AvatarFallback>
                  )}
                </Avatar>
                <span className="truncate max-w-[100px]">{assignedUser.user?.name || assignedUser.name}</span>
              </div>
            ) : (
              <span className="text-gray-400 dark:text-gray-500">Unassigned</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Updated Sortable Task Card for drag-n-drop
  const SortableTaskCard = ({ task, columnId }: { task: any, columnId: string }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({
      id: `${columnId}-${task._id}`, // Use composite key to prevent duplicate ID issues
      data: {
        type: 'task',
        task,
        columnId,
      },
    });

    const style = {
      transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
      transition,
      zIndex: isDragging ? 100 : 1,
    };

    return (
      <div 
        ref={setNodeRef} 
        style={style}
        {...attributes} 
        className={`mb-3 ${isDragging ? 'shadow-lg' : ''} touch-none`}
      >
        <div className="cursor-grab" {...listeners}>
          <TaskCard
            task={task}
            columnId={columnId}
            isDragging={isDragging}
            targetColumnId={null}
            onClick={() => {
              setSelectedTask(task);
              setShowTaskDetails(true);
            }}
            onStatusToggle={(isCompleted) => {
              handleToggleTaskCompletion(columnId, task._id, isCompleted);
            }}
            onChangePriority={(taskId, priority) => {
              handleChangePriority(taskId, priority);
            }}
            onMoveToColumn={(taskId, destColumnId) => {
              handleMoveTaskToColumn(taskId, destColumnId);
            }}
            availableColumns={columns.map(col => ({ id: col._id, title: col.title || 'Unnamed Column' }))}
          />
        </div>
      </div>
    );
  };

  // Column component
  const TaskColumn: React.FC<{
    column: Column;
    tasks: Task[];
    onAddTask: (title: string, priority: string, dueDate?: string, description?: string) => void;
    onDeleteColumn: () => void;
  }> = ({ column, tasks, onAddTask, onDeleteColumn }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    
    const isActiveColumn = activeColumn === column._id;
    
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newTaskTitle.trim()) {
        onAddTask(
          newTaskTitle, 
          newTaskPriority,
          newTaskDueDate || undefined,
          newTaskDescription || undefined
        );
        setNewTaskTitle('');
        setNewTaskDescription('');
        setNewTaskPriority('medium');
        setNewTaskDueDate('');
        setActiveColumn(null);
      }
    };
    
    // Calculate column stats
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;

    return (
      <div 
        className="task-column bg-gray-100 dark:bg-gray-900/50 rounded-xl overflow-hidden flex flex-col min-h-[calc(100vh-220px)] shadow-sm border border-gray-200 dark:border-gray-800"
        data-column-id={column._id}
      >
        {/* Column header */}
        <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <h3 className="font-medium text-gray-900 dark:text-white">{column.title}</h3>
            <div className="flex ml-2 gap-1">
              <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full">
                {totalTasks}
              </span>
              
              {completedTasks > 0 && (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full flex items-center">
                  <CheckCircle size={10} className="mr-1" />
                  {completedTasks}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <button
              className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setActiveColumn(isActiveColumn ? null : column._id)}
            >
              <Plus size={16} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1 ml-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                  <MoreHorizontal size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => setActiveColumn(column._id)}>
                  <PlusCircle size={14} className="mr-2" /> Add Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDeleteColumn} className="text-red-600 dark:text-red-400">
                  <Trash2 size={14} className="mr-2" /> Delete Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Enhanced task form with description */}
        <AnimatePresence>
          {isActiveColumn && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit}>
                  {/* Task title input */}
                  <input
                    type="text"
                    placeholder="Enter task title..."
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mb-2"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    autoFocus
                  />
                  
                  {/* Task description - Always visible */}
                  <textarea
                    placeholder="Add a description (optional)"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mb-2 min-h-[60px]"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                  />
                  
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    {/* Priority dropdown */}
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Priority</label>
                      <select
                        className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    
                    {/* Due date picker - Always visible */}
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Due Date</label>
                      <input
                        type="date"
                        className="w-full p-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  {/* Form actions */}
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveColumn(null);
                        setNewTaskTitle('');
                        setNewTaskDescription('');
                        setNewTaskPriority('medium');
                        setNewTaskDueDate('');
                      }}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!newTaskTitle.trim()}
                      className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded disabled:opacity-50 flex items-center"
                    >
                      <Plus size={14} className="mr-1" /> Add
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tasks container with scroll */}
        <div className="p-3 overflow-y-auto flex-1">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center p-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
                <Clipboard className="h-6 w-6 text-gray-400" />
              </div>
              <p className="mb-2">No tasks yet</p>
              <button
                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center text-sm"
                onClick={() => setActiveColumn(column._id)}
              >
                <Plus size={16} className="mr-1" /> Add a task
              </button>
            </div>
          ) : (
            <SortableContext
              items={tasks.map(task => task._id)}
              strategy={verticalListSortingStrategy}
            >
              <div>
                {tasks.map(task => (
                  <SortableTaskCard
                    key={`${column._id}-${task._id}`}
                    task={task}
                    columnId={column._id}
                  />
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    );
  };

  // Toggle starred state
  const toggleStarred = () => {
    setIsStarred(!isStarred);
    
    // Update the board state with the new isStarred value
    if (board) {
      setBoard({
        ...board,
        isStarred: !isStarred
      });
    }
  };

  // Fix updateTask function
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    const apiUpdates = { ...updates };
    
    // Special handling for null/undefined - convert undefined to null for API
    if ('dueDate' in updates && updates.dueDate === undefined) {
      (apiUpdates as any).dueDate = null;
    }
    
    try {
      // Show loading toast
      toast({ title: "Updating task...", variant: "loading" });
      
      // Fix API URL
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(apiUpdates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      
      const data = await response.json();
      
      // Update local task state to reflect changes
      updateTaskInStore(taskId, updates as any);
      
      // Update activity
      setBoardStats(prev => ({
        ...prev,
        recentActivity: [
          {
            id: `activity-${Date.now()}`,
            userName: user?.name || 'You',
            action: 'updated a task',
            taskName: updates.title || 'Unknown task',
            timestamp: new Date().toISOString(),
          },
          ...prev.recentActivity
        ]
      }));
      
      toast({ title: "Task updated", variant: "success" });
      return data;
    } catch (error) {
      toast({ title: "Failed to update task", variant: "destructive" });
      console.error('Error updating task:', error);
      throw error;
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('Are you sure you want to delete this column? All tasks in this column will also be deleted.')) {
      return;
    }
    
    try {
      // Delete the column via API
      await deleteColumn(columnId);
      
      // Update state - remove the column and its tasks
      setColumns(prev => prev.filter(col => col._id !== columnId));
      
      // Update activity
      setBoardStats(prev => ({
        ...prev,
        recentActivity: [
          {
            id: `activity-${Date.now()}`,
            userName: user?.name || 'You',
            action: 'deleted a column',
            taskName: columns.find(col => col._id === columnId)?.title || 'Unknown column',
            timestamp: new Date().toISOString(),
          },
          ...prev.recentActivity
        ]
      }));
      
      toast({
        title: "Success",
        description: "Column deleted successfully",
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error deleting column:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : 'Failed to delete column',
        variant: "destructive"
      });
    }
  };

  const refreshAllColumns = useCallback(async () => {
    // Track whether all fetches succeeded
    let allSucceeded = true;
    
    // Refresh all columns' tasks
    const refreshPromises = columns.map(async (column) => {
      try {
        await fetchTasksByColumn(column._id);
        return true;
      } catch (error) {
        console.error(`Error refreshing column ${column._id}:`, error);
        return false;
      }
    });
    
    const results = await Promise.all(refreshPromises);
    allSucceeded = results.every(Boolean);
    
    if (!allSucceeded) {
      console.warn('Some columns failed to refresh');
    }
    
    return allSucceeded;
  }, [columns, fetchTasksByColumn]);

  // Call this function after significant operations
  useEffect(() => {
    // Refresh all columns periodically or after navigating back to the board
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshAllColumns();
      }
    }, 60000); // Refresh every minute when tab is visible
    
    return () => clearInterval(intervalId);
  }, [refreshAllColumns]);

  useEffect(() => {
    if (selectedTask && showTaskDetails) {
      // Find the fresh version of this task in the tasks object
      let freshTask = null;
      Object.entries(tasks).forEach(([colId, colTasks]) => {
        const foundTask = (colTasks as any[]).find(t => t._id === selectedTask._id);
        if (foundTask) {
          freshTask = foundTask;
        }
      });
      
      // If we found a fresher version, update the selected task
      if (freshTask && JSON.stringify(freshTask) !== JSON.stringify(selectedTask)) {
        console.log('Updating selected task with fresh data:', freshTask);
        setSelectedTask(freshTask);
      }
    }
  }, [selectedTask?._id, tasks, showTaskDetails]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading board...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Board</h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">{error}</p>
          <div className="flex gap-4">
            <button
              onClick={() => fetchBoardData()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Try Again
            </button>
            <Link
              href="/teams"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
            >
              Back to Teams
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Board Header */}
      <motion.div
        className="bg-white dark:bg-gray-800 shadow-sm rounded-lg mb-6 p-4"
        style={{
          opacity: 1,
          backdropFilter: `blur(0px)`
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <Link
              href={board && getTeamId(board) ? `/teams/${getTeamId(board)}` : '/teams'}
              className="mr-4 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:underline flex items-center"
            >
              <ArrowLeft size={16} className="mr-1" /> Back to Team
            </Link>

            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {board?.title || board?.name || "Untitled Board"}
            </h1>

            <button
              className={`ml-2 p-1 rounded-full ${isStarred ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
              onClick={toggleStarred}
            >
              <Star size={18} fill={isStarred ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateColumn(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md flex items-center text-sm"
            >
              <Plus size={16} className="mr-1" /> Add Column
            </button>
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md flex items-center text-sm"
            >
              <Info size={16} className="mr-1" /> Board Info
            </button>
            <Button
              onClick={() => setShowTeamSheet(true)}
              variant="outline"
              className="flex items-center gap-1"
            >
              <Users size={16} className="mr-1" /> Team Members
            </Button>
          </div>
        </div>

        {board?.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {board.description}
          </p>
        )}
      </motion.div>

      {/* Board Content */}
      {columns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 max-w-md text-center">
            <Tag size={40} className="mx-auto mb-4 text-indigo-500" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Get started with columns</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create columns like &quot;To Do&quot;, &quot;In Progress&quot;, and &quot;Done&quot; to organize your tasks into a workflow.
            </p>
            <button
              onClick={() => setShowCreateColumn(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
            >
              Create Your First Column
            </button>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={collisionDetectionStrategy}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToWindowEdges]}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
        >
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {columns.map(column => (
              <motion.div
                key={column._id}
                variants={itemVariants}
                data-column-id={column._id} // Add this attribute for column identification
              >
                <TaskColumn
                  column={column}
                  tasks={getFilteredTasks(column._id)}
                  onAddTask={(title, priority, dueDate, description) => 
                    handleAddTask(column._id, title, priority, description, dueDate)}
                  onDeleteColumn={() => handleDeleteColumn(column._id)}
                />
              </motion.div>
            ))}
          </motion.div>
        </DndContext>
      )}

      {/* Modals */}
      {showCreateColumn && (
        <Dialog open={showCreateColumn} onOpenChange={setShowCreateColumn}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Column</DialogTitle>
              <DialogDescription>
                Enter a name for your new column.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const title = (e.target as HTMLFormElement).elements.namedItem('title') as HTMLInputElement;
                handleCreateColumn(title.value);
              }}
            >
              <input
                name="title"
                type="text"
                placeholder="Column name"
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white mb-4"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
                >
                  Create
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Enhanced task details modal */}
      {showTaskDetails && selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          open={showTaskDetails}
          onOpenChange={setShowTaskDetails}
          columns={columns}
          onUpdateTask={updateTask}
          onDeleteTask={handleDeleteTask}
          onMoveTask={handleMoveTaskToColumn}
          tasks={tasks as unknown as Record<string, Task[]>} // Use type assertion here
          teamMembers={teamMembers}
          assignedUser={teamMembers.find(member => 
            member.user?._id === selectedTask.assignedTo || member._id === selectedTask.assignedTo
          )}
          handleAssignTask={handleAssignTask}
        />
      )}

      {/* Team Members Sheet */}
      <Sheet open={showTeamSheet} onOpenChange={setShowTeamSheet}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Team Members
            </SheetTitle>
            <SheetDescription>
              Manage team members and task assignments
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            {/* Team members list */}
            <div className="space-y-3">
              {teamMembers.length > 0 ? (
                teamMembers.map((member) => {
                  const memberId = member.user?._id || member._id;
                  const memberName = member.user?.name || member.name || 'Unknown User';
                  const memberEmail = member.user?.email || member.email || '';
                  const memberAvatar = member.user?.avatar || member.avatar;
                  const memberRole = member.role || 'member';
                  
                  // Calculate initials for avatar fallback
                  const initials = memberName
                    .split(' ')
                    .map((part: any[]) => part[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);
                  
                  return (
                    <div 
                      key={memberId || Math.random().toString()}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 rounded-full mr-3">
                          {memberAvatar ? (
                            <AvatarImage src={memberAvatar} alt={memberName} />
                          ) : (
                            <AvatarFallback className="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                              {initials}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">
                            {memberName}
                            {user?._id === memberId && <span className="ml-2 text-xs text-gray-500">(You)</span>}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {memberEmail}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Badge
                          variant={
                            memberRole === 'owner' 
                              ? 'default' 
                              : memberRole === 'admin' 
                                ? 'secondary' 
                                : 'outline'
                          }
                          className={
                            memberRole === 'owner'
                              ? 'bg-blue-500'
                              : memberRole === 'admin'
                                ? 'bg-purple-500'
                                : ''
                          }
                        >
                          {memberRole === 'owner' ? 'Owner' : memberRole === 'admin' ? 'Admin' : 'Member'}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 dark:text-gray-400">No team members available</p>
                </div>
              )}
            </div>
            
            {/* Add member section (for owners/admins) */}
            {(isOwner || isAdmin) && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3">
                  Team Management
                </h3>
                
                <div className="flex flex-col space-y-2">
                  <Button 
                    onClick={() => {
                      // Navigate to team page
                      if (board && board.team) {
                        const teamId = typeof board.team === 'string' ? board.team : board.team._id;
                        if (teamId) router.push(`/teams/${teamId}`);
                      }
                    }}
                    variant="outline"
                    className="justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Team Members
                  </Button>
                  
                  <Button 
                    onClick={() => setShowTeamSheet(false)}
                    variant="ghost"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
            
            {/* Task assignment stats */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3">
                Task Assignment Distribution
              </h3>
              
              <div className="space-y-4">
                {teamMembers.length > 0 ? (
                  <div className="space-y-3">
                    {teamMembers.map(member => {
                      const memberId = member.user?._id || member._id;
                      const memberName = member.user?.name || member.name || 'Unknown User';
                      
                      // Count tasks assigned to this member
                      let assignedTaskCount = 0;
                      Object.values(tasks).forEach((columnTasks: any) => {
                        assignedTaskCount += columnTasks.filter((task: any) => 
                          task.assignedTo === memberId
                        ).length;
                      });
                      
                      // Calculate percentage of total tasks
                      const totalTasks = Object.values(tasks).reduce((count: number, columnTasks: any) => 
                        count + columnTasks.length, 0);
                      const percentage = totalTasks ? Math.round((assignedTaskCount / totalTasks) * 100) : 0;
                      
                      return (
                        <div key={memberId || Math.random().toString()} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-700 dark:text-gray-300">{memberName}</span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {assignedTaskCount} task{assignedTaskCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No members available to show task distribution
                  </p>
                )}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
};

export default BoardPage;