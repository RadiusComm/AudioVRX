import React, { useState } from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, Shield, Clock, CheckCircle, XCircle, Plus, Ban, Store, ChevronLeft, ChevronRight, AtSign } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { User, UserRole } from '../../types';
import { formatRoleName } from '../../lib/utils';

interface UserTableProps {
  users: User[];
  roleColors: Record<UserRole, string>;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onAddUser: () => void;
  onToggleBan: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  roleColors,
  onEditUser,
  onDeleteUser,
  onAddUser,
  onToggleBan,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;
  
  // Calculate pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(users.length / usersPerPage);

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  return (
    <Card className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              {users.length} user{users.length !== 1 ? 's' : ''} found
            </CardDescription>
          </div>
          <Button
            onClick={onAddUser}
            leftIcon={<Plus className="h-4 w-4" />}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
          >
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-white dark:bg-gray-800 z-10">
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Stores
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar
                          src={user.avatarUrl}
                          name={`${user.firstName} ${user.lastName}`}
                          size="md"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center">
                            {user.firstName} {user.lastName}
                            {user.is_banned && (
                              <Ban className="h-4 w-4 ml-1 text-error-500 dark:text-error-400" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                          {user.username && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                              <AtSign className="h-3 w-3 mr-1" />
                              {user.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          roleColors[user.role]
                        }`}
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {user.mappedRoleName || formatRoleName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300'
                        }`}
                      >
                        {user.status === 'active' ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 mr-1" />
                        )}
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-4 h-4 mr-1" />
                        {format(user.lastActive, 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {user.completedScenarios} role-plays
                        </div>
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-primary-600 dark:bg-primary-400 rounded-full h-2"
                              style={{ width: `${user.averageScore}%` }}
                            />
                          </div>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {user.averageScore}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {user.storeIds && user.storeIds.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.storeIds.length <= 2 ? (
                              user.stores?.map((store, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200">
                                  <Store className="w-3 h-3 mr-1 text-primary-500" />
                                  {store.storeId || `Store ${index + 1}`}
                                </span>
                              ))
                            ) : (
                              <>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200">
                                  <Store className="w-3 h-3 mr-1 text-primary-500" />
                                  {user.stores?.[0]?.storeId || "Store 1"}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                  +{user.storeIds.length - 1} more
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Not assigned
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant={user.is_banned ? "error" : "ghost"}
                          size="sm"
                          onClick={() => onToggleBan(user)}
                          title={user.is_banned ? "Unban User" : "Ban User"}
                          className="p-1.5"
                        >
                          <Ban className={`w-4 h-4 ${user.is_banned ? "text-white" : "text-error-600 dark:text-error-400"}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditUser(user)}
                          className="p-1.5"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteUser(user)}
                          className="p-1.5"
                        >
                          <Trash2 className="w-4 h-4 text-error-600 dark:text-error-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{" "}
          <span className="font-medium">
            {Math.min(indexOfLastUser, users.length)}
          </span>{" "}
          of <span className="font-medium">{users.length}</span> users
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Show pages around current page
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};