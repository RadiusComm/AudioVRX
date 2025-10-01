import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      throw new Error("Scenario ID is required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const elevenLabsKey = Deno.env.get("ELEVEN_LABS_API_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey || !elevenLabsKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get role play agents associated with the scenario
    const { data: agents, error: agentsError } = await supabase
      .from('role_play_agents')
      .select('elevenlabs_agent_id')
      .eq('scenario_id', id);

    if (agentsError) throw agentsError;
    // Delete agents from ElevenLabs first
    const elevenLabsDeletionResults = [];

    if (agents && agents.length > 0) {
      for (const agent of agents) {
        if (agent.elevenlabs_agent_id) {
          try {
            await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agent.elevenlabs_agent_id}`, {
              method: "DELETE",
              headers: {
                "xi-api-key": elevenLabsKey
              }
            });
          } catch (err) {
            console.error(`Error deleting ElevenLabs agent ${agent.elevenlabs_agent_id}:`, err);
          }
        }
      }
    }

    // Delete scenario from Supabase
    // Note: role_play_agents will be automatically deleted due to CASCADE
    const { error: deleteError } = await supabase
      .from('scenarios')
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
        error: error.message || 'Failed to delete scenario',
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