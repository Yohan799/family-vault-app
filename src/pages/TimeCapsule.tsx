import { ArrowLeft, Clock, Home, Vault, Settings, Info, Send, Edit2, Trash2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { timeCapsuleService, TimeCapsule as TimeCapsuleType } from "@/services/timeCapsuleService";
import { openGoogleDrivePicker, downloadFileFromGoogleDrive } from "@/lib/googleDrivePicker";
import { scanDocument } from "@/lib/documentScanner";
import { TimeCapsuleSkeleton } from "@/components/skeletons";

const TimeCapsule = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; capsule: TimeCapsuleType | null }>({ open: false, capsule: null });
  const [capsules, setCapsules] = useState<TimeCapsuleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    releaseDate: "",
    recipientEmail: "",
    phone: "",
    attachmentFile: null as File | null
  });

  useEffect(() => {
    loadCapsules();
  }, []);

  const loadCapsules = async () => {
    setIsPageLoading(true);
    try {
      const data = await timeCapsuleService.getAll();
      setCapsules(data);
    } catch (error) {
      console.error("Error loading capsules:", error);
      toast({
        title: "Error",
        description: "Failed to load time capsules",
        variant: "destructive"
      });
    } finally {
      setIsPageLoading(false);
    }
  };

  if (isPageLoading) {
    return <TimeCapsuleSkeleton />;
  }

  const handleScanDocument = async () => {
    try {
      const result = await scanDocument();
      if (result) {
        const maxSize = 20 * 1024 * 1024;
        if (result.file.size > maxSize) {
          toast({
            title: "File too large",
            description: "Maximum file size is 20MB",
            variant: "destructive"
          });
          return;
        }
        setFormData({ ...formData, attachmentFile: result.file });
        toast({
          title: "Document scanned",
          description: `${result.file.name} has been attached`,
        });
      }
    } catch (error) {
      console.error('Error scanning document:', error);
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan document",
        variant: "destructive"
      });
    }
  };

  const handleGoogleDrivePick = async () => {
    try {
      const file = await openGoogleDrivePicker();
      if (file) {
        toast({
          title: "Downloading from Google Drive",
          description: "Please wait...",
        });

        const blob = await downloadFileFromGoogleDrive(file);
        const driveFile = new File([blob], file.name, { type: file.mimeType });
        
        setFormData({ ...formData, attachmentFile: driveFile });
        toast({
          title: "File attached from Google Drive",
          description: `${file.name} has been attached`,
        });
      }
    } catch (error) {
      console.error('Error picking file from Google Drive:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to access Google Drive";
      toast({
        title: "Google Drive Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleCreateCapsule = async () => {
    if (!formData.title || !formData.releaseDate || !formData.recipientEmail) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let attachmentUrl: string | undefined;

      // Upload attachment if exists
      if (formData.attachmentFile && !editingId) {
        const tempId = crypto.randomUUID();
        attachmentUrl = await timeCapsuleService.uploadAttachment(formData.attachmentFile, tempId);
      }

      if (editingId) {
        // Update existing capsule
        await timeCapsuleService.update(editingId, {
          title: formData.title,
          message: formData.message,
          release_date: formData.releaseDate,
          recipient_email: formData.recipientEmail,
          phone: formData.phone || null
        });

        toast({
          title: "Time capsule updated!",
          description: `${formData.title} has been updated successfully`,
        });
      } else {
        // Create new capsule
        await timeCapsuleService.create({
          title: formData.title,
          message: formData.message,
          release_date: formData.releaseDate,
          recipient_email: formData.recipientEmail,
          phone: formData.phone,
          attachment_url: attachmentUrl
        });

        toast({
          title: "Time capsule created!",
          description: `${formData.title} will be released on ${formData.releaseDate}`,
        });
      }

      await loadCapsules();
      setFormData({ title: "", message: "", releaseDate: "", recipientEmail: "", phone: "", attachmentFile: null });
      setEditingId(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error saving capsule:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save time capsule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.capsule) return;

    const capsuleToDelete = deleteDialog.capsule;
    
    // Optimistic UI: Remove immediately
    setCapsules(prev => prev.filter(c => c.id !== capsuleToDelete.id));
    setDeleteDialog({ open: false, capsule: null });
    
    try {
      await timeCapsuleService.delete(capsuleToDelete.id);
      toast({
        title: 'Time Capsule Deleted',
        description: `"${capsuleToDelete.title}" has been deleted.`
      });
    } catch (error) {
      console.error("Error deleting capsule:", error);
      
      // Rollback on error
      await loadCapsules();
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete time capsule",
        variant: "destructive"
      });
    }
  };

  const scheduledCount = capsules.filter(c => c.status === 'scheduled').length;
  const releasedCount = capsules.filter(c => c.status === 'released').length;

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
            <div className="text-3xl font-bold mb-1 text-blue-600">{scheduledCount}</div>
            <div className="text-sm text-muted-foreground">Scheduled</div>
          </div>
          <div className="bg-card/50 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1 text-green-600">{releasedCount}</div>
            <div className="text-sm text-muted-foreground">Released</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {editingId ? '✏️ Edit Time Capsule' : '+ Create New Time Capsule'}
            </h2>

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
              <div className="border-2 border-dashed border-border rounded-xl p-6">
                {formData.attachmentFile ? (
                  <div className="text-center">
                    <p className="text-sm text-foreground mb-2">📎 {formData.attachmentFile.name}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, attachmentFile: null })}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">Scan, upload from device, or import from Google Drive</p>
                    <div className="flex gap-3 justify-center flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 min-h-[44px] flex-1 min-w-[100px]"
                        onClick={handleScanDocument}
                      >
                        <Camera className="w-4 h-4" />
                        Scan
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 min-h-[44px] flex-1 min-w-[100px]"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*,application/pdf';
                          input.onchange = (e: any) => {
                            const file = e.target.files[0];
                            if (file) {
                              const maxSize = 20 * 1024 * 1024;
                              if (file.size > maxSize) {
                                toast({
                                  title: "File too large",
                                  description: "Maximum file size is 20MB",
                                  variant: "destructive"
                                });
                                return;
                              }
                              setFormData({ ...formData, attachmentFile: file });
                              toast({
                                title: "File attached",
                                description: `${file.name} has been attached`,
                              });
                            }
                          };
                          input.click();
                        }}
                      >
                        📁 Device
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 min-h-[44px] flex-1 min-w-[100px]"
                        onClick={handleGoogleDrivePick}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
                        </svg>
                        Drive
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Maximum file size: 20MB</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button 
                onClick={handleCreateCapsule} 
                className="w-full sm:flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 gap-2 min-h-[48px]"
                disabled={loading}
              >
                <Send className="w-4 h-4" />
                {loading ? "Saving..." : editingId ? "Update Capsule" : "Create Capsule"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingId(null);
                  setFormData({ title: "", message: "", releaseDate: "", recipientEmail: "", phone: "", attachmentFile: null });
                }}
                className="w-full sm:flex-1 rounded-xl h-12 border-border min-h-[48px]"
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Your Capsules Section */}
        {capsules.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground">Your Time Capsules</h2>

            {capsules.map((capsule) => (
              <div key={capsule.id} className="bg-card rounded-2xl p-4 flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground">{capsule.title}</h3>
                    {capsule.status === 'released' && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Released</span>
                    )}
                    {capsule.attachment_url && <span className="text-xs">📎</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{capsule.message}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground">
                    <span>Release: {new Date(capsule.release_date).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{capsule.recipient_email}</span>
                  </div>
                </div>

                {capsule.status !== 'released' && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setFormData({
                          title: capsule.title,
                          message: capsule.message,
                          releaseDate: capsule.release_date,
                          recipientEmail: capsule.recipient_email,
                          phone: capsule.phone || '',
                          attachmentFile: null
                        });
                        setEditingId(capsule.id);
                        setShowCreateForm(true);
                      }}
                      className="hover:bg-blue-100 hover:text-blue-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteDialog({ open: true, capsule })}
                      className="hover:bg-red-100 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Capsule Button */}
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
            Time capsules are automatically delivered to recipients on the scheduled release date via email.
            They're stored securely in your backend and can include attachments.
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex justify-around items-center h-14 max-w-md mx-auto">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Home</span>
          </button>
          <button
            onClick={() => navigate("/vault")}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground"
          >
            <Vault className="w-5 h-5" />
            <span className="text-[10px] font-medium">Vault</span>
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex flex-col items-center gap-0.5 text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, capsule: null })}
        title="Delete Time Capsule?"
        description={`Are you sure you want to delete "${deleteDialog.capsule?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default TimeCapsule;
