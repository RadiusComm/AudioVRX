import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from "npm:openai@4.12.1";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};
function escapeInput(str) {
  return String(str).replace(/[\n\r\t]/g, ' ').replace(/"/g, '\\"');
}
// Interpolation function (evaluates variables in template)
function interpolate(template, variables) {
  return new Function(...Object.keys(variables), `return \`${template}\`;`)(...Object.values(variables));
}
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const { themeOfStory, difficulty } = await req.json();
    if (!themeOfStory) {
      throw new Error("Theme of Story is required");
    }
    const openaiKey = Deno.env.get("OPEN_AI_KEY");
    if (!openaiKey) {
      throw new Error("OpenAI API key not configured");
    }
    const openai = new OpenAI({
      apiKey: openaiKey
    });
    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const parsedTitle = escapeInput(themeOfStory);
    const parsedDifficulty = escapeInput(difficulty);
    let query = await supabase.from('system_prompts').select('*').ilike('name', 'Customer%');
    const { data, error } = await query;
    if (error) {
      throw new Error("Failed to get system prompts");
    }
    const prompt = data[0]?.content;
    const elevenlabVoices = await supabase.from('elevenlabs_voices').select('id,category,gender, accent, age').not('gender', 'is', null);
    // Interpolate all 3 variables into the prompt
    const filledPrompt = interpolate(prompt, {
      parsedTitle,
      parsedDifficulty
    });
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a creative AI agent specialized in generating immersive interactive game scenarios. Always respond in valid JSON format.
          RULES:
          1. You will ONLY select character voices from the provided "Available Voices" list below.
          2. DO NOT invent new voice IDs. Always map roles to an appropriate voice_id, label, and description from the provided voices.`
        },
        {
          role: "user",
          content: `Voices available: ${JSON.stringify(elevenlabVoices)}
          Generate a game scenario based on the title: "${parsedTitle}".
          The scenario may include multiple characters such as Player/User, Nurse, Teacher, Doctor, Police, or others relevant to the mystery.
          Scenario difficulty level: "${parsedDifficulty}".
          Return a JSON object with the following fields:
          {
           "description": Craft a brief description of the overall scenario and tailored to the scenario's difficulty level.
           "systemPrompt": "Deliver a narrative-rich, first-person account as if the Player/User is preparing to investigate the case. Include environment, objectives, tools/resources, challenges/obstacles, decision points, and complexity factors. Immerse the reader in tension, urgency, and curiosity.",
          "initialPrompt": "Provide a realistic opening action, question, or thought that the Player/User would naturally use to begin investigating the case.",
           "tags": [
              // 3-5 relevant tags
              // Example: "mystery", "detective", "interactive", "family-friendly", "investigation"
            ],
            "coverImageUrl": "Provide a valid Pexels or Unsplash stock photo URL matching the scene of the case/mystery/theme of setting."
             "assigned_voices": [
             // Assign voices from your available ElevenLabs voices.
             // Example format:
             // { "role": "Doctor", "voice_id": "MF3mGyEYCl7XYWbV9V6O (pick from the provided voice_id above based on the role)", "label": "Elli", "description": "Gentle, thoughtful, ideal for a doctor role" }
        ],
      }
      **PLAYER ROLE ENFORCEMENT:**  
      The AI Agent MUST act exclusively from the perspective of the role being described. Each role (Player/User, Nurse, Teacher, Doctor, Police, etc.) should only express thoughts, observations, questions, and actions appropriate to their role. Do not provide advice or act outside the assigned role.

      **STRICT ENFORCEMENT:**  
        No deviation from the assigned role perspectives is allowed. Maintain immersive, scenario-consistent behavior for all roles.`
        }
      ]
    });
    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error("Failed to generate scenario");
    }
    const scenarioData = JSON.parse(response);
    return new Response(JSON.stringify(scenarioData), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error('Error generating scenario:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Failed to generate scenario',
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