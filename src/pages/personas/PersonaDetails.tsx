import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Building, Briefcase, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Persona } from '../../types';
import { supabase } from '../../lib/supabase';

export const PersonaDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPersona();
  }, [id]);

  const loadPersona = async () => {
    try {
      const { data, error } = await supabase
        .from('iq_agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPersona(data);
    } catch (err: any) {
      console.error('Error loading IQ agent:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!persona) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('iq_agents')
        .delete()
        .eq('id', persona.id);

      if (error) throw error;
      navigate('/iq-agents');
    } catch (err: any) {
      console.error('Error deleting persona:', err);
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (error || !persona) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {error || 'IQ agent not found'}
              </h2>
              <Button
                variant="outline"
                onClick={() => navigate('/iq-agents')}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Back to IQ Agents
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <motion.div 
          className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
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
                  {persona.name}
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  {persona.role} {persona.company ? `at ${persona.company}` : ''}
                </p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/iq-agents/${persona.id}/edit`)}
                leftIcon={<Edit className="h-4 w-4" />}
              >
                Edit
              </Button>
              <Button
                variant="error"
                onClick={() => setDeleteModalOpen(true)}
                leftIcon={<Trash2 className="h-4 w-4" />}
              >
                Delete
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>Background and personality traits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start space-x-4">
                <Avatar
                  src={persona.avatar_url}
                  name={persona.name}
                  size="xl"
                  className="ring-4 ring-primary-500/20"
                />
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {persona.company || 'Independent'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {persona.industry || 'Various Industries'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Background
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {persona.background}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Personality Traits
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(persona.personality) ? persona.personality.map((trait) => (
                    <span
                      key={trait}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200"
                    >
                      {trait.replace('_', ' ')}
                    </span>
                  )) : (
                    <span className="text-gray-500 dark:text-gray-400">No personality traits specified</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Voice Type
                </h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900/50 dark:text-secondary-200">
                  {persona.voice_type ? 
                    persona.voice_type.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ') 
                    : 'Not specified'
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          <Modal
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            title="Delete IQ Agent"
          >
            <div className="space-y-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-warning-500 mr-2" />
                <p className="text-gray-600 dark:text-gray-300">
                  Are you sure you want to delete {persona.name}? This action cannot be undone.
                </p>
              </div>
              {error && (
                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              )}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="error"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                >
                  Delete IQ Agent
                </Button>
              </div>
            </div>
          </Modal>
        </motion.div>
      </div>
    </Layout>
  );
};