import { ArrowLeft, Users, Home, Vault, Settings, Mail, Phone, CheckCircle, Clock, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarSelector, getAvatarById } from "@/components/AvatarSelector";

interface Nominee {
  id: string;
  full_name: string;
  relation: string;
  email: string;
  phone: string | null;
  status: string;
  verified_at: string | null;
  avatar_url: string | null;
}

const NomineeCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; nominee: Nominee | null }>({ open: false, nominee: null });
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    relation: "",
    email: "",
    phone: "",
    avatarUrl: "avatar-1"
  });

  // Load nominees from Supabase
  useEffect(() => {
    if (!user) return;

    const loadNominees = async () => {
      const { data, error } = await supabase
        .from("nominees")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading nominees:", error);
        toast({
          title: "Error loading nominees",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      setNominees(data || []);
    };

    loadNominees();

    // Set up realtime subscription
    const channel = supabase
      .channel('nominees-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'nominees',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadNominees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Calculate stats
  const totalNominees = nominees.length;
  const verifiedNominees = nominees.filter(n => n.status === 'verified').length;
  const pendingNominees = nominees.filter(n => n.status === 'pending').length;

  const handleAddNominee = async () => {
    if (!formData.fullName || !formData.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in full name and email address",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to add nominees",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // If editing, update existing nominee
      if (editingId) {
        // Get fresh auth state
        await supabase.auth.refreshSession();
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !currentUser) {
          toast({
            title: "Authentication error",
            description: "Please sign in again",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }

        const { error } = await supabase
          .from("nominees")
          .update({
            full_name: formData.fullName,
            relation: formData.relation,
            email: formData.email,
            phone: formData.phone || null,
            avatar_url: formData.avatarUrl
          })
          .eq("id", editingId)
          .eq("user_id", currentUser.id);

        if (error) throw error;

        toast({
          title: 'Nominee Updated',
          description: `${formData.fullName} has been updated successfully.`
        });

        setFormData({ fullName: '', relation: '', email: '', phone: '', avatarUrl: 'avatar-1' });
        setEditingId(null);
        setShowAddForm(false);
        setIsLoading(false);
        return;
      }

      // Add new nominee with fresh auth
      await supabase.auth.refreshSession();
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser) {
        toast({
          title: "Authentication error",
          description: "Please sign in again",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      const { data: newNominee, error: insertError } = await supabase
        .from("nominees")
        .insert({
          user_id: currentUser.id,
          full_name: formData.fullName,
          relation: formData.relation || "Other",
          email: formData.email,
          phone: formData.phone || null,
          status: "pending",
          avatar_url: formData.avatarUrl
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Send verification email
      const { error: emailError } = await supabase.functions.invoke('send-nominee-verification', {
        body: {
          nomineeId: newNominee.id,
          nomineeEmail: formData.email,
          nomineeName: formData.fullName
        }
      });

      if (emailError) {
        console.error("Error sending verification email:", emailError);
        toast({
          title: "Nominee added but email failed",
          description: "Nominee was added but verification email could not be sent",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Nominee added successfully!",
          description: `Verification email sent to ${formData.email}`,
        });
      }

      setFormData({ fullName: '', relation: '', email: '', phone: '', avatarUrl: 'avatar-1' });
      setShowAddForm(false);
    } catch (error: any) {
      console.error("Error adding nominee:", error);
      toast({
        title: "Error adding nominee",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/20 text-foreground p-4 sm:p-6 rounded-b-3xl">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-foreground h-9 w-9 sm:h-10 sm:w-10">
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
          <div className="flex-1 text-center -ml-9 sm:-ml-10">
            <h1 className="text-xl sm:text-2xl font-bold">Nominee Center</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Manage trusted contacts</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-card/50 rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold mb-1">{totalNominees}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
          </div>
          <div className="bg-card/50 rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold mb-1 text-green-600">{verifiedNominees}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Verified</div>
          </div>
          <div className="bg-card/50 rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold mb-1 text-orange-600">{pendingNominees}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">Pending</div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Add Nominee Form */}
        {showAddForm && (
          <div className="bg-card rounded-2xl p-4 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">
              {editingId ? '✏️ Edit Nominee' : '+ Add New Nominee'}
            </h2>

            {/* Avatar Selector */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <AvatarSelector
                selectedAvatar={formData.avatarUrl}
                onSelectAvatar={(avatarId) => setFormData({ ...formData, avatarUrl: avatarId })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <Input
                  placeholder="Enter full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Relation</label>
                <Select value={formData.relation} onValueChange={(value) => setFormData({ ...formData, relation: value })}>
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Phone Number</label>
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={handleAddNominee} 
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 sm:h-12 text-sm sm:text-base"
              >
                {isLoading ? "Sending..." : (editingId ? "Update Nominee" : "Add & Send Link")}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingId(null);
                  setFormData({ fullName: '', relation: '', email: '', phone: '', avatarUrl: 'avatar-1' });
                }}
                className="flex-1 rounded-xl h-11 sm:h-12 border-border text-sm sm:text-base"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Your Nominees Section */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-foreground">Your Nominees</h2>
            {nominees.length > 0 && !showAddForm && (
              <Button
                onClick={() => setShowAddForm(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
              >
                + Add Nominee
              </Button>
            )}
          </div>

          {nominees.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 sm:p-8 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">No Nominees Yet</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 px-4">
                Add trusted contacts who can access your vault in emergencies.
              </p>
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 sm:px-8 h-10 sm:h-11 text-sm sm:text-base"
                >
                  + Add Nominee
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {nominees.map((nominee) => (
                <div
                  key={nominee.id}
                  className="bg-card rounded-2xl p-3 sm:p-4 flex items-start sm:items-center gap-3 sm:gap-4 hover:bg-accent/50 transition-colors"
                >
                  {/* Avatar */}
                  <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-primary/20 flex-shrink-0">
                    {nominee.avatar_url ? (
                      <div className={`w-full h-full rounded-full ${getAvatarById(nominee.avatar_url).bg} flex items-center justify-center`}>
                        <span className={`text-2xl ${getAvatarById(nominee.avatar_url).color}`}>
                          {getAvatarById(nominee.avatar_url).emoji}
                        </span>
                      </div>
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {nominee.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start sm:items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-foreground text-sm sm:text-base truncate">{nominee.full_name}</h3>
                      {nominee.status === 'verified' ? (
                        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap">
                          <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          Verified
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          Pending
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 capitalize">{nominee.relation}</p>
                    <div className="flex flex-col gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground">
                      <div className="flex items-center gap-1 truncate">
                        <Mail className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                        <span className="truncate">{nominee.email}</span>
                      </div>
                      {nominee.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                          <span>{nominee.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFormData({
                          fullName: nominee.full_name,
                          relation: nominee.relation || '',
                          email: nominee.email,
                          phone: nominee.phone || '',
                          avatarUrl: nominee.avatar_url || 'avatar-1'
                        });
                        setEditingId(nominee.id);
                        setShowAddForm(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="hover:bg-blue-100 hover:text-blue-600 h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteDialog({ open: true, nominee })}
                      className="hover:bg-red-100 hover:text-red-600 h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3 sm:p-4 flex gap-2.5 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-primary font-bold text-xs sm:text-sm">i</span>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1 text-sm sm:text-base">About Nominees</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Nominees are trusted individuals who can access your vault under specific conditions.
              They must verify their email before gaining access. You can add up to 5 nominees.
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
          <button
            onClick={() => navigate("/vault")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Vault className="w-6 h-6" />
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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, nominee: null })}
        title="Remove Nominee?"
        description={`Are you sure you want to remove ${deleteDialog.nominee?.full_name} as a nominee? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteDialog.nominee) return;
          
          const nomineeToDelete = deleteDialog.nominee;
          
          try {
            // 1. Force refresh session and CHECK for errors
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error('Session refresh failed:', refreshError);
              toast({
                title: 'Session expired',
                description: 'Please sign in again to continue',
                variant: 'destructive'
              });
              setDeleteDialog({ open: false, nominee: null });
              return;
            }
            
            // 2. Get fresh user from the refreshed session
            const currentUser = refreshData?.session?.user;
            
            if (!currentUser) {
              toast({
                title: 'Authentication error',
                description: 'Please sign in again',
                variant: 'destructive'
              });
              setDeleteDialog({ open: false, nominee: null });
              return;
            }
            
            // 3. Optimistic UI update - immediately remove from local state
            setNominees(prev => prev.filter(n => n.id !== nomineeToDelete.id));
            setDeleteDialog({ open: false, nominee: null });
            
            // 4. Cascade cleanup - remove related records
            // Delete verification tokens
            const { error: tokenError } = await supabase
              .from("verification_tokens")
              .delete()
              .eq("nominee_id", nomineeToDelete.id);
            
            if (tokenError) {
              console.error("Error deleting verification tokens:", tokenError);
            }
            
            // Delete access control records
            const { error: accessError } = await supabase
              .from("access_controls")
              .delete()
              .eq("nominee_id", nomineeToDelete.id)
              .eq("user_id", currentUser.id);
            
            if (accessError) {
              console.error("Error deleting access controls:", accessError);
            }
            
            // 5. Perform soft delete of nominee
            const { error: deleteError } = await supabase
              .from("nominees")
              .update({ deleted_at: new Date().toISOString() })
              .eq("id", nomineeToDelete.id)
              .eq("user_id", currentUser.id);

            if (deleteError) {
              console.error("Delete nominee error:", deleteError);
              // Rollback optimistic update by re-fetching
              const { data: revertData } = await supabase
                .from("nominees")
                .select("*")
                .eq("user_id", currentUser.id)
                .is("deleted_at", null)
                .order("created_at", { ascending: false });
              
              if (revertData) setNominees(revertData);
              
              toast({
                title: 'Error removing nominee',
                description: deleteError.message,
                variant: 'destructive'
              });
            } else {
              toast({
                title: 'Nominee Removed',
                description: `${nomineeToDelete.full_name} has been removed from your nominees.`
              });
            }
          } catch (err: any) {
            console.error("Unexpected error:", err);
            toast({
              title: 'Error',
              description: err.message || 'An unexpected error occurred',
              variant: 'destructive'
            });
            setDeleteDialog({ open: false, nominee: null });
          }
        }}
      />
    </div>
  );
};

export default NomineeCenter;
