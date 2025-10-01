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
import { PersonalityTrait, VoiceType } from '../../types';
import { supabase } from '../../lib/supabase';
import { getDocument, PDFDocumentProxy } from "pdfjs-dist";
import "../../util/pdf-worker.js"

interface Document {
  id: string;
  content: string;
  name: string;
  knowledge_base_id: string;
  type: 'text' | 'url' | 'file';
}

export const CreatePersona = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
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
    role: '',
    company: '',
    industry: '',
    background: '',
    personality: [] as PersonalityTrait[],
    voiceType: VoiceType.MALE_PROFESSIONAL,
    avatarUrl: '',
    isPublic: false,
    type: null as 'employee' | 'customer' | null,
    documentId: '',
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
 const pdf = (await getDocument({ data: arrayBuffer })
      .promise) as PDFDocumentProxy;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    text += strings.join(" ") + "\n";
  }
  return text.trim();
}

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

    setDocFormData(prev => ({
      ...prev,
      type: 'file',
      file,
      name: file.name,
    }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10485760, // 10MB
    multiple: false
  });

  const handleDocumentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFormData.name || (!docFormData.content && !docFormData.file)) {
      setError('Please provide all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to create a document');
      }

      let content = docFormData.content;

      // Handle file upload if present
      if (docFormData.file) {
        const fileExt = docFormData.file.name.split('.').pop();
        alert(fileExt);
        return;
         // Check if the file is doc/docx or pdf
        if (fileExt === 'docx' || fileExt === 'doc') {
          content = await extractTextFromDocx(docFormData.file);
        } else if (fileExt === 'pdf') {
          content = await extractTextFromPdf(docFormData.file);
        } 

        
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `documents/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('knowledge-base')
          .upload(filePath, docFormData.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('knowledge-base')
          .getPublicUrl(filePath);

        content = publicUrl;
      }

      const { data: document, error: dbError } = await supabase
        .from('knowledge_base_documents')
        .insert([{
          name: docFormData.name,
          content: content,
          type: docFormData.type,
          created_by: user.id
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      setIsDocModalOpen(false);
      setSelectedDocument(null);
      setDocFormData({ name: '', content: '', type: null, file: null });
      await loadDocuments();
    } catch (err: any) {
      console.error('Error saving document:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
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

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-persona`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
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
                        label="Role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        placeholder="e.g., Sales Manager"
                        leftIcon={<Briefcase className="h-5 w-5" />}
                        required
                        fullWidth
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="w-full">
                      <Input
                        label="Company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="e.g., Tech Solutions Inc."
                        leftIcon={<Building className="h-5 w-5" />}
                        fullWidth
                      />
                    </div>
                    <div className="w-full">
                      <Input
                        label="Industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        placeholder="e.g., Technology"
                        fullWidth
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      IQ Agent Type
                    </label>
                    <select
                      name="type"
                      value={formData.type || ''}
                      onChange={handleChange}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="">Select type</option>
                      <option value="employee">Employee</option>
                      <option value="customer">Customer</option>
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

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Background
                    </label>
                    <textarea
                      name="background"
                      value={formData.background}
                      onChange={handleChange}
                      rows={4}
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      placeholder="Describe the IQ Agent's background and experience"
                      required
                    />
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
                      {Object.values(VoiceType).map((type) => (
                        <option key={type} value={type}>
                          {type.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
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
                  Create IQ Agent
                </Button>
              </CardFooter>
            </form>
          </Card>
        </motion.div>
      </div>

      <Modal
        isOpen={isDocModalOpen}
        onClose={() => {
          setIsDocModalOpen(false);
          setSelectedDocument(null);
          setDocFormData({ name: '', content: '', type: null, file: null });
        }}
        title={selectedDocument ? "Edit Document" : "Add Document"}
      >
        <form onSubmit={handleDocumentSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Content Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant={docFormData.type === 'text' ? 'primary' : 'outline'}
                  onClick={() => setDocFormData(prev => ({ ...prev, type: 'text', file: null }))}
                >
                  Text1
                </Button>
                <Button
                  type="button"
                  variant={docFormData.type === 'url' ? 'primary' : 'outline'}
                  onClick={() => setDocFormData(prev => ({ ...prev, type: 'url', file: null }))}
                >
                  URL
                </Button>
                <Button
                  type="button"
                  variant={docFormData.type === 'file' ? 'primary' : 'outline'}
                  onClick={() => setDocFormData(prev => ({ ...prev, type: 'file' }))}
                >
                  File
                </Button>
              </div>
            </div>

            <Input
              label="Document Name"
              name="name"
              value={docFormData.name}
              onChange={(e) => setDocFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter document name"
              required
            />

            {docFormData.type === 'text' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Text Content
                </label>
                <textarea
                  value={docFormData.content}
                  onChange={(e) => setDocFormData(prev => ({ ...prev, content: e.target.value }))}
                  rows={6}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter your text content here..."
                  required
                />
              </div>
            )}

            {docFormData.type === 'url' && (
              <Input
                label="URL"
                type="url"
                value={docFormData.content}
                onChange={(e) => setDocFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter document URL"
                leftIcon={<FileText className="h-5 w-5" />}
                required
              />
            )}

            {docFormData.type === 'file' && (
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
                {docFormData.file ? (
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {docFormData.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(docFormData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {isDragActive
                        ? 'Drop your file here'
                        : 'Drag & drop a file here, or click to select'}
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      PDF, TXT, DOC, DOCX up to 10MB
                    </p>
                  </>
                )}
              </div>
            )}

            {error && (
              <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
            )}

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDocModalOpen(false);
                  setSelectedDocument(null);
                  setDocFormData({ name: '', content: '', type: null, file: null });
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isLoading}
              >
                {selectedDocument ? 'Save Changes' : 'Add Document'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteDocModalOpen}
        onClose={() => {
          setIsDeleteDocModalOpen(false);
          setSelectedDocument(null);
        }}
        title="Delete Document"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Are you sure you want to delete this document? This action cannot be undone.
          </p>
          {error && (
            <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDocModalOpen(false);
                setSelectedDocument(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="error"
              onClick={async () => {
                if (!selectedDocument) return;
                setIsLoading(true);
                try {
                  const { error: deleteError } = await supabase
                    .from('knowledge_base_documents')
                    .delete()
                    .eq('id', selectedDocument.id);

                  if (deleteError) throw deleteError;

                  setIsDeleteDocModalOpen(false);
                  setSelectedDocument(null);
                  if (formData.documentId === selectedDocument.id) {
                    setFormData(prev => ({
                      ...prev,
                      documentId: ''
                    }));
                  }
                  await loadDocuments();
                } catch (err: any) {
                  console.error('Error deleting document:', err);
                  setError(err.message);
                } finally {
                  setIsLoading(false);
                }
              }}
              isLoading={isLoading}
            >
              Delete Document
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};