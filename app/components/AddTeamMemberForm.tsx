/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { addTeamMember } from '../store/teamService';

interface AddTeamMemberFormProps {
  teamId: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const AddTeamMemberForm: React.FC<AddTeamMemberFormProps> = ({ teamId, onSuccess, onError }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      onError('Please enter an email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addTeamMember(teamId, email.trim());
      setEmail('');
      onSuccess();
    } catch (error: any) {
      console.error('Error adding team member:', error);
      onError(error.message || 'Failed to add team member');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm 
                   shadow-sm placeholder-gray-400 dark:placeholder-gray-500
                   focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                   dark:bg-gray-800 dark:text-gray-100"
          disabled={isSubmitting}
          required
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700
                   rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                   disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Adding...' : 'Add'}
        </button>
      </div>
    </form>
  );
};

export default AddTeamMemberForm;