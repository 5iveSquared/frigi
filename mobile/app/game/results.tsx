import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { useGameStore } from '~/store/gameStore';
import { StarRating } from '~/components/ui/StarRating';
import { ensureAuthenticatedPlayer } from '~/api/auth';
import { playersApi, type PlayerProgressSummary } from '~/api/players';
import { frigi, polar } from '~/utils/colors';

export default function ResultsScreen() {
  const score = useGameStore((s) => s.score);
  const level = useGameStore((s) => s.level);
  const moveCount = useGameStore((s) => s.moveCount);
  const isDaily = !!level?.isDaily;
  const stars = score ? (score.efficiencyPct >= 0.85 ? 3 : score.efficiencyPct >= 0.65 ? 2 : 1) : 0;
  const coins = score ? Math.max(50, Math.round(score.total / 20)) : 0;
  const [progress, setProgress] = useState<PlayerProgressSummary | null>(null);
  const pulse = useRef(new Animated.Value(1)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    const loadProgress = async () => {
      try {
        await ensureAuthenticatedPlayer();
        const summary = await playersApi.progress();
        if (!cancelled) {
          setProgress(summary);
        }
      } catch (error) {
        console.warn('Failed to load progress summary', error);
      }
    };

    loadProgress();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.05,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, {
          toValue: -8,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(floatY, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    floatLoop.start();
    return () => {
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [floatY, pulse]);

  return (
    <SafeScreen style={isDaily ? styles.screenDaily : styles.screen}>
      <Animated.View
        style={[
          styles.glow,
          isDaily && styles.glowDaily,
          { transform: [{ scale: pulse }] },
        ]}
      />

      <Animated.View style={[styles.confettiWrap, { transform: [{ translateY: floatY }] }]}>
        {CONFETTI.map((piece) => (
          <View
            key={piece.key}
            style={[
              styles.confetti,
              isDaily && styles.confettiDaily,
              { left: piece.left, top: piece.top, backgroundColor: piece.color },
            ]}
          />
        ))}
      </Animated.View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={[styles.title, isDaily && styles.titleDaily]}>
            {isDaily ? 'Daily Cleared' : 'Perfect!'}
          </Text>
          <Text style={[styles.subtitle, isDaily && styles.subtitleDaily]}>
            {isDaily ? 'Today\'s shared fridge is packed.' : 'Fridge packed flawlessly'}
          </Text>
        </View>

        <Animated.View style={{ transform: [{ translateY: floatY }] }}>
          <View style={[styles.fridgeShell, isDaily && styles.fridgeShellDaily]}>
            <View style={styles.fridgeFreezer}>
              <View style={styles.fridgeCube} />
              <View style={styles.fridgeMini} />
              <View style={styles.fridgeCube} />
            </View>
            <View style={styles.fridgeBody}>
              <View style={styles.fridgeShelf}>
                <View style={styles.fridgeItemMilk} />
                <View style={styles.fridgeItemCheese} />
                <View style={styles.fridgeItemJuice} />
              </View>
              <View style={styles.fridgeShelf}>
                <View style={styles.fridgeItemTray} />
                <View style={styles.fridgeItemJar} />
              </View>
              <View style={styles.fridgeCrisper}>
                <View style={styles.fridgeLeaf} />
                <View style={styles.fridgeTomato} />
              </View>
            </View>
          </View>
        </Animated.View>

        <View style={[styles.scoreCard, isDaily && styles.scoreCardDaily]}>
          <Animated.View
            style={[
              styles.badge,
              isDaily && styles.badgeDaily,
              { transform: [{ scale: pulse }] },
            ]}
          >
            <Text style={styles.badgeText}>
              {isDaily
                ? 'Daily Challenge Complete'
                : level
                  ? `Level ${level.progressionIndex} Complete`
                  : 'Level Complete'}
            </Text>
          </Animated.View>

          <StarRating rating={stars} size="lg" />

          <View style={styles.progressCard}>
            <View style={[styles.progressBox, isDaily && styles.progressBoxDaily]}>
              <Text style={[styles.progressLabel, isDaily && styles.progressLabelDaily]}>
                {isDaily ? 'Today' : 'Next'}
              </Text>
              <Text style={[styles.progressValue, isDaily && styles.progressValueDaily]}>
                {isDaily
                  ? progress?.daily?.completedAt
                    ? 'Done'
                    : 'Open'
                  : progress
                    ? `Level ${progress.currentLevelNumber}`
                    : '--'}
              </Text>
            </View>
            <View style={[styles.progressBox, isDaily && styles.progressBoxDaily]}>
              <Text style={[styles.progressLabel, isDaily && styles.progressLabelDaily]}>Moves</Text>
              <Text style={[styles.progressValue, isDaily && styles.progressValueDaily]}>{moveCount}</Text>
            </View>
            <View style={[styles.progressBox, isDaily && styles.progressBoxDaily]}>
              <Text style={[styles.progressLabel, isDaily && styles.progressLabelDaily]}>
                {isDaily ? 'Best' : 'Stars'}
              </Text>
              <Text style={[styles.progressValue, isDaily && styles.progressValueDaily]}>
                {isDaily
                  ? progress?.daily?.bestScore ?? score?.total ?? '--'
                  : progress
                    ? progress.totalStars
                    : stars}
              </Text>
            </View>
          </View>

          <View style={styles.scoreRow}>
            <View style={[styles.scoreBox, isDaily && styles.scoreBoxDaily]}>
              <Text style={[styles.scoreLabel, isDaily && styles.scoreLabelDaily]}>Score</Text>
              <Text style={[styles.scoreValue, isDaily && styles.scoreValueDaily]}>
                {score ? score.total : '--'}
              </Text>
            </View>
            <View style={[styles.scoreBox, isDaily && styles.scoreBoxDaily]}>
              <Text style={[styles.scoreLabel, isDaily && styles.scoreLabelDaily]}>Time Bonus</Text>
              <Text style={[styles.scoreValue, isDaily ? styles.scoreValueDailyMint : styles.scoreValueMint]}>
                {score ? `+${score.time}` : '--'}
              </Text>
            </View>
          </View>

          <View style={[styles.coinRow, isDaily && styles.coinRowDaily]}>
            <Text style={[styles.coinText, isDaily && styles.coinTextDaily]}>🪙 +{coins} Coins</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={[styles.primaryButton, isDaily && styles.primaryButtonDaily]}
            onPress={() => router.replace(isDaily ? '/(tabs)/home' : '/game/loading')}
          >
            <Text style={[styles.primaryButtonText, isDaily && styles.primaryButtonTextDaily]}>
              {isDaily ? 'Back Home' : 'Next Level'}
            </Text>
          </Pressable>
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.secondaryButton, isDaily && styles.secondaryButtonDaily]}
              onPress={() =>
                router.replace(level ? `/game/loading?levelId=${encodeURIComponent(level.id)}` : '/game/loading')
              }
            >
              <Text style={styles.secondaryButtonText}>{isDaily ? 'Replay Daily' : 'Retry'}</Text>
            </Pressable>
            <Pressable style={[styles.secondaryButton, isDaily && styles.secondaryButtonDaily]}>
              <Text style={styles.secondaryButtonText}>Share</Text>
            </Pressable>
          </View>
          <Pressable style={styles.ghostButton} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.ghostButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

const CONFETTI = [
  { key: 'c1', left: 36, top: 30, color: frigi.mint },
  { key: 'c2', left: 88, top: 18, color: frigi.orange },
  { key: 'c3', left: 132, top: 36, color: '#FFFFFF' },
  { key: 'c4', left: 196, top: 14, color: frigi.mint },
  { key: 'c5', left: 258, top: 30, color: frigi.orange },
  { key: 'c6', left: 312, top: 22, color: '#FDE68A' },
  { key: 'c7', left: 64, top: 74, color: '#FFFFFF' },
  { key: 'c8', left: 168, top: 68, color: frigi.mint },
  { key: 'c9', left: 286, top: 74, color: frigi.orange },
];

const styles = StyleSheet.create({
  screen: {
    backgroundColor: frigi.red,
  },
  screenDaily: {
    backgroundColor: polar.depth,
  },
  glow: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  glowDaily: {
    backgroundColor: polar.emeraldGlow,
  },
  confettiWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
    opacity: 0.9,
  },
  confettiDaily: {
    borderRadius: 999,
  },
  container: {
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 18,
  },
  hero: { alignItems: 'center' },
  title: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '900',
    fontFamily: Platform.select({ ios: 'AvenirNext-Heavy', android: 'sans-serif-condensed' }),
  },
  titleDaily: {
    color: polar.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  subtitleDaily: {
    color: polar.textSecondary,
  },
  fridgeShell: {
    width: 170,
    height: 220,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    borderWidth: 4,
    borderColor: '#D1D5DB',
    padding: 8,
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  fridgeShellDaily: {
    backgroundColor: '#DDEAFE',
    borderColor: '#B3D3F4',
  },
  fridgeFreezer: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  fridgeCube: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#DBEAFE',
  },
  fridgeMini: {
    width: 26,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#E9D5FF',
  },
  fridgeBody: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    gap: 6,
  },
  fridgeShelf: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: '#EEF2F7',
    paddingBottom: 4,
  },
  fridgeItemMilk: { width: 18, height: 28, borderRadius: 6, backgroundColor: '#DBEAFE' },
  fridgeItemCheese: { width: 22, height: 16, borderRadius: 6, backgroundColor: '#FDE68A' },
  fridgeItemJuice: { width: 16, height: 20, borderRadius: 6, backgroundColor: '#FCD34D' },
  fridgeItemTray: { width: 30, height: 18, borderRadius: 6, backgroundColor: '#CCFBF1' },
  fridgeItemJar: { width: 18, height: 18, borderRadius: 6, backgroundColor: '#FBCFE8' },
  fridgeCrisper: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  fridgeLeaf: { flex: 1, height: 18, borderRadius: 8, backgroundColor: '#BBF7D0' },
  fridgeTomato: { flex: 1, height: 18, borderRadius: 8, backgroundColor: '#FCA5A5' },
  scoreCard: {
    width: '100%',
    backgroundColor: frigi.surface,
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    gap: 16,
  },
  scoreCardDaily: {
    backgroundColor: '#0E2440',
    borderWidth: 1,
    borderColor: '#183353',
  },
  progressCard: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  progressBox: {
    flex: 1,
    backgroundColor: '#FFF7F8',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  progressBoxDaily: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: frigi.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  progressLabelDaily: {
    color: polar.textLabel,
  },
  progressValue: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '800',
    color: frigi.text,
  },
  progressValueDaily: {
    color: polar.textPrimary,
  },
  badge: {
    backgroundColor: frigi.orange,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDaily: {
    backgroundColor: 'rgba(16,185,129,0.18)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  scoreBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  scoreBoxDaily: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scoreLabel: {
    fontSize: 10,
    color: frigi.textLight,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  scoreLabelDaily: {
    color: polar.textLabel,
  },
  scoreValue: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '800',
    color: frigi.red,
  },
  scoreValueDaily: {
    color: polar.textPrimary,
  },
  scoreValueMint: {
    color: frigi.mint,
  },
  scoreValueDailyMint: {
    color: polar.emerald,
  },
  coinRow: {
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  coinRowDaily: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  coinText: {
    fontSize: 13,
    fontWeight: '700',
    color: frigi.orange,
  },
  coinTextDaily: {
    color: polar.emerald,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: frigi.surface,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonDaily: {
    backgroundColor: polar.emerald,
  },
  primaryButtonText: {
    color: frigi.red,
    fontSize: 15,
    fontWeight: '800',
  },
  primaryButtonTextDaily: {
    color: '#052E2B',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonDaily: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  ghostButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  ghostButtonText: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
  },
});
