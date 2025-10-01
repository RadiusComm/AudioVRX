import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

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
    const { data: { user: adminUser }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !adminUser) {
      throw new Error('Invalid user token');
    }

    // Check if user is admin
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single();

    if (adminProfileError) throw adminProfileError;
    if (adminProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { action, userId, email } = await req.json();
    
    if (!action || (!userId && !email)) {
      throw new Error("Action and either userId or email are required");
    }

    // Get user by ID or email
    let targetUser;
    if (userId) {
      const { data: userData, error: userDataError } = await supabase.auth.admin.getUserById(userId);
      if (userDataError) throw userDataError;
      targetUser = userData.user;
    } else if (email) {
      // Find user by email
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
      if (usersError) throw usersError;
      
      targetUser = users.users.find(u => u.email === email);
      if (!targetUser) {
        throw new Error(`User with email ${email} not found`);
      }
    }

    if (!targetUser) {
      throw new Error("User not found");
    }

    let result;
    
    // Perform the requested action
    switch (action) {
      case 'suspend':
        // Update profile to set is_banned flag
        const { error: suspendError } = await supabase
          .from('profiles')
          .update({ 
            is_banned: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetUser.id);
          
        if (suspendError) throw suspendError;
        
        result = { 
          success: true, 
          message: `User ${targetUser.email} has been suspended`,
          userId: targetUser.id
        };
        break;
        
      case 'reactivate':
        // Update profile to remove is_banned flag
        const { error: reactivateError } = await supabase
          .from('profiles')
          .update({ 
            is_banned: false,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', targetUser.id);
          
        if (reactivateError) throw reactivateError;
        
        result = { 
          success: true, 
          message: `User ${targetUser.email} has been reactivated`,
          userId: targetUser.id
        };
        break;
        
      case 'resetPassword':
        // Generate a password reset link
        const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
          type: 'recovery',
          email: targetUser.email!,
          options: {
            redirectTo: `${req.headers.get('origin')}/reset-password`
          }
        });

        if (resetError) throw resetError;
        
        result = { 
          success: true, 
          message: `Password reset email sent to ${targetUser.email}`,
          userId: targetUser.id
        };
        break;
        
      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    );
  } catch (error) {
    console.error('Error in admin-user-management:', error);
    
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