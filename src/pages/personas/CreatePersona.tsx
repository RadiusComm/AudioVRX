import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, Mic, Building, Briefcase, UserCircle, Plus, FileText, Edit, Trash2, ExternalLink } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { v4 as uuidv4 } from 'uuid';
import { Layout } from '../../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { PersonalityTrait } from '../../types';
import { supabase } from '../../lib/supabase';

interface Document {
  id: string;
  content: string;
  name: string;
  knowledge_base_id: string;
  type: 'text' | 'url' | 'file';
}

interface VoiceType {
  id: string;
  name: string;
  qualities: string[];
  description: string;
  elevenlabs_voice_id: string;
}

export const CreatePersona = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [voiceTypes, setVoiceTypes] = useState<VoiceType[]>([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isDeleteDocModalOpen, setIsDeleteDocModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [docFormData, setDocFormData] = useState({
    name: '',
    content: '',
    type: null as 'text' | 'url' | 'file' | null,
    file: null as File | null,
  });
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    personality: [] as PersonalityTrait[],
    voiceType: '',
    voiceId: '',
    avatarUrl: '',
    isPublic: false,
    documentId: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  useEffect(() => {
    loadDocuments();
    loadVoiceTypes();
  }, []);

  const loadVoiceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setVoiceTypes(data || []);
      
      // Set default voice type if available
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, voiceType: data[0].id }));
      }
    } catch (err) {
      console.error('Error loading voice types:', err);
    }
  };

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('knowledge_base_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setImageFile(file);
    setFormData(prev => ({ ...prev, avatarUrl: '' })); // Clear URL input when file is uploaded

    return () => URL.revokeObjectURL(objectUrl);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // If user enters URL, clear the uploaded file
    if (name === 'avatarUrl' && value) {
      setImageFile(null);
      setPreviewUrl('');
    }
  };

  const handlePersonalityChange = (trait: PersonalityTrait) => {
    setFormData(prev => ({
      ...prev,
      personality: prev.personality.includes(trait)
        ? prev.personality.filter(t => t !== trait)
        : [...prev.personality, trait]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Handle image upload if file is selected
      let avatarUrl = formData.avatarUrl;
      if (imageFile) {
        const { data, error } = await supabase.storage
          .from('avatars')
          .upload(`${user.id}/${uuidv4()}`, imageFile);

        if (error) throw error;
        avatarUrl = data.path;
      }

      // Get selected document details if any
      let documentDetails = null;
      if (formData.documentId) {
        const selectedDoc = documents.find(d => d.id === formData.documentId);
        if (selectedDoc) {
          documentDetails = {
            id: selectedDoc.id,
            content: selectedDoc.content,
            knowledge_base_id: selectedDoc.knowledge_base_id,
            type: selectedDoc.type,
            name: selectedDoc.name
          };
        }
      }

      // Get the selected voice type
      const selectedVoice = voiceTypes.find(v => v.name === formData.voiceType);
      if (!selectedVoice) {
        throw new Error('Selected voice type not found');
      }

      console.log("logging form data");
      console.log("selctedVoice", selectedVoice);
      console.log({
          ...formData,
          voiceId: selectedVoice?.elevenlabs_voice_id,
          avatarUrl,
          userId: user.id,
          document: documentDetails,
        });
    

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-persona`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          voiceId: selectedVoice?.elevenlabs_voice_id,
          avatarUrl,
          userId: user.id,
          document: documentDetails,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create IQ agent');
      }

      const data = await response.json();
      navigate(`/iq-agents/${data.id}`);
    } catch (err: any) {
      console.error('Error creating IQ agent:', err);
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
                Create New IQ Agent
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Design an AI conversation partner with unique traits and characteristics
              </p>
            </div>
          </div>

          <Card>
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle>IQ Agent Details</CardTitle>
                <CardDescription>
                  Define the characteristics and personality of your AI conversation partner
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
                      src={previewUrl || formData.avatarUrl}
                      name={formData.name}
                      size="xl"
                      className="ring-4 ring-primary-500/20 w-32 h-32"
                    />
                    
                    <div className="w-full space-y-4">
                      <div
                        {...getRootProps()}
                        className={`
                          w-full p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
                          transition-colors duration-200
                          ${isDragActive 
                            ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/50' 
                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
                          }
                        `}
                      >
                        <input {...getInputProps()} />
                        <Upload className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                        {imageFile ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {imageFile.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {isDragActive
                                ? 'Drop your image here'
                                : 'Drag & drop an image here, or click to select'}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                              PNG or JPG up to 5MB
                            </p>
                          </>
                        )}
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
                            formData.personality.includes(trait)
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Knowledge Base Document
                      </label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDocument(null);
                          setDocFormData({ name: '', content: '', type: null, file: null });
                          setIsDocModalOpen(true);
                        }}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Add New Document
                      </Button>
                    </div>
                    <div className="relative">
                      <select
                        name="documentId"
                        value={formData.documentId}
                        onChange={handleChange}
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 pr-20 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      >
                        <option value="">Select a document</option>
                        {documents.map((doc) => (
                          <option key={doc.id} value={doc.id}>{doc.name}</option>
                        ))}
                      </select>
                      {formData.documentId && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const doc = documents.find(d => d.id === formData.documentId);
                              if (doc) window.open(doc.content, '_blank');
                            }}
                          >
                            <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const doc = documents.find(d => d.id === formData.documentId);
                              if (doc) {
                                setSelectedDocument(doc);
                                setDocFormData({
                                  name: doc.name,
                                  content: doc.content,
                                  type: doc.type,
                                  file: null
                                });
                                setIsDocModalOpen(true);
                              }
                            }}
                          >
                            <Edit className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const doc = documents.find(d => d.id === formData.documentId);
                              if (doc) {
                                setSelectedDocument(doc);
                                setIsDeleteDocModalOpen(true);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-error-500 dark:text-error-400" />
                          </Button>
                        </div>
                      )}
                    </div>
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
                  Create IQ Agent
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
};