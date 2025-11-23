import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const BackupFrequency = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState("weekly");

  const options = [
    { value: "regularly", label: "Regularly", subtitle: "Backup every day" },
    { value: "weekly", label: "Weekly", subtitle: "Backup once a week" },
    { value: "monthly", label: "Monthly", subtitle: "Backup once a month" },
    { value: "manual", label: "Manual Backup", subtitle: "Only when you choose" },
    { value: "automatic", label: "Automatic", subtitle: "Smart automatic backups" },
  ];

  const handleSave = () => {
    const selectedOption = options.find(o => o.value === selected);
    localStorage.setItem("backupFrequency", selectedOption?.label || "Weekly");
    toast({
      title: "Backup frequency updated!",
      description: `Backups will be performed ${selectedOption?.label.toLowerCase()}`,
    });
    navigate("/settings");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-primary-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Backup Frequency</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-muted-foreground">
          Choose how often your vault data should be backed up automatically.
        </p>

        <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelected(option.value)}
              className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors"
            >
              <div className="text-left">
                <p className="font-medium text-foreground">{option.label}</p>
                <p className="text-sm text-muted-foreground">{option.subtitle}</p>
              </div>
              {selected === option.value && (
                <Check className="w-5 h-5 text-primary flex-shrink-0 ml-4" />
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

export default BackupFrequency;
