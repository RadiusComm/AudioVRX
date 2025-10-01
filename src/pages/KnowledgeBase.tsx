import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Link2, Trash2, FileText, Plus, ExternalLink, Edit, Search, Filter, Book, File, Link, Calendar, User, CheckCircle, XCircle, Download, Upload, LayoutGrid, List, AlertCircle, RefreshCw, Eye, Menu } from 'lucide-react';
import { getDocument, PDFDocumentProxy } from "pdfjs-dist";
import mammoth from 'mammoth';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import "../pdf-worker";

interface Document {
  id: string;
  name: string;
  content: string;
  type: 'text' | 'file' | 'url';
  created_at: string;
  created_by: string;
  creator?: {
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

export const KnowledgeBase = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    type: 'text' as 'text' | 'file' | 'url',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'text' | 'file' | 'url'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm, typeFilter]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('knowledge_base_documents')
        .select(`
          *,
          creator:created_by (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (err: any) {
      console.error('Error loading documents:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = [...documents];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.content && doc.content.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(doc => doc.type === typeFilter);
    }

    setFilteredDocuments(filtered);
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    
    switch (fileExt) {
      case 'txt':
        return await file.text();
      
      case 'docx':
        try {
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          return result.value;
        } catch (error) {
          throw new Error(`Failed to extract text from DOCX: ${error.message}`);
        }
      
      case 'pdf':
        const arrayBuffer = await file.arrayBuffer();
        const pdf = (await getDocument({ data: arrayBuffer }).promise) as PDFDocumentProxy;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          text += strings.join(" ") + "\n";
        }
        return text.trim();
      
      default:
        throw new Error(`Unsupported file type: ${fileExt}`);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || (!formData.content && !uploadedFile)) {
      setError('Please provide both name and content');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let finalContent = formData.content;
      
      // Handle file upload if a file was selected
      if (uploadedFile && formData.type === 'file') {
        setIsUploading(true);
        finalContent = await extractTextFromFile(uploadedFile);
      }
      if (uploadedFile && formData.type === 'file') {
        const fileExt = uploadedFile.name.split('.').pop()?.toLowerCase();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `documents/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('knowledge-base')
          .upload(filePath, uploadedFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('knowledge-base')
          .getPublicUrl(filePath);

        finalContent = publicUrl;
        setIsUploading(false);
      }

      if (selectedDocument) {
        // Update existing document
        const { error: dbError } = await supabase
          .from('knowledge_base_documents')
          .update({
            name: formData.name,
            content: finalContent,
            type: formData.type
          })
          .eq('id', selectedDocument.id);

        if (dbError) throw dbError;
        setIsEditModalOpen(false);
      } else {
        // Create new document
        const { error: dbError } = await supabase
          .from('knowledge_base_documents')
          .insert([{
            name: formData.name,
            content: finalContent,
            created_by: user.id,
            type: formData.type
          }]);

        if (dbError) throw dbError;
        setIsAddModalOpen(false);
      }

      setFormData({ name: '', content: '', type: 'text' });
      setSelectedDocument(null);
      setUploadedFile(null);
      await loadDocuments();
    } catch (err: any) {
      console.error('Error saving document:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleEdit = (doc: Document) => {
    setSelectedDocument(doc);
    setFormData({
      name: doc.name,
      content: doc.type === 'file' ? '' : doc.content,
      type: doc.type
    });
    setUploadedFile(null);
    setIsEditModalOpen(true);
  };

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setIsViewModalOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedDocument) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('knowledge_base_documents')
        .delete()
        .eq('id', selectedDocument.id);

      if (error) throw error;

