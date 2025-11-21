import { X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface UploadDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryName?: string;
}

export const UploadDocumentModal = ({
  open,
  onOpenChange,
  categoryName,
}: UploadDocumentModalProps) => {
  const { toast } = useToast();

  const handleUploadFromDevice = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const maxSize = 20 * 1024 * 1024;
        if (file.size > maxSize) {
          toast({
            title: "File too large",
            description: "Maximum file size is 20MB",
            variant: "destructive",
          });
          return;
        }
        toast({
          title: "File uploaded",
          description: `${file.name} has been added to your vault`,
        });
        onOpenChange(false);
      }
    };
    input.click();
  };

  const handleGoogleDrive = () => {
    window.open("https://drive.google.com/drive/my-drive", "_blank");
    toast({
      title: "Opening Google Drive",
      description: "Select your file and share it with the app",
    });
    onOpenChange(false);
  };

  const handleDigiLocker = () => {
    window.open("https://digilocker.gov.in/", "_blank");
    toast({
      title: "Opening DigiLocker",
      description: "Select your file and share it with the app",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-none rounded-t-3xl p-0">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Upload Document</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
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
            <span className="flex-1 text-left font-medium">Sync from Google Drive</span>
          </button>

          <button
            onClick={handleDigiLocker}
            className="w-full flex items-center gap-4 p-4 bg-muted/50 hover:bg-muted rounded-xl transition-colors"
          >
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-teal-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V7.3l7-3.11v8.8z" />
              </svg>
            </div>
            <span className="flex-1 text-left font-medium">Fetch from DigiLocker</span>
          </button>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full mt-4 h-12 rounded-xl"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
