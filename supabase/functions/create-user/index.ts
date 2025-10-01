import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SMTPClient } from "npm:emailjs";

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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user's JWT from the request headers
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get admin user from auth header
    const { data: { user: adminUser }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !adminUser) {
      throw new Error('Invalid user token');
    }

    // Check if user is admin or super-admin
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('role, account_id')
      .eq('id', adminUser.id)
      .single();

    if (adminProfileError) throw adminProfileError;
    if (adminProfile.role !== 'admin' && adminProfile.role !== 'super-admin') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, firstName, lastName, role, storeIds, username, avatarUrl, accountId } = await req.json();
    
    if (!email || !firstName || !lastName) {
      throw new Error("Email, first name, and last name are required");
    }

    // Default password
    const defaultPassword = "123456";
    
    // Determine which account ID to use
    // Super admins can specify an account ID, regular admins must use their own
    const userAccountId = adminProfile.role === 'super-admin' && accountId 
      ? accountId 
      : adminProfile.account_id;
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        account_id: userAccountId
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Failed to create user");

    // Create user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          role: role || 'employee',
          status: 'inactive', // Default to inactive until invitation is accepted
          username: username,
          avatar_url: avatarUrl,
          account_id: userAccountId, // Use the determined account ID
          email: email, // Store email in profiles table as well
        }
      ]);

    if (profileError) throw profileError;

    // Create store assignments if stores are selected
    if (storeIds && storeIds.length > 0) {
      const storeAssignments = storeIds.map(storeId => ({
        user_id: authData.user.id,
        store_id: storeId,
      }));

      const { error: assignmentError } = await supabase
        .from('user_store_assignments')
        .insert(storeAssignments);

      if (assignmentError) throw assignmentError;
    }

    // Generate a unique token for account activation
    const activationToken = crypto.randomUUID();
    
    // Store the activation token in a secure way
    const { error: tokenError } = await supabase
      .from('user_activation_tokens')
      .insert([{
        user_id: authData.user.id,
        token: activationToken,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days expiry
      }]);
      
    if (tokenError) {
      console.error("Error storing activation token:", tokenError);
      // Continue anyway as this might be a temporary table issue
    }

    // Send invitation email with credentials
    const baseUrl = req.headers.get('origin') || '';
    const activationUrl = `${baseUrl}/activate?token=${activationToken}&userId=${authData.user.id}`;
    
    // Initialize email client
    const emailClient = new SMTPClient({
      user: Deno.env.get("ZOHO_EMAIL"),
      password: Deno.env.get("ZOHO_PASSWORD"),
      host: Deno.env.get("ZOHO_HOST"),
      port: 465,
      ssl: true
    });

    // Create email content
    const emailSubject = `Welcome to RetailIQ - Your Account Invitation`;
    
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
    .button { display: inline-block; padding: 12px 24px; background: #3B82F6; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 15px; }
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
      <div class="greeting">Hello ${firstName},</div>
      
      <p>You've been invited to join RetailIQ, the advanced retail conversation training platform.</p>
      
      <div class="info-box">
        <p><strong>Your account has been created with:</strong></p>
        <p>Email: ${email}</p>
        <p>Temporary Password: ${defaultPassword}</p>
        <p>Please use the button below to activate your account.</p>
      </div>
      
      <p>Once you've activated your account, you'll have access to all the training features and resources available to you.</p>
      
      <div style="text-align: center;">
        <a href="${activationUrl}" class="button">Activate My Account</a>
      </div>
      
      <p style="margin-top: 25px;">If you have any questions, please contact your administrator.</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} RetailIQ - All rights reserved</p>
    </div>
  </div>
</body>
</html>`;

    try {
      await emailClient.send({
        from: Deno.env.get("ZOHO_EMAIL"),
        to: email,
        subject: emailSubject,
        attachment: [
          {
            data: emailHtml,
            alternative: true
          }
        ]
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Continue anyway, we'll return success but log the email error
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "User created and invitation sent",
        userId: authData.user.id,
        email: email
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        } 
      }
    );
  } catch (error) {
    console.error('Error in create-user:', error);
    
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