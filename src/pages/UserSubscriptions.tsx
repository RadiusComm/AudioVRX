import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';
import { Search, Edit, AlertCircle, CheckCircle, XCircle, CreditCard, Filter, RefreshCw, Calendar, DollarSign, Wallet } from 'lucide-react';

interface UserSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  subscription_tier: 'free' | 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
  user?: {
    first_name: string;
    last_name: string;
    username: string;
  };
}

interface Payment {
  id: string;
  user_id: string;
  stripe_charge_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
  user?: {
    first_name: string;
    last_name: string;
    username: string;
  };
}

export const UserSubscriptions = () => {
  const navigate = useNavigate();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'payments'>('subscriptions');
  
  // Subscriptions state
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [filteredSubscriptions, setFilteredSubscriptions] = useState<UserSubscription[]>([]);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');
  
  // Payments state
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSearchTerm, setPaymentSearchTerm] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<UserSubscription | null>(null);
  const [formData, setFormData] = useState({
    subscription_tier: '',
    status: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'subscriptions') {
      loadSubscriptions();
    } else {
      loadPayments();
    }
  }, [activeTab]);

  useEffect(() => {
    filterSubscriptions();
  }, [subscriptions, searchTerm, statusFilter, tierFilter]);

  useEffect(() => {
    filterPayments();
  }, [payments, paymentSearchTerm, paymentStatusFilter, startDate, endDate]);

  const loadSubscriptions = async () => {
    try {
      setIsLoadingSubscriptions(true);
      setSubscriptionError(null);

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          user:user_id (
            first_name,
            last_name,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions(data || []);
    } catch (err: any) {
      console.error('Error loading subscriptions:', err);
      setSubscriptionError(err.message);
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  const loadPayments = async () => {
    try {
      setIsLoadingPayments(true);
      setPaymentError(null);

      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          user:user_id (
            first_name,
            last_name,
            username
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (err: any) {
      console.error('Error loading payments:', err);
      setPaymentError(err.message);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const filterSubscriptions = () => {
    let filtered = [...subscriptions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `${sub.user?.first_name} ${sub.user?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.stripe_customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.stripe_subscription_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter);
    }

    // Apply tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter(sub => sub.subscription_tier === tierFilter);
    }

    setFilteredSubscriptions(filtered);
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Apply search filter
    if (paymentSearchTerm) {
      filtered = filtered.filter(payment => 
        payment.user?.username?.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
        `${payment.user?.first_name} ${payment.user?.last_name}`.toLowerCase().includes(paymentSearchTerm.toLowerCase()) ||
        payment.stripe_charge_id.toLowerCase().includes(paymentSearchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === paymentStatusFilter);
    }

    // Apply date range filter
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter(payment => new Date(payment.created_at) >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      filtered = filtered.filter(payment => new Date(payment.created_at) <= end);
    }

    setFilteredPayments(filtered);
  };

  const handleEditSubscription = (subscription: UserSubscription) => {
    setSelectedSubscription(subscription);
    setFormData({
      subscription_tier: subscription.subscription_tier,
      status: subscription.status
    });
    setIsEditModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubscription) return;

    setIsSubmitting(true);
    setSubscriptionError(null);
    setSuccessMessage(null);

    try {
      // Update subscription in Supabase
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          subscription_tier: formData.subscription_tier,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      // Call Stripe API via Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: selectedSubscription.stripe_subscription_id,
          tier: formData.subscription_tier,
          status: formData.status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subscription in Stripe');
      }

      setSuccessMessage('Subscription updated successfully');
      await loadSubscriptions();
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSelectedSubscription(null);
      }, 1500);
    } catch (err: any) {
      console.error('Error updating subscription:', err);
      setSubscriptionError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    setIsCanceling(true);
    setSubscriptionError(null);
    setSuccessMessage(null);

    try {
      // Update subscription status in Supabase
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'canceled',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      // Call Stripe API via Edge Function to cancel subscription
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: selectedSubscription.stripe_subscription_id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription in Stripe');
      }

      setSuccessMessage('Subscription canceled successfully');
      await loadSubscriptions();
      
      // Close modal after a short delay to show success message
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSelectedSubscription(null);
      }, 1500);
    } catch (err: any) {
      console.error('Error canceling subscription:', err);
      setSubscriptionError(err.message);
    } finally {
      setIsCanceling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'succeeded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            {status === 'active' ? 'Active' : 'Succeeded'}
          </span>
        );
      case 'canceled':
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800 dark:bg-error-900/50 dark:text-error-300">
            <XCircle className="w-3 h-3 mr-1" />
            {status === 'canceled' ? 'Canceled' : 'Failed'}
          </span>
        );
      case 'past_due':
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300">
            <AlertCircle className="w-3 h-3 mr-1" />
            {status === 'past_due' ? 'Past Due' : 'Pending'}
          </span>
        );
      case 'trialing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
            <CreditCard className="w-3 h-3 mr-1" />
            Trial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {status}
          </span>
        );
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'free':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Free
          </span>
        );
      case 'basic':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
            Basic
          </span>
        );
      case 'professional':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary-100 text-secondary-800 dark:bg-secondary-900/50 dark:text-secondary-300">
            Professional
          </span>
        );
      case 'enterprise':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-300">
            Enterprise
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            {tier}
          </span>
        );
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2
    }).format(amount);
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
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">Subscriptions</h1>
            <div></div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 pt-16 md:pt-0"
          >
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
              User Subscriptions
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Manage user subscription plans and payment status
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="mb-8 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`${
                  activeTab === 'subscriptions'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Subscriptions
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`${
                  activeTab === 'payments'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Wallet className="h-5 w-5 mr-2" />
                Payments
              </button>
            </nav>
          </div>

          {activeTab === 'subscriptions' ? (
            <>
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-1 md:col-span-1">
                      <Input
                        placeholder="Search by username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        leftIcon={<Search className="h-5 w-5" />}
                        fullWidth
                      />
                    </div>
                    
                    <div className="flex space-x-4 col-span-1 md:col-span-2">
                      <select
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="canceled">Canceled</option>
                        <option value="past_due">Past Due</option>
                        <option value="trialing">Trial</option>
                      </select>
                      
                      <select
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={tierFilter}
                        onChange={(e) => setTierFilter(e.target.value)}
                      >
                        <option value="all">All Tiers</option>
                        <option value="free">Free</option>
                        <option value="basic">Basic</option>
                        <option value="professional">Professional</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                      
                      <Button
                        variant="outline"
                        onClick={loadSubscriptions}
                        leftIcon={<RefreshCw className="h-4 w-4" />}
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscriptions</CardTitle>
                  <CardDescription>
                    {filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingSubscriptions ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : subscriptionError ? (
                    <div className="flex items-center p-4 text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/50 rounded-lg">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      {subscriptionError}
                    </div>
                  ) : filteredSubscriptions.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                        No subscriptions found
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Subscription Tier
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Current Period End
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredSubscriptions.map((subscription) => (
                            <tr
                              key={subscription.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
                              onClick={() => navigate('/pricing')}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {subscription.user?.first_name} {subscription.user?.last_name}
                                  </div>
                                  {subscription.user?.username && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      @{subscription.user.username}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getTierBadge(subscription.subscription_tier)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(subscription.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {subscription.current_period_end ? 
                                    format(new Date(subscription.current_period_end), 'MMM d, yyyy') : 
                                    'N/A'}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent row click event
                                    handleEditSubscription(subscription);
                                  }}
                                  className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="mb-8">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <Input
                        placeholder="Search by username..."
                        value={paymentSearchTerm}
                        onChange={(e) => setPaymentSearchTerm(e.target.value)}
                        leftIcon={<Search className="h-5 w-5" />}
                        fullWidth
                      />
                    </div>
                    
                    <div className="flex space-x-4 col-span-1">
                      <select
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        value={paymentStatusFilter}
                        onChange={(e) => setPaymentStatusFilter(e.target.value)}
                      >
                        <option value="all">All Statuses</option>
                        <option value="succeeded">Succeeded</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                      </select>
                      
                      <Button
                        variant="outline"
                        onClick={loadPayments}
                        leftIcon={<RefreshCw className="h-4 w-4" />}
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Input
                          type="date"
                          label="Start Date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          leftIcon={<Calendar className="h-5 w-5" />}
                          fullWidth
                        />
                      </div>
                      <div className="flex-1">
                        <Input
                          type="date"
                          label="End Date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          leftIcon={<Calendar className="h-5 w-5" />}
                          fullWidth
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payments</CardTitle>
                  <CardDescription>
                    {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingPayments ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : paymentError ? (
                    <div className="flex items-center p-4 text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/50 rounded-lg">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      {paymentError}
                    </div>
                  ) : filteredPayments.length === 0 ? (
                    <div className="text-center py-12">
                      <Wallet className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                        No payments found
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Charge ID
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {filteredPayments.map((payment) => (
                            <tr
                              key={payment.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {payment.user?.first_name} {payment.user?.last_name}
                                  </div>
                                  {payment.user?.username && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      @{payment.user.username}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                                  <DollarSign className="h-4 w-4 mr-1 text-success-500" />
                                  {formatCurrency(payment.amount, payment.currency)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(payment.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {format(new Date(payment.created_at), 'MMM d, yyyy h:mm a')}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                  {payment.stripe_charge_id}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Edit Subscription Modal */}
          <Modal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedSubscription(null);
              setSubscriptionError(null);
              setSuccessMessage(null);
            }}
            title="Edit Subscription"
          >
            {selectedSubscription && (
              <form onSubmit={handleSubmit} className="space-y-6 p-6">
                {subscriptionError && (
                  <div className="p-4 bg-error-50 dark:bg-error-900/50 rounded-lg border border-error-200 dark:border-error-800">
                    <div className="flex">
                      <AlertCircle className="h-5 w-5 text-error-400 dark:text-error-300" />
                      <p className="ml-3 text-sm text-error-700 dark:text-error-200">{subscriptionError}</p>
                    </div>
                  </div>
                )}

                {successMessage && (
                  <div className="p-4 bg-success-50 dark:bg-success-900/50 rounded-lg border border-success-200 dark:border-success-800">
                    <div className="flex">
                      <CheckCircle className="h-5 w-5 text-success-400 dark:text-success-300" />
                      <p className="ml-3 text-sm text-success-700 dark:text-success-200">{successMessage}</p>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User Information</h3>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {selectedSubscription.user?.first_name} {selectedSubscription.user?.last_name}
                  </p>
                  {selectedSubscription.user?.username && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{selectedSubscription.user.username}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subscription Tier
                  </label>
                  <select
                    name="subscription_tier"
                    value={formData.subscription_tier}
                    onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  >
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="canceled">Canceled</option>
                    <option value="past_due">Past Due</option>
                    <option value="trialing">Trial</option>
                  </select>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stripe Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Customer ID</p>
                      <p className="text-sm text-gray-900 dark:text-white font-mono">
                        {selectedSubscription.stripe_customer_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Subscription ID</p>
                      <p className="text-sm text-gray-900 dark:text-white font-mono">
                        {selectedSubscription.stripe_subscription_id}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                  >
                    Save Changes
                  </Button>
                  
                  <Button
                    type="button"
                    variant="error"
                    onClick={handleCancelSubscription}
                    isLoading={isCanceling}
                    disabled={selectedSubscription.status === 'canceled' || isSubmitting}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </Button>
                </div>
              </form>
            )}
          </Modal>
        </div>
      </div>
    </Layout>
  );
};