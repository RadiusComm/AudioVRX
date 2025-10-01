import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { themeOfStory, description, difficulty, tags, coverImageUrl, initialPrompt, userId, assigned_voices, systemPrompt } = await req.json();
    if (!themeOfStory || !description) {
      throw new Error("Title and description are required");
    }
    // Create ElevenLabs agent
    const elevenLabsKey = Deno.env.get("ELEVEN_LABS_API_KEY");
    if (!elevenLabsKey) {
      throw new Error("Missing ElevenLabs API key");
    }
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // get Agent details from ElevenLabs
    const getAgentDetails = await fetch(`https://api.elevenlabs.io/v1/convai/agents/agent_9001k4r72ez9fmpvz7jwt6wr3jc9`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsKey
      }
    });
    let agentDetails = await getAgentDetails.json();
    if (!agentDetails) {
      throw Error("No agent details found");
    }
    // Create scenario in Supabase
    const { data: scenario, error: scenarioError } = await supabase.from('scenarios').insert([
      {
        title: themeOfStory,
        description,
        difficulty,
        assigned_voices: JSON.stringify(assigned_voices),
        tags: typeof tags === 'string' ? tags.split(',').map((t)=>t.trim()) : tags,
        cover_image_url: coverImageUrl,
        created_by: userId,
        initial_prompt: initialPrompt,
        system_prompt: systemPrompt
      }
    ]).select().single();
      return new Response(JSON.stringify({
        agentDetails: agentDetails,
        scenario,
        title,
        initialPrompt,
        systemPrompt,
        userId
      }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
    if (scenarioError) throw scenarioError;
    // Create voice agent
    const voiceAgent = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/create-voice-agent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        agentDetails: agentDetails,
        scenario,
        title,
        initialPrompt,
        systemPrompt,
        userId
      })
    });
    const voiceAgentResponse = await voiceAgent.json();
    if (!voiceAgentResponse?.agent_id) {
      throw new Error('Failed to create voice agent');
    }
   
    return new Response(JSON.stringify(scenario), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error('Error in generate-roleplay:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
