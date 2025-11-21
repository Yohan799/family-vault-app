import { ArrowLeft, Shield, Home, Lock as LockIcon, Settings, AlertTriangle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const InactivityTriggers = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "no-login",
    duration: "30"
  });

  const handleCreateTrigger = () => {
    if (!formData.name || !formData.duration) {
      toast({
        title: "Required fields missing",
        description: "Please fill in trigger name and duration",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Trigger created successfully!",
      description: `${formData.name} has been activated`,
    });
    setFormData({ name: "", description: "", type: "no-login", duration: "30" });
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-primary-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1 text-center -ml-10">
            <h1 className="text-2xl font-bold">Inactivity Triggers</h1>
            <p className="text-sm opacity-90 mt-1">Monitor account activity</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary-foreground/20 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm opacity-90">Active</div>
          </div>
          <div className="bg-primary-foreground/20 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm opacity-90">Inactive</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Create Trigger Form */}
        {showCreateForm && (
          <div className="bg-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground mb-4">+ Create New Trigger</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Trigger Name *</label>
              <Input
                placeholder="Enter trigger name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Textarea
                placeholder="Describe what this trigger monitors..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-background border-border min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Trigger Type</label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-login">No Login - Monitor login activity</SelectItem>
                  <SelectItem value="no-activity">No Activity - Monitor general activity</SelectItem>
                  <SelectItem value="custom">Custom - Define your own trigger</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Duration (Days) *</label>
              <Input
                type="number"
                placeholder="30"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: e.target.value})}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Attachment (Optional)</label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">Click to upload image, PDF, or video</p>
                <p className="text-xs text-muted-foreground">Maximum file size: 10MB</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreateTrigger} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12">
                Create Trigger
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="flex-1 rounded-xl h-12 border-border"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Your Triggers Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Your Triggers</h2>
          
          <div className="bg-card rounded-2xl p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Triggers Set</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create inactivity triggers to monitor your account and alert nominees when needed.
            </p>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8"
            >
              + Create Trigger
            </Button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-4 flex gap-3">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">How Inactivity Triggers Work</h3>
            <p className="text-sm text-muted-foreground">
              Inactivity triggers monitor your account for signs of activity. If no activity is detected 
              within the specified timeframe, your nominated contacts will be alerted and may gain access 
              to your vault according to your emergency protocol.
            </p>
          </div>
        </div>
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
          <button className="flex flex-col items-center gap-1 text-primary">
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

export default InactivityTriggers;
