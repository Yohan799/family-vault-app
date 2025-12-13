import { Home, Settings, FileText, Users, Clock, Shield, ChevronRight, Bell, User, Vault, UserPlus, Timer, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchDashboardStats, calculateReadinessScore, updateInactivityTrigger, type DashboardStats } from "@/services/dashboardService";
import FeatureTour from "@/components/FeatureTour";
import { useToast } from "@/hooks/use-toast";
import { getQuickActions, initializeDefaultActions, type QuickAction } from "@/services/quickActionsService";
import { DashboardSkeleton } from "@/components/skeletons";
import { getUnreadCount } from "@/services/notificationService";
import { getQuickActionText } from "@/lib/categoryTranslations";

// Memoized icon map (created once, not on every render)
const iconMap: Record<string, any> = {
  Vault,
  UserPlus,
  Shield,
  Timer,
  Plus,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showTour, setShowTour] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    documents: 0,
    nominees: 0,
    timeCapsules: 0,
    inactivityTriggerActive: false,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const lastToggleTime = useRef<number>(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Memoized readiness score
  const readinessScore = useMemo(() => calculateReadinessScore(
    stats,
    profile?.two_factor_enabled || false,
    profile?.biometric_enabled || false
  ), [stats, profile?.two_factor_enabled, profile?.biometric_enabled]);

  // Memoized user display info
  const { displayName, firstName, initials } = useMemo(() => {
    const name = profile?.full_name || "User";
    const first = name.split(' ')[0];
    const init = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return { displayName: name, firstName: first, initials: init };
  }, [profile?.full_name]);

  // Show tour immediately on first login (only if tour not completed before)
  useEffect(() => {
    const isFirstLogin = localStorage.getItem("isFirstLogin");
    const tourCompleted = localStorage.getItem("tourCompleted");
    if (isFirstLogin === "true" && tourCompleted !== "true") {
      setShowTour(true);
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      // Load all data in PARALLEL for faster loading
      loadAllDashboardData();
    }
  }, [user?.id]);

  const loadAllDashboardData = useCallback(async () => {
    if (!user?.id) return;

    setIsLoadingStats(true);

    try {
      // Run all data loading in parallel
      const [dashboardStats, _, actions, unreadCount] = await Promise.all([
        fetchDashboardStats(user.id),
        initializeDefaultActions(user.id),
        getQuickActions(user.id),
        getUnreadCount(user.id)
      ]);

      setStats(dashboardStats);
      setQuickActions(actions.filter(a => a.is_enabled));
      setUnreadNotifications(unreadCount);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoadingStats(false);
    }
  }, [user?.id]);

  const handleTourClose = useCallback(() => {
    setShowTour(false);
    localStorage.removeItem("isFirstLogin");
    localStorage.setItem("tourCompleted", "true");
  }, []);

  const handleInactivityToggle = useCallback(async (checked: boolean) => {
    if (!user?.id) return;

    // Debounce rapid toggling
    const now = Date.now();
    if (now - lastToggleTime.current < 500) {
      return;
    }
    lastToggleTime.current = now;

    // Optimistic update
    const previousState = stats.inactivityTriggerActive;
    setStats(prev => ({ ...prev, inactivityTriggerActive: checked }));

    // Show toast immediately
    toast({
      title: checked ? t("dashboard.triggerEnabled") : t("dashboard.triggerDisabled"),
      duration: 2000,
    });

    try {
      await updateInactivityTrigger(user.id, checked);
    } catch (error) {
      console.error('Error updating inactivity trigger:', error);
      // Revert on error
      setStats(prev => ({ ...prev, inactivityTriggerActive: previousState }));
      toast({
        title: t("toast.error"),
        variant: "destructive",
      });
    }
  }, [user?.id, stats.inactivityTriggerActive, toast, t]);

  if (!profile || isLoadingStats) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-primary/20 text-foreground p-4 pt-14 rounded-b-3xl">
          <div className="flex justify-between items-start mb-3">
            <div id="tour-greeting">
              <p className="text-xs text-muted-foreground mb-0.5">{t("dashboard.welcome")}</p>
              <h1 className="text-xl font-bold text-foreground">{firstName}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-foreground h-8 w-8 relative" onClick={() => navigate("/notifications")}>
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                    {unreadNotifications > 99 ? '99+' : unreadNotifications}
                  </span>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="text-foreground p-0 h-8 w-8" onClick={() => navigate("/profile")}>
                <Avatar className="w-8 h-8 bg-primary">
                  {profile.profile_image_url && <AvatarImage src={profile.profile_image_url} alt="Profile" />}
                  <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>

          <div id="tour-readiness-score" className="bg-card rounded-xl p-3 text-center">
            <div className="relative inline-flex items-center justify-center mb-1">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="5" fill="none" className="text-muted" />
                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="5" fill="none"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - readinessScore / 100)}`}
                  className="text-blue-500" />
              </svg>
              <span className="absolute text-lg font-bold text-blue-500">{readinessScore}</span>
            </div>
            <p className="text-foreground font-medium text-xs">{t("dashboard.securityScore")}</p>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card rounded-lg p-2.5 text-center flex flex-col items-center justify-center h-20">
              <FileText className="w-5 h-5 text-primary mb-1.5" />
              <span className="text-xs font-medium text-foreground truncate">{stats.documents} {t("dashboard.docs")}</span>
            </div>

            <div className="bg-card rounded-lg p-2.5 text-center flex flex-col items-center justify-center h-20">
              <Users className="w-5 h-5 text-primary mb-1.5" />
              <span className="text-xs font-medium text-foreground truncate">{stats.nominees} {t("dashboard.nominees")}</span>
            </div>

            <div className="bg-card rounded-lg p-2.5 text-center flex flex-col items-center justify-center h-20">
              <Clock className="w-5 h-5 text-primary mb-1.5" />
              <span className="text-xs font-medium text-foreground truncate">{stats.timeCapsules} {t("dashboard.capsules")}</span>
            </div>

            <div className="bg-card rounded-lg p-2.5 text-center flex flex-col items-center justify-center h-20">
              <Shield className="w-5 h-5 text-primary mb-0.5" />
              <span className="text-[10px] font-medium text-foreground truncate mb-0.5">{t("dashboard.trigger")}</span>
              <Switch
                checked={stats.inactivityTriggerActive}
                onCheckedChange={handleInactivityToggle}
                className="scale-75"
              />
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold text-foreground mb-2">{t("dashboard.quickActions")}</h2>
            <div className="space-y-1.5">
              {quickActions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("dashboard.noQuickActions")}</p>
              ) : (
                quickActions.map((action) => {
                  const Icon = iconMap[action.icon || 'Plus'] || Plus;
                  return (
                    <button
                      key={action.id}
                      id={`tour-${action.action_key}`}
                      onClick={() => action.route && navigate(action.route)}
                      className="w-full bg-card rounded-lg p-2.5 flex items-center gap-2.5 hover:bg-accent transition-colors"
                    >
                      <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h3 className="font-semibold text-foreground text-xs truncate">
                          {getQuickActionText(action.action_key, "title", action.title, t)}
                        </h3>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {getQuickActionText(action.action_key, "subtitle", action.subtitle || "", t)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Feature Tour */}
        <FeatureTour isOpen={showTour} onClose={handleTourClose} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1 text-primary relative">
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.home")}</span>
            <div className="absolute -bottom-2 w-12 h-1 bg-primary rounded-full" />
          </button>
          <button onClick={() => navigate("/vault")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
            <Vault className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.vault")}</span>
          </button>
          <button onClick={() => navigate("/settings")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.settings")}</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

