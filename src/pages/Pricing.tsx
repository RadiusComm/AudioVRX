import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Star } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

const pricingPlans = [
  {
    id: 'small',
    name: 'Small Teams',
    price: 39.99,
    period: 'month',
    priceId: 'price_1RX5svQMsH2TKcxe47Q3RqGZ',
    description: '1-20 Employees',
    features: [
      'Unlimited AI Roleplay',
      'Basic Analytics',
      'Standard Scenarios',
      'Email Support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'medium',
    name: 'Medium Teams',
    price: 34.99,
    period: 'month',
    priceId: 'price_1RX5wWQMsH2TKcxedenOn29H',
    description: '21-50 Employees',
    features: [
      'Unlimited AI Roleplay',
      'Advanced Analytics',
      'Custom Scenarios',
      'Priority Support',
      'Advanced Customization',
    ],
    cta: 'Get Started',
    popular: true,
  },
  {
    id: 'large',
    name: 'Large Teams',
    price: 29.99,
    period: 'month',
    priceId: 'price_1RX61pQMsH2TKcxeVs5gCduc',
    description: '51-100 Employees',
    features: [
      'Unlimited AI Roleplay',
      'Premium Analytics',
      'Advanced Customization',
      'Dedicated Support Manager',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    customLabel: 'Custom',
    period: 'month',
    description: '100+ Employees',
    features: [
      'Unlimited AI Roleplay',
      'Enterprise Analytics',
      'Custom Integration',
      '24/7 Premium Support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export const Pricing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isSuccess = searchParams.get('success') === 'true';
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // If success parameter is present, redirect to billing page
  useEffect(() => {
    if (isSuccess) {
      navigate('/billing?success=true');
    }
  }, [isSuccess, navigate]);

  // Get user's current plan from profile
  useEffect(() => {
    const getUserPlan = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('plan_id')
            .eq('id', user.id)
            .single();
            
          if (!error && profile && profile.plan_id) {
            setCurrentPlan(profile.plan_id);
          }
        }
      } catch (err) {
        console.error('Error fetching user plan:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    getUserPlan();
  }, []);

  const handleGetStarted = (plan) => {
    if (plan.id === 'enterprise') {
      window.location.href = 'https://myretailiq.com/#pricing';
    } else {
      navigate('/billing', { state: { selectedPlan: plan } });
    }
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
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">Pricing</h1>
            <div></div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="pt-16 md:pt-0">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold">
              Pricing <span className="text-primary-500 dark:text-primary-400">Plans</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Choose the perfect plan for your team size. All plans include unlimited AI roleplay simulations.
            </p>
          </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="relative pt-4 flex"
              >
                {plan.popular && (
                  <div className="absolute -top-4 inset-x-0 flex justify-center">
                    <div className="inline-flex items-center gap-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium px-4 py-1 rounded-full shadow-lg">
                      <Star className="w-4 h-4" />
                      Recommended
                    </div>
                  </div>
                )}
                <div 
                  className={`flex flex-col w-full rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl ${
                    (plan.popular || currentPlan === plan.priceId) 
                      ? 'border-2 border-primary-500 dark:border-primary-400' 
                      : 'border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="p-6 bg-white dark:bg-gray-800 flex-grow">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {plan.description}
                    </p>
                    <div className="mb-6">
                      {plan.price !== null ? (
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">/user/{plan.period}</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.customLabel}</span>
                          <span className="ml-2 text-gray-600 dark:text-gray-400">/user/{plan.period}</span>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-4 mb-8">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-primary-500 dark:text-primary-400 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      onClick={() => handleGetStarted(plan)}
                      variant={currentPlan === plan.priceId ? 'success' : plan.popular ? 'primary' : 'outline'}
                      fullWidth
                      className={currentPlan === plan.priceId ? 
                        'bg-success-500 hover:bg-success-600 text-white' : 
                        plan.popular ? 
                          'bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white' : 
                          ''
                      }
                    >
                      {currentPlan === plan.priceId ? 'Current Plan' : plan.cta}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Need a custom solution?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
              Contact our sales team for enterprise-grade solutions tailored to your specific requirements.
            </p>
            <Button
              onClick={() => window.location.href = 'https://myretailiq.com/#pricing'}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-8 py-3"
              size="lg"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};