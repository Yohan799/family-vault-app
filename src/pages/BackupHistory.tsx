import { ArrowLeft, Download, RotateCcw, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBackups, downloadBackupFile, createManualBackup, type Backup } from "@/services/backupService";
import { format } from "date-fns";

const BackupHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  useEffect(() => {
    if (user) {
      loadBackups();
    }
  }, [user]);

  const loadBackups = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const data = await fetchBackups(user.id);
      setBackups(data);
    } catch (error) {
      console.error('Error loading backups:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load backup history",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!user) return;

    try {
      setIsCreatingBackup(true);
      await createManualBackup(user.id);
      toast({
        title: "Backup created successfully!",
        description: "Your manual backup is now available",
      });
      loadBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create backup",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestore = (backup: Backup) => {
    setSelectedBackup(backup);
    setShowConfirm(true);
  };

  const confirmRestore = async () => {
    if (!selectedBackup) return;

    try {
      const signedUrl = await downloadBackupFile(selectedBackup.file_path);
      
      // Download the file
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = `backup_${format(new Date(selectedBackup.created_at), 'yyyy-MM-dd')}.json`;
      link.click();

      toast({
        title: "Backup downloaded!",
        description: "You can restore it by importing the JSON file",
      });
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download backup",
      });
    } finally {
      setShowConfirm(false);
      setSelectedBackup(null);
    }
  };

  const handleDownload = async (backup: Backup) => {
    try {
      const signedUrl = await downloadBackupFile(backup.file_path);
      
      const link = document.createElement('a');
      link.href = signedUrl;
      link.download = `backup_${format(new Date(backup.created_at), 'yyyy-MM-dd')}.json`;
      link.click();

      toast({
        title: "Download started",
        description: `Downloading backup from ${format(new Date(backup.created_at), 'PPP')}`,
      });
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download backup",
      });
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/settings")} className="p-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold">Backup History</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            View and manage your backup history. You can restore or download previous backups.
          </p>
          <Button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="bg-primary hover:bg-primary/90"
          >
            {isCreatingBackup ? "Creating..." : "Create Backup"}
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading backups...
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No backups found. Create your first backup to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div key={backup.id} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">
                          {format(new Date(backup.created_at), 'PPP')}
                        </h3>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {backup.backup_type}
                        </Badge>
                        {backup.status === 'completed' && (
                          <Badge variant="default" className="text-xs bg-green-500/20 text-green-600">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(backup.created_at), 'p')}
                        </span>
                        <span>{formatFileSize(backup.file_size)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(backup)}
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(backup)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={() => navigate("/backup-frequency")}
          variant="outline"
          className="w-full h-12 rounded-xl"
        >
          Configure Backup Settings
        </Button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Restore Backup?"
        description={selectedBackup ? `Are you sure you want to restore backup from ${format(new Date(selectedBackup.created_at), 'PPP')}? This will download the backup file.` : ''}
        onConfirm={confirmRestore}
        confirmText="Download"
      />
    </div>
  );
};

export default BackupHistory;
