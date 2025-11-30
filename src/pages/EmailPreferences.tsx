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
    <div className="min-h-screen bg-background pb-safe">
      {/* Mobile-optimized header */}
      <div className="bg-primary/20 text-foreground p-4 sm:p-6 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/settings")} 
            className="text-primary-foreground min-h-[44px] min-w-[44px]"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold">Email Preferences</h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <p className="text-sm sm:text-base text-muted-foreground px-1">
          Manage your email addresses for account notifications and recovery.
        </p>

        {/* Mobile-optimized email list */}
        <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
          {emails.map((email, index) => (
            <div key={index} className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4 min-h-[72px]">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base truncate">{email}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {index === 0 ? "Primary" : "Secondary"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteEmail(index)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px] px-3 sm:px-4 shrink-0"
              >
                Delete
              </Button>
            </div>
          ))}
        </div>

        {/* Mobile-optimized add email form */}
        {isAdding ? (
          <div className="bg-card rounded-2xl p-4 sm:p-5 space-y-4">
            <Input
              type="email"
              placeholder="Enter new email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-background h-12 text-base"
              autoFocus
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleAddEmail}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base"
              >
                Add Email
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewEmail("");
                }}
                className="h-12 text-base sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setIsAdding(true)}
            variant="outline"
            className="w-full h-12 sm:h-14 rounded-xl text-base active:scale-98 transition-transform"
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
