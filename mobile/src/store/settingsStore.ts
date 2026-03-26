import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'frigi-settings' });

interface SettingsState {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: 'light' | 'dark' | 'system';

  setSoundEnabled: (v: boolean) => void;
  setHapticsEnabled: (v: boolean) => void;
  setTheme: (t: 'light' | 'dark' | 'system') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  soundEnabled: storage.getBoolean('soundEnabled') ?? true,
  hapticsEnabled: storage.getBoolean('hapticsEnabled') ?? true,
  theme: (storage.getString('theme') as SettingsState['theme']) ?? 'system',

  setSoundEnabled: (v) => {
    storage.set('soundEnabled', v);
    set({ soundEnabled: v });
  },
  setHapticsEnabled: (v) => {
    storage.set('hapticsEnabled', v);
    set({ hapticsEnabled: v });
  },
  setTheme: (t) => {
    storage.set('theme', t);
    set({ theme: t });
  },
}));
