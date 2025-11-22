import { Home, Settings, FileText, Users, Clock, Shield, ChevronRight, Bell, User, Vault, UserPlus, Timer, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState({
    fullName: "Guest User",
    email: "guest@example.com",
    profileImage: null as string | null,
  });

  // Security settings for readiness score calculation  
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    biometric: false,
    lockedDocumentsCount: 0,
    inactivityTriggerActive: false,
  });

  // Dynamic counts from localStorage
  const [counts, setCounts] = useState({
    documents: 0,
    nominees: 0,
    timeCapsules: 0,
  });

  // Calculate Family Readiness Index (0-100)
  const calculateReadinessScore = () => {
    let score = 0;
    if (securitySettings.twoFactorAuth) score += 25;
    if (securitySettings.biometric) score += 25;
    if (securitySettings.lockedDocumentsCount > 0) score += 25;
    if (securitySettings.inactivityTriggerActive) score += 25;
    return score;
  };

  const readinessScore = calculateReadinessScore();

  useEffect(() => {
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

    // Load security settings from localStorage
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSecuritySettings({
        twoFactorAuth: settings.twoFactorAuth || false,
        biometric: settings.biometric || false,
        lockedDocumentsCount: 0, // Will be calculated from actual documents
        inactivityTriggerActive: settings.inactivityTriggerActive || false,
      });
    }

    // Load counts from localStorage
    const loadCounts = () => {
      const documentsCount = parseInt(localStorage.getItem("documentsCount") || "0");
      const nomineesCount = parseInt(localStorage.getItem("nomineesCount") || "0");
      const timeCapsulesCount = parseInt(localStorage.getItem("timeCapsulesCount") || "0");

      setCounts({
        documents: documentsCount,
        nominees: nomineesCount,
        timeCapsules: timeCapsulesCount,
      });
    };

    loadCounts();

    // Listen for storage changes (when counts are updated from other pages)
    const handleStorageChange = () => {
      loadCounts();
    };

    window.addEventListener("storage", handleStorageChange);
    // Also listen for custom event for same-window updates
    window.addEventListener("countsUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("countsUpdated", handleStorageChange);
    };
  }, []);

  const handleInactivityToggle = (checked: boolean) => {
    setSecuritySettings(prev => ({ ...prev, inactivityTriggerActive: checked }));
    // Save to localStorage
    const savedSettings = localStorage.getItem("userSettings");
    const settings = savedSettings ? JSON.parse(savedSettings) : {};
    settings.inactivityTriggerActive = checked;
    localStorage.setItem("userSettings", JSON.stringify(settings));
  };

  const quickActions = [
    { icon: Vault, title: "Digital Vault", subtitle: "Manage your secure documents", color: "bg-accent", onClick: () => navigate("/vault") },
    { icon: UserPlus, title: "Nominee Center", subtitle: "Manage trusted contacts", color: "bg-accent", onClick: () => navigate("/nominee-center") },
    { icon: Shield, title: "Inactivity Triggers", subtitle: "Set up activity monitoring", color: "bg-accent", onClick: () => navigate("/inactivity-triggers") },
    { icon: Timer, title: "Time Capsule", subtitle: "Create legacy messages", color: "bg-accent", onClick: () => navigate("/time-capsule") },
    { icon: Plus, title: "Customize Quick Actions", subtitle: "Add your own shortcuts", color: "bg-accent", onClick: () => navigate("/customize-quick-actions") },
  ];

  const recentDocs: Array<{ name: string; category: string; date: string }> = [];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Welcome,</p>
            <h1 className="text-2xl font-bold text-foreground">{profileData.fullName.split(' ')[0]}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-foreground" onClick={() => navigate("/notifications")}>
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground p-0" onClick={() => navigate("/profile")}>
              <Avatar className="w-9 h-9 bg-primary">
                {profileData.profileImage && <AvatarImage src={profileData.profileImage} alt="Profile" />}
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
                  {profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>

        {/* Security Score - Smaller Circle with Blue Progress */}
        <div className="bg-card rounded-2xl p-4 text-center">
          <div className="relative inline-flex items-center justify-center mb-2">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - readinessScore / 100)}`}
                className="text-blue-500"
              />
            </svg>
            <span className="absolute text-xl font-bold text-blue-500">{readinessScore}</span>
          </div>
          <p className="text-foreground font-medium mb-1 text-sm">Family Readiness Index</p>
          <p className="text-xs text-muted-foreground">Keep your data protected</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Grid - Horizontal Single Row with Dynamic Counts */}
        <div className="grid grid-cols-4 gap-2">
          {/* Documents - Dynamic Count */}
          <div className="bg-card rounded-xl p-4 text-center">
            <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
            <span className="text-sm font-medium text-foreground block">{counts.documents} Documents</span>
          </div>

          {/* Nominees - Dynamic Count */}
          <div className="bg-card rounded-xl p-4 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-2" />
            <span className="text-sm font-medium text-foreground block">{counts.nominees} Nominees</span>
          </div>

          {/* Time Capsule - Dynamic Count */}
          <div className="bg-card rounded-xl p-4 text-center">
            <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
            <span className="text-sm font-medium text-foreground block">{counts.timeCapsules} Time Capsule</span>
          </div>

          {/* Inactivity Trigger - Toggle */}
          <div className="bg-card rounded-xl p-2 text-center flex flex-col items-center justify-center">
            <Shield className="w-5 h-5 text-primary mb-1" />
            <span className="text-[10px] font-medium text-foreground block mb-1 leading-tight">Inactivity Trigger</span>
            <Switch
              checked={securitySettings.inactivityTriggerActive}
              onCheckedChange={handleInactivityToggle}
              className="scale-75"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="w-full bg-card rounded-2xl p-4 flex items-center gap-4 hover:bg-accent transition-colors"
                >
                  <div className={`w-12 h-12 ${action.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.subtitle}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Documents */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-foreground">Recent Documents</h2>
            <button
              onClick={() => navigate("/vault")}
              className="text-sm text-primary font-medium hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentDocs.map((doc, index) => (
              <div key={index} className="bg-card rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{doc.name}</h3>
                  <p className="text-sm text-muted-foreground">{doc.category}</p>
                  <p className="text-xs text-muted-foreground">{doc.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button className="flex flex-col items-center gap-1 text-primary">
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

export default Dashboard;
