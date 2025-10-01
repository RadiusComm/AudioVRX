import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { z } from "npm:zod@3.22.4";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400"
};
const documentSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  name: z.string(),
  knowledge_base_id: z.string(),
  type: z.enum([
    'text',
    'url',
    'file'
  ])
}).nullable();
const requestSchema = z.object({
  name: z.string(),
  age: z.string(),
  personality: z.array(z.string()),
  voiceType: z.string(),
  avatarUrl: z.string(),
  isPublic: z.boolean(),
  userId: z.string(),
  voiceId: z.string(),
  document: documentSchema
});
// Voice type mapping for ElevenLabs
const voiceMapping = {
  male_professional_1: 'UgBBYS2sOqTuMpoF3BR0',
  male_professional_2: 'iP95p4xoKVk53GoZ742B',
  male_casual_1: 'nPczCjzI2devNBz1zQrb',
  male_casual_2: 'pqHfZKP75CvOlQylNhV4',
  female_professional_1: '9BWtsMINqrJLrRacOk9x',
  female_professional_2: '56AoDkrOh6qfVPDXZ7Pt',
  female_casual_1: 'g6xIsTj2HwM6VR4iXFCw',
  female_casual_2: 'bxiObU1YDrf7lrFAyV99'
};
serve(async (req)=>{
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const formData = requestSchema.parse(await req.json());
    // Create ElevenLabs agent first
    const elevenLabsKey = Deno.env.get("ELEVEN_LABS_API_KEY");
    if (!elevenLabsKey) {
      throw new Error("Missing ElevenLabs API key");
    }
    // Prepare agent configuration
    const agentConfig = {
      conversation_config: {
        tts: {
          model_id: "eleven_turbo_v2",
          voice_id: formData?.voiceId,
          agent_output_audio_format: "pcm_16000",
          optimize_streaming_latency: 3,
          stability: 0.5,
          speed: 0.95,
          similarity_boost: 0.8
        },
        turn: {
          turn_timeout: 7,
          silence_end_call_timeout: -1,
          mode: "turn"
        },
        conversation: {
          text_only: false,
          max_duration_seconds: 900,
          client_events: [
            "user_transcript",
            "agent_response",
            "audio"
          ]
        },
        agent: {
          first_message: `Hello, I'm ${formData?.name}`,
          prompt: {
            llm: "gemini-2.0-flash-001",
            temperature: 0.05,
            max_tokens: -1,
            tools: [
              {
                id: "tool_01jw510dqseynarfj12wh5j8yw",
                name: "end_call",
                description: "You are an AI agent engaged in a real-time voice conversation. You have access to an \"end call\" tool, which should only be used when the conversation has reached a natural, complete conclusion or when specific conditions are met.\n\nUse the \"end call\" tool when:\n- The customer has no further questions or concerns.\n- The purpose of the call has been clearly fulfilled (e.g., purchase completed, issue resolved, information delivered).\n- The customer indicates they are satisfied and ready to end the conversation.\n- The customer explicitly says goodbye or ends with a closing phrase like \"Thanks, that's all I needed.\"\n\nBefore using the tool, you must:\n1. Confirm the customer's needs have been met.\n2. Politely summarize what was covered or resolved.\n3. Say a friendly closing phrase, such as “Thanks again for your time today, have a great day!”\n4. Only then, trigger the \"end call\" action.\n\nNever end the call:\n- Abruptly or mid-sentence.\n- Without a closing remark.",
            response_timeout_secs: 20,
            type: "system",
            params: {
              "system_tool_type": "end_call"
            }
          }
        ],
        tool_ids: [
          "tool_01jw510dqseynarfj12wh5j8yw"
        ],
        knowledge_base: [
          {
            type: "text",
            name: "Text document",
            id: "6i3nNE8PgkXxhtS9HY3l",
            usage_mode: "auto"
          }
        ],
        rag: {
            enabled: true,
            embedding_model: "e5_mistral_7b_instruct",
            max_vector_distance: 0.6,
            max_documents_length: 50000,
            max_retrieved_rag_chunks_count: 20  
            }
          }
        }
      },
      platform_settings: {
        auth: {
          enable_auth: false,
          allowlist: [
           { hostname: "app.myretailiq.com"},
           { hostname: "myretailiq.com"}
        ],
        shareable_token: null
       },
        evaluation: {
          criteria: [
            {
              id: "call_analytics_1",
              name: "Call analytics 1",
              type: "prompt",
              conversation_goal_prompt: "You are an expert evaluator of sales conversations. Analyze the following transcript and evaluate the caller's performance (not the ai agents) across five core criteria. Each criterion should be scored from 1 to 100, where 100 is perfect execution. At the end, determine whether the overall conversation was a success, failure, or unknown based on these scores, and briefly explain your reasoning.\n Evaluation Criteria: 1. Active Listening – Did the agent accurately understand and respond to the customer's concerns? 2. Empathy – Did the agent show understanding and compassion for the customer's feelings or situation? 3. Problem Solving – Did the agent identify the core need and offer a clear, actionable solution? 4. Negotiation – Did the agent address objections and guide the customer toward agreement? 5. Technical Knowledge – Did the agent correctly and confidently explain relevant product or service details? Return your evaluation in this exact format: \n Scores: \n - Active Listening: [1–100] \n - Empathy: [1–100] \n - Problem Solving: [1–100] \n - Negotiation: [1–100] \n - Technical Knowledge: [1–100] \n Goal Result: [success | failure | unknown] \n Rationale: [2–5 sentence explanation justifying the result] \n Use only the content of the transcript for your evaluation. Be objective, concise, and professional. \n",
              use_knowledge_base: false
            }
          ]
        },
      widget: {
      "variant": "compact",
      "placement": "bottom",
      "expandable": "never",
      "avatar": {
          "type": "orb",
          "color_1": "#2792dc",
          "color_2": "#9ce6e6"
      },
      "feedback_mode": "none",
      "bg_color": "#e7e7e7",
      "text_color": "#34376f",
      "btn_color": "#34376f",
      "btn_text_color": "#e7e7e7",
      "border_color": "#e7e7e7",
      "focus_color": "#34376f",
      "border_radius": 30,
      "btn_radius": 10,
      "action_text": "Advanced iQ",
      "start_call_text": "Start Role-Play",
      "end_call_text": "End Role-Play",
      "expand_text": null,
      "listening_text": "Listening ........",
      "speaking_text": "Speaking...",
      "shareable_page_text": null,
      "shareable_page_show_terms": false,
      "terms_text": null,
      "terms_html": null,
      "terms_key": null,
      "show_avatar_when_collapsed": true,
      "disable_banner": true,
      "override_link": null,
      "mic_muting_enabled": true,
      "transcript_enabled": true,
      "text_input_enabled": true,
      "text_contents": {
        "main_label": "Advanced iQ Agent",
        "start_call": "Start",
        "new_call": null,
        "end_call": "End Call",
        "mute_microphone": "Mute",
        "change_language": null,
        "collapse": null,
        "expand": null,
        "copied": null,
        "accept_terms": null,
        "dismiss_terms": null,
        "listening_status": null,
        "speaking_status": null,
        "connecting_status": null,
        "input_label": null,
        "input_placeholder": null,
        "user_ended_conversation": null,
        "agent_ended_conversation": null,
        "conversation_id": "",
        "error_occurred": null,
        "copy_id": null
      },
      "language_selector": true,
      "supports_text_only": true
    },
        overrides: {
        conversation_config_override: {
          tts: {
           voice_id: false
         },
        conversation: {
          text_only: true
        },
        agent: {
          first_message: false,
          language: true,
          prompt: {
            prompt: false
          }
        }
      },
      "custom_llm_extra_body": false,
      "enable_conversation_initiation_client_data_from_webhook": false
    },
        privacy: {
           "record_voice": true,
           "retention_days": -1,
           "delete_transcript_and_pii": false,
           "delete_audio": false,
           "apply_to_existing_conversations": false,
           "zero_retention_mode": false
         },
      },
      name: formData?.name,
      access_info: {
        is_creator: true,
        creator_name: "IQ-Agent",
        creator_email: "spencer@fastdial.com",
        role: "admin"
      }
    };
    // If document exists, add knowledge base configuration
    if (formData.document) {
      agentConfig.conversation_config.agent.prompt.knowledge_base = [
        {
          "name": formData.document?.name,
          "id": formData.document?.knowledge_base_id,
          "type": formData.document?.type
        }
      ];
    }

    const apiResponse = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": elevenLabsKey
      },
      body: JSON.stringify(agentConfig)
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
    // Create persona in Supabase with agent_id and type
    const { data: persona, error: personaError } = await supabase.from('iq_agents').insert([
      {
        name: formData.name,
        voice_type: formData?.voiceType,
        avatar_url: formData.avatarUrl,
        is_public: formData.isPublic,
        created_by: formData.userId,
        elevenlabs_agent_id: agentId,
        age: formData?.age || '',
        document_id: formData?.document?.id || null
      }
    ]).select().single();
    if (personaError) throw personaError;
    return new Response(JSON.stringify({
      ...persona,
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
