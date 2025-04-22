/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Clock, Edit2, Save, 
  CheckCircle, XCircle, Upload, Camera, 
  Briefcase, Github, Twitter, Linkedin,
  MessageSquare, UserPlus, Shield, Key,
  Map, Calendar, Users, Activity, RefreshCw,
  Globe
} from 'lucide-react';

import HeaderDash from '../components/HeaderDash';
import useAuthStore from '../store/useAuthStore';

// User interface based on API response
interface UserProfile {
  _id: string;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  social?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
  jobTitle?: string;
  createdAt: string;
  updatedAt: string;
}

const defaultAvatar = 'https://via.placeholder.com/150';

const ProfilePage: React.FC = () => {
  const router = useRouter();
  const { user: authUser, accessToken } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editForm, setEditForm] = useState({
    name: '',
    username: '',
    bio: '',
    avatar: '',
    jobTitle: '',
    location: '',
    website: '',
    github: '',
    twitter: '',
    linkedin: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!accessToken) {
        router.push('/signIn');
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load profile');
        }
        
        const data = await response.json();
        if (data.success && data.data) {
          setProfile(data.data);
          // Initialize edit form with current values
          setEditForm({
            name: data.data.name || '',
            username: data.data.username || '',
            bio: data.data.bio || '',
            avatar: data.data.avatar || '',
            jobTitle: data.data.jobTitle || '',
            location: data.data.location || '',
            website: data.data.website || '',
            github: data.data.social?.github || '',
            twitter: data.data.social?.twitter || '',
            linkedin: data.data.social?.linkedin || ''
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [accessToken, router]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  };
  
  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle avatar upload
  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Upload avatar image
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size and type
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }
    
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Only JPG, JPEG and PNG files are allowed');
      return;
    }
    
    setUploadingAvatar(true);
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      // You might need to adjust this to match your actual avatar upload endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/upload-avatar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }
      
      const data = await response.json();
      
      if (data.success && data.data?.avatar) {
        setEditForm(prev => ({ ...prev, avatar: data.data.avatar }));
        setSuccess('Avatar uploaded successfully');
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload avatar. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };
  
  // Save profile changes
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!accessToken) {
      router.push('/signIn');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    const updateData = {
      name: editForm.name,
      bio: editForm.bio,
      avatar: editForm.avatar,
      jobTitle: editForm.jobTitle,
      location: editForm.location,
      website: editForm.website,
      social: {
        github: editForm.github,
        twitter: editForm.twitter,
        linkedin: editForm.linkedin
      }
    };
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setProfile(data.data);
        setIsEditing(false);
        setSuccess('Profile updated successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Cancel editing
  const handleCancel = () => {
    if (profile) {
      // Reset form to current profile values
      setEditForm({
        name: profile.name || '',
        username: profile.username || '',
        bio: profile.bio || '',
        avatar: profile.avatar || '',
        jobTitle: profile.jobTitle || '',
        location: profile.location || '',
        website: profile.website || '',
        github: profile.social?.github || '',
        twitter: profile.social?.twitter || '',
        linkedin: profile.social?.linkedin || ''
      });
    }
    setIsEditing(false);
  };
  
  // Clear notifications
  const clearNotifications = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  // Profile skeleton loader
  const ProfileSkeleton = () => (
    <div className="animate-pulse">
      <div className="flex flex-col items-center mb-6">
        <div className="h-36 w-36 rounded-full bg-gray-700"></div>
        <div className="h-7 w-48 bg-gray-700 mt-4 rounded-md"></div>
        <div className="h-5 w-32 bg-gray-700 mt-2 rounded-md"></div>
      </div>
      <div className="space-y-6">
        <div className="h-32 bg-gray-700 rounded-xl"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gray-700 rounded-md"></div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <HeaderDash />
      
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <User className="mr-3 h-6 w-6 text-indigo-400" />
              User Profile
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage your personal information and account settings
            </p>
          </div>
          
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </button>
          )}
        </div>
        
        {/* Notification area */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-400 mr-3" />
                <span className="text-sm font-medium text-red-200">{error}</span>
              </div>
              <button 
                onClick={clearNotifications}
                className="text-red-300 hover:text-white p-1 rounded-full transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </motion.div>
          )}
          
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0 }}
              className="mb-6 p-4 bg-green-900/50 border border-green-700 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                <span className="text-sm font-medium text-green-200">{success}</span>
              </div>
              <button 
                onClick={clearNotifications}
                className="text-green-300 hover:text-white p-1 rounded-full transition-colors"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Profile content */}
        <div className="bg-gray-800 shadow-xl rounded-xl border border-gray-700 overflow-hidden">
          {/* Profile header with avatar banner */}
          <div className="relative h-48 bg-gradient-to-r from-indigo-700 to-purple-700">
            {/* Wave overlay effect */}
            <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 25.9086C277 84.5821 433 65.736 720 25.9086C934.818 -3.9019 1214.06 -5.23669 1442 8.06597C2079 45.2421 2208 63.5007 2560 25.9088V171.91L0 171.91V25.9086Z" fill="#1F2937" fillOpacity="0.8"/>
            </svg>
            
            {/* Profile image */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 z-10">
              <div className="relative h-32 w-32 md:h-36 md:w-36">
                <div className="rounded-full overflow-hidden border-4 border-gray-800 bg-gray-700 h-full w-full">
                  {isEditing ? (
                    <div 
                      onClick={handleAvatarClick}
                      className="h-full w-full flex flex-col items-center justify-center bg-gray-700 cursor-pointer group relative"
                    >
                      {uploadingAvatar ? (
                        <div className="flex flex-col items-center justify-center">
                          <RefreshCw className="h-8 w-8 text-indigo-400 animate-spin" />
                          <span className="text-xs text-gray-300 mt-1">Uploading...</span>
                        </div>
                      ) : (
                        <>
                          {editForm.avatar ? (
                            <div className="relative w-full h-full">
                              <Image
                                src={editForm.avatar}
                                alt="Profile avatar"
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="h-8 w-8 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center">
                              <Camera className="h-8 w-8 text-indigo-400" />
                              <span className="text-xs text-gray-300 mt-1">Upload photo</span>
                            </div>
                          )}
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                          />
                        </>
                      )}
                    </div>
                  ) : (
                    profile?.avatar ? (
                      <Image
                        src={profile.avatar}
                        alt={`${profile.name}'s profile picture`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-indigo-900">
                        <span className="text-3xl font-bold text-indigo-300">
                          {profile?.name?.charAt(0) || profile?.username?.charAt(0) || '?'}
                        </span>
                      </div>
                    )
                  )}
                </div>
                
                {/* Online indicator */}
                <div className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-gray-800"></div>
              </div>
            </div>
          </div>
          
          {/* Tabs navigation */}
          <div className="flex justify-center mt-20 mb-6 border-b border-gray-700">
            <nav className="-mb-px flex space-x-6 px-4">
              <button
                className={`py-4 px-1 relative font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'text-indigo-400 border-b-2 border-indigo-400'
                    : 'text-gray-400 hover:text-gray-300'
                } transition-colors`}
                onClick={() => setActiveTab('overview')}
              >
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Overview
                </span>
              </button>
              
              <button
                className={`py-4 px-1 relative font-medium text-sm ${
                  activeTab === 'activity'
                    ? 'text-indigo-400 border-b-2 border-indigo-400'
                    : 'text-gray-400 hover:text-gray-300'
                } transition-colors`}
                onClick={() => setActiveTab('activity')}
              >
                <span className="flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Activity
                </span>
              </button>
              
              <button
                className={`py-4 px-1 relative font-medium text-sm ${
                  activeTab === 'security'
                    ? 'text-indigo-400 border-b-2 border-indigo-400'
                    : 'text-gray-400 hover:text-gray-300'
                } transition-colors`}
                onClick={() => setActiveTab('security')}
              >
                <span className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Security
                </span>
              </button>
            </nav>
          </div>
          
          {/* Profile content based on tab */}
          <div className="px-6 pb-8">
            {isLoading ? (
              <ProfileSkeleton />
            ) : (
              <>
                {activeTab === 'overview' && (
                  <div>
                    {isEditing ? (
                      <form onSubmit={handleSubmit}>
                        <div className="space-y-6">
                          {/* Basic info section */}
                          <div>
                            <h3 className="text-lg font-medium text-indigo-400 mb-4">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                                  Full Name
                                </label>
                                <input
                                  type="text"
                                  id="name"
                                  name="name"
                                  value={editForm.name}
                                  onChange={handleChange}
                                  className="bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="Your full name"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                                  Username
                                </label>
                                <input
                                  type="text"
                                  id="username"
                                  name="username"
                                  value={editForm.username}
                                  disabled
                                  className="bg-gray-700 text-gray-400 border border-gray-600 rounded-lg py-2 px-3 w-full cursor-not-allowed"
                                  placeholder="Username cannot be changed"
                                />
                              </div>
                              
                              <div className="md:col-span-2">
                                <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">
                                  Bio
                                </label>
                                <textarea
                                  id="bio"
                                  name="bio"
                                  rows={3}
                                  value={editForm.bio || ''}
                                  onChange={handleChange}
                                  className="bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="Tell us a little about yourself"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-300 mb-1">
                                  Job Title
                                </label>
                                <input
                                  type="text"
                                  id="jobTitle"
                                  name="jobTitle"
                                  value={editForm.jobTitle || ''}
                                  onChange={handleChange}
                                  className="bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="Your job title"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-1">
                                  Location
                                </label>
                                <input
                                  type="text"
                                  id="location"
                                  name="location"
                                  value={editForm.location || ''}
                                  onChange={handleChange}
                                  className="bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="City, Country"
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Contact info section */}
                          <div>
                            <h3 className="text-lg font-medium text-indigo-400 mb-4">Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                                  Email Address
                                </label>
                                <input
                                  type="email"
                                  id="email"
                                  name="email"
                                  value={profile?.email || ''}
                                  disabled
                                  className="bg-gray-700 text-gray-400 border border-gray-600 rounded-lg py-2 px-3 w-full cursor-not-allowed"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="website" className="block text-sm font-medium text-gray-300 mb-1">
                                  Website
                                </label>
                                <input
                                  type="url"
                                  id="website"
                                  name="website"
                                  value={editForm.website || ''}
                                  onChange={handleChange}
                                  className="bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="https://example.com"
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Social links section */}
                          <div>
                            <h3 className="text-lg font-medium text-indigo-400 mb-4">Social Profiles</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label htmlFor="github" className="text-sm font-medium text-gray-300 mb-1 flex items-center">
                                  <Github className="h-4 w-4 mr-1 text-gray-400" />
                                  GitHub
                                </label>
                                <input
                                  type="text"
                                  id="github"
                                  name="github"
                                  value={editForm.github || ''}
                                  onChange={handleChange}
                                  className="bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="GitHub username"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="twitter" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                                  <Twitter className="h-4 w-4 mr-1 text-gray-400" />
                                  Twitter
                                </label>
                                <input
                                  type="text"
                                  id="twitter"
                                  name="twitter"
                                  value={editForm.twitter || ''}
                                  onChange={handleChange}
                                  className="bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="Twitter username"
                                />
                              </div>
                              
                              <div>
                                <label htmlFor="linkedin" className="block text-sm font-medium text-gray-300 mb-1 flex items-center">
                                  <Linkedin className="h-4 w-4 mr-1 text-gray-400" />
                                  LinkedIn
                                </label>
                                <input
                                  type="text"
                                  id="linkedin"
                                  name="linkedin"
                                  value={editForm.linkedin || ''}
                                  onChange={handleChange}
                                  className="bg-gray-700 text-white border border-gray-600 rounded-lg py-2 px-3 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                  placeholder="LinkedIn username"
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Form actions */}
                          <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-gray-700">
                            <button
                              type="button"
                              onClick={handleCancel}
                              className="px-4 py-2 border border-gray-600 rounded-xl text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isSaving}
                              className="px-4 py-2 border border-transparent rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center"
                            >
                              {isSaving ? (
                                <>
                                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div>
                        {/* Profile name and username */}
                        <div className="text-center mb-8">
                          <h2 className="text-2xl font-bold text-white">{profile?.name}</h2>
                          <p className="text-indigo-400">@{profile?.username}</p>
                          
                          {profile?.jobTitle && (
                            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-900/50 text-indigo-300">
                              <Briefcase className="h-3.5 w-3.5 mr-1" />
                              {profile.jobTitle}
                            </div>
                          )}
                        </div>
                        
                        {/* Bio */}
                        {profile?.bio && (
                          <div className="bg-gray-700/50 rounded-xl p-4 mb-6 backdrop-blur-sm border border-gray-700">
                            <p className="text-gray-300 text-center">{profile.bio}</p>
                          </div>
                        )}
                        
                        {/* Info grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          {/* Personal info */}
                          <div className="bg-gray-700/30 p-5 rounded-xl border border-gray-700">
                            <h3 className="text-lg font-medium text-white mb-4">Personal Information</h3>
                            <ul className="space-y-3">
                              <li className="flex items-center">
                                <Mail className="h-5 w-5 text-indigo-400 mr-3" />
                                <span className="text-gray-300">{profile?.email}</span>
                              </li>
                              
                              {profile?.location && (
                                <li className="flex items-center">
                                  <Map className="h-5 w-5 text-indigo-400 mr-3" />
                                  <span className="text-gray-300">{profile.location}</span>
                                </li>
                              )}
                              
                              {profile?.website && (
                                <li className="flex items-center">
                                  <Globe className="h-5 w-5 text-indigo-400 mr-3" />
                                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                                    {profile.website.replace(/(^\w+:|^)\/\//, '')}
                                  </a>
                                </li>
                              )}
                              
                              <li className="flex items-center">
                                <Calendar className="h-5 w-5 text-indigo-400 mr-3" />
                                <span className="text-gray-300">
                                  {profile?.createdAt ? `Joined ${formatDate(profile.createdAt)}` : 'Recently joined'}
                                </span>
                              </li>
                            </ul>
                          </div>
                          
                          {/* Social profiles */}
                          <div className="bg-gray-700/30 p-5 rounded-xl border border-gray-700">
                            <h3 className="text-lg font-medium text-white mb-4">Social Profiles</h3>
                            {(profile?.social?.github || profile?.social?.twitter || profile?.social?.linkedin) ? (
                              <ul className="space-y-3">
                                {profile?.social?.github && (
                                  <li>
                                    <a href={`https://github.com/${profile.social.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center group">
                                      <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                                        <Github className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors" />
                                      </div>
                                      <div>
                                        <span className="block text-sm font-medium text-gray-300 group-hover:text-white transition-colors">GitHub</span>
                                        <span className="block text-xs text-indigo-400">@{profile.social.github}</span>
                                      </div>
                                    </a>
                                  </li>
                                )}
                                
                                {profile?.social?.twitter && (
                                  <li>
                                    <a href={`https://twitter.com/${profile.social.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center group">
                                      <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                                        <Twitter className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors" />
                                      </div>
                                      <div>
                                        <span className="block text-sm font-medium text-gray-300 group-hover:text-white transition-colors">Twitter</span>
                                        <span className="block text-xs text-indigo-400">@{profile.social.twitter}</span>
                                      </div>
                                    </a>
                                  </li>
                                )}
                                
                                {profile?.social?.linkedin && (
                                  <li>
                                    <a href={`https://linkedin.com/in/${profile.social.linkedin}`} target="_blank" rel="noopener noreferrer" className="flex items-center group">
                                      <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center mr-3">
                                        <Linkedin className="h-5 w-5 text-gray-300 group-hover:text-white transition-colors" />
                                      </div>
                                      <div>
                                        <span className="block text-sm font-medium text-gray-300 group-hover:text-white transition-colors">LinkedIn</span>
                                        <span className="block text-xs text-indigo-400">in/{profile.social.linkedin}</span>
                                      </div>
                                    </a>
                                  </li>
                                )}
                              </ul>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                                <Users className="h-10 w-10 mb-2" />
                                <p className="text-sm">No social profiles added yet</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'activity' && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-medium text-white">Recent Activity</h3>
                      <button className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center">
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </button>
                    </div>
                    
                    {/* Placeholder for activity */}
                    <div className="space-y-6 pb-4">
                      <div className="py-6 flex flex-col items-center justify-center text-gray-500">
                        <Activity className="h-12 w-12 mb-3" />
                        <p className="text-center mb-2">Your recent activity will appear here</p>
                        <span className="text-sm">Coming soon in a future update</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {activeTab === 'security' && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-6">Security Settings</h3>
                    
                    <div className="space-y-6">
                      <div className="bg-gray-700/30 p-5 rounded-xl border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white flex items-center">
                              <Key className="h-5 w-5 mr-2 text-indigo-400" />
                              Change Password
                            </h4>
                            <p className="text-sm text-gray-400 mt-1">
                              Update your password regularly to keep your account secure
                            </p>
                          </div>
                          <button className="px-4 py-2 rounded-xl border border-indigo-600 text-indigo-400 hover:bg-indigo-900/50 transition-colors text-sm">
                            Update Password
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-700/30 p-5 rounded-xl border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white flex items-center">
                              <Shield className="h-5 w-5 mr-2 text-indigo-400" />
                              Two-Factor Authentication
                            </h4>
                            <p className="text-sm text-gray-400 mt-1">
                              Add an extra layer of security to your account
                            </p>
                          </div>
                          <button className="px-4 py-2 rounded-xl border border-gray-600 text-gray-400 hover:bg-gray-700 transition-colors text-sm">
                            Coming Soon
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-700/30 p-5 rounded-xl border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-white flex items-center">
                              <MessageSquare className="h-5 w-5 mr-2 text-indigo-400" />
                              Notification Settings
                            </h4>
                            <p className="text-sm text-gray-400 mt-1">
                              Manage how we contact you
                            </p>
                          </div>
                          <button className="px-4 py-2 rounded-xl border border-gray-600 text-gray-400 hover:bg-gray-700 transition-colors text-sm">
                            Configure
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;