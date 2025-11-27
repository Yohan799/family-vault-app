import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const VerifyNominee = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    verifyToken(token);
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    try {
      // Fetch the verification token
      const { data: tokenData, error: tokenError } = await supabase
        .from("verification_tokens")
        .select("*, nominees(*)")
        .eq("token", token)
        .is("used_at", null)
        .single();

      if (tokenError || !tokenData) {
        throw new Error("Invalid or expired verification link");
      }

      // Check if token is expired
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt < new Date()) {
        throw new Error("This verification link has expired");
      }

      // Mark token as used
      const { error: updateTokenError } = await supabase
        .from("verification_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenData.id);

      if (updateTokenError) {
        throw new Error("Failed to process verification");
      }

      // Update nominee status to verified
      const { error: nomineeError } = await supabase
        .from("nominees")
        .update({ 
          status: "verified",
          verified_at: new Date().toISOString()
        })
        .eq("id", tokenData.nominee_id);

      if (nomineeError) {
        throw new Error("Failed to verify nominee");
      }

      setStatus("success");
      setMessage(`Successfully verified ${tokenData.nominees.full_name} as a trusted nominee!`);

      toast({
        title: "Verification Successful",
        description: "You have been verified as a trusted nominee.",
      });

    } catch (error: any) {
      console.error("Verification error:", error);
      setStatus("error");
      setMessage(error.message || "Failed to verify. Please try again or contact support.");

      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl p-8 text-center shadow-lg">
        {status === "verifying" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Verifying...</h1>
            <p className="text-muted-foreground">Please wait while we verify your email address.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold mb-2 text-green-700">Verification Successful!</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <p className="text-sm text-muted-foreground mb-6">
              You are now a verified nominee and may receive access to important documents in case of emergency.
            </p>
            <Button 
              onClick={() => navigate("/")} 
              className="w-full"
            >
              Close This Page
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold mb-2 text-destructive">Verification Failed</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button 
              onClick={() => navigate("/")} 
              variant="outline"
              className="w-full"
            >
              Close This Page
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyNominee;