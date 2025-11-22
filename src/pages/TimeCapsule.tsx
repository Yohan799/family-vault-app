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
  const [capsules, setCapsules] = useState<any[]>([]);
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
    const newCapsule = {
      id: Date.now(),
      ...formData
    };
    setCapsules([...capsules, newCapsule]);
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
      <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1 text-center -ml-10">
            <h1 className="text-2xl font-bold">Time Capsule</h1>
            <p className="text-sm text-muted-foreground mt-1">Create messages for the future</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card/50 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm text-muted-foreground">Scheduled</div>
          </div>
          <div className="bg-card/50 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm text-muted-foreground">Released</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground mb-4">+ Create New Time Capsule</h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title *</label>
              <Input
                placeholder="Enter capsule title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Message</label>
              <Textarea
                placeholder="Write your message for the future..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="bg-background border-border min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Release Date *</label>
              <Input
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Recipient Email *</label>
              <Input
                type="email"
                placeholder="Enter recipient email address"
                value={formData.recipientEmail}
                onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <Input
                type="tel"
                placeholder="Enter phone number (optional)"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Attachment (Optional)</label>
              <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-3">Upload from your device, Google Drive, or DigiLocker</p>
                <div className="flex gap-3 justify-center flex-wrap">
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
                          const maxSize = 20 * 1024 * 1024; // 20MB in bytes
                          if (file.size > maxSize) {
                            toast({
                              title: "File too large",
                              description: "Maximum file size is 20MB",
                              variant: "destructive"
                            });
                            return;
                          }
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
                      <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                    </svg>
                    Google Drive
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      window.open('https://digilocker.gov.in/', '_blank');
                      toast({
                        title: "Opening DigiLocker",
                        description: "Select your file and share it with the app",
                      });
                    }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V7.3l7-3.11v8.8z" />
                    </svg>
                    DigiLocker
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">Maximum file size: 20MB</p>
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

        {/* Your Capsules Section - Only show when capsules exist */}
        {capsules.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Your Time Capsules</h2>

            {capsules.map((capsule) => (
              <div key={capsule.id} className="bg-card rounded-2xl p-4">
                <h3 className="font-semibold text-foreground mb-1">{capsule.title}</h3>
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{capsule.message}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>Release: {capsule.releaseDate}</span>
                  <span>•</span>
                  <span>{capsule.recipientEmail}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Capsule Button - Show when no form and no capsules */}
        {!showCreateForm && capsules.length === 0 && (
          <div className="bg-card rounded-2xl p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <Clock className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Time Capsules Yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first time capsule to send messages to the future.
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8"
            >
              + Create Time Capsule
            </Button>
          </div>
        )}

        {/* Create Button when capsules exist */}
        {!showCreateForm && capsules.length > 0 && (
          <Button
            onClick={() => setShowCreateForm(true)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 gap-2"
          >
            <Send className="w-4 h-4" />
            Create New Time Capsule
          </Button>
        )}

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
