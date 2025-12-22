import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { NotificationTemplates } from "@/services/pushNotificationHelper";
import { useLanguage } from "@/contexts/LanguageContext";

const VerifyNominee = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage(t("verifyNominee.invalidLink"));
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
        throw new Error(t("verifyNominee.invalidLink"));
      }

      // Check if token is expired
      const expiresAt = new Date(tokenData.expires_at);
      if (expiresAt < new Date()) {
        throw new Error(t("verifyNominee.invalidLink"));
      }

      // Mark token as used
      const { error: updateTokenError } = await supabase
        .from("verification_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("id", tokenData.id);

      if (updateTokenError) {
        throw new Error(t("verifyNominee.failed"));
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
        throw new Error(t("verifyNominee.failed"));
      }

      setStatus("success");
      setMessage(`${t("verifyNominee.successDesc")} - ${tokenData.nominees.full_name}`);

      // Send push notification to vault owner
      if (tokenData.nominees.user_id) {
        NotificationTemplates.nomineeVerified(
          tokenData.nominees.user_id,
          tokenData.nominees.full_name
        );
      }

      toast({
        title: t("verifyNominee.success"),
        description: t("verifyNominee.successDesc"),
      });

    } catch (error: any) {
      console.error("Verification error:", error);
      setStatus("error");
      setMessage(error.message || t("verifyNominee.failed"));

      toast({
        title: t("verifyNominee.failed"),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-2xl p-6 sm:p-8 text-center shadow-lg">
        {status === "verifying" && (
          <>
            <Loader2 className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-primary animate-spin" />
            <h1 className="text-xl sm:text-2xl font-bold mb-2">{t("verifyNominee.verifying")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground px-2">{t("verifyNominee.verifying")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-green-500" />
            <h1 className="text-xl sm:text-2xl font-bold mb-2 text-green-700">{t("verifyNominee.success")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">{message}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 px-2">
              {t("verifyNominee.successDesc")}
            </p>
            <Button
              onClick={() => navigate("/")}
              className="w-full h-11 sm:h-12 text-sm sm:text-base"
            >
              {t("common.close")}
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-destructive" />
            <h1 className="text-xl sm:text-2xl font-bold mb-2 text-destructive">{t("verifyNominee.failed")}</h1>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 px-2">{message}</p>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="w-full h-11 sm:h-12 text-sm sm:text-base"
            >
              {t("common.close")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyNominee;