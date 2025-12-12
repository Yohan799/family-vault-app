import { useState, useEffect } from "react";
import { Fingerprint, KeyRound } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { updateLockType, saveLocalLockPreference, clearLocalLockPreferences } from "@/services/appLockService";
import { Capacitor } from "@capacitor/core";

const AppLockSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
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
      if (Capacitor.isNativePlatform()) {
        setIsLoading(true);
        try {
          await updateLockType(user.id, "biometric");
          await saveLocalLockPreference("biometric");
          setBiometricEnabled(true);
          setPinEnabled(false);
          await refreshProfile?.();
          toast({
            title: t("appLock.biometricEnabled"),
            description: t("appLock.lockScreenWillShow"),
          });
        } catch (error: any) {
          toast({
            title: t("appLock.biometricFailed"),
            description: error.message,
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        toast({
          title: t("appLock.biometricNotAvailable"),
          description: t("appLock.requiresMobileApp"),
        });
      }
    } else {
      setIsLoading(true);
      try {
        await updateLockType(user.id, null);
        await clearLocalLockPreferences();
        setBiometricEnabled(false);
        await refreshProfile?.();
        toast({
          title: t("appLock.biometricDisabled"),
          description: t("appLock.appWillOpenWithoutAuth"),
        });
      } catch (error: any) {
        toast({
          title: t("toast.error"),
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
      navigate("/setup-pin");
    } else {
      setIsLoading(true);
      try {
        await updateLockType(user.id, null);
        await clearLocalLockPreferences();
        setPinEnabled(false);
        await refreshProfile?.();
        toast({
          title: t("appLock.pinDisabled"),
          description: t("appLock.appWillOpenWithoutAuth"),
        });
      } catch (error: any) {
        toast({
          title: t("toast.error"),
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
        <div className="flex items-center gap-3 pt-10">
          <BackButton to="/settings" />
          <h1 className="text-2xl font-bold text-foreground">{t("appLock.title")}</h1>
        </div>

        {/* Description */}
        <div className="bg-accent/50 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            {t("appLock.description")}
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
                <h3 className="font-semibold text-foreground">{t("appLock.biometricLock")}</h3>
                <p className="text-sm text-muted-foreground">{t("appLock.useFingerprintOrFace")}</p>
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
                <h3 className="font-semibold text-foreground">{t("appLock.pinLock")}</h3>
                <p className="text-sm text-muted-foreground">{t("appLock.set6DigitPin")}</p>
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
              {t("appLock.lockActiveMessage")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppLockSetup;
