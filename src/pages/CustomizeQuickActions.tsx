import { ArrowLeft, Home, Lock as LockIcon, Settings, Plus, GripVertical, Trash2, Shield, Users, Bell, Clock, Vault, UserPlus, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  path?: string;
  isDefault: boolean;
  isEnabled: boolean;
}

const ICON_MAP: { [key: string]: any } = {
  Vault,
  UserPlus,
  Shield,
  Timer,
  Plus,
  Bell,
  Clock,
  Users,
};

const SortableAction = ({ action, onToggle, onDelete }: { action: QuickAction; onToggle: (id: string) => void; onDelete: (id: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = action.icon;

  return (
    <div ref={setNodeRef} style={style} className="bg-card rounded-xl p-4 flex items-center gap-4">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground">{action.title}</h3>
        <p className="text-sm text-muted-foreground">{action.subtitle}</p>
      </div>
      <div className="flex items-center gap-2">
        <Switch 
          checked={action.isEnabled}
          onCheckedChange={() => onToggle(action.id)}
        />
        {!action.isDefault && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(action.id)}
            className="text-destructive"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};

const CustomizeQuickActions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionSubtitle, setNewActionSubtitle] = useState("");
  
  const defaultActions: QuickAction[] = [
    { id: "vault", title: "Digital Vault", subtitle: "Manage your secure documents", icon: Vault, path: "/vault", isDefault: true, isEnabled: true },
    { id: "nominee", title: "Nominee Center", subtitle: "Manage trusted contacts", icon: UserPlus, path: "/nominee-center", isDefault: true, isEnabled: true },
    { id: "triggers", title: "Inactivity Triggers", subtitle: "Set up activity monitoring", icon: Shield, path: "/inactivity-triggers", isDefault: true, isEnabled: true },
    { id: "capsule", title: "Time Capsule", subtitle: "Create legacy messages", icon: Timer, path: "/time-capsule", isDefault: true, isEnabled: true },
  ];

  const [actions, setActions] = useState<QuickAction[]>(defaultActions);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const saved = localStorage.getItem("quickActions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const actionsWithIcons = parsed.map((action: any) => ({
          ...action,
          icon: ICON_MAP[action.iconName] || Plus,
        }));
        setActions(actionsWithIcons);
      } catch (e) {
        console.error("Failed to load quick actions", e);
      }
    }
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setActions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleToggle = (id: string) => {
    setActions(actions.map(action => 
      action.id === id ? { ...action, isEnabled: !action.isEnabled } : action
    ));
  };

  const handleDelete = (id: string) => {
    setActions(actions.filter(action => action.id !== id));
    toast({
      title: "Action removed",
      description: "Quick action has been deleted",
    });
  };

  const handleAddNew = () => {
    if (!newActionTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your quick action",
        variant: "destructive"
      });
      return;
    }
    
    const newAction: QuickAction = {
      id: Date.now().toString(),
      title: newActionTitle,
      subtitle: newActionSubtitle || "Custom action",
      icon: Plus,
      isDefault: false,
      isEnabled: true
    };
    
    setActions([...actions, newAction]);
    setNewActionTitle("");
    setNewActionSubtitle("");
    setShowAddDialog(false);
    toast({
      title: "Action added!",
      description: "New quick action has been created",
    });
  };

  const handleSave = () => {
    const actionsToSave = actions.map(action => ({
      ...action,
      iconName: Object.keys(ICON_MAP).find(key => ICON_MAP[key] === action.icon) || 'Plus',
      icon: undefined,
    }));
    localStorage.setItem("quickActions", JSON.stringify(actionsToSave));
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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={actions.map(a => a.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {actions.map((action) => (
                <SortableAction
                  key={action.id}
                  action={action}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

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
