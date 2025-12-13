import { Shield, Clock, Mail, Phone, MessageSquare, Home, Lock, Settings } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const InactivityTrigger = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { t } = useLanguage();
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
                title: t("toast.error"),
                description: t("common.error"),
                variant: "destructive"
            });
            return;
        }

        if (settings.inactiveDays < 1) {
            toast({
                title: t("toast.error"),
                description: t("common.error"),
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
            title: t("inactivity.settingsSaved"),
            description: settings.isActive
                ? t("inactivity.settingsSavedDesc", { days: settings.inactiveDays })
                : t("inactivity.triggerDisabledMsg"),
        });
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-primary/10 p-6 pt-14 rounded-b-3xl">
                <div className="flex items-center gap-4 mb-4">
                    <BackButton to="/dashboard" />
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-foreground">{t("inactivity.title")}</h1>
                        <p className="text-sm text-muted-foreground mt-1">{t("inactivity.subtitle")}</p>
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
                                <h2 className="font-bold text-foreground">{t("inactivity.monitoring")}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {settings.isActive ? t("inactivity.currentlyActive") : t("inactivity.currentlyInactive")}
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
                                ⚡ {t("inactivity.alertWillTrigger", { days: settings.inactiveDays })}
                            </p>
                        </div>
                    )}
                </div>

                {/* Settings Form */}
                <div className="bg-card rounded-2xl p-6 space-y-4 border border-border">
                    <h2 className="text-lg font-bold text-foreground mb-4">{t("inactivity.triggerSettings")}</h2>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t("inactivity.inactiveDaysThreshold")}
                        </label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                                type="number"
                                min="1"
                                placeholder={t("inactivity.daysPlaceholder")}
                                value={settings.inactiveDays}
                                onChange={(e) => setSettings(prev => ({ ...prev, inactiveDays: parseInt(e.target.value) || 0 }))}
                                className="bg-background border-border pl-12"
                                disabled={!settings.isActive}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {t("inactivity.daysDescription")}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">
                            {t("inactivity.customAlertMessage")}
                        </label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                            <Textarea
                                placeholder={t("inactivity.alertPlaceholder")}
                                value={settings.customMessage}
                                onChange={(e) => setSettings(prev => ({ ...prev, customMessage: e.target.value }))}
                                className="bg-background border-border pl-12 min-h-24"
                                disabled={!settings.isActive}
                                rows={4}
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="text-sm font-medium text-foreground">{t("inactivity.notificationMethods")}</label>

                        <div className="flex items-center justify-between p-3 bg-background rounded-xl">
                            <div className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="font-medium text-foreground">{t("inactivity.emailNotifications")}</p>
                                    <p className="text-xs text-muted-foreground">{t("inactivity.emailDescription")}</p>
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
                                    <p className="font-medium text-foreground">{t("inactivity.smsNotifications")}</p>
                                    <p className="text-xs text-muted-foreground">{t("inactivity.smsDescription")}</p>
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
                        {t("inactivity.saveSettings")}
                    </Button>
                </div>

                {/* How It Works */}
                <div className="bg-card rounded-2xl p-6 border border-border space-y-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        {t("inactivity.howItWorks")}
                    </h3>

                    <div className="space-y-3 text-sm">
                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
                                1
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{t("inactivity.step1Title")}</p>
                                <p className="text-muted-foreground">
                                    {t("inactivity.step1Desc")}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
                                2
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{t("inactivity.step2Title")}</p>
                                <p className="text-muted-foreground">
                                    {t("inactivity.step2Desc")}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
                                3
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{t("inactivity.step3Title")}</p>
                                <p className="text-muted-foreground">
                                    {t("inactivity.step3Desc")}
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
                        <h3 className="font-semibold text-foreground mb-1">{t("inactivity.importantNote")}</h3>
                        <p className="text-sm text-muted-foreground">
                            {t("inactivity.noteDescription")}
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
                        <span className="text-xs font-medium">{t("nav.home")}</span>
                    </button>
                    <button
                        onClick={() => navigate("/vault")}
                        className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                        <Lock className="w-6 h-6" />
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

export default InactivityTrigger;