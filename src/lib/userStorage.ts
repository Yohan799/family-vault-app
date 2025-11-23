/**
 * User data storage utilities
 * Manages user preferences and settings in localStorage
 */

export interface UserPreferences {
    emailNotifications: boolean;
    smsNotifications: boolean;
    securityAlerts: boolean;
    autoLockMinutes: number;
    twoFactorEnabled: boolean;
    biometricEnabled: boolean;
}

export const getUserPreferences = (): UserPreferences => {
    const stored = localStorage.getItem('userPreferences');
    if (stored) {
        return JSON.parse(stored);
    }

    // Default preferences
    return {
        emailNotifications: true,
        smsNotifications: true,
        securityAlerts: true,
        autoLockMinutes: 5,
        twoFactorEnabled: false,
        biometricEnabled: false,
    };
};

export const updateUserPreferences = (updates: Partial<UserPreferences>): void => {
    const current = getUserPreferences();
    const updated = { ...current, ...updates };
    localStorage.setItem('userPreferences', JSON.stringify(updated));
};

export const hasSeenFeatureTour = (): boolean => {
    return localStorage.getItem('hasSeenFeatureTour') === 'true';
};

export const markFeatureTourAsSeen = (): void => {
    localStorage.setItem('hasSeenFeatureTour', 'true');
};

export const isFirstLogin = (): boolean => {
    const firstLogin = localStorage.getItem('isFirstLogin') === 'true';
    if (firstLogin) {
        localStorage.removeItem('isFirstLogin');
    }
    return firstLogin;
};

export const updateLastActivity = (): void => {
    localStorage.setItem('lastActivity', new Date().toISOString());
};

export const getLastActivity = (): Date | null => {
    const stored = localStorage.getItem('lastActivity');
    return stored ? new Date(stored) : null;
};

export const getInactiveDays = (): number => {
    const lastActivity = getLastActivity();
    if (!lastActivity) return 0;

    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
};
