import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      throw new Error("Missing persona ID");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the existing persona to check for agent_id
    const { data: existingPersona, error: fetchError } = await supabase
      .from('iq_agents')
      .select('elevenlabs_agent_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    // Delete ElevenLabs agent if it exists
    if (existingPersona?.agent_id) {
      const elevenLabsKey = Deno.env.get("ELEVEN_LABS_API_KEY");
      if (!elevenLabsKey) {
        throw new Error("Missing ElevenLabs API key");
      }

      const apiResponse = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${existingPersona.agent_id}`, {
        method: "DELETE",
        headers: {
          "xi-api-key": elevenLabsKey
        }
      });
    }

    // Delete persona from Supabase
    const { error: deleteError } = await supabase
      .from('iq_agents')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to delete IQ agent',
        details: error.toString()
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});