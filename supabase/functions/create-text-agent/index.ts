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
    const { agentDetails, scenario, title, initialPrompt, systemPrompt, persona, userId } = await req.json();
    // Create ElevenLabs agent first
    const elevenLabsKey = Deno.env.get("ELEVEN_LABS_API_KEY");
    if (!elevenLabsKey) {
      throw new Error("Missing ElevenLabs API key");
    }
    let textAgent = agentDetails;
    textAgent.name = title;
    textAgent.conversation_config.conversation.text_only = true;
    textAgent.conversation_config.agent.first_message = initialPrompt;
    textAgent.conversation_config.agent.prompt.prompt = `You are always in the role of a customer. Regardless of what the user says or does, you must remain in character as a customer. For example, if they are playing the role of someone looking to buy a new laptop in an electronics store, they should consistently behave like a customer with that goal. They should address any attempts by the user to derail the scenario by steering the conversation back to the intended context, ensuring that the training session remains realistic and productive. ${JSON.stringify(systemPrompt)}`;
    textAgent.platform_settings = {
      "widget": {
        "variant": "full",
        "placement": "bottom",
        "expandable": "always",
        "avatar": {
          "type": "orb",
          "color_1": "#2792dc",
          "color_2": "#9ce6e6"
        },
        "bg_color": "#e7e7e7",
        "text_color": "#34376f",
        "btn_color": "#34376f",
        "btn_text_color": "#e7e7e7",
        "border_color": "#e7e7e7",
        "focus_color": "#34376f",
        "border_radius": 30,
        "btn_radius": 10,
        "mic_muting_enabled": true,
        "transcript_enabled": true,
        "text_input_enabled": true,
        "language_selector": true,
        "supports_text_only": true,
        "action_text": "Advanced iQ",
        "start_call_text": "Start Role-Play",
        "end_call_text": "End Role-Play"
      },
      "privacy": {
        "record_voice": false,
        "retention_days": -1,
        "delete_transcript_and_pii": false,
        "delete_audio": true
      }
    };
    const apiResponse = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsKey
      },
      body: JSON.stringify(textAgent)
    });
    const agentResult = await apiResponse.json();
    const agentId = agentResult?.agent_id;
    if (!agentId) {
      throw new Error('No agent ID returned from ElevenLabs');
    }
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Create agent in Supabase with agent_id and type
    const { data: agent, error: agentError } = await supabase.from('role_play_agents').insert([
      {
        name: title,
        voice_type: persona?.voiceType,
        avatar_url: persona?.avatar_url,
        is_public: true,
        created_by: userId,
        elevenlabs_agent_id: agentId,
        document_id: persona?.document_id || null,
        scenario_id: scenario?.id,
        type: 'text'
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
