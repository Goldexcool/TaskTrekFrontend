import React from 'react';
import Link from 'next/link';
import { Folder, Home, ArrowLeft } from 'react-feather';

interface TeamNotFoundProps {
  message?: string;
  teamId?: string;
}

const TeamNotFound: React.FC<TeamNotFoundProps> = ({ message = "Team not found", teamId }) => {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 shadow-sm rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Folder className="h-12 w-12 text-amber-600 dark:text-amber-500" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Team Not Available</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {message}
          {teamId && (
            <span className="block mt-2 text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              ID: {teamId}
            </span>
          )}
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/teams" className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Teams
          </Link>
          <Link href="/dashboard" className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeamNotFound;