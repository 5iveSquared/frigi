import { View, Text, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import { useGameStore } from '~/store/gameStore';
import { useSessionStore } from '~/store/sessionStore';
import { frigi } from '~/utils/colors';
import { getLevelEnvironment } from './levelEnvironment';

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

function formatRunLabel(level?: { isDaily?: boolean; progressionIndex?: number } | null) {
  if (level?.isDaily) return 'Daily';
  if (level?.progressionIndex != null) return `Level ${level.progressionIndex}`;
  return 'Level';
}

export function ScoreHUD() {
  const moveCount  = useGameStore((s) => s.moveCount);
  const level      = useGameStore((s) => s.level);
  const elapsed    = useElapsedTime();
  const environment = getLevelEnvironment(level);

  return (
    <View
      style={[
        styles.hud,
        {
          backgroundColor: environment.surface,
          borderBottomColor: environment.border,
          shadowColor: environment.shadow,
        },
      ]}
    >
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={[styles.statLabel, { color: environment.textMuted }]}>Time</Text>
          <Text style={[styles.statValue, { color: environment.text }]}>{formatTime(elapsed)}</Text>
        </View>

        <View style={styles.statCenter}>
          <Text style={[styles.levelValue, { color: environment.accent }]}>
            {formatRunLabel(level)}
          </Text>
        </View>

        <View style={[styles.stat, styles.statRight]}>
          <Text style={[styles.statLabel, { color: environment.textMuted }]}>Moves</Text>
          <Text style={[styles.statValue, { color: environment.text }]}>{moveCount}</Text>
        </View>
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
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
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
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: frigi.text,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  levelValue: {
    fontSize: 16,
    fontWeight: '800',
    color: frigi.red,
    letterSpacing: 0.2,
  },
});
