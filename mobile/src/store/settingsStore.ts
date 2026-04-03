import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const SETTINGS_KEYS = {
  soundEnabled: 'pref_sound',
  hapticsEnabled: 'pref_haptics',
  notificationsEnabled: 'pref_notifications_enabled',
  theme: 'pref_theme',
  darkMode: 'pref_dark_mode',
} as const;

interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  notificationsPreferenceSet: boolean;
  theme: 'light' | 'dark' | 'system';

  setSoundEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  setNotificationsEnabled: (v: boolean) => void;
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  hydrateSettings: () => Promise<void>;
}

async function persistBoolean(key: string, value: boolean) {
  try {
    await SecureStore.setItemAsync(key, String(value));
  } catch (error) {
    console.warn(`Failed to persist boolean setting ${key}`, error);
  }
}

async function persistString(key: string, value: string) {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (error) {
    console.warn(`Failed to persist string setting ${key}`, error);
  }
}

export const useSettingsStore = create<SettingsState>((set) => ({
  soundEnabled: true,
  hapticsEnabled: true,
  notificationsEnabled: false,
  notificationsPreferenceSet: false,
  theme: 'system',

  setSoundEnabled: (v) => {
    set({ soundEnabled: v });
    void persistBoolean(SETTINGS_KEYS.soundEnabled, v);
  },
  setHapticsEnabled: (v) => {
    set({ hapticsEnabled: v });
    void persistBoolean(SETTINGS_KEYS.hapticsEnabled, v);
  },
  setNotificationsEnabled: (v) => {
    set({ notificationsEnabled: v, notificationsPreferenceSet: true });
    void persistBoolean(SETTINGS_KEYS.notificationsEnabled, v);
  },
  setTheme: (t) => {
    set({ theme: t });
    void persistString(SETTINGS_KEYS.theme, t);
  },
  hydrateSettings: async () => {
    const nextState: Partial<SettingsState> = {};
    const [
      savedSound,
      savedHaptics,
      savedNotifications,
      savedTheme,
      savedDarkMode,
    ] = await Promise.all([
      SecureStore.getItemAsync(SETTINGS_KEYS.soundEnabled),
      SecureStore.getItemAsync(SETTINGS_KEYS.hapticsEnabled),
      SecureStore.getItemAsync(SETTINGS_KEYS.notificationsEnabled),
      SecureStore.getItemAsync(SETTINGS_KEYS.theme),
      SecureStore.getItemAsync(SETTINGS_KEYS.darkMode),
    ]);

    if (savedSound !== null) {
      nextState.soundEnabled = savedSound === 'true';
    }

    if (savedHaptics !== null) {
      nextState.hapticsEnabled = savedHaptics === 'true';
    }

    if (savedNotifications !== null) {
      nextState.notificationsEnabled = savedNotifications === 'true';
      nextState.notificationsPreferenceSet = true;
    }

    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
      nextState.theme = savedTheme;
    } else if (savedDarkMode !== null) {
      nextState.theme = savedDarkMode === 'true' ? 'dark' : 'system';
    }

    if (Object.keys(nextState).length > 0) {
      set(nextState);
    }
  },
}));
