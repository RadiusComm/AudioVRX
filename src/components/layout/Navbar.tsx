import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, User, LogOut, Settings, Bell, Users, UserCircle, Calendar, Compass, DollarSign, Tag, BarChart2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Logo } from '../ui/Logo';
import { formatRoleName } from '../../lib/utils';
import type { User as UserType } from '../../types';

interface NavbarProps {
  user?: UserType | null;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const handleNavigation = () => {
    setIsOpen(false);
    setUserMenuOpen(false);
  };

  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super-admin';
  const formattedRole = user?.mappedRoleName || formatRoleName(user?.role || '');

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Logo onClick={handleNavigation} />
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {
                user && <Link
                to="/analytics"
                onClick={handleNavigation}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/analytics')
                    ? 'border-primary-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Dashboard
              </Link>
              }
              <Link
                to="/role-plays"
                onClick={handleNavigation}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/role-plays')
                    ? 'border-primary-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Compass className="w-4 h-4 mr-1" />
                Role-Plays
              </Link>
              
              {/* Only show analytics to admins and super-admins */}
              {(isAdmin || isSuperAdmin) && (
                <Link
                  to="/role-play-analytics"
                  onClick={handleNavigation}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/role-play-analytics')
                      ? 'border-primary-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <BarChart2 className="w-4 h-4 mr-1" />
                  Analytics
                </Link>
              )}
              
              <Link
                to="/iq-agents"
                onClick={handleNavigation}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/iq-agents')
                    ? 'border-primary-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <UserCircle className="w-4 h-4 mr-1" />
                IQ Agents
              </Link>
              <Link
                to="/schedule"
                onClick={handleNavigation}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/schedule')
                    ? 'border-primary-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Schedule
              </Link>
              
              {/* Only show pricing link to admins and super-admins */}
              {(isAdmin || isSuperAdmin) && (
                <Link
                  to="/pricing"
                  onClick={handleNavigation}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/pricing')
                      ? 'border-primary-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <DollarSign className="w-4 h-4 mr-1" />
                  Pricing
                </Link>
              )}
             
              {(isAdmin || isSuperAdmin) && (
                <Link
                  to="/users"
                  onClick={handleNavigation}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/users')
                      ? 'border-primary-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Users className="w-4 h-4 mr-1" />
                  Users
                </Link>
              )}
              
              {(isAdmin || isSuperAdmin) && (
                <Link
                  to="/roles"
                  onClick={handleNavigation}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/roles')
                      ? 'border-primary-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Tag className="w-4 h-4 mr-1" />
                  Roles
                </Link>
              )}
              
              {isSuperAdmin && (
                <Link
                  to="/super-admin"
                  onClick={handleNavigation}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/super-admin')
                      ? 'border-primary-500 text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Super Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <ThemeToggle />
            
            <button
              type="button"
              className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" />
            </button>

            {user ? (
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    id="user-menu-button"
                    onClick={toggleUserMenu}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="flex items-center">
                      <Avatar 
                        src={user.avatarUrl} 
                        name={displayName || 'User'} 
                        size="sm" 
                      />
                      <span className="ml-2 text-gray-700 dark:text-gray-300 text-sm">{displayName || user.email}</span>
                      <ChevronDown className="ml-1 h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                  </button>
                </div>

                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div
                      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                    >
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{formattedRole}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                        onClick={handleNavigation}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>Your Profile</span>
                      </Link>
                      <Link
                        to="/settings"
                        className="flex px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                        onClick={handleNavigation}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                      {(isAdmin || isSuperAdmin) && (
                        <Link
                          to="/users"
                          className="flex px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          role="menuitem"
                          onClick={handleNavigation}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          <span>Manage Users</span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          onSignOut?.();
                          handleNavigation();
                        }}
                        className="flex w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        role="menuitem"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="ml-6 flex items-center">
                <Link to="/signin" onClick={handleNavigation}>
                  <Button variant="outline" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/signup" className="ml-2" onClick={handleNavigation}>
                  <Button size="sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="sm:hidden absolute w-full bg-white dark:bg-gray-900 z-50" id="mobile-menu">
            <div className="pt-2 pb-3 space-y-1">
              <Link
                to="/analytics"
                onClick={handleNavigation}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/analytics')
                    ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-100'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/role-plays"
                onClick={handleNavigation}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/role-plays')
                    ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-100'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center">
                  <Compass className="w-4 h-4 mr-2" />
                  Role-Play
                </div>
              </Link>
              
              {/* Only show analytics to admins and super-admins */}
              {(isAdmin || isSuperAdmin) && (
                <Link
                  to="/role-play-analytics"
                  onClick={handleNavigation}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/role-play-analytics')
                      ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-100'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <BarChart2 className="w-4 h-4 mr-2" />
                    Analytics
                  </div>
                </Link>
              )}
              
              <Link
                to="/iq-agents"
                onClick={handleNavigation}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/iq-agents')
                    ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-100'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center">
                  <UserCircle className="w-4 h-4 mr-2" />
                  IQ Agents
                </div>
              </Link>
              <Link
                to="/schedule"
                onClick={handleNavigation}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive('/schedule')
                    ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-100'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </div>
              </Link>
              
              {/* Only show pricing link to admins and super-admins */}
              {(isAdmin || isSuperAdmin) && (
                <Link
                  to="/pricing"
                  onClick={handleNavigation}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/pricing')
                      ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-100'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Pricing
                  </div>
                </Link>
              )}
              
              {(isAdmin || isSuperAdmin) && (
                <Link
                  to="/users"
                  onClick={handleNavigation}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/users')
                      ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-100'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Users
                  </div>
                </Link>
              )}
              
              {(isAdmin || isSuperAdmin) && (
                <Link
                  to="/roles"
                  onClick={handleNavigation}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/roles')
                      ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-100'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <Tag className="w-4 h-4 mr-2" />
                    Role Management
                  </div>
                </Link>
              )}
              
              {isSuperAdmin && (
                <Link
                  to="/super-admin"
                  onClick={handleNavigation}
                  className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                    isActive('/super-admin')
                      ? 'bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-700 dark:text-primary-100'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Super Admin
                  </div>
                </Link>
              )}
            </div>
            {user ? (
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <Avatar 
                      src={user.avatarUrl} 
                      name={displayName || 'User'} 
                      size="md" 
                    />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800 dark:text-gray-200">{displayName}</div>
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{user.email}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{formattedRole}</div>
                  </div>
                  <button className="ml-auto flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                    <span className="sr-only">View notifications</span>
                    <Bell className="h-6 w-6" />
                  </button>
                </div>
                <div className="mt-3 space-y-1">
                  <Link
                    to="/profile"
                    onClick={handleNavigation}
                    className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Your Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={handleNavigation}
                    className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={() => {
                      onSignOut?.();
                      handleNavigation();
                    }}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-around px-4">
                  <Link to="/signin" className="w-full mr-2" onClick={handleNavigation}>
                    <Button variant="outline" fullWidth>
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/signup" className="w-full ml-2" onClick={handleNavigation}>
                    <Button fullWidth>Sign up</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
};