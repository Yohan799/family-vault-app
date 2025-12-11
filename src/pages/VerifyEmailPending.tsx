import { useState, useEffect } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

const VerifyEmailPending = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  
  // Get email from location state
  const email = location.state?.email || "";
  const name = location.state?.name || "";
  const userId = location.state?.userId || "";

  // Handle cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResendEmail = async () => {
    if (cooldown > 0 || !userId || !email) return;

    setIsResending(true);
    try {
      const { error } = await supabase.functions.invoke('send-signup-verification', {
        body: { user_id: userId, email, name }
      });

      if (error) throw error;

      toast({
        title: t("auth.verifyEmail.resent"),
        description: t("auth.verifyEmail.checkInbox"),
      });
      setCooldown(60); // 60 second cooldown
    } catch (error: any) {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8">
        <div className="space-y-6 text-center">
          {/* Animated mail icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center animate-pulse">
              <Mail className="w-12 h-12 text-primary" strokeWidth={2} />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              {t("auth.verifyEmail.checkInbox")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("auth.verifyEmail.sentTo")}
            </p>
            {email && (
              <p className="text-foreground font-medium">{email}</p>
            )}
          </div>

          <div className="bg-muted/50 rounded-2xl p-4 text-sm text-muted-foreground">
            <p>{t("auth.verifyEmail.clickLink")}</p>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={handleResendEmail}
              disabled={isResending || cooldown > 0}
              className="w-full h-12 rounded-2xl"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.loading")}
                </>
              ) : cooldown > 0 ? (
                `${t("auth.verifyEmail.resend")} (${cooldown}s)`
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {t("auth.verifyEmail.resend")}
                </>
              )}
            </Button>

            <button
              onClick={() => navigate("/signin")}
              className="text-sm text-primary hover:underline font-medium"
            >
              {t("auth.verifyEmail.backToSignIn")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPending;
