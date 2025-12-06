import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PinPad } from "@/components/PinPad";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { savePin, saveLocalLockPreference, saveLocalPinHash, hashPin } from "@/services/appLockService";

const SetupPIN = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<"create" | "confirm">("create");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const currentPin = step === "create" ? pin : confirmPin;

  const handleNumberPress = (num: string) => {
    if (currentPin.length < 6) {
      if (step === "create") {
        setPin(prev => prev + num);
      } else {
        setConfirmPin(prev => prev + num);
      }
    }
  };

  const handleDelete = () => {
    if (step === "create") {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const handleContinue = () => {
    if (pin.length === 6) {
      setStep("confirm");
    }
  };

  const handleConfirm = async () => {
    if (!user) return;

    if (confirmPin.length === 6) {
      if (pin === confirmPin) {
        setIsLoading(true);
        try {
          // Save PIN to database
          await savePin(user.id, pin);

          // Save lock preference and PIN hash locally for pre-login lock
          await saveLocalLockPreference("pin");
          const pinHash = await hashPin(pin);
          await saveLocalPinHash(pinHash);

          toast({
            title: "PIN Lock Enabled",
            description: "Lock screen will show when you open the app",
          });
          navigate("/settings");
        } catch (error: any) {
          toast({
            title: "Failed to Save PIN",
            description: error.message,
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        toast({
          title: "PINs Don't Match",
          description: "Please try again",
          variant: "destructive",
        });
        setConfirmPin("");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => step === "confirm" ? setStep("create") : navigate("/app-lock-setup")}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">
            {step === "create" ? "Create PIN" : "Confirm PIN"}
          </h1>
        </div>

        {/* Lock Icon */}
        <div className="flex justify-center pt-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center space-y-1 pt-3">
          <h2 className="text-lg font-semibold text-foreground">
            {step === "create" ? "Create a 6-digit PIN" : "Confirm your PIN"}
          </h2>
          <p className="text-muted-foreground text-sm">
            {step === "create"
              ? "Enter a PIN you'll remember"
              : "Enter the same PIN again to confirm"}
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 py-4">
          {[...Array(6)].map((_, idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-colors ${idx < currentPin.length ? "bg-primary" : "bg-muted"
                }`}
            />
          ))}
        </div>

        {/* PIN Pad */}
        <div className="flex-1 flex flex-col justify-center">
          <PinPad
            onNumberPress={handleNumberPress}
            onDelete={handleDelete}
            disabled={isLoading}
          />
        </div>

        {/* Continue Button */}
        <div className="pb-4">
          {step === "create" && pin.length === 6 && (
            <Button
              onClick={handleContinue}
              className="w-full h-12 text-base font-semibold rounded-2xl"
            >
              Continue
            </Button>
          )}

          {step === "confirm" && confirmPin.length === 6 && (
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold rounded-2xl"
            >
              {isLoading ? "Saving..." : "Confirm PIN"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupPIN;
