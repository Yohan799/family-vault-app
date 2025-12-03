import { supabase } from "@/integrations/supabase/client";
import { Capacitor } from "@capacitor/core";

const LOCK_STATE_KEY = "app_lock_state";
const LOCAL_LOCK_TYPE_KEY = "app_lock_type_local";
const LOCAL_PIN_HASH_KEY = "app_pin_hash_local";

export type AppLockType = "biometric" | "pin" | "password" | null;

export interface AppLockState {
  isLocked: boolean;
  lockType: AppLockType;
  timestamp: number;
}

// Get current lock state from localStorage
export const getLockState = (): AppLockState => {
  const state = localStorage.getItem(LOCK_STATE_KEY);
  if (state) {
    return JSON.parse(state);
  }
  return { isLocked: false, lockType: null, timestamp: 0 };
};

// Set lock state
export const setLockState = (state: AppLockState) => {
  localStorage.setItem(LOCK_STATE_KEY, JSON.stringify(state));
};

// Lock the app
export const lockApp = (lockType: AppLockType) => {
  setLockState({
    isLocked: true,
    lockType,
    timestamp: Date.now(),
  });
};

// Unlock the app
export const unlockApp = () => {
  setLockState({
    isLocked: false,
    lockType: null,
    timestamp: 0,
  });
};

// ============ LOCAL STORAGE FUNCTIONS FOR PRE-LOGIN LOCK ============

// Save lock preference locally (for pre-login lock check)
export const saveLocalLockPreference = async (lockType: AppLockType) => {
  // Save to localStorage (works on both web and native)
  if (lockType) {
    localStorage.setItem(LOCAL_LOCK_TYPE_KEY, lockType);
  } else {
    localStorage.removeItem(LOCAL_LOCK_TYPE_KEY);
  }
  
  // Also save to Capacitor Preferences on native platforms
  if (Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      if (lockType) {
        await Preferences.set({ key: LOCAL_LOCK_TYPE_KEY, value: lockType });
      } else {
        await Preferences.remove({ key: LOCAL_LOCK_TYPE_KEY });
      }
    } catch (error) {
      console.error("Failed to save lock preference to native storage:", error);
    }
  }
};

// Get local lock preference (for pre-login lock check)
export const getLocalLockPreference = async (): Promise<AppLockType> => {
  // Try Capacitor Preferences first on native platforms
  if (Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key: LOCAL_LOCK_TYPE_KEY });
      if (value) {
        return value as AppLockType;
      }
    } catch (error) {
      console.error("Failed to get lock preference from native storage:", error);
    }
  }
  
  // Fallback to localStorage
  const value = localStorage.getItem(LOCAL_LOCK_TYPE_KEY);
  return (value as AppLockType) || null;
};

// Save PIN hash locally (for pre-login PIN verification)
export const saveLocalPinHash = async (pinHash: string) => {
  localStorage.setItem(LOCAL_PIN_HASH_KEY, pinHash);
  
  if (Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key: LOCAL_PIN_HASH_KEY, value: pinHash });
    } catch (error) {
      console.error("Failed to save PIN hash to native storage:", error);
    }
  }
};

// Get local PIN hash (for pre-login PIN verification)
export const getLocalPinHash = async (): Promise<string | null> => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      const { value } = await Preferences.get({ key: LOCAL_PIN_HASH_KEY });
      if (value) return value;
    } catch (error) {
      console.error("Failed to get PIN hash from native storage:", error);
    }
  }
  
  return localStorage.getItem(LOCAL_PIN_HASH_KEY);
};

// Clear local lock preferences (when disabling lock)
export const clearLocalLockPreferences = async () => {
  localStorage.removeItem(LOCAL_LOCK_TYPE_KEY);
  localStorage.removeItem(LOCAL_PIN_HASH_KEY);
  
  if (Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.remove({ key: LOCAL_LOCK_TYPE_KEY });
      await Preferences.remove({ key: LOCAL_PIN_HASH_KEY });
    } catch (error) {
      console.error("Failed to clear lock preferences from native storage:", error);
    }
  }
};

// Verify PIN locally (without database - for pre-login)
export const verifyPinLocally = async (pin: string): Promise<boolean> => {
  const localPinHash = await getLocalPinHash();
  if (!localPinHash) return false;
  
  const enteredHash = await hashPin(pin);
  return localPinHash === enteredHash;
};

// Check if app should be locked based on inactivity
export const checkAutoLock = async (userId: string, autoLockMinutes: number | null) => {
  if (!autoLockMinutes) return false;

  const state = getLockState();
  const { data: profile } = await supabase
    .from("profiles")
    .select("app_lock_type")
    .eq("id", userId)
    .single();

  if (!profile?.app_lock_type) return false;

  const inactiveTime = Date.now() - state.timestamp;
  const lockThreshold = autoLockMinutes * 60 * 1000;

  if (inactiveTime > lockThreshold) {
    lockApp(profile.app_lock_type as AppLockType);
    return true;
  }

  return false;
};

// Verify PIN
export const verifyPin = async (userId: string, pin: string): Promise<boolean> => {
  const { data: profile } = await supabase
    .from("profiles")
    .select("app_pin_hash")
    .eq("id", userId)
    .single();

  if (!profile?.app_pin_hash) return false;

  // Simple hash comparison (in production, use proper password hashing)
  const hashedPin = await hashPin(pin);
  return hashedPin === profile.app_pin_hash;
};

// Hash PIN (simple implementation - use bcrypt in production)
export const hashPin = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
};

// Save PIN to database
export const savePin = async (userId: string, pin: string) => {
  const hashedPin = await hashPin(pin);
  const { error } = await supabase
    .from("profiles")
    .update({ app_pin_hash: hashedPin, app_lock_type: "pin" })
    .eq("id", userId);

  if (error) throw error;
};

// Update lock type
export const updateLockType = async (userId: string, lockType: AppLockType) => {
  const updates: { app_lock_type: string | null } = { app_lock_type: lockType };
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) throw error;
};