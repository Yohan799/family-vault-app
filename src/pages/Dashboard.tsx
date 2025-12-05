import { Home, Settings, FileText, Users, Clock, Shield, ChevronRight, Bell, User, Vault, UserPlus, Timer, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchDashboardStats, calculateReadinessScore, updateInactivityTrigger, type DashboardStats } from "@/services/dashboardService";
import SpotlightTour from "@/components/SpotlightTour";

// Onboarding tour steps - ONLY static elements that always exist
const tourSteps = [
  {
    targetId: "welcome-header",
    title: "Welcome to Family Vault! 👋",
    description: "Your secure digital legacy platform. Let's take a quick tour!",
    position: "bottom" as const,
  },
  {
    targetId: "security-score",
    title: "📊 Security Score",
    description: "Your vault readiness score. Complete actions to reach 100%!",
    position: "bottom" as const,
  },
  {
    targetId: "stats-grid",
    title: "📈 Quick Stats",
    description: "See your document count, nominees, time capsules, and trigger status.",
    position: "bottom" as const,
  },
  {
    targetId: "quick-actions",
    title: "⚡ Quick Actions",
    description: "Access your vault, nominees, and time capsules quickly from here.",
    position: "top" as const,
  },
  {
    targetId: "bottom-nav",
    title: "🎉 You're Ready!",
    description: "Use the bottom tabs to navigate. Start by uploading a document!",
    position: "top" as const,
  },
];
import { useToast } from "@/hooks/use-toast";
import { getQuickActions, initializeDefaultActions, type QuickAction } from "@/services/quickActionsService";
import { DashboardSkeleton } from "@/components/skeletons";

const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
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

  // Icon mapping for quick actions
  const iconMap: Record<string, any> = {
    Vault,
    UserPlus,
    Shield,
    Timer,
    Plus,
  };

  const readinessScore = calculateReadinessScore(
    stats,
    profile?.two_factor_enabled || false,
    profile?.biometric_enabled || false
  );

  useEffect(() => {
    // Check if this is first login
    const isFirstLogin = localStorage.getItem("isFirstLogin");
    if (isFirstLogin === "true") {
      setShowTour(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadDashboardStats();
      loadQuickActions();
    }
  }, [user]);

  const loadDashboardStats = async () => {
    if (!user) return;

    setIsLoadingStats(true);
    try {
      const dashboardStats = await fetchDashboardStats(user.id);
      setStats(dashboardStats);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadQuickActions = async () => {
    if (!user) return;

    try {
      // Initialize defaults if needed
      await initializeDefaultActions(user.id);

      // Fetch actions
      const actions = await getQuickActions(user.id);
      setQuickActions(actions.filter(a => a.is_enabled));
    } catch (error) {
      console.error('Error loading quick actions:', error);
      // Fallback to empty array if error
      setQuickActions([]);
    }
  };

  const handleTourClose = () => {
    setShowTour(false);
    localStorage.removeItem("isFirstLogin");
  };

  const handleInactivityToggle = async (checked: boolean) => {
    if (!user) return;

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
      title: checked ? "Trigger is enabled" : "Trigger is disabled",
      duration: 2000,
    });

    try {
      await updateInactivityTrigger(user.id, checked);
    } catch (error) {
      console.error('Error updating inactivity trigger:', error);
      // Revert on error
      setStats(prev => ({ ...prev, inactivityTriggerActive: previousState }));
      toast({
        title: "Failed to update trigger",
        variant: "destructive",
      });
    }
  };


  if (!profile) {
    return <DashboardSkeleton />;
  }

  const displayName = profile.full_name || "User";
  const firstName = displayName.split(' ')[0];
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="bg-primary/20 text-foreground p-4 rounded-b-3xl">
        <div className="flex justify-between items-start mb-3" data-tour-id="welcome-header">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Welcome,</p>
            <h1 className="text-xl font-bold text-foreground">{firstName}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-foreground h-8 w-8" onClick={() => navigate("/notifications")}>
              <Bell className="w-4 h-4" />
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

        <div className="bg-card rounded-xl p-3 text-center" data-tour-id="security-score">
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
          <p className="text-foreground font-medium text-xs">Security Score</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2" data-tour-id="stats-grid">
          <div className="bg-card rounded-lg p-2.5 text-center flex flex-col items-center justify-center h-20" data-tour-id="stat-documents">
            <FileText className="w-5 h-5 text-primary mb-1.5" />
            <span className="text-xs font-medium text-foreground truncate">{stats.documents} Docs</span>
          </div>

          <div className="bg-card rounded-lg p-2.5 text-center flex flex-col items-center justify-center h-20" data-tour-id="stat-nominees">
            <Users className="w-5 h-5 text-primary mb-1.5" />
            <span className="text-xs font-medium text-foreground truncate">{stats.nominees} Nominees</span>
          </div>

          <div className="bg-card rounded-lg p-2.5 text-center flex flex-col items-center justify-center h-20" data-tour-id="stat-capsules">
            <Clock className="w-5 h-5 text-primary mb-1.5" />
            <span className="text-xs font-medium text-foreground truncate">{stats.timeCapsules} Capsules</span>
          </div>

          <div className="bg-card rounded-lg p-2.5 text-center flex flex-col items-center justify-center h-20" data-tour-id="stat-trigger">
            <Shield className="w-5 h-5 text-primary mb-0.5" />
            <span className="text-[10px] font-medium text-foreground truncate mb-0.5">Trigger</span>
            <Switch
              checked={stats.inactivityTriggerActive}
              onCheckedChange={handleInactivityToggle}
              className="scale-75"
            />
          </div>
        </div>

        <div data-tour-id="quick-actions">
          <h2 className="text-base font-bold text-foreground mb-2">Quick Actions</h2>
          <div className="space-y-1.5">
            {quickActions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No quick actions enabled</p>
            ) : (
              quickActions.map((action) => {
                const Icon = iconMap[action.icon || 'Plus'] || Plus;
                const handleClick = () => {
                  if (action.route) {
                    navigate(action.route);
                  }
                };

                // Map action_key to tour ID
                const actionTourIdMap: Record<string, string> = {
                  'vault': 'action-vault',
                  'nominees': 'action-nominees',
                  'inactivity': 'action-inactivity',
                  'time-capsule': 'action-time-capsule',
                };
                const tourId = actionTourIdMap[action.action_key || ''];

                return (
                  <button
                    key={action.id}
                    onClick={handleClick}
                    data-tour-id={tourId}
                    className="w-full bg-card rounded-lg p-2.5 flex items-center gap-2.5 hover:bg-accent transition-colors"
                  >
                    <div className="w-9 h-9 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h3 className="font-semibold text-foreground text-xs truncate">{action.title}</h3>
                      <p className="text-[10px] text-muted-foreground truncate">{action.subtitle}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>




      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border" data-tour-id="bottom-nav">
        <div className="flex justify-around items-center h-14 max-w-md mx-auto">
          <button className="flex flex-col items-center gap-0.5 text-primary">
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => navigate("/vault")} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground" data-tour-id="nav-vault">
            <Vault className="w-5 h-5" />
            <span className="text-[10px] font-medium">Vault</span>
          </button>
          <button onClick={() => navigate("/settings")} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground" data-tour-id="nav-settings">
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Spotlight Feature Tour */}
      <SpotlightTour isOpen={showTour} onClose={handleTourClose} steps={tourSteps} />
    </div>
  );
};

export default Dashboard;
