import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getLocalLockPreference, type AppLockType } from '@/services/appLockService';

interface UseIdleDetectorOptions {
    onIdle: (lockType: AppLockType) => void;
    enabled?: boolean;
}

/**
 * Hook to detect user inactivity and trigger auto-lock
 * Monitors mouse, keyboard, touch, and scroll events
 */
export const useIdleDetector = ({ onIdle, enabled = true }: UseIdleDetectorOptions) => {
    const { profile } = useAuth();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isIdleRef = useRef(false);

    // Get timeout in milliseconds from profile (stored as minutes, can be fractional)
    const getTimeoutMs = useCallback(() => {
        const minutes = profile?.auto_lock_minutes;
        if (!minutes || minutes <= 0) return null;
        return minutes * 60 * 1000; // Convert minutes to milliseconds
    }, [profile?.auto_lock_minutes]);

    // Reset idle timer on activity
    const resetTimer = useCallback(async () => {
        // Don't reset if already marked as idle (lock screen is showing)
        if (isIdleRef.current) return;

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        // Check if auto-lock is enabled
        const timeoutMs = getTimeoutMs();
        if (!timeoutMs || !enabled) return;

        // Check if app lock is configured
        const lockType = await getLocalLockPreference();
        if (!lockType) return;

        // Set new timeout
        timeoutRef.current = setTimeout(async () => {
            isIdleRef.current = true;
            onIdle(lockType);
        }, timeoutMs);
    }, [getTimeoutMs, enabled, onIdle]);

    // Mark as active again (called after unlock)
    const markActive = useCallback(() => {
        isIdleRef.current = false;
        resetTimer();
    }, [resetTimer]);

    useEffect(() => {
        if (!enabled) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            return;
        }

        // Event handler for activity
        const handleActivity = () => {
            resetTimer();
        };

        // List of events that indicate user activity
        const activityEvents = [
            'mousedown',
            'mousemove',
            'keydown',
            'touchstart',
            'touchmove',
            'scroll',
            'click',
            'wheel',
        ];

        // Add event listeners
        activityEvents.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Start initial timer
        resetTimer();

        // Cleanup
        return () => {
            activityEvents.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [enabled, resetTimer]);

    return { resetTimer, markActive };
};
