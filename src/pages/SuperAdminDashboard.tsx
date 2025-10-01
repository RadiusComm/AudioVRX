import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';
import { Users, Database, Settings, Shield, Activity, RefreshCw, AlertTriangle, MessageSquare, Wand2, Edit, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { toast } from 'sonner';
import { Modal } from '../components/ui/Modal';

interface Prompt {
  id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  name: string;
}

export const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    totalScenarios: 0,
    totalSessions: 0,
    totalStores: 0,
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  
  // Prompt management state
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [promptContent, setPromptContent] = useState('');
  const [promptName, setPromptName] = useState('');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState('');

  useEffect(() => {
    checkSuperAdminAccess();
    loadStats();
    loadPrompts();
  }, []);

  const checkSuperAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();
      
      if (error || !profile) {
        console.error('Error checking super admin access or profile not found:', error);
        navigate('/dashboard');
        return;
      }
      
      // Check if user is super admin (by role or specific email)
      const hasSuperAdminAccess = profile.role === 'super-admin' ;
      setIsSuperAdmin(hasSuperAdminAccess);
      
      if (!hasSuperAdminAccess) {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error checking super admin access:', err);
      navigate('/dashboard');
    }
  };

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get user stats
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, role, status');
      
      if (usersError) throw usersError;

      // Get scenario stats
      const { count: scenariosCount, error: scenariosError } = await supabase
        .from('scenarios')
        .select('*', { count: 'exact', head: true });
      
      if (scenariosError) throw scenariosError;

      // Get session stats
      const { count: sessionsCount, error: sessionsError } = await supabase
        .from('roleplay_sessions')
        .select('*', { count: 'exact', head: true });
      
      if (sessionsError) throw sessionsError;

      // Get store stats
      const { count: storesCount, error: storesError } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true });
      
      if (storesError) throw storesError;

      // Calculate stats
      const activeUsers = users?.filter(user => user.status === 'active').length || 0;
      const adminUsers = users?.filter(user => user.role === 'admin' || user.role === 'super-admin').length || 0;

      setStats({
        totalUsers: users?.length || 0,
        activeUsers,
        adminUsers,
        totalScenarios: scenariosCount || 0,
        totalSessions: sessionsCount || 0,
        totalStores: storesCount || 0,
      });
    } catch (err: any) {
      console.error('Error loading super admin stats:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('system_prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (err: any) {
      console.error('Error loading prompts:', err);
      toast.error('Failed to load prompts');
    }
  };

  const handleSavePrompt = async () => {
    if (!promptName.trim() || !promptContent.trim()) {
      toast.error('Please provide both a name and content for the prompt');
      return;
    }

    setIsSavingPrompt(true);
    try {
      if (selectedPrompt) {
        // Update existing prompt
        const { error } = await supabase
          .from('system_prompts')
          .update({
            content: promptContent,
            name: promptName,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPrompt.id);

        if (error) throw error;
        toast.success('Prompt updated successfully');
      } else {
        // Create new prompt
        const { error } = await supabase
          .from('system_prompts')
          .insert([{
            content: promptContent,
            name: promptName
          }]);

        if (error) throw error;
        toast.success('Prompt created successfully');
      }

      // Reset form and reload prompts
      setPromptContent('');
      setPromptName('');
      setSelectedPrompt(null);
      setIsPromptModalOpen(false);
      loadPrompts();
    } catch (err: any) {
      console.error('Error saving prompt:', err);
      toast.error('Failed to save prompt');
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleEditPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setPromptContent(prompt.content);
    setPromptName(prompt.name);
    setIsPromptModalOpen(true);
  };

  const handleTestPrompt = async () => {
    if (!promptContent.trim()) {
      toast.error('Please enter a prompt to test');
      return;
    }

    setIsGenerating(true);
    setGeneratedResult('');
    
    try {
      // Call OpenAI API via edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-prompt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptContent,
          input: 'Test input for the prompt'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate response');
      }

      const data = await response.json();
      setGeneratedResult(data.result);
    } catch (err: any) {
      console.error('Error testing prompt:', err);
      toast.error('Failed to test prompt: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <AlertTriangle className="h-12 w-12 text-warning-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  You don't have permission to access this page.
                </p>
                <Button onClick={() => navigate('/dashboard')}>
                  Return to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Mobile App Header */}
        <div className="md:hidden border-b border-blue-700 px-6 py-4 fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: 'rgb(32, 59, 118)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-white text-xl font-semibold">RetailIQ</span>
            </div>
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">Super Admin</h1>
            <div></div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="pt-16 md:pt-0">
            <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0 mb-8">
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">
                  Super Admin Dashboard
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  System-wide management and monitoring
                </p>
              </div>
              <div className="flex justify-end md:justify-start">
                <Button
                  onClick={loadStats}
                  leftIcon={<RefreshCw className="h-4 w-4" />}
                  variant="outline"
                  className="w-full md:w-auto"
                >
                  Refresh Data
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/50 text-error-700 dark:text-error-200 rounded-lg border border-error-200 dark:border-error-800">
              <p className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                {error}
              </p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Users
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total Users</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Active Users</div>
                      <div className="text-lg font-semibold text-success-600 dark:text-success-400">{stats.activeUsers}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Admin Users</div>
                      <div className="text-lg font-semibold text-primary-600 dark:text-primary-400">{stats.adminUsers}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => navigate('/users')}
                      className="border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                    >
                      View Users
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <Database className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Content
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total Scenarios</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalScenarios}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total Sessions</div>
                      <div className="text-lg font-semibold text-primary-600 dark:text-primary-400">{stats.totalSessions}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total Stores</div>
                      <div className="text-lg font-semibold text-secondary-600 dark:text-secondary-400">{stats.totalStores}</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => navigate('/role-plays')}
                      className="border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                      Manage Content
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Prompt Management Card */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2 text-purple-500" />
                Prompt Management
              </CardTitle>
              <CardDescription>
                Manage system prompts for AI interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-medium">System Prompts</h3>
                <Button
                  onClick={() => {
                    setSelectedPrompt(null);
                    setPromptContent('');
                    setPromptName('');
                    setIsPromptModalOpen(true);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add New Prompt
                </Button>
              </div>

              {prompts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No prompts have been created yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {prompts.map((prompt) => (
                    <div 
                      key={prompt.id} 
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{prompt.name}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {prompt.content}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPrompt(prompt)}
                            className="text-primary-600 dark:text-primary-400"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Admin Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-purple-500" />
                Super Admin Actions
              </CardTitle>
              <CardDescription>
                Perform system-wide administrative actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate('/users')}
                  className="h-auto py-4 flex flex-col items-center justify-center"
                >
                  <Users className="h-6 w-6 mb-2 text-purple-500" />
                  <span className="font-medium">User Management</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Manage all users and permissions
                  </span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/subscriptions')}
                  className="h-auto py-4 flex flex-col items-center justify-center"
                >
                  <Settings className="h-6 w-6 mb-2 text-indigo-500" />
                  <span className="font-medium">Subscription Management</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Manage user subscriptions and billing
                  </span>
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/analytics')}
                  className="h-auto py-4 flex flex-col items-center justify-center"
                >
                  <Activity className="h-6 w-6 mb-2 text-blue-500" />
                  <span className="font-medium">System Analytics</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    View detailed system performance metrics
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Prompt Modal */}
      <Modal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        title={selectedPrompt ? 'Edit Prompt' : 'Add New Prompt'}
      >
        <div className="space-y-4 p-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prompt Name
            </label>
            <Input
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
              placeholder="Enter a descriptive name"
              fullWidth
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Prompt Content
            </label>
            <textarea
              value={promptContent}
              onChange={(e) => setPromptContent(e.target.value)}
              rows={8}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Enter the prompt content..."
            />
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h4 className="text-lg font-medium mb-2 flex items-center">
              <Wand2 className="h-5 w-5 mr-2 text-purple-500" />
              Test Prompt
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              (To test the prompt, replace the variable with actual values.)
            </p>
            
            <div className="space-y-4">
              <Button
                onClick={handleTestPrompt}
                isLoading={isGenerating}
                className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
                leftIcon={<Wand2 className="h-4 w-4" />}
              >
                Generate
              </Button>
              
              {generatedResult && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Generated Result
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 max-h-40 overflow-y-auto">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {generatedResult}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => setIsPromptModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePrompt}
              isLoading={isSavingPrompt}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white"
            >
              {selectedPrompt ? 'Update Prompt' : 'Save Prompt'}
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};