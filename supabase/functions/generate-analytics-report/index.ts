import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { format, subDays, startOfMonth, endOfMonth, eachMonthOfInterval } from 'https://esm.sh/date-fns@2.30.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface AnalyticsParams {
  timeRange: '7d' | '30d' | '90d' | '1y';
  includeUsers?: boolean;
  includeSubscriptions?: boolean;
  includePayments?: boolean;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user's JWT from the request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { timeRange = '30d', includeUsers = true, includeSubscriptions = true, includePayments = true }: AnalyticsParams = await req.json();
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7d':
        startDate = subDays(now, 7);
        break;
      case '30d':
        startDate = subDays(now, 30);
        break;
      case '90d':
        startDate = subDays(now, 90);
        break;
      case '1y':
        startDate = subDays(now, 365);
        break;
      default:
        startDate = subDays(now, 30);
    }
    
    // Format dates for queries
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    
    // Initialize report data
    const report: any = {
      generated_at: now.toISOString(),
      time_range: timeRange,
      metrics: {}
    };
    
    // Get user data if requested
    if (includeUsers) {
      // Get all users
      const { data: allUsers, error: allUsersError } = await supabase
        .from('profiles')
        .select('*');
        
      if (allUsersError) throw allUsersError;
      
      // Get new users in time range
      const { data: newUsers, error: newUsersError } = await supabase
        .from('profiles')
        .select('*')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);
        
      if (newUsersError) throw newUsersError;
      
      // Get active users
      const { data: activeUsers, error: activeUsersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'active')
        .eq('is_banned', false);
        
      if (activeUsersError) throw activeUsersError;
      
      // Calculate user metrics
      const usersByRole = (allUsers || []).reduce((acc: Record<string, number>, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {});
      
      // Get user growth by month
      const months = eachMonthOfInterval({
        start: startDate,
        end: now
      });
      
      const userGrowthByMonth: Record<string, number> = {};
      
      for (const month of months) {
        const monthStart = startOfMonth(month).toISOString();
        const monthEnd = endOfMonth(month).toISOString();
        
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);
          
        if (countError) throw countError;
        
        userGrowthByMonth[format(month, 'MMM yyyy')] = count || 0;
      }
      
      report.metrics.users = {
        total: allUsers?.length || 0,
        new_in_period: newUsers?.length || 0,
        active: activeUsers?.length || 0,
        by_role: usersByRole,
        growth_by_month: userGrowthByMonth
      };
    }
    
    // Get subscription data if requested
    if (includeSubscriptions) {
      // Get all subscriptions
      const { data: allSubscriptions, error: allSubsError } = await supabase
        .from('user_subscriptions')
        .select('*');
        
      if (allSubsError) throw allSubsError;
      
      // Get new subscriptions in time range
      const { data: newSubscriptions, error: newSubsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);
        
      if (newSubsError) throw newSubsError;
      
      // Get active subscriptions
      const { data: activeSubscriptions, error: activeSubsError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('status', 'active');
        
      if (activeSubsError) throw activeSubsError;
      
      // Calculate subscription metrics
      const subscriptionsByTier = (allSubscriptions || []).reduce((acc: Record<string, number>, sub) => {
        acc[sub.subscription_tier] = (acc[sub.subscription_tier] || 0) + 1;
        return acc;
      }, {});
      
      const subscriptionsByStatus = (allSubscriptions || []).reduce((acc: Record<string, number>, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {});
      
      report.metrics.subscriptions = {
        total: allSubscriptions?.length || 0,
        new_in_period: newSubscriptions?.length || 0,
        active: activeSubscriptions?.length || 0,
        by_tier: subscriptionsByTier,
        by_status: subscriptionsByStatus
      };
    }
    
    // Get payment data if requested
    if (includePayments) {
      // Get all payments
      const { data: allPayments, error: allPaymentsError } = await supabase
        .from('payments')
        .select('*');
        
      if (allPaymentsError) throw allPaymentsError;
      
      // Get payments in time range
      const { data: periodPayments, error: periodPaymentsError } = await supabase
        .from('payments')
        .select('*')
        .gte('created_at', startDateStr)
        .lte('created_at', endDateStr);
        
      if (periodPaymentsError) throw periodPaymentsError;
      
      // Calculate payment metrics
      const totalRevenue = (allPayments || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);
      const periodRevenue = (periodPayments || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);
      
      // Get revenue by month
      const months = eachMonthOfInterval({
        start: startDate,
        end: now
      });
      
      const revenueByMonth: Record<string, number> = {};
      
      for (const month of months) {
        const monthStart = startOfMonth(month).toISOString();
        const monthEnd = endOfMonth(month).toISOString();
        
        const { data: monthPayments, error: monthPaymentsError } = await supabase
          .from('payments')
          .select('amount')
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);
          
        if (monthPaymentsError) throw monthPaymentsError;
        
        const monthRevenue = (monthPayments || []).reduce((sum, payment) => sum + (payment.amount || 0), 0);
        revenueByMonth[format(month, 'MMM yyyy')] = monthRevenue;
      }
      
      report.metrics.payments = {
        total_count: allPayments?.length || 0,
        period_count: periodPayments?.length || 0,
        total_revenue: totalRevenue,
        period_revenue: periodRevenue,
        revenue_by_month: revenueByMonth
      };
    }
    
    return new Response(
      JSON.stringify(report),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    );
  } catch (error) {
    console.error('Error in generate-analytics-report:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.toString() : undefined
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});