/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { 
  Plus, Search, Grid, List, Clipboard, RefreshCcw, 
  ChevronDown, Clock, Star, Sparkles, Terminal, 
  Sliders, X, Filter, HelpCircle
} from 'lucide-react';

// Import components
import BoardCard from '../components/BoardCard';
import AppLayout from '../components/AppLayout';
import { Button } from '../components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Badge } from '../components/ui/badge';
import { useToast } from '../components/ui/use-toast';

// Import utils and store
import { cn } from '../lib/utils';
import useAuthStore from '../store/useAuthStore';

// Import Board type from types
import { Board } from '../types/board';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { 
    opacity: 1, 
    transition: { 
      staggerChildren: 0.06,
      when: "beforeChildren"
    } 
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 120, damping: 12 }
  },
  exit: { 
    opacity: 0, 
    y: -10, 
    transition: { duration: 0.2 }
  }
};

const fadeInUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

// Interface for API response
interface BoardsApiResponse {
  success: boolean;
  count: number;
  data: Board[];
}

// Sort options
enum SortOption {
  NEWEST = "newest",
  OLDEST = "oldest",
  ALPHABETICAL = "alphabetical",
  MOST_TASKS = "mostTasks"
}

function BoardsContent() {
  const { toast } = useToast();
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>(SortOption.NEWEST);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const { accessToken } = useAuthStore();
  const [showFilters, setShowFilters] = useState(false);
  const [showHelpTips, setShowHelpTips] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  
  // Theme settings
  const [glassmorphism, setGlassmorphism] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);

  // Fetch boards on component mount
  useEffect(() => {
    const fetchBoards = async () => {
      if (!accessToken) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        
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
        
        // Handle different response formats
        let boardsData: any[] = [];
        
        if (Array.isArray(result)) {
          boardsData = result;
        } else if (result && result.success && Array.isArray(result.data)) {
          boardsData = result.data;
        } else if (result && result.boards && Array.isArray(result.boards)) {
          boardsData = result.boards;
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
        
        setBoards(processedBoards);
      } catch (error) {
        console.error('Error fetching boards:', error);
        toast({
          title: "Failed to load boards",
          description: error instanceof Error ? error.message : "Please try again later",
          variant: "destructive"
        });
        setBoards([]); 
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchBoards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // Refresh boards data
  const refreshBoards = () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    
    const fetchBoards = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        
        const response = await fetch(`${apiUrl}/boards/complete`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        
        if (!response.ok) throw new Error(`Failed to refresh boards: ${response.status}`);
        
        const result = await response.json();
        
        let boardsData: any[] = [];
        
        if (Array.isArray(result)) {
          boardsData = result;
        } else if (result && result.success && Array.isArray(result.data)) {
          boardsData = result.data;
        } else if (result && result.boards && Array.isArray(result.boards)) {
          boardsData = result.boards;
        }
        
        const processedBoards: Board[] = boardsData.map(board => ({
          ...board,
          _id: board._id || board.id || Date.now().toString(),
          title: board.title || board.name || 'Untitled Board',
          description: board.description || '',
          columns: Array.isArray(board.columns) ? board.columns : []
        }));
        
        setBoards(processedBoards);
        
        toast({
          title: "Boards refreshed",
          variant: "success"
        });
      } catch (error) {
        console.error('Error refreshing boards:', error);
        toast({
          title: "Failed to refresh",
          variant: "destructive"
        });
      } finally {
        setIsRefreshing(false);
      }
    };
    
    fetchBoards();
  };

  // Handle creating a new board
  const handleCreateBoard = () => {
    window.location.href = '/boards/new';
  };

  // Handle deleting a board
  const handleDeleteBoard = async (boardId: string) => {
    try {
      setDeletingBoardId(boardId);
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const response = await fetch(`${apiUrl}/api/boards/${boardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete board: ${response.status}`);
      }
      
      // Remove board from state
      setBoards(prev => prev.filter(board => board._id !== boardId));
      
      toast({
        title: "Board deleted",
        variant: "success"
      });
    } catch (error) {
      console.error('Error deleting board:', error);
      toast({
        title: "Failed to delete board",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setDeletingBoardId(null);
    }
  };

  // Filter and sort boards based on active filters
  const getFilteredAndSortedBoards = () => {
    if (!Array.isArray(boards)) return [];
    
    // First, filter the boards
    let filtered = [...boards];
    
    // Filter by tab
    if (activeTab === "starred") {
      filtered = filtered.filter(board => board.isStarred);
    } else if (activeTab === "recent") {
      // Sort by most recently updated and take first 5
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return dateB - dateA;
      }).slice(0, 5);
    }
    
    // Filter by search query
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(board => 
        board.title?.toLowerCase().includes(query) || 
        board.description?.toLowerCase().includes(query)
      );
    }
    
    // Filter by starred status (if set)
    if (showStarredOnly) {
      filtered = filtered.filter(board => board.isStarred);
    }
    
    // Then, sort the filtered results
    switch (sortOption) {
      case SortOption.NEWEST:
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case SortOption.OLDEST:
        filtered.sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateA - dateB;
        });
        break;
      case SortOption.ALPHABETICAL:
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case SortOption.MOST_TASKS:
        filtered.sort((a, b) => (b.totalTasks || b.cardsCount || 0) - (a.totalTasks || a.cardsCount || 0));
        break;
    }
    
    return filtered;
  };

  // Get stats for the boards
  const getBoardsStats = () => {
    if (!Array.isArray(boards) || boards.length === 0) return null;
    
    const totalCount = boards.length;
    const starredCount = boards.filter(board => board.isStarred).length;
    const totalTasks = boards.reduce((sum, board) => sum + (board.totalTasks || board.cardsCount || 0), 0);
    
    return { totalCount, starredCount, totalTasks };
  };

  // Board stats
  const boardsStats = getBoardsStats();
  
  // Filtered and sorted boards
  const filteredBoards = getFilteredAndSortedBoards();

  // Focus search with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show login prompt if not authenticated
  if (!accessToken && !isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
            <div className="mb-4 p-4 bg-blue-100/30 dark:bg-blue-900/30 rounded-full backdrop-blur-sm">
              <Terminal className="h-12 w-12 text-blue-500 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-medium mb-3 text-blue-600 dark:text-blue-400">Authentication Required</h2>
            <p className="mb-8 text-center max-w-md text-lg">
              You need to be logged in to view and manage your boards
            </p>
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700">
                Login to Continue
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={cn(
        "min-h-screen pb-12 transition-colors duration-300",
        glassmorphism ? "bg-gradient-to-br from-blue-50/80 via-slate-50/80 to-indigo-50/80 dark:from-gray-900/80 dark:via-slate-900/80 dark:to-blue-950/80" : 
                       "bg-white dark:bg-gray-900"
      )}>
        {/* Background elements */}
        {glassmorphism && (
          <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
            <div className="absolute top-12 -left-32 w-96 h-96 bg-purple-200 dark:bg-purple-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-30"></div>
            <div className="absolute top-1/3 -right-20 w-80 h-80 bg-blue-200 dark:bg-blue-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-30"></div>
            <div className="absolute bottom-20 left-40 w-72 h-72 bg-indigo-300 dark:bg-indigo-900/30 rounded-full mix-blend-multiply filter blur-2xl opacity-20 dark:opacity-30"></div>
          </div>
        )}
        
        <div className="container mx-auto px-4 py-6">
          {/* Page header with 3D-like depth */}
          <div className="flex flex-col gap-2 mb-8 relative">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">My Boards</span>
                </h1>
                
                {boardsStats && (
                  <Badge variant="outline" className={cn(
                    "ml-2 text-xs px-2 py-0.5 border rounded-full", 
                    glassmorphism ? "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm" : ""
                  )}>
                    {boardsStats.totalCount} {boardsStats.totalCount === 1 ? 'board' : 'boards'}
                  </Badge>
                )}
                
                {isRefreshing ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse flex items-center">
                    <RefreshCcw className="h-3 w-3 mr-1 animate-spin" /> Refreshing...
                  </span>
                ) : (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="rounded-full p-1 h-auto" 
                          onClick={refreshBoards}
                        >
                          <RefreshCcw className="h-4 w-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Refresh boards</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className={cn(
                          "rounded-full transition-all", 
                          showHelpTips ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400" : ""
                        )}
                        onClick={() => setShowHelpTips(!showHelpTips)}
                      >
                        <HelpCircle className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Toggle help tips</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full"
                    >
                      <Sliders className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={cn(
                    "w-56", 
                    glassmorphism && "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-gray-200/80 dark:border-gray-800/80"
                  )}>
                    <div className="px-2 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">
                      Display Settings
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="flex justify-between cursor-pointer"
                      onClick={() => setGlassmorphism(!glassmorphism)}
                    >
                      <span>Glassmorphism</span>
                      <span className={`ml-2 h-4 w-4 rounded-full ${glassmorphism ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex justify-between cursor-pointer"
                      onClick={() => setShowAnimation(!showAnimation)}
                    >
                      <span>Animations</span>
                      <span className={`ml-2 h-4 w-4 rounded-full ${showAnimation ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  onClick={handleCreateBoard}
                  className={cn(
                    "font-medium flex items-center", 
                    glassmorphism ? 
                      "bg-white/20 hover:bg-white/30 text-blue-600 border border-blue-200 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 dark:text-blue-400 dark:border-blue-800/50 backdrop-blur-sm" : 
                      "bg-blue-600 hover:bg-blue-700 text-white"
                  )}
                >
                  <Plus className="mr-1 h-4 w-4" /> New Board
                </Button>
              </div>
            </motion.div>
            
            {/* Help tips */}
            <AnimatePresence>
              {showHelpTips && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className={cn(
                    "mt-4 p-3 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2",
                    glassmorphism ? 
                      "bg-blue-50/70 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-200/50 dark:border-blue-800/50" :
                      "bg-blue-50 dark:bg-blue-900/50"
                  )}>
                    <Sparkles className="h-4 w-4 flex-shrink-0" />
                    <p>
                      <span className="font-medium">Pro Tip:</span> Press{" "}
                      <kbd className="px-1.5 py-0.5 text-xs font-semibold rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-sm">
                        Ctrl
                      </kbd>{" "}
                      +{" "}
                      <kbd className="px-1.5 py-0.5 text-xs font-semibold rounded bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-sm">
                        K
                      </kbd>{" "}
                      to quickly search your boards.
                    </p>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="ml-auto p-1 h-6 w-6 rounded-full"
                      onClick={() => setShowHelpTips(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Tabs and filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "mb-6 rounded-xl",
              glassmorphism && "bg-white/30 dark:bg-gray-800/30 border border-white/50 dark:border-gray-700/50 backdrop-blur-md shadow-sm p-4"
            )}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList className={cn(
                  "h-9",
                  glassmorphism && "bg-white/40 dark:bg-gray-800/40"
                )}>
                  <TabsTrigger value="all" className="text-xs sm:text-sm">
                    All Boards
                  </TabsTrigger>
                  <TabsTrigger value="starred" className="text-xs sm:text-sm flex items-center">
                    <Star className="w-3.5 h-3.5 mr-1" />
                    Starred
                    {boardsStats?.starredCount ? (
                      <Badge className="ml-1.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{boardsStats.starredCount}</Badge>
                    ) : null}
                  </TabsTrigger>
                  <TabsTrigger value="recent" className="text-xs sm:text-sm">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    Recent
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className={cn(
                  "relative flex-grow",
                  isSearchFocused && glassmorphism && "ring-1 ring-blue-400 dark:ring-blue-500"
                )}>
                  <Search className={cn(
                    "absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 transition-colors",
                    isSearchFocused ? "text-blue-500" : "text-gray-400 dark:text-gray-500"
                  )} />
                  <input
                    ref={searchRef}
                    type="text"
                    placeholder="Search boards... (Ctrl+K)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    className={cn(
                      "pl-10 pr-4 py-2 w-full rounded-lg text-sm border",
                      glassmorphism ? 
                        "bg-white/50 dark:bg-gray-800/50 border-gray-200/70 dark:border-gray-700/70 backdrop-blur-sm focus:bg-white/70 dark:focus:bg-gray-800/70" : 
                        "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    )}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <DropdownMenu open={showSortDropdown} onOpenChange={setShowSortDropdown}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={cn(
                          "text-xs flex items-center",
                          glassmorphism && "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm",
                          showSortDropdown && "border-blue-300 dark:border-blue-700 ring-1 ring-blue-500/30"
                        )}
                      >
                        <Filter className="mr-1 h-3.5 w-3.5" />
                        Sort
                        <ChevronDown className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={cn(
                      glassmorphism && "bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg"
                    )}>
                      <DropdownMenuItem 
                        onClick={() => setSortOption(SortOption.NEWEST)}
                        className={sortOption === SortOption.NEWEST ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : ""}
                      >
                        Newest First
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSortOption(SortOption.OLDEST)}
                        className={sortOption === SortOption.OLDEST ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : ""}
                      >
                        Oldest First
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSortOption(SortOption.ALPHABETICAL)}
                        className={sortOption === SortOption.ALPHABETICAL ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : ""}
                      >
                        Alphabetical
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSortOption(SortOption.MOST_TASKS)}
                        className={sortOption === SortOption.MOST_TASKS ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : ""}
                      >
                        Most Tasks
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  <div className={cn(
                    "flex rounded-lg overflow-hidden border",
                    glassmorphism ? "bg-white/50 dark:bg-gray-800/50 border-gray-200/70 dark:border-gray-700/70 backdrop-blur-sm" : 
                                  "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                  )}>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                              "p-2",
                              viewMode === 'grid' 
                                ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                          >
                            <Grid className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Grid view</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                              "p-2",
                              viewMode === 'list' 
                                ? "bg-blue-100/70 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                          >
                            <List className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>List view</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Loading state */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-500 dark:text-gray-400 animate-pulse">Loading your boards...</p>
            </div>
          ) : (
            <>
              {/* Empty state */}
              {filteredBoards.length === 0 ? (
                <motion.div 
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  className={cn(
                    "flex flex-col items-center justify-center py-16 mx-auto max-w-md text-center rounded-xl",
                    glassmorphism && "bg-white/20 dark:bg-gray-800/20 border border-white/30 dark:border-gray-700/30 backdrop-blur-sm shadow-sm"
                  )}
                >
                  <div className={cn(
                    "w-16 h-16 mb-4 flex items-center justify-center rounded-full", 
                    glassmorphism ? "bg-white/40 dark:bg-gray-700/40" : "bg-gray-100 dark:bg-gray-800"
                  )}>
                    {boards.length === 0 ? (
                      <Clipboard className="h-8 w-8 text-blue-500/80 dark:text-blue-400/80" />
                    ) : (
                      <Search className="h-8 w-8 text-blue-500/80 dark:text-blue-400/80" />
                    )}
                  </div>
                  {boards.length === 0 ? (
                    <>
                      <h2 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">Create your first board</h2>
                      <p className="mb-8 text-gray-500 dark:text-gray-400">Get started organizing your tasks with a new board</p>
                      <Button 
                        onClick={handleCreateBoard}
                        className={cn(
                          "font-medium",
                          glassmorphism ? 
                            "bg-white/20 hover:bg-white/30 text-blue-600 border border-blue-200 dark:bg-blue-600/20 dark:hover:bg-blue-600/30 dark:text-blue-400 dark:border-blue-800/50 backdrop-blur-sm" : 
                            "bg-blue-600 hover:bg-blue-700 text-white"
                        )}
                      >
                        <Plus className="mr-2 h-4 w-4" /> Create Board
                      </Button>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-medium mb-2 text-gray-900 dark:text-white">No matching boards</h2>
                      <p className="text-gray-500 dark:text-gray-400">
                        Try adjusting your search or filters to find what you&apos;re looking for
                      </p>
                    </>
                  )}
                </motion.div>
              ) : (
                <>
                  {/* Grid or List view */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={viewMode}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {viewMode === 'grid' ? (
                        <motion.div
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                          variants={showAnimation ? containerVariants : {}}
                          initial={showAnimation ? "hidden" : false}
                          animate={showAnimation ? "show" : false}
                        >
                          {filteredBoards.map(board => (
                            <motion.div
                              key={board._id}
                              variants={showAnimation ? itemVariants : {}}
                              className="h-full"
                              layout={showAnimation}
                              exit={showAnimation ? "exit" : undefined}
                            >
                              <BoardCard
                                board={board}
                                formatDate={(date?: string) => date 
                                  ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) 
                                  : 'No date'
                                }
                                getTaskCount={(board: Board) => board.totalTasks || board.cardsCount || 0}
                                onDelete={handleDeleteBoard}
                                deletingId={deletingBoardId || undefined}
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : (
                        <div className={cn(
                          "overflow-hidden rounded-xl",
                          glassmorphism ? "bg-white/50 dark:bg-gray-800/50 border border-white/30 dark:border-gray-700/30 backdrop-blur-sm" :
                                        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        )}>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className={glassmorphism ? 
                                  "bg-white/30 dark:bg-gray-900/30 border-b border-gray-200/70 dark:border-gray-700/70" : 
                                  "bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"}>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Board</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tasks</th>
                                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Updated</th>
                                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200/70 dark:divide-gray-700/70">
                                {filteredBoards.map((board, idx) => (
                                  <motion.tr 
                                    key={board._id}
                                    initial={showAnimation ? { opacity: 0, y: 10 } : false}
                                    animate={showAnimation ? { opacity: 1, y: 0 } : false}
                                    transition={{ delay: idx * 0.03 }}
                                    className={deletingBoardId === board._id ? "opacity-50" : ""}
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded flex-shrink-0 mr-3 ${
                                          board.colorScheme?.split(' ')[0] || 
                                          (board.backgroundColor?.startsWith('#') 
                                            ? '' 
                                            : board.backgroundColor || 'bg-gradient-to-r from-blue-600 to-indigo-600')
                                        }`}
                                        style={board.backgroundColor?.startsWith('#') 
                                          ? { backgroundColor: board.backgroundColor } 
                                          : {}}
                                        ></div>
                                        <div className="flex items-center">
                                          <Link href={`/boards/${board._id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                                            {board.title}
                                          </Link>
                                          {board.isStarred && (
                                            <Star className="ml-2 h-3.5 w-3.5 text-amber-400 dark:text-amber-300 fill-amber-400 dark:fill-amber-300" />
                                          )}
                                        </div>
                                      </div>
                                      {board.description && (
                                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                                          {board.description}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                      {board.totalTasks || board.cardsCount || 0} tasks
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                      {board.updatedAt ? (
                                        new Date(board.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                      ) : 'No date'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => window.location.href = `/boards/${board._id}`}
                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-2"
                                      >
                                        Open
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => handleDeleteBoard(board._id)}
                                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                        disabled={deletingBoardId === board._id}
                                      >
                                        {deletingBoardId === board._id ? 'Deleting...' : 'Delete'}
                                      </Button>
                                    </td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

// Wrap with Suspense for proper SSR behavior
export default function BoardsPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>}>
      <BoardsContent />
    </Suspense>
  );
}