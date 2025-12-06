import { ArrowLeft, Mail, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const EmailPreferences = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile, updateProfile } = useAuth();
  const [emails, setEmails] = useState<string[]>([]);
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load emails on mount
  useEffect(() => {
    if (profile) {
      const primary = profile.email || "";
      const additional = (profile.additional_emails as string[]) || [];
      setPrimaryEmail(primary);
      setEmails([primary, ...additional]);
      setIsLoading(false);
    }
  }, [profile]);

  const handleAddEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (emails.includes(newEmail)) {
      toast({
        title: "Email already exists",
        description: "This email is already added to your account",
        variant: "destructive",
      });
      return;
    }

    const newEmails = [...emails, newEmail];
    const additionalEmails = newEmails.filter(e => e !== primaryEmail);
    
    const { error } = await supabase
      .from("profiles")
      .update({ additional_emails: additionalEmails })
      .eq("id", profile?.id);

    if (error) {
      toast({
        title: "Error adding email",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setEmails(newEmails);
    setNewEmail("");
    setIsAdding(false);
    await updateProfile({ additional_emails: additionalEmails });
    toast({
      title: "Email added",
      description: `${newEmail} has been added to your account`,
    });
  };

  const handleDeleteEmail = async (index: number) => {
    const emailToDelete = emails[index];
    
    if (emails.length === 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one email address",
        variant: "destructive",
      });
      return;
    }

    // If deleting primary email, promote the first secondary email to primary
    if (emailToDelete === primaryEmail) {
      const newEmails = emails.filter((_, i) => i !== index);
      const newPrimaryEmail = newEmails[0]; // First remaining email becomes primary
      const newAdditionalEmails = newEmails.slice(1); // Rest become additional
      
      const { error } = await supabase
        .from("profiles")
        .update({ 
          email: newPrimaryEmail,
          additional_emails: newAdditionalEmails
        })
        .eq("id", profile?.id);

      if (error) {
        toast({
          title: "Error deleting email",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setPrimaryEmail(newPrimaryEmail);
      setEmails(newEmails);
      await updateProfile({ email: newPrimaryEmail, additional_emails: newAdditionalEmails });
      toast({
        title: "Primary email changed",
        description: `${newPrimaryEmail} is now your primary email`,
      });
      return;
    }

    // Delete secondary email
    const newEmails = emails.filter((_, i) => i !== index);
    const additionalEmails = newEmails.filter(e => e !== primaryEmail);
    
    const { error } = await supabase
      .from("profiles")
      .update({ additional_emails: additionalEmails })
      .eq("id", profile?.id);

    if (error) {
      toast({
        title: "Error deleting email",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setEmails(newEmails);
    await updateProfile({ additional_emails: additionalEmails });
    toast({
      title: "Email deleted",
      description: `${emailToDelete} has been removed from your account`,
    });
  };

  const handleSetPrimary = async (email: string) => {
    if (email === primaryEmail) {
      toast({
        title: "Already primary",
        description: "This email is already set as your primary email",
      });
      return;
    }

    const newAdditionalEmails = emails.filter(e => e !== email && e !== primaryEmail);
    newAdditionalEmails.push(primaryEmail);
    
    const { error } = await supabase
      .from("profiles")
      .update({ 
        email: email,
        additional_emails: newAdditionalEmails
      })
      .eq("id", profile?.id);

    if (error) {
      toast({
        title: "Error setting primary email",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setPrimaryEmail(email);
    setEmails([email, ...newAdditionalEmails]);
    await updateProfile({ email, additional_emails: newAdditionalEmails });
    toast({
      title: "Primary email updated",
      description: `${email} is now your primary email`,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-safe">
        <div className="bg-primary/20 text-foreground p-4 sm:p-6 rounded-b-3xl">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/settings")} className="p-2 hover:bg-accent rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">Email Preferences</h1>
          </div>
        </div>
        <div className="p-4 sm:p-6 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-safe">
      {/* Mobile-optimized header */}
      <div className="bg-primary/20 text-foreground p-4 sm:p-6 rounded-b-3xl">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/settings")} className="p-2 hover:bg-accent rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold">Email Preferences</h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <p className="text-sm sm:text-base text-muted-foreground px-1">
          Manage your email addresses for account notifications and recovery. <span className="font-medium text-foreground">Tap the star</span> to set an email as primary.
        </p>

        {/* Mobile-optimized email list */}
        <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
          {emails.map((email, index) => (
            <div key={index} className="p-4 sm:p-5 flex items-center gap-3 min-h-[72px]">
              <button
                onClick={() => handleSetPrimary(email)}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0 hover:bg-primary/20 transition-colors active:scale-95"
                title={email === primaryEmail ? "Primary email" : "Set as primary email"}
              >
                {email === primaryEmail ? (
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary" />
                ) : (
                  <Star className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm sm:text-base truncate">{email}</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {email === primaryEmail ? "Primary - Used for login & notifications" : "Secondary - Available for notifications"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteEmail(index)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px] px-3 sm:px-4 shrink-0"
                title={email === primaryEmail && emails.length > 1 ? "Delete (next email will become primary)" : "Delete email"}
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
