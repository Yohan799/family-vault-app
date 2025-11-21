import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const AutoLockTimeout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState("5");

  const options = [
    { value: "0.5", label: "30 seconds" },
    { value: "1", label: "1 minute" },
    { value: "5", label: "5 minutes" },
    { value: "10", label: "10 minutes" },
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
  ];

  const handleSave = () => {
    const selectedOption = options.find(opt => opt.value === selected);
    localStorage.setItem("autoLockTimeout", selectedOption?.label || "5 minutes");
    toast({
      title: "Auto-lock timeout updated!",
      description: `Vault will auto-lock after ${selectedOption?.label} of inactivity`,
    });
    navigate("/settings");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-primary-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Auto Lock Timeout</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-muted-foreground">
          Choose how long the app should wait before automatically locking for security.
        </p>

        <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelected(option.value)}
              className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors"
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
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default AutoLockTimeout;
