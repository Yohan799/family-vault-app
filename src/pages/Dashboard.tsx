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

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    biometric: false,
    lockedDocumentsCount: 0,
    inactivityTriggerActive: false,
  });

  const [counts, setCounts] = useState({
    documents: 0,
    nominees: 0,
    timeCapsules: 0,
  });

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

    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSecuritySettings({
        twoFactorAuth: settings.twoFactorAuth || false,
        biometric: settings.biometric || false,
        lockedDocumentsCount: 0,
        inactivityTriggerActive: settings.inactivityTriggerActive || false,
      });
    }

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

    const handleStorageChange = () => {
      loadCounts();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("countsUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("countsUpdated", handleStorageChange);
    };
  }, []);

  const handleInactivityToggle = (checked: boolean) => {
    setSecuritySettings(prev => ({ ...prev, inactivityTriggerActive: checked }));
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
    <div className="min-h-screen bg-background pb-16">
      <div className="bg-primary/20 text-foreground p-4 rounded-b-3xl">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Welcome,</p>
            <h1 className="text-xl font-bold text-foreground">{profileData.fullName.split(' ')[0]}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-foreground h-8 w-8" onClick={() => navigate("/notifications")}>
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-foreground p-0 h-8 w-8" onClick={() => navigate("/profile")}>
              <Avatar className="w-8 h-8 bg-primary">
                {profileData.profileImage && <AvatarImage src={profileData.profileImage} alt="Profile" />}
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
                  {profileData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-xl p-3 text-center">
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
          <p className="text-foreground font-medium text-xs">Family Readiness Index</p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card rounded-lg p-2.5 text-center flex flex-col items-center justify-center h-20">
            <FileText className="w-5 h-5 text-primary mb-1.5" />
            <span className="text-xs font-medium text-foreground truncate">{counts.documents} Docs</span>
          </div>

          <div className="bg-card rounded-lg p-2.5 text-center flex flex-col items-center justify-center h-20">
            <Users className="w-5 h-5 text-primary mb-1.5" />
            <span className="text-xs font-medium text-foreground truncate">{counts.nominees} Nominees</span>
          </div>

          <div className="bg-card rounded-lg p-2.5 text-center flex flex-col items-center justify-center h-20">
            <Clock className="w-5 h-5 text-primary mb-1.5" />
            <span className="text-xs font-medium text-foreground truncate">{counts.timeCapsules} Capsules</span>
          </div>

          <div className="bg-card rounded-lg p-2.5 text-center flex flex-col items-center justify-center h-20">
            <Shield className="w-5 h-5 text-primary mb-0.5" />
            <span className="text-[10px] font-medium text-foreground truncate mb-0.5">Trigger</span>
            <Switch
              checked={securitySettings.inactivityTriggerActive}
              onCheckedChange={handleInactivityToggle}
              className="scale-75"
            />
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-foreground mb-2">Quick Actions</h2>
          <div className="space-y-1.5">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button key={index} onClick={action.onClick}
                  className="w-full bg-card rounded-lg p-2.5 flex items-center gap-2.5 hover:bg-accent transition-colors">
                  <div className={`w-9 h-9 ${action.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="font-semibold text-foreground text-xs truncate">{action.title}</h3>
                    <p className="text-[10px] text-muted-foreground truncate">{action.subtitle}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-base font-bold text-foreground">Recent Documents</h2>
            <button onClick={() => navigate("/vault")} className="text-xs text-primary font-medium hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-2">
            {recentDocs.map((doc, index) => (
              <div key={index} className="bg-card rounded-lg p-2.5 flex items-center gap-3">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground text-xs truncate">{doc.name}</h3>
                  <p className="text-[10px] text-muted-foreground">{doc.category}</p>
                  <p className="text-[10px] text-muted-foreground">{doc.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center h-14 max-w-md mx-auto">
          <button className="flex flex-col items-center gap-0.5 text-primary">
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button onClick={() => navigate("/vault")} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground">
            <Vault className="w-5 h-5" />
            <span className="text-[10px] font-medium">Vault</span>
          </button>
          <button onClick={() => navigate("/settings")} className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground">
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
