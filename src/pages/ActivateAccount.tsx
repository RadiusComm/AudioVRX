import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import {supabase} from '../lib/supabase';

export const ActivateAccount = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const activateUser = async () => {
      try {
        // Get token and userId from URL parameters
        const searchParams = new URLSearchParams(location.search);
        const token = searchParams.get('token');
        const userId = searchParams.get('userId');

        if (!token || !userId) {
          throw new Error('Invalid activation link. Missing token or user ID.');
        }

        // Call the activation endpoint
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/activate-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          },
          body: JSON.stringify({ token, userId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to activate account');
        }

        setSuccess(true);
      } catch (err: any) {
        console.error('Error activating account:', err);
        setError(err.message || 'An error occurred while activating your account');
      } finally {
        setIsLoading(false);
      }
    };

    activateUser();
  }, [location.search]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8">
        <div className="flex justify-center">
          <Logo className="h-12 w-auto" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          Account Activation
        </h2>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-12 w-12 text-primary-500 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Activating your account...
              </p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="bg-success-100 dark:bg-success-900/30 p-3 rounded-full mb-4">
                <CheckCircle className="h-12 w-12 text-success-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Account Activated!
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                Your account has been successfully activated. You can now sign in with your credentials.
              </p>
              <Button
                onClick={() => navigate('/signin')}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
              >
                Sign In
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="bg-error-100 dark:bg-error-900/30 p-3 rounded-full mb-4">
                <AlertCircle className="h-12 w-12 text-error-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Activation Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
                {error || 'There was a problem activating your account. Please try again or contact support.'}
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/signin')}
                className="w-full"
              >
                Back to Sign In
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};