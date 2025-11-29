import { useState } from "react";
import { Shield, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
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
        title: "Invalid Email",
        description: emailValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(email.toLowerCase());
      setEmailSent(true);
      toast({
        title: "Reset Email Sent",
        description: "Check your inbox for the password reset link",
      });
    } catch (error: any) {
      toast({
        title: "Failed to Send Reset Email",
        description: error.message || "Please try again later",
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
            <button
              onClick={() => navigate("/signin")}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Sign In
            </button>
            <h1 className="text-3xl font-bold text-foreground">
              Forgot Password?
            </h1>
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" strokeWidth={2.5} />
              </div>
            </div>
            <p className="text-muted-foreground text-base">
              {emailSent
                ? "Reset link sent to your email"
                : "Enter your email to receive a password reset link"}
            </p>
          </div>

          {!emailSent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Enter your email"
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
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-accent/50 border border-border rounded-2xl p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  If an account exists with <strong className="text-foreground">{email}</strong>,
                  you'll receive a password reset link shortly.
                </p>
              </div>
              <Button
                onClick={() => {
                  setEmailSent(false);
                  setEmail("");
                }}
                variant="outline"
                className="w-full h-14 text-base font-medium rounded-2xl"
              >
                Send Another Link
              </Button>
              <Button
                onClick={() => navigate("/signin")}
                variant="ghost"
                className="w-full h-14 text-base font-medium rounded-2xl"
              >
                Back to Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
