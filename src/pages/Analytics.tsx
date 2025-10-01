import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { 
  BarChart, 
  Calendar, 
  ChevronDown, 
  Download, 
  Users, 
  Building, 
  Settings, 
  Bell, 
  Users2, 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Target,
  Filter,
  Search,
  ArrowUpRight,
  Zap,
  BarChart3,
  PieChart,
  TrendingUp,
  Activity,
  RefreshCw,
  AlertCircle,
  Menu
} from 'lucide-react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { supabase } from '../lib/supabase';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const Analytics = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('last30Days');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'admin' | 'user'>('admin');
  const [currentUserAccountId, setCurrentUserAccountId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalStores: 0,
    newStores: 0,
    avgRoleplays: 0,
    roleplaysChange: 0,
    completionRate: 0,
    completionRateChange: 0
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    checkUserRole();
    loadAnalyticsData();
  }, [timeRange]);

  const checkUserRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, account_id')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      
      setUserRole(profile.role);
      setCurrentUserAccountId(profile.account_id);
      
      // Set default view mode based on role
      if (profile.role === 'admin' || profile.role === 'super-admin') {
        setViewMode('admin');
      } else {
        setViewMode('user');
      }
    } catch (err) {
      console.error('Error checking user role:', err);
    }
  };

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    setIsRefreshing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, account_id')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      // Get user stats based on role
      let userQuery = supabase.from('profiles').select('*', { count: 'exact' });
      
      // Filter by account_id for regular admins
      if (profile.role === 'admin' && profile.account_id) {
        userQuery = userQuery.eq('account_id', profile.account_id);
      }
      // Super admins can see all users, so no filter needed
      
      const { count: totalUsers, error: usersError } = await userQuery;
      
      if (usersError) throw usersError;
      
      // Get active users
      let activeUserQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('status', 'active');
        
      // Filter by account_id for regular admins
      if (profile.role === 'admin' && profile.account_id) {
        activeUserQuery = activeUserQuery.eq('account_id', profile.account_id);
      }
      
      const { count: activeUsers, error: activeUsersError } = await activeUserQuery;
      
      if (activeUsersError) throw activeUsersError;
      
      // Get stores data
      let storesQuery = supabase.from('stores').select('*', { count: 'exact' });
      
      // Filter by account_id for regular admins through user_store_assignments
      if (profile.role === 'admin' && profile.account_id) {
        // For admins, get stores associated with users in their account
        const { data: accountUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('account_id', profile.account_id);
          
        if (accountUsers && accountUsers.length > 0) {
          const userIds = accountUsers.map(u => u.id);
          
          // Get store IDs assigned to these users
          const { data: storeAssignments } = await supabase
            .from('user_store_assignments')
            .select('store_id')
            .in('user_id', userIds);
            
          if (storeAssignments && storeAssignments.length > 0) {
            const storeIds = storeAssignments.map(a => a.store_id);
            storesQuery = storesQuery.in('id', storeIds);
          }
        }
      }
      
      const { count: totalStores, error: storesError } = await storesQuery;
      
      if (storesError) throw storesError;
      
      // Get new stores (created in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      let newStoresQuery = supabase
        .from('stores')
        .select('*', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString());
        
      // Apply the same filtering as for total stores
      if (profile.role === 'admin' && profile.account_id) {
        const { data: accountUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('account_id', profile.account_id);
          
        if (accountUsers && accountUsers.length > 0) {
          const userIds = accountUsers.map(u => u.id);
          
          const { data: storeAssignments } = await supabase
            .from('user_store_assignments')
            .select('store_id')
            .in('user_id', userIds);
            
          if (storeAssignments && storeAssignments.length > 0) {
            const storeIds = storeAssignments.map(a => a.store_id);
            newStoresQuery = newStoresQuery.in('id', storeIds);
          }
        }
      }
      
      const { count: newStores, error: newStoresError } = await newStoresQuery;
      
      if (newStoresError) throw newStoresError;
      
      // Get roleplay sessions data
      let sessionsQuery = supabase.from('roleplay_sessions').select('*');
      
      // Filter by account_id for regular admins
      if (profile.role === 'admin' && profile.account_id) {
        // Get users in the admin's account
        const { data: accountUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('account_id', profile.account_id);
          
        if (accountUsers && accountUsers.length > 0) {
          const userIds = accountUsers.map(u => u.id);
          sessionsQuery = sessionsQuery.in('user_id', userIds);
        }
      }
      
      const { data: sessions, error: sessionsError } = await sessionsQuery;
      
      if (sessionsError) throw sessionsError;
      
      // Calculate average roleplays per user
      const userCount = totalUsers || 1; // Avoid division by zero
      const avgRoleplays = sessions ? Math.round((sessions.length / userCount) * 10) / 10 : 0;
      
      // Calculate completion rate
      const completedSessions = sessions ? sessions.filter(s => s.status === 'completed').length : 0;
      const completionRate = sessions && sessions.length > 0 
        ? Math.round((completedSessions / sessions.length) * 100) 
        : 0;
      
      // Get previous period data for comparison
      // For simplicity, we'll use mock data for the changes
      const roleplaysChange = -0.3; // Mock data
      const completionRateChange = 5; // Mock data
      
      setStats({
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalStores: totalStores || 0,
        newStores: newStores || 0,
        avgRoleplays,
        roleplaysChange,
        completionRate,
        completionRateChange
      });
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error loading analytics data:', err);
      setError(err.message);
      setIsLoading(false);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Performance trend data
  const performanceTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Average Score',
        data: [65, 68, 72, 75, 79, 83],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  // Top performing stores data
  const topStoresData = {
    labels: ['Store #001', 'Store #005', 'Store #012', 'Store #003', 'Store #007'],
    datasets: [
      {
        label: 'Performance Score',
        data: [92, 88, 85, 90, 87],
        backgroundColor: 'rgb(16, 185, 129)',
        borderRadius: 6,
      },
    ],
  };

  // Training scenarios data
  const scenariosData = {
    labels: ['Customer Service', 'Sales Training', 'Product Knowledge', 'Compliance'],
    datasets: [
      {
        label: 'Scenarios',
        data: [35, 25, 22, 18],
        backgroundColor: [
          'rgb(59, 130, 246)', // Blue for Customer Service
          'rgb(16, 185, 129)', // Green for Sales Training
          'rgb(20, 184, 166)', // Teal for Product Knowledge
          'rgb(249, 115, 22)'  // Orange for Compliance
        ],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  // Recent training sessions
  const recentSessions = [
    {
      id: '1',
      user: 'Sarah Johnson',
      store: 'Store #001',
      scenario: 'Customer Complaint',
      time: '2 hours ago',
      score: 92
    },
    {
      id: '2',
      user: 'Mike Chen',
      store: 'Store #003',
      scenario: 'Product Demo',
      time: '3 hours ago',
      score: 85
    },
    {
      id: '3',
      user: 'Emily Rodriguez',
      store: 'Store #012',
      scenario: 'Sales Negotiation',
      time: '5 hours ago',
      score: 78
    },
    {
      id: '4',
      user: 'David Wilson',
      store: 'Store #007',
      scenario: 'Customer Onboarding',
      time: '6 hours ago',
      score: 90
    }
  ];

  // System status
  const systemStatus = [
    { name: 'AI Training Engine', status: 'Operational', statusClass: 'bg-green-500' },
    { name: 'Analytics Pipeline', status: 'Healthy', statusClass: 'bg-green-500' },
    { name: 'API Response', status: '45ms', statusClass: 'bg-blue-500' },
    { name: 'SOC 2 Compliance', status: 'Certified', statusClass: 'bg-blue-500' }
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'currentColor',
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#111827',
        bodyColor: '#111827',
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        bodyFont: {
          size: 13
        },
        titleFont: {
          size: 14,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
        },
        ticks: {
          color: 'currentColor',
          font: {
            size: 11
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'currentColor',
          font: {
            size: 11
          }
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      }
    },
    cutout: '40%',
  };

  const filteredSessions = recentSessions.filter(session => {
    const matchesSearch = searchTerm === '' || 
      session.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.scenario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.store.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilter = filterType === 'all' || 
      (filterType === 'high' && session.score >= 90) ||
      (filterType === 'medium' && session.score >= 70 && session.score < 90) ||
      (filterType === 'low' && session.score < 70);
      
    return matchesSearch && matchesFilter;
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Mobile App Header with darker blue */}
        <div className="md:hidden border-b border-blue-700 px-6 py-4 fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: 'rgb(32, 59, 118)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-white text-xl font-semibold">RetailIQ</span>
            </div>
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">Dashboard</h1>
            <button 
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-1 rounded-full hover:bg-blue-800 transition-colors duration-200"
            >
              <Search className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Mobile content padding adjustment */}
        <div className="md:hidden h-full py-6 md:py-8 px-4 sm:px-6 lg:px-6 overflow-y-auto pb-8 md:pb-16 pt-20">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 md:mb-8 flex-shrink-0">
            <div className="flex items-center">
              <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-white">
                AI-Powered Sales Training Analytics
              </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2 ml-2 md:ml-6 flex-shrink-0">
              {/* Top row: Refresh and Settings buttons */}
              <div className="flex space-x-2 md:space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-3 py-2 h-8 md:px-4 md:py-2.5 md:h-10"
                  onClick={loadAnalyticsData}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 sm:mr-2" />
                      <span className="hidden sm:inline">Refresh</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs px-3 py-2 h-8 md:px-4 md:py-2.5 md:h-10 bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="h-3 w-3 sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </div>
              
              {/* Bottom row: Admin/User View Toggle */}
              <div className="flex rounded-md shadow-sm overflow-hidden border border-gray-200 dark:border-gray-600">
                <Button
                  variant={viewMode === 'admin' ? 'primary' : 'outline'}
                  size="sm"
                  className={`rounded-l-md rounded-r-none text-xs px-3 py-2 h-8 md:h-10 border-0 ${viewMode === 'admin' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                  onClick={() => setViewMode('admin')}
                >
                  <Users className="h-3 w-3 sm:hidden" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
                <Button
                  variant={viewMode === 'user' ? 'primary' : 'outline'}
                  size="sm"
                  className={`rounded-r-md rounded-l-none text-xs px-3 py-2 h-8 md:h-10 border-0 ${viewMode === 'user' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                  onClick={() => setViewMode('user')}
                >
                  <Users2 className="h-3 w-3 sm:hidden" />
                  <span className="hidden sm:inline">User</span>
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/50 text-error-700 dark:text-white rounded-lg border border-error-200 dark:border-error-800">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Stats Grid - First Row */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 mb-4 md:mb-8 sm:grid-cols-2 lg:grid-cols-3 flex-shrink-0">
            {/* Total Users */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 sm:p-5 md:p-6 min-w-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-white">Total Users</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalUsers}</p>
                    <p className="text-xs text-green-500 dark:text-green-400 flex items-center mt-0.5 sm:mt-1 truncate">
                      <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">+12% from last month</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Stores */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 sm:p-5 md:p-6 min-w-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Building className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-white">Active Stores</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalStores}</p>
                    <p className="text-xs text-green-500 dark:text-green-400 flex items-center mt-0.5 sm:mt-1 truncate">
                      <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">+{stats.newStores} new stores</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avg Roleplays */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 sm:p-5 md:p-6 min-w-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-white">Avg Roleplays</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.avgRoleplays}</p>
                    <p className="text-xs text-red-500 dark:text-red-400 flex items-center mt-0.5 sm:mt-1 truncate">
                      <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0 transform rotate-180" />
                      <span className="truncate">{stats.roleplaysChange} from last week</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Grid - Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 md:mb-8 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center"
            >
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full">
                <CardContent className="p-4 sm:p-5 md:p-6 min-w-0">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-1.5 sm:p-2 md:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-xs font-medium text-gray-500 dark:text-white">
                      Completion Rate
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">{stats.completionRate}%</div>
                  <div className="text-sm text-green-500 dark:text-green-400 flex items-center">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    +{stats.completionRateChange}% improvement
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="lg:col-span-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 dark:text-white">Performance Trend</h3>
                    <Button variant="ghost" size="sm" className="p-1">
                      <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    </Button>
                  </div>
                  <div className="h-40 sm:h-48 md:h-64">
                    <Line data={performanceTrendData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Training Scenarios */}
          <Card className="mb-4 md:mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white">Training Scenarios</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-white">Distribution of training scenarios by category</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 h-40 sm:h-48 md:h-64 flex items-center justify-center">
                  <div className="w-full h-full max-w-xs mx-auto relative">
                    <Pie data={scenariosData} options={pieOptions} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 flex items-center justify-center mt-4 md:mt-0">
                  <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                    {scenariosData.labels?.map((label, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: scenariosData.datasets[0].backgroundColor[index] as string }}></div>
                        <div className="flex-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{scenariosData.datasets[0].data[index]}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Stores */}
          <Card className="mb-4 md:mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white">Top Performing Stores</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-white">Stores with highest training completion rates</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="h-40 sm:h-48 md:h-64">
                <Bar data={topStoresData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 md:mb-8 flex-shrink-0">
            {/* Add Store Card */}
            {((userRole === 'admin' || userRole === 'super-admin') && viewMode === 'admin') && (
              <Card 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 h-32 sm:h-36 md:h-40"
                onClick={() => navigate('/users')}
              >
                <CardContent className="p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center h-full min-w-0">
                  <div className="p-3 sm:p-4 rounded-full bg-green-100 dark:bg-green-900/50 mb-4 shadow-sm">
                    <Building className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white text-center mb-1">Add Store</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">Create a new store location</p>
                </CardContent>
              </Card>
            )}

            {/* AI Scenarios Card */}
            <Card 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 h-32 sm:h-36 md:h-40"
              onClick={() => navigate('/role-plays')}
            >
              <CardContent className="p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center h-full min-w-0">
                <div className="p-3 sm:p-4 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4 shadow-sm">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white text-center mb-1">AI Scenarios</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">Practice with AI role-plays</p>
              </CardContent>
            </Card>

            {/* Analytics Card */}
            <Card 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 h-32 sm:h-36 md:h-40"
              onClick={() => navigate('/role-play-analytics')}
            >
              <CardContent className="p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center h-full min-w-0">
                <div className="p-3 sm:p-4 rounded-full bg-purple-100 dark:bg-purple-900/50 mb-4 shadow-sm">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white text-center mb-1">Role-Play Analytics</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">View performance insights</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Training Sessions */}
          <Card className="mb-4 md:mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white truncate">Recent Training Sessions</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-white">Latest completed training sessions</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder="Search by user, scenario or store..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="h-5 w-5" />}
                    fullWidth
                  />
                </div>
                <div className="w-full sm:w-auto sm:min-w-[100px] flex-shrink-0">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  >
                    <option value="all">All Scores</option>
                    <option value="high">High (90+)</option>
                    <option value="medium">Medium (70-89)</option>
                    <option value="low">Low (Below 70)</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider hidden md:table-cell">
                        Store
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                        Scenario
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider hidden sm:table-cell">
                        Time
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSessions.map((session) => (
                      <tr
                        key={session.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{session.user}</div>
                          {/* Show store on mobile under user name */}
                          <div className="text-xs text-gray-500 dark:text-white md:hidden truncate">{session.store}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-gray-500 dark:text-white truncate">{session.store}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 dark:text-white truncate">{session.scenario}</div>
                          {/* Show time on mobile under scenario */}
                          <div className="text-xs text-gray-500 dark:text-white flex items-center sm:hidden">
                            <Clock className="h-2.5 w-2.5 mr-1" />
                            <span className="truncate">{session.time}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-sm text-gray-500 dark:text-white flex items-center">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="truncate">{session.time}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getScoreBgColor(session.score)}`}>
                            {session.score}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          {(userRole === 'admin' || userRole === 'super-admin') && viewMode === 'admin' && (
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4 md:mb-8">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white truncate">System Status</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-white">Current system performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {systemStatus.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${item.statusClass}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Desktop content - wrap existing content */}
        <div className="hidden md:block h-full py-6 md:py-8 px-4 sm:px-6 lg:px-6 overflow-y-auto pb-8 md:pb-16">
          {/* Header */}
          <div className="flex justify-between items-start mb-4 md:mb-8 flex-shrink-0">
            <div className="flex items-center">
              <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-white">
                AI-Powered Sales Training Analytics
              </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2 ml-2 md:ml-6 flex-shrink-0">
              {/* Top row: Refresh and Settings buttons */}
              <div className="flex space-x-2 md:space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs px-3 py-2 h-8 md:px-4 md:py-2.5 md:h-10"
                  onClick={loadAnalyticsData}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 sm:mr-2" />
                      <span className="hidden sm:inline">Refresh</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs px-3 py-2 h-8 md:px-4 md:py-2.5 md:h-10 bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate('/settings')}
                >
                  <Settings className="h-3 w-3 sm:mr-2" />
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </div>
              
              {/* Bottom row: Admin/User View Toggle */}
              <div className="flex rounded-md shadow-sm overflow-hidden border border-gray-200 dark:border-gray-600">
                <Button
                  variant={viewMode === 'admin' ? 'primary' : 'outline'}
                  size="sm"
                  className={`rounded-l-md rounded-r-none text-xs px-3 py-2 h-8 md:h-10 border-0 ${viewMode === 'admin' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                  onClick={() => setViewMode('admin')}
                >
                  <Users className="h-3 w-3 sm:hidden" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
                <Button
                  variant={viewMode === 'user' ? 'primary' : 'outline'}
                  size="sm"
                  className={`rounded-r-md rounded-l-none text-xs px-3 py-2 h-8 md:h-10 border-0 ${viewMode === 'user' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                  onClick={() => setViewMode('user')}
                >
                  <Users2 className="h-3 w-3 sm:hidden" />
                  <span className="hidden sm:inline">User</span>
                </Button>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-error-50 dark:bg-error-900/50 text-error-700 dark:text-white rounded-lg border border-error-200 dark:border-error-800">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Stats Grid - First Row */}
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:gap-6 mb-4 md:mb-8 sm:grid-cols-2 lg:grid-cols-3 flex-shrink-0">
            {/* Total Users */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 sm:p-5 md:p-6 min-w-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-white">Total Users</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalUsers}</p>
                    <p className="text-xs text-green-500 dark:text-green-400 flex items-center mt-0.5 sm:mt-1 truncate">
                      <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">+12% from last month</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Stores */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 sm:p-5 md:p-6 min-w-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Building className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-white">Active Stores</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalStores}</p>
                    <p className="text-xs text-green-500 dark:text-green-400 flex items-center mt-0.5 sm:mt-1 truncate">
                      <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">+{stats.newStores} new stores</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Avg Roleplays */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <CardContent className="p-4 sm:p-5 md:p-6 min-w-0">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Activity className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-white">Avg Roleplays</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.avgRoleplays}</p>
                    <p className="text-xs text-red-500 dark:text-red-400 flex items-center mt-0.5 sm:mt-1 truncate">
                      <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0 transform rotate-180" />
                      <span className="truncate">{stats.roleplaysChange} from last week</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Grid - Second Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 md:mb-8 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center"
            >
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-full">
                <CardContent className="p-4 sm:p-5 md:p-6 min-w-0">
                  <div className="flex items-center justify-between mb-6">
                    <div className="p-1.5 sm:p-2 md:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-xs font-medium text-gray-500 dark:text-white">
                      Completion Rate
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">{stats.completionRate}%</div>
                  <div className="text-sm text-green-500 dark:text-green-400 flex items-center">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    +{stats.completionRateChange}% improvement
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="lg:col-span-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <CardContent className="p-4 sm:p-5 md:p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 dark:text-white">Performance Trend</h3>
                    <Button variant="ghost" size="sm" className="p-1">
                      <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500" />
                    </Button>
                  </div>
                  <div className="h-40 sm:h-48 md:h-64">
                    <Line data={performanceTrendData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Training Scenarios */}
          <Card className="mb-4 md:mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white">Training Scenarios</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-white">Distribution of training scenarios by category</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 h-40 sm:h-48 md:h-64 flex items-center justify-center">
                  <div className="w-full h-full max-w-xs mx-auto relative">
                    <Pie data={scenariosData} options={pieOptions} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 flex items-center justify-center mt-4 md:mt-0">
                  <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                    {scenariosData.labels?.map((label, index) => (
                      <div key={index} className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: scenariosData.datasets[0].backgroundColor[index] as string }}></div>
                        <div className="flex-1">
                          <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                        </div>
                        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{scenariosData.datasets[0].data[index]}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Performing Stores */}
          <Card className="mb-4 md:mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white">Top Performing Stores</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-white">Stores with highest training completion rates</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="h-40 sm:h-48 md:h-64">
                <Bar data={topStoresData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>

          {/* Quick Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 md:mb-8 flex-shrink-0">
            {/* Add Store Card */}
            {((userRole === 'admin' || userRole === 'super-admin') && viewMode === 'admin') && (
              <Card 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 h-32 sm:h-36 md:h-40"
                onClick={() => navigate('/users')}
              >
                <CardContent className="p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center h-full min-w-0">
                  <div className="p-3 sm:p-4 rounded-full bg-green-100 dark:bg-green-900/50 mb-4 shadow-sm">
                    <Building className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white text-center mb-1">Add Store</h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">Create a new store location</p>
                </CardContent>
              </Card>
            )}

            {/* AI Scenarios Card */}
            <Card 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 h-32 sm:h-36 md:h-40"
              onClick={() => navigate('/role-plays')}
            >
              <CardContent className="p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center h-full min-w-0">
                <div className="p-3 sm:p-4 rounded-full bg-blue-100 dark:bg-blue-900/50 mb-4 shadow-sm">
                  <Target className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white text-center mb-1">AI Scenarios</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">Practice with AI role-plays</p>
              </CardContent>
            </Card>

            {/* Analytics Card */}
            <Card 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300 h-32 sm:h-36 md:h-40"
              onClick={() => navigate('/role-play-analytics')}
            >
              <CardContent className="p-4 sm:p-5 md:p-6 flex flex-col items-center justify-center h-full min-w-0">
                <div className="p-3 sm:p-4 rounded-full bg-purple-100 dark:bg-purple-900/50 mb-4 shadow-sm">
                  <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-white text-center mb-1">Role-Play Analytics</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">View performance insights</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Training Sessions */}
          <Card className="mb-4 md:mb-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0">
            <CardHeader>
              <CardTitle className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white truncate">Recent Training Sessions</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-white">Latest completed training sessions</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder="Search by user, scenario or store..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="h-5 w-5" />}
                    fullWidth
                  />
                </div>
                <div className="w-full sm:w-auto sm:min-w-[100px] flex-shrink-0">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 pr-10 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  >
                    <option value="all">All Scores</option>
                    <option value="high">High (90+)</option>
                    <option value="medium">Medium (70-89)</option>
                    <option value="low">Low (Below 70)</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
                <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider hidden md:table-cell">
                        Store
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                        Scenario
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider hidden sm:table-cell">
                        Time
                      </th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-white uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredSessions.map((session) => (
                      <tr
                        key={session.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{session.user}</div>
                          {/* Show store on mobile under user name */}
                          <div className="text-xs text-gray-500 dark:text-white md:hidden truncate">{session.store}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-gray-500 dark:text-white truncate">{session.store}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900 dark:text-white truncate">{session.scenario}</div>
                          {/* Show time on mobile under scenario */}
                          <div className="text-xs text-gray-500 dark:text-white flex items-center sm:hidden">
                            <Clock className="h-2.5 w-2.5 mr-1" />
                            <span className="truncate">{session.time}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                          <div className="text-sm text-gray-500 dark:text-white flex items-center">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span className="truncate">{session.time}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getScoreBgColor(session.score)}`}>
                            {session.score}%
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          {(userRole === 'admin' || userRole === 'super-admin') && viewMode === 'admin' && (
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4 md:mb-8">
              <CardHeader>
                <CardTitle className="text-sm sm:text-base md:text-lg text-gray-900 dark:text-white truncate">System Status</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-500 dark:text-white">Current system performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="overflow-x-auto -mx-3 sm:-mx-4 md:mx-0">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {systemStatus.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${item.statusClass}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Mobile Search Modal */}
        <Modal
          isOpen={isMobileSearchOpen}
          onClose={() => setIsMobileSearchOpen(false)}
          title="Search & Filter"
        >
          <div className="space-y-6 p-6">
            <div className="space-y-4">
              <div className="w-full">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search analytics data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Filter by Type
                  </label>
                  <div className="relative">
                    <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="pl-10 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="all">All Types</option>
                      <option value="high">High Performance</option>
                      <option value="medium">Medium Performance</option>
                      <option value="low">Low Performance</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                }}
              >
                Clear
              </Button>
              <Button
                onClick={() => setIsMobileSearchOpen(false)}
                className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};