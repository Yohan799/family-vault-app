import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user exists
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    const userExists = users?.users?.some(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!userExists) {
      // Return success even if user doesn't exist (security best practice)
      console.log(`[send-password-reset-otp] User not found: ${email}`);
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, OTP has been sent" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Hash OTP for storage (simple hash for demo - use bcrypt in production)
    const encoder = new TextEncoder();
    const data = encoder.encode(otp + email);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const otpHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    // Delete any existing OTPs for this email
    await supabase
      .from("password_reset_otps")
      .delete()
      .eq("email", email.toLowerCase());

    // Store OTP with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase
      .from("password_reset_otps")
      .insert({
        email: email.toLowerCase(),
        otp_hash: otpHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("[send-password-reset-otp] Insert error:", insertError);
      throw new Error("Failed to store OTP");
    }

    // Send OTP via email
    const emailResponse = await resend.emails.send({
      from: "Family Vault <noreply@unphuc.com>",
      to: [email],
      subject: "Password Reset OTP - Family Vault",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6D28D9; text-align: center;">Family Vault</h1>
          <h2 style="text-align: center;">Password Reset Request</h2>
          <p style="text-align: center; font-size: 16px; color: #666;">
            Use this OTP to reset your password. It expires in 10 minutes.
          </p>
          <div style="background: #f3e8ff; padding: 30px; text-align: center; border-radius: 16px; margin: 20px 0;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6D28D9;">
              ${otp}
            </span>
          </div>
          <p style="text-align: center; font-size: 14px; color: #999;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    });

    console.log("[send-password-reset-otp] Email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent to email" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-password-reset-otp] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send OTP" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
