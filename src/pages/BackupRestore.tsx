import { Download, Shield, Home, Vault, Settings, FileText, Users, Clock, FolderOpen } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { downloadLocalBackup, createLocalBackup, type LocalBackupData } from "@/services/backupService";

const BackupRestore = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { t } = useLanguage();
    const { toast } = useToast();

    const [isExporting, setIsExporting] = useState(false);
    const [backupPreview, setBackupPreview] = useState<LocalBackupData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadPreview();
        }
    }, [user]);

    const loadPreview = async () => {
        if (!user) return;
        setIsLoading(true);
        const backup = await createLocalBackup(user.id);
        setBackupPreview(backup);
        setIsLoading(false);
    };

    const handleExport = async () => {
        if (!user) return;

        setIsExporting(true);
        try {
            const success = await downloadLocalBackup(user.id);
            if (success) {
                toast({
                    title: t("backup.created"),
                    description: t("backup.exportedToJson"),
                });
            } else {
                throw new Error("Failed to create backup");
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: t("backup.exportFailed"),
                description: error.message || t("backup.couldNotExport"),
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-primary/20 text-foreground p-6 rounded-b-3xl">
                <div className="flex items-center gap-4">
                    <BackButton to="/settings" />
                    <div>
                        <h1 className="text-xl font-bold">{t("backup.title")}</h1>
                        <p className="text-sm text-muted-foreground">{t("backup.exportAsJson")}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Preview Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">{t("backup.vaultSummary")}</CardTitle>
                        <CardDescription>{t("backup.dataIncluded")}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : backupPreview ? (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="text-lg font-bold">{backupPreview.documents.length}</p>
                                        <p className="text-xs text-muted-foreground">{t("common.documents")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <FolderOpen className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="text-lg font-bold">{backupPreview.categories.length}</p>
                                        <p className="text-xs text-muted-foreground">{t("backup.categories")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <Users className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="text-lg font-bold">{backupPreview.nominees.length}</p>
                                        <p className="text-xs text-muted-foreground">{t("dashboard.nominees")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <div>
                                        <p className="text-lg font-bold">{backupPreview.timeCapsules.length}</p>
                                        <p className="text-xs text-muted-foreground">{t("dashboard.capsules")}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground py-4">{t("backup.unableToLoadPreview")}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Export Button */}
                <Button
                    onClick={handleExport}
                    disabled={isExporting || isLoading}
                    className="w-full h-12"
                    size="lg"
                >
                    {isExporting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            {t("backup.exporting")}
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5 mr-2" />
                            {t("backup.exportBackup")}
                        </>
                    )}
                </Button>

                {/* Info Section */}
                <Card className="border-dashed">
                    <CardContent className="pt-4">
                        <div className="flex gap-3">
                            <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-muted-foreground space-y-2">
                                <p><strong>{t("backup.whatsIncluded")}</strong></p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>{t("backup.documentMetadata")}</li>
                                    <li>{t("backup.categoriesSubcategories")}</li>
                                    <li>{t("backup.nomineesList")}</li>
                                    <li>{t("backup.timeCapsules")}</li>
                                    <li>{t("backup.inactivitySettings")}</li>
                                </ul>
                                <p className="mt-3 text-xs">
                                    <strong>{t("backup.note")}</strong> {t("backup.filesNotIncluded")}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
                <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                    <button onClick={() => navigate("/dashboard")} className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Home className="w-6 h-6" />
                        <span className="text-xs">{t("nav.home")}</span>
                    </button>
                    <button onClick={() => navigate("/vault")} className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Vault className="w-6 h-6" />
                        <span className="text-xs">{t("nav.vault")}</span>
                    </button>
                    <button onClick={() => navigate("/settings")} className="flex flex-col items-center gap-1 text-primary relative">
                        <Settings className="w-6 h-6" />
                        <span className="text-xs">{t("nav.settings")}</span>
                        <div className="absolute -bottom-2 w-12 h-1 bg-primary rounded-full" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BackupRestore;
