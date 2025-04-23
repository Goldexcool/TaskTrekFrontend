/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Layers, CheckSquare, 
  Settings, HelpCircle, PlusCircle, Calendar, X
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { fetchTeams } from '../store/teamService';
import { Board } from '../store/boardService';

type NavItemType = {
  name: string;
  href: string;
  icon: React.ElementType;
  count?: number;
};

type NavSectionType = {
  title?: string;
  items: NavItemType[];
};

const navigation: NavSectionType[] = [
  {
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Boards', href: '/boards', icon: Layers },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare },
      { name: 'Teams', href: '/teams', icon: Users },
      { name: 'Calendar', href: '/calendar', icon: Calendar },
    ],
  },
];

// Sidebar component for desktop and mobile
const Sidebar: React.FC<{
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}> = ({ isOpen = true, onClose, className = '' }) => {
  const pathname = usePathname();
  const [teamsExpanded, setTeamsExpanded] = useState(true);
  const [boardsExpanded, setBoardsExpanded] = useState(true);
  const [teams, setTeams] = useState<any[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBoards, setLoadingBoards] = useState(true);
  
  const { user } = useAuthStore();

  // Load teams from API
  useEffect(() => {
    const loadTeams = async () => {
      setLoading(true);
      try {
        const response = await fetchTeams();

        if (response && typeof response === 'object') {
          if ('success' in response && response.success && 'data' in response) {
            if (Array.isArray(response.data)) {
              setTeams(response.data);
            } else {
              setTeams([]);
            }
          } else if (Array.isArray(response)) {
            setTeams(response);
          } else {
            setTeams([]);
          }
        } else {
          setTeams([]);
        }
      } catch (error) {
        console.error('Failed to load teams:', error);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    loadTeams();
  }, []);

  // Load boards from API
  useEffect(() => {
    const fetchBoards = async () => {
      setLoadingBoards(true);
      try {
        if (!user) {
          setBoards([]);
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
        const { accessToken } = useAuthStore.getState();

        if (!accessToken) {
          setBoards([]);
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
          _id: board._id || board.id || Date.now().toString(),
          title: board.title || board.name || 'Untitled Board',
          description: board.description || '',
          columns: Array.isArray(board.columns) ? board.columns : []
        }));

        setBoards(processedBoards);
      } catch (error) {
        console.error('Error fetching boards:', error);
        setBoards([]);
      } finally {
        setLoadingBoards(false);
      }
    };

    fetchBoards();
  }, [user]);

  // Handler for clicks on links in mobile view
  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (onClose && window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${className}`}
    >
      {/* Mobile sidebar close button */}
      <button 
        onClick={onClose}
        className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Sidebar header with logo */}
      <div className="px-4 py-5 flex items-center border-b border-gray-200 dark:border-gray-800">
        <div className="h-8 w-8 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold mr-2">
          TT
        </div>
        <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
          TaskTrek
        </span>
      </div>

      {/* Create new button */}
      <div className="px-4 pt-6 pb-2">
        <Link href="/boards/create">
          <button
            type="button"
            onClick={handleLinkClick}
            className="w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Create New Board
          </button>
        </Link>
      </div>

      <nav className="flex-1 px-2 py-4 overflow-y-auto scrollbar-hide">
        {navigation.map((section, sectionIdx) => (
          <div key={sectionIdx} className="mb-6">
            {section.title && (
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="mt-2 space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    pathname === item.href || pathname?.startsWith(item.href + '/')
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      pathname === item.href || pathname?.startsWith(item.href + '/')
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.count && (
                    <span className={`ml-3 inline-block py-0.5 px-2 text-xs rounded-full ${
                      pathname === item.href || pathname?.startsWith(item.href + '/')
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}

        {/* Teams section - using API data */}
        <div className="mb-6">
          <button
            onClick={() => setTeamsExpanded(!teamsExpanded)}
            className="px-3 flex items-center justify-between w-full text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            <span>My Teams</span>
            <div className="flex items-center">
              {loading && <div className="h-2 w-2 bg-gray-500 animate-pulse rounded-full mr-2"></div>}
              {teamsExpanded ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          </button>
          {teamsExpanded && (
            <div className="mt-2 space-y-1">
              {loading ? (
                <div className="px-3 py-2 text-sm text-gray-400">Loading teams...</div>
              ) : teams.length > 0 ? (
                teams.map((team) => (
                  <Link
                    key={team._id || team.id}
                    href={`/teams/${team._id || team.id}`}
                    onClick={handleLinkClick}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      pathname === `/teams/${team._id || team.id}` || pathname?.startsWith(`/teams/${team._id || team.id}/`)
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Users className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400" aria-hidden="true" />
                    <span className="flex-1 truncate">{team.name}</span>
                  </Link>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-400">No teams found</div>
              )}
              <Link
                href="/teams/create"
                onClick={handleLinkClick}
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800"
              >
                <PlusCircle className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-green-600 dark:text-gray-400 dark:group-hover:text-green-400" aria-hidden="true" />
                <span className="flex-1 text-green-600 dark:text-green-400">Add new team</span>
              </Link>
            </div>
          )}
        </div>

        {/* Boards section - using API data */}
        <div className="mb-6">
          <button
            onClick={() => setBoardsExpanded(!boardsExpanded)}
            className="px-3 flex items-center justify-between w-full text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            <span>My Boards</span>
            <div className="flex items-center">
              {loadingBoards && <div className="h-2 w-2 bg-gray-500 animate-pulse rounded-full mr-2"></div>}
              {boardsExpanded ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          </button>
          {boardsExpanded && (
            <div className="mt-2 space-y-1">
              {loadingBoards ? (
                <div className="px-3 py-2 text-sm text-gray-400">Loading boards...</div>
              ) : boards.length > 0 ? (
                boards.map((board) => (
                  <Link
                    key={board._id}
                    href={`/boards/${board._id}`}
                    onClick={handleLinkClick}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      pathname === `/boards/${board._id}` || pathname?.startsWith(`/boards/${board._id}/`)
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Layers className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400" aria-hidden="true" />
                    <span className="flex-1 truncate">{board.title}</span>
                  </Link>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-400">No boards found</div>
              )}
              <Link
                href="/boards/create"
                onClick={handleLinkClick}
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800"
              >
                <PlusCircle className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-green-600 dark:text-gray-400 dark:group-hover:text-green-400" aria-hidden="true" />
                <span className="flex-1 text-green-600 dark:text-green-400">Add new board</span>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Sidebar footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="space-y-1">
          <Link
            href="/settings"
            onClick={handleLinkClick}
            className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800"
          >
            <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400" aria-hidden="true" />
            <span>Settings</span>
          </Link>
          <Link
            href="/help"
            onClick={handleLinkClick}
            className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800"
          >
            <HelpCircle className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400" aria-hidden="true" />
            <span>Help & Support</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;