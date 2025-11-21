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
  const [triggers, setTriggers] = useState<any[]>([]);
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
    const newTrigger = {
      id: Date.now(),
      ...formData
    };
    setTriggers([...triggers, newTrigger]);
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
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Upload from your device or Google Drive</p>
                <div className="flex gap-3 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*,application/pdf,video/*';
                      input.onchange = (e: any) => {
                        const file = e.target.files[0];
                        if (file) {
                          toast({
                            title: "File uploaded",
                            description: `${file.name} has been attached`,
                          });
                        }
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    Device
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      window.open('https://drive.google.com/drive/my-drive', '_blank');
                      toast({
                        title: "Opening Google Drive",
                        description: "Select your file and share it with the app",
                      });
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/>
                    </svg>
                    Google Drive
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Maximum file size: 10MB</p>
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

        {/* Your Triggers Section - Only show when triggers exist */}
        {triggers.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Your Triggers</h2>
            
            {triggers.map((trigger) => (
              <div key={trigger.id} className="bg-card rounded-2xl p-4">
                <h3 className="font-semibold text-foreground mb-1">{trigger.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{trigger.description}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>Type: {trigger.type}</span>
                  <span>•</span>
                  <span>Duration: {trigger.duration} days</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Trigger Button - Show when no form and no triggers */}
        {!showCreateForm && triggers.length === 0 && (
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
        )}
        
        {/* Create Button when triggers exist */}
        {!showCreateForm && triggers.length > 0 && (
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12"
          >
            + Create New Trigger
          </Button>
        )}

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
