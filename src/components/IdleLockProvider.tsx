import { useState, useCallback, ReactNode, useEffect } from 'react';
import { useIdleDetector } from '@/hooks/useIdleDetector';
import { LockScreen } from '@/components/LockScreen';
import { type AppLockType, getLocalLockPreference } from '@/services/appLockService';
import { useAuth } from '@/contexts/AuthContext';
import { Capacitor } from '@capacitor/core';

// Storage key for auto-lock seconds
const AUTO_LOCK_STORAGE_KEY = "auto_lock_seconds";

interface IdleLockProviderProps {
    children: ReactNode;
}

/**
 * Provider component that monitors user idle time and shows lock screen when idle timeout is reached.
 * Should wrap authenticated routes after login.
 * Uses biometric or PIN lock based on user's configured lock type.
 */
export const IdleLockProvider = ({ children }: IdleLockProviderProps) => {
    const [isLocked, setIsLocked] = useState(false);
    const [lockType, setLockType] = useState<AppLockType>(null);
    const [hasAutoLock, setHasAutoLock] = useState(false);
    const { user, profile } = useAuth();

    // Check if auto-lock is configured
    useEffect(() => {
        const checkAutoLock = async () => {
            // Check local storage for auto-lock setting
            let seconds: number | null = null;
            if (Capacitor.isNativePlatform()) {
                try {
                    const { Preferences } = await import("@capacitor/preferences");
                    const { value } = await Preferences.get({ key: AUTO_LOCK_STORAGE_KEY });
                    seconds = value ? parseInt(value, 10) : null;
                } catch {
                    seconds = null;
                }
            } else {
                const stored = localStorage.getItem(AUTO_LOCK_STORAGE_KEY);
                seconds = stored ? parseInt(stored, 10) : null;
            }

            // Check if app lock type is configured
            const lockPref = await getLocalLockPreference();
            setHasAutoLock(!!seconds && seconds > 0 && !!lockPref);
        };

        checkAutoLock();

        // Listen for changes to auto-lock setting
        const handleSettingChange = () => {
            checkAutoLock();
        };

        window.addEventListener('autoLockSettingChanged', handleSettingChange);
        return () => {
            window.removeEventListener('autoLockSettingChanged', handleSettingChange);
        };
    }, []);

    // Handler for when user becomes idle
    const handleIdle = useCallback((detectedLockType: AppLockType) => {
        if (detectedLockType) {
            setLockType(detectedLockType);
            setIsLocked(true);
        }
    }, []);

    // Only enable idle detection if user is logged in and has app lock configured
    const isEnabled = !!user && hasAutoLock;

    const { markActive } = useIdleDetector({
        onIdle: handleIdle,
        enabled: isEnabled,
    });

    // Handler for when user successfully unlocks
    const handleUnlock = useCallback(() => {
        setIsLocked(false);
        setLockType(null);
        // Reset idle timer after unlock
        markActive();
    }, [markActive]);

    // Show lock screen if locked
    if (isLocked && lockType) {
        return <LockScreen lockType={lockType} onUnlock={handleUnlock} isPreLogin={false} />;
    }

    return <>{children}</>;
};

