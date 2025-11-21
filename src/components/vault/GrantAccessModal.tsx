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
}

export const GrantAccessModal = ({
  open,
  onOpenChange,
  personName,
}: GrantAccessModalProps) => {
  const { toast } = useToast();
  const [permission, setPermission] = useState("view-only");

  const handleConfirm = () => {
    const permissionText =
      permission === "view-only"
        ? "View Only"
        : permission === "download-only"
        ? "Download Only"
        : "View and Download";

    toast({
      title: "Access granted",
      description: `${personName} can now ${permissionText.toLowerCase()}`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="text-center">Grant Access to {personName}</DialogTitle>
        </DialogHeader>

        <RadioGroup value={permission} onValueChange={setPermission} className="space-y-3">
          <div className="border rounded-xl p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="view-only" id="view-only" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="view-only" className="font-semibold cursor-pointer">
                  View Only
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Can view the document but cannot save it.
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="download-only" id="download-only" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="download-only" className="font-semibold cursor-pointer">
                  Download Only
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Can save a copy but cannot view it online.
                </p>
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
              <RadioGroupItem value="view-download" id="view-download" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="view-download" className="font-semibold cursor-pointer">
                  View and Download
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Can view and save a copy of the document.
                </p>
              </div>
            </div>
          </div>
        </RadioGroup>

        <div className="flex flex-col gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-12">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="h-12 bg-blue-600 hover:bg-blue-700">
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
