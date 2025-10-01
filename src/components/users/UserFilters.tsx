import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { UserRole } from '../../types';
import { Button } from '../ui/Button';

interface UserFiltersProps {
  searchTerm: string;
  selectedRole: UserRole | 'all';
  selectedStatus: 'all' | 'active' | 'inactive';
  sortBy: string;
  stores: Array<{id: string, name: string}>;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: UserRole | 'all') => void;
  onStatusChange: (value: 'all' | 'active' | 'inactive') => void;
  onSortChange: (value: string) => void;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  searchTerm,
  selectedRole,
  selectedStatus,
  sortBy,
  stores,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onSortChange = () => {},
}) => {
  return (
    <Card className="mb-8 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            leftIcon={<Search className="h-5 w-5" />}
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            fullWidth
          />
          <select
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole | 'all')}
          >
            <option value="all">All Roles</option>
            {Object.values(UserRole).map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}s
              </option>
            ))}
          </select>
          <select
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            value={selectedStatus}
            onChange={(e) => onStatusChange(e.target.value as 'all' | 'active' | 'inactive')}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        
        <div className="mt-4 flex flex-col md:flex-row md:items-center">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">Sort by:</span>
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            <Button 
              variant={sortBy === 'name' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => onSortChange('name')}
              className="flex items-center"
            >
              Name <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
            <Button 
              variant={sortBy === 'role' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => onSortChange('role')}
              className="flex items-center"
            >
              Role <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
            <Button 
              variant={sortBy === 'status' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => onSortChange('status')}
              className="flex items-center"
            >
              Status <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
            <Button 
              variant={sortBy === 'store' ? 'primary' : 'outline'} 
              size="sm"
              onClick={() => onSortChange('store')}
              className="flex items-center"
            >
              Store <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};