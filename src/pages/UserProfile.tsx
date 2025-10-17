// src/pages/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, MapPin, Globe, Phone, Camera, Loader2 } from 'lucide-react'; 
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { updateProfile } from '@/store/authThunks';
import { clearAuthError } from '@/store/authSlice'; 

interface UserProfileFormFields {
  name: string;
  bio: string;
  location: string;
  website: string;
  phone: string;
}

export const UserProfile: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, loading, error: authError } = useAppSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfileFormFields>({
    name: '',
    bio: '',
    location: '',
    website: '',
    phone: ''
  });
  const [localError, setLocalError] = useState<string | null>(null); 
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        phone: user.phone || ''
      });
      setLocalError(null); 
    }
  }, [user]);

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setLocalError(null); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setLocalError("No user logged in.");
      return;
    }

    setIsSaving(true);
    setLocalError(null);

    try {
     await dispatch(updateProfile(formData)).unwrap(); 
      setIsEditing(false); 
    } catch (err: any) {
     
      const message = err.response?.data?.detail || 'Failed to update profile. Please try again.';
      setLocalError(message);
      console.error('Error updating profile:', err);
    } finally {
      setIsSaving(false); 
    }
  };

  if (!user && loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <span className="ml-3 text-lg text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  if (!user) {
      return (
        <div className="flex items-center justify-center min-h-[400px] text-red-500">
          <p>No user data available. Please log in.</p>
        </div>
      );
  }

  const currentProfile = user; 
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-emerald-500 to-emerald-600">
          <div className="absolute -bottom-12 left-8">
            <div className="relative">
              <img
                src={currentProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentProfile.name || currentProfile.email || 'User')}&background=0D9488&color=fff&size=128`}
                alt={currentProfile.name || currentProfile.email || 'User'}
                className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800 object-cover"
              />
              {isEditing && (
                <button className="absolute bottom-0 right-0 p-1 bg-emerald-500 rounded-full text-white hover:bg-emerald-600">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="pt-16 pb-8 px-8">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Website
                  </label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {(localError || authError) && ( 
                <div className="text-red-500 text-sm">
                  {localError || authError}
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setLocalError(null);
                    if (user) {
                      setFormData({
                        name: user.name || '',
                        bio: user.bio || '',
                        location: user.location || '',
                        website: user.website || '',
                        phone: user.phone || ''
                      });
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving} 
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50 transition-colors duration-200"
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2 inline-block" />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {currentProfile.name || currentProfile.email || 'User'}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 flex items-center mt-1">
                    <Mail className="w-4 h-4 mr-2" />
                    {currentProfile.email}
                  </p>
                  {currentProfile.is_verified ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                      Unverified
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors duration-200"
                >
                  Edit Profile
                </button>
              </div>

              {currentProfile.bio && (
                <p className="mt-4 text-gray-600 dark:text-gray-300">
                  {currentProfile.bio}
                </p>
              )}

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentProfile.location && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <MapPin className="w-4 h-4 mr-2" />
                    {currentProfile.location}
                  </div>
                )}
                {currentProfile.website && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Globe className="w-4 h-4 mr-2" />
                    <a
                      href={currentProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-500 hover:underline"
                    >
                      {currentProfile.website}
                    </a>
                  </div>
                )}
                {currentProfile.phone && (
                  <div className="flex items-center text-gray-600 dark:text-gray-300">
                    <Phone className="w-4 h-4 mr-2" />
                    {currentProfile.phone}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};