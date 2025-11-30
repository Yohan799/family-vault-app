import { supabase } from "@/integrations/supabase/client";

const LOCK_STATE_KEY = "app_lock_state";
const LOCK_TIMESTAMP_KEY = "app_lock_timestamp";

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