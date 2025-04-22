/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Plus, Users, Shield, Settings, Grid, List,
  Home, ChevronRight, FolderPlus, RefreshCw
} from 'lucide-react';
import { fetchTeams, Team } from '../store/teamService';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import useAuthStore from '../store/useAuthStore';
import TeamCard from '../components/TeamCard'; 
import TeamListItem from '../components/TeamListItem';
import Link from 'next/link';
import AppLayout from '../components/AppLayout';
import TeamListRefresher from '@/app/components/TeamListRefresher';

// Define User interface to match the structure used in your app
interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  image?: string;
}

interface TeamsResponse {
  data: Team[];
  success?: boolean;
  count?: number;
}

interface TeamMember {
  user: string | { _id: string };
  role?: string;
}

function isTeamsResponse(obj: any): obj is TeamsResponse {
  return obj && 
         typeof obj === 'object' && 
         'data' in obj && 
         Array.isArray(obj.data);
}

const TeamsPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { refreshAccessToken } = useAuthStore();

  // Helper function to get user ID consistently
  const getUserId = (user: any): string | undefined => {
    if (!user) return undefined;
    return user._id || user.id;
  };

  useEffect(() => {
    const ensureAuthentication = async () => {
      try {
        // Check if we have a token
        const { accessToken } = useAuthStore.getState();
        
        if (!accessToken) {
          console.log('No access token found, attempting to refresh...');
          const refreshed = await refreshAccessToken();
          
          if (!refreshed) {
            setError('Your session has expired. Please sign in again.');
            router.push('/signIn');
            return false;
          }
        }
        
        return true;
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Authentication error. Please sign in again.');
        router.push('/signIn');
        return false;
      }
    };
    
    ensureAuthentication();
  }, [refreshAccessToken, router]);

  const loadTeams = async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Try to refresh token first
      await refreshAccessToken();
      
      const teamsData = await fetchTeams();
      console.log('Teams data received:', teamsData);
      
      // Handle the specific response format from your API
      if (teamsData && typeof teamsData === 'object' && 'success' in teamsData && teamsData.success) {
        if ('data' in teamsData && Array.isArray(teamsData.data)) {
          console.log(`Setting ${teamsData.data.length} teams from response`);
          setTeams(teamsData.data);
        } else {
          console.error('Response has success=true but missing or invalid data array');
          setTeams([]);
        }
      } else if (Array.isArray(teamsData)) {
        console.log(`Setting ${teamsData.length} teams from array response`);
        setTeams(teamsData);
      } else {
        console.error('Unexpected teams data format:', teamsData);
        setTeams([]);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
      setError('Failed to load teams. Please try again later.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    // Log user information to debug ID issues
    if (user) {
      console.log('Current user:', user);
      console.log('User ID:', getUserId(user));
    }
    
    // After teams are loaded, log team ownership info
    if (teams.length > 0 && user) {
      console.log('Sample team structure:', teams[0]);
      console.log('Team ownership check (first team):', {
        teamOwnerId: teams[0].owner,
        currentUserId: getUserId(user),
        isOwner: teams[0].owner === getUserId(user)
      });
      
      // Check member structure if available
      if (teams[0].members && teams[0].members.length > 0) {
        console.log('Sample member structure:', teams[0].members[0]);
      }
    }
  }, [teams, user]);

  const handleCreateTeam = () => {
    router.push('/teams/create');
  };

  const handleRefresh = () => {
    loadTeams(true);
  };

  const handleTeamDeleted = (teamId: string) => {
    setTeams(prevTeams => prevTeams.filter(team => team._id !== teamId));
  };

  const isTeamOwner = (team: Team): boolean => {
    const userId = getUserId(user);
    const ownerId = typeof team.owner === 'object' 
      ? (team.owner as any)?._id 
      : team.owner;
    return ownerId === userId;
  };

  // Get teams the user owns - handle both string and object owner formats
  const ownedTeams = Array.isArray(teams) 
    ? teams.filter(team => {
        if (!team || !user) return false;
        const userId = getUserId(user);
        
        // Handle both string owner ID and object owner
        const ownerId = typeof team.owner === 'object' 
          ? (team.owner as any)?._id 
          : team.owner;
          
        return ownerId === userId;
      })
    : [];

  // Get other teams the user is a member of
  const memberTeams = Array.isArray(teams) 
    ? teams.filter(team => {
        if (!team || !user) return false;
        const userId = getUserId(user);
        
        // Handle both string owner ID and object owner
        const ownerId = typeof team.owner === 'object' 
          ? (team.owner as any)?._id 
          : team.owner;
        
        // Skip if user is the owner
        if (ownerId === userId) return false;
        
        // Check if user's ID is in the members array
        if (Array.isArray(team.members)) {
          return team.members.some(member => {
            // If member is a string (just the user ID)
            if (typeof member === 'string') {
              return member === userId;
            }
            
            // If member has email and role structure  
            if (member && typeof member === 'object' && 'email' in member) {
              return user.email === member.email;
            }
            
            // If member has user property
            if (member && typeof member === 'object' && 'user' in member) {
              const memberUser = member.user;
              
              // If user is a string (ID)
              if (typeof memberUser === 'string') {
                return memberUser === userId;
              }
              
              // If user is an object with _id
              if (memberUser && typeof memberUser === 'object' && '_id' in memberUser) {
                return memberUser._id === userId;
              }
            }
            
            return false;
          });
        }
        
        return false;
      })
    : [];

  // Apply search filter
  const filteredTeams = Array.isArray(teams) 
    ? teams.filter(team => 
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.description && team.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // Get team role badge
  const getTeamRoleBadge = (team: Team) => {
    const userId = getUserId(user);
    
    // Handle both string owner ID and object owner
    const ownerId = typeof team.owner === 'object' 
      ? (team.owner as any)?._id 
      : team.owner;
    
    if (ownerId === userId) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900/30 text-indigo-300">
          <Shield className="w-3 h-3 mr-1" />
          Owner
        </span>
      );
    }
    
    // Check if user is a member
    if (Array.isArray(team.members) && team.members.some(member => {
      // Handle various member formats
      if (typeof member === 'string') {
        return member === userId;
      }
      
      if (member && typeof member === 'object') {
        // Handle email-based members
        if ('email' in member && user?.email) {
          return member.email === user.email;
        }
        
        // Handle user property
        if ('user' in member) {
          const memberUser = member.user;
          if (typeof memberUser === 'string') {
            return memberUser === userId;
          }
          if (memberUser && typeof memberUser === 'object' && '_id' in memberUser) {
            return memberUser._id === userId;
          }
        }
      }
      
      return false;
    })) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300">
          <Users className="w-3 h-3 mr-1" />
          Member
        </span>
      );
    }
    
    return null; // No badge if not a member or owner
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <ErrorMessage 
            message={error} 
            action={{
              label: "Try Again",
              onClick: () => window.location.reload()
            }}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <TeamListRefresher refreshInterval={60000} /> {/* Refresh every minute */}
        {/* Breadcrumb navigation */}
        <div className="flex items-center text-sm text-gray-400 mb-6">
          <Link href="/dashboard" className="hover:text-[#6366F1] flex items-center transition-colors">
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4 mx-2" />
          <span className="text-gray-200 font-medium">Teams</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Teams</h1>
            <p className="mt-1 text-sm text-gray-400">
              {teams.length === 0 ? 
                "Create or join teams to collaborate with others." : 
                `Showing ${teams.length} team${teams.length !== 1 ? 's' : ''} across all your workspaces.`
              }
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <Search className="h-4 w-4 text-gray-500" aria-hidden="true" />
              </div>
              <input
                type="text"
                placeholder="Search teams..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-xl shadow-sm leading-5 bg-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-[#6366F1] transition-colors sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center p-2 border border-gray-700 rounded-xl text-gray-400 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1] transition-colors"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin text-[#6366F1]' : ''}`} />
              <span className="sr-only">Refresh</span>
            </button>
            
            {/* View toggle buttons */}
            <div className="hidden md:flex bg-gray-800 p-1 rounded-xl border border-gray-700">
              <button
                onClick={() => setView('grid')}
                className={`p-2 text-sm font-medium rounded-lg flex items-center ${
                  view === 'grid' 
                    ? 'bg-gray-700 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                } transition-colors`}
              >
                <Grid className="h-4 w-4" />
                <span className="ml-1.5">Grid</span>
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 text-sm font-medium rounded-lg flex items-center ${
                  view === 'list' 
                    ? 'bg-gray-700 text-white shadow-sm' 
                    : 'text-gray-400 hover:text-white'
                } transition-colors`}
              >
                <List className="h-4 w-4" />
                <span className="ml-1.5">List</span>
              </button>
            </div>
            
            {/* Create Team Button */}
            <button
              type="button"
              onClick={handleCreateTeam}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-[#6366F1] hover:bg-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1] transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Team
            </button>
          </div>
        </div>
        
        {/* Teams you own section */}
        {ownedTeams.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-900/30 flex items-center justify-center mr-3">
                <Shield className="h-4 w-4 text-indigo-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-200">Teams You Manage</h2>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-900/30 text-indigo-300">
                {ownedTeams.length}
              </span>
            </div>
            
            {view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownedTeams.map(team => (
                  team && team._id ? (
                    <TeamCard
                      key={team._id}
                      team={team}
                      onDelete={handleTeamDeleted}
                      isOwner={isTeamOwner(team)}
                    />
                  ) : null
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
                {ownedTeams.map((team, index) => (
                  <TeamListItem 
                    key={team._id} 
                    team={{
                      ...team,
                      avatar: team.avatar || undefined
                    }}
                    badge={getTeamRoleBadge(team)}
                    isLast={index === ownedTeams.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Teams you're a member of */}
        {memberTeams.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center mr-3">
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-200">Teams You&apos;re Part Of</h2>
              <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-blue-900/30 text-blue-300">
                {memberTeams.length}
              </span>
            </div>
            
            {view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {memberTeams.map(team => (
                  team && team._id ? (
                    <TeamCard
                      key={team._id}
                      team={team}
                      onDelete={handleTeamDeleted}
                      isOwner={isTeamOwner(team)}
                    />
                  ) : null
                ))}
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
                {memberTeams.map((team, index) => (
                  <TeamListItem 
                    key={team._id} 
                    team={{
                      ...team,
                      avatar: team.avatar || undefined
                    }}
                    badge={getTeamRoleBadge(team)}
                    isLast={index === memberTeams.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Enhanced empty state */}
        {teams.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-800 rounded-xl shadow-sm border border-gray-700 mt-6">
            <div className="h-20 w-20 rounded-xl bg-indigo-900/20 border border-indigo-900/30 flex items-center justify-center mb-6">
              <FolderPlus className="h-10 w-10 text-indigo-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-200">No teams found</h3>
            <p className="mt-2 text-center text-gray-400 max-w-md px-6">
              {error ? 
                'There was a problem loading your teams. Please try again.' : 
                'Teams help you organize projects and collaborate with others. Create your first team to get started.'}
            </p>
            <div className="mt-8 flex space-x-4">
              <button
                type="button"
                onClick={handleCreateTeam}
                className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-[#6366F1] hover:bg-[#4F46E5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1] transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Team
              </button>
              {error && (
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-5 py-2.5 border border-gray-700 text-sm font-medium rounded-xl shadow-sm text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#6366F1] transition-all"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Search results with improved visual hierarchy */}
        {searchQuery && (
          <div className="mt-8 bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-medium text-gray-200">Search Results</h2>
              <p className="mt-1 text-sm text-gray-400">
                Found {filteredTeams.length} team{filteredTeams.length !== 1 ? 's' : ''} matching &qout;{searchQuery}&quot;
              </p>
            </div>
            
            {filteredTeams.length > 0 ? (
              view === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 bg-gray-700 gap-6 p-6">
                  {filteredTeams.map(team => (
                    team && team._id ? (
                      <TeamCard
                        key={team._id}
                        team={team}
                        onDelete={handleTeamDeleted}
                        isOwner={isTeamOwner(team)}
                      />
                    ) : null
                  ))}
                </div>
              ) : (
                <div>
                  {filteredTeams.map((team, index) => (
                    <TeamListItem 
                      key={team._id} 
                      team={{
                        ...team,
                        avatar: team.avatar || undefined
                      }}
                      badge={getTeamRoleBadge(team)}
                      isLast={index === filteredTeams.length - 1}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-gray-500" />
                </div>
                <p className="text-gray-400">No teams match your search criteria.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-[#6366F1] hover:text-[#4F46E5] text-sm font-medium transition-colors"
                >
                  Clear search
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TeamsPage;