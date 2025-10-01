import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from "npm:emailjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }

  const client = new SMTPClient({
    user: Deno.env.get("ZOHO_EMAIL"),
    password: Deno.env.get("ZOHO_PASSWORD"),
    host: Deno.env.get("ZOHO_HOST"),
    port: 465,
    ssl: true
  });

  try {
    const { sessionId, baseUrl } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get session details with user and scenario information
    const { data: session, error: sessionError } = await supabase
      .from('roleplay_sessions')
      .select(`
        *,
        scenario:scenario_id(title, description, difficulty),
        user:user_id(first_name, last_name, email)
      `)
      .eq('id', sessionId)
      .single();

    if (sessionError) throw sessionError;
    if (!session) throw new Error("Session not found");
    if (!session.user.email) throw new Error("No email found");

    console.log("user email", session.user.email);

    // Format date for display
    const sessionDate = new Date(session.start_time);
    const formattedDate = sessionDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Create accept/decline links
    const acceptUrl = `${baseUrl}/schedule?id=${sessionId}&response=accept`;
    const declineUrl = `${baseUrl}/schedule?id=${sessionId}&response=decline`;

    // Create email content
    const emailSubject = `Role-Play Session: ${session.scenario.title}`;
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailSubject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .container { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #3B82F6, #14B8A6); padding: 25px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 600; }
    .content { padding: 25px; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 15px; }
    .session-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
    .session-details h2 { color: #1f2937; font-size: 18px; margin-bottom: 10px; }
    .difficulty { display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .beginner { background: #d1fae5; color: #065f46; }
    .intermediate { background: #fef3c7; color: #92400e; }
    .advanced { background: #fee2e2; color: #b91c1c; }
    .expert { background: #ede9fe; color: #5b21b6; }
    .buttons { text-align: center; margin: 25px 0; }
    .button { display: inline-block; padding: 12px 24px; margin: 0 8px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; transition: all 0.2s; }
    .accept { background: #10B981; color: white !important; }
    .decline { background: #EF4444; color: white !important; }
    .accept:hover { background: #059669; }
    .decline:hover { background: #DC2626; }
    .footer { background: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    @media (max-width: 600px) {
      body { padding: 10px; }
      .content { padding: 20px; }
      .button { display: block; margin: 5px 0; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Role-Play Session Invitation</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${session.user.first_name},</div>
      
      <p>You have been scheduled for a role-play training session by your manager.</p>
      
      <div class="session-details">
        <h2>${session.scenario.title}</h2>
        <p>${session.scenario.description}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Difficulty:</strong> <span class="difficulty ${session.scenario.difficulty.toLowerCase()}">${session.scenario.difficulty}</span></p>
      </div>
      
      <p>Please confirm whether you can attend this session by clicking one of the buttons below:</p>
      
      <div class="buttons">
        <a href="${acceptUrl}" class="button accept">✓ Accept</a>
        <a href="${declineUrl}" class="button decline">✗ Decline</a>
      </div>
    </div>
    
    <div class="footer">
      <p>Automated message from <strong>RetailIQ</strong> - Do not reply</p>
    </div>
  </div>
</body>
</html>`;

    await client.send({
      from: Deno.env.get("ZOHO_EMAIL"),
      to: session.user.email,
      subject: `RetailiQ - ${emailSubject}`,
      attachment: [
        {
          data: emailHtml,
          alternative: true
        }
      ]
    });

    // Update session status to pending if not already set
    if (!session.status || session.status === 'pending') {
      const { error: updateError } = await supabase
        .from('roleplay_sessions')
        .update({
          status: 'pending'
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully"
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error instanceof Error ? error.toString() : undefined
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  }
});