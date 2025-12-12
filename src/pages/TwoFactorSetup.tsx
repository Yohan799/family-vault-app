import { useState } from "react";
import { Shield, Mail } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { NotificationTemplates } from "@/services/pushNotificationHelper";

const TwoFactorSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable2FA = async () => {
    if (!user || !profile?.email) {
      toast({
        title: t("toast.error"),
        description: t("twoFactorSetup.userNotFound"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-2fa-otp", {
        body: { email: profile.email, userId: user.id },
      });

      if (error) throw error;

      toast({
        title: t("twoFactorSetup.codeSent"),
        description: `${t("twoFactorSetup.checkEmail")} ${profile.email}`,
      });

      navigate("/two-factor-verify");
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      toast({
        title: t("twoFactorSetup.sendFailed"),
        description: error.message || t("common.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateProfile({ two_factor_enabled: false });

      if (user) {
        NotificationTemplates.twoFactorDisabled(user.id);
      }

      toast({
        title: t("twoFactorSetup.disabled"),
        description: t("twoFactorSetup.disabledDesc"),
      });
      navigate("/settings");
    } catch (error: any) {
      toast({
        title: t("twoFactorSetup.disableFailed"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pt-10">
          <BackButton to="/settings" />
          <h1 className="text-2xl font-bold text-foreground">{t("twoFactorSetup.title")}</h1>
        </div>

        {/* 2FA Card */}
        <div className="bg-card rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-primary" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">{t("twoFactorSetup.secureAccount")}</h2>
            <p className="text-muted-foreground">
              {t("twoFactorSetup.addExtraLayer")}
            </p>
          </div>

          <div className="space-y-4 bg-accent/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">{t("twoFactorSetup.emailVerification")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("twoFactorSetup.sendCodeTo")} <strong>{profile?.email}</strong> {t("twoFactorSetup.eachSignIn")}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="font-semibold text-foreground">{t("twoFactorSetup.howItWorks")}</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <p className="text-sm text-muted-foreground">{t("twoFactorSetup.step1")}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <p className="text-sm text-muted-foreground">{t("twoFactorSetup.step2")}</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <p className="text-sm text-muted-foreground">{t("twoFactorSetup.step3")}</p>
              </div>
            </div>
          </div>

          {profile?.two_factor_enabled ? (
            <Button
              onClick={handleDisable2FA}
              disabled={isLoading}
              variant="destructive"
              className="w-full h-12 text-base font-semibold rounded-2xl"
            >
              {isLoading ? t("twoFactorSetup.disabling") : t("twoFactorSetup.disableButton")}
            </Button>
          ) : (
            <Button
              onClick={handleEnable2FA}
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold rounded-2xl"
            >
              {isLoading ? t("twoFactorSetup.sendingCode") : t("twoFactorSetup.enableButton")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetup;