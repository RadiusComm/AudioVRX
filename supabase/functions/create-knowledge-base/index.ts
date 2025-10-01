import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from "npm:zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const requestSchema = z.object({
  content: z.string().min(1, "Content is required"),
  type: z.enum(['text', 'file', 'url']),
  userId: z.string().uuid("Invalid user ID"),
});

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request body
    const { content, type: originalType, userId } = requestSchema.parse(await req.json());

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const elevenLabsKey = Deno.env.get("ELEVEN_LABS_API_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey || !elevenLabsKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let knowledgeBaseId = null;
    let elevenLabsEndpoint = '';
    let requestBody = {};
    let type = originalType;
    if (type === 'file' && typeof content === 'string' && content.startsWith('http')) {
      type = 'url'; // Override 'file' to behave like 'url'
    }
    // Determine ElevenLabs endpoint and request body based on content type
    switch (type) {
      case 'url':
        elevenLabsEndpoint = '/v1/convai/knowledge-base/url';
        requestBody = { url: content };
        break;
      case 'file':
        elevenLabsEndpoint = '/v1/convai/knowledge-base/file';
        // For file uploads, we need to handle the file differently
        const fileResponse = await fetch(content);
        const fileBlob = await fileResponse.blob();
        const formData = new FormData();
        formData.append('file', fileBlob);
        requestBody = formData;
        break;
      case 'text':
        elevenLabsEndpoint = '/v1/convai/knowledge-base/text';
        requestBody = { text: content };
        break;
      default:
        throw new Error('Invalid content type');
    }

    // Upload to ElevenLabs Knowledge Base
    const response = await fetch(`https://api.elevenlabs.io${elevenLabsEndpoint}`, {
      method: "POST",
      headers: {
        "xi-api-key": elevenLabsKey,
        ...(type !== 'file' && { "Content-Type": "application/json" }),
      },
      body: type === 'file' ? requestBody : JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to upload to ElevenLabs');
    }

    const elevenLabsData = await response.json();
    knowledgeBaseId = elevenLabsData.id;

    // Save document in Supabase
    const { data: document, error: dbError } = await supabase
      .from('knowledge_base_documents')
      .insert([{
        name: elevenLabsData?.name,
        content: content,
        created_by: userId,
        knowledge_base_id: knowledgeBaseId,
        type,
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    return new Response(
      JSON.stringify(document),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error('Error in create-knowledge-base:', error);
    
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