import { useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { NotificationTemplates } from "@/services/pushNotificationHelper";

const TwoFactorVerify = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleVerify = async () => {
    if (!user || otp.length !== 6) return;

    setIsLoading(true);
    try {
      // Verify OTP
      const { data, error } = await supabase.functions.invoke("verify-2fa-otp", {
        body: { userId: user.id, otpCode: otp },
      });

      if (error) throw error;

      if (data.success) {
        // Enable 2FA in profile
        await updateProfile({ two_factor_enabled: true });

        // Send push notification
        NotificationTemplates.twoFactorEnabled(user.id);

        toast({
          title: t("twoFactor.enabled"),
          description: t("twoFactor.nowActive"),
        });
        navigate("/settings");
      } else {
        toast({
          title: t("twoFactor.invalidCode"),
          description: data.error || t("twoFactor.checkCode"),
          variant: "destructive",
        });
        setOtp("");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        title: t("twoFactor.verificationFailed"),
        description: error.message || t("common.tryAgain"),
        variant: "destructive",
      });
      setOtp("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!user || !profile?.email) return;

    setIsResending(true);
    try {
      // Get the current session to pass the JWT token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated. Please log in again.");
      }

      const { error } = await supabase.functions.invoke("send-2fa-otp", {
        body: { email: profile.email, userId: user.id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: t("twoFactor.codeResent"),
        description: t("twoFactor.newCodeSent"),
      });
    } catch (error: any) {
      toast({
        title: t("twoFactor.failedToResend"),
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
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-foreground">{t("twoFactor.enterCode")}</h1>
            <p className="text-muted-foreground">
              {t("twoFactor.codeSent")}<br />
              <strong>{profile?.email}</strong>
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={handleVerify}
              disabled={otp.length !== 6 || isLoading}
              className="w-full h-14 text-base font-semibold rounded-2xl"
            >
              {isLoading ? t("twoFactor.verifying") : t("twoFactor.verifyCode")}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">{t("twoFactor.didntReceive")}</p>
              <Button
                variant="ghost"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-primary hover:text-primary/80 font-medium"
              >
                {isResending ? t("twoFactor.sending") : t("twoFactor.resendCode")}
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={() => navigate("/settings")}
              className="w-full"
            >
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerify;