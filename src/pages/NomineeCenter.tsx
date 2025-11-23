import { ArrowLeft, Users, Home, Vault, Settings, Mail, Phone, CheckCircle, Clock, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface Nominee {
  id: string;
  fullName: string;
  relation: string;
  email: string;
  phone: string;
  verified: boolean;
  avatar: string;
}

const NomineeCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; nominee: Nominee | null }>({ open: false, nominee: null });
  const [formData, setFormData] = useState({
    fullName: "",
    relation: "",
    email: "",
    phone: ""
  });

  // Load nominees from localStorage
  useEffect(() => {
    const loadNominees = () => {
      const stored = localStorage.getItem("nominees");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setNominees(parsed);
        } catch (error) {
          console.error("Error loading nominees:", error);
        }
      }
    };

    loadNominees();

    // Listen for updates
    const handleStorageChange = () => {
      loadNominees();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("nomineesUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("nomineesUpdated", handleStorageChange);
    };
  }, []);

  // Calculate stats
  const totalNominees = nominees.length;
  const verifiedNominees = nominees.filter(n => n.verified).length;
  const pendingNominees = nominees.filter(n => !n.verified).length;

  const handleAddNominee = () => {
    if (!formData.fullName || !formData.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in full name and email address",
        variant: "destructive"
      });
      return;
    }

    // If editing, update existing nominee
    if (editingId) {
      const updated = nominees.map(n =>
        n.id === editingId
          ? {
            ...n,
            fullName: formData.fullName,
            relation: formData.relation,
            email: formData.email,
            phone: formData.phone
          }
          : n
      );
      setNominees(updated);
      localStorage.setItem('nominees', JSON.stringify(updated));
      window.dispatchEvent(new Event('nomineesUpdated'));

      toast({
        title: 'Nominee Updated',
        description: `${formData.fullName} has been updated successfully.`
      });

      setFormData({ fullName: '', relation: '', email: '', phone: '' });
      setEditingId(null);
      setShowAddForm(false);
      return;
    }

    // Show success toast for new nominee
    toast({
      title: "Verification code sent!",
      description: `OTP sent to ${formData.email}`,
    });

    // Navigate to OTP verification
    setTimeout(() => {
      navigate('/nominee-verification', {
        state: {
          email: formData.email,
          nomineeData: {
            fullName: formData.fullName,
            relation: formData.relation || "Other",
            phone: formData.phone,
          }
        }
      });
    }, 1500);
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
            <h1 className="text-2xl font-bold">Nominee Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage trusted contacts</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card/50 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1">{totalNominees}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </div>
          <div className="bg-card/50 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1 text-green-600">{verifiedNominees}</div>
            <div className="text-sm text-muted-foreground">Verified</div>
          </div>
          <div className="bg-card/50 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1 text-orange-600">{pendingNominees}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Add Nominee Form */}
        {showAddForm && (
          <div className="bg-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {editingId ? '✏️ Edit Nominee' : '+ Add New Nominee'}
            </h2>

            <div className="grid grid-cols-2 gap-4">
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

        {/* Your Nominees Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Your Nominees</h2>
            {nominees.length > 0 && !showAddForm && (
              <Button
                onClick={() => setShowAddForm(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl"
              >
                + Add Nominee
              </Button>
            )}
          </div>

          {nominees.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No Nominees Yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Add trusted contacts who can access your vault in emergencies.
              </p>
              {!showAddForm && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8"
                >
                  + Add Nominee
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {nominees.map((nominee) => (
                <div
                  key={nominee.id}
                  className="bg-card rounded-2xl p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors"
                >
                  {/* Avatar */}
                  <Avatar className="w-14 h-14 border-2 border-primary/20">
                    <AvatarImage src={nominee.avatar} alt={nominee.fullName} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {nominee.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-foreground">{nominee.fullName}</h3>
                      {nominee.verified ? (
                        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" />
                          Pending
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{nominee.relation}</p>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {nominee.email}
                      </div>
                      {nominee.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {nominee.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFormData({
                          fullName: nominee.fullName,
                          relation: nominee.relation,
                          email: nominee.email,
                          phone: nominee.phone || ''
                        });
                        setEditingId(nominee.id);
                        setShowAddForm(true);
                      }}
                      className="hover:bg-blue-100 hover:text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteDialog({ open: true, nominee })}
                      className="hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        < div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3" >
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
        description={`Are you sure you want to remove ${deleteDialog.nominee?.fullName} as a nominee? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (deleteDialog.nominee) {
            const updated = nominees.filter(n => n.id !== deleteDialog.nominee!.id);
            setNominees(updated);
            localStorage.setItem('nominees', JSON.stringify(updated));
            window.dispatchEvent(new Event('nomineesUpdated'));
            window.dispatchEvent(new Event('countsUpdated'));
            toast({
              title: 'Nominee Removed',
              description: `${deleteDialog.nominee.fullName} has been removed from your nominees.`
            });
            setDeleteDialog({ open: false, nominee: null });
          }
        }}
      />
    </div>
  );
};

export default NomineeCenter;
