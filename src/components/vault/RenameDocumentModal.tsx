import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface RenameDocumentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentId: string;
    currentName: string;
    onRenameSuccess: () => void;
}

export const RenameDocumentModal = ({
    open,
    onOpenChange,
    documentId,
    currentName,
    onRenameSuccess,
}: RenameDocumentModalProps) => {
    const { toast } = useToast();
    const [newName, setNewName] = useState(currentName);
    const [isLoading, setIsLoading] = useState(false);

    // Get the file extension
    const getExtension = (filename: string) => {
        const lastDot = filename.lastIndexOf('.');
        return lastDot !== -1 ? filename.slice(lastDot) : '';
    };

    // Get the name without extension
    const getNameWithoutExtension = (filename: string) => {
        const lastDot = filename.lastIndexOf('.');
        return lastDot !== -1 ? filename.slice(0, lastDot) : filename;
    };

    const extension = getExtension(currentName);
    const [baseName, setBaseName] = useState(getNameWithoutExtension(currentName));

    useEffect(() => {
        if (open) {
            setBaseName(getNameWithoutExtension(currentName));
            setNewName(currentName);
        }
    }, [open, currentName]);

    const handleSave = async () => {
        if (!baseName.trim()) {
            toast({
                title: "Error",
                description: "File name cannot be empty",
                variant: "destructive",
            });
            return;
        }

        const finalName = baseName.trim() + extension;

        setIsLoading(true);
        try {
            const { renameDocument } = await import('@/lib/documentStorage');
            const result = await renameDocument(documentId, finalName);

            if (result.success) {
                toast({
                    title: "Renamed successfully",
                    description: `File renamed to "${finalName}"`,
                });
                onRenameSuccess();
                onOpenChange(false);
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to rename file",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to rename file",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Pencil className="w-5 h-5" />
                        Rename File
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="filename">File name</Label>
                        <div className="flex items-center gap-1">
                            <Input
                                id="filename"
                                value={baseName}
                                onChange={(e) => setBaseName(e.target.value)}
                                placeholder="Enter new name"
                                className="flex-1"
                                autoFocus
                            />
                            {extension && (
                                <span className="text-muted-foreground text-sm font-medium">
                                    {extension}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isLoading || !baseName.trim()}
                    >
                        {isLoading ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
