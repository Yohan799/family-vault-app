import { Clock, Home, Vault, Settings, Info, Send, Edit2, Trash2, Camera } from "lucide-react";
import BackButton from "@/components/BackButton";
import { validateGmailOnly, validatePhoneExact10 } from "@/lib/validation";
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
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { GoogleDriveBrowser } from "@/components/GoogleDriveBrowser";
import { ConnectGoogleDriveModal } from "@/components/ConnectGoogleDriveModal";
import { Capacitor } from "@capacitor/core";

const TimeCapsule = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const { hasGoogleIdentity, getGoogleAccessToken } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; capsule: TimeCapsuleType | null }>({ open: false, capsule: null });
  const [capsules, setCapsules] = useState<TimeCapsuleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [showDriveBrowser, setShowDriveBrowser] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
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
    console.log('[TimeCapsule] Loading capsules...');
    try {
      const data = await timeCapsuleService.getAll();
      console.log('[TimeCapsule] Loaded capsules:', data?.length || 0, 'items', data);
      setCapsules(data || []);
    } catch (error: any) {
      console.error("[TimeCapsule] Error loading capsules:", error);
      toast({
        title: t("common.error"),
        description: error?.message || t("toast.error"),
        variant: "destructive"
      });
      setCapsules([]);
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
            title: t("toast.uploadFailed"),
            description: t("document.maxSize"),
            variant: "destructive"
          });
          return;
        }
        setFormData({ ...formData, attachmentFile: result.file });
        toast({
          title: t("toast.uploadSuccess"),
          description: result.file.name,
        });
      }
    } catch (error) {
      console.error('Error scanning document:', error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("toast.uploadFailed"),
        variant: "destructive"
      });
    }
  };

  const handleGoogleDrivePick = async () => {
    const isNative = Capacitor.isNativePlatform();

    // Check if user has Google access token (works for both platforms)
    if (hasGoogleIdentity || isNative) {
      const token = await getGoogleAccessToken();
      if (token) {
        console.log('[TimeCapsule] Got access token, opening Drive browser');
        setDriveAccessToken(token);
        setShowDriveBrowser(true);
        return;
      }
    }

    // No token available - show connect modal
    console.log('[TimeCapsule] No token, showing connect modal');
    setShowConnectModal(true);
  };

  // Handle successful Google authentication from ConnectGoogleDriveModal (native)
  const handleNativeGoogleAuthSuccess = (token: string) => {
    console.log('[TimeCapsule] Native Google auth success, opening Drive browser');
    setDriveAccessToken(token);
    setShowConnectModal(false);
    setShowDriveBrowser(true);
  };

  const handleDriveFileSelect = (file: File) => {
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: t("toast.uploadFailed"),
        description: t("document.maxSize"),
        variant: "destructive"
      });
      return;
    }
    setFormData({ ...formData, attachmentFile: file });
    toast({
      title: t("toast.uploadSuccess"),
      description: file.name,
    });
  };

  const handleUseNativePicker = async () => {
    try {
      const file = await openGoogleDrivePicker();
      if (file) {
        toast({
          title: t("common.loading"),
        });

        const blob = await downloadFileFromGoogleDrive(file);
        const driveFile = new File([blob], file.name, { type: file.mimeType });
        handleDriveFileSelect(driveFile);
      }
    } catch (error) {
      console.error('Error with native picker:', error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("toast.uploadFailed"),
        variant: "destructive",
      });
    }
  };

  const handleCreateCapsule = async () => {
    if (!formData.title || !formData.releaseDate || !formData.recipientEmail) {
      toast({
        title: t("toast.allFieldsRequired"),
        description: t("toast.fillAllFields"),
        variant: "destructive"
      });
      return;
    }

    // Validate release date is in the future (after today)
    const selectedDate = new Date(formData.releaseDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate <= today) {
      toast({
        title: t("common.error"),
        description: t("timeCapsule.futureDateRequired"),
        variant: "destructive"
      });
      return;
    }

    // Gmail-only validation
    if (!validateGmailOnly(formData.recipientEmail)) {
      toast({
        title: t("common.error"),
        description: t("nominee.gmailOnly"),
        variant: "destructive"
      });
      return;
    }

    // Phone validation (if provided)
    if (formData.phone && !validatePhoneExact10(formData.phone)) {
      toast({
        title: t("common.error"),
        description: t("nominee.digitsOnly"),
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
          title: t("timeCapsule.capsuleUpdated"),
          description: formData.title,
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
          title: t("timeCapsule.capsuleCreated"),
          description: `${formData.title} - ${t("timeCapsule.releasesOn")} ${formData.releaseDate}`,
        });
      }

      await loadCapsules();
      setFormData({ title: "", message: "", releaseDate: "", recipientEmail: "", phone: "", attachmentFile: null });
      setEditingId(null);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error saving capsule:", error);
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("toast.error"),
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
        title: t("timeCapsule.capsuleDeleted"),
        description: capsuleToDelete.title
      });
    } catch (error) {
      console.error("Error deleting capsule:", error);

      // Rollback on error
      await loadCapsules();

      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("toast.error"),
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
          <BackButton />
          <div className="flex-1 text-center -ml-10">
            <h1 className="text-2xl font-bold">{t("timeCapsule.title")}</h1>
            <p className="text-sm text-muted-foreground mt-1">{t("timeCapsule.subtitle")}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card/50 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1 text-blue-600">{scheduledCount}</div>
            <div className="text-sm text-muted-foreground">{t("timeCapsule.scheduled")}</div>
          </div>
          <div className="bg-card/50 rounded-xl p-4 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-1 text-green-600">{releasedCount}</div>
            <div className="text-sm text-muted-foreground">{t("timeCapsule.released")}</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-card rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {editingId ? `✏️ ${t("timeCapsule.editCapsule")}` : `+ ${t("timeCapsule.createNew")}`}
            </h2>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("timeCapsule.titleRequired")}</label>
              <Input
                placeholder={t("timeCapsule.enterTitle")}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("timeCapsule.message")}</label>
              <Textarea
                placeholder={t("timeCapsule.writeMessage")}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="bg-background border-border min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("timeCapsule.releaseDateRequired")}</label>
              <Input
                type="date"
                value={formData.releaseDate}
                min={(() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  return tomorrow.toISOString().split('T')[0];
                })()}
                onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                className="bg-background border-border"
              />
              <p className="text-xs text-muted-foreground">{t("timeCapsule.futureDateHint")}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("timeCapsule.recipientEmailRequired")}</label>
              <Input
                type="email"
                placeholder="example@gmail.com"
                value={formData.recipientEmail}
                onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t("timeCapsule.attachmentOptional")}</label>
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
                    <p className="text-sm text-muted-foreground mb-3">{t("timeCapsule.scanUploadImport")}</p>
                    <div className="flex gap-3 justify-center flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        className="gap-2 min-h-[44px] flex-1 min-w-[100px]"
                        onClick={handleScanDocument}
                      >
                        <Camera className="w-4 h-4" />
                        {t("timeCapsule.scan")}
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
                                  title: t("toast.uploadFailed"),
                                  description: t("document.maxSize"),
                                  variant: "destructive"
                                });
                                return;
                              }
                              setFormData({ ...formData, attachmentFile: file });
                              toast({
                                title: t("toast.uploadSuccess"),
                                description: file.name,
                              });
                            }
                          };
                          input.click();
                        }}
                      >
                        📁 {t("timeCapsule.device")}
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
                        {t("timeCapsule.drive")}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">{t("document.maxSize")}</p>
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
                {loading ? t("timeCapsule.saving") : editingId ? t("timeCapsule.updateCapsule") : t("timeCapsule.createCapsule")}
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Your Time Capsules</h2>
            {capsules.length > 0 && !showCreateForm && (
              <Button
                onClick={() => setShowCreateForm(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm h-9 px-4"
              >
                + Add Capsule
              </Button>
            )}
          </div>

          {capsules.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                <Clock className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No Time Capsules Yet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create your first time capsule to send messages to the future.
              </p>
              {!showCreateForm && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8"
                >
                  + Create Time Capsule
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
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
          onOpenChange={(open) => setDeleteDialog({ open, capsule: null })}
          title="Delete Time Capsule?"
          description={`Are you sure you want to delete "${deleteDialog.capsule?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={handleDelete}
        />

        {/* Google Drive Browser */}
        {driveAccessToken && (
          <GoogleDriveBrowser
            open={showDriveBrowser}
            onClose={() => {
              setShowDriveBrowser(false);
              setDriveAccessToken(null);
            }}
            accessToken={driveAccessToken}
            onFileSelect={handleDriveFileSelect}
          />
        )}

        {/* Connect Google Drive Modal */}
        <ConnectGoogleDriveModal
          open={showConnectModal}
          onClose={() => setShowConnectModal(false)}
          onUseNativePicker={handleUseNativePicker}
          onGoogleAuthSuccess={handleNativeGoogleAuthSuccess}
        />
      </div>
    </div>
  );
};

export default TimeCapsule;
