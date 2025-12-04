import { useState, useEffect, ReactNode } from "react";
import { LockScreen } from "@/components/LockScreen";
import { getLocalLockPreference, type AppLockType } from "@/services/appLockService";
import { Capacitor } from "@capacitor/core";

interface AppLockGateProps {
  children: ReactNode;
}

const SESSION_UNLOCKED_KEY = "app_lock_session_unlocked";

// Helper to get/set session unlock state (works with Capacitor Preferences on native)
const getSessionUnlocked = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key: SESSION_UNLOCKED_KEY });
      return value === "true";
    } catch (error) {
      console.error("Error reading session unlock state:", error);
      return false;
    }
  }
  return sessionStorage.getItem(SESSION_UNLOCKED_KEY) === "true";
};

const setSessionUnlocked = async (unlocked: boolean): Promise<void> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      if (unlocked) {
        await Preferences.set({ key: SESSION_UNLOCKED_KEY, value: "true" });
      } else {
        await Preferences.remove({ key: SESSION_UNLOCKED_KEY });
      }
    } catch (error) {
      console.error("Error setting session unlock state:", error);
    }
    return;
  }
  if (unlocked) {
    sessionStorage.setItem(SESSION_UNLOCKED_KEY, "true");
  } else {
    sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
  }
};

export const AppLockGate = ({ children }: AppLockGateProps) => {
  const [isLocked, setIsLocked] = useState(true);
  const [lockType, setLockType] = useState<AppLockType>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAppLock();
  }, []);

  // Clear session unlock when app goes to background (native only)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const setupStateListener = async () => {
        try {
          const { App } = await import("@capacitor/app");
          const listener = await App.addListener("appStateChange", async ({ isActive }) => {
            if (!isActive) {
              // App went to background - clear session unlock so lock shows on resume
              await setSessionUnlocked(false);
            }
          });
          
          return () => {
            listener.remove();
          };
        } catch (error) {
          console.error("Error setting up app state listener:", error);
        }
      };
      setupStateListener();
    }
  }, []);

  const checkAppLock = async () => {
    try {
      // Check if already unlocked this session
      const isUnlockedThisSession = await getSessionUnlocked();

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

  const handleUnlock = async () => {
    setIsLocked(false);
    // Mark as unlocked for this session
    await setSessionUnlocked(true);
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
