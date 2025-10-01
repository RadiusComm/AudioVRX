import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ScenarioDifficulty } from '../types';
import { supabase, uploadPersonaImage } from '../lib/supabase';
import { ScenarioBasicInfo } from '../components/scenarios/ScenarioBasicInfo';
import { ScenarioContent } from '../components/scenarios/ScenarioContent';
import { AgentSelector } from '../components/scenarios/AgentSelector';
import { ScenarioMetadata } from '../components/scenarios/ScenarioMetadata';

interface Persona {
  id: string;
  name: string;
  role: string;
  company?: string;
  avatar_url?: string;
  background?: string;
  personality?: string[];
  voice_type?: string;
}

const PERSONAS_PER_PAGE = 4;

export const CreateScenario = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [formData, setFormData] = useState({
    description: '',
    themeOfStory: '',
    difficulty: ScenarioDifficulty.BEGINNER,
    category: '',
    tags: '',
    coverImageUrl: '',
    isPublic: false,
    initialPrompt: '',
  });

  // Form guidance state
  const [formStep, setFormStep] = useState(1);
  const [showTitleBubble, setShowTitleBubble] = useState(true);
  const [showTypeBubble, setShowTypeBubble] = useState(false);
  const [showCategoryBubble, setShowCategoryBubble] = useState(false);
  const [showGenerateBubble, setShowGenerateBubble] = useState(false);
  const [showAgentBubble, setShowAgentBubble] = useState(false);
  const [hasGeneratedContent, setHasGeneratedContent] = useState(false);
  const [titleTypingTimer, setTitleTypingTimer] = useState<NodeJS.Timeout | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    loadPersonas();
  }, []);

  useEffect(() => {
    // Clear any existing timer when title changes
    if (titleTypingTimer) {
      clearTimeout(titleTypingTimer);
    }

    // Progress through steps based on form completion
    if (formData.themeOfStory !== '') {
      setFormStep(2);
      setShowTitleBubble(false);
      setTimeout(() => {
        setShowTypeBubble(true);
      }, 300);
    }
    
    if (formData.themeOfStory !== '' && formData.difficulty !== '') {
      setFormStep(3);
      setShowTypeBubble(false);
      setTimeout(() => {
        setShowCategoryBubble(true);
      }, 300);
    }
    
    if (formData.themeOfStory !== '' && formData.difficulty !== '' && formData.category !== '') {
      setFormStep(4);
      setShowCategoryBubble(false);
      setTimeout(() => {
        setShowGenerateBubble(true);
      }, 500);
    }
    
    // Clean up timer on unmount
    return () => {
      if (titleTypingTimer) {
        clearTimeout(titleTypingTimer);
      }
    };
  }, [formData.themeOfStory, formData.difficulty, formData.category, formStep]);

  const loadPersonas = async () => {
    try {
      const { data, error } = await supabase
        .from('iq_agents')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(30);

      if (error) throw error;
      setPersonas(data || []);
    } catch (err) {
      console.error('Error loading personas:', err);
      setError('Failed to load IQ agents');
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
    if (!formData.themeOfStory || !formData.difficulty) {
      setError('Please enter theme of story and select difficulty level');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setShowGenerateBubble(false);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scenario`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          themeOfStory: formData.themeOfStory,
          difficulty: formData.difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate scenario');
      }

      const data = await response.json();
      console.log("Printing the API response", data);
      
      setFormData(prev => ({
        ...prev,
        description: data.description,
        initialPrompt: data.initialPrompt,
        systemPrompt: data.systemPrompt || '',
        tags: data.tags.join(', '),
        coverImageUrl: data.coverImageUrl,
        assignedVoices: data.assignedVoices
      }));
      
      // Set flag to enable remaining fields
      setHasGeneratedContent(true);
      setFormStep(5);
      
      // Show agent selection bubble after content generation
      setTimeout(() => {
        setShowAgentBubble(true);
      }, 500);
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

      const selectedPersona = personas.find(p => p.id === formData.personaId);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-roleplay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          themeOfStory: formData.themeOfStory,
          description: formData.description,
          difficulty: formData.difficulty,
          tags: tagsArray,
          coverImageUrl: formData.coverImageUrl,
          userId: user.id,
          initialPrompt: formData.initialPrompt,
          systemPrompt: formData.systemPrompt,
          assignedVoices: formData.assignedVoices
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create role-play');
      }

      navigate('/role-plays');
    } catch (err: any) {
      console.error('Error creating scenario:', err);
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


  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const publicUrl = await uploadPersonaImage(user.id, file);
      setFormData(prev => ({ ...prev, coverImageUrl: publicUrl }));
    } catch (err: any) {
      console.error('Error uploading image:', err);
      setError(err.message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900/20">
        <motion.div 
          className="max-w-4xl mx-auto py-6 md:py-12 px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center mb-6 md:mb-8">
            <Button
              variant="ghost"
              size="sm"
              className="mr-2 md:mr-4"
              disabled={!formData.themeOfStory || formData.difficulty === '' || formData.category === ''}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-white text-glow">
                Create Role Play Scenario
              </h1>
              <p className="mt-1 md:mt-2 text-sm md:text-base text-gray-300">
                Design a custom conversation scenario for training
              </p>
            </div>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl text-white">Role-Play Scenario Details</CardTitle>
                <CardDescription className="text-sm md:text-base text-gray-300">
                  Define the parameters and flow of your role play scenario
                </CardDescription>
              </CardHeader>

              <CardContent className="px-4 md:px-6">
                {error && (
                  <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30">
                    <p className="flex items-center text-sm font-medium">
                      <span className="mr-2">⚠️</span>
                      {error}
                    </p>
                  </div>
                )}

                <div className="space-y-4 md:space-y-6">
                  <ScenarioBasicInfo 
                    formData={{ themeOfStory: formData.themeOfStory, difficulty: formData.difficulty, category: formData.category }}
                    handleChange={handleChange}
                    handleGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    showTypeBubble={showTypeBubble}
                    showCategoryBubble={showCategoryBubble}
                    showGenerateBubble={showGenerateBubble}
                    formStep={formStep}
                  />

                  <ScenarioContent
                    formData={{ 
                      description: formData.description, 
                      initialPrompt: formData.initialPrompt,
                      systemPrompt: formData.systemPrompt || ''
                    }}
                    handleChange={handleChange}
                    hasGeneratedContent={hasGeneratedContent}
                  />

                  <ScenarioMetadata
                    formData={{ tags: formData.tags, coverImageUrl: formData.coverImageUrl, isPublic: formData.isPublic }}
                    handleChange={handleChange}
                    hasGeneratedContent={hasGeneratedContent}
                    onImageUpload={handleImageUpload}
                    isUploading={isUploadingImage}
                  />
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
                  className={`bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 cinematic-glow ${!hasGeneratedContent ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={!hasGeneratedContent}
                >
                  Create Role-Play
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};