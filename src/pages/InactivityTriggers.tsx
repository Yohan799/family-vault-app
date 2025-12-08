import { useState, useEffect } from "react";
import { Shield, Clock, AlertTriangle, Mail, MessageSquare, Info, Home, Vault, Settings } from "lucide-react";
import BackButton from "@/components/BackButton";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDaysSinceActivity } from "@/lib/activityTracking";

const InactivityTriggers = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [settings, setSettings] = useState({
        isActive: false,
        inactiveDays: 7,
        customMessage: "",
        emailEnabled: true,
        smsEnabled: false,
    });
    const [daysSinceActivity, setDaysSinceActivity] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        loadSettings();
    }, [user]);

    const loadSettings = async () => {
        if (!user) return;

        try {
            setLoading(true);

            // Load from database
            const { data, error } = await supabase
                .from("inactivity_triggers")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (error && error.code !== "PGRST116") {
                console.error("Error loading settings:", error);
                toast.error("Failed to load settings");
                return;
            }

            if (data) {
                setSettings({
                    isActive: data.is_active ?? false,
                    inactiveDays: data.inactive_days_threshold ?? 7,
                    customMessage: data.custom_message ?? "",
                    emailEnabled: data.email_enabled ?? true,
                    smsEnabled: data.sms_enabled ?? false,
                });
            }

            // Get days since last activity
            const days = await getDaysSinceActivity(user.id);
            setDaysSinceActivity(days);
        } catch (err) {
            console.error("Error in loadSettings:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) {
            toast.error("You must be logged in");
            return;
        }

        if (settings.inactiveDays < 1 || settings.inactiveDays > 365) {
            toast.error("Inactivity threshold must be between 1 and 365 days");
            return;
        }

        try {
            // Save to database
            const { error } = await supabase.from("inactivity_triggers").upsert(
                {
                    user_id: user.id,
                    is_active: settings.isActive,
                    inactive_days_threshold: settings.inactiveDays,
                    custom_message: settings.customMessage || null,
                    email_enabled: settings.emailEnabled,
                    sms_enabled: settings.smsEnabled,
                    last_activity_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id",
                }
            );

            if (error) {
                console.error("Error saving settings:", error);
                toast.error("Failed to save settings");
                return;
            }

            // Dispatch custom event to update dashboard
            window.dispatchEvent(new CustomEvent("inactivityTriggerUpdated"));

            toast.success("Inactivity trigger settings saved successfully");
            await loadSettings(); // Reload to get updated data
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Failed to save settings");
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-primary/10 p-6 rounded-b-3xl">
                <div className="flex items-center gap-4 mb-4">
                    <BackButton />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground">Inactivity Trigger</h1>
                        <p className="text-sm text-muted-foreground mt-1">Set up emergency monitoring</p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Status Card */}
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-primary/10">
                                <Shield className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">
                                    Trigger Status: {settings.isActive ? "Active" : "Inactive"}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {settings.isActive
                                        ? `Your account is being monitored. Alerts will be sent after ${settings.inactiveDays} days of inactivity.`
                                        : "Monitoring is currently disabled. Enable it to activate emergency protocols."}
                                </p>
                                {settings.isActive && (
                                    <div className="mt-3 p-3 bg-background rounded-lg border">
                                        <p className="text-sm font-medium">
                                            Last activity: {daysSinceActivity === 0 ? "Today" : `${daysSinceActivity} days ago`}
                                        </p>
                                        {daysSinceActivity > 0 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {daysSinceActivity >= settings.inactiveDays
                                                    ? "⚠️ Emergency protocols may be activated"
                                                    : `${settings.inactiveDays - daysSinceActivity} days until alert`}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Settings Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Trigger Settings</CardTitle>
                        <CardDescription>Configure your emergency monitoring system</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Enable Monitoring</Label>
                                <p className="text-sm text-muted-foreground">Activate inactivity tracking</p>
                            </div>
                            <Switch
                                checked={settings.isActive}
                                onCheckedChange={(checked) => {
                                    setSettings((prev) => ({ ...prev, isActive: checked }));
                                    toast.success(
                                        checked ? "Inactivity trigger turned on" : "Inactivity trigger turned off",
                                        { duration: 2000 }
                                    );
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="days">Inactive Days Threshold</Label>
                            <Input
                                id="days"
                                type="number"
                                min="1"
                                max="365"
                                value={settings.inactiveDays}
                                onChange={(e) =>
                                    setSettings((prev) => ({
                                        ...prev,
                                        inactiveDays: parseInt(e.target.value) || 1,
                                    }))
                                }
                                disabled={!settings.isActive}
                            />
                            <p className="text-xs text-muted-foreground">
                                Days of inactivity before emergency protocols begin (1-365)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Custom Alert Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Enter a custom message for your alerts..."
                                value={settings.customMessage}
                                onChange={(e) =>
                                    setSettings((prev) => ({ ...prev, customMessage: e.target.value }))
                                }
                                disabled={!settings.isActive}
                                rows={4}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Notification Methods</Label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">Email Notifications</p>
                                            <p className="text-xs text-muted-foreground">Receive alerts via email</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={settings.emailEnabled}
                                        onCheckedChange={(checked) =>
                                            setSettings((prev) => ({ ...prev, emailEnabled: checked }))
                                        }
                                        disabled={!settings.isActive}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">SMS Notifications</p>
                                            <p className="text-xs text-muted-foreground">Receive alerts via SMS</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={settings.smsEnabled}
                                        onCheckedChange={(checked) =>
                                            setSettings((prev) => ({ ...prev, smsEnabled: checked }))
                                        }
                                        disabled={!settings.isActive}
                                    />
                                </div>
                            </div>
                        </div>

                        <Button onClick={handleSave} disabled={loading} className="w-full">
                            {loading ? "Saving..." : "Save Settings"}
                        </Button>
                    </CardContent>
                </Card>

                {/* How It Works */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            How Inactivity Trigger Works
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                1
                            </div>
                            <div>
                                <p className="font-medium">Days 1-3: User Alerts</p>
                                <p className="text-sm text-muted-foreground">
                                    You'll receive daily alerts to check in
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                2
                            </div>
                            <div>
                                <p className="font-medium">Days 4-6: Nominee Alerts</p>
                                <p className="text-sm text-muted-foreground">
                                    Your nominees will be notified if you don't respond
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                3
                            </div>
                            <div>
                                <p className="font-medium">Day 7+: Emergency Access</p>
                                <p className="text-sm text-muted-foreground">
                                    Verified nominees gain access to shared documents via OTP
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Box */}
                <div className="p-4 rounded-lg bg-muted border flex gap-3">
                    <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium mb-1">Important Note</p>
                        <p className="text-sm text-muted-foreground">
                            This system automatically monitors your activity. Make sure you have verified nominees
                            and have granted them access to specific documents.
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
                        <Vault className="w-6 h-6" />
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