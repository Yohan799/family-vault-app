import { useState, useEffect, ReactNode } from "react";
import { LockScreen } from "@/components/LockScreen";
import { getLocalLockPreference, type AppLockType } from "@/services/appLockService";

interface AppLockGateProps {
  children: ReactNode;
}

export const AppLockGate = ({ children }: AppLockGateProps) => {
  const [isLocked, setIsLocked] = useState(true);
  const [lockType, setLockType] = useState<AppLockType>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAppLock();
  }, []);

  const checkAppLock = async () => {
    try {
      // Check if already unlocked this session
      const sessionKey = "app_lock_session_unlocked";
      const isUnlockedThisSession = sessionStorage.getItem(sessionKey);

      if (isUnlockedThisSession) {
        setIsLocked(false);
        setIsChecking(false);
        return;
      }

      // Check local lock preference
      const localLockType = await getLocalLockPreference();

      if (localLockType) {
        // App lock is enabled - show lock screen
        setLockType(localLockType);
        setIsLocked(true);
      } else {
        // No app lock - proceed normally
        setIsLocked(false);
      }
    } catch (error) {
      console.error("Error checking app lock:", error);
      setIsLocked(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleUnlock = () => {
    setIsLocked(false);
    // Mark as unlocked for this session
    sessionStorage.setItem("app_lock_session_unlocked", "true");
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLocked && lockType) {
    return <LockScreen lockType={lockType} onUnlock={handleUnlock} isPreLogin />;
  }

  return <>{children}</>;
};
