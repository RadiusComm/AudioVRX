import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Mic, UserCircle } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { PersonalityTrait } from '../../types';
import { supabase } from '../../lib/supabase';

interface VoiceType {
  id: string;
  name: string;
  qualities: string[];
  description: string;
  elevenlabs_voice_id: string;
}

export const EditPersona = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceTypes, setVoiceTypes] = useState<VoiceType[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    personality: [] as PersonalityTrait[],
    voiceType: '',
    voiceId: '',
    avatarUrl: '',
    isPublic: false,
  });

  useEffect(() => {
    loadPersona();
    loadVoiceTypes();
  }, [id]);

  const loadVoiceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setVoiceTypes(data || []);
    } catch (err) {
      console.error('Error loading voice types:', err);
    }
  };

  const loadPersona = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('iq_agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('IQ Agent not found');

      setFormData({
        name: data.name || '',
        age: data.age?.toString() || '',
        personality: Array.isArray(data.personality) ? data.personality : [],
        voiceType: data.voice_type || '',
        voiceId: '',
        avatarUrl: data.avatar_url || '',
        isPublic: data.is_public || false,
      });
    } catch (err: any) {
      console.error('Error loading IQ agent:', err);
      setError(err.message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handlePersonalityChange = (trait: PersonalityTrait) => {
    setFormData(prev => {
      const currentPersonality = Array.isArray(prev.personality) ? prev.personality : [];
      return {
        ...prev,
        personality: currentPersonality.includes(trait)
          ? currentPersonality.filter(t => t !== trait)
          : [...currentPersonality, trait]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const selectedVoice = voiceTypes.find(v => v.name === formData.voiceType);
      if (!selectedVoice) {
        throw new Error('Selected voice type not found');
      }

      console.log("Printing the request object");
      console.log({
          id,
          name: formData.name,
          age: formData.age,
          personality: Array.isArray(formData.personality) ? formData.personality : [],
          voiceType: formData.voiceType,
          voiceId: selectedVoice.elevenlabs_voice_id,
          avatarUrl: formData.avatarUrl,
          isPublic: formData.isPublic,
        });


      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-persona`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          name: formData.name,
          age: formData.age,
          personality: Array.isArray(formData.personality) ? formData.personality : [],
          voiceType: formData.voiceType,
          voiceId: selectedVoice.elevenlabs_voice_id,
          avatarUrl: formData.avatarUrl,
          isPublic: formData.isPublic,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update IQ agent');
      }

      navigate('/iq-agents');
    } catch (err: any) {
      console.error('Error updating IQ agent:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedVoice = voiceTypes.find(v => v.id === formData.voiceType);

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
              onClick={() => navigate('/iq-agents')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                Edit IQ Agent
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Update the characteristics and personality of your AI conversation partner
              </p>
            </div>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>IQ Agent Details</CardTitle>
                <CardDescription>
                  Modify the characteristics and personality of your AI conversation partner
                </CardDescription>
              </CardHeader>

              <CardContent>
                {error && (
                  <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/50 text-error-700 dark:text-error-200 rounded-lg border border-error-200 dark:border-error-800">
                    <p className="flex items-center text-sm font-medium">
                      <span className="mr-2">⚠️</span>
                      {error}
                    </p>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex flex-col items-center space-y-6">
                    <Avatar
                      src={formData.avatarUrl}
                      name={formData.name}
                      size="xl"
                      className="ring-4 ring-primary-500/20 w-32 h-32"
                    />
                    
                    <div className="w-full">
                      <Input
                        label="Avatar URL"
                        name="avatarUrl"
                        value={formData.avatarUrl}
                        onChange={handleChange}
                        placeholder="Enter image URL"
                        leftIcon={<Upload className="h-5 w-5" />}
                        helpText="Enter a valid image URL (e.g., https://example.com/image.jpg)"
                        fullWidth
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="w-full">
                      <Input
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        leftIcon={<UserCircle className="h-5 w-5" />}
                        required
                        fullWidth
                      />
                    </div>
                    <div className="w-full">
                      <Input
                        label="Age"
                        name="age"
                        type="number"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="Enter age"
                        required
                        fullWidth
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Personality Traits
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {Object.values(PersonalityTrait).map((trait) => (
                        <button
                          key={trait}
                          type="button"
                          onClick={() => handlePersonalityChange(trait)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            Array.isArray(formData.personality) && formData.personality.includes(trait)
                              ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200 ring-2 ring-primary-500 dark:ring-primary-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {trait.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Voice Type
                    </label>
                    <select
                      name="voiceType"
                      value={formData.voiceType}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      required
                    >
                      <option value="">Select a voice</option>
                      {voiceTypes.map((voice) => (
                        <option key={voice.id} value={voice.name}>
                          {voice.name} - {voice.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isPublic"
                      name="isPublic"
                      checked={formData.isPublic}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Make this IQ Agent public
                    </label>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/iq-agents')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  leftIcon={<Mic className="h-4 w-4" />}
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