import { useState } from "react";
import { Shield, Mail } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { z } from "zod";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailValidation = z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address")
      .safeParse(email.toLowerCase());

    if (!emailValidation.success) {
      toast({
        title: t("forgotPassword.invalidEmail"),
        description: emailValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-password-reset-otp", {
        body: { email: email.toLowerCase() },
      });

      if (error) throw error;

      toast({
        title: t("forgotPassword.otpSent"),
        description: t("forgotPassword.checkEmailForCode"),
      });

      // Navigate to OTP entry page
      navigate("/password-reset-otp", { state: { email: email.toLowerCase() } });
    } catch (error: any) {
      toast({
        title: t("forgotPassword.sendFailed"),
        description: error.message || t("common.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <BackButton to="/signin" />
              <span className="text-sm text-muted-foreground">{t("auth.signIn")}</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("auth.forgotPassword")}
            </h1>
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-muted-foreground text-base">
              {t("forgotPassword.checkEmailForCode")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder={t("auth.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 bg-input border-0 h-14 rounded-2xl text-base"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold rounded-2xl"
              disabled={isLoading}
            >
              {isLoading ? t("common.loading") : t("auth.resetPassword")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
