/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
import React from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Team } from '../store/teamService';

interface TeamListItemProps {
  team: Team;
  badge: React.ReactNode;
  isLast: boolean;
}

const TeamListItem: React.FC<TeamListItemProps> = ({ team, badge, isLast }) => {
  const memberCount = team.members?.length || 0;
  
  // Generate a color based on team name for consistent avatar background
  const getAvatarStyle = (name: string) => {
    const colors = [
      { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200' },
      { bg: 'bg-violet-100', text: 'text-violet-600', border: 'border-violet-200' },
      { bg: 'bg-sky-100', text: 'text-sky-600', border: 'border-sky-200' },
      { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
      { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
      { bg: 'bg-rose-100', text: 'text-rose-600', border: 'border-rose-200' },
    ];
    
    // Simple hash function to get consistent color
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  const avatarStyle = getAvatarStyle(team.name);
  
  return (
    <Link href={`/teams/${team._id}`}>
      <div className={`p-4 hover:bg-black-50 transition-colors ${!isLast && 'border-b border-gray-200'}`}>
        <div className="flex items-center space-x-4">
          {/* Team avatar with image-based avatar or letter-based fallback */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
            {team.avatar ? (
              <img 
                src={team.avatar} 
                alt={`${team.name} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-indigo-900/50 text-indigo-300 font-medium">
                {team.name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          
          {/* Team details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-gray-900">{team.name}</h3>
              {badge}
            </div>
            
            {team.description && (
              <p className="mt-1 text-sm text-gray-500 truncate">
                {team.description}
              </p>
            )}
          </div>
          
          {/* Member count */}
          <div className="flex-shrink-0 flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-1.5 text-gray-400" />
            {memberCount}
          </div>
          
          {/* Right chevron */}
          <div className="flex-shrink-0 text-gray-400">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TeamListItem;