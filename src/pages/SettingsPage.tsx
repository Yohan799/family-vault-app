import { Home, FolderOpen, Settings, ChevronRight, MoreVertical, User, Lock, Mail, Shield, Fingerprint, Smartphone, Bell, Clock, AlertTriangle, Users, Star, HelpCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const navigate = useNavigate();

  const accountSettings = [
    { icon: User, title: "Edit Profile", arrow: true },
    { icon: Lock, title: "Change Password", arrow: true },
    { icon: Mail, title: "Email Preferences", arrow: true },
  ];

  const securitySettings = [
    { icon: Shield, title: "Two-Factor Authentication", subtitle: "Add an extra layer of security", arrow: true },
    { icon: Fingerprint, title: "Biometric Login", subtitle: "Use fingerprint or face ID", toggle: false },
    { icon: Smartphone, title: "Active Sessions", arrow: true },
  ];

  const notificationSettings = [
    { icon: Bell, title: "Push Notifications", subtitle: "Receive push notifications", toggle: true },
    { icon: Mail, title: "Email Notifications", subtitle: "Receive email updates", toggle: false },
    { icon: Clock, title: "Time Capsule Alerts", subtitle: "Get notified about time capsule activity", toggle: true },
    { icon: AlertTriangle, title: "Security Alerts", subtitle: "Important security updates", toggle: true },
    { icon: Users, title: "Nominee Updates", subtitle: "Updates about nominee changes", toggle: true },
    { icon: Star, title: "Vault Reminders", subtitle: "Reminders to update your vault", toggle: false },
  ];

  const supportSettings = [
    { icon: HelpCircle, title: "Help Center", arrow: true },
    { icon: MessageSquare, title: "Contact Support", arrow: true },
  ];

  const vaultSettings = [
    { icon: Clock, title: "Auto Lock Timeout", subtitle: "5 minutes", arrow: true },
    { icon: Clock, title: "Backup Frequency", arrow: true },
    { title: "App Version", subtitle: "2.0" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <Button variant="ghost" size="icon">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Section */}
        <button className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 hover:bg-accent transition-colors">
          <Avatar className="w-12 h-12 bg-primary">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              RK
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-foreground">Raj Kumar</h3>
            <p className="text-sm text-muted-foreground">raj@example.com</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Account Section */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">ACCOUNT</h2>
          <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
            {accountSettings.map((setting, index) => {
              const Icon = setting.icon;
              return (
                <button
                  key={index}
                  className="w-full p-4 flex items-center gap-4 hover:bg-accent transition-colors"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-left font-medium text-foreground">{setting.title}</span>
                  {setting.arrow && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Security & Privacy Section */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">SECURITY & PRIVACY</h2>
          <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
            {securitySettings.map((setting, index) => {
              const Icon = setting.icon;
              return (
                <div
                  key={index}
                  className="p-4 flex items-center gap-4"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{setting.title}</h3>
                    {setting.subtitle && (
                      <p className="text-sm text-muted-foreground">{setting.subtitle}</p>
                    )}
                  </div>
                  {setting.toggle !== undefined ? (
                    <Switch checked={setting.toggle} />
                  ) : setting.arrow ? (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications Section */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">NOTIFICATIONS</h2>
          <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
            {notificationSettings.map((setting, index) => {
              const Icon = setting.icon;
              return (
                <div
                  key={index}
                  className="p-4 flex items-center gap-4"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{setting.title}</h3>
                    <p className="text-sm text-muted-foreground">{setting.subtitle}</p>
                  </div>
                  <Switch checked={setting.toggle} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Help & Support Section */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">HELP & SUPPORT</h2>
          <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
            {supportSettings.map((setting, index) => {
              const Icon = setting.icon;
              return (
                <button
                  key={index}
                  className="w-full p-4 flex items-center gap-4 hover:bg-accent transition-colors"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="flex-1 text-left font-medium text-foreground">{setting.title}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Vault Settings Section */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">VAULT</h2>
          <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
            {vaultSettings.map((setting, index) => {
              const Icon = setting.icon;
              return (
                <button
                  key={index}
                  className="w-full p-4 flex items-center gap-4 hover:bg-accent transition-colors"
                >
                  {Icon && <Icon className="w-5 h-5 text-primary" />}
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-foreground">{setting.title}</h3>
                    {setting.subtitle && (
                      <p className="text-sm text-muted-foreground">{setting.subtitle}</p>
                    )}
                  </div>
                  {setting.arrow && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                </button>
              );
            })}
          </div>
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
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={() => navigate("/vault")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <FolderOpen className="w-6 h-6" />
            <span className="text-xs font-medium">Vault</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-primary">
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
