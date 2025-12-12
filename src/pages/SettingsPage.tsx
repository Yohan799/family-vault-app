import { Lock, Mail, Bell, HelpCircle, LogOut, Trash2, Home, ChevronRight, Vault, Settings, Globe, Fingerprint, KeyRound, MonitorSmartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/services/activityLogService";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SettingsSkeleton } from "@/components/skeletons";
import { registerDevice, unregisterDevice, isPushAvailable } from "@/services/pushNotificationService";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, user, signOut, updateProfile } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const [toggleStates, setToggleStates] = useState({
    pushNotifications: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isTogglingPush, setIsTogglingPush] = useState(false);

  // Load push notification state from profile
  useEffect(() => {
    if (profile) {
      setToggleStates({
        pushNotifications: profile.push_notifications_enabled ?? false,
      });
    }
  }, [profile]);

  const handlePushToggle = async () => {
    if (!user || isTogglingPush) return;

    setIsTogglingPush(true);
    const newValue = !toggleStates.pushNotifications;

    // Optimistic update
    setToggleStates((prev) => ({ ...prev, pushNotifications: newValue }));

    try {
      if (newValue) {
        // Enable push notifications
        if (isPushAvailable()) {
          const registered = await registerDevice(user.id);
          if (!registered) {
            // Rollback on failure
            setToggleStates((prev) => ({ ...prev, pushNotifications: false }));
            toast({
              variant: "destructive",
              title: "Permission Denied",
              description: "Please enable notifications in your device settings",
              duration: 3000,
            });
            setIsTogglingPush(false);
            return;
          }
        }

        // Update profile
        await updateProfile({ push_notifications_enabled: true });
        toast({
          title: "Push Notifications Enabled",
          description: "You'll receive alerts on this device",
          duration: 2000,
        });
      } else {
        // Disable push notifications
        if (isPushAvailable()) {
          await unregisterDevice(user.id);
        }

        // Update profile
        await updateProfile({ push_notifications_enabled: false });
        toast({
          title: "Push Notifications Disabled",
          duration: 2000,
        });
      }

      // Log activity
      await logActivity(user.id, "settings_updated", "profile", user.id);
    } catch (error: any) {
      // Rollback on error
      setToggleStates((prev) => ({ ...prev, pushNotifications: !newValue }));
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update push notification settings",
      });
    } finally {
      setIsTogglingPush(false);
    }
  };

  const handleSignOut = async () => {
    try {
      // Unregister device token before signing out
      if (user && isPushAvailable()) {
        await unregisterDevice(user.id);
      }
      await signOut();
      toast({ title: t("toast.signedOut"), description: t("toast.signedOut.description") });
      navigate("/signin");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("toast.error"),
        description: error.message || "Failed to sign out",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-user-account", {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      // Clear all local storage for fresh start
      localStorage.removeItem('onboardingComplete');
      localStorage.removeItem('app_lock_type');
      localStorage.removeItem('app_pin_hash');
      localStorage.removeItem('app_lock_session_unlocked');
      localStorage.removeItem('userPreferences');
      localStorage.removeItem('language');

      toast({
        title: t("toast.accountDeleted"),
        description: t("toast.accountDeleted.description"),
      });

      // Sign out and redirect to onboarding with full page reload for clean state
      await signOut();
      setIsDeleting(false);
      setShowDeleteDialog(false);

      // Force full page reload to /onboarding for clean navigation stack (critical for APK)
      window.location.href = "/onboarding";
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("toast.deleteFailed"),
        description: error.message || "Failed to delete account",
      });
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Flattened list of settings
  const settings = [
    // Account
    { icon: Lock, title: t("settings.changePassword"), subtitle: t("settings.changePassword.subtitle"), path: "/change-password", color: "bg-blue-100" },
    { icon: Mail, title: t("settings.emailPreferences"), subtitle: t("settings.emailPreferences.subtitle"), path: "/email-preferences", color: "bg-indigo-100" },

    // Security
    { icon: KeyRound, title: t("settings.twoFactorAuth"), subtitle: profile?.two_factor_enabled ? t("settings.twoFactorAuth.enabled") : t("settings.twoFactorAuth.subtitle"), path: "/two-factor-setup", color: "bg-purple-100" },
    { icon: Fingerprint, title: t("settings.appLock"), subtitle: profile?.app_lock_type ? `${t("settings.appLock.active")} (${profile.app_lock_type})` : t("settings.appLock.subtitle"), path: "/app-lock-setup", color: "bg-violet-100" },
    { icon: MonitorSmartphone, title: t("settings.activeSessions"), subtitle: t("settings.activeSessions.subtitle"), path: "/active-sessions", color: "bg-rose-100" },

    // Notifications
    { icon: Bell, title: t("settings.pushNotifications"), subtitle: isPushAvailable() ? t("settings.pushNotifications.subtitle") : t("settings.pushNotifications.mobileOnly"), toggle: "pushNotifications", color: "bg-amber-100" },



    // Language
    { icon: Globe, title: t("settings.language"), subtitle: currentLanguage.nativeName, path: "/language-settings", color: "bg-orange-100" },

    // Support
    { icon: HelpCircle, title: t("settings.helpSupport"), subtitle: t("settings.helpSupport.subtitle"), path: "/help-center", color: "bg-cyan-100" },
  ];

  if (!profile) {
    return <SettingsSkeleton />;
  }

  const displayName = profile.full_name || "User";
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/20 text-foreground p-6 pt-10 rounded-b-3xl mb-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("settings.subtitle")}</p>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* Profile Card */}
        <button
          onClick={() => navigate("/profile")}
          className="w-full bg-card rounded-xl p-4 flex items-center gap-4 hover:bg-accent transition-colors mb-2"
        >
          <Avatar className="w-12 h-12 bg-primary">
            {profile.profile_image_url && <AvatarImage src={profile.profile_image_url} alt="Profile" />}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-foreground">{displayName}</h3>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Settings List */}
        <div className="space-y-2">
          {settings.map((setting, index) => {
            const Icon = setting.icon;
            const isPushToggle = setting.toggle === "pushNotifications";
            return (
              <div
                key={index}
                onClick={() => setting.path && navigate(setting.path)}
                className={`w-full bg-card rounded-xl p-3 flex items-center gap-3 ${setting.path ? 'cursor-pointer hover:bg-accent transition-colors' : ''}`}
              >
                <div className={`w-10 h-10 ${setting.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{setting.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{setting.subtitle}</p>
                </div>

                {isPushToggle ? (
                  <Switch
                    checked={toggleStates.pushNotifications}
                    onCheckedChange={handlePushToggle}
                    disabled={isTogglingPush || !isPushAvailable()}
                    className="scale-90"
                  />
                ) : setting.path ? (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Danger Zone */}
        <div className="pt-4 space-y-2">
          <button
            onClick={handleSignOut}
            className="w-full bg-card rounded-xl p-3 flex items-center gap-3 hover:bg-accent transition-colors text-foreground"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-gray-600" />
            </div>
            <span className="font-semibold text-sm">{t("settings.signOut")}</span>
          </button>

          <button
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
            className="w-full bg-card rounded-xl p-3 flex items-center gap-3 hover:bg-red-50 transition-colors text-destructive disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <span className="font-semibold text-sm">
              {isDeleting ? t("settings.deleting") : t("settings.deleteAccount")}
            </span>
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeleteAccount}
          title={t("settings.deleteAccount.title")}
          description={t("settings.deleteAccount.description")}
          confirmText={t("settings.deleteAccount.confirm")}
          variant="destructive"
        />

        <div className="text-center text-xs text-muted-foreground pt-4 pb-2">
          {t("settings.appVersion")}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.home")}</span>
          </button>
          <button
            onClick={() => navigate("/vault")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Vault className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.vault")}</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-primary relative">
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.settings")}</span>
            <div className="absolute -bottom-2 w-12 h-1 bg-primary rounded-full" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
