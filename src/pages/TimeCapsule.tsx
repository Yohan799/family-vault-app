import { ArrowLeft, Clock, Home, Lock as LockIcon, Settings, Info, Upload, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const TimeCapsule = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    releaseDate: "",
    recipientEmail: "",
    phone: ""
  });

  const handleCreateCapsule = () => {
    if (!formData.title || !formData.message || !formData.releaseDate || !formData.recipientEmail) {
      toast({
        title: "Required fields missing",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Time capsule created!",
      description: `${formData.title} will be released on ${formData.releaseDate}`,
    });
    setFormData({ title: "", message: "", releaseDate: "", recipientEmail: "", phone: "" });
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
            <h1 className="text-2xl font-bold">Time Capsule</h1>
            <p className="text-sm opacity-90 mt-1">Create messages for the future</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary-foreground/20 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm opacity-90">Scheduled</div>
          </div>
          <div className="bg-primary-foreground/20 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm opacity-90">Released</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Create Capsule Button */}
        {!showCreateForm && (
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl h-14 text-base font-semibold"
          >
            + Create Time Capsule
          </Button>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground mb-4">+ Create New Time Capsule</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input
                placeholder="Enter capsule title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Message</label>
              <Textarea
                placeholder="Write your message for the future..."
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="bg-background border-border min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Release Date *</label>
              <Input
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Recipient Email *</label>
              <Input
                type="email"
                placeholder="Enter recipient email address"
                value={formData.recipientEmail}
                onChange={(e) => setFormData({...formData, recipientEmail: e.target.value})}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <Input
                type="tel"
                placeholder="Enter phone number (optional)"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
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
              <Button onClick={handleCreateCapsule} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 gap-2">
                <Send className="w-4 h-4" />
                Create Capsule
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

        {/* Your Capsules Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Your Time Capsules</h2>
          
          <div className="bg-card rounded-2xl p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Clock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Time Capsules Yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first time capsule to send messages to the future.
            </p>
            {!showCreateForm && (
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8"
              >
                + Create Time Capsule
              </Button>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Info className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">About Time Capsules</h3>
            <p className="text-sm text-muted-foreground">
              Time capsules allow you to create messages that will be automatically released at a future date. 
              They can be sent to specific recipients or accessed by your nominees when conditions are met.
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

export default TimeCapsule;
