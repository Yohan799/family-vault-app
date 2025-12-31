import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { accessControlService } from "@/services/accessControlService";
import { AccessLevel, NomineeAccess } from "@/types/access";
import { Loader2, Users, ShieldCheck } from "lucide-react";

interface AccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceType: AccessLevel;
  resourceId: string;
  resourceName: string;
  onAccessChanged?: () => void;
}

export const AccessControlModal = ({
  isOpen,
  onClose,
  resourceType,
  resourceId,
  resourceName,
  onAccessChanged,
}: AccessControlModalProps) => {
  const { toast } = useToast();
  const [nominees, setNominees] = useState<NomineeAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const resourceTypeLabel = resourceType === 'category' 
    ? 'Category' 
    : resourceType === 'subcategory' 
      ? 'Subcategory' 
      : resourceType === 'folder'
        ? 'Folder'
        : 'Document';

  useEffect(() => {
    if (isOpen) {
      loadAccessData();
    }
  }, [isOpen, resourceId, resourceType]);

  const loadAccessData = async () => {
    setLoading(true);
    try {
      const summary = await accessControlService.getAccessSummary(resourceType, resourceId);
      setNominees(summary.accessDetails);
    } catch (error) {
      console.error('Error loading access data:', error);
      toast({
        title: "Error",
        description: "Failed to load access data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAccess = async (nomineeId: string, currentAccess: boolean) => {
    setUpdating(nomineeId);
    try {
      await accessControlService.toggleAccess(resourceType, resourceId, nomineeId, !currentAccess);
      
      // Update local state
      setNominees(prev => 
        prev.map(n => 
          n.nomineeId === nomineeId 
            ? { ...n, hasAccess: !currentAccess }
            : n
        )
      );

      toast({
        title: currentAccess ? "Access revoked" : "Access granted",
        description: `${currentAccess ? 'Removed' : 'Added'} access to ${resourceName}`,
      });

      onAccessChanged?.();
    } catch (error) {
      console.error('Error toggling access:', error);
      toast({
        title: "Error",
        description: "Failed to update access",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const nomineesWithAccess = nominees.filter(n => n.hasAccess).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-md bg-background p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-center text-lg flex items-center justify-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Manage Access
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center mt-1">
            {resourceTypeLabel}: {resourceName}
          </p>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : nominees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground text-sm">No nominees added yet</p>
              <p className="text-muted-foreground text-xs mt-1">
                Add nominees in the Nominee Center to grant access
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                <span>Nominees</span>
                <span>{nomineesWithAccess} of {nominees.length} have access</span>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {nominees.map((nominee) => (
                  <div
                    key={nominee.nomineeId}
                    className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={nominee.nomineeAvatar} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(nominee.nomineeName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{nominee.nomineeName}</p>
                        <p className="text-xs text-muted-foreground">{nominee.nomineeEmail}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {updating === nominee.nomineeId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Switch
                          checked={nominee.hasAccess}
                          onCheckedChange={() => handleToggleAccess(nominee.nomineeId, nominee.hasAccess)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="h-11">
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
