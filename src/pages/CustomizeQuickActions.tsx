import { ArrowLeft, Home, Lock as LockIcon, Settings, Plus, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const CustomizeQuickActions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Quick actions updated!",
      description: "Your changes have been saved successfully",
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-primary-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Customize Quick Actions</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-muted-foreground">Drag to reorder or remove actions. Add new shortcuts to personalize your dashboard.</p>

        {/* Current Actions */}
        <div className="space-y-3">
          {[
            { title: "Digital Vault", subtitle: "Manage your secure documents" },
            { title: "Nominee Center", subtitle: "Manage trusted contacts" },
            { title: "Inactivity Triggers", subtitle: "Set up activity monitoring" },
            { title: "Time Capsule", subtitle: "Create legacy messages" },
          ].map((action, index) => (
            <div key={index} className="bg-card rounded-xl p-4 flex items-center gap-4">
              <GripVertical className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{action.title}</h3>
                <p className="text-sm text-muted-foreground">{action.subtitle}</p>
              </div>
              <Button variant="ghost" size="icon" className="text-destructive">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add Action Button */}
        <Button 
          variant="outline" 
          className="w-full rounded-xl h-14 border-dashed border-2 gap-2"
        >
          <Plus className="w-5 h-5" />
          Add New Action
        </Button>

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12"
        >
          Save Changes
        </Button>
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
            <LockIcon className="w-6 h-6" />
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

export default CustomizeQuickActions;
