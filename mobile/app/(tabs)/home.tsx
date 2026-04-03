import { View, Text, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { ensureAuthenticatedPlayer } from '~/api/auth';
import { playersApi, type PlayerProgressSummary } from '~/api/players';
import { levelsApi } from '~/api/levels';
import { useGameStore } from '~/store/gameStore';
import { frigi } from '~/utils/colors';
import type { Level } from '@frigi/shared';

const COMPLETED_FOOD_ICONS = ['🍓', '🥦', '🧀', '🥛', '🥕', '🍋'] as const;

function getCompletedFoodIcon(levelId: string) {
  const seed = levelId.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return COMPLETED_FOOD_ICONS[seed % COMPLETED_FOOD_ICONS.length];
}

export default function HomeScreen() {
  const [completedLevels, setCompletedLevels] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [totalStars, setTotalStars] = useState(0);
  const [progress, setProgress] = useState<PlayerProgressSummary | null>(null);
  const [dailyLevel, setDailyLevel] = useState<Level | null>(null);
  const [isProgressLoading, setIsProgressLoading] = useState(true);
  const activeLevel = useGameStore((s) => s.level);
  const activeGrid = useGameStore((s) => s.grid);
  const activeGameComplete = useGameStore((s) => s.isComplete);
  const activeCampaignInProgress = !!activeLevel && !activeLevel.isDaily && !!activeGrid && !activeGameComplete;
  const activeDailyInProgress = !!activeLevel?.isDaily && !!activeGrid && !activeGameComplete;

  const loadProgress = useCallback(() => {
    let cancelled = false;

    const run = async () => {
      if (!cancelled) {
        setIsProgressLoading(true);
      }
      try {
        await ensureAuthenticatedPlayer();
        const [summary, daily] = await Promise.all([playersApi.progress(), levelsApi.getDaily()]);
        if (!cancelled) {
          setProgress(summary);
          setCompletedLevels(summary.completedLevels);
          setCurrentLevel(summary.currentLevelNumber);
          setTotalStars(summary.totalStars);
          setDailyLevel(daily);
        }
      } catch (error) {
        console.warn('Failed to load player progress', error);
      } finally {
        if (!cancelled) {
          setIsProgressLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);
  useFocusEffect(loadProgress);

  const levels = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => {
        const id = index + 1;
        const existing = progress?.levels.find((level) => level.levelNumber === id);
        if (existing?.completions) {
          return { id: String(id), status: 'completed' as const, stars: existing.stars };
        }
        if (id === currentLevel) {
          return { id: String(id), status: 'current' as const, stars: 0 };
        }
        return { id: String(id), status: 'locked' as const, stars: 0 };
      }),
    [currentLevel, progress]
  );

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
          <View style={styles.coinPill}>
            <View style={styles.coinIcon}>
              <View style={styles.coinInner} />
            </View>
            <Text style={styles.coinText}>{totalStars} Stars</Text>
          </View>
          <Pressable style={styles.settingsButton} onPress={() => router.push('/(tabs)/settings')}>
            <View style={styles.settingsRing}>
              <View style={styles.settingsCore} />
            </View>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.fridgeShell}>
            <View style={styles.fridgeDoor}>
              <View style={styles.fridgeShelfRow}>
                <View style={[styles.fridgeItem, styles.fridgeItemBlue]} />
                <View style={[styles.fridgeItem, styles.fridgeItemBlueLight]} />
              </View>
              <View style={styles.fridgeShelfRow}>
                <View style={[styles.fridgeItem, styles.fridgeItemPink]} />
                <View style={[styles.fridgeItem, styles.fridgeItemAmber]} />
                <View style={[styles.fridgeItem, styles.fridgeItemCream]} />
              </View>
              <View style={styles.fridgeBottomRow}>
                <View style={styles.fridgeEgg} />
                <View style={styles.fridgeLeaf} />
              </View>
            </View>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>Frigi</Text>
            <View style={styles.titleUnderline} />
          </View>

          <Pressable
            style={styles.playButton}
            onPress={handlePlay}
          >
            <View style={styles.playIcon}>
              <View style={styles.playTriangle} />
            </View>
            <Text style={styles.playButtonText}>
              {activeCampaignInProgress
                ? 'Resume Game'
                : isProgressLoading
                  ? `Play Level ${currentLevel}`
                  : `Play Level ${currentLevel}`}
            </Text>
          </Pressable>

          <Pressable style={styles.helpLink} onPress={() => router.push('/how-to-play')}>
            <Text style={styles.helpLinkText}>How to Play</Text>
          </Pressable>
        </View>

        <View style={styles.levelHeader}>
          <View>
            <Text style={styles.levelTitle}>Levels</Text>
            <Text style={styles.levelSubtitle}>
              Difficulty increases a little each time you clear a run. You have cleared {completedLevels} levels.
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.levelRow}
        >
          {levels.map((level) => {
            const isCompleted = level.status === 'completed';
            const isCurrent = level.status === 'current';
            const isLocked = level.status === 'locked';
            return (
              <View
                key={level.id}
                style={[
                  styles.levelCard,
                  isCompleted && styles.levelCardDone,
                  isCurrent && styles.levelCardCurrent,
                  isLocked && styles.levelCardLocked,
                ]}
              >
                {isCompleted ? (
                  <View style={styles.completedBadge}>
                    <View style={styles.completedFoodBubble}>
                      <Text style={styles.completedFoodIcon}>{getCompletedFoodIcon(level.id)}</Text>
                    </View>
                    <View style={styles.checkMark}>
                      <View style={styles.checkStem} />
                      <View style={styles.checkKick} />
                    </View>
                  </View>
                ) : isLocked ? (
                  <Text style={styles.lockIcon}>🔒</Text>
                ) : (
                  <Text style={styles.levelNumber}>{level.id}</Text>
                )}

                {isCompleted && (
                  <View style={styles.levelStars}>
                    {[1, 2, 3].map((star) => (
                      <View
                        key={star}
                        style={[
                          styles.levelStar,
                          star <= level.stars ? styles.levelStarOn : styles.levelStarOff,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>

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
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: frigi.bg },
  container: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 28 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: frigi.surface,
    borderWidth: 1,
    borderColor: frigi.border,
    gap: 8,
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
    fontWeight: '700',
    color: frigi.text,
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: frigi.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: frigi.border,
  },
  settingsRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: frigi.textLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: frigi.textLight,
  },
  hero: { alignItems: 'center', marginTop: 24, marginBottom: 24 },
  fridgeShell: {
    width: 86,
    height: 100,
    borderRadius: 18,
    backgroundColor: frigi.surface,
    borderWidth: 2,
    borderColor: frigi.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: frigi.shadow,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  fridgeDoor: {
    width: 58,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F7FAFF',
    borderWidth: 1,
    borderColor: frigi.border,
    padding: 6,
    gap: 4,
  },
  fridgeShelfRow: { flexDirection: 'row', gap: 4 },
  fridgeItem: { width: 10, height: 10, borderRadius: 3 },
  fridgeItemBlue: { backgroundColor: '#9FD6FF' },
  fridgeItemBlueLight: { backgroundColor: '#D3EEFF' },
  fridgeItemPink: { backgroundColor: '#FFB3C1' },
  fridgeItemAmber: { backgroundColor: '#FFD79A' },
  fridgeItemCream: { backgroundColor: '#FBE7C6' },
  fridgeBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fridgeEgg: {
    width: 10,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#FFE8B2',
  },
  fridgeLeaf: {
    width: 12,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#9EE8B8',
  },
  titleBlock: { alignItems: 'center', marginTop: 16, marginBottom: 16 },
  title: {
    fontSize: 40,
    color: frigi.text,
    fontWeight: '800',
    fontFamily: Platform.select({ ios: 'AvenirNext-Heavy', android: 'sans-serif-condensed' }),
  },
  helpLink: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFF1F4',
  },
  helpLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: frigi.red,
  },
  levelSubtitle: {
    fontSize: 11,
    color: frigi.textLight,
    marginTop: 2,
  },
  titleUnderline: {
    width: 44,
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(110,231,183,0.4)',
    marginTop: 6,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 26,
    backgroundColor: frigi.red,
    gap: 10,
    shadowColor: frigi.red,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  playButtonDisabled: {
    opacity: 0.6,
  },
  playIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftWidth: 9,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#FFFFFF',
    marginLeft: 1,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
  },
  levelHeader: {
    marginTop: 8,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: frigi.text,
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
  },
  levelRow: { gap: 12, paddingTop: 16, paddingRight: 12, paddingBottom: 24 },
  levelCard: {
    width: 70,
    height: 78,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: frigi.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: frigi.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  levelCardDone: {
    backgroundColor: frigi.red,
  },
  completedBadge: {
    width: 70,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedFoodBubble: {
    position: 'absolute',
    width: 70,
    height: 78,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedFoodIcon: {
    fontSize: 52,
    opacity: 0.8,
  },
  levelCardCurrent: {
    borderWidth: 3,
    borderColor: frigi.red,
  },
  levelCardLocked: {
    backgroundColor: '#E5E7EB',
  },
  checkMark: {
    width: 20,
    height: 14,
  },
  checkStem: {
    position: 'absolute',
    width: 4,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
    left: 6,
    top: 2,
  },
  checkKick: {
    position: 'absolute',
    width: 4,
    height: 7,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
    left: 2,
    top: 6,
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: frigi.red,
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
  },
  lockIcon: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  levelStars: {
    position: 'absolute',
    bottom: -6,
    flexDirection: 'row',
    gap: 4,
    backgroundColor: frigi.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: frigi.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  levelStar: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  levelStarOn: { backgroundColor: frigi.orange },
  levelStarOff: { backgroundColor: '#E5E7EB' },
  challengeCard: {
    marginTop: 8,
    backgroundColor: frigi.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE3C4',
    shadowColor: frigi.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
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
    marginTop: 20,
    fontSize: 12,
    color: frigi.textLight,
    textAlign: 'center',
    fontFamily: Platform.select({ ios: 'AvenirNext-Regular', android: 'sans-serif' }),
  },
});
