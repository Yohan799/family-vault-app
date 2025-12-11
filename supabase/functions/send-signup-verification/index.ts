import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  user_id: string;
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email, name }: VerificationRequest = await req.json();

    console.log(`[send-signup-verification] Processing verification for: ${email}`);

    if (!user_id || !email) {
      return new Response(
        JSON.stringify({ error: "user_id and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate a unique token
    const token = crypto.randomUUID() + '-' + Date.now().toString(36);
    
    // Token expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Delete any existing tokens for this user
    await supabase
      .from('signup_verification_tokens')
      .delete()
      .eq('user_id', user_id);

    // Store the token
    const { error: insertError } = await supabase
      .from('signup_verification_tokens')
      .insert({
        user_id,
        email,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('[send-signup-verification] Error storing token:', insertError);
      throw insertError;
    }

    // Build verification URL
    const appUrl = Deno.env.get("APP_URL") || "https://a590842d-d7a8-45cd-8bac-bf560408cd07.lovableproject.com";
    const verificationUrl = `${appUrl}/verify-email?token=${token}`;

    console.log(`[send-signup-verification] Sending email to: ${email}`);

    // Send verification email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Family Vault <onboarding@resend.dev>",
        to: [email],
        subject: "Verify your Family Vault account",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="padding: 40px 40px 30px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                          <div style="width: 70px; height: 70px; background-color: #F3E8FF; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                            <span style="font-size: 32px;">🛡️</span>
                          </div>
                        </div>
                        <h1 style="color: #1F2121; font-size: 24px; font-weight: 700; text-align: center; margin: 0 0 10px;">
                          Welcome to Family Vault!
                        </h1>
                        <p style="color: #626C71; font-size: 16px; text-align: center; margin: 0 0 30px; line-height: 1.5;">
                          Hi ${name || 'there'},<br/>Please verify your email to complete your registration.
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center">
                              <a href="${verificationUrl}" style="display: inline-block; background-color: #6D28D9; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 40px; border-radius: 12px;">
                                Verify Email
                              </a>
                            </td>
                          </tr>
                        </table>
                        <p style="color: #9CA3AF; font-size: 13px; text-align: center; margin: 30px 0 0; line-height: 1.5;">
                          This link will expire in 24 hours.<br/>
                          If you didn't create an account, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 40px; background-color: #F9FAFB; border-radius: 0 0 16px 16px;">
                        <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 0;">
                          © ${new Date().getFullYear()} Family Vault. Secure your family's legacy.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("[send-signup-verification] Resend error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("[send-signup-verification] Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, message: "Verification email sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[send-signup-verification] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
