import { useState } from "react";
import { ArrowLeft, Lock, Fingerprint, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { updateLockType } from "@/services/appLockService";

const AppLockSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const lockOptions = [
    {
      type: "biometric" as const,
      icon: Fingerprint,
      title: "Biometric Lock",
      description: "Use fingerprint or Face ID (requires mobile app)",
    },
    {
      type: "pin" as const,
      icon: KeyRound,
      title: "PIN Lock",
      description: "Set a 6-digit PIN code",
    },
    {
      type: "password" as const,
      icon: Lock,
      title: "Password Lock",
      description: "Use your account password",
    },
  ];

  const handleSelectLockType = async (type: "biometric" | "pin" | "password") => {
    if (!user) return;

    if (type === "biometric") {
      toast({
        title: "Biometric Authentication",
        description: "This feature requires the native mobile app with Capacitor",
      });
      return;
    }

    if (type === "pin") {
      navigate("/setup-pin");
      return;
    }

    if (type === "password") {
      setIsLoading(true);
      try {
        await updateLockType(user.id, "password");
        toast({
          title: "Password Lock Enabled",
          description: "Your app will lock after inactivity",
        });
        navigate("/settings");
      } catch (error: any) {
        toast({
          title: "Failed to Enable Lock",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDisableLock = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateLockType(user.id, null);
      toast({
        title: "App Lock Disabled",
        description: "Your app will no longer lock automatically",
      });
      navigate("/settings");
    } catch (error: any) {
      toast({
        title: "Failed to Disable Lock",
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
            Add an extra layer of security by requiring authentication when opening the app after inactivity
          </p>
        </div>

        {/* Lock Options */}
        <div className="space-y-3">
          {lockOptions.map((option) => {
            const Icon = option.icon;
            const isActive = profile?.app_lock_type === option.type;

            return (
              <button
                key={option.type}
                onClick={() => handleSelectLockType(option.type)}
                disabled={isLoading}
                className={`w-full bg-card rounded-2xl p-5 text-left transition-all hover:shadow-md active:scale-98 ${
                  isActive ? "ring-2 ring-primary" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">{option.title}</h3>
                      {isActive && (
                        <span className="text-xs font-medium text-primary">Active</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Disable Button */}
        {profile?.app_lock_type && (
          <Button
            onClick={handleDisableLock}
            disabled={isLoading}
            variant="destructive"
            className="w-full h-12 text-base font-semibold rounded-2xl"
          >
            {isLoading ? "Disabling..." : "Disable App Lock"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AppLockSetup;