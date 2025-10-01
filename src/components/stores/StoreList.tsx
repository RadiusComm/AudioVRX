import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Building, MapPin, AlertCircle, Store, Users, User, ExternalLink, Calendar, Clock, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { StoreForm } from './StoreForm';
import { DeleteStoreModal } from './DeleteStoreModal';
import { Avatar } from '../ui/Avatar';
import { Modal } from '../ui/Modal';
import { supabase } from '../../lib/supabase';

interface Store {
  id: string;
  name: string;
  location: string;
  store_id: string;
  description: string;
  image_url: string;
  status: 'pending' | 'active' | 'inactive';
  owner_id: string;
  owner?: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string;
  };
}

interface AssignedUser {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
  role?: string;
}

interface StoreWithUsers extends Store {
  assigned_users?: AssignedUser[];
}

export const StoreList = () => {
  const [stores, setStores] = useState<StoreWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          owner:owner_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .order('name');

      if (error) throw error;
      
      const storesWithUsers = await Promise.all((data || []).map(async (store) => {
        // Get users assigned to this store
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('user_store_assignments')
          .select(`
            user_id,
            profiles:user_id (
              id,
              first_name,
              last_name,
              avatar_url,
              role
            )
          `)
          .eq('store_id', store.id);

        if (assignmentsError) {
          console.error('Error loading store assignments:', assignmentsError);
          return store;
        }

        // Transform the data to get a clean array of users
        const assigned_users = assignmentsData
          .map(assignment => assignment.profiles)
          .filter(Boolean) as AssignedUser[];

        return {
          ...store,
          assigned_users
        };
      }));

      setStores(storesWithUsers);
    } catch (err: any) {
      console.error('Error loading stores:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoreUpdate = () => {
    loadStores();
    setIsFormModalOpen(false);
    setSelectedStore(null);
  };

  const handleStoreDelete = () => {
    loadStores();
    setIsDeleteModalOpen(false);
    setSelectedStore(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300';
      case 'inactive':
        return 'bg-error-100 text-error-800 dark:bg-error-900/50 dark:text-error-300';
      default:
        return 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Stores
        </h2>
        <Button
          onClick={() => {
            setSelectedStore(null);
            setIsFormModalOpen(true);
          }}
          leftIcon={<Plus className="h-4 w-4" />}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
        >
          Add Store
        </Button>
      </div>

      {error && (
        <div className="flex items-center p-4 text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/50 rounded-lg">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {stores.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700"
        >
          <Store className="h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No stores found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-4">
            Get started by adding your first store
          </p>
          <Button
            onClick={() => {
              setSelectedStore(null);
              setIsFormModalOpen(true);
            }}
            leftIcon={<Plus className="h-4 w-4" />}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
          >
            Add Store
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="transform transition-all duration-200 hover:scale-[1.02]"
              onClick={() => {
                setSelectedStore(store);
                setIsDetailsModalOpen(true);
              }}
            >
              <Card className="h-full bg-white dark:bg-gray-800 shadow hover:shadow-lg border border-gray-100 dark:border-gray-700 cursor-pointer">
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="flex items-start space-x-3">
                    {store.image_url ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={store.image_url} 
                          alt={store.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg flex-shrink-0">
                        <Building className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {store.name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(store.status)}`}>
                          {store.status}
                        </span>
                      </div>
                      {store.location && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center mt-1">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">{store.location}</span>
                        </p>
                      )}
                      {store.store_id && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          Store ID: {store.store_id}
                        </p>
                      )}
                      
                      {/* Owner info */}
                      {store.owner && (
                        <div className="mt-2 flex items-center">
                          <User className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Owner: {store.owner.first_name} {store.owner.last_name}
                          </span>
                        </div>
                      )}
                      
                      {/* Assigned Users Preview */}
                      {store.assigned_users && store.assigned_users.length > 0 && (
                        <div className="mt-2 flex items-center">
                          <Users className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {store.assigned_users.length} assigned user{store.assigned_users.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-auto pt-3 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStore(store);
                        setIsFormModalOpen(true);
                      }}
                      className="text-xs px-2 py-1 h-7"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStore(store);
                        setIsDeleteModalOpen(true);
                      }}
                      className="text-xs px-2 py-1 h-7"
                    >
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <StoreForm
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedStore(null);
        }}
        store={selectedStore}
        onSuccess={handleStoreUpdate}
      />

      <DeleteStoreModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedStore(null);
        }}
        store={selectedStore}
        onSuccess={handleStoreDelete}
      />

      {/* Store Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedStore(null);
        }}
        title={selectedStore?.name || "Store Details"}
      >
        {selectedStore && (
          <div className="space-y-6 p-4">
            {/* Store Image */}
            {selectedStore.image_url && (
              <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                <img 
                  src={selectedStore.image_url} 
                  alt={selectedStore.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Store Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-primary-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Store Information</h3>
                </div>
                
                <div className="pl-7 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Store ID</p>
                    <p className="text-base text-gray-900 dark:text-white">{selectedStore.store_id || "N/A"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</p>
                    <p className="text-base text-gray-900 dark:text-white">{selectedStore.location || "N/A"}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedStore.status)}`}>
                      {selectedStore.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <Info className="h-5 w-5 text-primary-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Additional Details</h3>
                </div>
                
                <div className="pl-7 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                    <p className="text-base text-gray-900 dark:text-white flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {formatDate(selectedStore.created_at)}
                    </p>
                  </div>
                  
                  {selectedStore.owner && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Owner</p>
                      <div className="flex items-center mt-1">
                        <Avatar
                          src={selectedStore.owner.avatar_url}
                          name={`${selectedStore.owner.first_name} ${selectedStore.owner.last_name}`}
                          size="sm"
                          className="mr-2"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {selectedStore.owner.first_name} {selectedStore.owner.last_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Description */}
            {selectedStore.description && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Description</h3>
                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line">
                  {selectedStore.description}
                </p>
              </div>
            )}
            
            {/* Assigned Users */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Users className="h-5 w-5 text-primary-500 mr-2" />
                  Assigned Users
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedStore.assigned_users?.length || 0} user{(selectedStore.assigned_users?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>
              
              {selectedStore.assigned_users && selectedStore.assigned_users.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedStore.assigned_users.map((user) => (
                    <div 
                      key={user.id}
                      className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700"
                    >
                      <Avatar
                        src={user.avatar_url}
                        name={`${user.first_name} ${user.last_name}`}
                        size="sm"
                        className="mr-3"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.first_name} {user.last_name}
                        </p>
                        <div className="flex items-center">
                          {user.role && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200">
                              {user.role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Users className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No users assigned to this store
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedStore(null);
                }}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setIsFormModalOpen(true);
                }}
              >
                Edit Store
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};