import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "npm:openai";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};
const SECRET = Deno.env.get("ELEVEN_LABS_WEBHOOK_SECRET") || "";
async function verifySignature(signatureHeader, rawBody) {
  const parts = signatureHeader.split(',');
  const timestamp = parts.find((e)=>e.startsWith('t='))?.substring(2);
  const signature = parts.find((e)=>e.startsWith('v0='))?.substring(3);
  if (!timestamp || !signature) return false;
  // Check timestamp freshness (within 30 mins)
  const reqTimestamp = parseInt(timestamp) * 1000;
  const now = Date.now();
  const tolerance = 30 * 60 * 1000; // 30 minutes
  if (reqTimestamp < now - tolerance) return false;
  const encoder = new TextEncoder();
  const message = `${timestamp}.${rawBody}`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(SECRET), {
    name: "HMAC",
    hash: "SHA-256"
  }, false, [
    "sign"
  ]);
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const digest = Array.from(new Uint8Array(signatureBuffer)).map((b)=>b.toString(16).padStart(2, '0')).join('');
  return digest === signature;
}
const OPEN_AI_KEY = Deno.env.get("OPEN_AI_KEY") || "";
// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const openai = new OpenAI({
  apiKey: OPEN_AI_KEY
});
const supabase = createClient(supabaseUrl, supabaseServiceKey);
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const body = await req.json();
    const { type, data } = body;
    console.log("Printing the response of webhook", data);
    if (type !== 'post_call_transcription') {
      return new Response('Invalid event type', {
        status: 400,
        headers: corsHeaders
      });
    }
    const { transcript, agent_id, conversation_id } = data;
    const clientData = data?.conversation_initiation_client_data;
    const formattedTranscript = transcript.map((entry)=>{
      return `${entry.role.toUpperCase()}: ${entry.message}`;
    }).join('\n');
    // Prompt instructing GPT to output structured JSON for easy parsing
    const prompt = `
You are an AI call trainer assistant. Analyze the following transcript of a training call. 

Please provide the analysis in JSON format with the following keys and must cover:
- active_listening  (score 1-100) along with summary in 2-3 lines based on response
- empathy (score 1-100) along with summary in 2-3 lines based on response
- problem_solving (score 1-100) along with summary in 2-3 lines based on response
- negotiation (score 1-100) along with summary in 2-3 lines based on response
- technical_knowledge (score 1-100) along with summary in 2-3 lines based on response
- objection_handling (score 1-100) along with summary in 2-3 lines based on response
- product_knowledge (score 1-100) along with summary in 2-3 lines based on response
- insights (agent-specific advice for improvement as string in 3-4 lines)
 Each score 1-100  along with summary in 2-3 lines based on response and outcome (Success / Failure / Unknown)
Transcript:
${formattedTranscript}
- Key performance scores.
- Agent-specific insights.
Respond ONLY with a JSON object with these keys.
`;
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    const analysisText = completion.choices[0].message.content;
    // Try to parse JSON from GPT response
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (parseError) {
      console.error("Failed to parse GPT response as JSON:", analysisText);
      return new Response(JSON.stringify({
        error: "Failed to parse GPT analysis response as JSON",
        raw: analysisText
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Update data to Supabase
    const { data: dbData, error: dbError } = await supabase.from("call_analysis").update({
      analysis,
      transcript: formattedTranscript,
      updated_at: new Date().toISOString()
    }).eq("conversation_id", conversation_id).eq("agent_id", agent_id).eq("user_id", data.user_id);
    if (dbError) {
      console.error("Error saving analysis to DB:", dbError);
      return new Response(JSON.stringify({
        error: dbError.message
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
    // Return structured response including original agent_id & conversation_id for reference
    return new Response(JSON.stringify({
      agent_id,
      conversation_id,
      analysis
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: error instanceof Error ? error.toString() : undefined
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
