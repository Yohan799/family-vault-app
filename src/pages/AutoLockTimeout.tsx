import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const AutoLockTimeout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, updateProfile } = useAuth();
  const [selected, setSelected] = useState("5");
  const [isSaving, setIsSaving] = useState(false);

  const options = [
    { value: "1", label: "1 minute" },
    { value: "5", label: "5 minutes" },
    { value: "10", label: "10 minutes" },
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
  ];

  // Load current value from profile on mount
  useEffect(() => {
    if (profile?.auto_lock_minutes) {
      setSelected(profile.auto_lock_minutes.toString());
    }
  }, [profile]);

  const handleSave = async () => {
    const selectedOption = options.find(opt => opt.value === selected);
    const minutes = parseFloat(selected);
    
    setIsSaving(true);
    try {
      await updateProfile({ auto_lock_minutes: minutes });
      
      toast({
        title: "Auto-lock timeout updated!",
        description: `Vault will auto-lock after ${selectedOption?.label} of inactivity`,
      });
      navigate("/settings");
    } catch (error) {
      console.error('Error updating auto-lock timeout:', error);
      toast({
        title: "Failed to update",
        description: "Could not save auto-lock timeout setting",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/settings")} className="p-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
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
          disabled={isSaving}
          className="w-full bg-primary/20 hover:bg-primary/30 text-primary rounded-xl h-12"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default AutoLockTimeout;
