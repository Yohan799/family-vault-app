import { ArrowLeft, Users, ChevronDown, Home, Lock as LockIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const NomineeCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    relation: "",
    email: "",
    phone: ""
  });

  const handleAddNominee = () => {
    if (!formData.fullName || !formData.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in full name and email address",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Verification code sent!",
      description: `A verification code has been sent to ${formData.email}`,
    });
    setFormData({ fullName: "", relation: "", email: "", phone: "" });
    setShowAddForm(false);
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
            <h1 className="text-2xl font-bold">Nominee Center</h1>
            <p className="text-sm opacity-90 mt-1">Manage trusted contacts</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-primary-foreground/20 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm opacity-90">Total</div>
          </div>
          <div className="bg-primary-foreground/20 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm opacity-90">Verified</div>
          </div>
          <div className="bg-primary-foreground/20 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1">0</div>
            <div className="text-sm opacity-90">Pending</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Add Nominee Form */}
        {showAddForm && (
          <div className="bg-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground mb-4">+ Add New Nominee</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <Input
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Relation</label>
                <Select value={formData.relation} onValueChange={(value) => setFormData({...formData, relation: value})}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">Spouse</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email Address *</label>
              <Input
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="bg-background border-border"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleAddNominee} className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12">
                Add & Send Code
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-xl h-12 border-border"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Your Nominees Section - Only show when not in add form */}
        {!showAddForm && (
          <div className="space-y-4">
            <div className="bg-card rounded-2xl p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No Nominees Yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Add trusted contacts who can access your vault in emergencies.
              </p>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8"
              >
                + Add Nominee
              </Button>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-sm">i</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">About Nominees</h3>
            <p className="text-sm text-muted-foreground">
              Nominees are trusted individuals who can access your vault under specific conditions. 
              They must verify their identity through OTP before gaining access. You can add up to 5 nominees.
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

export default NomineeCenter;
