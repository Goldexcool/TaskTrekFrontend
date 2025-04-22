import React from 'react';
import Link from 'next/link';
import { Clock, Users } from 'lucide-react';
import { Team } from '../store/teamService';

interface GridTeamCardProps {
  team: Team;
  badge: React.ReactNode;
}

const GridTeamCard: React.FC<GridTeamCardProps> = ({ team, badge }) => {
  const createdDate = new Date(team.createdAt || Date.now());
  const isRecent = Date.now() - createdDate.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
  
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
  const memberCount = team.members?.length || 0;
  
  return (
    <Link href={`/teams/${team._id}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-200 overflow-hidden h-full flex flex-col group hover:border-indigo-200">
        {/* Card header with improved avatar */}
        <div className="p-6">
          <div className="flex items-start space-x-4">
            {/* Team avatar - always use the generated avatar */}
            <div className={`flex-shrink-0 h-14 w-14 rounded-xl ${avatarStyle.bg} border ${avatarStyle.border} flex items-center justify-center`}>
              <span className={`text-xl font-bold ${avatarStyle.text}`}>
                {team.name.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Team details with badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {team.name}
                </h3>
                {isRecent && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                    <Clock className="w-3 h-3 mr-1" />
                    New
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center">
                {badge}
              </div>
              {team.description && (
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {team.description}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Card footer with member count and creation date */}
        <div className="mt-auto px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Users className="h-4 w-4 mr-1.5 text-gray-400" />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </div>
          <div className="text-xs text-gray-400">
            Created {createdDate.toLocaleDateString()}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GridTeamCard;