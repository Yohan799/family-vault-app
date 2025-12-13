import { Check } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Capacitor } from "@capacitor/core";

// Storage key for auto-lock seconds
const AUTO_LOCK_STORAGE_KEY = "auto_lock_seconds";

// Get stored auto-lock seconds
const getStoredAutoLockSeconds = async (): Promise<number> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key: AUTO_LOCK_STORAGE_KEY });
      return value ? parseInt(value, 10) : 300; // Default 5 minutes
    } catch {
      return 300;
    }
  }
  const stored = localStorage.getItem(AUTO_LOCK_STORAGE_KEY);
  return stored ? parseInt(stored, 10) : 300;
};

// Save auto-lock seconds
const saveAutoLockSeconds = async (seconds: number): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key: AUTO_LOCK_STORAGE_KEY, value: seconds.toString() });
    } catch (error) {
      console.error("Error saving auto-lock setting:", error);
      throw error;
    }
    return;
  }
  localStorage.setItem(AUTO_LOCK_STORAGE_KEY, seconds.toString());
};

const AutoLockTimeout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selected, setSelected] = useState("300"); // Default 5 minutes = 300 seconds
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Values stored as seconds (integers)
  const options = [
    { value: "5", label: `5 ${t("common.seconds")}` },
    { value: "10", label: `10 ${t("common.seconds")}` },
    { value: "15", label: `15 ${t("common.seconds")}` },
    { value: "20", label: `20 ${t("common.seconds")}` },
    { value: "25", label: `25 ${t("common.seconds")}` },
    { value: "30", label: `30 ${t("common.seconds")}` },
    { value: "60", label: `1 ${t("common.minute")}` },
    { value: "120", label: `2 ${t("common.minutes")}` },
    { value: "300", label: `5 ${t("common.minutes")}` },
  ];

  useEffect(() => {
    // Load stored setting on mount
    getStoredAutoLockSeconds().then((seconds) => {
      setSelected(seconds.toString());
      setIsLoading(false);
    });
  }, []);

  const handleSave = async () => {
    const selectedOption = options.find(opt => opt.value === selected);
    const seconds = parseInt(selected, 10);

    setIsSaving(true);
    try {
      await saveAutoLockSeconds(seconds);

      // Dispatch event so other components know about the change
      window.dispatchEvent(new CustomEvent("autoLockSettingChanged", { detail: { seconds } }));

      toast({
        title: t("autoLock.updated"),
        description: `${t("autoLock.willLockAfter")} ${selectedOption?.label}`,
      });
      navigate("/settings");
    } catch (error) {
      console.error('Error updating auto-lock timeout:', error);
      toast({
        title: t("autoLock.updateFailed"),
        description: t("autoLock.couldNotSave"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/20 text-foreground p-6 pt-14 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <BackButton to="/settings" />
          <h1 className="text-2xl font-bold">{t("autoLock.title")}</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-muted-foreground">
          {t("autoLock.description")}
        </p>

        <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelected(option.value)}
              disabled={isLoading}
              className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors disabled:opacity-50"
            >
              <span className="font-medium text-foreground">{option.label}</span>
              {selected === option.value && (
                <Check className="w-5 h-5 text-primary" />
              )}
            </button>
          ))}
        </div>

        <Button
          onClick={handleSave}
          disabled={isSaving || isLoading}
          className="w-full bg-primary/20 hover:bg-primary/30 text-primary rounded-xl h-12"
        >
          {isSaving ? t("common.loading") : t("common.save")}
        </Button>
      </div>
    </div>
  );
};

export default AutoLockTimeout;

// Export helper functions for other components
export { getStoredAutoLockSeconds, saveAutoLockSeconds, AUTO_LOCK_STORAGE_KEY };

