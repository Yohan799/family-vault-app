import { useState } from "react";
import { Shield } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const PasswordResetOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const email = location.state?.email;

  // Redirect if no email in state
  if (!email) {
    navigate("/forgot-password");
    return null;
  }

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: t("passwordReset.invalidOtp"),
        description: t("passwordReset.enter6Digit"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verify-password-reset-otp", {
        body: { email, otp },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || t("passwordReset.invalidOrExpired"));
      }

      toast({
        title: t("passwordReset.otpVerified"),
        description: t("passwordReset.setNewPassword"),
      });

      navigate("/reset-password", {
        state: { email, resetToken: data.resetToken }
      });
    } catch (error: any) {
      toast({
        title: t("passwordReset.verificationFailed"),
        description: error.message || t("passwordReset.invalidOrExpired"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-password-reset-otp", {
        body: { email },
      });

      if (error) throw error;

      toast({
        title: t("passwordReset.otpResent"),
        description: t("passwordReset.checkEmail"),
      });
      setOtp("");
    } catch (error: any) {
      toast({
        title: t("passwordReset.resendFailed"),
        description: error.message || t("common.tryAgain"),
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
            <div className="flex items-center gap-2 mb-2">
              <BackButton to="/forgot-password" />
              <span className="text-sm text-muted-foreground">{t("common.back")}</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("auth.enterOtp")}
            </h1>
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-muted-foreground text-base">
              {t("twoFactor.codeSent")}
            </p>
            <p className="text-foreground font-medium">{email}</p>
          </div>

          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(value) => setOtp(value)}
            >
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
            className="w-full h-14 text-base font-semibold rounded-2xl"
            disabled={isLoading || otp.length !== 6}
          >
            {isLoading ? t("twoFactor.verifying") : t("auth.verify")}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t("twoFactor.didntReceive")}{" "}
              <button
                onClick={handleResend}
                disabled={isResending}
                className="text-primary hover:underline font-medium disabled:opacity-50"
              >
                {isResending ? t("twoFactor.sending") : t("auth.resendOtp")}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetOTP;
