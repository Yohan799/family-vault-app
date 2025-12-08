import { ArrowLeft, Home, Lock as LockIcon, Settings, Plus, GripVertical, Trash2, Shield, Users, Bell, Clock, Timer, UserPlus, Vault as VaultIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();
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
        title: t("quickActions.updated"),
        description: `${action.title} ${newEnabled ? t("common.enabled") : t("common.disabled")}`,
      });
    } catch (error) {
      console.error('Error updating action:', error);
      // Revert on error
      setActions(actions.map(a => 
        a.id === id ? { ...a, is_enabled: !newEnabled } : a
      ));
      toast({
        title: t("toast.error"),
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
        title: t("quickActions.actionRemoved"),
        description: `${action.title} ${t("quickActions.hasBeenDeleted")}`,
      });
    } catch (error) {
      console.error('Error deleting action:', error);
      // Revert on error
      await loadActions();
      toast({
        title: t("toast.error"),
        variant: "destructive",
      });
    }
  };

  const handleAddNew = async () => {
    if (!user) return;
    
    if (!newActionTitle.trim()) {
      toast({
        title: t("quickActions.titleRequired"),
        description: t("quickActions.enterTitleDesc"),
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
        title: t("quickActions.actionAdded"),
        description: t("quickActions.newActionCreated"),
      });
    } catch (error) {
      console.error('Error adding action:', error);
      toast({
        title: t("toast.error"),
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    toast({
      title: t("quickActions.updated"),
      description: t("quickActions.changesSaved"),
    });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-2xl font-bold">{t("quickActions.title")}</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-muted-foreground">{t("quickActions.subtitle")}</p>

        {/* Current Actions */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-4">{t("quickActions.loading")}</p>
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
              {t("quickActions.addNew")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("quickActions.addNewTitle")}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("quickActions.actionTitle")}</label>
                <Input
                  placeholder={t("quickActions.enterTitle")}
                  value={newActionTitle}
                  onChange={(e) => setNewActionTitle(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("quickActions.subtitleLabel")}</label>
                <Input
                  placeholder={t("quickActions.enterSubtitle")}
                  value={newActionSubtitle}
                  onChange={(e) => setNewActionSubtitle(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleAddNew} className="flex-1 bg-primary hover:bg-primary/90">
                  {t("quickActions.addAction")}
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
                  {t("common.cancel")}
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
          {t("quickActions.saveChanges")}
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
            <span className="text-[10px] font-medium">{t("nav.home")}</span>
          </button>
          <button
            onClick={() => navigate("/vault")}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground"
          >
            <LockIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t("nav.vault")}</span>
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">{t("nav.settings")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizeQuickActions;
