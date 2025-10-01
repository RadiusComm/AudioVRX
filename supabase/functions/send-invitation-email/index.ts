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
    const { userId, baseUrl } = await req.json();
    
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user) throw userError || new Error("User not found");

    // Generate a password reset link
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: user.email,
      options: {
        redirectTo: `${baseUrl}/reset-password`
      }
    });

    if (resetError) throw resetError;

    // Create email content
    const emailSubject = `Welcome to RetailIQ - Your Account Invitation`;
    const resetLink = resetData.properties.action_link;
    
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
    .info-box { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3B82F6; }
    .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 15px; }
    .button:hover { background: #2563EB; }
    .footer { background: #f9fafb; padding: 15px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to RetailIQ</h1>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${profile.first_name || 'there'},</div>
      
      <p>You've been invited to join RetailIQ, the advanced retail conversation training platform.</p>
      
      <div class="info-box">
        <p><strong>Your account has been created with:</strong></p>
        <p>Email: ${user.email}</p>
        <p>Temporary Password: 123456</p>
        <p>Please use the button below to set your own password and activate your account.</p>
      </div>
      
      <p>Once you've set your password, you'll have access to all the training features and resources available to you.</p>
      
      <div style="text-align: center;">
        <a href="${resetLink}" class="button">Set Password & Activate Account</a>
      </div>
      
      <p style="margin-top: 25px;">If you have any questions, please contact your administrator.</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} RetailIQ - All rights reserved</p>
    </div>
  </div>
</body>
</html>`;

    await client.send({
      from: Deno.env.get("ZOHO_EMAIL"),
      to: user.email,
      subject: emailSubject,
      attachment: [
        {
          data: emailHtml,
          alternative: true
        }
      ]
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation email sent successfully"
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error('Error sending invitation email:', error);
    
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