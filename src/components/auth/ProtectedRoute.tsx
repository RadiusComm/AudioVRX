import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [] 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }
        
        // If no specific roles are required, just being authenticated is enough
        if (allowedRoles.length === 0) {
          setIsAuthorized(true);
          setIsLoading(false);
          return;
        }
        
        // Check user's role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
          
        if (profileError || !profile) {
          console.error('Error fetching user profile:', profileError);
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }
        
        // Check if user's role is in the allowed roles
        setIsAuthorized(allowedRoles.includes(profile.role));
      } catch (error) {
        console.error('Error in auth check:', error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 text-primary-600 dark:text-primary-400 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    // Redirect to sign in page with return URL
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
};