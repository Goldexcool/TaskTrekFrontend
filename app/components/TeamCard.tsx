/* eslint-disable @next/next/no-img-element */
import React from 'react';
import Link from 'next/link';
import { Users, Plus, Trash2 } from 'react-feather';

// Import the Team type
import { Team } from '../store/teamService';

interface TeamCardProps {
  team: Team;
  onDelete?: (teamId: string) => void;
  isOwner?: boolean;
}

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onDelete,
  isOwner = false
}) => {
  const {
    _id: id,
    name,
    description,
    members = [],
    updatedAt,
    avatar
  } = team;

  // Generate a deterministic color based on team name
  const getColorClass = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-indigo-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-red-500',
      'bg-orange-500',
      'bg-emerald-500',
      'bg-teal-500',
      'bg-cyan-500',
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Format date without date-fns
  const formatTimeAgo = (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffDay > 30) {
        // Format as MM/DD/YYYY for dates older than a month
        return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
      } else if (diffDay > 0) {
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
      } else if (diffHour > 0) {
        return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
      } else if (diffMin > 0) {
        return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  const timeAgo = formatTimeAgo(updatedAt);
  const memberCount = members.length;

  return (
    <div className="group bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-sm hover:shadow-md transition-all">
      <div 
        className={`h-24 ${getColorClass(name)} relative flex items-center justify-center`}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-16 w-16 rounded-full border-4 border-white shadow-lg"
          />
        ) : (
          <span className="text-3xl font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </span>
        )}

        {/* Create board shortcut */}
        <Link 
          href={`/boards/create?teamId=${id}&teamName=${encodeURIComponent(name)}`}
          className="absolute right-3 top-3 bg-white/20 hover:bg-white/40 p-1.5 rounded-full text-white transition-colors backdrop-blur-sm"
          title="Create new board"
        >
          <Plus className="h-4 w-4" />
        </Link>
        
        {/* Delete button for owners */}
        {isOwner && onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm(`Are you sure you want to delete the team "${name}"?`)) {
                onDelete(id);
              }
            }}
            className="absolute left-3 top-3 bg-red-500/20 hover:bg-red-500/40 p-1.5 rounded-full text-white transition-colors backdrop-blur-sm"
            title="Delete team"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <div className="p-4">
        <Link href={`/teams/${id}`}>
          <h3 className="font-medium text-gray-200 hover:text-indigo-400 transition-colors">
            {name}
          </h3>
        </Link>
        
        {description && (
          <p className="mt-1 text-sm text-gray-400 line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center">
            <Users className="h-3.5 w-3.5 mr-1" />
            <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
          </div>
          
          {timeAgo && (
            <span className="italic">
              Updated {timeAgo}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamCard;