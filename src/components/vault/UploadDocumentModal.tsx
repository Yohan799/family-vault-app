import { useState } from "react";
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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingSource, setUploadingSource] = useState<string | null>(null);

  const handleClose = () => {
    if (isUploading) return;
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  const handleUploadSuccess = (fileName: string) => {
    toast({
      title: "Upload successful",
      description: `${fileName} has been added to your vault`,
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
      const result = await scanDocument();
      
      if (result) {
        const validation = validateFile(result.file);
        if (!validation.valid) {
          toast({
            title: "Scan Failed",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }

        const { storeDocument } = await import('@/lib/documentStorage');
        await storeDocument(result.file, categoryId, subcategoryId, folderId);
        handleUploadSuccess(result.file.name);
      }
    } catch (error) {
      console.error("Error scanning document:", error);
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
    handleClose();
    
    try {
      const file = await openGoogleDrivePicker();
      if (file) {
        toast({
          title: "Downloading from Google Drive",
          description: "Please wait...",
        });

        const blob = await downloadFileFromGoogleDrive(file);
        const driveFile = new File([blob], file.name, { type: file.mimeType });
        
        const validation = validateFile(driveFile);
        if (!validation.valid) {
          toast({
            title: "Upload Failed",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }

        const { storeDocument } = await import('@/lib/documentStorage');
        await storeDocument(driveFile, categoryId, subcategoryId, folderId, 'google_drive');

        toast({
          title: "Upload successful",
          description: `${file.name} has been added from Google Drive`,
        });

        if (onUploadComplete) {
          onUploadComplete();
        }
      }
    } catch (error) {
      console.error('Error importing from Google Drive:', error);
      toast({
        title: "Google Drive Error",
        description: error instanceof Error ? error.message : "Failed to import file",
        variant: "destructive",
      });
    }
  };

  const uploadOptions = [
    {
      id: "scan",
      icon: Camera,
      title: "Scan Document",
      subtitle: "Use camera with auto edge detection",
      iconBg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      onClick: handleScanDocument,
    },
    {
      id: "device",
      icon: Upload,
      title: "Upload from Device",
      subtitle: "Choose from your files",
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      onClick: handleUploadFromDevice,
    },
    {
      id: "cloud",
      icon: Cloud,
      title: "Google Drive",
      subtitle: "Import files from Drive",
      iconBg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      onClick: handleGoogleDrive,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={isUploading ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border rounded-2xl p-0 gap-0" hideCloseButton>
        <DialogHeader className="p-6 pb-4 border-b border-border/50">
          <DialogTitle className="text-xl font-bold text-foreground text-center">
            Upload Document
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
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 min-h-[72px] ${
                  isDisabled
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
                    {isLoading ? "Uploading..." : option.title}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {option.subtitle}
                  </span>
                </div>
              </button>
            );
          })}

          <p className="text-xs text-muted-foreground text-center pt-2">
            Maximum file size: 20MB
          </p>

          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
            className="w-full h-12 rounded-xl mt-2"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
