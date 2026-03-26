import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '~/store/settingsStore';

export function useHaptics() {
  const enabled = useSettingsStore((s) => s.hapticsEnabled);

  return {
    light: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
    medium: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
    heavy: () => enabled && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
    success: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
    error: () => enabled && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  };
}
