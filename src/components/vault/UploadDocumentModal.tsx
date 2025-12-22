import { useState, useEffect } from "react";
import { Upload, Camera, Cloud, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { validateFile } from "@/lib/validation";
import { openGoogleDrivePicker, downloadFileFromGoogleDrive } from "@/lib/googleDrivePicker";
import { scanDocument } from "@/lib/documentScanner";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleDriveBrowser } from "@/components/GoogleDriveBrowser";
import { ConnectGoogleDriveModal } from "@/components/ConnectGoogleDriveModal";
import { Capacitor } from "@capacitor/core";
import { useLanguage } from "@/contexts/LanguageContext";
import SuccessCelebration from "@/components/ui/SuccessCelebration";

interface UploadDocumentModalProps {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  subcategoryName?: string;
  categoryId: string;
  subcategoryId: string;
  folderId?: string;
  onUploadComplete?: () => void;
}

export const UploadDocumentModal = ({
  open,
  onClose,
  onOpenChange,
  categoryId,
  subcategoryId,
  folderId,
  onUploadComplete,
}: UploadDocumentModalProps) => {
  const { toast } = useToast();
  const { hasGoogleIdentity, getGoogleAccessToken } = useAuth();
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingSource, setUploadingSource] = useState<string | null>(null);
  const [showDriveBrowser, setShowDriveBrowser] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleClose = () => {
    if (isUploading) return;
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  const handleUploadSuccess = (fileName: string) => {
    // Check if this is user's first document upload
    const hasUploadedBefore = localStorage.getItem('hasUploadedFirstDocument');
    const isFirstUpload = !hasUploadedBefore;

    if (isFirstUpload) {
      // Mark first upload as complete
      localStorage.setItem('hasUploadedFirstDocument', 'true');
      // Trigger celebration!
      setShowCelebration(true);
    }

    toast({
      title: isFirstUpload ? "🎉 First Document Uploaded!" : "Upload successful",
      description: isFirstUpload
        ? `${fileName} - Your vault journey begins!`
        : `${fileName} has been added to your vault`,
    });
    handleClose();
    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const handleScanDocument = async () => {
    setUploadingSource("scan");
    setIsUploading(true);

    try {
      console.log("[Scanner] Starting document scan...");
      const result = await scanDocument();

      if (!result) {
        console.log("[Scanner] Scan cancelled or returned null");
        toast({
          title: "Scan Cancelled",
          description: "No document was captured",
        });
        return;
      }

      console.log("[Scanner] Scan result:", {
        fileName: result.file.name,
        fileSize: result.file.size,
        fileType: result.file.type,
      });

      const validation = validateFile(result.file);
      if (!validation.valid) {
        console.error("[Scanner] Validation failed:", validation.error);
        toast({
          title: "Scan Failed",
          description: validation.error || "Invalid file format",
          variant: "destructive",
        });
        return;
      }

      console.log("[Scanner] Validation passed, storing document...");
      const { storeDocument } = await import('@/lib/documentStorage');
      await storeDocument(result.file, categoryId, subcategoryId, folderId);
      handleUploadSuccess(result.file.name);
    } catch (error) {
      console.error("[Scanner] Error scanning document:", error);
      toast({
        title: "Scan Failed",
        description: error instanceof Error ? error.message : "Failed to scan document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadingSource(null);
    }
  };

  const handleUploadFromDevice = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const validation = validateFile(file);

        if (!validation.valid) {
          toast({
            title: "Upload Failed",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }

        setUploadingSource("device");
        setIsUploading(true);

        try {
          const { storeDocument } = await import('@/lib/documentStorage');
          await storeDocument(file, categoryId, subcategoryId, folderId);
          handleUploadSuccess(file.name);
        } catch (error) {
          console.error("Error storing document:", error);
          toast({
            title: "Upload Failed",
            description: error instanceof Error ? error.message : "Failed to store document",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
          setUploadingSource(null);
        }
      }
    };
    input.click();
  };

  const handleGoogleDrive = async () => {
    const isNative = Capacitor.isNativePlatform();

    // Check if user has Google access token (works for both platforms)
    if (hasGoogleIdentity || isNative) {
      const token = await getGoogleAccessToken();
      if (token) {
        console.log('[UploadModal] Got access token, opening Drive browser');
        setDriveAccessToken(token);
        handleClose();
        setShowDriveBrowser(true);
        return;
      }
    }

    // No token available - show connect modal
    console.log('[UploadModal] No token, showing connect modal');
    handleClose();
    setShowConnectModal(true);
  };

  // Handle successful Google authentication from ConnectGoogleDriveModal (native)
  const handleNativeGoogleAuthSuccess = (token: string) => {
    console.log('[UploadModal] Native Google auth success, opening Drive browser');
    setDriveAccessToken(token);
    setShowConnectModal(false);
    setShowDriveBrowser(true);
  };

  const handleDriveFileSelect = async (file: File) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      toast({
        title: "Upload Failed",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const { storeDocument } = await import('@/lib/documentStorage');
      await storeDocument(file, categoryId, subcategoryId, folderId, 'google_drive');

      toast({
        title: "Upload successful",
        description: `${file.name} has been added from Google Drive`,
      });

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Error storing file from Drive:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to store file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleUseNativePicker = async () => {
    try {
      const file = await openGoogleDrivePicker();
      if (file) {
        toast({
          title: "Downloading file",
          description: "Please wait...",
        });

        const blob = await downloadFileFromGoogleDrive(file);
        const driveFile = new File([blob], file.name, { type: file.mimeType });
        await handleDriveFileSelect(driveFile);
      }
    } catch (error) {
      console.error('Error with native picker:', error);
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : "Failed to import file",
        variant: "destructive",
      });
    }
  };

  const uploadOptions = [
    {
      id: "scan",
      icon: Camera,
      title: t("document.scanDocument"),
      subtitle: t("document.scanSubtitle"),
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      onClick: handleScanDocument,
    },
    {
      id: "device",
      icon: Upload,
      title: t("document.fromDevice"),
      subtitle: t("document.fromDeviceSubtitle"),
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      onClick: handleUploadFromDevice,
    },
    {
      id: "cloud",
      icon: Cloud,
      title: t("document.fromGoogleDrive"),
      subtitle: t("document.fromGoogleDriveSubtitle"),
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      onClick: handleGoogleDrive,
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={isUploading ? undefined : onOpenChange}>
        <DialogContent className="sm:max-w-md bg-card border-border rounded-2xl p-0 gap-0" hideCloseButton>
          <DialogHeader className="p-6 pb-4 border-b border-border/50">
            <DialogTitle className="text-xl font-bold text-foreground text-center">
              {t("document.upload")}
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-3">
            {uploadOptions.map((option) => {
              const Icon = option.icon;
              const isLoading = isUploading && uploadingSource === option.id;
              const isDisabled = isUploading && uploadingSource !== option.id;

              return (
                <button
                  key={option.id}
                  onClick={option.onClick}
                  disabled={isUploading}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 min-h-[72px] ${isDisabled
                    ? "opacity-50 cursor-not-allowed bg-muted/30"
                    : isLoading
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-muted/50 hover:bg-muted hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${option.iconBg}`}>
                    {isLoading ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <Icon className={`w-6 h-6 ${option.iconColor}`} />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <span className="font-semibold text-foreground block">
                      {isLoading ? t("common.loading") : option.title}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {option.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}

            <p className="text-xs text-muted-foreground text-center pt-2">
              {t("document.maxSize")}
            </p>

            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="w-full h-12 rounded-xl mt-2"
            >
              {t("common.cancel")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* First Upload Celebration */}
      <SuccessCelebration
        trigger={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    </>
  );
};
