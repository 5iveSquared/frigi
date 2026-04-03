import { View, Text, StyleSheet, Pressable, ScrollView, Platform, Linking } from 'react-native';
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ensureAuthenticatedPlayer, resetGuestIdentity, signOut } from '~/api/auth';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { Toggle } from '~/components/ui/Toggle';
import { useSettingsStore } from '~/store/settingsStore';
import {
  disableNotificationsAsync,
  getNotificationStatusAsync,
  getNotificationSupportReason,
  type NotificationStatus,
  requestNotificationPermissionsAsync,
} from '~/utils/notifications';
import { frigi } from '~/utils/colors';
import { playSoundEffectAsync } from '~/utils/soundEffects';
import { useHaptics } from '~/utils/haptics';

export default function SettingsScreen() {
  const sound = useSettingsStore((s) => s.soundEnabled);
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const notificationsEnabled = useSettingsStore((s) => s.notificationsEnabled);
  const notificationsPreferenceSet = useSettingsStore((s) => s.notificationsPreferenceSet);
  const theme = useSettingsStore((s) => s.theme);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);
  const setNotificationsEnabled = useSettingsStore((s) => s.setNotificationsEnabled);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const [username, setUsername] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | 'unknown'>('unknown');
  const haptics = useHaptics();
  const notificationSupportReason = getNotificationSupportReason();

  const darkMode = theme === 'dark';

  useEffect(() => {
    let cancelled = false;

    const loadPreferences = async () => {
      const [player, notificationState] = await Promise.all([
        ensureAuthenticatedPlayer(),
        getNotificationStatusAsync(),
      ]);

      if (cancelled) return;
      setUsername(player.username);
      setEmail(player.email);
      setNotificationStatus(notificationState);

      if (!notificationsPreferenceSet && notificationState !== 'unsupported') {
        setNotificationsEnabled(notificationState === 'enabled');
      }
    };

    loadPreferences();
    return () => {
      cancelled = true;
    };
  }, [notificationsPreferenceSet, setNotificationsEnabled]);

  const handleSoundToggle = (next: boolean) => {
    setSoundEnabled(next);
    haptics.light();
    if (next) {
      void playSoundEffectAsync('tap');
    }
  };

  const handleHapticsToggle = (next: boolean) => {
    setHapticsEnabled(next);
    if (next) {
      haptics.light();
    }
    void playSoundEffectAsync('tap');
  };

  const handleDarkModeToggle = (next: boolean) => {
    setTheme(next ? 'dark' : 'system');
    haptics.light();
    void playSoundEffectAsync('tap');
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/(tabs)/home');
  };

  const handleResetGuest = async () => {
    await resetGuestIdentity();
    router.replace('/(tabs)/home');
  };

  const handleNotificationToggle = async (next: boolean) => {
    if (notificationSupportReason) {
      setNotificationsEnabled(false);
      setNotificationStatus('unsupported');
      return;
    }

    if (!next) {
      setNotificationsEnabled(false);
      setNotificationStatus('disabled');
      haptics.light();
      void playSoundEffectAsync('tap');
      await disableNotificationsAsync();
      return;
    }

    const nextStatus = await requestNotificationPermissionsAsync();
    setNotificationStatus(nextStatus);
    setNotificationsEnabled(nextStatus === 'enabled');

    if (nextStatus === 'enabled') {
      haptics.success();
      void playSoundEffectAsync('success');
    } else if (nextStatus === 'disabled') {
      haptics.error();
      void playSoundEffectAsync('error');
    } else {
      setNotificationsEnabled(false);
    }
  };

  const notificationHint =
    notificationStatus === 'unknown'
      ? 'Checking device permission'
      : notificationStatus === 'unsupported'
        ? notificationSupportReason ?? 'Notifications are unavailable in this runtime'
      : notificationsEnabled && notificationStatus === 'enabled'
        ? 'Frigi alerts are enabled on this device'
        : notificationsEnabled
          ? 'Allow notifications in system settings to receive alerts'
          : notificationStatus === 'enabled'
            ? 'Paused in Frigi'
            : 'Notifications are off';

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
            <Toggle checked={sound} onChange={handleSoundToggle} />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBubble, styles.iconMint]}>
                <Text style={styles.iconText}>📳</Text>
              </View>
              <Text style={styles.rowLabel}>Haptics</Text>
            </View>
            <Toggle checked={hapticsEnabled} onChange={handleHapticsToggle} />
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
            <Toggle checked={darkMode} onChange={handleDarkModeToggle} />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Notifications</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBubble, styles.iconMint]}>
                <Text style={styles.iconText}>🔔</Text>
              </View>
              <View>
                <Text style={styles.rowLabel}>Enable Notifications</Text>
                <Text style={styles.rowHint}>{notificationHint}</Text>
              </View>
            </View>
            <Toggle
              checked={notificationsEnabled}
              disabled={notificationStatus === 'unsupported'}
              onChange={handleNotificationToggle}
            />
          </View>
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
