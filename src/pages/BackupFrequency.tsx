import { Check } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";

const BackupFrequency = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [selected, setSelected] = useState("weekly");

  useEffect(() => {
    if (profile?.backup_frequency) {
      setSelected(profile.backup_frequency);
    }
  }, [profile]);

  const options = [
    { value: "regularly", label: t("backupFrequency.regularly"), subtitle: t("backupFrequency.regularlyDesc") },
    { value: "weekly", label: t("backupFrequency.weekly"), subtitle: t("backupFrequency.weeklyDesc") },
    { value: "monthly", label: t("backupFrequency.monthly"), subtitle: t("backupFrequency.monthlyDesc") },
    { value: "manual", label: t("backupFrequency.manual"), subtitle: t("backupFrequency.manualDesc") },
    { value: "automatic", label: t("backupFrequency.automatic"), subtitle: t("backupFrequency.automaticDesc") },
  ];

  const handleSave = async () => {
    try {
      await updateProfile({ backup_frequency: selected });

      const selectedOption = options.find(o => o.value === selected);
      toast({
        title: t("backupFrequency.updated"),
        description: `${t("backupFrequency.willBePerformed")} ${selectedOption?.label.toLowerCase()}`,
      });
      navigate("/settings");
    } catch (error) {
      console.error('Error updating backup frequency:', error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("backupFrequency.updateFailed"),
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/20 text-foreground p-6 pt-4 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <BackButton to="/settings" />
          <h1 className="text-2xl font-bold">{t("backupFrequency.title")}</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-muted-foreground">
          {t("backupFrequency.description")}
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
          {t("backupFrequency.saveChanges")}
        </Button>
      </div>
    </div>
  );
};

export default BackupFrequency;
