import { useState, useEffect } from "react";
import { Shield, Fingerprint, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinPad } from "@/components/PinPad";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { unlockApp, verifyPin, type AppLockType } from "@/services/appLockService";

interface LockScreenProps {
  lockType: AppLockType;
  onUnlock: () => void;
}

export const LockScreen = ({ lockType, onUnlock }: LockScreenProps) => {
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, signIn, profile } = useAuth();
  const { toast } = useToast();

  const handlePinPress = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length === 6 && user) {
      verifyPinAndUnlock();
    }
  }, [pin]);

  const verifyPinAndUnlock = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const isValid = await verifyPin(user.id, pin);
      if (isValid) {
        unlockApp();
        onUnlock();
        toast({
          title: "App Unlocked",
          description: "Welcome back!",
        });
      } else {
        toast({
          title: "Invalid PIN",
          description: "Please try again",
          variant: "destructive",
        });
        setPin("");
      }
    } catch (error) {
      console.error("PIN verification error:", error);
      toast({
        title: "Error",
        description: "Failed to verify PIN",
        variant: "destructive",
      });
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUnlock = async () => {
    if (!profile?.email || !password) return;

    setIsLoading(true);
    try {
      await signIn(profile.email, password);
      unlockApp();
      onUnlock();
      toast({
        title: "App Unlocked",
        description: "Welcome back!",
      });
    } catch (error) {
      toast({
        title: "Invalid Password",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setPassword("");
    }
  };

  const handleBiometricUnlock = async () => {
    // In production, integrate with @capacitor-community/biometric-auth
    toast({
      title: "Biometric Authentication",
      description: "Feature requires native mobile app",
    });
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">App Locked</h1>
          <p className="text-muted-foreground">
            {lockType === "pin" && "Enter your PIN to unlock"}
            {lockType === "password" && "Enter your password to unlock"}
            {lockType === "biometric" && "Use biometric authentication to unlock"}
          </p>
        </div>

        {lockType === "pin" && (
          <div className="space-y-6">
            <div className="flex justify-center gap-3">
              {[...Array(6)].map((_, idx) => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-colors ${
                    idx < pin.length ? "bg-primary" : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <PinPad
              onNumberPress={handlePinPress}
              onDelete={handlePinDelete}
              disabled={isLoading}
            />
          </div>
        )}

        {lockType === "password" && (
          <div className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordUnlock()}
                className="pl-12 bg-input border-0 h-14 rounded-2xl text-base"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handlePasswordUnlock}
              disabled={!password || isLoading}
              className="w-full h-14 text-base font-semibold rounded-2xl"
            >
              {isLoading ? "Unlocking..." : "Unlock"}
            </Button>
          </div>
        )}

        {lockType === "biometric" && (
          <Button
            onClick={handleBiometricUnlock}
            className="w-full h-14 text-base font-semibold rounded-2xl"
          >
            <Fingerprint className="w-5 h-5 mr-2" />
            Use Biometric
          </Button>
        )}
      </div>
    </div>
  );
};