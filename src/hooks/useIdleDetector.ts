import { useEffect, useRef, useCallback, useState } from 'react';
import { getLocalLockPreference, type AppLockType } from '@/services/appLockService';
import { Capacitor } from '@capacitor/core';

interface UseIdleDetectorOptions {
    onIdle: (lockType: AppLockType) => void;
    enabled?: boolean;
}

// Storage key for auto-lock seconds (same as in AutoLockTimeout.tsx)
const AUTO_LOCK_STORAGE_KEY = "auto_lock_seconds";

// Get stored auto-lock seconds
const getStoredAutoLockSeconds = async (): Promise<number | null> => {
    if (Capacitor.isNativePlatform()) {
        try {
            const { Preferences } = await import("@capacitor/preferences");
            const { value } = await Preferences.get({ key: AUTO_LOCK_STORAGE_KEY });
            return value ? parseInt(value, 10) : null;
        } catch {
            return null;
        }
    }
    const stored = localStorage.getItem(AUTO_LOCK_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : null;
};

/**
 * Hook to detect user inactivity and trigger auto-lock
 * Monitors mouse, keyboard, touch, and scroll events
 */
export const useIdleDetector = ({ onIdle, enabled = true }: UseIdleDetectorOptions) => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isIdleRef = useRef(false);
    const [autoLockSeconds, setAutoLockSeconds] = useState<number | null>(null);

    // Load auto-lock setting on mount
    useEffect(() => {
        getStoredAutoLockSeconds().then(setAutoLockSeconds);

        // Listen for changes to auto-lock setting
        const handleSettingChange = (event: CustomEvent<{ seconds: number }>) => {
            setAutoLockSeconds(event.detail.seconds);
        };

        window.addEventListener('autoLockSettingChanged', handleSettingChange as EventListener);
        return () => {
            window.removeEventListener('autoLockSettingChanged', handleSettingChange as EventListener);
        };
    }, []);

    // Get timeout in milliseconds
    const getTimeoutMs = useCallback(() => {
        if (!autoLockSeconds || autoLockSeconds <= 0) return null;
        return autoLockSeconds * 1000; // Convert seconds to milliseconds
    }, [autoLockSeconds]);

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

