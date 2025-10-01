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

    // Parse request body
    const { token, userId } = await req.json();
    
    if (!token || !userId) {
      throw new Error("Token and userId are required");
    }

    // Verify the token exists and is valid
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_activation_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      throw new Error("Invalid or expired activation token");
    }

    // Check if token has expired
    const expiresAt = new Date(tokenData.expires_at);
    if (expiresAt < new Date()) {
      // Delete expired token
      await supabase
        .from('user_activation_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('token', token);
      
      throw new Error("Activation token has expired");
    }

    // Update user status to active
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to activate user: ${updateError.message}`);
    }

    // Delete the used token
    await supabase
      .from('user_activation_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token', token);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "User activated successfully"
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    );
  } catch (error) {
    console.error('Error in activate-user:', error);
    
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