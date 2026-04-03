import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '~/store/settingsStore';

async function runHaptic(effect: () => Promise<unknown>) {
  if (!useSettingsStore.getState().hapticsEnabled) return;

  try {
    await effect();
  } catch (error) {
    console.warn('Failed to trigger haptic feedback', error);
  }
}

export const haptics = {
  light: () => runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: () => runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  heavy: () => runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),
  success: () =>
    runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  error: () => runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};

export function useHaptics() {
  useSettingsStore((s) => s.hapticsEnabled);
  return haptics;
}
