import { useState, useEffect } from "react";
import { Shield, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { passwordSchema } from "@/lib/validation";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  // Get email and resetToken from navigation state (OTP flow)
  const email = location.state?.email;
  const resetToken = location.state?.resetToken;

  useEffect(() => {
    // If no email/token in state, redirect to forgot password
    if (!email || !resetToken) {
      navigate("/forgot-password");
    }
  }, [email, resetToken, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t("toast.passwordsDontMatch"),
        description: t("toast.passwordsMustMatch"),
        variant: "destructive",
      });
      return;
    }

    // Validate password strength
    const passwordValidation = passwordSchema.safeParse(formData.password);
    if (!passwordValidation.success) {
      toast({
        title: t("toast.error"),
        description: passwordValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-password-with-token", {
        body: { 
          email, 
          resetToken, 
          newPassword: formData.password 
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || t("resetPassword.failed"));
      }

      toast({
        title: t("resetPassword.success"),
        description: t("resetPassword.successDesc"),
      });
      navigate("/signin");
    } catch (error: any) {
      const errorMessage = error.message || t("resetPassword.failed");
      toast({
        title: t("resetPassword.failed"),
        description: errorMessage.includes("token")
          ? t("resetPassword.sessionExpired")
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!email || !resetToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              {t("resetPassword.title")}
            </h1>
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-muted-foreground text-base">
              {t("resetPassword.enterNew")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("resetPassword.newPassword")}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pl-12 pr-12 bg-input border-0 h-14 rounded-2xl text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("resetPassword.confirmNew")}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                className="pl-12 pr-12 bg-input border-0 h-14 rounded-2xl text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="bg-accent/50 border border-border rounded-2xl p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">{t("resetPassword.requirements.title")}</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>{t("resetPassword.requirements.length")}</li>
                <li>{t("resetPassword.requirements.uppercase")}</li>
                <li>{t("resetPassword.requirements.lowercase")}</li>
                <li>{t("resetPassword.requirements.number")}</li>
                <li>{t("resetPassword.requirements.special")}</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-semibold rounded-2xl"
              disabled={isLoading}
            >
              {isLoading ? t("resetPassword.resetting") : t("resetPassword.reset")}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t("resetPassword.rememberPassword")}{" "}
              <button
                type="button"
                onClick={() => navigate("/signin")}
                className="text-primary hover:underline font-medium"
              >
                {t("auth.signIn")}
              </button>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
