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
    const { agentDetails, scenario, themeOfStory, initialPrompt, systemPrompt, assigned_voices, userId } = await req.json();
    // Create ElevenLabs agent first
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
    let voiceAgent = agentDetails;
    const { data: elevenlabVoices, error } = await supabase.from('elevenlabs_voices').select('id,labels,name').not('gender', 'is', null);
    console.log("printing...", elevenlabVoices);
    let supportedVoices = [];
    assigned_voices.forEach((voice)=>{
      let elevenlabVoice = elevenlabVoices.find((v)=>v.id === voice.voice_id);
      supportedVoices.push({
        voice_id: elevenlabVoice.id,
        label: elevenlabVoice.name,
        description: voice.description,
        language: null,
        model_family: null,
        optimize_streaming_latency: null,
        stability: null,
        speed: null,
        similarity_boost: null
      });
    });
    voiceAgent.name = themeOfStory;
    voiceAgent.conversation_config.agent.first_message = initialPrompt;
    voiceAgent.conversation_config.agent.prompt.prompt = systemPrompt;
    voiceAgent.conversation_config.tts.supported_voices = supportedVoices;
    const apiResponse = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsKey
      },
      body: JSON.stringify(voiceAgent)
    });
    const agentResult = await apiResponse.json();
    const agentId = agentResult?.agent_id;
    if (!agentId) {
      throw new Error('No agent ID returned from ElevenLabs');
    }
    // Create agent in Supabase with agent_id and type
    const { data: agent, error: agentError } = await supabase.from('role_play_agents').insert([
      {
        name: themeOfStory,
        is_public: true,
        created_by: userId,
        elevenlabs_agent_id: agentId,
        scenario_id: scenario?.id,
        type: 'voice'
      }
    ]).select().single();
    if (agentError) throw agentError;
    return new Response(JSON.stringify({
      ...agent,
      agent_id: agentId
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
