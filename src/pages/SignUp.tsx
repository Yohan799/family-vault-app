import { useState, useEffect } from "react";
import { Shield, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { z } from "zod";
import { passwordSchema, sanitizeInput } from "@/lib/validation";

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, signInWithGoogle, user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    const nameValidation = z
      .string()
      .min(2, t("auth.name"))
      .max(100, t("auth.name"))
      .regex(/^[a-zA-Z\s]+$/, t("auth.name"))
      .safeParse(sanitizeInput(formData.name));

    if (!nameValidation.success) {
      toast({
        title: t("toast.error"),
        description: nameValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    // Validate email
    const emailValidation = z
      .string()
      .email(t("auth.email"))
      .safeParse(formData.email.toLowerCase());

    if (!emailValidation.success) {
      toast({
        title: t("toast.error"),
        description: emailValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    // Validate password
    const passwordValidation = passwordSchema.safeParse(formData.password);

    if (!passwordValidation.success) {
      toast({
        title: t("toast.error"),
        description: passwordValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    // Check password match
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: t("toast.error"),
        description: t("security.pinMismatch"),
        variant: "destructive",
      });
      return;
    }

    setIsEmailLoading(true);
    try {
      const { userId } = await signUp(formData.email.toLowerCase(), formData.password, formData.name);
      toast({
        title: t("toast.success"),
        description: t("auth.verifyEmail.sentTo"),
      });
      // Navigate to pending verification page with email info
      navigate("/verify-email-pending", { 
        state: { 
          email: formData.email.toLowerCase(),
          name: formData.name,
          userId
        },
        replace: true 
      });
    } catch (error: any) {
      const errorMessage = error.message || t("toast.error");
      toast({
        title: t("toast.error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: t("toast.success"),
        description: t("auth.signUpWithGoogle"),
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Don't render form if already authenticated
  if (!authLoading && user) {
    return null;
  }

  const isAnyLoading = isEmailLoading || isGoogleLoading;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-6">
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{t("auth.signUp")}</h1>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-primary" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-muted-foreground text-sm">{t("auth.createFamily")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t("auth.name")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="pl-12 bg-input border-0 h-12 rounded-2xl text-base"
                required
                disabled={isAnyLoading}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder={t("auth.email")}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-12 bg-input border-0 h-12 rounded-2xl text-base"
                required
                disabled={isAnyLoading}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.password")}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-12 pr-12 bg-input border-0 h-12 rounded-2xl text-base"
                required
                disabled={isAnyLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("auth.confirmPassword")}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="pl-12 pr-12 bg-input border-0 h-12 rounded-2xl text-base"
                required
                disabled={isAnyLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold rounded-2xl" disabled={isAnyLoading}>
              {isEmailLoading ? t("auth.creatingAccount") : t("auth.signUp")}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-3 text-muted-foreground">{t("auth.or")}</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full min-h-[48px] h-auto py-3 px-5 text-sm sm:text-base font-medium rounded-2xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 shadow-sm hover:shadow transition-all flex items-center justify-center gap-3"
              onClick={handleGoogleSignUp}
              disabled={isAnyLoading}
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-5 h-5 shrink-0 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  <span>{t("auth.signingUp")}</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>{t("auth.signUpWithGoogle")}</span>
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              {t("auth.alreadyHaveAccount")}{" "}
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

export default SignUp;