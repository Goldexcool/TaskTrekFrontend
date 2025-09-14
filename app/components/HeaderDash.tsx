/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, Bell, Search, ChevronDown, 
   User, LogOut, HelpCircle,
  Home, Users, Layers, CheckSquare, Calendar,
  Edit, Trash2, Plus
} from 'lucide-react';

import useAuthStore from '../store/useAuthStore';
import { fetchTeams, Team, deleteTeam } from '../store/teamService';
import useActivityStore from '../store/activityStore';
import { useSidebar } from '@/components/ui/sidebar';

type NavItem = {
  name: string;
  path: string;
  icon: React.ElementType;
};

const navigation: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Teams', path: '/teams', icon: Users },
  { name: 'Boards', path: '/boards', icon: Layers },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
];

interface HeaderDashProps {
  onMenuClick?: () => void;
}

const HeaderDash: React.FC<HeaderDashProps> = ({ onMenuClick }) => {
  const pathname = usePathname();
  const router = useRouter();
  const sidebar = useSidebar();
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [teamsMenuOpen, setTeamsMenuOpen] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const teamsMenuRef = useRef<HTMLDivElement>(null);

  const { user, logout } = useAuthStore();
  const { combinedFeed } = useActivityStore();

  useEffect(() => {
    const loadTeams = async () => {
      if (user) {
        setIsLoadingTeams(true);
        try {
          const teamsData = await fetchTeams();
          if (teamsData && Array.isArray(teamsData)) {
            setTeams(teamsData);
          } else if (teamsData && typeof teamsData === 'object' && 'data' in teamsData && Array.isArray(teamsData.data)) {
            setTeams(teamsData.data);
          }
        } catch (error) {
          console.error('Failed to load teams:', error);
        } finally {
          setIsLoadingTeams(false);
        }
      }
    };
    
    loadTeams();
  }, [user]);

  useEffect(() => {
    if (!user) {
      console.log('No user found in store');
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      
      if (teamsMenuRef.current && !teamsMenuRef.current.contains(event.target as Node)) {
        setTeamsMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  useEffect(() => {
    const mockUnreadCount = Math.min(
      combinedFeed.length > 0 ? Math.floor(combinedFeed.length * 0.3) : 0,
      9
    );
    setUnreadNotifications(mockUnreadCount);
  }, [combinedFeed]);

  const handleLogout = async () => {
    await logout();
    router.push('/signIn');
  };

  const getUserInitials = (): string => {
    if (!user) return '?';

    if (user.username) {
      const cleanName = user.username.trim();
      if (cleanName) {
        const nameParts = cleanName.split(' ').filter((part: string) => part.length > 0);

        if (nameParts.length >= 2) {
          return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
        } else if (nameParts.length === 1) {
          return nameParts[0].charAt(0).toUpperCase();
        }
      }
    }

    if (user.name) {
      const cleanName = user.name.trim();
      if (cleanName) {
        const nameParts = cleanName.split(' ').filter((part: string) => part.length > 0);

        if (nameParts.length >= 2) {
          return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
        } else if (nameParts.length === 1) {
          return nameParts[0].charAt(0).toUpperCase();
        }
      }
    }

    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }

    return '?';
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      try {
        await deleteTeam(teamId);
        setTeams(teams.filter(team => team._id !== teamId));
        if (pathname === `/teams/${teamId}`) {
          router.push('/teams');
        }
      } catch (error) {
        console.error('Failed to delete team:', error);
        alert('Failed to delete team. Please try again.');
      }
    }
  };

  const getUserId = (user: any): string | undefined => {
    if (!user) return undefined;
    return user._id || user.id;
  };

  const userOwnedTeams = teams.filter(team => {
    const userId = getUserId(user);
    return team.owner === userId;
  });

  const handleMenuClick = () => {
    console.log("Menu button clicked");
    if (sidebar && sidebar.toggleSidebar) {
      sidebar.toggleSidebar();
    } else if (onMenuClick) {
      onMenuClick();
    }
  };

  return (
    <header className={`fixed top-0 right-0 left-0 z-30 bg-black-800 ${
      scrolled ? 'shadow-md shadow-black/20' : 'shadow-sm shadow-black/10'
    } transition-all duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <button
                id="mobile-menu-button"
                type="button"
                className="md:hidden inline-flex items-center justify-center p-2 mr-2 rounded-xl text-gray-400 hover:text-[#6366F1] hover:bg-black-700 focus:outline-none transition-colors"
                onClick={handleMenuClick}
              >
                <span className="sr-only">Open menu</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>

              <Link href="/dashboard" className="flex items-center">
                <div className="h-10 w-10 rounded-lg bg-[#6366F1] flex items-center justify-center">
                  <span className="text-white text-xl P-3 font-bold">TT</span>
                </div>
                <span className="ml-2 text-xl font-semibold text-white">TaskTrek</span>
              </Link>
            </div>

            <nav className="hidden md:ml-8 md:flex md:space-x-4">
              {navigation.map((item) => {
                const isActive = pathname === item.path || pathname?.startsWith(`${item.path}/`);
                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-black-700 text-[#6366F1]'
                        : 'text-gray-300 hover:bg-black-700 hover:text-[#6366F1]'
                    } flex items-center`}
                  >
                    <item.icon className={`h-4 w-4 mr-1.5 ${isActive ? 'text-[#6366F1]' : 'text-gray-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-3">
            <div className="relative hidden md:block" ref={teamsMenuRef}>
              <button
                type="button"
                className="flex items-center px-3 py-1.5 text-sm rounded-xl text-gray-300 hover:bg-black-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1] transition-colors"
                onClick={() => setTeamsMenuOpen(!teamsMenuOpen)}
              >
                <Users className="h-4 w-4 mr-2" />
                Teams
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>

              {teamsMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-72 rounded-xl shadow-lg bg-black-700 ring-1 ring-black ring-opacity-5 divide-y divide-gray-600 z-50">
                  <div className="px-4 py-3 border-b border-gray-600">
                    <h3 className="text-sm font-medium text-white flex items-center justify-between">
                      Your Teams 
                      <span className="bg-black-600 text-xs text-gray-300 px-2 py-0.5 rounded-full">
                        {userOwnedTeams.length}
                      </span>
                    </h3>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto py-1">
                    {isLoadingTeams ? (
                      <div className="px-4 py-3 text-sm text-gray-400">Loading teams...</div>
                    ) : userOwnedTeams.length > 0 ? (
                      userOwnedTeams.map(team => (
                        <div key={team._id} className="px-4 py-2 group">
                          <div className="flex items-center justify-between">
                            <Link 
                              href={`/teams/${team._id}`}
                              className="text-sm text-gray-300 hover:text-white flex items-center truncate max-w-[180px]"
                              onClick={() => setTeamsMenuOpen(false)}
                            >
                              <div className={`h-6 w-6 rounded-md bg-indigo-900/50 flex items-center justify-center mr-2`}>
                                <span className="text-xs font-medium text-indigo-300">
                                  {team.name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <span className="truncate">{team.user}</span>
                            </Link>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link
                                href={`/teams/${team._id}/edit`}
                                className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-black-600"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                onClick={() => handleDeleteTeam(team._id)}
                                className="p-1 text-gray-400 hover:text-red-400 rounded-full hover:bg-black-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-400">No teams found</div>
                    )}
                  </div>
                  
                  <div className="py-1 border-t border-gray-600">
                    <Link 
                      href="/teams/create"
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-black-600 transition-colors"
                      onClick={() => setTeamsMenuOpen(false)}
                    >
                      <Plus className="mr-3 h-4 w-4 text-gray-400" />
                      Create New Team
                    </Link>
                    <Link 
                      href="/teams"
                      className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-black-600 transition-colors"
                      onClick={() => setTeamsMenuOpen(false)}
                    >
                      <Users className="mr-3 h-4 w-4 text-gray-400" />
                      View All Teams
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {user && (
              <div className="hidden md:block mr-2">
                <span className="text-sm font-medium text-gray-300">
                  Welcome, <span className="text-[#6366F1]">{user.name || user.username || user.email}</span>
                </span>
              </div>
            )}

            <div className="relative">
              {searchOpen ? (
                <div className="absolute right-0 top-0 w-64 sm:w-72 animate-fade-in">
                  <div className="relative text-gray-400 focus-within:text-gray-600">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                      <Search className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <input
                      autoFocus
                      id="search"
                      className="block w-full bg-black-700 py-2 pl-10 pr-3 border border-gray-600 rounded-xl leading-5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] sm:text-sm"
                      placeholder="Search..."
                      type="search"
                      onBlur={() => setSearchOpen(false)}
                    />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSearchOpen(true)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-black-700 focus:outline-none transition-colors"
                >
                  <span className="sr-only">Search</span>
                  <Search className="h-5 w-5" aria-hidden="true" />
                </button>
              )}
            </div>

            <Link
              href="/notifications"
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-black-700 focus:outline-none relative transition-colors"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-5 w-5" aria-hidden="true" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0 right-0 flex items-center justify-center">
                  <span className="animate-ping absolute h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </Link>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                className="flex items-center space-x-2 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1]"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-indigo-800 flex items-center justify-center">
                  <span className="text-indigo-200 font-medium">{getUserInitials()}</span>
                </div>
                <ChevronDown className="hidden md:block h-4 w-4 text-gray-400" />
              </button>

              {profileOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-xl shadow-lg bg-black-700 ring-1 ring-black ring-opacity-5 divide-y divide-gray-600 z-50">
                  <div className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-indigo-800 flex items-center justify-center">
                          <span className="text-indigo-200 font-medium text-lg">{getUserInitials()}</span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-white">
                          {user?.name || user?.username || 'User'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user?.email || 'No email available'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link 
                      href="/profile"
                      className="group flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-black-600 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#6366F1]" />
                      Your Profile
                    </Link>
                    
                    <Link 
                      href="/help"
                      className="group flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-black-600 transition-colors"
                      onClick={() => setProfileOpen(false)}
                    >
                      <HelpCircle className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#6366F1]" />
                      Help & Support
                    </Link>
                  </div>
                  <div className="py-1">
                    <button
                      className="group flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-black-600 transition-colors"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-[#EF4444]" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderDash;