/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { fetchTeam, Team, TeamMember as ImportedTeamMember } from '../../store/teamService';
import LoadingSpinner from '@/app/components/LoadingSpinner';
import ErrorMessage from '@/app/components/ErrorMessage';
import { Clock, Users, Shield, Settings, Plus, Layout, List, ArrowRight, Clipboard } from 'react-feather';
import {
  Home, ArrowLeft, Edit, ChevronRight, Activity, Calendar,
  UserPlus, Share2, LineChart, Eye, EyeOff, Mail, BarChart2,
  PieChart, CheckCircle, XCircle, Download, Upload, PlusCircle
} from 'lucide-react';
import { useToast } from '@/app/hooks/useToast';
import TeamNotFound from '@/app/components/TeamNotFound';
import useAuthStore from '@/app/store/useAuthStore';
import {
  Grid3X3, Trash2, Star,
  Clock as LucideClock, MoreHorizontal, ArrowUpRight, Search,
  X, CheckCircle2, RefreshCw, LayoutGrid
} from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { fetchBoardsByTeam, createBoard, deleteBoard, fetchColumnsByBoard, updateBoard } from '../../store/boardService';
import useCardColorStore, { CARD_COLORS, DEFAULT_COLOR } from '@/app/store/useCardColorStore';
import styles from './TeamPage.module.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/app/components/ui/dropdown-menu';
import BoardColorSelector from '@/app/components/BoardColorSelector';
import BoardCard from '@/app/components/BoardCard';
import { Button } from '@/app/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/app/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetFooter
} from "@/app/components/ui/sheet";
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { cn } from '@/app/lib/utils';

// Board background options
const boardBackgrounds = [
  { color: 'from-blue-500 to-indigo-600', name: 'Blue' },
  { color: 'from-green-400 to-teal-500', name: 'Green' },
  { color: 'from-purple-500 to-pink-500', name: 'Purple' },
  { color: 'from-yellow-400 to-orange-500', name: 'Yellow' },
  { color: 'from-red-500 to-pink-600', name: 'Red' },
  { color: 'from-gray-700 to-gray-900', name: 'Dark' },
  // Futuristic gradients
  { color: 'from-blue-600 via-indigo-700 to-purple-800', name: 'Cosmic Blue' },
  { color: 'from-emerald-500 via-teal-600 to-cyan-700', name: 'Quantum Green' },
  { color: 'from-rose-500 via-pink-600 to-fuchsia-700', name: 'Neon Magenta' },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2
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

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6 }
  }
};

const slideInVariants = {
  hidden: { x: -30, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { 
      type: "spring", 
      stiffness: 300, 
      damping: 25 
    }
  }
};

// Team user interfaces
interface TeamUserData {
  _id: string;
  name?: string;
  email?: string;
  image?: string;
  avatar?: string;
  username?: string;
}

interface TeamMember {
  user: string | TeamUserData;
  role: 'owner' | 'admin' | 'member';
  joinedAt?: string;
  lastActive?: string;
  taskCount?: number;
  performanceScore?: number;
}

// Enhanced board view modes
enum BoardViewMode {
  Grid = 'grid',
  List = 'list',
  Compact = 'compact'
}

// Team data interface
interface TeamData {
  avatar: any;
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  members: TeamMember[];
  owner: string | TeamUserData;
}

// Column interface
interface Column {
  _id: string;
  title?: string;  
  name?: string;  
  boardId?: string;
  board?: string;  
  position: number;
  cards?: any[];
  createdAt?: string;
  updatedAt?: string;
  colorScheme?: string; 
  backgroundColor?: string; 
}

// Board interface
interface BoardWithColumns {
  _id: string;
  title?: string;  
  name?: string;   
  description?: string;
  columns: Column[];
  backgroundColor?: string;
  cardsCount?: number;
  updatedAt?: string;
  createdAt?: string;
  isStarred?: boolean;
  colorScheme?: string; 
}

