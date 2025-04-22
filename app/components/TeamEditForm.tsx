/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Users, Save, ArrowLeft } from 'lucide-react';
import { Team, updateTeam } from '../store/teamService';
import Link from 'next/link';

interface TeamEditFormProps {
  team: Team;
}

const TeamEditForm: React.FC<TeamEditFormProps> = ({ team }) => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: team.name || '',
    description: team.description || '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Team name must be at least 2 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Team name must be at most 50 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be at most 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      await updateTeam(team._id, formData);
      setSubmitSuccess(true);
      
      // Redirect after a brief delay to show success message
      setTimeout(() => {
        router.push(`/teams/${team._id}`);
        router.refresh();
      }, 1500);
    } catch (error) {
      console.error('Failed to update team:', error);
      setSubmitError('Failed to update team. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 shadow-md rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Users className="h-5 w-5 mr-2 text-gray-400" />
            Edit Team
          </h2>
          <Link
            href={`/teams/${team._id}`}
            className="text-sm text-gray-400 hover:text-white flex items-center transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Team
          </Link>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        {/* Team name field */}
        <div className="mb-5">
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
            Team Name*
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full rounded-lg bg-gray-700 border ${
              errors.name ? 'border-red-500' : 'border-gray-600'
            } text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            placeholder="Enter team name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-400">{errors.name}</p>
          )}
        </div>
        
        {/* Team description field */}
        <div className="mb-5">
          <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`w-full rounded-lg bg-gray-700 border ${
              errors.description ? 'border-red-500' : 'border-gray-600'
            } text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            placeholder="Enter team description"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-400">{errors.description}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.description.length}/500 characters
          </p>
        </div>
        
        {/* Error message */}
        {submitError && (
          <div className="mb-5 p-3 bg-red-900/20 border border-red-900/50 rounded-lg flex items-center text-sm text-red-400">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            {submitError}
          </div>
        )}
        
        {/* Success message */}
        {submitSuccess && (
          <div className="mb-5 p-3 bg-green-900/20 border border-green-900/50 rounded-lg flex items-center text-sm text-green-400">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
            Team updated successfully! Redirecting...
          </div>
        )}
        
        {/* Form actions */}
        <div className="flex justify-end space-x-3">
          <Link
            href={`/teams/${team._id}`}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-75 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Team
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeamEditForm;