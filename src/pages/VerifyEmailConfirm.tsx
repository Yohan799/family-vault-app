import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";

type VerificationStatus = "loading" | "success" | "expired" | "invalid";

const VerifyEmailConfirm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [status, setStatus] = useState<VerificationStatus>("loading");

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus("invalid");
        return;
      }

      try {
        // Fetch the token from database
        const { data: tokenData, error: fetchError } = await supabase
          .from('signup_verification_tokens')
          .select('*')
          .eq('token', token)
          .single();

        if (fetchError || !tokenData) {
          console.error('Token not found:', fetchError);
          setStatus("invalid");
          return;
        }

        // Check if token is already used
        if (tokenData.used_at) {
          setStatus("success"); // Already verified, show success
          return;
        }

        // Check if token is expired
        if (new Date(tokenData.expires_at) < new Date()) {
          setStatus("expired");
          return;
        }

        // Mark token as used
        const { error: updateTokenError } = await supabase
          .from('signup_verification_tokens')
          .update({ used_at: new Date().toISOString() })
          .eq('id', tokenData.id);

        if (updateTokenError) {
          console.error('Error updating token:', updateTokenError);
        }

        // Update profile to mark email as verified
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ email_verified: true })
          .eq('id', tokenData.user_id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          setStatus("invalid");
          return;
        }

        setStatus("success");
      } catch (error) {
        console.error('Verification error:', error);
        setStatus("invalid");
      }
    };

    verifyToken();
  }, [token]);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {t("auth.verifyEmail.verifying")}
              </h1>
              <p className="text-muted-foreground text-sm">
                {t("common.loading")}
              </p>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {t("auth.verifyEmail.success")}
              </h1>
              <p className="text-muted-foreground text-sm">
                {t("auth.verifyEmail.signInNow")}
              </p>
            </div>
            <Button
              onClick={() => navigate("/signin")}
              className="w-full h-12 rounded-2xl"
            >
              {t("auth.signIn")}
            </Button>
          </div>
        );

      case "expired":
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-yellow-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {t("auth.verifyEmail.expired")}
              </h1>
              <p className="text-muted-foreground text-sm">
                {t("auth.verifyEmail.expiredDesc")}
              </p>
            </div>
            <Button
              onClick={() => navigate("/signup")}
              className="w-full h-12 rounded-2xl"
            >
              {t("auth.signUp")}
            </Button>
          </div>
        );

      case "invalid":
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {t("auth.verifyEmail.invalid")}
              </h1>
              <p className="text-muted-foreground text-sm">
                {t("auth.verifyEmail.invalidDesc")}
              </p>
            </div>
            <Button
              onClick={() => navigate("/signup")}
              className="w-full h-12 rounded-2xl"
            >
              {t("auth.signUp")}
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default VerifyEmailConfirm;
