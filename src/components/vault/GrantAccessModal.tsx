import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface GrantAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personName: string;
  documentId?: string;
  nomineeId?: string;
  onAccessGranted?: () => void;
}

export const GrantAccessModal = ({
  open,
  onOpenChange,
  personName,
  documentId,
  nomineeId,
  onAccessGranted,
}: GrantAccessModalProps) => {
  const { toast } = useToast();
  const [permission, setPermission] = useState("view-only");

  const handleConfirm = () => {
    if (!documentId || !nomineeId) {
      toast({
        title: "Error",
        description: "Missing document or nominee information",
        variant: "destructive"
      });
      return;
    }

    const permissionText =
      permission === "view-only"
        ? "View Only"
        : permission === "download-only"
          ? "Download Only"
          : "View and Download";

    // Save to localStorage
    const accessKey = `document_access_${documentId}`;
    const existingAccess = JSON.parse(localStorage.getItem(accessKey) || '[]');

    // Check if already exists
    const existingIndex = existingAccess.findIndex((a: any) => a.nomineeId === nomineeId);

    const newAccess = {
      nomineeId,
      personName,
      permission,
      grantedDate: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      existingAccess[existingIndex] = newAccess;
    } else {
      existingAccess.push(newAccess);
    }

    localStorage.setItem(accessKey, JSON.stringify(existingAccess));

    toast({
      title: "Access granted",
      description: `${personName} can now ${permissionText.toLowerCase()}`,
    });

    if (onAccessGranted) {
      onAccessGranted();
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md bg-background p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-lg">Grant Access to {personName}</DialogTitle>
        </DialogHeader>

        <RadioGroup value={permission} onValueChange={setPermission} className="space-y-2">
          <div className="border rounded-xl p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="view-only" id="view-only" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="view-only" className="font-semibold cursor-pointer text-sm">
                  View Only
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Can view the document but cannot save it.
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="download-only" id="download-only" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="download-only" className="font-semibold cursor-pointer text-sm">
                  Download Only
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Can save a copy but cannot view it online.
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="view-download" id="view-download" className="mt-0.5" />
              <div className="flex-1">
                <Label htmlFor="view-download" className="font-semibold cursor-pointer text-sm">
                  View and Download
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Can view and save a copy of the document.
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>

        <div className="flex flex-col gap-2 mt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-11">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="h-11 bg-primary hover:bg-primary/90">
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
