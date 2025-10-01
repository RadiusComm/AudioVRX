import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { MobileBottomNav } from './MobileBottomNav';
import { signOut, getCurrentUser, getUserProfile } from '../../lib/supabase';
import { getMappedRoleName } from '../../lib/utils';
import type { User } from '../../types';

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  requireAuth?: boolean;
}

const PUBLIC_ROUTES = ['/signin', '/signup', '/forgot-password', '/', '/dashboard', '/role-plays'];

export const Layout = ({ children, hideFooter = false, requireAuth = false }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);
  const isPracticePage = location.pathname.startsWith('/practice/');

  useEffect(() => {
    loadUser();
    
    // Add event listener for window resize
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false); // Keep sidebar closed on mobile
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Call once on mount
    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname]);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      
      if (!currentUser && requireAuth) {
        navigate('/signin', { state: { from: location.pathname } });
        return;
      }

      if (currentUser) {
        const profile = await getUserProfile(currentUser.id);
        
        // Get mapped role name if available
        if (profile.account_id) {
          try {
            const mappedRoleName = await getMappedRoleName(profile.role, profile.account_id);
            profile.mappedRoleName = mappedRoleName;
          } catch (err) {
            console.error('Error getting mapped role name:', err);
          }
        }
        
        setUser({
          ...profile,
          email: currentUser.email,
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
      if (requireAuth) {
        navigate('/signin', { state: { from: location.pathname } });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      navigate('/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Calculate dynamic margin based on sidebar state and screen size
  const getMainContentClass = () => {
    if (typeof window === 'undefined') return 'ml-0';
    
    const isDesktop = window.innerWidth >= 768;
    
    if (!isDesktop) {
      return 'ml-0'; // No margin on mobile
    }
    
    return isSidebarOpen ? 'ml-64' : 'ml-20'; // Dynamic margin on desktop
  };
  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-red-900/20 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar 
          user={user} 
          onSignOut={handleSignOut}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>
      
      <div className={`flex flex-col min-h-screen transition-all duration-300 min-w-0 ${getMainContentClass()}`}>
        <main className={`flex-grow overflow-auto ${!isPracticePage ? 'pb-16' : ''} md:pb-0`}>{children}</main>
        {!hideFooter && <div className="hidden md:block"><Footer /></div>}
      </div>
      
      {/* Mobile Bottom Navigation */}
      {!isPracticePage && <MobileBottomNav userRole={user?.role} />}
    </div>
  );
};