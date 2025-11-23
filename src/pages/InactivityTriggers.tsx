import { ArrowLeft, Shield, Clock, Mail, Phone, MessageSquare, Home, Lock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const InactivityTriggers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    isActive: false,
    inactiveDays: 60,
    customMessage: "",
    emailEnabled: true,
    smsEnabled: true,
  });

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("inactivityTriggerSettings");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings(parsed);
      } catch (error) {
        console.error("Error loading inactivity trigger settings:", error);
      }
    }

    const savedUserSettings = localStorage.getItem("userSettings");
    if (savedUserSettings) {
      try {
        const parsed = JSON.parse(savedUserSettings);
        if (parsed.inactivityTriggerActive !== undefined) {
          setSettings(prev => ({ ...prev, isActive: parsed.inactivityTriggerActive }));
        }
      } catch (error) {
        console.error("Error loading user settings:", error);
      }
    }
  }, []);

  const handleSave = () => {
    if (settings.isActive && (!settings.customMessage || !settings.inactiveDays)) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (settings.inactiveDays < 1) {
      toast({
        title: "Invalid input",
        description: "Inactive days must be at least 1",
        variant: "destructive"
      });
      return;
    }

    // Save to localStorage
    localStorage.setItem("inactivityTriggerSettings", JSON.stringify(settings));

    // Update user settings
    const userSettings = JSON.parse(localStorage.getItem("userSettings") || "{}");
    userSettings.inactivityTriggerActive = settings.isActive;
    localStorage.setItem("userSettings", JSON.stringify(userSettings));

    // Trigger dashboard update
    window.dispatchEvent(new Event("countsUpdated"));

    toast({
      title: "Settings saved!",
      description: settings.isActive
        ? `You'll be alerted if inactive for more than ${settings.inactiveDays} days`
        : "Inactivity trigger has been disabled",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/10 p-6 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate("/dashboard")} className="p-1">
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">Inactivity Trigger</h1>
            <p className="text-sm text-muted-foreground mt-1">Set up activity monitoring</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status Card */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${settings.isActive ? "bg-green-100" : "bg-gray-100"
                }`}>
                <Shield className={`w-6 h-6 ${settings.isActive ? "text-green-600" : "text-gray-400"
                  }`} />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Inactivity Monitoring</h2>
                <p className="text-sm text-muted-foreground">
                  {settings.isActive ? "Currently Active" : "Currently Inactive"}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.isActive}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, isActive: checked }))}
            />
          </div>

          {settings.isActive && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm">
              <p className="text-foreground font-medium">
                ⚡ Alert will be triggered if inactive for more than {settings.inactiveDays} days
              </p>
            </div>
          )}
        </div>

        {/* Settings Form */}
        <div className="bg-card rounded-2xl p-6 space-y-4 border border-border">
          <h2 className="text-lg font-bold text-foreground mb-4">Trigger Settings</h2>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Inactive Days Threshold *
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="number"
                min="1"
                placeholder="e.g., 60"
                value={settings.inactiveDays}
                onChange={(e) => setSettings(prev => ({ ...prev, inactiveDays: parseInt(e.target.value) || 0 }))}
                className="bg-background border-border pl-12"
                disabled={!settings.isActive}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Number of days of inactivity before alerts are sent
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Custom Alert Message *
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Textarea
                placeholder="Enter the message to send when inactive..."
                value={settings.customMessage}
                onChange={(e) => setSettings(prev => ({ ...prev, customMessage: e.target.value }))}
                className="bg-background border-border pl-12 min-h-24"
                disabled={!settings.isActive}
                rows={4}
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-sm font-medium text-foreground">Notification Methods</label>

            <div className="flex items-center justify-between p-3 bg-background rounded-xl">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Send alerts via email</p>
                </div>
              </div>
              <Switch
                checked={settings.emailEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailEnabled: checked }))}
                disabled={!settings.isActive}
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-background rounded-xl">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium text-foreground">SMS Notifications</p>
                  <p className="text-xs text-muted-foreground">Send alerts via text message</p>
                </div>
              </div>
              <Switch
                checked={settings.smsEnabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsEnabled: checked }))}
                disabled={!settings.isActive}
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 mt-4"
          >
            Save Settings
          </Button>
        </div>

        {/* How It Works */}
        <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            How Inactivity Trigger Works
          </h3>

          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
                1
              </div>
              <div>
                <p className="font-medium text-foreground">Days 1-3: User Alerts</p>
                <p className="text-muted-foreground">
                  You'll receive daily alerts via email and SMS for 3 consecutive days
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
                2
              </div>
              <div>
                <p className="font-medium text-foreground">Days 4-6: Nominee Alerts</p>
                <p className="text-muted-foreground">
                  If you don't respond, your nominees will receive daily notifications for 3 days
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
                3
              </div>
              <div>
                <p className="font-medium text-foreground">Verification & Access</p>
                <p className="text-muted-foreground">
                  Nominees verify with OTP and gain access to documents you've shared with them
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-sm">i</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Important Note</h3>
            <p className="text-sm text-muted-foreground">
              This feature requires Supabase integration to work. Once set up, the system will automatically
              monitor your activity and send alerts according to your configured settings.
            </p>
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
            <Lock className="w-6 h-6" />
            <span className="text-xs font-medium">Vault</span>
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InactivityTriggers;
