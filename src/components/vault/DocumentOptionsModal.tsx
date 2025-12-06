import { Eye, Download, Users, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface DocumentOptionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentName: string;
  documentId: string;
  categoryId: string;
  subcategoryId: string;
  folderId?: string;
  onDelete?: () => void;
  onView?: (fileUrl: string, name: string, type: string) => void;
}

export const DocumentOptionsModal = ({
  open,
  onOpenChange,
  documentName,
  documentId,
  categoryId,
  subcategoryId,
  folderId,
  onDelete,
  onView,
}: DocumentOptionsModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleView = async () => {
    try {
      const { getDocuments } = await import('@/lib/documentStorage');
      const storedDocs = await getDocuments(categoryId, subcategoryId, folderId);
      const doc = storedDocs.find(d => d.id === documentId);

      if (doc && onView) {
        onView(doc.fileUrl, doc.name, doc.type);
      } else {
        toast({
          title: "Error",
          description: "Document not found",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open document",
        variant: "destructive"
      });
    }
    onOpenChange(false);
  };

  const handleDownload = async () => {
    try {
      const { getDocuments, downloadDocument } = await import('@/lib/documentStorage');
      const storedDocs = await getDocuments(categoryId, subcategoryId, folderId);
      const doc = storedDocs.find(d => d.id === documentId);

      if (doc) {
        const result = await downloadDocument(doc);
        toast({
          title: "Download Complete",
          description: result.path
            ? `Saved to: ${result.path}`
            : `${documentName} has been downloaded`
        });
      } else {
        toast({
          title: "Error",
          description: "Document not found",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
    onOpenChange(false);
  };

  const handleManageAccess = () => {
    // Navigate to access control - pass document ID not subcategory
    navigate(`/vault/manage-access/${documentId}`, {
      state: {
        resourceType: 'document',
        resourceId: documentId,
        categoryId,
        subcategoryId
      }
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${documentName}?`)) {
      try {
        const { deleteDocument } = await import('@/lib/documentStorage');
        const result = await deleteDocument(documentId);

        if (result.success) {
          toast({
            title: "Document deleted",
            description: `${documentName} has been removed from your vault`,
          });
          if (onDelete) {
            onDelete();
          }
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete document",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete document",
          variant: "destructive",
        });
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-background border-none rounded-t-3xl p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-center text-sm text-muted-foreground">
            Options for
          </DialogTitle>
          <div className="text-center font-bold text-lg mt-1">{documentName}</div>
        </DialogHeader>

        <div className="pb-4">
          <button
            onClick={handleView}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
          >
            <Eye className="w-5 h-5" />
            <span className="font-medium">View</span>
          </button>

          <Separator />

          <button
            onClick={handleDownload}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">Download</span>
          </button>

          <Separator />

          <button
            onClick={handleManageAccess}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-muted/50 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Who has access</span>
          </button>

          <Separator />

          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-destructive" />
            <span className="font-medium text-destructive">Delete</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
