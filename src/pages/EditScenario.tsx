import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Tag, Sparkles, ChevronLeft, ChevronRight, UserCircle, Camera } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { ScenarioDifficulty } from '../types';
import { supabase, uploadPersonaImage } from '../lib/supabase';

interface Persona {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar_url?: string;
}

interface RolePlayAgent {
  id: string;
  name: string;
  avatar_url?: string;
  scenario_id: string;
  type: string;
}

const PERSONAS_PER_PAGE = 4;

export const EditScenario = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [rolePlayAgents, setRolePlayAgents] = useState<RolePlayAgent[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: ScenarioDifficulty.BEGINNER,
    tags: '',
    cover_image_url: '',
    persona_id: '',
    is_public: false,
    initialPrompt: '',
    systemPrompt: ''
  });

  useEffect(() => {
    loadScenario();
    loadPersonas();
    loadRolePlayAgents();
  }, [id]);

  const loadScenario = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Scenario not found');

      setFormData({
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        tags: (data.tags || []).join(', '),
        cover_image_url: data.cover_image_url,
        persona_id: data.persona_id || '',
        is_public: data.is_public,
        initialPrompt: data.initial_prompt || '',
        systemPrompt: data.system_prompt || ''
      });
    } catch (err: any) {
      console.error('Error loading scenario:', err);
      setError(err.message);
    }
  };

  const loadRolePlayAgents = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('role_play_agents')
        .select('*')
        .eq('scenario_id', id);

      if (error) throw error;
      setRolePlayAgents(data || []);
    } catch (err: any) {
      console.error('Error loading role play agents:', err);
    }
  };

  const loadPersonas = async () => {
    try {
      const { data, error } = await supabase
        .from('iq_agents')
        .select('id, name, avatar_url')
        .order('created_at', { ascending: true })
        .limit(30);

      if (error) throw error;
      setPersonas(data || []);
    } catch (err: any) {
      console.error('Error loading personas:', err);
      setError('Failed to load IQ Agent');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleGenerate = async () => {
    if (!formData.title.trim()) {
      setError('Please enter a title first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scenario`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate scenario');
      }

      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        description: data.description,
        difficulty: data.difficulty,
        tags: data.tags.join(', '),
        cover_image_url: data.coverImageUrl,
        initialPrompt: data.initialPrompt || prev.initialPrompt,
        systemPrompt: data.systemPrompt || prev.systemPrompt
      }));
    } catch (err: any) {
      console.error('Error generating scenario:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');

      const { error } = await supabase
        .from('scenarios')
        .update({
          title: formData.title,
          description: formData.description,
          difficulty: formData.difficulty,
          tags: tagsArray,
          cover_image_url: formData.cover_image_url,
          persona_id: formData.persona_id || null,
          is_public: formData.is_public,
          initial_prompt: formData.initialPrompt,
          system_prompt: formData.systemPrompt
        })
        .eq('id', id);

      if (error) throw error;
      navigate('/role-plays');
    } catch (err: any) {
      console.error('Error updating scenario:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const totalPages = Math.ceil(personas.length / PERSONAS_PER_PAGE);
  const paginatedPersonas = personas.slice(
    currentPage * PERSONAS_PER_PAGE,
    (currentPage + 1) * PERSONAS_PER_PAGE
  );

  // Check if persona is used by a role play agent for this scenario
  const isPersonaUsedByRolePlayAgent = (personaId: string) => {
    // Find if there's a role play agent that uses this persona
    const agent = rolePlayAgents.find(agent => agent.name === personas.find(p => p.id === personaId)?.name);
    return !!agent;
  };

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const publicUrl = await uploadPersonaImage(user.id, file);
      setFormData(prev => ({ ...prev, cover_image_url: publicUrl }));
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageUpload(file);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <motion.div 
          className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              className="mr-4"
              onClick={() => navigate('/role-plays')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                Edit Role-Play
              </h1>
            </div>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>Role-Play Details</CardTitle>
                <CardDescription>
                  Modify the information below to update your training role-play
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {error && (
                  <div className="p-3 bg-error-50 dark:bg-error-900/50 text-error-700 dark:text-error-200 rounded-md">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-6">
                  <div className="flex space-x-4">
                    <Input
                      label="Title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter a descriptive title"
                      required
                      fullWidth
                    />
                    <div className="flex items-end">
                      <Button
                        type="button"
                        onClick={handleGenerate}
                        isLoading={isGenerating}
                        leftIcon={<Sparkles className="h-4 w-4" />}
                        className="bg-gradient-to-r from-accent-500 to-secondary-500 hover:from-accent-600 hover:to-secondary-600"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Describe the role-play and its goals"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Difficulty
                      </label>
                      <select
                        name="difficulty"
                        value={formData.difficulty}
                        onChange={handleChange}
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        required
                      >
                        {Object.values(ScenarioDifficulty).map((difficulty) => (
                          <option key={difficulty} value={difficulty}>
                            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Tags
                      </label>
                      <Input
                        name="tags"
                        value={formData.tags}
                        onChange={handleChange}
                        placeholder="e.g., Sales, Negotiation, Communication"
                        leftIcon={<Tag className="h-5 w-5" />}
                        fullWidth
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Initial Prompt
                    </label>
                    <textarea
                      name="initialPrompt"
                      value={formData.initialPrompt}
                      onChange={handleChange}
                      rows={4}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Enter the initial conversation prompt"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      System Prompt
                    </label>
                    <textarea
                      name="systemPrompt"
                      value={formData.systemPrompt}
                      onChange={handleChange}
                      rows={4}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Enter the system prompt for the AI"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                        <UserCircle className="h-5 w-5 mr-2 text-primary-600 dark:text-primary-400" />
                        Select IQ Agent
                      </h3>
                      {totalPages > 1 && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                            disabled={currentPage === 0}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {currentPage + 1} / {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                            disabled={currentPage === totalPages - 1}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paginatedPersonas.map((persona) => {
                        const isUsedByRolePlayAgent = isPersonaUsedByRolePlayAgent(persona.id);
                        return (
                          <div
                            key={persona.id}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                              formData.persona_id === persona.id
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/50'
                                : isUsedByRolePlayAgent
                                  ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/50'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, persona_id: persona.id }))}
                          >
                            <div className="flex items-center space-x-4">
                              <Avatar
                                src={persona.avatar_url}
                                name={persona.name}
                                size="md"
                              />
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {persona.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {persona?.role}
                                  {persona?.company && ` at ${persona?.company}`}
                                </p>
                                {isUsedByRolePlayAgent && (
                                  <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900/50 dark:text-secondary-200">
                                    Currently assigned
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cover Image
                    </label>
                    
                    {/* File Upload Option */}
                    <div className="mb-4">
                      <label className="flex flex-col items-center px-4 py-6 bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                        <Upload className="h-8 w-8 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {isUploadingImage ? 'Uploading...' : 'Upload cover image'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          PNG, JPG up to 5MB
                        </span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/png, image/jpeg, image/jpg" 
                          onChange={handleFileChange}
                          disabled={isUploadingImage}
                        />
                      </label>
                    </div>
                    
                    <div className="relative text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                      </div>
                      <div className="relative flex justify-center">
                        <span className="px-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">OR</span>
                      </div>
                    </div>
                    
                    <Input
                      name="cover_image_url"
                      value={formData.cover_image_url}
                      onChange={handleChange}
                      placeholder="Enter image URL"
                      leftIcon={<Camera className="h-5 w-5" />}
                      helpText="Recommended size: 1280x720px"
                      fullWidth
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_public"
                      name="is_public"
                      checked={formData.is_public}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_public" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Make this role-play public
                    </label>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/role-plays')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                >
                  Save Changes
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};