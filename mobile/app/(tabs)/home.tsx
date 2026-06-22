import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { ensureAuthenticatedPlayer } from '~/api/auth';
import { playersApi, type PlayerProgressSummary } from '~/api/players';
import { levelsApi } from '~/api/levels';
import { useGameStore } from '~/store/gameStore';
import { frigi } from '~/utils/colors';
import type { Level } from '@frigi/shared';

export default function HomeScreen() {
  const [totalStars, setTotalStars] = useState(0);
  const [progress, setProgress] = useState<PlayerProgressSummary | null>(null);
  const [dailyLevel, setDailyLevel] = useState<Level | null>(null);
  const activeLevel = useGameStore((s) => s.level);
  const activeGrid = useGameStore((s) => s.grid);
  const activeGameComplete = useGameStore((s) => s.isComplete);
  const activeCampaignInProgress = !!activeLevel && !activeLevel.isDaily && !!activeGrid && !activeGameComplete;
  const activeDailyInProgress = !!activeLevel?.isDaily && !!activeGrid && !activeGameComplete;

  const loadProgress = useCallback(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await ensureAuthenticatedPlayer();
        const [summary, daily] = await Promise.all([playersApi.progress(), levelsApi.getDaily()]);
        if (!cancelled) {
          setProgress(summary);
          setTotalStars(summary.totalStars);
          setDailyLevel(daily);
        }
      } catch (error) {
        console.warn('Failed to load player progress', error);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);
  useFocusEffect(loadProgress);

  const handlePlay = () => {
    if (activeCampaignInProgress && activeLevel) {
      router.push(`/game/${activeLevel.id}`);
      return;
    }
    router.push('/game/loading');
  };

  const handleDailyPlay = () => {
    if (activeDailyInProgress && activeLevel) {
      router.push(`/game/${activeLevel.id}`);
      return;
    }
    router.push('/game/loading?mode=daily');
  };

  const dailySummary = progress?.daily ?? null;
  const dailyComplete = !!dailySummary?.isCompleted;
  const dailyButtonText = activeDailyInProgress
    ? 'Resume Run'
    : dailyComplete
      ? null
      : dailySummary?.hasAttempt
        ? 'Continue'
        : 'Play';
  const dailySubtitle = activeDailyInProgress
    ? 'Your daily run is still open. Jump back in and finish it.'
    : dailySummary?.isCompleted
      ? `Completed today${dailySummary.bestScore ? ` · Best score ${dailySummary.bestScore}` : ''}`
      : dailySummary?.hasAttempt
        ? `Started today${dailySummary.attempts > 1 ? ` · ${dailySummary.attempts} attempts` : ''}`
        : dailyLevel
          ? `${dailyLevel.theme.replace('_', ' ')} challenge · ${Math.round(dailyLevel.difficulty * 100)}% difficulty`
          : 'Loading today’s fridge...';

  return (
    <SafeScreen style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={styles.headerSpacer} />
          <Text style={styles.logoText}>Frigi</Text>
          <Pressable style={styles.profileButton} onPress={() => router.push('/(tabs)/settings')}>
            <Ionicons name="person-circle-outline" size={28} color={frigi.text} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>
                {activeCampaignInProgress ? 'Finish the fridge' : 'Open the fridge'}
              </Text>
            </View>
            <Pressable style={styles.helpLink} onPress={() => router.push('/how-to-play')}>
              <Text style={styles.helpLinkText}>How to Play</Text>
            </Pressable>
          </View>

          <View style={styles.fridgeStage}>
            <View style={styles.fridgeBackdrop}>
              <View style={styles.fridgeSteamTall} />
              <View style={styles.fridgeSteamShort} />
            </View>
            <View style={styles.fridgeShadow} />
            <View style={styles.fridgeShell}>
              <View style={styles.freezerDoor}>
                <View style={styles.freezerHandle} />
                <View style={styles.freezerStack}>
                  <View style={[styles.freezerCube, styles.freezerCubeMint]} />
                  <View style={[styles.freezerCube, styles.freezerCubeBlue]} />
                </View>
              </View>
              <View style={styles.fridgeDoor}>
                <View style={styles.fridgeHandle} />
                <View style={styles.fridgeShelfRow}>
                  <View style={[styles.fridgeItem, styles.fridgeItemBlue]} />
                  <View style={[styles.fridgeItem, styles.fridgeItemPink]} />
                  <View style={[styles.fridgeItem, styles.fridgeItemMint]} />
                </View>
                <View style={styles.fridgeShelfRow}>
                  <View style={[styles.fridgeItemWide, styles.fridgeItemAmber]} />
                  <View style={[styles.fridgeItem, styles.fridgeItemCream]} />
                </View>
                <View style={styles.fridgeBottomRow}>
                  <View style={styles.fridgeEgg} />
                  <View style={styles.fridgeLeaf} />
                  <View style={styles.fridgeDot} />
                </View>
              </View>
            </View>
          </View>

          <Pressable
            style={styles.playButton}
            onPress={handlePlay}
          >
            <View style={styles.playIcon}>
              <View style={styles.playTriangle} />
            </View>
            <Text style={styles.playButtonText}>
              {activeCampaignInProgress ? 'Resume Game' : 'Play'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.challengeCard}>
          <View style={[styles.challengeBody, dailyComplete && styles.challengeBodyCompleted]}>
            <View style={[styles.challengeTitleRow, dailyComplete && styles.challengeTitleRowCompleted]}>
              <View
                style={[
                  styles.challengeBadge,
                  dailySummary?.isCompleted && styles.challengeBadgeDone,
                  activeDailyInProgress && styles.challengeBadgeActive,
                ]}
              />
              <Text style={styles.challengeTitle}>Daily Challenge</Text>
              <View
                style={[
                  styles.challengeStatusPill,
                  dailyComplete && styles.challengeStatusPillCompleted,
                  dailySummary?.isCompleted
                    ? styles.challengeStatusPillDone
                    : activeDailyInProgress || dailySummary?.hasAttempt
                      ? styles.challengeStatusPillActive
                      : styles.challengeStatusPillReady,
                ]}
              >
                <Text
                  style={[
                    styles.challengeStatusText,
                    dailySummary?.isCompleted
                      ? styles.challengeStatusTextDone
                      : activeDailyInProgress || dailySummary?.hasAttempt
                        ? styles.challengeStatusTextActive
                        : styles.challengeStatusTextReady,
                  ]}
                >
                  {dailySummary?.isCompleted ? 'Completed' : activeDailyInProgress || dailySummary?.hasAttempt ? 'In Progress' : 'Ready'}
                </Text>
              </View>
            </View>
            <Text style={[styles.challengeSubtitle, dailyComplete && styles.challengeSubtitleCompleted]}>
              {dailySubtitle}
            </Text>
          </View>
          {dailyButtonText ? (
            <Pressable
              style={[
                styles.challengeButton,
                activeDailyInProgress && styles.challengeButtonActive,
              ]}
              onPress={handleDailyPlay}
            >
              <Text style={styles.challengeButtonText}>{dailyButtonText}</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={styles.version}>Frigi v1.0.1</Text>

        <View style={styles.scoreDock}>
          <View style={styles.coinPill}>
            <View style={styles.coinIcon}>
              <View style={styles.coinInner} />
            </View>
            <Text style={styles.coinText}>{totalStars} Stars</Text>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F7FBFF' },
  container: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 58,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  logoText: {
    fontSize: 30,
    lineHeight: 36,
    color: frigi.text,
    fontWeight: '900',
    fontFamily: Platform.select({ ios: 'AvenirNext-Heavy', android: 'sans-serif-condensed' }),
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: frigi.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF4',
    shadowColor: '#A7B3C7',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 118,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: frigi.surface,
    borderWidth: 1,
    borderColor: '#E8EDF4',
    gap: 8,
    shadowColor: '#A7B3C7',
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  coinIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFCF4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFE69C',
  },
  coinText: {
    fontSize: 14,
    fontWeight: '800',
    color: frigi.text,
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
  },
  hero: {
    marginTop: 22,
    marginBottom: 18,
    padding: 18,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6EEF6',
    shadowColor: '#93A4BA',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 7,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroCopy: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 32,
    lineHeight: 36,
    color: '#132238',
    fontWeight: '900',
    fontFamily: Platform.select({ ios: 'AvenirNext-Heavy', android: 'sans-serif-condensed' }),
  },
  fridgeStage: {
    height: 238,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fridgeBackdrop: {
    position: 'absolute',
    width: '92%',
    height: 176,
    bottom: 24,
    borderRadius: 26,
    backgroundColor: '#EAF7FF',
    borderWidth: 1,
    borderColor: '#D4ECFF',
  },
  fridgeSteamTall: {
    position: 'absolute',
    left: 34,
    top: 24,
    width: 10,
    height: 70,
    borderRadius: 5,
    backgroundColor: 'rgba(125, 211, 252, 0.28)',
  },
  fridgeSteamShort: {
    position: 'absolute',
    right: 42,
    top: 42,
    width: 10,
    height: 44,
    borderRadius: 5,
    backgroundColor: 'rgba(110, 231, 183, 0.26)',
  },
  fridgeShadow: {
    position: 'absolute',
    bottom: 26,
    width: 166,
    height: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.10)',
  },
  fridgeShell: {
    width: 132,
    height: 186,
    borderRadius: 28,
    backgroundColor: '#F9FCFF',
    borderWidth: 3,
    borderColor: '#D7E0EA',
    padding: 9,
    shadowColor: '#4B647F',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  freezerDoor: {
    height: 56,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2EAF2',
    marginBottom: 8,
    padding: 9,
    justifyContent: 'flex-end',
  },
  freezerHandle: {
    position: 'absolute',
    right: 8,
    top: 18,
    width: 4,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#C8D2DD',
  },
  freezerStack: {
    flexDirection: 'row',
    gap: 6,
  },
  freezerCube: {
    width: 20,
    height: 16,
    borderRadius: 5,
  },
  freezerCubeMint: {
    backgroundColor: '#BDF7DD',
  },
  freezerCubeBlue: {
    backgroundColor: '#CBEAFF',
  },
  fridgeDoor: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2EAF2',
    padding: 12,
    gap: 9,
  },
  fridgeHandle: {
    position: 'absolute',
    right: 8,
    top: 24,
    width: 4,
    height: 44,
    borderRadius: 4,
    backgroundColor: '#C8D2DD',
  },
  fridgeShelfRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3F8',
    paddingBottom: 7,
  },
  fridgeItem: { width: 16, height: 22, borderRadius: 5 },
  fridgeItemWide: { width: 30, height: 18, borderRadius: 6 },
  fridgeItemBlue: { backgroundColor: '#8ED1FF' },
  fridgeItemPink: { backgroundColor: '#FF9BAD' },
  fridgeItemMint: { backgroundColor: '#72E4AF' },
  fridgeItemAmber: { backgroundColor: '#FFD179' },
  fridgeItemCream: { backgroundColor: '#F8E5BA' },
  fridgeBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fridgeEgg: {
    width: 20,
    height: 12,
    borderRadius: 10,
    backgroundColor: '#FFE8B2',
  },
  fridgeLeaf: {
    width: 24,
    height: 12,
    borderRadius: 12,
    backgroundColor: '#76E0A6',
  },
  fridgeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF637C',
  },
  helpLink: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFF1F4',
  },
  helpLinkText: {
    fontSize: 12,
    fontWeight: '800',
    color: frigi.red,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: 28,
    paddingVertical: 15,
    borderRadius: 22,
    backgroundColor: frigi.red,
    gap: 12,
    shadowColor: frigi.red,
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  playIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 11,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
    marginLeft: 1,
  },
  playButtonText: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'AvenirNext-Heavy', android: 'sans-serif-condensed' }),
  },
  challengeCard: {
    marginTop: 4,
    backgroundColor: frigi.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE0BB',
    shadowColor: '#E6A15A',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  challengeBody: {
    width: '100%',
  },
  challengeBodyCompleted: {
    alignItems: 'center',
  },
  challengeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  challengeTitleRowCompleted: {
    justifyContent: 'center',
  },
  challengeBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFE1B8',
  },
  challengeBadgeDone: {
    backgroundColor: '#C7F9DB',
  },
  challengeBadgeActive: {
    backgroundColor: '#D7EEFF',
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: frigi.text,
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
  },
  challengeStatusPill: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  challengeStatusPillCompleted: {
    marginLeft: 0,
  },
  challengeStatusPillReady: {
    backgroundColor: '#FFF3E3',
  },
  challengeStatusPillActive: {
    backgroundColor: '#E9F5FF',
  },
  challengeStatusPillDone: {
    backgroundColor: '#E9FBF1',
  },
  challengeStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  challengeStatusTextReady: {
    color: frigi.orange,
  },
  challengeStatusTextActive: {
    color: '#2563EB',
  },
  challengeStatusTextDone: {
    color: '#0F9D58',
  },
  challengeSubtitle: {
    marginTop: 6,
    fontSize: 12,
    color: frigi.textLight,
    fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'sans-serif' }),
  },
  challengeSubtitleCompleted: {
    textAlign: 'center',
  },
  challengeButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    backgroundColor: frigi.orange,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  challengeButtonActive: {
    backgroundColor: '#2563EB',
  },
  challengeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
  },
  version: {
    marginTop: 18,
    fontSize: 12,
    color: frigi.textLight,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'sans-serif' }),
  },
  scoreDock: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
});
