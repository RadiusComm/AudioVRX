import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { Edit, Trash2, Plus, AlertCircle, RefreshCw, Tag, Search, Menu } from 'lucide-react';

interface RoleMapping {
  id: string;
  account_id: string;
  system_role_id: string;
  custom_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  system_roles?: {
    id: string;
    name: string;
    hierarchy_level: number;
    description?: string;
  };
}

interface SystemRole {
  id: string;
  name: string;
  hierarchy_level: number;
  description?: string;
}

export const RoleManagement = () => {
  const [roleMappings, setRoleMappings] = useState<RoleMapping[]>([]);
  const [systemRoles, setSystemRoles] = useState<SystemRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<RoleMapping | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserAccountId, setCurrentUserAccountId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    account_id: '',
    system_role_id: '',
    custom_name: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    getCurrentUserInfo();
    loadSystemRoles();
    loadRoleMappings();
  }, []);

  const getCurrentUserInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, account_id')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        console.error('Error getting current user info or profile not found:', error);
        return;
      }
      
      setCurrentUserRole(profile.role);
      setCurrentUserAccountId(profile.account_id);
      
      // If admin, pre-fill the account ID in the form
      if (profile.role === 'admin' && profile.account_id) {
        setFormData(prev => ({ ...prev, account_id: profile.account_id }));
      }
    } catch (err) {
      console.error('Error getting current user info:', err);
    }
  };

  const loadRoleMappings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('account_role_names')
        .select(`
          *,
          system_roles!system_role_id (
            id,
            name,
            hierarchy_level,
            description
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Role mappings loaded:', data);
      setRoleMappings(data || []);
    } catch (err: any) {
      console.error('Error loading role mappings:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('system_roles')
        .select('*')
        .order('hierarchy_level', { ascending: true });

      if (error) {
        console.error('Error loading system roles:', error);
        throw error;
      }
      
      console.log('System roles loaded:', data);
      setSystemRoles(data || []);
    } catch (err: any) {
      console.error('Error loading system roles:', err);
      toast.error(`Failed to load system roles: ${err.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_id || !formData.system_role_id || !formData.custom_name) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (selectedMapping) {
        // Update existing mapping
        const { error } = await supabase
          .from('account_role_names')
          .update({
            account_id: formData.account_id,
            system_role_id: formData.system_role_id,
            custom_name: formData.custom_name,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedMapping.id);

        if (error) throw error;
        toast.success('Role mapping updated successfully');
      } else {
        // Create new mapping
        const { error } = await supabase
          .from('account_role_names')
          .insert([{
            account_id: formData.account_id,
            system_role_id: formData.system_role_id,
            custom_name: formData.custom_name,
            is_active: formData.is_active
          }]);

        if (error) throw error;
        toast.success('Role mapping created successfully');
      }

      setIsAddModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedMapping(null);
      setFormData({ 
        account_id: currentUserRole === 'admin' ? currentUserAccountId || '' : '', 
        system_role_id: '', 
        custom_name: '',
        is_active: true
      });
      loadRoleMappings();
    } catch (err: any) {
      console.error('Error saving role mapping:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMapping) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('account_role_names')
        .delete()
        .eq('id', selectedMapping.id);

      if (error) throw error;

      setIsDeleteModalOpen(false);
      setSelectedMapping(null);
      toast.success('Role mapping deleted successfully');
      loadRoleMappings();
    } catch (err: any) {
      console.error('Error deleting role mapping:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMappings = roleMappings.filter(mapping => {
    // For admins, only show mappings for their account
    if (currentUserRole === 'admin' && mapping.account_id !== currentUserAccountId) {
      return false;
    }
    
    // Apply search filter
    if (searchTerm) {
      return (
        mapping.account_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mapping.system_roles?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        mapping.custom_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return true;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Mobile App Header */}
        <div className="md:hidden border-b border-blue-700 px-6 py-4 fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: 'rgb(32, 59, 118)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-white text-xl font-semibold">RetailIQ</span>
            </div>
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">Roles</h1>
            <div></div>
          </div>
        </div>
        
        <div className="h-full py-6 md:py-8 px-4 sm:px-6 md:px-8 lg:px-12 overflow-y-auto pb-8 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4 md:mb-8 pt-16 md:pt-0"
          >
          <div className="flex items-center">
            <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
              Role Management
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Customize role names for your organization
            </p>
            </div>
          </div>
          </motion.div>

          <Card className="mb-4 md:mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <div className="w-full md:w-1/2">
                  <Input
                    placeholder="Search role mappings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="h-5 w-5" />}
                    fullWidth
                  />
                </div>
                <div className="flex justify-end md:justify-start space-x-2">
                  <Button
                    onClick={() => {
                      setSelectedMapping(null);
                      setFormData({ 
                        account_id: currentUserRole === 'admin' ? currentUserAccountId || '' : '', 
                        system_role_id: '', 
                        custom_name: '',
                        is_active: true
                      });
                      setIsAddModalOpen(true);
                    }}
                    leftIcon={<Plus className="h-4 w-4" />}
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                  >
                    Add Role Mapping
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      loadSystemRoles();
                      loadRoleMappings();
                    }}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role Mappings</CardTitle>
              <CardDescription>
                Customize how system roles appear in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : error ? (
                <div className="flex items-center p-4 text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/50 rounded-lg">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {error}
                </div>
              ) : filteredMappings.length === 0 ? (
                <div className="text-center py-12">
                  <Tag className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                    No role mappings found
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedMapping(null);
                      setFormData({ 
                        account_id: currentUserRole === 'admin' ? currentUserAccountId || '' : '', 
                        system_role_id: '', 
                        custom_name: '',
                        is_active: true
                      });
                      setIsAddModalOpen(true);
                    }}
                    leftIcon={<Plus className="h-4 w-4" />}
                  >
                    Add Your First Role Mapping
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Account ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          System Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Custom Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredMappings.map((mapping) => (
                        <tr
                          key={mapping.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {mapping.account_id}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {mapping.system_roles?.name || 'Unknown Role'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {mapping.custom_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              mapping.is_active 
                                ? 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300' 
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {mapping.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMapping(mapping);
                                  setFormData({
                                    account_id: mapping.account_id,
                                    system_role_id: mapping.system_role_id,
                                    custom_name: mapping.custom_name,
                                    is_active: mapping.is_active
                                  });
                                  setIsEditModalOpen(true);
                                }}
                                className="p-1"
                              >
                                <Edit className="h-4 w-4 text-primary-500 dark:text-primary-400" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedMapping(mapping);
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
              )}
            </CardContent>
          </Card>

          {/* Add/Edit Modal */}
          <Modal
            isOpen={isAddModalOpen || isEditModalOpen}
            onClose={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
              setSelectedMapping(null);
              setError(null);
            }}
            title={selectedMapping ? "Edit Role Mapping" : "Add Role Mapping"}
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

              {/* Account ID field - only editable for super-admins */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Account ID
                </label>
                {currentUserRole === 'super-admin' ? (
                  <Input
                    name="account_id"
                    value={formData.account_id}
                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                    placeholder="Enter account ID"
                    required
                    fullWidth
                  />
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md text-gray-700 dark:text-gray-300">
                    {currentUserAccountId || 'No account ID available'}
                    <input 
                      type="hidden" 
                      name="account_id" 
                      value={currentUserAccountId || ''} 
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  System Role
                </label>
                <select
                  name="system_role_id"
                  value={formData.system_role_id}
                  onChange={(e) => setFormData({ ...formData, system_role_id: e.target.value })}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                >
                  <option value="">Select a role</option>
                  {systemRoles.length > 0 ? (
                    systemRoles
                      .filter(role => role.name !== 'super-admin') // Exclude super-admin role
                      .map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        </option>
                      ))
                  ) : (
                    <option value="" disabled>No system roles available</option>
                  )}
                </select>
                {systemRoles.length === 0 && (
                  <p className="text-xs text-error-600 dark:text-error-400 mt-1">
                    No system roles found. Please check your database configuration.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Custom Name
                </label>
                <Input
                  name="custom_name"
                  value={formData.custom_name}
                  onChange={(e) => setFormData({ ...formData, custom_name: e.target.value })}
                  placeholder="Enter custom role name"
                  required
                  fullWidth
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedMapping(null);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                >
                  {selectedMapping ? 'Save Changes' : 'Add Mapping'}
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete Modal */}
          <Modal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false);
              setSelectedMapping(null);
              setError(null);
            }}
            title="Delete Role Mapping"
          >
            <div className="space-y-4 p-6">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-warning-500 mr-2" />
                <p className="text-gray-600 dark:text-gray-300">
                  Are you sure you want to delete this role mapping? This action cannot be undone.
                </p>
              </div>
              {error && (
                <div className="p-4 bg-error-50 dark:bg-error-900/50 rounded-lg border border-error-200 dark:border-error-800">
                  <p className="text-sm text-error-700 dark:text-error-200">{error}</p>
                </div>
              )}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedMapping(null);
                    setError(null);
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="error"
                  onClick={handleDelete}
                  isLoading={isSubmitting}
                >
                  Delete Mapping
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </Layout>
  );
};