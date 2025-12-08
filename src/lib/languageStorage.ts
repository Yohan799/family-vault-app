import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

const LANGUAGE_KEY = "app_language";

export const languageStorage = {
  async get(): Promise<string | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const { value } = await Preferences.get({ key: LANGUAGE_KEY });
        return value;
      } else {
        return localStorage.getItem(LANGUAGE_KEY);
      }
    } catch (error) {
      console.error("Error reading language:", error);
      return localStorage.getItem(LANGUAGE_KEY);
    }
  },

  async set(lang: string): Promise<void> {
    try {
      if (Capacitor.isNativePlatform()) {
        await Preferences.set({ key: LANGUAGE_KEY, value: lang });
      }
      // Always save to localStorage as fallback
      localStorage.setItem(LANGUAGE_KEY, lang);
    } catch (error) {
      console.error("Error saving language:", error);
      localStorage.setItem(LANGUAGE_KEY, lang);
    }
  },

  getSync(): string {
    // Synchronous fallback for initial render
    return localStorage.getItem(LANGUAGE_KEY) || "en";
  }
};
