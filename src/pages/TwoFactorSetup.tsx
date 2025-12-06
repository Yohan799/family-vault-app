import { useState } from "react";
import { ArrowLeft, Shield, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const TwoFactorSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnable2FA = async () => {
    if (!user || !profile?.email) {
      toast({
        title: "Error",
        description: "User information not found",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Send OTP to user's email
      const { data, error } = await supabase.functions.invoke("send-2fa-otp", {
        body: { email: profile.email, userId: user.id },
      });

      if (error) throw error;

      toast({
        title: "Verification Code Sent",
        description: `Please check your email at ${profile.email}`,
      });

      // Navigate to verification page
      navigate("/two-factor-verify");
    } catch (error: any) {
      console.error("Failed to send OTP:", error);
      toast({
        title: "Failed to Send Code",
        description: error.message || "Please try again",
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
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled",
      });
      navigate("/settings");
    } catch (error: any) {
      toast({
        title: "Failed to Disable 2FA",
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
        <div className="flex items-center gap-3 pt-4">
          <button onClick={() => navigate("/settings")} className="p-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Two-Factor Authentication</h1>
        </div>

        {/* 2FA Card */}
        <div className="bg-card rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-primary" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Secure Your Account</h2>
            <p className="text-muted-foreground">
              Add an extra layer of security by requiring a verification code when signing in
            </p>
          </div>

          <div className="space-y-4 bg-accent/50 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-foreground">Email Verification</p>
                <p className="text-sm text-muted-foreground">
                  We'll send a 6-digit code to <strong>{profile?.email}</strong> each time you sign in
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="font-semibold text-foreground">How it works:</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <p className="text-sm text-muted-foreground">Sign in with your email and password</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <p className="text-sm text-muted-foreground">Receive a verification code via email</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <p className="text-sm text-muted-foreground">Enter the code to complete sign in</p>
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
              {isLoading ? "Disabling..." : "Disable Two-Factor Authentication"}
            </Button>
          ) : (
            <Button
              onClick={handleEnable2FA}
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold rounded-2xl"
            >
              {isLoading ? "Sending Code..." : "Enable Two-Factor Authentication"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetup;