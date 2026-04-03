import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useSettingsStore } from '~/store/settingsStore';

export const DEFAULT_NOTIFICATION_CHANNEL_ID = 'default';

type ExpoNotificationsModule = typeof import('expo-notifications');

export type NotificationStatus = 'enabled' | 'disabled' | 'unsupported';

const isExpoGoAndroid =
  Platform.OS === 'android' &&
  (Constants.executionEnvironment === 'storeClient' || Constants.appOwnership === 'expo');

export function getNotificationSupportReason() {
  if (!isExpoGoAndroid) return null;
  return 'Android notifications require a development build outside Expo Go.';
}

async function loadNotificationsModule(): Promise<ExpoNotificationsModule | null> {
  if (isExpoGoAndroid) {
    return null;
  }

  return import('expo-notifications');
}

function areNotificationsGranted(Notifications: ExpoNotificationsModule, permissions: Awaited<ReturnType<ExpoNotificationsModule['getPermissionsAsync']>>) {
  return permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function configureNotificationsAsync() {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: useSettingsStore.getState().notificationsEnabled,
      shouldShowList: useSettingsStore.getState().notificationsEnabled,
      shouldPlaySound: useSettingsStore.getState().notificationsEnabled,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(DEFAULT_NOTIFICATION_CHANNEL_ID, {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }
}

export async function getNotificationStatusAsync(): Promise<NotificationStatus> {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return 'unsupported';

  const current = await Notifications.getPermissionsAsync();
  return areNotificationsGranted(Notifications, current) ? 'enabled' : 'disabled';
}

export async function requestNotificationPermissionsAsync(): Promise<NotificationStatus> {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return 'unsupported';

  const current = await Notifications.getPermissionsAsync();
  if (areNotificationsGranted(Notifications, current)) {
    return 'enabled';
  }

  const next = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return areNotificationsGranted(Notifications, next) ? 'enabled' : 'disabled';
}

export async function disableNotificationsAsync() {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) return;

  await Notifications.cancelAllScheduledNotificationsAsync();
}
