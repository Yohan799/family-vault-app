import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSave = () => {
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast({
        title: "All fields required",
        description: "Please fill in all password fields",
        variant: "destructive"
      });
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Password changed!",
      description: "Your password has been updated successfully",
    });
    navigate("/settings");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-primary-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Change Password</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Current Password</label>
            <Input
              type="password"
              placeholder="Enter current password"
              value={formData.currentPassword}
              onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
              className="bg-card border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">New Password</label>
            <Input
              type="password"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
              className="bg-card border-border"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Confirm New Password</label>
            <Input
              type="password"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              className="bg-card border-border"
            />
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">
            Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.
          </p>
        </div>

        <Button 
          onClick={handleSave}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12"
        >
          Update Password
        </Button>
      </div>
    </div>
  );
};

export default ChangePassword;
