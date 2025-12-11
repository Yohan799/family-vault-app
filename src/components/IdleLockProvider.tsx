import { useState, useCallback, ReactNode } from 'react';
import { useIdleDetector } from '@/hooks/useIdleDetector';
import { LockScreen } from '@/components/LockScreen';
import { type AppLockType } from '@/services/appLockService';
import { useAuth } from '@/contexts/AuthContext';

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
    const { user, profile } = useAuth();

    // Handler for when user becomes idle
    const handleIdle = useCallback((detectedLockType: AppLockType) => {
        if (detectedLockType) {
            setLockType(detectedLockType);
            setIsLocked(true);
        }
    }, []);

    // Only enable idle detection if user is logged in and has app lock configured
    const isEnabled = !!user && !!profile?.app_lock_type && !!profile?.auto_lock_minutes;

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
