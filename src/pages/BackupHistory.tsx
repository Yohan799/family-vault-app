import { Download, RotateCcw, Calendar, FileText } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { fetchBackups, downloadBackupFile, createManualBackup, type Backup } from "@/services/backupService";
import { format } from "date-fns";

const BackupHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
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
        title: t("common.error"),
        description: t("backupHistory.loadFailed"),
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
        title: t("backupHistory.createSuccess"),
        description: t("backupHistory.createSuccessDesc"),
      });
      loadBackups();
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("backupHistory.createFailed"),
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
        title: t("backupHistory.downloaded"),
        description: t("backupHistory.downloadedDesc"),
      });
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("backupHistory.downloadFailed"),
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
        title: t("backupHistory.downloadStarted"),
        description: `${t("backupHistory.downloadingFrom")} ${format(new Date(backup.created_at), 'PPP')}`,
      });
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("backupHistory.downloadFailed"),
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
      <div className="bg-primary/20 text-foreground p-6 pt-4 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <BackButton to="/settings" />
          <h1 className="text-2xl font-bold">{t("backupHistory.title")}</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {t("backupHistory.description")}
          </p>
          <Button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="bg-primary hover:bg-primary/90"
          >
            {isCreatingBackup ? t("backupHistory.creating") : t("backupHistory.createBackup")}
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("backupHistory.loading")}
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("backupHistory.noBackups")}
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
                            {t("backupHistory.completed")}
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
                    {t("backupHistory.restore")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(backup)}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t("backupHistory.download")}
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
          {t("backupHistory.configureSettings")}
        </Button>
      </div>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title={t("backupHistory.restoreTitle")}
        description={selectedBackup ? t("backupHistory.restoreDesc", { date: format(new Date(selectedBackup.created_at), 'PPP') }) : ''}
        onConfirm={confirmRestore}
        confirmText={t("backupHistory.downloadBtn")}
      />
    </div>
  );
};

export default BackupHistory;
