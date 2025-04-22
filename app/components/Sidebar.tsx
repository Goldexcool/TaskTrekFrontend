'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, Users, Layers, CheckSquare, 
  Star, Settings, HelpCircle, PlusCircle,
  Calendar, Clock, ChevronDown, ChevronRight, X
} from 'lucide-react';

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

// Mock data for teams and boards
const teamsList = [
  { id: 1, name: 'Marketing Team' },
  { id: 2, name: 'Development' },
  { id: 3, name: 'Design Team' },
];

const boardsList = [
  { id: 1, name: 'Website Redesign', teamId: 3 },
  { id: 2, name: 'Q2 Marketing Plan', teamId: 1 },
  { id: 3, name: 'API Integration', teamId: 2 },
  { id: 4, name: 'Mobile App UI', teamId: 3 },
];

const navigation: NavSectionType[] = [
  {
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'My Tasks', href: '/tasks', icon: CheckSquare, count: 5 },
      { name: 'Upcoming', href: '/upcoming', icon: Calendar, count: 3 },
      { name: 'Recent', href: '/recent', icon: Clock },
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
  const [favoritesExpanded, setFavoritesExpanded] = useState(true);

  return (
    <div 
      className={`fixed inset-y-0 left-0 z-40 flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${className}`}
    >
      {/* Mobile sidebar close button */}
      <button 
        onClick={onClose}
        className="md:hidden absolute right-4 top-4 text-gray-500 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-300"
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
        <button
          type="button"
          className="w-full flex items-center justify-center py-2.5 px-4 text-sm font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Create New
        </button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
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
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    pathname === item.href
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      pathname === item.href
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.name}</span>
                  {item.count && (
                    <span className={`ml-3 inline-block py-0.5 px-2 text-xs rounded-full ${
                      pathname === item.href
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

        {/* Favorites section */}
        <div className="mb-6">
          <button
            onClick={() => setFavoritesExpanded(!favoritesExpanded)}
            className="px-3 flex items-center justify-between w-full text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            <span>Favorites</span>
            {favoritesExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {favoritesExpanded && (
            <div className="mt-2 space-y-1">
              <Link
                href="/boards/1"
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800"
              >
                <Star className="mr-3 h-5 w-5 flex-shrink-0 text-yellow-500" aria-hidden="true" />
                <span className="flex-1">Website Redesign</span>
              </Link>
              <Link
                href="/boards/2"
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800"
              >
                <Star className="mr-3 h-5 w-5 flex-shrink-0 text-yellow-500" aria-hidden="true" />
                <span className="flex-1">Q2 Marketing Plan</span>
              </Link>
            </div>
          )}
        </div>

        {/* Teams section */}
        <div className="mb-6">
          <button
            onClick={() => setTeamsExpanded(!teamsExpanded)}
            className="px-3 flex items-center justify-between w-full text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            <span>Teams</span>
            {teamsExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {teamsExpanded && (
            <div className="mt-2 space-y-1">
              {teamsList.map((team) => (
                <Link
                  key={team.id}
                  href={`/teams/${team.id}`}
                  className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800"
                >
                  <Users className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400" aria-hidden="true" />
                  <span className="flex-1">{team.name}</span>
                </Link>
              ))}
              <Link
                href="/teams/create"
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800"
              >
                <PlusCircle className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-green-600 dark:text-gray-400 dark:group-hover:text-green-400" aria-hidden="true" />
                <span className="flex-1 text-green-600 dark:text-green-400">Add new team</span>
              </Link>
            </div>
          )}
        </div>

        {/* Boards section */}
        <div className="mb-6">
          <button
            onClick={() => setBoardsExpanded(!boardsExpanded)}
            className="px-3 flex items-center justify-between w-full text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
          >
            <span>Boards</span>
            {boardsExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {boardsExpanded && (
            <div className="mt-2 space-y-1">
              {boardsList.map((board) => (
                <Link
                  key={board.id}
                  href={`/boards/${board.id}`}
                  className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800"
                >
                  <Layers className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400" aria-hidden="true" />
                  <span className="flex-1">{board.name}</span>
                </Link>
              ))}
              <Link
                href="/boards/create"
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
            className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 dark:hover:bg-gray-800"
          >
            <Settings className="mr-3 h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-indigo-600 dark:text-gray-400 dark:group-hover:text-indigo-400" aria-hidden="true" />
            <span>Settings</span>
          </Link>
          <Link
            href="/help"
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