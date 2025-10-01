import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// import { createClient } from 'jsr:@supabase/supabase-js@2';
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
    const { id, name, age, personality, voiceType, avatarUrl, isPublic, type, voiceId } = await req.json();
    // Get the existing persona to check if we need to update the agent
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: existingPersona, error: fetchError } = await supabase.from('iq_agents').select('elevenlabs_agent_id').eq('id', id).single();
    if (fetchError) throw fetchError;
    // Update ElevenLabs agent if it exists
    if (existingPersona?.elevenlabs_agent_id) {
      const elevenLabsKey = Deno.env.get("ELEVEN_LABS_API_KEY");
      if (!elevenLabsKey) {
        throw new Error("Missing ElevenLabs API key");
      }
      // Prepare agent configuration
      const agentConfig = {
        conversation_config: {
          tts: {
            model_id: "eleven_turbo_v2",
            voice_id: voiceId,
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
            first_message: `Hello, I'm ${name}`,
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
              {
                hostname: "app.myretailiq.com"
              },
              {
                hostname: "myretailiq.com"
              }
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
            "transcript_enabled": false,
            "text_input_enabled": false,
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
            "styles": {
              "base": null,
              "base_hover": null,
              "base_active": null,
              "base_border": null,
              "base_subtle": null,
              "base_primary": null,
              "base_error": null,
              "accent": "#ffffff",
              "accent_hover": "#ffffff",
              "accent_active": "#ffffff",
              "accent_border": null,
              "accent_subtle": null,
              "accent_primary": "#000000",
              "overlay_padding": null,
              "button_radius": null,
              "input_radius": null,
              "bubble_radius": null,
              "sheet_radius": null,
              "compact_sheet_radius": null,
              "dropdown_sheet_radius": null
            },
            "language_selector": true,
            "supports_text_only": false
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
          }
        },
        name: name,
        access_info: {
          is_creator: true,
          creator_name: "IQ-Agent",
          creator_email: "spencer@fastdial.com",
          role: "admin"
        }
      };
      const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${existingPersona.elevenlabs_agent_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsKey
        },
        body: JSON.stringify(agentConfig)
      });
    }
    // Update persona in Supabase
    const { data: updatedPersona, error: updateError } = await supabase.from('iq_agents').update({
      name,
      age,
      personality,
      voice_type: voiceType,
      avatar_url: avatarUrl,
      is_public: isPublic,
      type
    }).eq('id', id).select().single();
    if (updateError) throw updateError;
    return new Response(JSON.stringify(updatedPersona), {
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
