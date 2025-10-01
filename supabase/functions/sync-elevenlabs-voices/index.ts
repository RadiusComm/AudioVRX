import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  description?: string;
  category?: string;
  labels?: {
    gender?: string;
    accent?: string;
    age?: string;
    use_case?: string;
    [key: string]: any;
  };
  preview_url?: string;
  available_for_tiers?: string[];
  settings?: any;
}

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

    // Get ElevenLabs API key
    const elevenLabsKey = Deno.env.get("ELEVEN_LABS_API_KEY");
    if (!elevenLabsKey) {
      throw new Error("Missing ElevenLabs API key");
    }

   
    // Fetch voices from ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': elevenLabsKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`ElevenLabs API error: ${errorData.detail || response.statusText}`);
    }

    const data = await response.json();
    const voices: ElevenLabsVoice[] = data.voices || [];

    console.log(`Found ${voices.length} voices from ElevenLabs`);

    // For POST requests, save to database
    const voicesToInsert = voices.map(voice => ({
      id: voice?.voice_id,
      name: voice?.name,
      description: voice?.description || null,
      category: voice?.category || null,
      gender: voice?.labels?.gender || null,
      accent: voice.labels?.accent || null,
      age: voice.labels?.age || null,
      use_case: voice.labels?.use_case || null,
      preview_url: voice.preview_url || null,
      labels: voice.labels || {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Clear existing voices and insert new ones
    const { error: deleteError } = await supabase
      .from('elevenlabs_voices')
      .delete()
      .neq('id', ''); // Delete all records

    if (deleteError) {
      console.error('Error clearing existing voices:', deleteError);
      throw new Error(`Failed to clear existing voices: ${deleteError.message}`);
    }

    // Insert new voices in batches to avoid payload size limits
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < voicesToInsert.length; i += batchSize) {
      const batch = voicesToInsert.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('elevenlabs_voices')
        .insert(batch);

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
        throw new Error(`Failed to insert voices batch: ${insertError.message}`);
      }

      insertedCount += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} voices`);
    }

    console.log(`Successfully synced ${insertedCount} voices to database`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${insertedCount} voices from ElevenLabs`,
        voicesCount: insertedCount,
        voices: voicesToInsert.map(v => ({ id: v.id, name: v.name, category: v.category }))
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in sync-elevenlabs-voices:', error);
    
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