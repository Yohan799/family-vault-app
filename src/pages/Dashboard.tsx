import { FileText, Users, Clock, Shield, ChevronRight, Bell, UserPlus, Timer, Plus, Vault } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { calculateReadinessScore, updateInactivityTrigger, type DashboardStats } from "@/services/dashboardService";
import FeatureTour from "@/components/FeatureTour";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStats, useQuickActions, useUnreadNotifications, useInvalidateDashboard } from "@/hooks/useDashboardData";
import { DashboardSkeleton } from "@/components/skeletons";
import { getQuickActionText } from "@/lib/categoryTranslations";
import BottomNavigation from "@/components/BottomNavigation";

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
  const lastToggleTime = useRef<number>(0);

  // React Query hooks for cached data fetching
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats(user?.id);
  const { data: quickActions = [] } = useQuickActions(user?.id);
  const { data: unreadNotifications = 0 } = useUnreadNotifications(user?.id);
  const { invalidateStats } = useInvalidateDashboard();

  // Local state for optimistic inactivity toggle
  const [localInactivityState, setLocalInactivityState] = useState<boolean | null>(null);

  // Derive effective inactivity state (local override or from cache)
  const effectiveInactivityActive = localInactivityState ?? stats?.inactivityTriggerActive ?? false;

  // Memoized readiness score
  const readinessScore = useMemo(() => calculateReadinessScore(
    stats || { documents: 0, nominees: 0, timeCapsules: 0, inactivityTriggerActive: false },
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

  // Reset local state when cache updates
  useEffect(() => {
    if (stats?.inactivityTriggerActive !== undefined) {
      setLocalInactivityState(null);
    }
  }, [stats?.inactivityTriggerActive]);

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

    // Optimistic update via local state
    const previousState = effectiveInactivityActive;
    setLocalInactivityState(checked);

    // Show toast immediately
    toast({
      title: checked ? t("dashboard.triggerEnabled") : t("dashboard.triggerDisabled"),
      duration: 2000,
    });

    try {
      await updateInactivityTrigger(user.id, checked);
      // Invalidate cache to get fresh data
      invalidateStats(user.id);
    } catch (error) {
      console.error('Error updating inactivity trigger:', error);
      // Revert on error
      setLocalInactivityState(previousState);
      toast({
        title: t("toast.error"),
        variant: "destructive",
      });
    }
  }, [user?.id, effectiveInactivityActive, toast, t, invalidateStats]);

  if (!profile || isLoadingStats) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-20">
        <div className="bg-primary/20 text-foreground px-4 pt-4 pb-3 rounded-b-3xl">
          <div className="flex justify-between items-start mb-2">
            <div id="tour-greeting">
              <p className="text-xs text-muted-foreground">{t("dashboard.welcome")}</p>
              <h1 className="text-lg font-bold text-foreground">{firstName}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-foreground h-8 w-8 relative" onClick={() => navigate("/notifications")}>
                <Bell className={`w-4 h-4 ${unreadNotifications > 0 ? 'animate-pulse' : ''}`} />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center animate-bounce">
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

          <div id="tour-readiness-score" className="bg-card rounded-xl p-2 text-center animate-in fade-in duration-500 shadow-premium-sm">
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-md animate-pulse" style={{ width: '48px', height: '48px', margin: 'auto' }} />
              <svg className="w-12 h-12 transform -rotate-90 relative z-10">
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none" className="text-muted" />
                <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="none"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - readinessScore / 100)}`}
                  className="text-primary transition-all duration-1000 ease-out"
                  style={{ strokeDashoffset: `${2 * Math.PI * 20 * (1 - readinessScore / 100)}` }} />
              </svg>
              <span className="absolute text-base font-bold text-primary z-10">{readinessScore}</span>
            </div>
            <p className="text-foreground font-medium text-[11px] mt-0.5">{t("dashboard.securityScore")}</p>
          </div>
        </div>

        <div className="px-3 py-2 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-card rounded-xl p-2.5 text-center flex flex-col items-center justify-center h-16 shadow-premium-sm card-lift cursor-pointer animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
              <FileText className="w-4 h-4 text-primary mb-1" />
              <span className="text-[11px] font-medium text-foreground">{stats?.documents ?? 0} {t("dashboard.docs")}</span>
            </div>

            <div className="bg-card rounded-xl p-2.5 text-center flex flex-col items-center justify-center h-16 shadow-premium-sm card-lift cursor-pointer animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
              <Users className="w-4 h-4 text-primary mb-1" />
              <span className="text-[11px] font-medium text-foreground">{stats?.nominees ?? 0} {t("dashboard.nominees")}</span>
            </div>

            <div className="bg-card rounded-xl p-2.5 text-center flex flex-col items-center justify-center h-16 shadow-premium-sm card-lift cursor-pointer animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
              <Clock className="w-4 h-4 text-primary mb-1" />
              <span className="text-[11px] font-medium text-foreground">{stats?.timeCapsules ?? 0} {t("dashboard.capsules")}</span>
            </div>

            <div className="bg-card rounded-xl p-2.5 text-center flex flex-col items-center justify-center h-16 shadow-premium-sm card-lift animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-[11px] font-medium text-foreground leading-tight">{t("dashboard.trigger")}</span>
              <Switch
                checked={effectiveInactivityActive}
                onCheckedChange={handleInactivityToggle}
                className="scale-[0.65] mt-0.5"
              />
            </div>
          </div>

          <div>
            <h2 className="text-base font-bold text-foreground mb-2">{t("dashboard.quickActions")}</h2>
            <div className="space-y-1.5">
              {quickActions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t("dashboard.noQuickActions")}</p>
              ) : (
                quickActions.map((action, index) => {
                  const Icon = iconMap[action.icon || 'Plus'] || Plus;
                  return (
                    <button
                      key={action.id}
                      id={`tour-${action.action_key}`}
                      onClick={() => action.route && navigate(action.route)}
                      className="w-full bg-card rounded-xl p-3 flex items-center gap-3 shadow-premium-sm card-lift animate-in slide-in-from-bottom-2 fade-in"
                      style={{ animationDelay: `${index * 75}ms`, animationFillMode: 'both' }}
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">
                          {getQuickActionText(action.action_key, "title", action.title, t)}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {getQuickActionText(action.action_key, "subtitle", action.subtitle || "", t)}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
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

      <BottomNavigation activeTab="home" />
    </>
  );
};

export default Dashboard;

