import { Eye, EyeOff } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { NotificationTemplates } from "@/services/pushNotificationHelper";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSave = async () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast({
        title: t("toast.allFieldsRequired"),
        description: t("toast.fillAllFields"),
        variant: "destructive"
      });
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: t("toast.passwordsDontMatch"),
        description: t("toast.passwordsMustMatch"),
        variant: "destructive"
      });
      return;
    }

    if (formData.newPassword.length < 8) {
      toast({
        title: t("toast.passwordTooShort"),
        description: t("toast.passwordMinLength"),
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Verify current password by attempting to sign in
      if (user?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: formData.currentPassword,
        });

        if (signInError) {
          toast({
            title: t("toast.currentPasswordIncorrect"),
            description: t("toast.checkCurrentPassword"),
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword
      });

      if (error) throw error;

      toast({
        title: t("toast.passwordChanged"),
        description: t("toast.passwordUpdated"),
      });

      // Send push notification about password change
      if (user) {
        NotificationTemplates.passwordChanged(user.id);
      }

      navigate("/settings");
    } catch (error: any) {
      toast({
        title: t("toast.errorChangingPassword"),
        description: error.message || t("toast.error"),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <BackButton to="/settings" />
          <h1 className="text-2xl font-bold">{t("changePassword.title")}</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("changePassword.currentPassword")}</label>
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                placeholder={t("changePassword.enterCurrent")}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                className="bg-card border-border pr-12"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("changePassword.newPassword")}</label>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder={t("changePassword.enterNew")}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                className="bg-card border-border pr-12"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("changePassword.confirmPassword")}</label>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder={t("changePassword.confirmNew")}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="bg-card border-border pr-12"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">
            {t("changePassword.requirements")}
          </p>
        </div>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-primary/20 hover:bg-primary/30 text-primary rounded-xl h-12"
        >
          {isLoading ? t("changePassword.updating") : t("changePassword.updatePassword")}
        </Button>
      </div>
    </div>
  );
};

export default ChangePassword;
