import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Edit, Trash2, AlertCircle, Menu } from 'lucide-react';
import { Layout } from '../../components/layout/Layout';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { Persona, VoiceType } from '../../types';
import { supabase } from '../../lib/supabase';

export const PersonaList = () => {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoiceType, setSelectedVoiceType] = useState<VoiceType | 'all'>('all');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  useEffect(() => {
    loadPersonas();
  }, []);

  const loadPersonas = async () => {
    try {
      const { data, error } = await supabase
        .from('iq_agents')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(30);

      if (error) throw error;
      setPersonas(data || []);
    } catch (err: any) {
      console.error('Error loading IQ agents:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPersona) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('iq_agents')
        .delete()
        .eq('id', selectedPersona.id);
      if (error) throw error;

      setPersonas(personas.filter(p => p.id !== selectedPersona.id));
      setDeleteModalOpen(false);
      setSelectedPersona(null);
    } catch (err: any) {
      console.error('Error deleting IQ agents:', err);
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPersonas = personas.filter(persona => {
    const matchesSearch = 
      (persona.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (persona.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (persona.personality ? String(persona.personality).toLowerCase().includes(searchTerm.toLowerCase()) : false);

    const matchesVoiceType = selectedVoiceType === 'all' || persona.voice_type === selectedVoiceType;

    return matchesSearch && matchesVoiceType;
  });

  // Function to get a color for a personality trait
  const getTraitColor = (index: number) => {
    const colors = [
      'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200',
      'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/50 dark:text-secondary-200',
      'bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-200',
      'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-200',
      'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-200'
    ];
    return colors[index % colors.length];
  };

  // Function to render personality traits
  const renderPersonalityTraits = (personality: any) => {
    if (!personality) return null;
    
    let traits = [];
    
    if (Array.isArray(personality)) {
      traits = personality;
    } else {
      // Handle case where personality might be a string or other type
      traits = String(personality).split(',').map(t => t.trim()).filter(Boolean);
    }
    
    return (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {traits.map((trait, index) => (
          <span 
            key={index} 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTraitColor(index)} transition-all duration-200 hover:scale-105`}
          >
            {String(trait).replace(/["'\[\]]/g, '')}
          </span>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Mobile App Header */}
        <div className="md:hidden border-b border-blue-700 px-6 py-4 fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: 'rgb(32, 59, 118)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-white text-xl font-semibold">RetailIQ</span>
            </div>
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">IQ Agents</h1>
            <button 
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-1 rounded-full hover:bg-blue-800 transition-colors duration-200"
            >
              <Search className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
        
        <motion.div 
          className="h-full py-6 md:py-8 px-6 sm:px-8 lg:px-10 overflow-y-auto pb-8 md:pb-16"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-8 pt-16 md:pt-0">
            <div className="flex items-center mb-4 md:mb-0">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                 IQ Agents
                </h1>
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Create and manage AI conversation partners for training IQ Agents
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex justify-end md:justify-start">
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                onClick={() => navigate('/iq-agents/create')}
              >
                Create IQ Agent
              </Button>
            </div>
          </div>

          <Card className="mb-8 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hidden md:block">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                <Input
                  leftIcon={<Search className="h-5 w-5" />}
                  placeholder="Search IQ Agents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  fullWidth
                />
                <select
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={selectedVoiceType}
                  onChange={(e) => setSelectedVoiceType(e.target.value as VoiceType | 'all')}
                >
                  <option value="all">All Voice Types</option>
                  {Object.values(VoiceType).map((type) => (
                    <option key={type} value={type}>
                      {type.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {filteredPersonas.map((persona) => (
              <Card
                key={persona.id}
                className="hover:shadow-lg transition-shadow duration-200 flex flex-col overflow-hidden cursor-pointer h-full"
                onClick={() => navigate(`/iq-agents/${persona.id}`)}
              >
                <CardContent className="p-0 flex flex-col h-full">
                  {/* Card header with gradient background */}
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-primary-500/10 to-secondary-500/10 dark:from-primary-500/20 dark:to-secondary-500/20 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                        <Avatar
                          src={persona.avatar_url}
                          name={persona.name}
                          size="md"
                          className="ring-4 ring-white/50 dark:ring-gray-800/50 shadow-md"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {persona.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {persona.type || 'IQ Agent'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1 flex-shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/iq-agents/${persona.id}/edit`);
                          }}
                          className="p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <Edit className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPersona(persona);
                            setDeleteModalOpen(true);
                          }}
                          className="p-1.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <Trash2 className="h-4 w-4 text-error-500 dark:text-error-400" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Personality traits */}
                    {renderPersonalityTraits(persona.personality)}
                  </div>
                  
                  {/* Card body */}
                  <div className="p-3 sm:p-4 flex-grow">
                    {persona.voice_type && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Voice:</span>
                        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          {persona.voice_type.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPersonas.length === 0 && (
            <motion.div 
              className="text-center py-8 md:py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-gray-500 dark:text-gray-400 text-base md:text-lg">
                No IQ agent found matching your criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedVoiceType('all');
                }}
              >
                Clear filters
              </Button>
            </motion.div>
          )}

          <Modal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedPersona(null);
            }}
            title="Delete IQ Agent"
          >
            <div className="space-y-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-warning-500 mr-2" />
                <p className="text-gray-600 dark:text-gray-300">
                  Are you sure you want to delete {selectedPersona?.name}? This action cannot be undone.
                </p>
              </div>
              {error && (
                <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
              )}
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setSelectedPersona(null);
                  }}
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

          {/* Mobile Search Modal */}
          <Modal
            isOpen={isMobileSearchOpen}
            onClose={() => setIsMobileSearchOpen(false)}
            title="Search & Filter"
          >
            <div className="space-y-6 p-6">
              <div className="space-y-4">
                <div className="w-full">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Search IQ Agents
                  </label>
                  <Input
                    placeholder="Search IQ Agents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="h-5 w-5" />}
                    fullWidth
                  />
                </div>
                
                <div className="w-full">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Filter by Voice Type
                  </label>
                  <select
                    value={selectedVoiceType}
                    onChange={(e) => setSelectedVoiceType(e.target.value as VoiceType | 'all')}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="all">All Voice Types</option>
                    {Object.values(VoiceType).map((type) => (
                      <option key={type} value={type}>
                        {type.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedVoiceType('all');
                  }}
                >
                  Clear Filters
                </Button>
                <Button
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </Modal>
        </motion.div>
      </div>
    </Layout>
  );
};