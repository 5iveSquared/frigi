import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';

export async function configureNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }
}

export async function requestNotificationPermissionsAsync() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return current;
  }

  return Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
}

export async function scheduleTestNotificationAsync() {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Frigi test notification',
      body: 'Notifications are enabled and working.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
    },
  });
}