      setIsDeleteModalOpen(false);
      setSelectedDocument(null);
      await loadDocuments();
    } catch (err: any) {
      console.error('Error deleting document:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // File upload handlers
  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      // Only set the name if it's empty, don't override user's custom name
      setFormData(prev => ({ 
        ...prev, 
        name: prev.name || file.name 
      }));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-5 w-5 text-primary-500" />;
      case 'file':
        return <File className="h-5 w-5 text-secondary-500" />;
      case 'url':
        return <Link className="h-5 w-5 text-accent-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };
  

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'text':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200">
            <FileText className="w-3 h-3 mr-1" />
            Text
          </span>
        );
      case 'file':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900/50 dark:text-secondary-200">
            <File className="w-3 h-3 mr-1" />
            File
          </span>
        );
      case 'url':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-200">
            <Link className="w-3 h-3 mr-1" />
            URL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
            <FileText className="w-3 h-3 mr-1" />
            Unknown
          </span>
        );
    }
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
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">Knowledge</h1>
            <button 
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-1 rounded-full hover:bg-blue-800 transition-colors duration-200"
            >
              <Search className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
        
        <div className="h-full py-6 md:py-8 px-6 sm:px-8 lg:px-10 overflow-y-auto pb-8 md:pb-16">
          <div className="flex items-center justify-between mb-8 pt-16 md:pt-0">
            <div className="flex items-center">
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                  Knowledge Base
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Manage your knowledge base documents
                </p>
              </div>
            </div>
            
            {/* Add Document button - Desktop only */}
            <div className="hidden md:block">
              <Button
                onClick={() => setIsAddModalOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
                className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
              >
                Add Document
              </Button>
            </div>
          </div>
          
          {/* Add Document button - Mobile only, below description */}
          <div className="md:hidden mt-4 flex justify-end">
            <Button
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
              size="sm"
            >
              Add Document
            </Button>
          </div>

          {/* Add spacing below mobile button */}
          <div className="md:hidden mb-6"></div>

          <Card className="mb-8 hidden md:block">
            <CardContent className="p-6">
              <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-center">
                <div className="flex-1">
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="h-5 w-5" />}
                    fullWidth
                  />
                </div>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 lg:flex-row lg:space-x-2">
                  <select
                    className="block w-full sm:w-auto lg:w-32 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm h-10"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as 'all' | 'text' | 'file' | 'url')}
                  >
                    <option value="all">All Types</option>
                    <option value="text">Text</option>
                    <option value="file">File</option>
                    <option value="url">URL</option>
                  </select>
                  <Button
                    variant="outline"
                    onClick={loadDocuments}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    className="w-full sm:w-auto h-10"
                  >
                    Refresh
                  </Button>
                  <div className="flex rounded-md shadow-sm w-full sm:w-auto h-10">
                    <Button
                      variant={viewMode === 'grid' ? 'primary' : 'outline'}
                      onClick={() => setViewMode('grid')}
                      className="rounded-l-md rounded-r-none flex-1 sm:flex-none h-10 px-3"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'primary' : 'outline'}
                      onClick={() => setViewMode('list')}
                      className="rounded-r-md rounded-l-none flex-1 sm:flex-none h-10 px-3"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Book className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                Unable to load documents
              </p>
              <Button
                variant="outline"
                onClick={loadDocuments}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Try Again
              </Button>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <Book className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                No documents found
              </p>
              <Button
                variant="outline"
                onClick={() => setIsAddModalOpen(true)}
                leftIcon={<Plus className="h-4 w-4" />}
              >
                Add Your First Document
              </Button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((doc) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="h-full"
                >
                  <Card className="h-full hover:shadow-lg transition-all duration-200">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mr-3">
                            {getTypeIcon(doc.type)}
                          </div>
                          <div className="max-w-[180px]">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1 truncate">
                              {doc.name}
                            </h3>
                            <div className="flex items-center mt-1">
                              {getTypeLabel(doc.type)}
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                {format(new Date(doc.created_at), 'MMM d, yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-grow">
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                          {doc.type === 'text' ? doc.content : 'External content'}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                          <User className="h-3 w-3 mr-1" />
                          {doc.creator ? 
                            `${doc.creator.first_name} ${doc.creator.last_name}` : 
                            'Unknown user'}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(doc)}
                            className="p-1"
                          >
                            <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(doc)}
                            className="p-1"
                          >
                            <Edit className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1"
                          >
                            <Trash2 className="h-4 w-4 text-error-500 dark:text-error-400" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Created By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredDocuments.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mr-3">
                                {getTypeIcon(doc.type)}
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                                {doc.name}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getTypeLabel(doc.type)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {doc.creator ? 
                                `${doc.creator.first_name} ${doc.creator.last_name}` : 
                                'Unknown user'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {format(new Date(doc.created_at), 'MMM d, yyyy')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(doc)}
                                className="p-1"
                              >
                                <Eye className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(doc)}
                                className="p-1"
                              >
                                <Edit className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="p-1"
                              >
                                <Trash2 className="h-4 w-4 text-error-500 dark:text-error-400" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Add Document Modal */}
          <Modal
            isOpen={isAddModalOpen}
            onClose={() => {
              setIsAddModalOpen(false);
              setFormData({ name: '', content: '', type: 'text' });
              setError(null);
              setUploadedFile(null);
            }}
            title="Add Document"
          >
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {error && (
                <div className="p-4 bg-error-50 dark:bg-error-900/50 rounded-lg border border-error-200 dark:border-error-800">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-error-400 dark:text-error-300" />
                    <p className="ml-3 text-sm text-error-700 dark:text-error-200">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Document Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={formData.type === 'text' ? 'primary' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'text' }))}
                    leftIcon={<FileText className="h-4 w-4" />}
                  >
                    Text
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === 'file' ? 'primary' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'file' }))}
                    leftIcon={<File className="h-4 w-4" />}
                  >
                    File
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === 'url' ? 'primary' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'url' }))}
                    leftIcon={<Link className="h-4 w-4" />}
                  >
                    URL
                  </Button>
                </div>
              </div>

              <Input
                label="Document Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter document name"
                required
                fullWidth
              />

              {formData.type === 'text' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Text Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter your text content here..."
                    required
                  />
                </div>
              )}

              {formData.type === 'url' && (
                <Input
                  label="URL"
                  type="url"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter document URL"
                  leftIcon={<Link2 className="h-5 w-5" />}
                  required
                  fullWidth
                />
              )}

              {formData.type === 'file' && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload File
                  </label>
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
                    {uploadedFile ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
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
                          PDF, DOC, DOCX, TXT up to 10MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setFormData({ name: '', content: '', type: 'text' });
                    setError(null);
                    setUploadedFile(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting || isUploading}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                >
                  {isUploading ? 'Uploading...' : 'Add Document'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Edit Document Modal */}
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedDocument(null);
              setFormData({ name: '', content: '', type: 'text' });
              setError(null);
              setUploadedFile(null);
            }}
            title="Edit Document"
          >
            <form onSubmit={handleSubmit} className="space-y-6 p-6">
              {error && (
                <div className="p-4 bg-error-50 dark:bg-error-900/50 rounded-lg border border-error-200 dark:border-error-800">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-error-400 dark:text-error-300" />
                    <p className="ml-3 text-sm text-error-700 dark:text-error-200">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Document Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={formData.type === 'text' ? 'primary' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'text' }))}
                    leftIcon={<FileText className="h-4 w-4" />}
                  >
                    Text
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === 'file' ? 'primary' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'file' }))}
                    leftIcon={<File className="h-4 w-4" />}
                  >
                    File
                  </Button>
                  <Button
                    type="button"
                    variant={formData.type === 'url' ? 'primary' : 'outline'}
                    onClick={() => setFormData(prev => ({ ...prev, type: 'url' }))}
                    leftIcon={<Link className="h-4 w-4" />}
                  >
                    URL
                  </Button>
                </div>
              </div>

              <Input
                label="Document Name"
                name="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter document name"
                required
                fullWidth
              />

              {formData.type === 'text' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Text Content
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={6}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Enter your text content here..."
                    required
                  />
                </div>
              )}

              {formData.type === 'url' && (
                <Input
                  label="URL"
                  type="url"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Enter document URL"
                  leftIcon={<Link2 className="h-5 w-5" />}
                  required
                  fullWidth
                />
              )}

              {formData.type === 'file' && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload File
                  </label>
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
                    {uploadedFile ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
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
                          PDF, DOC, DOCX, TXT up to 10MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedDocument(null);
                    setFormData({ name: '', content: '', type: 'text' });
                    setError(null);
                    setUploadedFile(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting || isUploading}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                >
                  {isUploading ? 'Uploading...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* View Document Modal */}
          <Modal
            isOpen={isViewModalOpen}
            onClose={() => {
              setIsViewModalOpen(false);
              setSelectedDocument(null);
            }}
            title={selectedDocument?.name || "Document Details"}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {selectedDocument && getTypeIcon(selectedDocument.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white break-words">
                    {selectedDocument?.name}
                  </h3>
                  <div className="flex items-center mt-1">
                    {selectedDocument && getTypeLabel(selectedDocument.type)}
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      {selectedDocument && format(new Date(selectedDocument.created_at), 'MMMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                {selectedDocument?.type === 'text' ? (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans">
                      {selectedDocument.content}
                    </pre>
                  </div>
                ) : selectedDocument?.type === 'url' ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      External URL:
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-hidden">
                      <a 
                        href={selectedDocument.content} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:underline flex items-center break-all"
                      >
                        <span className="break-all mr-1">{selectedDocument.content}</span>
                        <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      </a>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => window.open(selectedDocument.content, '_blank')}
                      leftIcon={<ExternalLink className="h-4 w-4" />}
                    >
                      Open URL
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      File URL:
                    </p>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-hidden">
                      <a 
                        href={selectedDocument?.content} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:underline flex items-center break-all"
                      >
                        <span className="break-all mr-1">{selectedDocument?.content}</span>
                        <ExternalLink className="h-4 w-4 flex-shrink-0" />
                      </a>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedDocument?.content, '_blank')}
                        leftIcon={<ExternalLink className="h-4 w-4" />}
                      >
                        Open File
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (selectedDocument) {
                            const a = document.createElement('a');
                            a.href = selectedDocument.content;
                            a.download = selectedDocument.name;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                          }
                        }}
                        leftIcon={<Download className="h-4 w-4" />}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <User className="h-4 w-4 mr-1" />
                    Created by: {selectedDocument?.creator ? 
                      `${selectedDocument.creator.first_name} ${selectedDocument.creator.last_name}` : 
                      'Unknown user'}
                  </div>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4 mr-1" />
                    {selectedDocument && format(new Date(selectedDocument.created_at), 'MMMM d, yyyy')}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedDocument(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    if (selectedDocument) {
                      handleEdit(selectedDocument);
                    }
                  }}
                  leftIcon={<Edit className="h-4 w-4" />}
                >
                  Edit
                </Button>
              </div>
            </div>
          </Modal>

          {/* Delete Modal */}
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            title="Delete Document"
          >
            <div className="space-y-2 p-2">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-warning-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-gray-600 dark:text-gray-300">
                  Are you sure you want to delete "{selectedDocument?.name}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="error"
                  onClick={handleDelete}
                  isLoading={isSubmitting}
                  leftIcon={<Trash2 className="h-4 w-4" />}
                >
                  Delete
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
                    Search Documents
                  </label>
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="h-5 w-5" />}
                    fullWidth
                  />
                </div>
                
                <div className="w-full">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Filter by Type
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as 'all' | 'text' | 'file' | 'url')}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="text">Text</option>
                    <option value="file">File</option>
                    <option value="url">URL</option>
                  </select>
                </div>
                
                <div className="w-full">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    View Mode
                  </label>
                  <div className="flex rounded-md shadow-sm w-full">
                    <Button
                      variant={viewMode === 'grid' ? 'primary' : 'outline'}
                      onClick={() => setViewMode('grid')}
                      className="rounded-l-md rounded-r-none flex-1"
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'primary' : 'outline'}
                      onClick={() => setViewMode('list')}
                      className="rounded-r-md rounded-l-none flex-1"
                    >
                      <List className="h-4 w-4 mr-2" />
                      List
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                    setViewMode('grid');
                  }}
                  size="sm"
                >
                  Clear Filters
                </Button>
                <Button
                  onClick={() => setIsMobileSearchOpen(false)}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                  size="sm"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </Layout>
  );
};