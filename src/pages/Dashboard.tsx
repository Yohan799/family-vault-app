import { Home, Settings, FileText, Users, Clock, Shield, ChevronRight, Bell, User, Vault, UserPlus, Timer, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { icon: FileText, label: "128 Documents", color: "text-primary" },
    { icon: Users, label: "3 Nominees", color: "text-primary" },
    { icon: Clock, label: "1 Time Capsule", color: "text-primary" },
    { icon: Shield, label: "Trigger On", color: "text-primary" },
  ];

  const quickActions = [
    { icon: Vault, title: "Digital Vault", subtitle: "Manage your secure documents", color: "bg-accent", onClick: () => navigate("/vault") },
    { icon: UserPlus, title: "Nominee Center", subtitle: "Manage trusted contacts", color: "bg-accent", onClick: () => navigate("/nominee-center") },
    { icon: Shield, title: "Inactivity Triggers", subtitle: "Set up activity monitoring", color: "bg-accent", onClick: () => navigate("/inactivity-triggers") },
    { icon: Timer, title: "Time Capsule", subtitle: "Create legacy messages", color: "bg-accent", onClick: () => navigate("/time-capsule") },
    { icon: Plus, title: "Customize Quick Actions", subtitle: "Add your own shortcuts", color: "bg-accent", onClick: () => navigate("/customize-quick-actions") },
  ];

  const recentDocs = [
    { name: "Last Will & Testament.pdf", category: "Sandeep Sharma", date: "May 15, 2024" },
    { name: "Home Mortgage Deed.docx", category: "Sandeep Sharma", date: "Apr 28, 2024" },
    { name: "Birth Certificate-Sandeep.jpg", category: "Sandeep Sharma", date: "Mar 20, 2024" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-sm opacity-90 mb-1">Welcome,</p>
            <h1 className="text-2xl font-bold">Sandeep</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => navigate("/notifications")}>
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground p-0" onClick={() => navigate("/profile")}>
              <Avatar className="w-9 h-9 bg-primary-foreground">
                <AvatarFallback className="bg-primary-foreground text-primary font-semibold text-sm">
                  RK
                </AvatarFallback>
              </Avatar>
            </Button>
          </div>
        </div>

        {/* Security Score */}
        <div className="bg-card rounded-2xl p-6 text-center">
          <div className="relative inline-flex items-center justify-center mb-3">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.65)}`}
                className="text-primary"
              />
            </svg>
            <span className="absolute text-3xl font-bold text-primary">65</span>
          </div>
          <p className="text-foreground font-medium mb-1">Your Vault is Secure</p>
          <p className="text-sm text-muted-foreground">Keep your data protected</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="bg-card rounded-2xl p-5">
          <div className="space-y-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex items-center gap-4">
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                  <span className="text-base font-medium text-foreground">{stat.label}</span>
                </div>
              );
            })}
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
