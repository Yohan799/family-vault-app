import { Capacitor } from '@capacitor/core';

// Create a hybrid storage adapter that uses Capacitor Preferences on native
// and localStorage on web
export const createCapacitorStorage = () => {
  const isNative = Capacitor.isNativePlatform();

  return {
    getItem: async (key: string): Promise<string | null> => {
      if (isNative) {
        try {
          const { Preferences } = await import('@capacitor/preferences');
          const { value } = await Preferences.get({ key });
          return value;
        } catch (error) {
          console.warn('Capacitor Preferences not available, falling back to localStorage');
          return localStorage.getItem(key);
        }
      }
      return localStorage.getItem(key);
    },

    setItem: async (key: string, value: string): Promise<void> => {
      if (isNative) {
        try {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.set({ key, value });
          return;
        } catch (error) {
          console.warn('Capacitor Preferences not available, falling back to localStorage');
        }
      }
      localStorage.setItem(key, value);
    },

    removeItem: async (key: string): Promise<void> => {
      if (isNative) {
        try {
          const { Preferences } = await import('@capacitor/preferences');
          await Preferences.remove({ key });
          return;
        } catch (error) {
          console.warn('Capacitor Preferences not available, falling back to localStorage');
        }
      }
      localStorage.removeItem(key);
    },
  };
};

// Synchronous wrapper for compatibility with Supabase's storage interface
export const capacitorStorageAdapter = {
  getItem: (key: string): string | null => {
    // For initial load, use localStorage as Supabase needs sync access
    // The actual session will be migrated to native storage after init
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    localStorage.setItem(key, value);
    // Also persist to native storage asynchronously
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/preferences').then(({ Preferences }) => {
        Preferences.set({ key, value }).catch(console.error);
      }).catch(console.error);
    }
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
    // Also remove from native storage asynchronously
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/preferences').then(({ Preferences }) => {
        Preferences.remove({ key }).catch(console.error);
      }).catch(console.error);
    }
  },
};
