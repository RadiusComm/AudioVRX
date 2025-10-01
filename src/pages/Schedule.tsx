import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Calendar, Search, Plus, BookOpen, Trash2, User, Edit, MessageSquare, PlayCircle, AlertCircle, Shield, Tag, Filter, ChevronLeft, ChevronRight, Mail, CheckCircle, XCircle, Clock, Menu } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Avatar } from '../components/ui/Avatar';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { AddSessionModal } from '../components/schedule/AddSessionModal';
import { EditSessionModal } from '../components/schedule/EditSessionModal';
import { DeleteSessionModal } from '../components/schedule/DeleteSessionModal';
import { SessionCard } from '../components/schedule/SessionCard';
import { ScheduleCalendar } from '../components/schedule/ScheduleCalendar';

interface Session {
  id: string;
  scenario_id: string;
  user_id: string;
  start_time: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  scenario: {
    title: string;
    description: string;
    difficulty: string;
    tags?: string[];
  };
  user: {
    first_name: string;
    last_name: string;
    avatar_url: string;
    role: string;
    account_id?: string;
  } | null;
}

interface Scenario {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  cover_image_url?: string;
  tags?: string[];
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  role: string;
  account_id?: string;
}

export const Schedule = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentUserAccountId, setCurrentUserAccountId] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [sendingEmailForSessionId, setSendingEmailForSessionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage, setSessionsPerPage] = useState(8);
  const [totalPages, setTotalPages] = useState(1);
  
  // Mobile search state
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // URL parameters for session response
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [responseType, setResponseType] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    // Check URL parameters for session response
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('id');
    const response = urlParams.get('response');

    if (sessionId && response) {
      handleSessionResponse(sessionId, response);
    }

    loadSessions();
    loadScenarios();
    loadEmployees();
    checkUserRole();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      filterSessions();
    }
  }, [sessions, searchTerm, filterRole, filterDifficulty, filterStatus, currentPage, sessionsPerPage]);

  const handleSessionResponse = async (sessionId: string, response: string) => {
    if (!['accept', 'decline'].includes(response)) {
      setResponseMessage('Invalid response type');
      setResponseType('error');
      return;
    }

    try {
      const status = response === 'accept' ? 'accepted' : 'declined';
      
      const { error: updateError } = await supabase
        .from('roleplay_sessions')
        .update({ status })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      setResponseMessage(
        response === 'accept' 
          ? 'You have successfully accepted the session.' 
          : 'You have declined the session.'
      );
      setResponseType(response === 'accept' ? 'success' : 'error');
      
      // Remove URL parameters without refreshing the page
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Reload sessions to reflect the change
      loadSessions();
    } catch (err) {
      console.error('Error updating session status:', err);
      setResponseMessage('Failed to update session status');
      setResponseType('error');
    }
  };

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, account_id')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        console.error('Error fetching user profile or profile not found:', error);
        return;
      }
      
      setIsAdmin(profile.role === 'admin');
      setIsSuperAdmin(profile.role === 'super-admin');
      setCurrentUserAccountId(profile.account_id);
    } catch (err) {
      console.error('Error checking user role:', err);
    }
  };

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('roleplay_sessions')
        .select(`
          *,
          scenario:scenario_id(title, description, difficulty, tags),
          user:user_id(first_name, last_name, avatar_url, role, account_id)
        `)
        .order('start_time', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      
      setSessions(data || []);
      setFilteredSessions(data || []);
    } catch (err: any) {
      console.error('Error loading sessions:', err);
      setError('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadScenarios = async () => {
    try {
      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScenarios(data || []);
    } catch (err: any) {
      console.error('Error loading scenarios:', err);
      setError('Failed to load scenarios');
    }
  };

  const loadEmployees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Get current user's profile to check role and account_id
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('role, account_id')
        .eq('id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, role, account_id')
        .order('first_name', { ascending: true });
        
      // Filter employees based on user role
      if (currentProfile.role === 'super-admin') {
        // Super admin can see all employees
      } else if (currentProfile.role === 'admin' && currentProfile.account_id) {
        // Admin can only see employees in the same account
        query = query.eq('account_id', currentProfile.account_id);
      } else {
        // Regular employees can only see themselves
        query = query.eq('id', user.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      setEmployees(data || []);
    } catch (err: any) {
      console.error('Error loading employees:', err);
      setError('Failed to load employees');
    }
  };

  const filterSessions = () => {
    let filtered = [...sessions];
    
    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(session => {
        const scenarioMatch = session.scenario.title.toLowerCase().includes(searchTerm.toLowerCase());
        const userMatch = session.user 
          ? `${session.user.first_name} ${session.user.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
          : false;
        return scenarioMatch || userMatch;
      });
    }
    
    // Apply role filter
    if (filterRole !== 'all') {
      filtered = filtered.filter(session => 
        session.user?.role?.toLowerCase() === filterRole.toLowerCase()
      );
    }
    
    // Apply difficulty filter
    if (filterDifficulty !== 'all') {
      filtered = filtered.filter(session => 
        session.scenario.difficulty.toLowerCase() === filterDifficulty.toLowerCase()
      );
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(session => 
        session.status === filterStatus
      );
    }
    
    setFilteredSessions(filtered);
    setTotalPages(Math.ceil(filtered.length / sessionsPerPage));
    
    // Reset to first page if current page is now invalid
    if (currentPage > Math.ceil(filtered.length / sessionsPerPage)) {
      setCurrentPage(1);
    }
  };

  const resendInvitation = async (session: Session) => {
    try {
      setIsSendingEmail(true);
      setSendingEmailForSessionId(session.id);
      
      const baseUrl = window.location.origin;
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-schedule-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: session.id,
          baseUrl
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email notification');
      }

      toast.success('Invitation email resent successfully');
    } catch (err: any) {
      console.error('Error resending invitation:', err);
      toast.error('Failed to resend invitation');
    } finally {
      setIsSendingEmail(false);
      setSendingEmailForSessionId(null);
    }
  };

  const openEditModal = (session: Session) => {
    setSelectedSession(session);
    setIsEditModalOpen(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300';
      case 'intermediate': return 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300';
      case 'advanced': return 'bg-error-100 text-error-800 dark:bg-error-900/50 dark:text-error-300';
      case 'expert': return 'bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-error-100 text-error-800 dark:bg-error-900/50 dark:text-error-300';
      case 'manager': return 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300';
      case 'supervisor': return 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300';
      case 'employee': return 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300';
      case 'trainee': return 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/50 dark:text-secondary-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Accepted
          </span>
        );
      case 'declined':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-100 text-error-800 dark:bg-error-900/50 dark:text-error-300">
            <XCircle className="h-3 w-3 mr-1" />
            Declined
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-300">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </span>
        );
    }
  };

  // Get unique roles from employees
  const uniqueRoles = ['all', ...new Set(employees.map(e => e.role.toLowerCase()))];
  
  // Get unique difficulties from scenarios
  const uniqueDifficulties = ['all', ...new Set(scenarios.map(s => s.difficulty.toLowerCase()))];

  // Get paginated sessions
  const indexOfLastSession = currentPage * sessionsPerPage;
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage;
  const currentSessions = filteredSessions.slice(indexOfFirstSession, indexOfLastSession);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  // Calendar helper functions
  const nextMonth = () => {
    setCurrentMonth(prev => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };
  
  const prevMonth = () => {
    setCurrentMonth(prev => {
      const prev_month = new Date(prev);
      prev_month.setMonth(prev_month.getMonth() - 1);
      return prev_month;
    });
  };

  // Get sessions for selected date
  const getSessionsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return filteredSessions.filter(session => {
      const sessionDate = format(new Date(session.start_time), 'yyyy-MM-dd');
      return sessionDate === dateKey;
    });
  };

  // Get sessions for current month
  const getSessionsForMonth = () => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    return filteredSessions.filter(session => {
      const sessionDate = new Date(session.start_time);
      return sessionDate >= monthStart && sessionDate <= monthEnd;
    });
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthSessions = getSessionsForMonth();
  const selectedDateSessions = getSessionsForDate(selectedDate);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        {/* Mobile App Header */}
        <div className="md:hidden border-b border-blue-700 px-6 py-4 fixed top-0 left-0 right-0 z-50" style={{ backgroundColor: 'rgb(32, 59, 118)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-white text-xl font-semibold">RetailIQ</span>
            </div>
            <h1 className="absolute left-1/2 transform -translate-x-1/2 text-white text-xl font-semibold">Schedule</h1>
            <button 
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-1 rounded-full hover:bg-blue-800 transition-colors duration-200"
            >
              <Search className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>

        {/* Mobile Sticky Heading - Remove since title is now in header */}
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 fixed top-16 left-0 right-0 z-40" style={{ display: 'none' }}>
          <div className="flex items-center justify-start" style={{ display: 'none' }}>
            <img 
              src="/logo.svg" 
              alt="RetailIQ" 
              className="h-8 w-auto"
              style={{
                objectFit: 'contain',
                maxWidth: '140px'
              }}
            />
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block h-full py-6 md:py-8 px-6 sm:px-8 lg:px-10 overflow-y-auto pb-8 md:pb-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
            <div className="flex items-center">
              <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
                  Schedule
                </h1>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Manage your scheduled role-play sessions
                </p>
              </div>
            </div>
            <div className="mt-4 md:mt-0 flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="flex rounded-md shadow-sm">
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('list')}
                  className="rounded-l-md rounded-r-none flex-1 sm:flex-none"
                >
                  <BookOpen className="h-4 w-4" />
                  <span className="ml-2 sm:hidden">List</span>
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('calendar')}
                  className="rounded-r-md rounded-l-none flex-1 sm:flex-none"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="ml-2 sm:hidden">Calendar</span>
                </Button>
              </div>
              {(isAdmin || isSuperAdmin) && (
                <Button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 w-full sm:w-auto"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  <span className="sm:inline">Schedule Session</span>
                </Button>
              )}
            </div>
          </div>

          {responseMessage && (
            <div className={`mb-6 p-4 rounded-lg ${
              responseType === 'success' 
                ? 'bg-success-50 dark:bg-success-900/50 text-success-700 dark:text-success-200 border border-success-200 dark:border-success-800' 
                : 'bg-error-50 dark:bg-error-900/50 text-error-700 dark:text-error-200 border border-error-200 dark:border-error-800'
            }`}>
              <div className="flex items-center">
                {responseType === 'success' ? (
                  <CheckCircle className="h-5 w-5 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 mr-2" />
                )}
                <p>{responseMessage}</p>
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <Card className="mb-6 md:mb-8 backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="w-full">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Search Sessions
                    </label>
                    <div className="relative">
                      <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search by name or title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Filter by Role
                      </label>
                      <div className="relative">
                        <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <select
                          value={filterRole}
                          onChange={(e) => setFilterRole(e.target.value)}
                          className="pl-10 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          {uniqueRoles.map(role => (
                            <option key={role} value={role}>
                              {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Filter by Difficulty
                      </label>
                      <div className="relative">
                        <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <select
                          value={filterDifficulty}
                          onChange={(e) => setFilterDifficulty(e.target.value)}
                          className="pl-10 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          {uniqueDifficulties.map(difficulty => (
                            <option key={difficulty} value={difficulty}>
                              {difficulty === 'all' ? 'All Difficulties' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Filter by Status
                      </label>
                      <div className="relative">
                        <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="pl-10 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          <option value="all">All Statuses</option>
                          <option value="pending">Pending</option>
                          <option value="accepted">Accepted</option>
                          <option value="declined">Declined</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center p-4 text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/50 rounded-lg">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
                  No scheduled sessions found
                </p>
                {(isAdmin || isSuperAdmin) && (
                  <Button
                    variant="outline"
                    onClick={() => setIsAssignModalOpen(true)}
                    leftIcon={<Plus className="h-4 w-4" />}
                    className="bg-white dark:bg-gray-800 shadow-md hover:shadow-lg"
                  >
                    Schedule a Session
                  </Button>
                )}
              </div>
            ) : viewMode === 'calendar' ? (
              <ScheduleCalendar 
                sessions={filteredSessions}
                onSelectSession={(session) => {
                  setSelectedSession(session);
                  openEditModal(session);
                }}
                getStatusBadge={getStatusBadge}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {currentSessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onEdit={openEditModal}
                      onDelete={(session) => {
                        setSelectedSession(session);
                        setIsDeleteModalOpen(true);
                      }}
                      onResendInvite={resendInvitation}
                      getStatusBadge={getStatusBadge}
                      getDifficultyColor={getDifficultyColor}
                      getRoleColor={getRoleColor}
                      isSendingEmail={isSendingEmail}
                      sendingEmailForSessionId={sendingEmailForSessionId}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {filteredSessions.length > sessionsPerPage && (
                  <div className="mt-6 md:mt-8 flex items-center justify-center">
                    <div className="flex items-center space-x-1 sm:space-x-2 bg-white dark:bg-gray-800 px-3 sm:px-4 py-2 rounded-lg shadow-md">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        className="p-1 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center"
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                      
                      <div className="hidden sm:flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                              variant={currentPage === pageNum ? "primary" : "ghost"}
                              size="sm"
                              onClick={() => paginate(pageNum)}
                              className={`h-8 w-8 ${currentPage === pageNum ? 'bg-primary-500 text-white' : ''}`}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      {/* Mobile page indicator */}
                      <div className="sm:hidden flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {currentPage} / {totalPages}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        className="p-1 h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center"
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Sessions per page selector */}
                <div className="mt-4 flex items-center justify-center px-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>Show</span>
                    <select
                      value={sessionsPerPage}
                      onChange={(e) => {
                        setSessionsPerPage(Number(e.target.value));
                        setCurrentPage(1); // Reset to first page when changing items per page
                      }}
                      className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-1 px-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                    >
                      <option value={4}>4</option>
                      <option value={8}>8</option>
                      <option value={12}>12</option>
                      <option value={16}>16</option>
                    </select>
                    <span>per page</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Calendar View */}
        <div className="md:hidden bg-white dark:bg-gray-900 min-h-screen pt-20">
          {responseMessage && (
            <div className={`mx-4 mt-4 p-3 rounded-lg ${
              responseType === 'success' 
                ? 'bg-success-50 dark:bg-success-900/50 text-success-700 dark:text-success-200 border border-success-200 dark:border-success-800' 
                : 'bg-error-50 dark:bg-error-900/50 text-error-700 dark:text-error-200 border border-error-200 dark:border-error-800'
            }`}>
              <div className="flex items-center">
                {responseType === 'success' ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                <p className="text-sm">{responseMessage}</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-4 mx-4 mt-4 text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/50 rounded-lg">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : (
            <>
              {/* Mobile Calendar */}
              <div className="px-4 py-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-3">
                  <Button
                    variant="ghost"
                    onClick={prevMonth}
                    className="p-1 rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </Button>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={nextMonth}
                    className="p-1 rounded-full"
                  >
                    <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </Button>
                </div>

                {/* Calendar Days Header */}
                <div className="grid grid-cols-7 mb-1">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                    <div key={index} className="text-center py-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-0.5 mb-4">
                  {calendarDays.map((day, index) => {
                    const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                    const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    const dayHasSessions = getSessionsForDate(day).length > 0;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          h-8 w-full flex items-center justify-center text-sm font-medium rounded-md transition-all duration-200
                          ${!isCurrentMonth 
                            ? 'text-gray-300 dark:text-gray-600' 
                            : isSelected
                              ? 'bg-primary-500 text-white'
                              : isToday
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                : dayHasSessions
                                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }
                          ${dayHasSessions && !isSelected ? 'relative' : ''}
                        `}
                      >
                        <span className="text-xs">{format(day, 'd')}</span>
                        {dayHasSessions && !isSelected && (
                          <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Schedule New Session Button */}
                {(isAdmin || isSuperAdmin) && (
                  <Button
                    onClick={() => setIsAssignModalOpen(true)}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-xl font-semibold text-base shadow-lg mb-4"
                    leftIcon={<Plus className="h-5 w-5" />}
                  >
                    Schedule New Session
                  </Button>
                )}

                {/* Upcoming Sessions */}
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                    {selectedDateSessions.length > 0 
                      ? `Sessions on ${format(selectedDate, 'MMMM d')}`
                      : 'Upcoming'
                    }
                  </h3>
                  
                  {selectedDateSessions.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateSessions.map((session) => {
                        const userName = session.user 
                          ? `${session.user.first_name} ${session.user.last_name}` 
                          : 'Unknown User';
                        
                        return (
                          <div 
                            key={session.id}
                            className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700"
                            onClick={() => {
                              setSelectedSession(session);
                              openEditModal(session);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div className="text-primary-600 dark:text-primary-400 font-bold text-base">
                                  {format(new Date(session.start_time), 'd')}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                    {userName}
                                  </h4>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {format(new Date(session.start_time), 'h:mm a')} - {format(new Date(new Date(session.start_time).getTime() + 60 * 60 * 1000), 'h:mm a')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-0.5">
                                {getStatusBadge(session.status)}
                                <span className="text-xs text-gray-500 dark:text-gray-400 text-right">
                                  {session.scenario.title.length > 15 
                                    ? `${session.scenario.title.substring(0, 15)}...` 
                                    : session.scenario.title}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 text-sm">
                        No sessions scheduled for {format(selectedDate, 'MMMM d')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <AddSessionModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={loadSessions}
          employees={employees}
          scenarios={scenarios}
          getRoleColor={getRoleColor}
          getDifficultyColor={getDifficultyColor}
        />

        <EditSessionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedSession(null);
          }}
          onSuccess={loadSessions}
          selectedSession={selectedSession}
          scenarios={scenarios}
          getRoleColor={getRoleColor}
          getDifficultyColor={getDifficultyColor}
        />

        <DeleteSessionModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedSession(null);
          }}
          onSuccess={loadSessions}
          selectedSession={selectedSession}
        />

        {/* Mobile Search Modal */}
        <Modal
          isOpen={isMobileSearchOpen}
          onClose={() => setIsMobileSearchOpen(false)}
          title="Search Sessions"
        >
          <div className="space-y-6 p-6">
            <div className="space-y-4">
              <div className="w-full">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Search Sessions
                </label>
                <div className="relative">
                  <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name or title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Filter by Role
                  </label>
                  <div className="relative">
                    <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="pl-10 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      {uniqueRoles.map(role => (
                        <option key={role} value={role}>
                          {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Filter by Difficulty
                  </label>
                  <div className="relative">
                    <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <select
                      value={filterDifficulty}
                      onChange={(e) => setFilterDifficulty(e.target.value)}
                      className="pl-10 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      {uniqueDifficulties.map(difficulty => (
                        <option key={difficulty} value={difficulty}>
                          {difficulty === 'all' ? 'All Difficulties' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Filter by Status
                  </label>
                  <div className="relative">
                    <Filter className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="pl-10 block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="declined">Declined</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
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
                  setFilterRole('all');
                  setFilterDifficulty('all');
                  setFilterStatus('all');
                }}
              >
                Clear Filters
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