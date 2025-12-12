import { Users, Home, Vault, Settings, Mail, Phone, CheckCircle, Clock, Edit2, Trash2, RefreshCw } from "lucide-react";
import BackButton from "@/components/BackButton";
import { validateGmailOnly, validatePhoneExact10 } from "@/lib/validation";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { AvatarSelector, getAvatarById } from "@/components/AvatarSelector";
import { NomineeSkeleton } from "@/components/skeletons";

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
  const { t } = useLanguage();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; nominee: Nominee | null }>({ open: false, nominee: null });
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
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
      setIsPageLoading(true);
      const { data, error } = await supabase
        .from("nominees")
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading nominees:", error);
        toast({
          title: t("toast.error"),
          description: error.message,
          variant: "destructive"
        });
        setIsPageLoading(false);
        return;
      }

      setNominees(data || []);
      setIsPageLoading(false);
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
  }, [user, t]);

  if (isPageLoading) {
    return <NomineeSkeleton />;
  }

  // Calculate stats
  const totalNominees = nominees.length;
  const verifiedNominees = nominees.filter(n => n.status === 'verified').length;
  const pendingNominees = nominees.filter(n => n.status === 'pending').length;

  const handleAddNominee = async () => {
    if (!formData.fullName || !formData.email) {
      toast({
        title: t("toast.error"),
        description: t("common.error"),
        variant: "destructive"
      });
      return;
    }

    // Gmail-only validation
    if (!validateGmailOnly(formData.email)) {
      toast({
        title: t("toast.error"),
        description: t("nominee.gmailOnly"),
        variant: "destructive"
      });
      return;
    }

    // Phone validation (if provided)
    if (formData.phone && !validatePhoneExact10(formData.phone)) {
      toast({
        title: t("toast.error"),
        description: t("nominee.digitsOnly"),
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: t("toast.error"),
        description: t("auth.signIn"),
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
            title: t("toast.error"),
            description: t("auth.signIn"),
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
          title: t("toast.updated"),
          description: `${formData.fullName} ${t("toast.updated").toLowerCase()}`
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
          title: t("toast.error"),
          description: t("auth.signIn"),
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

      toast({
        title: t("toast.success"),
        description: `${formData.fullName} ${t("nominee.add").toLowerCase()}`,
      });

      setFormData({ fullName: '', relation: '', email: '', phone: '', avatarUrl: 'avatar-1' });
      setShowAddForm(false);
    } catch (error: any) {
      console.error("Error adding nominee:", error);
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async (nominee: Nominee) => {
    setResendingId(nominee.id);

    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      const { error } = await supabase.functions.invoke('send-nominee-verification', {
        body: {
          nomineeId: nominee.id,
          nomineeEmail: nominee.email,
          nomineeName: nominee.full_name,
          userId: currentUser?.id
        }
      });

      if (error) throw error;

      toast({
        title: t("nominee.verificationLinkSent"),
        description: `${nominee.email}`,
      });
    } catch (error: any) {
      console.error("Error resending verification:", error);
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleEditNominee = (nominee: Nominee) => {
    setFormData({
      fullName: nominee.full_name,
      relation: nominee.relation || '',
      email: nominee.email,
      phone: nominee.phone || '',
      avatarUrl: nominee.avatar_url || 'avatar-1'
    });
    setEditingId(nominee.id);
    setShowAddForm(true);
  };

  const handleDeleteNominee = async () => {
    if (!deleteDialog.nominee || !user) return;

    const nomineeToDelete = deleteDialog.nominee;
    setIsDeletingId(nomineeToDelete.id);

    try {
      const { error } = await supabase.rpc('soft_delete_nominee', {
        _nominee_id: nomineeToDelete.id,
        _user_id: user.id
      });

      if (error) throw error;

      // Manual refresh to ensure UI updates (fallback for realtime)
      setNominees(prev => prev.filter(n => n.id !== nomineeToDelete.id));

      toast({
        title: t("toast.deleted"),
        description: `${nomineeToDelete.full_name} ${t("toast.deleted").toLowerCase()}`
      });

      setDeleteDialog({ open: false, nominee: null });
    } catch (error: any) {
      console.error("Error deleting nominee:", error);
      toast({
        title: t("toast.error"),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  const getRelationLabel = (relation: string) => {
    const key = `relation.${relation.toLowerCase()}`;
    return t(key) !== key ? t(key) : relation;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary/20 text-foreground p-4 pt-10 sm:p-6 sm:pt-10 rounded-b-3xl">
        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <BackButton />
          <div className="flex-1 text-center -ml-9 sm:-ml-10">
            <h1 className="text-xl sm:text-2xl font-bold">{t("nominee.title")}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t("nominee.subtitle")}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <div className="bg-card/50 rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold mb-1">{totalNominees}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{t("nominee.total")}</div>
          </div>
          <div className="bg-card/50 rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold mb-1 text-green-600">{verifiedNominees}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{t("nominee.verified")}</div>
          </div>
          <div className="bg-card/50 rounded-xl p-3 sm:p-4 text-center backdrop-blur-sm">
            <div className="text-2xl sm:text-3xl font-bold mb-1 text-orange-600">{pendingNominees}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{t("nominee.pending")}</div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Add Nominee Form */}
        {showAddForm && (
          <div className="bg-card rounded-2xl p-4 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">
              {editingId ? `✏️ ${t("nominee.editNominee")}` : `+ ${t("nominee.addNewNominee")}`}
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
                <label className="text-sm font-medium text-foreground">{t("nominee.fullNameRequired")}</label>
                <Input
                  placeholder={t("nominee.fullName")}
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-background border-border"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">{t("nominee.relation")}</label>
                <Select value={formData.relation} onValueChange={(value) => setFormData({ ...formData, relation: value })}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder={t("nominee.selectRelation")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="spouse">{t("relation.spouse")}</SelectItem>
                    <SelectItem value="child">{t("relation.child")}</SelectItem>
                    <SelectItem value="parent">{t("relation.parent")}</SelectItem>
                    <SelectItem value="sibling">{t("relation.sibling")}</SelectItem>
                    <SelectItem value="friend">{t("relation.friend")}</SelectItem>
                    <SelectItem value="other">{t("relation.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("nominee.emailRequired")}</label>
              <Input
                type="email"
                placeholder="example@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground">{t("nominee.gmailOnly")}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("nominee.phoneOptional")}</label>
              <Input
                type="tel"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                  setFormData({ ...formData, phone: value });
                }}
                maxLength={10}
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground">{t("nominee.digitsOnly")}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={handleAddNominee}
                disabled={isLoading}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11 sm:h-12 text-sm sm:text-base"
              >
                {isLoading ? t("common.loading") : (editingId ? t("nominee.updateNominee") : t("nominee.addAndSendLink"))}
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
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        )}

        {/* Your Nominees Section */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-foreground">{t("nominee.yourNominees")}</h2>
            {nominees.length > 0 && !showAddForm && (
              <Button
                onClick={() => setShowAddForm(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs sm:text-sm h-8 sm:h-9 px-3 sm:px-4"
              >
                + {t("nominee.add")}
              </Button>
            )}
          </div>

          {nominees.length === 0 ? (
            <div className="bg-card rounded-2xl p-6 sm:p-8 text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">{t("nominee.noNomineesYet")}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 px-4">
                {t("nominee.noNomineesDesc")}
              </p>
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 sm:px-8 h-10 sm:h-11 text-sm sm:text-base"
                >
                  + {t("nominee.add")}
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
                          {t("nominee.verified")}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium whitespace-nowrap">
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {t("nominee.pending")}
                        </div>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{nominee.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{getRelationLabel(nominee.relation || '')}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    {nominee.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResendVerification(nominee)}
                        disabled={resendingId === nominee.id}
                        className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                      >
                        <RefreshCw className={`w-4 h-4 ${resendingId === nominee.id ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNominee(nominee)}
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialog({ open: true, nominee })}
                      className="h-8 w-8 sm:h-9 sm:w-9 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, nominee: open ? deleteDialog.nominee : null })}
        title={t("nominee.delete")}
        description={t("nominee.deleteConfirm")}
        confirmText={t("common.delete")}
        onConfirm={handleDeleteNominee}
        variant="destructive"
      />

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.home")}</span>
          </button>
          <button
            onClick={() => navigate("/vault")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Vault className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.vault")}</span>
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs font-medium">{t("nav.settings")}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NomineeCenter;