import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Slot, SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureNotificationsAsync, getNotificationStatusAsync } from '~/utils/notifications';
import { preloadSoundEffectsAsync } from '~/utils/soundEffects';
import { useSettingsStore } from '~/store/settingsStore';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    useSettingsStore.getState().hydrateSettings().catch((error) => {
      console.warn('Failed to hydrate settings', error);
    });
    if (!useSettingsStore.getState().notificationsPreferenceSet) {
      getNotificationStatusAsync()
        .then((status) => {
          if (!useSettingsStore.getState().notificationsPreferenceSet) {
            useSettingsStore.getState().setNotificationsEnabled(status === 'enabled');
          }
        })
        .catch((error) => {
          console.warn('Failed to sync notification settings', error);
        });
    }
    configureNotificationsAsync().catch((error) => {
      console.warn('Failed to configure notifications', error);
    });
    preloadSoundEffectsAsync().catch((error) => {
      console.warn('Failed to preload sound effects', error);
    });
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="auto" />
        <Slot />
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
