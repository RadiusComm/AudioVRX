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
    const { action, userId, accountId } = await req.json();
    
    if (!action || !userId) {
      throw new Error("Action and userId are required");
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (!userProfile) {
      throw new Error("User not found");
    }

    let result;
    
    // Perform the requested action
    switch (action) {
      case 'grantAccess':
        if (!accountId) {
          throw new Error("accountId is required for grantAccess action");
        }
        
        // Check if assignment already exists
        const { data: existingAssignment } = await supabase
          .from('user_store_assignments')
          .select('*')
          .eq('user_id', userId)
          .eq('store_id', accountId)
          .single();
          
        if (!existingAssignment) {
          // Create new assignment
          const { error: assignError } = await supabase
            .from('user_store_assignments')
            .insert([{
              user_id: userId,
              store_id: accountId,
              created_at: new Date().toISOString()
            }]);
            
          if (assignError) throw assignError;
        }
        
        result = { 
          success: true, 
          message: `Access granted to user ${userProfile.first_name} ${userProfile.last_name}`,
          userId,
          accountId
        };
        break;
        
      case 'revokeAccess':
        if (!accountId) {
          throw new Error("accountId is required for revokeAccess action");
        }
        
        // Delete assignment
        const { error: revokeError } = await supabase
          .from('user_store_assignments')
          .delete()
          .eq('user_id', userId)
          .eq('store_id', accountId);
          
        if (revokeError) throw revokeError;
        
        result = { 
          success: true, 
          message: `Access revoked for user ${userProfile.first_name} ${userProfile.last_name}`,
          userId,
          accountId
        };
        break;
        
      case 'revokeAllAccess':
        // Delete all assignments for user
        const { error: revokeAllError } = await supabase
          .from('user_store_assignments')
          .delete()
          .eq('user_id', userId);
          
        if (revokeAllError) throw revokeAllError;
        
        result = { 
          success: true, 
          message: `All access revoked for user ${userProfile.first_name} ${userProfile.last_name}`,
          userId
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
    console.error('Error in manage-user-access:', error);
    
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