/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Home, ChevronLeft, Save, X, Users, Info, Check, AlertTriangle, 
  Upload, Trash, Plus, User, Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import useAuthStore from '../../store/useAuthStore';
import LoadingSpinner from '../../components/LoadingSpinner';
import AppLayout from '../../components/AppLayout';
import {
  createTeam,
  fetchTeamById,
  updateTeam
} from '../../store/teamService';
import { toast } from 'react-toastify';

// Cloudinary image upload handler
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

const validateFile = (file: File): boolean => {
  if (file.size > MAX_FILE_SIZE) {
    toast.error("File size exceeds 10MB");
    return false;
  }

  if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
    toast.error("Only JPG, PNG, GIF and WEBP files are allowed");
    return false;
  }

  return true;
};

const uploadToCloudinary = async (file: File): Promise<string> => {
  if (!validateFile(file)) {
    throw new Error("Invalid file. Please upload a valid image file");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ProfileX");

  try {
    const cloudName = "df4f0usnh";
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    console.log("Uploading to Cloudinary:", uploadUrl);

    const response = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Cloudinary error response:", errorData);
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Upload successful, image URL:", data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to upload image"
    );
    throw error;
  }
};

// This component uses useSearchParams so it needs to be wrapped in Suspense
function CreateTeamForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  
  // Check if we're in edit mode
  const isEditMode = searchParams.get('edit') === 'true';
  const teamId = searchParams.get('id');
  const teamNameFromUrl = searchParams.get('name');
  const teamDescFromUrl = searchParams.get('description');
  
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  // Form state
  const [teamName, setTeamName] = useState(teamNameFromUrl ? decodeURIComponent(teamNameFromUrl) : '');
  const [teamDescription, setTeamDescription] = useState(teamDescFromUrl ? decodeURIComponent(teamDescFromUrl) : '');
  const [isPrivate, setIsPrivate] = useState(false);
  const [initialMembers, setInitialMembers] = useState<string[]>([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Avatar handling
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  // First, make sure the avatar state is actually logging properly
  useEffect(() => {
    if (avatar) {
      console.log('Avatar state loaded:', avatar);
    }
  }, [avatar]);

  // Load team data in edit mode
  useEffect(() => {
    if (isEditMode && teamId && !hasAttemptedLoad) {
      setHasAttemptedLoad(true);
      
      if (teamNameFromUrl) {
        console.log('Using team data from URL parameters');
        return;
      }
      
      const loadTeam = async () => {
        console.log('Loading team data from API');
        setLoadingTeam(true);
        setLoadError(null);
        
        try {
          console.log(`Loading team data for ID: ${teamId}`);
          const teamData = await fetchTeamById(teamId);
          
          if (!teamData) {
            throw new Error('Team not found');
          }
          
          console.log('Loaded team data:', teamData);
          
          // Set form values from existing team
          setTeamName(teamData.name || '');
          setTeamDescription(teamData.description || '');
          setIsPrivate(teamData.isPrivate || false);
          
          // Fix for avatar loading - Force the state update by using a timeout
          if (teamData.avatar) {
            console.log('Setting avatar from team data:', teamData.avatar);
            
            let avatarUrl = teamData.avatar;
            
            // Ensure avatar URL is absolute
            if (avatarUrl.startsWith('/') && !avatarUrl.startsWith('//')) {
              avatarUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}${avatarUrl}`;
            }
            
            // Force a new state update cycle by clearing and then setting the avatar
            setAvatar(null);
            
            // Preload the image to verify it works
            const img = document.createElement('img');
            img.crossOrigin = "anonymous"; // Add this to handle CORS issues
            
            img.onload = () => {
              console.log('Avatar image preloaded successfully:', avatarUrl);
              // Set the avatar after a small delay to ensure React processes the state change
              setTimeout(() => {
                setAvatar(avatarUrl);
              }, 100);
            };
            
            img.onerror = (e) => {
              console.error('Failed to preload image:', e);
              console.log('Using direct URL anyway:', avatarUrl);
              // Try setting it directly anyway
              setTimeout(() => {
                setAvatar(avatarUrl);
              }, 100);
            };
            
            // Start loading the image
            img.src = avatarUrl;
          }
          
          // Set members if available
          if (teamData.members && Array.isArray(teamData.members)) {
            const memberEmails = teamData.members
              .map((member: any) => {
                // Handle different member structures
                if (typeof member === 'string') return member;
                if (member && typeof member === 'object' && 'email' in member) return member.email;
                if (member && typeof member === 'object' && 'user' in member && 
                    typeof member.user === 'object' && 'email' in member.user) {
                  return member.user.email;
                }
                return null;
              })
              .filter(Boolean) as string[];
              
            setInitialMembers(memberEmails);
          }
        } catch (err: any) {
          console.error('Error loading team data for editing:', err);
          setLoadError(err.message || 'Failed to load team data');
          toast.error('Failed to load team data for editing');
        } finally {
          setLoadingTeam(false);
        }
      };
      
      loadTeam();
    }
  }, [isEditMode, teamId, teamNameFromUrl, hasAttemptedLoad]);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormTouched(true);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!validateFile(file)) {
        return;
      }
      
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected avatar
  const removeAvatar = () => {
    setAvatar(null);
    setAvatarFile(null);
    setFormTouched(true);
  };

  // Validate team name
  const validateName = () => {
    if (!teamName.trim()) {
      setNameError('Team name is required');
      return false;
    }
    if (teamName.trim().length < 3) {
      setNameError('Team name must be at least 3 characters');
      return false;
    }
    if (teamName.trim().length > 50) {
      setNameError('Team name must be less than 50 characters');
      return false;
    }
    setNameError(null);
    return true;
  };

  // Add initial team member
  const addInitialMember = () => {
    if (!memberEmail.trim() || !memberEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (initialMembers.includes(memberEmail)) {
      setError('This email is already in the member list');
      return;
    }
    
    setInitialMembers([...initialMembers, memberEmail]);
    setMemberEmail('');
    setError(null);
    setFormTouched(true);
  };

  // Handle member email input keydown
  const handleMemberEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInitialMember();
    }
  };

  // Remove initial team member
  const removeInitialMember = (email: string) => {
    setInitialMembers(initialMembers.filter(m => m !== email));
    setFormTouched(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setError(null);
    
    // Validate input
    if (!validateName()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // First upload image if needed
      let avatarUrl = avatar;
      if (avatarFile) {
        setUploadingImage(true);
        try {
          avatarUrl = await uploadToCloudinary(avatarFile);
        } catch (err) {
          toast.error('Failed to upload team avatar');
          throw new Error('Failed to upload team avatar');
        } finally {
          setUploadingImage(false);
        }
      }
      
      // Prepare team data
      const teamData = {
        name: teamName.trim(),
        description: teamDescription.trim() || undefined,
        isPrivate,
        members: initialMembers.length > 0 ? initialMembers : undefined,
        avatar: avatarUrl
      };
      
      console.log('Team data being sent:', teamData);
      
      if (isEditMode && teamId) {
        // Update existing team
        console.log(`Updating team with ID: ${teamId}`);
        const updatedTeam = await updateTeam(teamId, teamData);
        console.log('Team updated successfully:', updatedTeam);
        toast.success('Team updated successfully!');
      } else {
        // Create new team
        console.log('Creating new team');
        const newTeam = await createTeam(teamData);
        console.log('Team created successfully:', newTeam);
        toast.success('Team created successfully!');
      }
      
      // Show success state
      setSuccess(true);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push(isEditMode && teamId ? `/teams/${teamId}` : '/teams');
      }, 1500);
      
    } catch (err: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} team:`, err);
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} team`);
      toast.error(err.message || `Failed to ${isEditMode ? 'update' : 'create'} team`);
    } finally {
      setSubmitting(false);
    }
  };

  // Effect to check for unsaved changes before leaving
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (formTouched && (teamName || teamDescription || initialMembers.length > 0 || avatar)) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formTouched, teamName, teamDescription, initialMembers, avatar]);

  if (loadingTeam) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading team data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white dark:bg-black-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error Loading Team</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{loadError}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/teams"
              className="px-4 py-2 bg-black-200 dark:bg-black-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-black-300 dark:hover:bg-black-600 transition-colors"
            >
              Back to Teams
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb navigation */}
      <div className="mb-8">
        <div className="flex items-center space-x-2 mb-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
          >
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
          <span className="text-gray-400">/</span>
          <Link
            href="/teams"
            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center"
          >
            <Users className="h-4 w-4 mr-1" />
            Teams
          </Link>
          <span className="text-gray-400">/</span>
          {isEditMode ? (
            <>
              <Link
                href={`/teams/${teamId}`}
                className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                {teamName}
              </Link>
              <span className="text-gray-400">/</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">Edit</span>
            </>
          ) : (
            <span className="text-sm font-medium text-gray-900 dark:text-white">Create Team</span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link
              href={isEditMode && teamId ? `/teams/${teamId}` : "/teams"}
              className="mr-4 p-2 rounded-full hover:bg-black-100 dark:hover:bg-black-800 transition-colors"
              aria-label={isEditMode ? "Back to team" : "Back to teams"}
            >
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'Edit Team' : 'Create New Team'}
            </h1>
          </div>
        </div>
      </div>

      {/* Success notification */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 text-green-700 dark:text-green-400 animate-pulse">
          <div className="flex">
            <div className="flex-shrink-0">
              <Check className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                Team {isEditMode ? 'updated' : 'created'} successfully! Redirecting...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-400">
          <div className="flex">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main form */}
      {/* The rest of the component remains unchanged */}
      <div className="bg-white dark:bg-black-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-8" onChange={() => setFormTouched(true)}>
          {/* Team avatar section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Team Avatar</h3>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                {avatar ? (
                  <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                    <img 
                      key={`avatar-${avatar || 'none'}-${Date.now()}`} 
                      src={avatar} 
                      alt="Team avatar"
                      className="w-full h-full object-cover rounded-full"
                      crossOrigin="anonymous" // Add this to handle CORS issues
                      onLoad={() => console.log("Avatar image displayed successfully in UI")}
                      onError={(e) => {
                        console.error("Error displaying avatar in UI:", avatar);
                        
                        // Try adding cache busting
                        const currentUrl = e.currentTarget.src;
                        if (!currentUrl.includes('?')) {
                          const newUrl = `${currentUrl}?t=${Date.now()}`;
                          console.log("Trying with cache busting:", newUrl);
                          e.currentTarget.src = newUrl;
                          return;
                        }
                        
                        // If we already tried cache busting, try with a proxy
                        if (currentUrl.includes('?') && !currentUrl.includes('https://images.weserv.nl')) {
                          const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(avatar || '')}`;
                          console.log("Trying with weserv.nl proxy:", proxyUrl);
                          e.currentTarget.src = proxyUrl;
                          return;
                        }
                        
                        // If all else fails, show initials
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'bg-indigo-900/30');
                        
                        const existing = e.currentTarget.parentElement?.querySelector('span');
                        if (existing) {
                          existing.remove();
                        }
                        
                        const initialsEl = document.createElement('span');
                        initialsEl.className = 'text-indigo-300 font-medium text-xl';
                        initialsEl.textContent = teamName.substring(0, 2).toUpperCase();
                        e.currentTarget.parentElement?.appendChild(initialsEl);
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute bottom-0 right-0 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md"
                      aria-label="Remove avatar"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-28 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                    {isEditMode && loadingTeam ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <User className="h-12 w-12 text-indigo-500 dark:text-indigo-400" />
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload a team avatar to make your team easily recognizable.
                </p>
                
                <div className="flex items-center space-x-4">
                  <label className="relative cursor-pointer">
                    <span className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors">
                      <Upload className="h-4 w-4 mr-2" />
                      {avatar ? 'Change Avatar' : 'Upload Avatar'}
                    </span>
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImageChange}
                    />
                  </label>
                  
                  {avatar && (
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-black-100 dark:hover:bg-black-700 transition-colors flex items-center"
                    >
                      <Trash className="h-4 w-4 mr-2" />
                      Remove
                    </button>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Recommended: JPG, PNG, GIF or WEBP. Max 10MB.
                </p>
              </div>
            </div>
          </div>
          
          {/* Team details section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-8">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Team Details</h3>
            
            <div className="space-y-6">
              {/* Team name field */}
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  id="teamName"
                  name="teamName"
                  value={teamName}
                  onChange={(e) => {
                    setTeamName(e.target.value);
                    setFormTouched(true);
                  }}
                  onBlur={validateName}
                  placeholder="Enter team name"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    nameError 
                      ? 'border-red-300 dark:border-red-700 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'
                  } dark:bg-black-700 dark:text-white`}
                  required
                />
                {nameError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{nameError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  3-50 characters. Choose a clear and descriptive name for your team.
                </p>
              </div>
              
              {/* Team description field */}
              <div>
                <label htmlFor="teamDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="teamDescription"
                  name="teamDescription"
                  value={teamDescription}
                  onChange={(e) => {
                    setTeamDescription(e.target.value);
                    setFormTouched(true);
                  }}
                  placeholder="What does this team do? (optional)"
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-black-700 dark:text-white"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Briefly describe the team&apos;s purpose, goals, or focus areas.
                </p>
              </div>
              
              {/* Team privacy field */}
              <div>
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-black-50 dark:hover:bg-black-700/50 cursor-pointer transition-colors" 
                     onClick={() => setIsPrivate(!isPrivate)}>
                  <div className="flex items-start">
                    <div className={`flex h-5 items-center ${isPrivate ? 'text-indigo-600' : 'text-gray-400'}`}>
                      <input
                        id="private"
                        name="private"
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => {
                          setIsPrivate(e.target.checked);
                          setFormTouched(true);
                        }}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="private" className="font-medium text-gray-700 dark:text-gray-300">
                        Private Team
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Only invited members can view and join this team.
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isPrivate 
                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                    }`}>
                      {isPrivate ? 'Private' : 'Public'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Team members section */}
          <div className="pb-6">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Team Members</h3>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Invite members to your team by email address. They will receive an invitation to join.
              </p>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1">
                  <input
                    type="email"
                    value={memberEmail}
                    onChange={(e) => setMemberEmail(e.target.value)}
                    onKeyDown={handleMemberEmailKeyDown}
                    placeholder="Enter email address"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-black-700 dark:text-white"
                  />
                </div>
                
                <button
                  type="button"
                  onClick={addInitialMember}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </button>
              </div>
              
              {/* Display added members */}
              {initialMembers.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Added Members ({initialMembers.length})
                  </h4>
                  
                  <div className="bg-black-50 dark:bg-black-900/30 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                      {initialMembers.map((email) => (
                        <li key={email} className="p-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                              <span className="text-indigo-700 dark:text-indigo-300 text-sm font-medium">
                                {email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeInitialMember(email)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            aria-label={`Remove ${email}`}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              
              {error && !nameError && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}
            </div>
          </div>
          
          {/* Submit button */}
          <div className="flex items-center justify-end pt-4">
            <Link
              href={isEditMode && teamId ? `/teams/${teamId}` : "/teams"}
              className="px-5 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg mr-4 hover:bg-black-100 dark:hover:bg-black-700 transition-colors"
            >
              Cancel
            </Link>
            
            <button
              type="submit"
              disabled={submitting || uploadingImage}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {(submitting || uploadingImage) && <LoadingSpinner size="sm" className="mr-2" />}
              {isEditMode 
                ? submitting ? 'Updating...' : 'Update Team'
                : submitting ? 'Creating...' : 'Create Team'
              }
            </button>
          </div>
        </form>
      </div>

      {/* Tips section */}
      <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
        <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300 mb-3 flex items-center">
          <Info className="h-4 w-4 mr-2" />
          Tips for {isEditMode ? 'managing' : 'creating'} your team
        </h3>
        <ul className="list-disc pl-5 space-y-2 text-sm text-indigo-700 dark:text-indigo-300">
          <li>Choose a clear, descriptive name that reflects the team&apos;s purpose</li>
          <li>Upload a recognizable avatar to make your team stand out</li>
          <li>Add key members who need immediate access to the team</li>
          <li>You can always add more members later</li>
        </ul>
      </div>
    </div>
    </AppLayout>
  );
}

// Main component that wraps with Suspense
const CreateTeamPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-20 flex justify-center items-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading team form...</p>
        </div>
      </div>
    }>
      <CreateTeamForm />
    </Suspense>
  );
};

export default CreateTeamPage;