import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { agentId } = await req.json();
    
    if (!agentId) {
      throw new Error("Agent ID is required");
    }

    // Get ElevenLabs API key
    const elevenLabsKey = Deno.env.get("ELEVEN_LABS_API_KEY");
    if (!elevenLabsKey) {
      throw new Error("Missing ElevenLabs API key");
    }

    // Create a session with ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsKey
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to create session with ElevenLabs');
    }

    const sessionData = await response.json();

    return new Response(
      JSON.stringify({
        signedUrl: sessionData?.signed_url,
        agentId: agentId
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error in get-agent-session:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.toString() : undefined
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