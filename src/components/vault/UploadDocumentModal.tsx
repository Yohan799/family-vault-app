import { X, Upload, Camera } from "lucide-react";
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
  subcategoryName,
  categoryId,
  subcategoryId,
  folderId,
  onUploadComplete,
}: UploadDocumentModalProps) => {
  const { toast } = useToast();

  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  const handleUploadFromDevice = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // Use the centralized validation function
        const validation = validateFile(file);

        if (!validation.valid) {
          toast({
            title: "Upload Failed",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }

        try {
          // Import storeDocument function dynamically
          const { storeDocument } = await import('@/lib/documentStorage');

          // Store the document
          await storeDocument(file, categoryId, subcategoryId, folderId);

          toast({
            title: "File uploaded successfully",
            description: `${file.name} has been added to your vault`,
          });

          handleClose();

          // Trigger refresh in parent component
          if (onUploadComplete) {
            onUploadComplete();
          }
        } catch (error) {
          console.error("Error storing document:", error);
          toast({
            title: "Upload Failed",
            description: error instanceof Error ? error.message : "Failed to store document. Please try again.",
            variant: "destructive",
          });
        }
      }
    };
    input.click();
  };

  const handleGoogleDrive = async () => {
    try {
      const file = await openGoogleDrivePicker();
      if (file) {
        toast({
          title: "Downloading from Google Drive",
          description: "Please wait...",
        });

        const blob = await downloadFileFromGoogleDrive(file);
        const driveFile = new File([blob], file.name, { type: file.mimeType });
        
        // Validate the file
        const validation = validateFile(driveFile);
        if (!validation.valid) {
          toast({
            title: "Upload Failed",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }

        // Store the document
        const { storeDocument } = await import('@/lib/documentStorage');
        await storeDocument(driveFile, categoryId, subcategoryId, folderId, 'google_drive');

        toast({
          title: "File imported successfully",
          description: `${file.name} has been added from Google Drive`,
        });

        handleClose();

        if (onUploadComplete) {
          onUploadComplete();
        }
      }
    } catch (error) {
      console.error('Error importing from Google Drive:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to import file from Google Drive";
      toast({
        title: "Google Drive Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleScanDocument = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const validation = validateFile(file);

        if (!validation.valid) {
          toast({
            title: "Scan Failed",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }

        try {
          const { storeDocument } = await import('@/lib/documentStorage');
          await storeDocument(file, categoryId, subcategoryId, folderId);

          toast({
            title: "Document scanned successfully",
            description: `${file.name} has been added to your vault`,
          });

          handleClose();

          if (onUploadComplete) {
            onUploadComplete();
          }
        } catch (error) {
          console.error("Error storing scanned document:", error);
          toast({
            title: "Scan Failed",
            description: error instanceof Error ? error.message : "Failed to store document. Please try again.",
            variant: "destructive",
          });
        }
      }
    };
    input.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange || (() => { })}>
      <DialogContent className="sm:max-w-md bg-background border-none rounded-t-3xl p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Upload Document</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-3">
          <button
            onClick={handleUploadFromDevice}
            className="w-full flex items-center gap-4 p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors"
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <span className="flex-1 text-left font-medium">Upload from Device</span>
          </button>

          <button
            onClick={handleGoogleDrive}
            className="w-full flex items-center gap-4 p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
              </svg>
            </div>
            <span className="flex-1 text-left font-medium">Import from Google Drive</span>
          </button>

          <button
            onClick={handleScanDocument}
            className="w-full flex items-center gap-4 p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 text-purple-600" />
            </div>
            <span className="flex-1 text-left font-medium">Scan Document</span>
          </button>

          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full mt-4 h-12 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
