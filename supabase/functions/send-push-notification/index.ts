import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Get OAuth2 access token for FCM v1 API
async function getAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
  if (!serviceAccountJson) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  
  // Create JWT for service account
  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Base64url encode
  const encode = (obj: object) => {
    const str = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(str);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const headerEncoded = encode(header);
  const payloadEncoded = encode(payload);
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Import private key and sign
  const privateKeyPem = serviceAccount.private_key;
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\n/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const jwt = `${signatureInput}.${signature}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    console.error("Token exchange failed:", error);
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Send FCM notification
async function sendFcmNotification(
  accessToken: string,
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  const projectId = "my-family-vault-ddc11";
  
  const message = {
    message: {
      token: deviceToken,
      notification: {
        title,
        body,
      },
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          channel_id: "default",
        },
      },
      data: data || {},
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("FCM send failed:", error);
    return false;
  }

  console.log("FCM notification sent successfully");
  return true;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { user_id, title, body, data }: PushNotificationRequest = await req.json();

    console.log(`Sending push notification to user ${user_id}: ${title}`);

    // Get user's device tokens
    const { data: tokens, error: tokenError } = await supabase
      .from("device_tokens")
      .select("token")
      .eq("user_id", user_id);

    if (tokenError) {
      console.error("Error fetching device tokens:", tokenError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to fetch device tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log("No device tokens found for user");
      return new Response(
        JSON.stringify({ success: true, message: "No devices registered" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token for FCM
    const accessToken = await getAccessToken();

    // Send to all user's devices
    let successCount = 0;
    for (const { token } of tokens) {
      const success = await sendFcmNotification(accessToken, token, title, body, data);
      if (success) successCount++;
    }

    console.log(`Sent ${successCount}/${tokens.length} notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        total: tokens.length 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
