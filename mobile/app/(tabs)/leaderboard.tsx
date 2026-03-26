import { View, Text, StyleSheet, Platform, Pressable, ScrollView } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { SafeScreen } from '~/components/layout/SafeScreen';
import { ensureAuthenticatedPlayer } from '~/api/auth';
import { playersApi, type PlayerProgressSummary } from '~/api/players';
import { scoresApi, type LeaderboardEntry } from '~/api/scores';
import { FrigiLoader } from '~/components/ui/FrigiLoader';
import { frigi } from '~/utils/colors';
import { formatScore, formatElapsedTime } from '~/utils/format';

interface CampaignSection {
  levelNumber: number;
  entries: LeaderboardEntry[];
}

export default function LeaderboardScreen() {
  const [activeTab, setActiveTab] = useState<'daily' | 'progression'>('daily');
  const [progress, setProgress] = useState<PlayerProgressSummary | null>(null);
  const [dailyEntries, setDailyEntries] = useState<LeaderboardEntry[]>([]);
  const [campaignSections, setCampaignSections] = useState<CampaignSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const campaignLevels = useMemo(() => {
    const base =
      progress?.levels
        ?.filter((level) => level.attempts > 0 || level.completions > 0)
        .map((level) => level.levelNumber) ?? [];
    const current = progress?.currentLevelNumber ?? 1;
    const merged = new Set<number>([...base, current]);
    return Array.from(merged).sort((a, b) => a - b);
  }, [progress]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        await ensureAuthenticatedPlayer();
        const summary = await playersApi.progress();

        if (activeTab === 'daily') {
          const rows = await scoresApi.daily();
          if (!cancelled) {
            setProgress(summary);
            setDailyEntries(rows);
            setCampaignSections([]);
          }
          return;
        }

        const base =
          summary.levels
            ?.filter((level) => level.attempts > 0 || level.completions > 0)
            .map((level) => level.levelNumber) ?? [];
        const current = summary.currentLevelNumber ?? 1;
        const levelsToLoad = Array.from(new Set<number>([...base, current])).sort((a, b) => a - b);
        const sectionRows = await Promise.all(
          levelsToLoad.map(async (levelNumber) => ({
            levelNumber,
            entries: await scoresApi.progression(levelNumber),
          }))
        );

        if (!cancelled) {
          setProgress(summary);
          setDailyEntries([]);
          setCampaignSections(sectionRows);
        }
      } catch (error) {
        console.warn('Failed to load leaderboard', error);
        if (!cancelled) {
          setDailyEntries([]);
          setCampaignSections([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  return (
    <SafeScreen>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'daily' ? "Today's shared fridge" : 'Best runs for each campaign level'}
        </Text>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          style={[styles.tabButton, activeTab === 'daily' && styles.tabButtonActive]}
          onPress={() => setActiveTab('daily')}
        >
          <Text style={[styles.tabText, activeTab === 'daily' && styles.tabTextActive]}>
            Daily
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabButton, activeTab === 'progression' && styles.tabButtonActive]}
          onPress={() => setActiveTab('progression')}
        >
          <Text style={[styles.tabText, activeTab === 'progression' && styles.tabTextActive]}>
            Campaign
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.emptyCard}>
            <FrigiLoader size={78} />
            <Text style={styles.emptyTitle}>Loading leaderboard...</Text>
          </View>
        ) : activeTab === 'daily' ? (
          dailyEntries.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No scores yet</Text>
              <Text style={styles.emptyBody}>
                Finish a run to seed the leaderboard for this board.
              </Text>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Daily Challenge</Text>
              {dailyEntries.map((row) => (
                <LeaderboardRow key={`${row.playerId}-${row.rank}`} row={row} />
              ))}
            </View>
          )
        ) : campaignLevels.length === 0 || campaignSections.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No campaign history yet</Text>
            <Text style={styles.emptyBody}>Complete campaign levels to build the leaderboard.</Text>
          </View>
        ) : (
          campaignSections.map((section) => (
            <View key={section.levelNumber} style={styles.section}>
              <Text style={styles.sectionTitle}>{`Level ${section.levelNumber}`}</Text>
              {section.entries.length === 0 ? (
                <View style={styles.sectionEmpty}>
                  <Text style={styles.sectionEmptyText}>No scores yet for this level.</Text>
                </View>
              ) : (
                section.entries.map((row) => (
                  <LeaderboardRow key={`${section.levelNumber}-${row.playerId}-${row.rank}`} row={row} />
                ))
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeScreen>
  );
}

function LeaderboardRow({ row }: { row: LeaderboardEntry }) {
  return (
    <View style={styles.row}>
      <View style={styles.rankBubble}>
        <Text style={styles.rankText}>{row.rank}</Text>
      </View>
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{row.username}</Text>
      </View>
      <View style={styles.metricColumn}>
        <Text style={styles.metricLabel}>Score</Text>
        <Text style={styles.metricValue}>{formatScore(row.totalScore)}</Text>
      </View>
      <View style={styles.metricColumn}>
        <Text style={styles.metricLabel}>Time</Text>
        <Text style={styles.metricValue}>{formatElapsedTime(Math.floor(row.durationMs / 1000))}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: frigi.text,
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
  },
  subtitle: { fontSize: 12, color: frigi.textLight, marginTop: 4 },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginTop: 12,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: frigi.surface,
    borderWidth: 1,
    borderColor: frigi.border,
  },
  tabButtonActive: {
    backgroundColor: '#FFF1F4',
    borderColor: '#FBC7D2',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: frigi.textMuted,
  },
  tabTextActive: {
    color: frigi.red,
  },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28, gap: 16 },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: frigi.text,
    fontFamily: Platform.select({ ios: 'AvenirNext-DemiBold', android: 'sans-serif-medium' }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: frigi.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: frigi.border,
    gap: 10,
  },
  rankBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF1F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { color: frigi.red, fontWeight: '700' },
  rowInfo: { flex: 1, minWidth: 0 },
  rowName: { fontSize: 14, fontWeight: '700', color: frigi.text },
  metricColumn: {
    minWidth: 72,
    alignItems: 'flex-end',
  },
  metricLabel: {
    fontSize: 10,
    color: frigi.textLight,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  metricValue: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '800',
    color: frigi.text,
    fontVariant: ['tabular-nums'],
  },
  emptyCard: {
    backgroundColor: frigi.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: frigi.border,
    padding: 18,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: frigi.text,
  },
  emptyBody: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    color: frigi.textMuted,
  },
  sectionEmpty: {
    backgroundColor: frigi.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: frigi.border,
    padding: 14,
  },
  sectionEmptyText: {
    fontSize: 13,
    color: frigi.textMuted,
  },
});
