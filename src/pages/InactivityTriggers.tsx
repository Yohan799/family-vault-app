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
import { useLanguage } from "@/contexts/LanguageContext";
import { getDaysSinceActivity } from "@/lib/activityTracking";

const InactivityTriggers = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
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

            const { data, error } = await supabase
                .from("inactivity_triggers")
                .select("*")
                .eq("user_id", user.id)
                .single();

            if (error && error.code !== "PGRST116") {
                console.error("Error loading settings:", error);
                toast.error(t("inactivity.loadFailed"));
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
            toast.error(t("auth.signIn"));
            return;
        }

        if (settings.inactiveDays < 1 || settings.inactiveDays > 365) {
            toast.error(t("inactivity.thresholdError"));
            return;
        }

        try {
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
                toast.error(t("inactivity.saveFailed"));
                return;
            }

            window.dispatchEvent(new CustomEvent("inactivityTriggerUpdated"));

            toast.success(t("inactivity.settingsSaved"));
            await loadSettings();
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error(t("inactivity.saveFailed"));
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-primary/10 p-6 pt-14 rounded-b-3xl">
                <div className="flex items-center gap-4 mb-4">
                    <BackButton />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground">{t("inactivity.title")}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{t("inactivity.subtitle")}</p>
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
                                    {t("inactivity.triggerStatus")}: {settings.isActive ? t("inactivity.active") : t("inactivity.inactive")}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                    {settings.isActive
                                        ? t("inactivity.accountMonitored", { days: settings.inactiveDays.toString() })
                                        : t("inactivity.monitoringDisabled")}
                                </p>
                                {settings.isActive && (
                                    <div className="mt-3 p-3 bg-background rounded-lg border">
                                        <p className="text-sm font-medium">
                                            {t("inactivity.lastActivity")}: {daysSinceActivity === 0 ? t("inactivity.today") : `${daysSinceActivity} ${t("inactivity.days")}`}
                                        </p>
                                        {daysSinceActivity > 0 && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {daysSinceActivity >= settings.inactiveDays
                                                    ? t("inactivity.emergencyMayActivate")
                                                    : `${settings.inactiveDays - daysSinceActivity} ${t("inactivity.daysUntilAlert")}`}
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
                        <CardTitle>{t("inactivity.triggerSettings")}</CardTitle>
                        <CardDescription>{t("inactivity.configureMonitoring")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>{t("inactivity.enableMonitoring")}</Label>
                                <p className="text-sm text-muted-foreground">{t("inactivity.activateTracking")}</p>
                            </div>
                            <Switch
                                checked={settings.isActive}
                                onCheckedChange={(checked) => {
                                    setSettings((prev) => ({ ...prev, isActive: checked }));
                                    toast.success(
                                        checked ? t("dashboard.triggerEnabled") : t("dashboard.triggerDisabled"),
                                        { duration: 2000 }
                                    );
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="days">{t("inactivity.inactiveDaysThreshold")}</Label>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 flex-shrink-0"
                                    onClick={() => {
                                        if (settings.inactiveDays > 1) {
                                            setSettings((prev) => ({ ...prev, inactiveDays: prev.inactiveDays - 1 }));
                                        }
                                    }}
                                    disabled={!settings.isActive || settings.inactiveDays <= 1}
                                >
                                    <span className="text-lg font-bold">−</span>
                                </Button>
                                <Input
                                    id="days"
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className="text-center text-lg font-semibold"
                                    value={settings.inactiveDays === 0 ? "" : settings.inactiveDays.toString()}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, "");
                                        if (value === "") {
                                            setSettings((prev) => ({ ...prev, inactiveDays: 0 }));
                                        } else {
                                            const num = parseInt(value, 10);
                                            if (!isNaN(num) && num <= 365) {
                                                setSettings((prev) => ({ ...prev, inactiveDays: num }));
                                            }
                                        }
                                    }}
                                    onBlur={() => {
                                        if (settings.inactiveDays < 1) {
                                            setSettings((prev) => ({ ...prev, inactiveDays: 1 }));
                                        } else if (settings.inactiveDays > 365) {
                                            setSettings((prev) => ({ ...prev, inactiveDays: 365 }));
                                        }
                                    }}
                                    disabled={!settings.isActive}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="h-10 w-10 flex-shrink-0"
                                    onClick={() => {
                                        if (settings.inactiveDays < 365) {
                                            setSettings((prev) => ({ ...prev, inactiveDays: prev.inactiveDays + 1 }));
                                        }
                                    }}
                                    disabled={!settings.isActive || settings.inactiveDays >= 365}
                                >
                                    <span className="text-lg font-bold">+</span>
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {t("inactivity.daysDescription")}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">{t("inactivity.customAlertMessage")}</Label>
                            <Textarea
                                id="message"
                                placeholder={t("inactivity.alertPlaceholder")}
                                value={settings.customMessage}
                                onChange={(e) =>
                                    setSettings((prev) => ({ ...prev, customMessage: e.target.value }))
                                }
                                disabled={!settings.isActive}
                                rows={4}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>{t("inactivity.notificationMethods")}</Label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">{t("inactivity.emailNotifications")}</p>
                                            <p className="text-xs text-muted-foreground">{t("inactivity.emailDescription")}</p>
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
                                            <p className="text-sm font-medium">{t("inactivity.smsNotifications")}</p>
                                            <p className="text-xs text-muted-foreground">{t("inactivity.smsDescription")}</p>
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
                            {loading ? t("common.loading") : t("inactivity.saveSettings")}
                        </Button>
                    </CardContent>
                </Card>

                {/* How It Works */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            {t("inactivity.howItWorks")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                1
                            </div>
                            <div>
                                <p className="font-medium">{t("inactivity.step1Title")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {t("inactivity.step1Desc")}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                2
                            </div>
                            <div>
                                <p className="font-medium">{t("inactivity.step2Title")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {t("inactivity.step2Desc")}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-sm">
                                3
                            </div>
                            <div>
                                <p className="font-medium">{t("inactivity.step3Title")}</p>
                                <p className="text-sm text-muted-foreground">
                                    {t("inactivity.step3Desc")}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Box */}
                <div className="p-4 rounded-lg bg-muted border flex gap-3">
                    <Info className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                        <p className="text-sm font-medium mb-1">{t("inactivity.importantNote")}</p>
                        <p className="text-sm text-muted-foreground">
                            {t("inactivity.noteDescription")}
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
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
                    <button
                        onClick={() => navigate("/settings")}
                        className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                        <Settings className="w-6 h-6" />
                        <span className="text-xs font-medium">{t("nav.settings")}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InactivityTriggers;
