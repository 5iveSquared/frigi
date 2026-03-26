import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useGameStore } from '~/store/gameStore';
import { useSessionStore } from '~/store/sessionStore';
import { frigi, polar } from '~/utils/colors';

function useElapsedTime() {
  const [elapsed, setElapsed] = useState(0);
  const startTime = useSessionStore((s) => s.startTime);

  useEffect(() => {
    const id = setInterval(() => {
      if (startTime) {
        setElapsed(Math.floor((Date.now() - startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return elapsed;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTheme(theme?: string | null) {
  if (!theme) return 'Custom';
  return theme
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDifficulty(difficulty?: number | null) {
  if (difficulty == null) return 'Standard';
  if (difficulty < 0.35) return 'Easy';
  if (difficulty < 0.65) return 'Medium';
  if (difficulty < 0.85) return 'Hard';
  return 'Expert';
}

export function ScoreHUD() {
  const moveCount  = useGameStore((s) => s.moveCount);
  const grid       = useGameStore((s) => s.grid);
  const level      = useGameStore((s) => s.level);
  const elapsed    = useElapsedTime();

  const fillPct = grid
    ? Math.round(
        (grid.cells.flat().filter((c) => c.occupied).length /
          (grid.rows * grid.cols)) *
          100
      )
    : 0;

  const fillBarWidth = `${fillPct}%` as const;

  return (
    <View style={[styles.hud, level?.isDaily && styles.hudDaily]}>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, level?.isDaily && styles.statLabelDaily]}>Time</Text>
          <Text style={[styles.statValue, level?.isDaily && styles.statValueDaily]}>{formatTime(elapsed)}</Text>
        </View>

        <View style={styles.statCenter}>
          <Text style={[styles.levelLabel, level?.isDaily && styles.statLabelDaily]}>Packed</Text>
          <Text style={[styles.fillPct, level?.isDaily && styles.fillPctDaily]}>
            {fillPct}
            <Text style={[styles.fillPctUnit, level?.isDaily && styles.fillPctUnitDaily]}>%</Text>
          </Text>
        </View>

        <View style={[styles.stat, styles.statRight]}>
          <Text style={[styles.statLabel, level?.isDaily && styles.statLabelDaily]}>Moves</Text>
          <Text style={[styles.statValue, level?.isDaily && styles.statValueDaily]}>{moveCount}</Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.metaPill, level?.isDaily && styles.metaPillDailyDark]}>
          <Text style={[styles.metaPillText, level?.isDaily && styles.metaPillTextDaily]}>
            {formatTheme(level?.theme)}
          </Text>
        </View>
        <View style={[styles.metaPill, level?.isDaily && styles.metaPillDailyDark]}>
          <Text style={[styles.metaPillText, level?.isDaily && styles.metaPillTextDaily]}>
            {formatDifficulty(level?.difficulty)}
          </Text>
        </View>
        {level?.isDaily ? (
          <View style={[styles.metaPill, styles.metaPillDaily, styles.metaPillDailyDark]}>
            <Text style={[styles.metaPillText, styles.metaPillDailyText]}>Daily</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.barTrack, level?.isDaily && styles.barTrackDaily]}>
        <View style={[styles.barFill, level?.isDaily && styles.barFillDaily, { width: fillBarWidth }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    backgroundColor: frigi.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: frigi.border,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    gap: 8,
  },
  hudDaily: {
    backgroundColor: polar.hudBg,
    borderBottomColor: polar.hudBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'flex-start',
    flex: 1,
  },
  statRight: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  statCenter: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: frigi.textLight,
    fontWeight: '700',
  },
  statLabelDaily: {
    color: polar.textLabel,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: frigi.text,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  statValueDaily: {
    color: polar.textPrimary,
  },
  levelLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    color: frigi.textLight,
    fontWeight: '700',
  },
  fillPct: {
    fontSize: 24,
    fontWeight: '900',
    color: frigi.red,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  fillPctDaily: {
    color: polar.emerald,
  },
  fillPctUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: frigi.textMuted,
  },
  fillPctUnitDaily: {
    color: polar.textSecondary,
  },
  barTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barTrackDaily: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  barFill: {
    height: '100%',
    backgroundColor: frigi.red,
    borderRadius: 999,
  },
  barFillDaily: {
    backgroundColor: polar.emerald,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  metaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: frigi.border,
  },
  metaPillDailyDark: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(148,194,232,0.16)',
  },
  metaPillDaily: {
    backgroundColor: 'rgba(255,77,106,0.08)',
    borderColor: 'rgba(255,77,106,0.25)',
  },
  metaPillText: {
    fontSize: 10,
    color: frigi.textLight,
    letterSpacing: 0.4,
    fontWeight: '700',
  },
  metaPillTextDaily: {
    color: polar.textPrimary,
  },
  metaPillDailyText: {
    color: polar.emerald,
  },
});
