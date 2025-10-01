import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Camera, Loader2, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { getCurrentUser, getUserProfile, updateUserProfile, uploadAvatar } from '../lib/supabase';
import type { User as UserType } from '../types';

export const Profile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    avatarUrl: '',
  });
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
      setFormData({
        firstName: userProfile.first_name || '',
        lastName: userProfile.last_name || '',
        email: user.email || '',
        avatarUrl: userProfile.avatar_url || '',
      });
      setPreviewUrl(userProfile.avatar_url || '');
    } catch (err) {
      setError('Failed to load profile');
      console.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !profile?.id) return;

    setIsUploading(true);
    setError(null);

    try {
      // Create a preview URL for the uploaded file
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      const publicUrl = await uploadAvatar(profile.id, file);
      await updateUserProfile(profile.id, { avatar_url: publicUrl });
      setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));

      // Clean up the preview URL
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError('Failed to upload avatar');
      console.error('Error uploading avatar:', err);
    } finally {
      setIsUploading(false);
    }
  }, [profile?.id]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxSize: 5242880, // 5MB
    multiple: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (!profile?.id) throw new Error('No profile ID');

      await updateUserProfile(profile.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        avatar_url: formData.avatarUrl,
      });

      await loadProfile();
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Update preview URL for avatar URL changes
    if (name === 'avatarUrl' && !value.startsWith('data:')) {
      setPreviewUrl(value);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary-600 dark:text-primary-400 animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={profile}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
            <p className="mt-1 text-gray-600 dark:text-gray-300">
              Manage your account settings and profile information
            </p>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and profile picture
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <div className="p-3 bg-error-50 dark:bg-error-900/50 text-error-700 dark:text-error-200 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex flex-col items-center space-y-4">
                  <Avatar
                    src={previewUrl}
                    name={`${formData.firstName} ${formData.lastName}`}
                    size="xl"
                  />
                  
                  <div
                    {...getRootProps()}
                    className={`
                      w-full max-w-md p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
                      transition-colors duration-200
                      ${isDragActive 
                        ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/50' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                      }
                    `}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500" />
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                      {isDragActive
                        ? 'Drop your image here'
                        : 'Drag & drop an image here, or click to select'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG or GIF up to 5MB
                    </p>
                    {isUploading && (
                      <div className="mt-2">
                        <Loader2 className="h-5 w-5 mx-auto text-primary-600 dark:text-primary-400 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="w-full">
                    <Input
                      label="Profile Picture URL"
                      name="avatarUrl"
                      type="url"
                      value={formData.avatarUrl.startsWith('data:') ? '' : formData.avatarUrl}
                      onChange={handleChange}
                      placeholder="Enter image URL"
                      leftIcon={<Camera className="h-5 w-5" />}
                      helpText="Or enter an image URL directly"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Input
                    label="First Name"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    leftIcon={<User className="h-5 w-5" />}
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    leftIcon={<User className="h-5 w-5" />}
                  />
                </div>

                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  leftIcon={<Mail className="h-5 w-5" />}
                  helpText="Email cannot be changed"
                />
              </CardContent>

              <CardFooter className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSaving}
                >
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </Layout>
  );
};