import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Configuration, OpenAIApi } from "npm:openai@4.12.1";
import { ElevenLabs } from "npm:elevenlabs-node@2.0.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, persona, type } = await req.json();

    if (!message || !persona) {
      throw new Error("Missing required parameters");
    }

    // Verify environment variables
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const elevenLabsKey = Deno.env.get("ELEVEN_LABS_API_KEY");

    if (!openaiKey || !elevenLabsKey) {
      throw new Error("Missing required API keys");
    }

    const configuration = new Configuration({
      apiKey: openaiKey,
    });

    const openai = new OpenAIApi(configuration);
    const voice = new ElevenLabs({
      apiKey: elevenLabsKey,
    });

    // Generate system prompt based on persona
    const systemPrompt = `You are ${persona.name}, a ${persona.role}${
      persona.company ? ` at ${persona.company}` : ""
    }. 
    Background: ${persona.background}
    Personality traits: ${persona.personality.join(", ")}
    
    You are having a ${type ? type.replace("-", " ") : ""} conversation.
    
    Respond naturally and conversationally, maintaining the persona's character and professional background. Keep responses concise and focused.`;

    let prompt = message;
    
    if (message === "START_CONVERSATION") {
      prompt = "Generate an appropriate professional greeting and conversation opener based on the context.";
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "";

    // Generate audio from text
    const audioBuffer = await voice.textToSpeech({
      textInput: response,
      voiceId: persona.voiceType || "default",
      stability: 0.5,
      similarityBoost: 0.5,
    });

    return new Response(
      JSON.stringify({
        response,
        audio: audioBuffer.toString("base64"),
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        details: error.toString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});