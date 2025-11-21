import { Home, Settings, ChevronRight, MoreVertical, User, Lock, Mail, Shield, Fingerprint, Smartphone, Bell, Clock, AlertTriangle, Users, Star, HelpCircle, MessageSquare, LogOut, Trash2, FileText, Download, Share2, Vault } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [toggleStates, setToggleStates] = useState({
    twoFactorAuth: false,
    biometric: false,
    pushNotifications: true,
    emailNotifications: false,
    timeCapsuleAlerts: true,
    securityAlerts: true,
    nomineeUpdates: true,
    vaultReminders: false,
  });

  const handleToggle = (key: string) => {
    const newState = !toggleStates[key as keyof typeof toggleStates];
    setToggleStates(prev => ({ ...prev, [key]: newState }));
    
    const messages: { [key: string]: { enabled: string; disabled: string } } = {
      twoFactorAuth: { 
        enabled: "Two-Factor Authentication Enabled", 
        disabled: "Two-Factor Authentication Disabled" 
      },
      biometric: { 
        enabled: "Biometric Login Enabled", 
        disabled: "Biometric Login Disabled" 
      },
      pushNotifications: { 
        enabled: "Push Notifications Enabled", 
        disabled: "Push Notifications Disabled" 
      },
      emailNotifications: { 
        enabled: "Email Notifications Enabled", 
        disabled: "Email Notifications Disabled" 
      },
      timeCapsuleAlerts: { 
        enabled: "Time Capsule Alerts Enabled", 
        disabled: "Time Capsule Alerts Disabled" 
      },
      securityAlerts: { 
        enabled: "Security Alerts Enabled", 
        disabled: "Security Alerts Disabled" 
      },
      nomineeUpdates: { 
        enabled: "Nominee Updates Enabled", 
        disabled: "Nominee Updates Disabled" 
      },
      vaultReminders: { 
        enabled: "Vault Reminders Enabled", 
        disabled: "Vault Reminders Disabled" 
      },
    };

    const message = messages[key];
    toast({
      title: newState ? message.enabled : message.disabled,
      duration: 2000,
    });
  };

  const accountSettings = [
    { icon: User, title: "Edit Profile", arrow: true, path: "/edit-profile" },
    { icon: Lock, title: "Change Password", arrow: true, path: "/change-password" },
    { icon: Mail, title: "Email Preferences", arrow: true, path: "/email-preferences" },
  ];

  const securitySettings = [
    { icon: Shield, title: "Two-Factor Authentication", subtitle: "Add an extra layer of security", toggle: "twoFactorAuth" },
    { icon: Fingerprint, title: "Biometric Login", subtitle: "Use fingerprint or face ID", toggle: "biometric" },
    { icon: Smartphone, title: "Active Sessions", arrow: true, path: "/active-sessions" },
  ];

  const notificationSettings = [
    { icon: Bell, title: "Push Notifications", subtitle: "Receive push notifications", toggle: "pushNotifications" },
    { icon: Mail, title: "Email Notifications", subtitle: "Receive email updates", toggle: "emailNotifications" },
    { icon: Clock, title: "Time Capsule Alerts", subtitle: "Get notified about time capsule activity", toggle: "timeCapsuleAlerts" },
    { icon: AlertTriangle, title: "Security Alerts", subtitle: "Important security updates", toggle: "securityAlerts" },
    { icon: Users, title: "Nominee Updates", subtitle: "Updates about nominee changes", toggle: "nomineeUpdates" },
    { icon: Star, title: "Vault Reminders", subtitle: "Reminders to update your vault", toggle: "vaultReminders" },
  ];

  const supportSettings = [
    { icon: HelpCircle, title: "Help Center", arrow: true, path: "/help-center" },
    { icon: MessageSquare, title: "Contact Support", arrow: true, path: "/contact-support" },
  ];

  const vaultSettings = [
    { icon: Clock, title: "Auto Lock Timeout", subtitle: "5 minutes", arrow: true, path: "/auto-lock-timeout" },
    { icon: Clock, title: "Backup Frequency", subtitle: "Weekly", arrow: true, path: "/backup-frequency" },
    { title: "App Version", subtitle: "2.0", showRight: true },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => toast({ title: "Export Data", description: "Your data export has started" })}>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: "Share Profile", description: "Profile sharing options opened" })}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: "Privacy Policy", description: "Opening privacy policy" })}>
                <FileText className="w-4 h-4 mr-2" />
                Privacy Policy
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Profile Section */}
        <button 
          onClick={() => navigate("/profile")}
          className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 hover:bg-accent transition-colors"
        >
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
                  onClick={() => setting.path && navigate(setting.path)}
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
                  onClick={() => setting.path && navigate(setting.path)}
                  className={`p-4 flex items-center gap-4 ${setting.arrow ? 'cursor-pointer hover:bg-accent transition-colors' : ''}`}
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{setting.title}</h3>
                    {setting.subtitle && (
                      <p className="text-sm text-muted-foreground">{setting.subtitle}</p>
                    )}
                  </div>
                  {setting.toggle ? (
                    <Switch 
                      checked={toggleStates[setting.toggle as keyof typeof toggleStates]} 
                      onCheckedChange={() => handleToggle(setting.toggle as string)}
                    />
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
                  <Switch 
                    checked={toggleStates[setting.toggle as keyof typeof toggleStates]} 
                    onCheckedChange={() => handleToggle(setting.toggle as string)}
                  />
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
                  onClick={() => setting.path && navigate(setting.path)}
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
                  onClick={() => setting.path && navigate(setting.path)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-accent transition-colors"
                >
                  {Icon && <Icon className="w-5 h-5 text-primary" />}
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-foreground">{setting.title}</h3>
                    {setting.subtitle && !setting.showRight && (
                      <p className="text-sm text-muted-foreground">{setting.subtitle}</p>
                    )}
                  </div>
                  {setting.showRight && setting.subtitle && (
                    <span className="text-sm text-muted-foreground">{setting.subtitle}</span>
                  )}
                  {setting.arrow && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Account Actions */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3 px-2">ACCOUNT ACTIONS</h2>
          <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
            <button
              onClick={() => {
                toast({
                  title: "Signed out",
                  description: "You have been successfully signed out",
                });
                navigate("/signin");
              }}
              className="w-full p-4 flex items-center gap-4 hover:bg-accent transition-colors"
            >
              <LogOut className="w-5 h-5 text-primary" />
              <span className="flex-1 text-left font-medium text-foreground">Sign Out</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                  toast({
                    title: "Account Deleted",
                    description: "Your account has been permanently deleted",
                    variant: "destructive",
                    duration: 2000,
                  });
                  setTimeout(() => {
                    navigate("/welcome");
                  }, 2000);
                }
              }}
              className="w-full p-4 flex items-center gap-4 hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-5 h-5 text-destructive" />
              <span className="flex-1 text-left font-medium text-destructive">Delete Account</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
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
            <Vault className="w-6 h-6" />
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
