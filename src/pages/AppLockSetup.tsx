import { useState, useEffect } from "react";
import { ArrowLeft, Fingerprint, KeyRound } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { updateLockType, saveLocalLockPreference, clearLocalLockPreferences } from "@/services/appLockService";
import { Capacitor } from "@capacitor/core";

const AppLockSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);

  useEffect(() => {
    if (profile?.app_lock_type) {
      setBiometricEnabled(profile.app_lock_type === "biometric");
      setPinEnabled(profile.app_lock_type === "pin");
    }
  }, [profile]);

  const handleBiometricToggle = async (enabled: boolean) => {
    if (!user) return;

    if (enabled) {
      // Check if biometric is available on native platform
      if (Capacitor.isNativePlatform()) {
        setIsLoading(true);
        try {
          await updateLockType(user.id, "biometric");
          await saveLocalLockPreference("biometric"); // Save locally for pre-login lock
          setBiometricEnabled(true);
          setPinEnabled(false);
          await refreshProfile?.();
          toast({
            title: "Biometric Lock Enabled",
            description: "Lock screen will show when you open the app",
          });
        } catch (error: any) {
          toast({
            title: "Failed to Enable Biometric",
            description: error.message,
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        toast({
          title: "Biometric Not Available",
          description: "Biometric authentication requires the mobile app",
        });
      }
    } else {
      // Disable biometric
      setIsLoading(true);
      try {
        await updateLockType(user.id, null);
        await clearLocalLockPreferences(); // Clear local preferences
        setBiometricEnabled(false);
        await refreshProfile?.();
        toast({
          title: "Biometric Lock Disabled",
          description: "App will open without authentication",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePinToggle = async (enabled: boolean) => {
    if (!user) return;

    if (enabled) {
      // Navigate to PIN setup
      navigate("/setup-pin");
    } else {
      // Disable PIN
      setIsLoading(true);
      try {
        await updateLockType(user.id, null);
        await clearLocalLockPreferences(); // Clear local preferences
        setPinEnabled(false);
        await refreshProfile?.();
        toast({
          title: "PIN Lock Disabled",
          description: "App will open without authentication",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={() => navigate("/settings")}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">App Lock</h1>
        </div>

        {/* Description */}
        <div className="bg-accent/50 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            Add an extra layer of security by requiring authentication when opening the app
          </p>
        </div>

        {/* Lock Options */}
        <div className="space-y-3">
          {/* Biometric Lock Toggle */}
          <div className="bg-card rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Fingerprint className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-foreground">Biometric Lock</h3>
                <p className="text-sm text-muted-foreground">Use fingerprint or Face ID</p>
              </div>
              <Switch
                checked={biometricEnabled}
                onCheckedChange={handleBiometricToggle}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* PIN Lock Toggle */}
          <div className="bg-card rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-semibold text-foreground">PIN Lock</h3>
                <p className="text-sm text-muted-foreground">Set a 6-digit PIN code</p>
              </div>
              <Switch
                checked={pinEnabled}
                onCheckedChange={handlePinToggle}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Info */}
        {(biometricEnabled || pinEnabled) && (
          <div className="bg-primary/10 rounded-xl p-4">
            <p className="text-sm text-primary font-medium">
              App lock is active. You'll need to authenticate when opening the app.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppLockSetup;
