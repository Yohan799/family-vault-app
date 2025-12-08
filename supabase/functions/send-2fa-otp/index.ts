import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATE_LIMIT_WINDOW_MINUTES = 10;
const MAX_OTP_REQUESTS_PER_WINDOW = 3;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate JWT token from Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Create a client with the user's token to validate it
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error("JWT validation failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Authenticated user:", user.id, "email:", user.email);

    // Use authenticated user's email and ID - ignore any client-provided values
    const userId = user.id;
    const email = user.email;

    if (!email) {
      console.error("User has no email address");
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: Check how many OTPs were sent in the last window
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - RATE_LIMIT_WINDOW_MINUTES);

    const { count, error: countError } = await supabase
      .from("two_fa_verifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", windowStart.toISOString());

    if (countError) {
      console.error("Rate limit check failed:", countError);
      throw new Error("Failed to check rate limit");
    }

    if (count && count >= MAX_OTP_REQUESTS_PER_WINDOW) {
      console.warn(`Rate limit exceeded for user ${userId}: ${count} requests in last ${RATE_LIMIT_WINDOW_MINUTES} minutes`);
      return new Response(
        JSON.stringify({ 
          error: `Too many OTP requests. Please wait ${RATE_LIMIT_WINDOW_MINUTES} minutes before trying again.` 
        }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending 2FA OTP to: ${email} for user: ${userId} (${count || 0}/${MAX_OTP_REQUESTS_PER_WINDOW} requests in window)`);

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { error: dbError } = await supabase
      .from("two_fa_verifications")
      .insert({
        user_id: userId,
        email: email,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Failed to store OTP: ${dbError.message}`);
    }

    // Send OTP via email
    const emailResponse = await resend.emails.send({
      from: "Family Vault <onboarding@resend.dev>",
      to: [email],
      subject: "Your Two-Factor Authentication Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #6D28D9; text-align: center;">Two-Factor Authentication</h1>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">Your verification code is:</p>
          <div style="background: #F3E8FF; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #6D28D9; font-size: 36px; margin: 0; letter-spacing: 8px;">${otpCode}</h2>
          </div>
          <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #666;">If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">Family Vault - Secure Your Family's Legacy</p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "OTP sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-2fa-otp function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
