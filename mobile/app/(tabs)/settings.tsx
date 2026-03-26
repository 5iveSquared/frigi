import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { ensureAuthenticatedPlayer, resetGuestIdentity, signOut } from '~/api/auth';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Toggle } from '~/components/ui/Toggle';
import {
  requestNotificationPermissionsAsync,
  scheduleTestNotificationAsync,
} from '~/utils/notifications';
import { frigi } from '~/utils/colors';

export default function SettingsScreen() {
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<'unknown' | 'disabled' | 'enabled'>('unknown');

  useEffect(() => {
    let cancelled = false;

    const loadPreferences = async () => {
      const [savedSound, savedHaptics, savedDarkMode, player, permissions] = await Promise.all([
        SecureStore.getItemAsync('pref_sound'),
        SecureStore.getItemAsync('pref_haptics'),
        SecureStore.getItemAsync('pref_dark_mode'),
        ensureAuthenticatedPlayer(),
        Notifications.getPermissionsAsync(),
      ]);

      if (cancelled) return;
      if (savedSound !== null) setSound(savedSound === 'true');
      if (savedHaptics !== null) setHaptics(savedHaptics === 'true');
      if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');
      setUsername(player.username);
      setEmail(player.email);
      setNotificationStatus(
        permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
          ? 'enabled'
          : 'disabled',
      );
    };

    loadPreferences();
    return () => {
      cancelled = true;
    };
  }, []);

  const updatePreference = async (key: string, value: boolean, setter: (next: boolean) => void) => {
    setter(value);
    await SecureStore.setItemAsync(key, String(value));
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(tabs)/home');
  };

  const handleResetGuest = async () => {
    await resetGuestIdentity();
    router.replace('/(tabs)/home');
  };

  const handleEnableNotifications = async () => {
    const permissions = await requestNotificationPermissionsAsync();
    setNotificationStatus(
      permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
        ? 'enabled'
        : 'disabled',
    );
  };

  const handleSendTestNotification = async () => {
    const permissions = await requestNotificationPermissionsAsync();
    const enabled =
      permissions.granted || permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    setNotificationStatus(enabled ? 'enabled' : 'disabled');
    if (!enabled) return;
    await scheduleTestNotificationAsync();
  };

  const notificationLabel =
    notificationStatus === 'enabled'
      ? 'Enabled'
      : notificationStatus === 'disabled'
        ? 'Disabled'
        : 'Unknown';

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.card}>
          <View style={styles.accountBlock}>
            <Text style={styles.accountName}>{username ?? 'Guest'}</Text>
            <Text style={styles.accountEmail}>{email ?? 'Not loaded'}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBubble, styles.iconRed]}>
                <Text style={styles.iconText}>🔊</Text>
              </View>
              <Text style={styles.rowLabel}>Sound Effects</Text>
            </View>
            <Toggle checked={sound} onChange={(next) => updatePreference('pref_sound', next, setSound)} />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBubble, styles.iconMint]}>
                <Text style={styles.iconText}>📳</Text>
              </View>
              <Text style={styles.rowLabel}>Haptics</Text>
            </View>
            <Toggle checked={haptics} onChange={(next) => updatePreference('pref_haptics', next, setHaptics)} />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBubble, styles.iconGray]}>
                <Text style={styles.iconText}>🌙</Text>
              </View>
              <View>
                <Text style={styles.rowLabel}>Dark Mode</Text>
                <Text style={styles.rowHint}>Saved now, applied later</Text>
              </View>
            </View>
            <Toggle checked={darkMode} onChange={(next) => updatePreference('pref_dark_mode', next, setDarkMode)} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <Pressable style={styles.rowButton} onPress={handleEnableNotifications}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBubble, styles.iconMint]}>
                <Text style={styles.iconText}>🔔</Text>
              </View>
              <View>
                <Text style={styles.rowLabel}>Enable Notifications</Text>
                <Text style={styles.rowHint}>Current status: {notificationLabel}</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.rowButton} onPress={handleSendTestNotification}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBubble, styles.iconOrange]}>
                <Text style={styles.iconText}>🧪</Text>
              </View>
              <View>
                <Text style={styles.rowLabel}>Send Test Notification</Text>
                <Text style={styles.rowHint}>Schedules a local test in 2 seconds</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Progression</Text>
        <View style={styles.card}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Adaptive Levels</Text>
            <Text style={styles.infoBody}>
              Frigi now increases difficulty gradually after each completed run instead of jumping straight to hard layouts.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Support</Text>
        <View style={styles.card}>
          <Pressable style={styles.rowButton} onPress={() => router.push('/how-to-play')}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBubble, styles.iconOrange]}>
                <Text style={styles.iconText}>❓</Text>
              </View>
              <Text style={styles.rowLabel}>How to Play</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.rowButton}
            onPress={() => Linking.openURL('mailto:support@frigi.app')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBubble, styles.iconRed]}>
                <Text style={styles.iconText}>✉️</Text>
              </View>
              <Text style={styles.rowLabel}>Contact Support</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.rowButton}
            onPress={() => router.push('/privacy')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBubble, styles.iconGray]}>
                <Text style={styles.iconText}>🔐</Text>
              </View>
              <Text style={styles.rowLabel}>Privacy Policy</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable
            style={styles.rowButton}
            onPress={() => router.push('/terms')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBubble, styles.iconGray]}>
                <Text style={styles.iconText}>📄</Text>
              </View>
              <Text style={styles.rowLabel}>Terms of Use</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Account Actions</Text>
        <View style={styles.card}>
          <Pressable style={styles.rowButton} onPress={handleSignOut}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBubble, styles.iconOrange]}>
                <Text style={styles.iconText}>↩️</Text>
              </View>
              <Text style={styles.rowLabel}>Sign Out Session</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.rowButton} onPress={handleResetGuest}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBubble, styles.iconRed]}>
                <Text style={styles.iconText}>🧹</Text>
              </View>
              <View>
                <Text style={styles.rowLabel}>Start Fresh Guest</Text>
                <Text style={styles.rowHint}>Clears local guest credentials on this device</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <Pressable style={styles.resetButton} onPress={() => router.push('/how-to-play')}>
          <Text style={styles.resetText}>Review the Tutorial</Text>
        </Pressable>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: frigi.text,
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 18,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: frigi.textLight,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  accountBlock: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '800',
    color: frigi.text,
  },
  accountEmail: {
    marginTop: 4,
    fontSize: 12,
    color: frigi.textLight,
  },
  card: {
    backgroundColor: frigi.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: frigi.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: frigi.text,
    fontFamily: Platform.select({ ios: 'AvenirNext-Medium', android: 'sans-serif-medium' }),
  },
  rowHint: {
    fontSize: 11,
    color: frigi.textLight,
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: frigi.textLight,
  },
  divider: {
    height: 1,
    backgroundColor: frigi.border,
    marginLeft: 16,
  },
  iconBubble: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 14 },
  iconRed: { backgroundColor: '#FFE5EA' },
  iconMint: { backgroundColor: '#E6FFF3' },
  iconOrange: { backgroundColor: '#FFF1E3' },
  iconGray: { backgroundColor: '#F3F4F6' },
  resetButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#FBC7D2',
    backgroundColor: '#FFF1F4',
  },
  resetText: {
    color: frigi.red,
    fontWeight: '700',
    fontSize: 14,
  },
  infoBlock: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: frigi.text,
  },
  infoBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: frigi.textMuted,
  },
});
