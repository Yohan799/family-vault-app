import { ArrowLeft, Download, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const BackupHistory = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const backups = [
    {
      id: 1,
      date: "2024-11-20",
      time: "14:30",
      size: "2.4 MB",
      type: "Automatic",
      status: "Completed"
    },
    {
      id: 2,
      date: "2024-11-13",
      time: "14:30",
      size: "2.3 MB",
      type: "Automatic",
      status: "Completed"
    },
    {
      id: 3,
      date: "2024-11-06",
      time: "14:30",
      size: "2.2 MB",
      type: "Manual",
      status: "Completed"
    },
    {
      id: 4,
      date: "2024-10-30",
      time: "14:30",
      size: "2.1 MB",
      type: "Automatic",
      status: "Completed"
    },
    {
      id: 5,
      date: "2024-10-23",
      time: "14:30",
      size: "2.0 MB",
      type: "Automatic",
      status: "Completed"
    }
  ];

  const handleRestore = (backup: typeof backups[0]) => {
    if (confirm(`Are you sure you want to restore backup from ${backup.date} at ${backup.time}? Your current data will be replaced.`)) {
      toast({
        title: "Restoring backup...",
        description: `Restoring vault from ${backup.date}`,
      });
      
      setTimeout(() => {
        toast({
          title: "Backup restored successfully",
          description: "Your vault has been restored to the selected backup",
        });
      }, 2000);
    }
  };

  const handleDownload = (backup: typeof backups[0]) => {
    toast({
      title: "Downloading backup",
      description: `Backup from ${backup.date} is being downloaded`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground p-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/settings")} 
            className="text-primary-foreground"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Backup History</h1>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <p className="text-muted-foreground">
          View and restore your vault backups. You can restore any previous backup or download it for safekeeping.
        </p>

        <div className="bg-card rounded-2xl overflow-hidden divide-y divide-border">
          {backups.map((backup) => (
            <div key={backup.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{backup.date}</h3>
                    <p className="text-sm text-muted-foreground">{backup.time}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{backup.size}</span>
                      <Badge variant={backup.type === "Automatic" ? "secondary" : "default"} className="text-xs">
                        {backup.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => handleRestore(backup)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore
                </Button>
                <Button
                  onClick={() => handleDownload(backup)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={() => navigate("/backup-frequency")}
          variant="outline"
          className="w-full h-12 rounded-xl"
        >
          Configure Backup Settings
        </Button>
      </div>
    </div>
  );
};

export default BackupHistory;
