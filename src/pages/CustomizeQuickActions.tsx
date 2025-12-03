import { ArrowLeft, Home, Lock as LockIcon, Settings, Plus, GripVertical, Trash2, Shield, Users, Bell, Clock, Timer, UserPlus, Vault as VaultIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getQuickActions, 
  initializeDefaultActions, 
  updateQuickAction, 
  createQuickAction, 
  deleteQuickAction,
  type QuickAction 
} from "@/services/quickActionsService";

interface DisplayQuickAction extends QuickAction {
  iconComponent: any;
}

const CustomizeQuickActions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionSubtitle, setNewActionSubtitle] = useState("");
  const [actions, setActions] = useState<DisplayQuickAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Icon mapping
  const iconMap: Record<string, any> = {
    Vault: VaultIcon,
    UserPlus,
    Shield,
    Timer,
    Plus,
    Users,
    Bell,
    Clock,
  };

  useEffect(() => {
    if (user) {
      loadActions();
    }
  }, [user]);

  const loadActions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await initializeDefaultActions(user.id);
      const fetchedActions = await getQuickActions(user.id);
      
      const displayActions: DisplayQuickAction[] = fetchedActions.map(action => ({
        ...action,
        iconComponent: iconMap[action.icon || 'Plus'] || Plus,
      }));
      
      setActions(displayActions);
    } catch (error) {
      console.error('Error loading actions:', error);
      toast({
        title: "Failed to load actions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (id: string) => {
    const action = actions.find(a => a.id === id);
    if (!action) return;

    const newEnabled = !action.is_enabled;
    
    // Optimistic update
    setActions(actions.map(a => 
      a.id === id ? { ...a, is_enabled: newEnabled } : a
    ));

    try {
      await updateQuickAction(id, { is_enabled: newEnabled });
      toast({
        title: "Quick action updated",
        description: `${action.title} ${newEnabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating action:', error);
      // Revert on error
      setActions(actions.map(a => 
        a.id === id ? { ...a, is_enabled: !newEnabled } : a
      ));
      toast({
        title: "Failed to update",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const action = actions.find(a => a.id === id);
    if (!action) return;

    // Optimistic delete
    setActions(actions.filter(a => a.id !== id));

    try {
      await deleteQuickAction(id);
      toast({
        title: "Action removed",
        description: `${action.title} has been deleted`,
      });
    } catch (error) {
      console.error('Error deleting action:', error);
      // Revert on error
      await loadActions();
      toast({
        title: "Failed to delete",
        variant: "destructive",
      });
    }
  };

  const handleAddNew = async () => {
    if (!user) return;
    
    if (!newActionTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your quick action",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const newAction = await createQuickAction(user.id, {
        title: newActionTitle,
        subtitle: newActionSubtitle || "Custom action",
        icon: 'Plus',
      });

      const displayAction: DisplayQuickAction = {
        ...newAction,
        iconComponent: Plus,
      };
      
      setActions([...actions, displayAction]);
      setNewActionTitle("");
      setNewActionSubtitle("");
      setShowAddDialog(false);
      
      toast({
        title: "Action added!",
        description: "New quick action has been created",
      });
    } catch (error) {
      console.error('Error adding action:', error);
      toast({
        title: "Failed to add action",
        variant: "destructive",
      });
    }
  };

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
        <p className="text-muted-foreground">Drag to reorder, toggle to enable/disable. Add custom shortcuts to personalize your dashboard.</p>

        {/* Current Actions */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-4">Loading actions...</p>
        ) : (
          <div className="space-y-3">
            {actions.map((action) => {
              const Icon = action.iconComponent;
              return (
                <div key={action.id} className="bg-card rounded-xl p-4 flex items-center gap-4">
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                  <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={action.is_enabled}
                      onCheckedChange={() => handleToggle(action.id)}
                    />
                    {action.is_custom && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(action.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Action Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full rounded-xl h-14 border-dashed border-2 gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Action
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Quick Action</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Action Title *</label>
                <Input
                  placeholder="Enter action title"
                  value={newActionTitle}
                  onChange={(e) => setNewActionTitle(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Subtitle</label>
                <Input
                  placeholder="Enter subtitle (optional)"
                  value={newActionSubtitle}
                  onChange={(e) => setNewActionSubtitle(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleAddNew} className="flex-1 bg-primary hover:bg-primary/90">
                  Add Action
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowAddDialog(false);
                    setNewActionTitle("");
                    setNewActionSubtitle("");
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

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
        <div className="flex justify-around items-center h-14 max-w-md mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => navigate("/vault")}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground"
          >
            <LockIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">Vault</span>
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizeQuickActions;