// Helper function to get consistent avatar styling
const getAvatarStyle = (name: string) => {
  const colors = [
    { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' },
    { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
    { bg: 'bg-sky-100', text: 'text-sky-600', border: 'border-sky-200' },
    { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
    { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
    { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
  ];

  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Helper function to safely get user data from a member
const getUserData = (member: TeamMember): {
  id: string;
  name: string;
  email: string;
  image: string | null;
} => {
  if (typeof member.user === 'string') {
    return {
      id: member.user,
      name: 'Unknown User',
      email: '',
      image: null
    };
  }

  return {
    id: member.user._id || '',
    name: member.user.name || member.user.username || 'Unknown User',
    email: member.user.email || '',
    image: member.user.image || member.user.avatar || null
  };
};

// Date formatting helper
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'No date';

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Get task count helper
const getTaskCount = (board: any): number => {
  if (!board.columns || !Array.isArray(board.columns)) {
    return board.cardsCount || 0;
  }

  return board.columns.reduce((total: number, column: any) => {
    const cardCount = column.cards?.length || 0;
    return total + cardCount;
  }, 0);
};

// Get column color helper
const getColumnColor = (column: Column, board: BoardWithColumns): string => {
  if (column.colorScheme) return column.colorScheme;
  if (board.colorScheme) return board.colorScheme;
  
  if (column._id) {
    try {
      const colorFromStore = useCardColorStore.getState().getCardColor(column._id);
      if (colorFromStore) return colorFromStore;
    } catch (e) {
      console.error(`Error getting color for column ${column._id}:`, e);
    }
  }
  
  return DEFAULT_COLOR;
};

// Get board background style helper
const getBoardBackgroundStyle = (backgroundColor?: string, colorScheme?: string) => {
  if (colorScheme) {
    const bgClass = colorScheme.split(' ')[0];
    return { className: bgClass };
  }
  
  if (!backgroundColor) {
    return {
      background: 'linear-gradient(to right, var(--tw-gradient-stops))',
      backgroundImage: 'linear-gradient(to right, #4f46e5, #6366f1, #8b5cf6)'
    };
  }
  
  if (backgroundColor.startsWith('#')) {
    return { backgroundColor };
  }
  
  return {
    backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))`,
    className: `bg-gradient-to-r ${backgroundColor}`
  };
};

const TeamDetailsPage: React.FC = () => {
  // Hooks
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, accessToken } = useAuthStore();
  const { getCardColor } = useCardColorStore();
  const inviteEmailRef = useRef<HTMLInputElement>(null);
  
  // Scroll animations
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);
  const headerScale = useTransform(scrollY, [0, 100], [1, 0.98]);
  const headerBlur = useTransform(scrollY, [0, 100], [0, 8]);
  
  // Team state
  const [team, setTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showMembersSheet, setShowMembersSheet] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'member' | 'admin'>('member');
  const [invitingMember, setInvitingMember] = useState(false);
  const [membersTab, setMembersTab] = useState('active');
  
  // Team metrics
  const [teamMetrics, setTeamMetrics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    averageTasksPerMember: 0,
    activeMembers: 0
  });

  // Board state
  const [boards, setBoards] = useState<BoardWithColumns[]>([]);
  const [loadingBoards, setLoadingBoards] = useState<boolean>(true);
  const [boardsError, setBoardsError] = useState<string | null>(null);
  const [showCreateBoard, setShowCreateBoard] = useState<boolean>(false);
  const [newBoardTitle, setNewBoardTitle] = useState<string>('');
  const [newBoardDescription, setNewBoardDescription] = useState<string>('');
  const [creatingBoard, setCreatingBoard] = useState<boolean>(false);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [editBoardId, setEditBoardId] = useState<string | null>(null);
  const [editBoardTitle, setEditBoardTitle] = useState<string>('');
  const [editBoardDescription, setEditBoardDescription] = useState<string>('');
  const [editingBoard, setEditingBoard] = useState<boolean>(false);
  const [selectedBackground, setSelectedBackground] = useState<string>('from-blue-600 via-indigo-700 to-purple-800');
  const [selectedColumnColor, setSelectedColumnColor] = useState<string>(DEFAULT_COLOR);
  const [selectedBoardColor, setSelectedBoardColor] = useState<string>('#6366F1');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'created' | 'activity'>('updated');
  const [viewMode, setViewMode] = useState<BoardViewMode>(BoardViewMode.Grid);
  const [showQuickStats, setShowQuickStats] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Pending invites state
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [loadingInvites, setLoadingInvites] = useState(false);

  // Function to fetch boards for the team
  const fetchTeamBoards = async (teamId: string) => {
    try {
      setLoadingBoards(true);
      setBoardsError(null);
      
      const fetchedBoards = await fetchBoardsByTeam(teamId);
      
      if (!fetchedBoards || !Array.isArray(fetchedBoards)) {
        console.error('Invalid board data returned:', fetchedBoards);
        setBoardsError('Invalid data received from server');
        setBoards([]);
        return;
      }

      // Fetch columns for each board
      const boardsWithColumns = await Promise.all(
        fetchedBoards.map(async (board) => {
          try {
            if (!board._id) {
              console.error('Board missing ID:', board);
              return { ...board, columns: [] };
            }

            const columns = await fetchColumnsByBoard(board._id);
            return {
              ...board,
              columns: columns || []
            };
          } catch (error) {
            console.error(`Error fetching columns for board ${board._id}:`, error);
            return { ...board, columns: [] };
          }
        })
      );

      setBoards(
        boardsWithColumns.map(board => ({
          ...board,
          title: board.title || board.name || 'Untitled Board',
          columns: board.columns.map((column: Column) => ({
            _id: column._id,
            title: column.title || 'Unnamed Column',
            name: column.title || 'Unnamed Column',
            boardId: column.boardId || column.board,
            board: column.boardId || column.board,
            position: column.position,
            cards: column.cards || [],
            createdAt: column.createdAt,
            updatedAt: column.updatedAt,
            colorScheme: column.colorScheme,
          })),
        })) || []
      );
      
      // Calculate team metrics
      calculateTeamMetrics(boardsWithColumns);

    } catch (error: any) {
      console.error('Error fetching team boards:', error);
      setBoardsError(typeof error === 'string' ? error : 'Failed to load boards');
    } finally {
      setLoadingBoards(false);
      setRefreshing(false);
    }
  };
  
  // Calculate team metrics based on boards and members
  const calculateTeamMetrics = (boards: BoardWithColumns[]) => {
    let totalTasks = 0;
    let completedTasks = 0;
    
    // Count tasks and completed tasks from all boards
    boards.forEach(board => {
      const boardTaskCount = getTaskCount(board);
      totalTasks += boardTaskCount;
      
      // Assume completed tasks are in columns named "Done", "Completed", etc.
      if (board.columns) {
        board.columns.forEach(column => {
          const columnName = (column.title || column.name || '').toLowerCase();
          if (columnName.includes('done') || columnName.includes('complete')) {
            completedTasks += (column.cards?.length || 0);
          }
        });
      }
    });
    
    // Count active members (active in last month)
    const activeMembers = team?.members?.filter(member => {
      if (!member.lastActive) return false;
      const lastActive = new Date(member.lastActive);
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return lastActive >= oneMonthAgo;
    }).length || 0;
    
    // Calculate average tasks per member
    const avgTasksPerMember = team?.members?.length ? 
      Math.round(totalTasks / team.members.length * 10) / 10 : 0;
    
    setTeamMetrics({
      totalTasks,
      completedTasks,
      averageTasksPerMember: avgTasksPerMember,
      activeMembers
    });
  };

  // Create board handler
  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) {
      toast({
        title: "Error",
        description: "Board title is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setCreatingBoard(true);
      
      const requestBody = {
        title: newBoardTitle.trim(),
        description: newBoardDescription.trim(),
        teamId: team?._id,
        backgroundColor: selectedBoardColor,
        colorScheme: selectedColumnColor, 
      };
      
      if (!team?._id) throw new Error("Team ID is missing");

      const newBoard = await createBoard(requestBody);
      setBoards([{ ...newBoard, columns: [] }, ...boards]);
      setShowCreateBoard(false);
      setNewBoardTitle('');
      setNewBoardDescription('');
      setSelectedBackground('from-blue-600 via-indigo-700 to-purple-800');
      setSelectedColumnColor(DEFAULT_COLOR);
      setSelectedBoardColor('#6366F1');

      toast({
        title: "Success",
        description: "Board created successfully",
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error creating board:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : error.message || 'Failed to create board',
        variant: "destructive"
      });
    } finally {
      setCreatingBoard(false);
    }
  };

  // Delete board handler
  const handleDeleteBoard = async (boardId: string) => {
    try {
      setDeletingBoardId(boardId);
      setShowDeleteDialog(false);
      
      await deleteBoard(boardId);
      setBoards(boards.filter(board => board._id !== boardId));

      toast({
        title: "Success",
        description: "Board deleted successfully",
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error deleting board:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : 'Failed to delete board',
        variant: "destructive"
      });
    } finally {
      setDeletingBoardId(null);
      setBoardToDelete(null);
    }
  };

  // Confirm board deletion
  const confirmDeleteBoard = async (boardId: string): Promise<void> => {
    setBoardToDelete(boardId);
    setShowDeleteDialog(true);
    // Return a resolved promise to match the expected return type
    return Promise.resolve();
  };

  // Edit board handler
  const handleEditBoard = async () => {
    if (!editBoardTitle?.trim() || !editBoardId) {
      toast({
        title: "Error",
        description: "Board title is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setEditingBoard(true);
      const description = editBoardDescription?.trim() || '';

      const updatedBoard = await updateBoard(editBoardId, {
        title: editBoardTitle.trim(),
        description: description
      });

      setBoards(boards.map(board =>
        board._id === editBoardId
          ? { ...board, title: editBoardTitle.trim(), description: description }
          : board
      ));

      setEditBoardId(null);
      setEditBoardTitle('');
      setEditBoardDescription('');

      toast({
        title: "Success",
        description: "Board updated successfully",
        variant: "success"
      });
    } catch (error: any) {
      console.error('Error updating board:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : 'Failed to update board',
        variant: "destructive"
      });
    } finally {
      setEditingBoard(false);
    }
  };

  // Start editing a board
  const startEditingBoard = (board: BoardWithColumns) => {
    setEditBoardId(board._id);
    setEditBoardTitle(board.name || board.title || '');
    setEditBoardDescription(board.description || '');
  };
  
  // Function to add a new team member
  const handleInviteMember = async () => {
    if (!newMemberEmail.trim() || !validateEmail(newMemberEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setInvitingMember(true);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      // Using direct API endpoint for adding members
      const response = await fetch(`${apiUrl}/teams/${team?._id}/members`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: newMemberEmail, 
          role: newMemberRole
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check specific error conditions
        if (data.userNotFound || data.message?.includes('user not found')) {
          toast({
            title: "User Not Found",
            description: `No account found with email ${newMemberEmail}. They need to create an account first.`,
            variant: "default"
          });
          return;
        } else if (data.message?.includes('already a member')) {
          toast({
            title: "Already a Member",
            description: `${newMemberEmail} is already a member of this team.`,
            variant: "default"
          });
          return;
        }
        
        throw new Error(data.message || 'Failed to add team member');
      }
      
      // Handle success
      toast({
        title: "Success",
        description: `${newMemberEmail} was added to the team successfully.`,
        variant: "success"
      });
      
      // Clear inputs and refresh team data
      setNewMemberEmail('');
      setNewMemberRole('member');
      
      // Refresh team data to show new members
      if (team?._id) {
        // Fetch updated member list
        const updatedTeamResponse = await fetch(`${apiUrl}/teams/${team._id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (updatedTeamResponse.ok) {
          const updatedTeam = await updatedTeamResponse.json();
          setTeam(updatedTeam.data || updatedTeam);
        }
      }
    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : error.message || 'Failed to add team member',
        variant: "destructive"
      });
    } finally {
      setInvitingMember(false);
    }
  };
  
  // Email validation helper
  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Fetch pending invitations
  const fetchPendingInvites = async () => {
    if (!team?._id) return;
    
    try {
      setLoadingInvites(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${apiUrl}/teams/${team._id}/invitations`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending invitations');
      }
      
      const data = await response.json();
      setPendingInvites(data.data || []);
    } catch (error) {
      console.error('Error fetching pending invites:', error);
      // No need to show error toast here as it's not a critical operation
    } finally {
      setLoadingInvites(false);
    }
  };

  // Filtered and sorted boards
  const filteredBoards = useMemo(() => {
    // First filter by active tab
    let filtered = [...boards];
    
    if (activeTab === 'starred') {
      filtered = filtered.filter(board => board.isStarred);
    } else if (activeTab === 'recent') {
      filtered = [...filtered]
        .sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        })
        .slice(0, 5);
    }
    
    // Then filter by search query
    return filtered
      .filter(board => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          board.title?.toLowerCase().includes(query) ||
          board.description?.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return (a.title || '').localeCompare(b.title || '');
          case 'created':
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          case 'activity':
            return (b.cardsCount || 0) - (a.cardsCount || 0);
          case 'updated':
          default:
            return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
        }
      });
  }, [boards, searchQuery, sortBy, activeTab]);

  // Function to check if user exists
  const checkUserExists = async (email: string): Promise<boolean> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      // Using a GET request to check if user exists
      const response = await fetch(`${apiUrl}/users/check?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) return false;
      
      const data = await response.json();
      return data.exists || false;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  };

  // Function to handle role changes
  const updateMemberRole = async (userId: string, newRole: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${apiUrl}/teams/${team?._id}/members/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: newRole
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update member role');
      }
      
      toast({
        title: "Role Updated",
        description: "Member role has been updated successfully",
        variant: "success"
      });
      
      // Update local team state
      if (team) {
        setTeam({
          ...team,
          members: team.members.map(member => {
            const memberId = typeof member.user === 'string' ? member.user : member.user._id;
            if (memberId === userId) {
              return { ...member, role: newRole as 'owner' | 'admin' | 'member' };
            }
            return member;
          })
        });
      }
      
    } catch (error: any) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : error.message || 'Failed to update member role',
        variant: "destructive"
      });
    }
  };

  // Function to remove a team member
  const removeMember = async (userId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      
      const response = await fetch(`${apiUrl}/teams/${team?._id}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove team member');
      }
      
      toast({
        title: "Member Removed",
        description: "Team member has been removed successfully",
        variant: "success"
      });
      
      // Update local team state
      if (team) {
        setTeam({
          ...team,
          members: team.members.filter(member => {
            const memberId = typeof member.user === 'string' 
              ? member.user : member.user._id;
            return memberId !== userId;
          })
        });
      }
      
    } catch (error: any) {
      console.error('Error removing team member:', error);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : error.message || 'Failed to remove team member',
        variant: "destructive"
      });
    }
  };

  // Main data loading effect
  useEffect(() => {
    let isMounted = true;

    const loadTeam = async () => {
      setLoading(true);
      setError(null);

      try {
        const teamId = params?.id?.toString();
        if (!teamId) throw new Error('Invalid team ID');

        const teamData = await fetchTeam(teamId);
        if (!teamData || !teamData._id) throw new Error('Invalid team data received');

        if (isMounted) {
          setTeam(teamData as unknown as TeamData);
          await fetchTeamBoards(teamData._id);

          // Check if current user is the team owner or admin
          if (user) {
            const ownerId = typeof teamData.owner === 'string'
              ? teamData.owner : teamData.owner._id;
            setIsOwner(user._id === ownerId);
            
            // Check if user is an admin
            const userMember = teamData.members?.find(member => {
              const memberId = typeof member.user === 'string' 
                ? member.user : member.user._id;
              return user._id === memberId;
            });
            
            setIsAdmin(userMember?.role === 'admin' || user._id === ownerId);
          }
        }
      } catch (err: any) {
        console.error('Error loading team:', err);
        if (isMounted) {
          if (err.message?.includes('status code 500')) {
            setError('Server error. The team might not exist or you may not have permission to view it.');
          } else if (err.message?.includes('Authentication required')) {
            setError('You need to be logged in to view this team.');
          } else {
            setError(err.message || 'Failed to load team details');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTeam();
    return () => { isMounted = false; };
  }, [params, router, user]);

  // Handle edit navigation
  const handleEditTeam = () => {
    router.push(`/teams/create?edit=true&id=${team?._id}&name=${encodeURIComponent(team?.name || '')}&description=${encodeURIComponent(team?.description || '')}`);
  };
  
  // Handle refreshing team data
  const handleRefresh = () => {
    if (refreshing || !team?._id) return;
    setRefreshing(true);
    fetchTeamBoards(team._id);
  };

  // Fetch pending invites when membersTab changes or when a new invite is sent
  useEffect(() => {
    if (membersTab === 'pending' && team?._id) {
      fetchPendingInvites();
    }
  }, [membersTab, team?._id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950/40">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-indigo-500 opacity-80 animate-pulse"></div>
              </div>
            </div>
            <p className="mt-6 text-gray-600 dark:text-gray-400">
              Loading team details...
            </p>
            <div className="mt-4 w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    if (
      error.includes('Team not found') ||
      error.includes('has been deleted') ||
      error.includes('Cannot read properties of undefined')
    ) {
      return <TeamNotFound teamId={params?.id?.toString()} message={error} />;
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950/40">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white  shadow-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
            <div className="text-red-500 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Team Loading Error</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
            <div className="flex justify-center space-x-4">
              <Button 
                onClick={() => window.location.reload()}
                variant="default"
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Try Again
              </Button>
              <Button 
                onClick={() => router.push('/teams')}
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Teams
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!team) {
    return <TeamNotFound teamId={params?.id?.toString()} />;
  }

  const avatarStyle = getAvatarStyle(team.name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950/40">
      {/* Futuristic header with parallax effect */}
      <motion.div
        className="sticky top-0 z-40 bg-gradient-to-r from-indigo-600 via-blue-500 to-purple-600 relative overflow-hidden"
        style={{
          opacity: headerOpacity,
          scale: headerScale,
          backdropFilter: `blur(${headerBlur}px)`
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className={styles.gridPattern}></div>
        </div>
        
        {/* Floating geometric shapes for futuristic look */}
        <div className="absolute top-10 -left-10 w-40 h-40 bg-white/5 rounded-full mix-blend-overlay"></div>
        <div className="absolute bottom-0 right-10 w-20 h-20 bg-white/10 rotate-45"></div>
        <div className="absolute bottom-10 left-1/3 w-16 h-16 rounded-full bg-white/5"></div>

        <div className="container mx-auto px-4 py-8 sm:py-10 relative z-10">
          {/* Navigation breadcrumb */}
          <nav className="flex items-center mb-5 sm:mb-8 text-sm text-white/80">
            <Link
              href="/dashboard"
              className="hover:text-white flex items-center transition-colors"
            >
              <Home className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 opacity-70" />
            <Link
              href="/teams"
              className="hover:text-white flex items-center transition-colors"
            >
              <Users className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Teams</span>
            </Link>
            <ChevronRight className="h-4 w-4 mx-2 opacity-70" />
            <span className="text-white font-medium truncate max-w-[120px] sm:max-w-[200px]">
              {team.name}
            </span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            {/* Team avatar with glow effect */}
            <div className="relative">
              <div className={`h-20 w-20 sm:h-24 sm:w-24 rounded-2xl ${avatarStyle.bg} border-2 ${avatarStyle.border} flex items-center justify-center shadow-lg relative z-10`}>
                {team.avatar ? (
                  <img
                    src={team.avatar}
                    alt={team.name}
                    className="h-full w-full object-cover rounded-2xl"
                  />
                ) : (
                  <span className={`text-3xl sm:text-4xl font-bold ${avatarStyle.text}`}>
                    {team.name ? team.name.charAt(0).toUpperCase() : '?'}
                  </span>
                )}
              </div>
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-white/20 rounded-3xl blur-lg z-0"></div>
            </div>

            {/* Team name and details */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                  {team.name || 'Unnamed Team'}
                </h1>

                {/* Team badges */}
                <div className="flex gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                    <Users className="h-3 w-3 mr-1" />
                    {team.members?.length || 0}
                  </span>

                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                    <Layout className="h-3 w-3 mr-1" />
                    {boards.length}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-y-2 gap-x-4 text-white/80">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Created {formatDate(team.createdAt)}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Updated {formatDate(team.updatedAt)}</span>
                </div>
              </div>

              {team.description && (
                <div className="mt-3 max-w-3xl text-white/90 line-clamp-2 sm:line-clamp-none">
                  {team.description}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-3 mt-2 md:mt-0">
              <Sheet open={showMembersSheet} onOpenChange={setShowMembersSheet}>
                <SheetTrigger asChild>
                  <Button className="border border-white/20 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Member</span>
                    <span className="inline sm:hidden">Add</span>
                  </Button>
                </SheetTrigger>
              </Sheet>

              <Link
                href="/teams"
                className="flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Back to Teams</span>
                <span className="inline sm:hidden">Back</span>
              </Link>

              {isOwner && (
                <Button
                  onClick={handleEditTeam}
                  className="bg-white hover:bg-white/90 text-indigo-700"
                >
                  <Edit className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Edit Team</span>
                  <span className="inline sm:hidden">Edit</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Wave effect at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-6 sm:h-12 overflow-hidden">
          <svg className="absolute bottom-0 w-full h-24" preserveAspectRatio="none" viewBox="0 0 1440 54">
            <path fill="currentColor" className="text-gray-50 dark:text-transparent" d="M0 0L60 4.2C120 8.5 240 16.9 360 21.1C480 25.3 600 25.3 720 23.2C840 21.1 960 16.9 1080 12.7C1200 8.5 1320 4.2 1380 2.1L1440 0V54H1380C1320 54 1200 54 1080 54C960 54 840 54 720 54C600 54 480 54 360 54C240 54 120 54 60 54H0V0Z"></path>
          </svg>
        </div>
      </motion.div>

      <div className="container mx-auto px-4">
        {/* Team Quick Stats */}
        {showQuickStats && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 mb-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* Board Count */}
              <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 border border-gray-100 dark:border-gray-700 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mr-4">
                    <Layout className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Boards</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{boards.length}</p>
                  </div>
                </div>
              </div>

              {/* Task Count */}
              <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 border border-gray-100 dark:border-gray-700 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 mr-4">
                    <Clipboard className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Total Tasks</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {teamMetrics.totalTasks}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                        ({Math.round((teamMetrics.completedTasks / teamMetrics.totalTasks) * 100) || 0}% done)
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 border border-gray-100 dark:border-gray-700 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mr-4">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Team Members</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {team.members?.length || 0}
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                        ({teamMetrics.activeMembers} active)
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Tasks per Member */}
              <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-4 border border-gray-100 dark:border-gray-700 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 mr-4">
                    <BarChart2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Tasks per Member</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {teamMetrics.averageTasksPerMember}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hide stats button */}
            <div className="flex justify-center mt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowQuickStats(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <ChevronRight className="h-4 w-4 rotate-90" />
                <span className="text-xs">Hide Stats</span>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Show stats button (if hidden) */}
        {!showQuickStats && (
          <div className="flex justify-center my-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowQuickStats(true)}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <ChevronRight className="h-4 w-4 -rotate-90" />
              <span className="text-xs">Show Stats</span>
            </Button>
          </div>
        )}

        {/* Boards display */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          className="mb-12 mt-6"
        >
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
            {/* Board header */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl sm:text-2xl font-bold flex items-center text-gray-900 dark:text-white">
                  <Layout className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-indigo-500" />
                  Team Boards
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Board filters */}
                  <Tabs 
                    value={activeTab} 
                    onValueChange={setActiveTab}
                    className="hidden sm:flex"
                  >
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="starred">Starred</TabsTrigger>
                      <TabsTrigger value="recent">Recent</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <div className="relative flex-1 sm:flex-none min-w-[200px]">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search boards"
                      className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      aria-label="Search boards"
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setSearchQuery('');
                        }
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Mobile tabs */}
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    className="sm:hidden px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Boards</option>
                    <option value="starred">Starred</option>
                    <option value="recent">Recent</option>
                  </select>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="hidden sm:flex">
                        <ArrowRight className="h-4 w-4 mr-1 rotate-90" />
                        <span>Sort</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setSortBy('updated')} className={sortBy === 'updated' ? "bg-gray-100 dark:bg-gray-800" : ""}>
                        Recently Updated
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('created')} className={sortBy === 'created' ? "bg-gray-100 dark:bg-gray-800" : ""}>
                        Recently Created
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('name')} className={sortBy === 'name' ? "bg-gray-100 dark:bg-gray-800" : ""}>
                        Alphabetical
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy('activity')} className={sortBy === 'activity' ? "bg-gray-100 dark:bg-gray-800" : ""}>
                        Most Active
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View mode toggle */}
                  <div className="hidden sm:flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setViewMode(BoardViewMode.Grid)}
                            className={`p-2 ${viewMode === BoardViewMode.Grid
                              ? 'bg-indigo-500 text-white'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                            aria-label="Grid view"
                          >
                            <Grid3X3 className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Grid view</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setViewMode(BoardViewMode.List)}
                            className={`p-2 ${viewMode === BoardViewMode.List
                              ? 'bg-indigo-500 text-white'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                            aria-label="List view"
                          >
                            <List className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>List view</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setViewMode(BoardViewMode.Compact)}
                            className={`p-2 ${viewMode === BoardViewMode.Compact
                              ? 'bg-indigo-500 text-white'
                              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                            aria-label="Compact view"
                          >
                            <LayoutGrid className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Compact view</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {/* Mobile view toggle */}
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value as BoardViewMode)}
                    className="sm:hidden px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={BoardViewMode.Grid}>Grid</option>
                    <option value={BoardViewMode.List}>List</option>
                    <option value={BoardViewMode.Compact}>Compact</option>
                  </select>

                  {/* Refresh button */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          disabled={refreshing}
                          onClick={handleRefresh}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Refresh boards</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Create board button */}
                  <Button
                    onClick={() => setShowCreateBoard(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">New Board</span>
                    <span className="inline sm:hidden">New</span>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Board content */}
            <div className="p-4 sm:p-6">
              {/* Create board form */}
              <AnimatePresence>
                {showCreateBoard && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create New Board</h3>

                      <div className="space-y-4">
                        <div>
                          <label htmlFor="boardTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Board Name *
                          </label>
                          <input
                            id="boardTitle"
                            type="text"
                            value={newBoardTitle}
                            onChange={(e) => setNewBoardTitle(e.target.value)}
                            placeholder="Enter board name"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="boardDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description (optional)
                          </label>
                          <textarea
                            id="boardDescription"
                            value={newBoardDescription}
                            onChange={(e) => setNewBoardDescription(e.target.value)}
                            placeholder="Enter board description"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-20 resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Board Color
                          </label>
                          <div className="flex items-center space-x-4">
                            <BoardColorSelector 
                              initialColor={selectedBoardColor}
                              onColorChange={(color) => setSelectedBoardColor(color)}
                            />
                            <span className="text-sm text-gray-500">
                              {selectedBoardColor}
                            </span>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Column Color Scheme
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {CARD_COLORS.map(color => (
                              <button
                                key={color.value}
                                type="button"
                                onClick={() => setSelectedColumnColor(color.value)}
                                className={`h-8 w-8 rounded-md ${color.value} ${selectedColumnColor === color.value ? 'ring-2 ring-offset-2 ring-indigo-500' : 'hover:ring-1 hover:ring-indigo-300'
                                  }`}
                                title={color.name}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setShowCreateBoard(false);
                              setNewBoardTitle('');
                              setNewBoardDescription('');
                            }}
                          >
                            Cancel
                          </Button>

                          <Button
                            onClick={handleCreateBoard}
                            disabled={creatingBoard || !newBoardTitle.trim()}
                            className={`${creatingBoard ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            {creatingBoard ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Creating...
                              </>
                            ) : (
                              <>Create Board</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Edit board form */}
              <AnimatePresence>
                {editBoardId && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Edit Board</h3>

                      <div className="space-y-4">
                        <div>
                          <label htmlFor="editBoardTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Board Name *
                          </label>
                          <input
                            id="editBoardTitle"
                            type="text"
                            value={editBoardTitle}
                            onChange={(e) => setEditBoardTitle(e.target.value)}
                            placeholder="Enter board name"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="editBoardDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Description (optional)
                          </label>
                          <textarea
                            id="editBoardDescription"
                            value={editBoardDescription}
                            onChange={(e) => setEditBoardDescription(e.target.value)}
                            placeholder="Enter board description"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white h-20 resize-none"
                          />
                        </div>

                        <div className="flex justify-end space-x-3 pt-2">
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setEditBoardId(null);
                              setEditBoardTitle('');
                              setEditBoardDescription('');
                            }}
                          >
                            Cancel
                          </Button>

                          <Button
                            onClick={handleEditBoard}
                            disabled={editingBoard || !editBoardTitle.trim()}
                            className={`${editingBoard ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            {editingBoard ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Saving...
                              </>
                            ) : (
                              <>Save Changes</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Boards display section */}
              {loadingBoards ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-lg border-2 border-indigo-100 border-t-indigo-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-6 w-6 rounded-md bg-indigo-500 opacity-60 animate-pulse"></div>
                    </div>
                  </div>
                  <p className="mt-4 text-gray-500 dark:text-gray-400">Loading boards...</p>
                </div>
              ) : boardsError ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 mb-3">
                    <XCircle className="h-6 w-6" />
                  </div>
                  <h3 className="text-red-800 dark:text-red-300 font-medium mb-2">Error Loading Boards</h3>
                  <p className="text-red-600 dark:text-red-400 text-sm mb-3">{boardsError}</p>
                  <Button onClick={handleRefresh} variant="outline" className="border-red-300 dark:border-red-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              ) : filteredBoards.length === 0 ? (
                <div className="py-12 text-center">
                  {boards.length === 0 ? (
                    <>
                      <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Layout className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No boards yet</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Start by creating your first board to organize your team&apos;s work
                      </p>
                      <Button 
                        onClick={() => setShowCreateBoard(true)}
                        className="bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Board
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No matching boards</h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Try adjusting your search or filters to find what you&apos;re looking for
                      </p>
                      <Button 
                        onClick={() => {
                          setSearchQuery('');
                          setActiveTab('all');
                          setSortBy('updated');
                        }}
                        variant="outline"
                      >
                        Clear Filters
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  {/* Grid View */}
                  {viewMode === BoardViewMode.Grid && (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="show"
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    >
                      {filteredBoards.map(board => (
                        <motion.div
                          key={board._id}
                          variants={itemVariants}
                          className="group relative"
                        >
                          <BoardCard
                            board={board}
                            formatDate={formatDate}
                            getTaskCount={getTaskCount}
                            onDelete={confirmDeleteBoard}
                            deletingId={deletingBoardId || undefined}
                          />
                          
                          {/* Quick actions overlay (visible on hover) */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-7 w-7 bg-white dark:bg-gray-800 shadow-sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => window.location.href = `/boards/${board._id}`}
                                  className="cursor-pointer"
                                >
                                  <ArrowUpRight className="h-4 w-4 mr-2" />
                                  Open Board
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => startEditingBoard(board)}
                                  className="cursor-pointer"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => confirmDeleteBoard(board._id)}
                                  className="cursor-pointer text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Board
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* List View */}
                  {viewMode === BoardViewMode.List && (
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700">
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Board</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tasks</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Updated</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredBoards.map((board, idx) => (
                              <motion.tr 
                                key={board._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className={`${deletingBoardId === board._id ? 'opacity-60' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/70`}
                              >
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div 
                                      className={`w-10 h-10 rounded-md flex-shrink-0 mr-3 ${board.colorScheme || "bg-gradient-to-r from-blue-600 to-indigo-600"}`}
                                      style={board.backgroundColor?.startsWith('#') ? { backgroundColor: board.backgroundColor } : {}}
                                    ></div>
                                    <div>
                                      <Link
                                        href={`/boards/${board._id}`}
                                        className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                                      >
                                        {board.title || board.name || "Untitled"}
                                      </Link>
                                      {board.description && (
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                                          {board.description}
                                        </div>
                                      )}
                                    </div>
                                    {board.isStarred && (
                                      <Star className="h-4 w-4 ml-2 text-amber-400 fill-amber-400" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {getTaskCount(board)} tasks
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {formatDate(board.updatedAt)}
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex justify-end gap-2">
                                    <Link href={`/boards/${board._id}`}>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/30"
                                      >
                                        Open
                                      </Button>
                                    </Link>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => startEditingBoard(board)}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => confirmDeleteBoard(board._id)}
                                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                      disabled={Boolean(deletingBoardId)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Compact View */}
                  {viewMode === BoardViewMode.Compact && (
                    <div className="space-y-3">
                      {filteredBoards.map((board, idx) => (
                        <motion.div
                          key={board._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className={`${deletingBoardId === board._id ? 'opacity-60' : ''} bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow`}
                        >
                          <div className="flex items-center p-3">
                            <div 
                              className={`w-3 h-full rounded-l-lg mr-3 ${board.colorScheme || "bg-gradient-to-r from-blue-600 to-indigo-600"}`}
                              style={board.backgroundColor?.startsWith('#') ? { backgroundColor: board.backgroundColor } : {}}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/boards/${board._id}`}
                                className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center"
                              >
                                {board.title || board.name || "Untitled"}
                                {board.isStarred && (
                                  <Star className="h-3.5 w-3.5 ml-2 text-amber-400 fill-amber-400" />
                                )}
                              </Link>
                              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <div className="flex items-center">
                                  <LucideClock className="h-3 w-3 mr-1" />
                                  {formatDate(board.updatedAt)}
                                </div>
                                <div className="flex items-center">
                                  <Layout className="h-3 w-3 mr-1" />
                                  {getTaskCount(board)} tasks
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Link href={`/boards/${board._id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 bg-transparent border-gray-200 dark:border-gray-700"
                                >
                                  Open
                                </Button>
                              </Link>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => startEditingBoard(board)}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => confirmDeleteBoard(board._id)}
                                    className="cursor-pointer text-red-600 focus:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Board
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Members Sheet */}
      <Sheet open={showMembersSheet} onOpenChange={setShowMembersSheet}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Team Members
            </SheetTitle>
            <SheetDescription>
              View team members or invite new people to join this team.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6">
            {/* Invite member form */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-3">
                Invite New Members
              </h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="inviteEmail" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    ref={inviteEmailRef}
                    id="inviteEmail"
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && validateEmail(newMemberEmail)) {
                        e.preventDefault();
                        handleInviteMember();
                      }
                    }}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    You can invite multiple people by sending invitations one by one
                  </p>
                </div>
                <div>
                  <label htmlFor="memberRole" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Role
                  </label>
                  <select
                    id="memberRole"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as 'member' | 'admin')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Admins can manage team settings and members
                  </p>
                </div>
                <Button
                  onClick={handleInviteMember}
                  disabled={invitingMember || !newMemberEmail.trim() || !validateEmail(newMemberEmail)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {invitingMember ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Adding Member...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Members list */}
            <Tabs defaultValue="active" value={membersTab} onValueChange={setMembersTab}>
              <TabsList className="mb-4 grid grid-cols-2">
                <TabsTrigger value="active">Active Members</TabsTrigger>
                <TabsTrigger value="pending">Pending Invites</TabsTrigger>
              </TabsList>
              
              <TabsContent value="active">
                <div className="space-y-3">
                  {team.members?.length ? (
                    team.members.map((member) => {
                      const userData = getUserData(member);
                      const avatarStyle = getAvatarStyle(userData.name);
                      const isCurrentUser = user && user._id === userData.id;
                      const isTeamOwner = typeof team.owner === 'string' 
                        ? team.owner === userData.id 
                        : team.owner._id === userData.id;
                      
                      return (
                        <div 
                          key={userData.id} 
                          className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="flex items-center">
                            <div className={`h-10 w-10 rounded-full ${avatarStyle.bg} flex items-center justify-center mr-3`}>
                              {userData.image ? (
                                <img 
                                  src={userData.image} 
                                  alt={userData.name}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className={`text-lg font-semibold ${avatarStyle.text}`}>
                                  {userData.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {userData.name}
                                {isCurrentUser && <span className="ml-2 text-xs text-gray-500">(You)</span>}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {userData.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <Badge
                              variant={
                                member.role === 'owner' 
                                  ? 'default' 
                                  : member.role === 'admin' 
                                    ? 'secondary' 
                                    : 'outline'
                              }
                              className={
                                member.role === 'owner'
                                  ? 'bg-blue-500'
                                  : member.role === 'admin'
                                    ? 'bg-purple-500'
                                    : ''
                              }
                            >
                              {member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member'}
                            </Badge>
                            
                            {(isOwner || isAdmin) && !isTeamOwner && !isCurrentUser && (
                              <div className="flex ml-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeMember(userData.id)}
                                        className="h-8 w-8 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Remove member</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                {isOwner && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="ml-1 h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {member.role !== 'admin' && (
                                        <DropdownMenuItem onClick={() => updateMemberRole(userData.id, 'admin')}>
                                          <Shield className="h-4 w-4 mr-2 text-purple-500" /> 
                                          Promote to Admin
                                        </DropdownMenuItem>
                                      )}
                                      {member.role === 'admin' && (
                                        <DropdownMenuItem onClick={() => updateMemberRole(userData.id, 'member')}>
                                          <Users className="h-4 w-4 mr-2 text-blue-500" />
                                          Change to Member
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">No team members yet</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="pending">
                {loadingInvites ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : pendingInvites.length > 0 ? (
                  <div className="space-y-3">
                    {pendingInvites.map((invite, index) => (
                      <div 
                        key={invite.id || invite._id || index}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-3">
                            <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {invite.email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Sent {formatDate(invite.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Badge variant="outline" className="bg-amber-100/30 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                            Pending
                          </Badge>
                          {isOwner && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-2 text-red-500"
                              onClick={async () => {
                                // Implement cancel invitation functionality
                                try {
                                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                                  
                                  const response = await fetch(`${apiUrl}/teams/${team?._id}/invitations/${invite.id || invite._id}`, {
                                    method: 'DELETE',
                                    headers: {
                                      'Authorization': `Bearer ${accessToken}`,
                                      'Content-Type': 'application/json'
                                    }
                                  });
                                  
                                  if (response.ok) {
                                    toast({
                                      title: "Invitation Cancelled",
                                      description: `Invitation to ${invite.email} has been cancelled`,
                                      variant: "success"
                                    });
                                    
                                    // Remove from list
                                    setPendingInvites(pendingInvites.filter(i => 
                                      (i.id !== invite.id) && (i._id !== invite._id)
                                    ));
                                  } else {
                                    throw new Error('Failed to cancel invitation');
                                  }
                                } catch (error: any) {
                                  toast({
                                    title: "Error",
                                    description: error.message || "Failed to cancel invitation",
                                    variant: "destructive"
                                  });
                                }
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                      <Mail className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">No pending invitations</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Board Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this board? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => boardToDelete && handleDeleteBoard(boardToDelete)}
            >
              Delete Board
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamDetailsPage;
