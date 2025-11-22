import { Lock, Mail, Shield, Fingerprint, Bell, ShieldAlert, HelpCircle, MessageSquare, LogOut, Trash2, LockKeyhole, Home, ChevronRight, User, Vault, Settings, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    fullName: "Guest User",
    email: "guest@example.com",
    profileImage: null as string | null,
  });
  const [toggleStates, setToggleStates] = useState({
    twoFactorAuth: false,
    biometric: false,
    pushNotifications: false,
    securityAlerts: false,
  });

  const [autoLockTimeout, setAutoLockTimeout] = useState(
    localStorage.getItem("autoLockTimeout") || "5 minutes"
  );

  useEffect(() => {
    const loadSettings = () => {
      const savedProfile = localStorage.getItem("profileData");
      if (savedProfile) {
        const data = JSON.parse(savedProfile);
        setProfileData({
          fullName: data.fullName || "Guest User",
          email: data.email || "guest@example.com",
          profileImage: null,
        });
      }
      const savedPhoto = localStorage.getItem("currentProfilePhoto");
      if (savedPhoto) {
        setProfileData(prev => ({ ...prev, profileImage: savedPhoto }));
      }
      setAutoLockTimeout(localStorage.getItem("autoLockTimeout") || "5 minutes");
    };
    loadSettings();
  }, []);

  const handleToggle = (key: string) => {
    const newState = !toggleStates[key as keyof typeof toggleStates];
    setToggleStates(prev => ({ ...prev, [key]: newState }));

    const messages: { [key: string]: { enabled: string; disabled: string } } = {
      twoFactorAuth: { enabled: "Two-Factor Auth Enabled", disabled: "Two-Factor Auth Disabled" },
      biometric: { enabled: "Biometric Login Enabled", disabled: "Biometric Login Disabled" },
      pushNotifications: { enabled: "Push Notifications Enabled", disabled: "Push Notifications Disabled" },
      securityAlerts: { enabled: "Security Alerts Enabled", disabled: "Security Alerts Disabled" },
    };

    const message = messages[key];
    toast({
      title: newState ? message.enabled : message.disabled,
      duration: 2000,
    });
  };

  // Flattened list of settings for "Quick Action" style
  const settings = [
    // Account
    { icon: Lock, title: "Change Password", subtitle: "Update your password", path: "/change-password", color: "bg-blue-100" },
    { icon: Mail, title: "Email Preferences", subtitle: "Manage email settings", path: "/email-preferences", color: "bg-indigo-100" },

    // Security (Toggles)
    { icon: ShieldAlert, title: "Two-Factor Auth", subtitle: "Extra security layer", toggle: "twoFactorAuth", color: "bg-purple-100" },
    { icon: Fingerprint, title: "Biometric Login", subtitle: "FaceID / Fingerprint", toggle: "biometric", color: "bg-pink-100" },

    // Notifications (Toggles)
    { icon: Bell, title: "Push Notifications", subtitle: "Get mobile alerts", toggle: "pushNotifications", color: "bg-amber-100" },
    { icon: Shield, title: "Security Alerts", subtitle: "Critical updates", toggle: "securityAlerts", color: "bg-orange-100" },

    // Vault
    { icon: LockKeyhole, title: "Auto Lock Timeout", subtitle: autoLockTimeout, path: "/auto-lock-timeout", color: "bg-emerald-100" },

    // Support
    { icon: HelpCircle, title: "Help Center", subtitle: "FAQs and guides", path: "/help-center", color: "bg-cyan-100" },
    { icon: MessageSquare, title: "Contact Support", subtitle: "Get help", path: "/contact-support", color: "bg-teal-100" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your preferences</p>
          </div>
          <button className="text-foreground hover:text-foreground/70 transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* Profile Card - Restored */}
        <button
          onClick={() => navigate("/profile")}
          className="w-full bg-card rounded-xl p-4 flex items-center gap-4 hover:bg-accent transition-colors mb-2"
        >
          <Avatar className="w-12 h-12 bg-primary">
            {profileData.profileImage && <AvatarImage src={profileData.profileImage} alt="Profile" />}
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-foreground">{profileData.fullName}</h3>
            <p className="text-sm text-muted-foreground">{profileData.email}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Settings List - Quick Action Style */}
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
                    onCheckedChange={() => handleToggle(setting.toggle as string)}
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
            onClick={() => {
              toast({ title: "Signed out", description: "See you soon!" });
              navigate("/signin");
            }}
            className="w-full bg-card rounded-xl p-3 flex items-center gap-3 hover:bg-accent transition-colors text-foreground"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
              <LogOut className="w-5 h-5 text-gray-600" />
            </div>
            <span className="font-semibold text-sm">Sign Out</span>
          </button>

          <button
            onClick={() => {
              if (confirm("Delete account? This cannot be undone.")) {
                toast({ title: "Account Deleted", variant: "destructive" });
                navigate("/welcome");
              }
            }}
            className="w-full bg-card rounded-xl p-3 flex items-center gap-3 hover:bg-red-50 transition-colors text-destructive"
          >
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-5 h-5 text-destructive" />
            </div>
            <span className="font-semibold text-sm">Delete Account</span>
          </button>
        </div>

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
