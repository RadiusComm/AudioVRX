import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CreditCard, CheckCircle, AlertCircle, Users, Calendar, Zap, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Billing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPlan = location.state?.selectedPlan;
  const searchParams = new URLSearchParams(location.search);
  const isSuccess = searchParams.get('success') === 'true';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  useEffect(() => {
    // If a plan was selected or success parameter is true, show a success message
    if (selectedPlan) {
      setSuccess(`You've selected the ${selectedPlan.name} plan at ${selectedPlan.price ? `$${selectedPlan.price}/user/month` : 'Custom pricing'}.`);
    } else if (isSuccess) {
      setSuccess('Your subscription has been successfully processed. Thank you for your payment!');
      loadCurrentSubscription();
    }
  }, [selectedPlan, isSuccess]);

  const loadCurrentSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading subscription:', error);
        return;
      }

      if (data) {
        setCurrentSubscription(data);
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan?.id || 'medium', // Default to medium plan if none selected
          priceId: selectedPlan?.priceId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      setError(err.message || 'An error occurred while creating the checkout session');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine which plan to display
  const displayPlan = currentSubscription ? {
    name: currentSubscription.subscription_tier === 'small' ? 'Small Teams' :
          currentSubscription.subscription_tier === 'medium' ? 'Medium Teams' :
          currentSubscription.subscription_tier === 'large' ? 'Large Teams' :
          currentSubscription.subscription_tier === 'enterprise' ? 'Enterprise' : 'Professional Plan',
    price: currentSubscription.subscription_tier === 'small' ? 39.99 :
           currentSubscription.subscription_tier === 'medium' ? 34.99 :
           currentSubscription.subscription_tier === 'large' ? 29.99 : 49,
    period: 'month',
    features: [
      'Unlimited role-plays',
      'Advanced analytics',
      'Team management',
      'Custom role-plays',
      'Priority support'
    ]
  } : selectedPlan;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex items-center"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/pricing')}
              className="mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                Billing Management
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                Manage your subscription and payment information
              </p>
            </div>
          </motion.div>

          {error && (
            <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/50 text-error-700 dark:text-error-200 rounded-lg border border-error-200 dark:border-error-800">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-success-50 dark:bg-success-900/50 text-success-700 dark:text-success-200 rounded-lg border border-success-200 dark:border-success-800">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <p>{success}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Your current subscription details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-lg border border-primary-100 dark:border-primary-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="bg-primary-100 dark:bg-primary-800 p-3 rounded-full">
                        <CreditCard className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {displayPlan ? displayPlan.name : 'Professional Plan'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {displayPlan ? 
                            (displayPlan.price ? `$${displayPlan.price}/user/${displayPlan.period}` : 'Custom pricing') : 
                            '$49/month'}
                        </p>
                      </div>
                    </div>
                    <div className="bg-success-100 dark:bg-success-900/30 px-3 py-1 rounded-full">
                      <span className="text-sm font-medium text-success-800 dark:text-success-300">
                        {currentSubscription ? currentSubscription.status : 'Active'}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {displayPlan ? (
                      displayPlan.features.map((feature, index) => (
                        <div className="flex items-center" key={index}>
                          <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">Unlimited role-plays</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">Advanced analytics</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">Team management</span>
                        </div>
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                          <span className="text-gray-700 dark:text-gray-300">Custom role-plays</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">View Invoice History</Button>
                <Button
                  onClick={handleCheckout}
                  isLoading={isLoading}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                >
                  {currentSubscription ? 'Manage Subscription' : 'Complete Subscription'}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Summary</CardTitle>
                <CardDescription>Current billing period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">Active Users</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">12 / 20</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">Sessions Used</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">156 / 500</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-secondary-600 dark:bg-secondary-500 h-2 rounded-full" style={{ width: '31%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Zap className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
                      <span className="text-gray-700 dark:text-gray-300">API Calls</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">2,345 / 10,000</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-accent-600 dark:bg-accent-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage your payment information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-md mr-4">
                    <CreditCard className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Visa ending in 4242</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Expires 12/2025</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">Edit</Button>
                  <Button variant="ghost" size="sm">Remove</Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                leftIcon={<CreditCard className="h-4 w-4" />}
              >
                Add Payment Method
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};