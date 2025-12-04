import { useState, useEffect } from "react";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const SignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signInWithGoogle, user, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailValidation = z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address")
      .safeParse(formData.email.toLowerCase());

    if (!emailValidation.success) {
      toast({
        title: "Invalid Email",
        description: emailValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    if (!formData.password || formData.password.length < 1) {
      toast({
        title: "Password Required",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setIsEmailLoading(true);
    try {
      await signIn(formData.email.toLowerCase(), formData.password);
      
      // Check if 2FA is enabled (profile will be loaded by AuthContext)
      const { data: profileData } = await supabase
        .from('profiles')
        .select('two_factor_enabled')
        .eq('email', formData.email.toLowerCase())
        .single();

      if (profileData?.two_factor_enabled) {
        // Redirect to 2FA verification
        navigate("/two-factor-verify");
      } else {
        toast({
          title: "Welcome back!",
          description: "Successfully signed in",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      const errorMessage = error.message || "Invalid email or password";
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "Welcome back!",
        description: "Signed in with Google",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Google sign in failed",
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
      <div className="w-full max-w-md bg-card rounded-3xl shadow-xl p-8">
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-foreground">
              Sign In
            </h1>
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-muted-foreground text-base">Secure Your Family's Legacy</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="pl-12 bg-input border-0 h-14 rounded-2xl text-base"
                required
                disabled={isAnyLoading}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="pl-12 pr-12 bg-input border-0 h-14 rounded-2xl text-base"
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

            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate("/forgot-password")}
                className="text-sm text-primary hover:underline font-medium"
              >
                Forgot Password?
              </button>
            </div>

            <Button type="submit" className="w-full h-14 text-base font-semibold rounded-2xl" disabled={isAnyLoading}>
              {isEmailLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card px-3 text-muted-foreground">OR</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-14 text-base font-medium rounded-2xl bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 shadow-sm hover:shadow transition-all"
              onClick={handleGoogleSignIn}
              disabled={isAnyLoading}
            >
              {isGoogleLoading ? (
                <>
                  <div className="w-5 h-5 mr-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
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
                  Sign in with Google
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/signup")}
                className="text-primary hover:underline font-medium"
              >
                Create an account
              </button>
            </p>
          </form>
        </div>
      </div>
    </div >
  );
};

export default SignIn;
