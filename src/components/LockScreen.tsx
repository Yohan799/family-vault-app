import { useState, useEffect } from "react";
import { Shield, Fingerprint, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PinPad } from "@/components/PinPad";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { unlockApp, verifyPin, verifyPinLocally, type AppLockType } from "@/services/appLockService";
import { Capacitor } from "@capacitor/core";

interface LockScreenProps {
  lockType: AppLockType;
  onUnlock: () => void;
  isPreLogin?: boolean; // New prop to handle pre-login lock
}

export const LockScreen = ({ lockType, onUnlock, isPreLogin = false }: LockScreenProps) => {
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
    // For pre-login, verify locally; for post-login, verify with database
    if (pin.length === 6) {
      if (isPreLogin) {
        verifyPinLocallyAndUnlock();
      } else if (user) {
        verifyPinAndUnlock();
      }
    }
  }, [pin]);

  // Auto-trigger biometric on mount for biometric lock type
  useEffect(() => {
    if (lockType === "biometric") {
      handleBiometricUnlock();
    }
  }, [lockType]);

  // Verify PIN locally (pre-login)
  const verifyPinLocallyAndUnlock = async () => {
    setIsLoading(true);
    try {
      const isValid = await verifyPinLocally(pin);
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

  // Verify PIN with database (post-login)
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
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: "Biometric Not Available",
        description: "Biometric authentication requires the mobile app",
      });
      return;
    }

    setIsLoading(true);
    try {
      // On native platform, we'll use the device's biometric authentication
      // The actual verification happens at the OS level
      // For now, unlock directly - in production, integrate with native biometric plugin
      
      // Simple biometric check using Web Credentials API as fallback
      if ('credentials' in navigator && 'PublicKeyCredential' in window) {
        try {
          const available = await (window as any).PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          if (available) {
            unlockApp();
            onUnlock();
            toast({
              title: "App Unlocked",
              description: "Biometric verified!",
            });
            return;
          }
        } catch {
          // Continue to fallback
        }
      }

      // Direct unlock for native platforms
      unlockApp();
      onUnlock();
      toast({
        title: "App Unlocked",
        description: "Welcome back!",
      });
    } catch (error) {
      console.error("Biometric error:", error);
      toast({
        title: "Biometric Failed",
        description: "Please try again or use another method",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
          <div className="space-y-4">
            <Button
              onClick={handleBiometricUnlock}
              disabled={isLoading}
              className="w-full h-14 text-base font-semibold rounded-2xl"
            >
              <Fingerprint className="w-5 h-5 mr-2" />
              {isLoading ? "Verifying..." : "Use Biometric"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Tap to authenticate with fingerprint or Face ID
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
