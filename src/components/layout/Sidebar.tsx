import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, LayoutDashboard, Target, 
  UserCircle, Users, Calendar, BookOpen, Settings, LogOut,
  Menu, Bell, Compass, Wallet, DollarSign, ShieldAlert, Tag, BarChart2
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Logo } from '../ui/Logo';
import { formatRoleName } from '../../lib/utils';
import type { User } from '../../types';

interface SidebarProps {
  user?: User | null;
  onSignOut?: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ user, onSignOut, isOpen, onToggle }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'super-admin';
  const formattedRole = user?.mappedRoleName || formatRoleName(user?.role || '');

  // Listen for toggle events from other components
  useEffect(() => {
    const handleToggle = () => onToggle();
    window.addEventListener('toggleSidebar', handleToggle);
    return () => window.removeEventListener('toggleSidebar', handleToggle);
  }, [onToggle]);

  const isActive = (path: string) => location.pathname === path;

  const NavLink = ({ to, icon: Icon, label, onClick }: { to: string; icon: any; label: string; onClick?: () => void }) => (
    <button
      onClick={onClick || (() => navigate(to))}
      className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive(to)
          ? 'bg-primary-100 text-primary-900 dark:bg-primary-900/20 dark:text-primary-100'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 mr-3">
        <Icon className="h-5 w-5" />
      </div>
      <span className={`truncate transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        {label}
      </span>
    </button>
  );

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-black/20 backdrop-blur-xl border-r border-white/10 z-50 transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      } will-change-transform`}
      style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.9) 50%, rgba(42,26,26,0.9) 100%)' }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center overflow-hidden">
            <div className={`transition-all duration-300 ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
              <Logo className="h-8" />
            </div>
            <div className={`transition-all duration-300 ${!isOpen ? 'opacity-100 w-8 h-8' : 'opacity-0 w-0 h-0'} rounded-lg bg-red-600 flex items-center justify-center shadow-lg`}>
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1M12 7C13.11 7 14 7.89 14 9V15C14 16.11 13.11 17 12 17S10 16.11 10 15V9C10 7.89 10.89 7 12 7Z"/>
              </svg>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1 w-8 h-8 flex items-center justify-center"
          >
            {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </Button>
        </div>

        <div className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          <NavLink to="/analytics" icon={LayoutDashboard} label="Dashboard" />
          <NavLink to="/role-plays" icon={Compass} label="Mystery Worlds" />
          <NavLink to="/iq-agents" icon={UserCircle} label="Characters" />
          <NavLink to="/schedule" icon={Calendar} label="Schedule" />
          <NavLink to="/knowledge-base" icon={BookOpen} label="Knowledge Base" />
          <NavLink to="/roles" icon={Tag} label="Role Management" />
          
          {/* Only show pricing and subscription links to admins (not super-admins) */}
          {(isAdmin && !isSuperAdmin) && (
            <>
              <NavLink to="/pricing" icon={DollarSign} label="Pricing" />
              <NavLink to="/subscriptions" icon={Wallet} label="Subscriptions" />
              <NavLink to="/users" icon={Users} label="Users" />
            </>
          )}
          
          {/* Super admin only link */}
          {isSuperAdmin && (
            <NavLink to="/super-admin" icon={ShieldAlert} label="Super Admin" />
          )}
        </div>

        <div className="p-4 border-t border-red-500/20">
          {user ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar
                  src={user.avatarUrl}
                  name={displayName}
                  size="sm"
                />
                <div className={`flex-1 min-w-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                  {isOpen && (
                    <>
                    <p className="text-sm font-medium text-white truncate">
                      {displayName || user.email}
                    </p>
                    <p className="text-xs text-gray-300 truncate">
                      {formattedRole}
                    </p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <ThemeToggle />
                </div>
                {isOpen && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8 flex items-center justify-center"
                    >
                      <Bell className="h-5 w-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8 flex items-center justify-center"
                      onClick={onSignOut}
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Link to="/signin" className="w-full">
                <Button variant="outline" fullWidth>
                  Sign in
                </Button>
              </Link>
              <Link to="/signup" className="w-full">
                <Button fullWidth>
                  Sign up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}