import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { UserHeader } from '../components/users/UserHeader';
import { UserFilters } from '../components/users/UserFilters';
import { UserTable } from '../components/users/UserTable';
import { StoreList } from '../components/stores/StoreList';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { User, UserRole } from '../types';
import { getAllUsers, updateUserProfile } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  AlertCircle, 
  Plus, 
  Store, 
  Search,
  Menu
} from 'lucide-react';

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [activeTab, setActiveTab] = useState<'users' | 'stores'>('users');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: UserRole.EMPLOYEE,
    username: '',
    avatarUrl: '',
    storeIds: [] as string[],
    accountId: ''
  });

  const roleColors: Record<UserRole, string> = {
    [UserRole.ADMIN]: 'bg-error-100 text-error-800 dark:bg-error-900/50 dark:text-error-300',
    [UserRole.MANAGER]: 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300',
    [UserRole.SUPERVISOR]: 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300',
    [UserRole.EMPLOYEE]: 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300',
    [UserRole.GENERALMANAGER]: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/50 dark:text-secondary-300',
    [UserRole.SUPERADMIN]: 'bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-300',
  };

  useEffect(() => {
    loadUsers();
    loadStores();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole, selectedStatus, sortBy]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await getAllUsers();
      setUsers(userData);
    } catch (err: any) {
      console.error('Error loading users:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('id, name, store_id')
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (err) {
      console.error('Error loading stores:', err);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(user => user.status === selectedStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'role':
          return a.role.localeCompare(b.role);
        case 'status':
          return a.status.localeCompare(b.status);
        case 'store':
          const aStore = a.stores?.[0]?.name || '';
          const bStore = b.stores?.[0]?.name || '';
          return aStore.localeCompare(bStore);
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          storeIds: formData.storeIds,
          username: formData.username,
          avatarUrl: formData.avatarUrl,
          accountId: formData.accountId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      toast.success('User created and invitation sent successfully');
      setIsAddModalOpen(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message);
      toast.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role,
      username: user.username || '',
      avatarUrl: user.avatarUrl || '',
      storeIds: user.storeIds || [],
      accountId: user.accountId || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateUserProfile(selectedUser.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
        username: formData.username,
        avatar_url: formData.avatarUrl,
        account_id: formData.accountId
      });

      // Update store assignments
      if (formData.storeIds.length > 0) {
        // Delete existing assignments
        await supabase
          .from('user_store_assignments')
          .delete()
          .eq('user_id', selectedUser.id);

        // Create new assignments
        const assignments = formData.storeIds.map(storeId => ({
          user_id: selectedUser.id,
          store_id: storeId,
        }));

        await supabase
          .from('user_store_assignments')
          .insert(assignments);
      }

      toast.success('User updated successfully');
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
      loadUsers();
    } catch (err: any) {
      console.error('Error updating user:', err);
      setError(err.message);
      toast.error('Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.auth.admin.deleteUser(selectedUser.id);
      if (error) throw error;

      toast.success('User deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message);
      toast.error('Failed to delete user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBan = async (user: User) => {
    try {
      const newBanStatus = !user.is_banned;
      
      await updateUserProfile(user.id, {
        is_banned: newBanStatus
      });

      toast.success(`User ${newBanStatus ? 'banned' : 'unbanned'} successfully`);
      loadUsers();
    } catch (err: any) {
      console.error('Error toggling ban status:', err);
      toast.error('Failed to update user status');
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: UserRole.EMPLOYEE,
      username: '',
      avatarUrl: '',
      storeIds: [],
      accountId: ''
    });
    setError(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
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
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">Users</h1>
            <div></div>
          </div>
        </div>

        <motion.div 
          className="max-w-7xl mx-auto py-6 md:py-12 px-4 sm:px-6 lg:px-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="pt-16 md:pt-0">
            <UserHeader activeTab={activeTab} />

            {/* Tab Navigation */}
            <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`${
                    activeTab === 'users'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <UserIcon className="h-5 w-5 mr-2" />
                  Users
                </button>
                <button
                  onClick={() => setActiveTab('stores')}
                  className={`${
                    activeTab === 'stores'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Store className="h-5 w-5 mr-2" />
                  Stores
                </button>
              </nav>
            </div>

            {activeTab === 'users' ? (
              <>
                <UserFilters
                  searchTerm={searchTerm}
                  selectedRole={selectedRole}
                  selectedStatus={selectedStatus}
                  sortBy={sortBy}
                  stores={stores}
                  onSearchChange={setSearchTerm}
                  onRoleChange={setSelectedRole}
                  onStatusChange={setSelectedStatus}
                  onSortChange={setSortBy}
                />

                <UserTable
                  users={filteredUsers}
                  roleColors={roleColors}
                  onEditUser={handleEditUser}
                  onDeleteUser={(user) => {
                    setSelectedUser(user);
                    setIsDeleteModalOpen(true);
                  }}
                  onAddUser={() => {
                    resetForm();
                    setIsAddModalOpen(true);
                  }}
                  onToggleBan={handleToggleBan}
                />
              </>
            ) : (
              <StoreList />
            )}

            {/* Add User Modal */}
            <Modal
              isOpen={isAddModalOpen}
              onClose={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
              title="Add New User"
            >
              <form onSubmit={handleAddUser} className="space-y-6 p-6">
                {error && (
                  <div className="p-4 bg-error-50 dark:bg-error-900/50 rounded-lg border border-error-200 dark:border-error-800">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-error-400 dark:text-error-300" />
                      <p className="ml-3 text-sm text-error-700 dark:text-error-200">{error}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    leftIcon={<UserIcon className="h-5 w-5" />}
                    fullWidth
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    leftIcon={<UserIcon className="h-5 w-5" />}
                    fullWidth
                  />
                </div>

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  leftIcon={<Mail className="h-5 w-5" />}
                  fullWidth
                />

                <Input
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  leftIcon={<UserIcon className="h-5 w-5" />}
                  fullWidth
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  >
                    {Object.values(UserRole).filter(role => role !== UserRole.SUPERADMIN).map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assign to Stores
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
                    {stores.map((store) => (
                      <label key={store.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                        <input
                          type="checkbox"
                          checked={formData.storeIds.includes(store.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, storeIds: [...formData.storeIds, store.id] });
                            } else {
                              setFormData({ ...formData, storeIds: formData.storeIds.filter(id => id !== store.id) });
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{store.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddModalOpen(false);
                      resetForm();
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
                    Create User
                  </Button>
                </div>
              </form>
            </Modal>

            {/* Edit User Modal */}
            <Modal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
                resetForm();
              }}
              title="Edit User"
            >
              <form onSubmit={handleUpdateUser} className="space-y-6 p-6">
                {error && (
                  <div className="p-4 bg-error-50 dark:bg-error-900/50 rounded-lg border border-error-200 dark:border-error-800">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-error-400 dark:text-error-300" />
                      <p className="ml-3 text-sm text-error-700 dark:text-error-200">{error}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    leftIcon={<UserIcon className="h-5 w-5" />}
                    fullWidth
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    leftIcon={<UserIcon className="h-5 w-5" />}
                    fullWidth
                  />
                </div>

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  leftIcon={<Mail className="h-5 w-5" />}
                  helpText="Email cannot be changed"
                  fullWidth
                />

                <Input
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  leftIcon={<UserIcon className="h-5 w-5" />}
                  fullWidth
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  >
                    {Object.values(UserRole).filter(role => role !== UserRole.SUPERADMIN).map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Assign to Stores
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2">
                    {stores.map((store) => (
                      <label key={store.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded">
                        <input
                          type="checkbox"
                          checked={formData.storeIds.includes(store.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, storeIds: [...formData.storeIds, store.id] });
                            } else {
                              setFormData({ ...formData, storeIds: formData.storeIds.filter(id => id !== store.id) });
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{store.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedUser(null);
                      resetForm();
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
                    Save Changes
                  </Button>
                </div>
              </form>
            </Modal>

            {/* Delete User Modal */}
            <Modal
              isOpen={isDeleteModalOpen}
              onClose={() => {
                setIsDeleteModalOpen(false);
                setSelectedUser(null);
              }}
              title="Delete User"
            >
              <div className="space-y-4 p-6">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-warning-500 mr-2" />
                  <p className="text-gray-600 dark:text-gray-300">
                    Are you sure you want to delete {selectedUser?.firstName} {selectedUser?.lastName}? This action cannot be undone.
                  </p>
                </div>
                {error && (
                  <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
                )}
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setSelectedUser(null);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="error"
                    onClick={handleDeleteUser}
                    isLoading={isSubmitting}
                  >
                    Delete User
                  </Button>
                </div>
              </div>
            </Modal>

            {/* Mobile Search Modal */}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};