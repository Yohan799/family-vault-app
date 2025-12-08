import { useState } from "react";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { NotificationTemplates } from "@/services/pushNotificationHelper";

const TwoFactorVerify = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, updateProfile } = useAuth();
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
          title: "2FA Enabled",
          description: "Two-factor authentication is now active",
        });
        navigate("/settings");
      } else {
        toast({
          title: "Invalid Code",
          description: data.error || "Please check your code and try again",
          variant: "destructive",
        });
        setOtp("");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification Failed",
        description: error.message || "Please try again",
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
      const { error } = await supabase.functions.invoke("send-2fa-otp", {
        body: { email: profile.email, userId: user.id },
      });

      if (error) throw error;

      toast({
        title: "Code Resent",
        description: "A new verification code has been sent to your email",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Resend",
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
            <h1 className="text-3xl font-bold text-foreground">Enter Verification Code</h1>
            <p className="text-muted-foreground">
              We've sent a 6-digit code to<br />
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
              {isLoading ? "Verifying..." : "Verify Code"}
            </Button>

            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
              <Button
                variant="ghost"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-primary hover:text-primary/80 font-medium"
              >
                {isResending ? "Sending..." : "Resend Code"}
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={() => navigate("/settings")}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerify;