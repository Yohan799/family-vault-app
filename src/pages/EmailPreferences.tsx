import { ArrowLeft, Mail, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const EmailPreferences = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [emails, setEmails] = useState(["raj@example.com"]);
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddEmail = () => {
    if (newEmail && newEmail.includes("@")) {
      setEmails([...emails, newEmail]);
      setNewEmail("");
      setIsAdding(false);
      toast({
        title: "Email added",
        description: `${newEmail} has been added to your account`,
      });
    }
  };

  const handleDeleteEmail = (index: number) => {
    if (emails.length === 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one email address",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm("Are you sure you want to delete this email?")) {
      const deletedEmail = emails[index];
      setEmails(emails.filter((_, i) => i !== index));
      toast({
        title: "Email deleted",
        description: `${deletedEmail} has been removed from your account`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/settings")} className="text-primary-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Email Preferences</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-muted-foreground">
          Manage your email addresses for account notifications and recovery.
        </p>

        <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
          {emails.map((email, index) => (
            <div key={index} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{email}</p>
                <p className="text-xs text-muted-foreground">{index === 0 ? "Primary" : "Secondary"}</p>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleDeleteEmail(index)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                Delete
              </Button>
            </div>
          ))}
        </div>

        {isAdding ? (
          <div className="bg-card rounded-2xl p-4 space-y-4">
            <Input
              type="email"
              placeholder="Enter new email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-background"
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleAddEmail}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Add Email
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewEmail("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="w-full h-12 rounded-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Email
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmailPreferences;
