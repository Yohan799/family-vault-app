import { useState } from 'react';
import { Cloud, Loader2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { linkGoogleAccount } from '@/services/googleDriveService';
import { useAuth } from '@/contexts/AuthContext';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConnectGoogleDriveModalProps {
  open: boolean;
  onClose: () => void;
  onUseNativePicker: () => void;
  onGoogleAuthSuccess?: (accessToken: string) => void;
}

export const ConnectGoogleDriveModal = ({
  open,
  onClose,
  onUseNativePicker,
  onGoogleAuthSuccess,
}: ConnectGoogleDriveModalProps) => {
  const { toast } = useToast();
  const { authenticateGoogleForDrive } = useAuth();
  const { t } = useLanguage();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnectGoogle = async () => {
    setIsConnecting(true);
    
    const isNative = Capacitor.isNativePlatform();
    
    try {
      if (isNative) {
        // On native APK: Use SocialLogin to get Drive access token
        console.log('[ConnectGoogle] Using native SocialLogin for Drive access');
        const token = await authenticateGoogleForDrive();
        
        if (token) {
          console.log('[ConnectGoogle] Got native token, calling onGoogleAuthSuccess');
          onGoogleAuthSuccess?.(token);
          onClose();
        } else {
          toast({
            title: t("googleDrive.connectionFailed"),
            description: t("googleDrive.failedAccess"),
            variant: 'destructive',
          });
        }
      } else {
        // On web: Use Supabase OAuth redirect to link Google account
        console.log('[ConnectGoogle] Using web OAuth flow');
        const result = await linkGoogleAccount();
        
        if (!result.success) {
          toast({
            title: t("googleDrive.connectionFailed"),
            description: result.error || t("googleDrive.failedConnect"),
            variant: 'destructive',
          });
        }
        // If successful, the page will redirect for OAuth
      }
    } catch (error) {
      console.error('[ConnectGoogle] Error:', error);
      toast({
        title: t("googleDrive.connectionFailed"),
        description: error instanceof Error ? error.message : t("googleDrive.failedConnect"),
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleUseNativePicker = () => {
    onClose();
    onUseNativePicker();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            {t("googleDrive.connectTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("googleDrive.connectDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            onClick={handleConnectGoogle}
            disabled={isConnecting}
            className="w-full h-12 gap-3"
          >
            {isConnecting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
              </svg>
            )}
            {isConnecting ? t("googleDrive.connecting") : t("googleDrive.signIn")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">{t("googleDrive.or")}</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleUseNativePicker}
            className="w-full h-12 gap-3"
          >
            <Smartphone className="w-5 h-5" />
            {t("googleDrive.useDevicePicker")}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {t("googleDrive.devicePickerNote")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
