import { Lock, Mail, Shield, Bell, HelpCircle, LogOut, Trash2, LockKeyhole, Home, ChevronRight, Vault, Settings, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { logActivity } from "@/services/activityLogService";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmDialog } from "@/components/ConfirmDialog";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, user, signOut } = useAuth();
  const [toggleStates, setToggleStates] = useState({
    pushNotifications: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const getAutoLockLabel = (minutes: number | null | undefined): string => {
    if (!minutes) return "5 minutes";
    if (minutes === 1) return "1 minute";
    return `${minutes} minutes`;
  };

  useEffect(() => {
    // Load settings from localStorage
    const savedUserSettings = localStorage.getItem("userSettings");
    let localSettings: any = {};
    
    if (savedUserSettings) {
      try {
        localSettings = JSON.parse(savedUserSettings);
      } catch (error) {
        console.error("Error parsing saved settings:", error);
      }
    }

    setToggleStates({
      pushNotifications: localSettings.pushNotifications ?? true,
    });
  }, [profile]);

  const handleToggle = async (key: keyof typeof toggleStates) => {
    const newValue = !toggleStates[key];
    setToggleStates((prev) => ({ ...prev, [key]: newValue }));

    // Store settings in localStorage
    const savedUserSettings = localStorage.getItem("userSettings");
    let localSettings: any = {};
    
    if (savedUserSettings) {
      try {
        localSettings = JSON.parse(savedUserSettings);
      } catch (error) {
        console.error("Error parsing saved settings:", error);
      }
    }

    localSettings = { ...localSettings, [key]: newValue };
    localStorage.setItem("userSettings", JSON.stringify(localSettings));

    const messages: { [key: string]: { enabled: string; disabled: string } } = {
      pushNotifications: { enabled: "Push Notifications Enabled", disabled: "Push Notifications Disabled" },
    };

    const message = messages[key];
    toast({
      title: newValue ? message.enabled : message.disabled,
      duration: 2000,
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: "Signed out", description: "See you soon!" });
      navigate("/signin");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
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

      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted",
      });
      navigate("/welcome");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Delete Failed",
        description: error.message || "Failed to delete account",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Flattened list of settings
  const settings = [
    // Account
    { icon: Lock, title: "Change Password", subtitle: "Update your password", path: "/change-password", color: "bg-blue-100" },
    { icon: Mail, title: "Email Preferences", subtitle: "Manage email settings", path: "/email-preferences", color: "bg-indigo-100" },

    // Security
    { icon: Shield, title: "Two-Factor Auth", subtitle: profile?.two_factor_enabled ? "Enabled" : "Extra security layer", path: "/two-factor-setup", color: "bg-purple-100" },
    { icon: Smartphone, title: "App Lock", subtitle: profile?.app_lock_type ? `Active (${profile.app_lock_type})` : "PIN or Biometric", path: "/app-lock-setup", color: "bg-violet-100" },

    // Notifications
    { icon: Bell, title: "Push Notifications", subtitle: "Get mobile alerts", toggle: "pushNotifications", color: "bg-amber-100" },

    // Vault
    { icon: LockKeyhole, title: "Auto Lock Timeout", subtitle: getAutoLockLabel(profile?.auto_lock_minutes), path: "/auto-lock-timeout", color: "bg-emerald-100" },

    // Support
    { icon: HelpCircle, title: "Help & Support", subtitle: "FAQs, guides & contact", path: "/help-center", color: "bg-cyan-100" },
  ];

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
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
      <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl mb-4">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your preferences</p>
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

                {setting.toggle ? (
                  <Switch
                    checked={toggleStates[setting.toggle as keyof typeof toggleStates]}
                    onCheckedChange={() => handleToggle(setting.toggle as keyof typeof toggleStates)}
                    className="scale-90"
                  />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
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
            <span className="font-semibold text-sm">Sign Out</span>
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
              {isDeleting ? "Deleting..." : "Delete Account"}
            </span>
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onConfirm={handleDeleteAccount}
          title="Delete Account"
          description="Are you sure you want to delete your account? This action cannot be undone. All your data, documents, and settings will be permanently deleted."
          confirmText="Delete Account"
          variant="destructive"
        />

        <div className="text-center text-xs text-muted-foreground pt-4 pb-2">
          App Version 2.0.0
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center h-14 max-w-md mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => navigate("/vault")}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground"
          >
            <Vault className="w-5 h-5" />
            <span className="text-[10px] font-medium">Vault</span>
          </button>
          <button className="flex flex-col items-center gap-0.5 text-primary">
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
