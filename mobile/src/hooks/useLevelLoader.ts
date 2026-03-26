import { useState, useEffect } from 'react';
import { useGameStore } from '~/store/gameStore';
import { useSessionStore } from '~/store/sessionStore';
import { ensureAuthenticatedPlayer } from '~/api/auth';
import { levelsApi } from '~/api/levels';
import { sessionsApi } from '~/api/sessions';
import type { Level } from '@frigi/shared';

const DEMO_LEVEL: Level = {
  id: 'demo-level-01',
  difficulty: 0.3,
  progressionIndex: 1,
  theme: 'kitchen',
  optimalScore: 1400,
  isDaily: false,
  dailyDate: null,
  constraints: [],
  grid: {
    rows: 5,
    cols: 4,
    cells: Array.from({ length: 5 }, (_, r) =>
      Array.from({ length: 4 }, (_, c) => ({
        row: r,
        col: c,
        zone: (
          r === 0        ? 'shelf'  :
          r >= 4         ? 'frozen' :
          c >= 1         ? 'cold'   :
          'standard'
        ) as 'standard' | 'cold' | 'frozen' | 'shelf',
        occupied: false,
        itemId: null,
      }))
    ),
  },
  items: [
    {
      id: 'milk',
      name: 'Milk',
      shape: [[1], [1], [1]],
      zoneRequirement: 'cold',
      points: 30,
      color: '#FAFAFA',
    },
    {
      id: 'cheese',
      name: 'Cheese',
      shape: [[1, 1], [1, 0]],
      zoneRequirement: null,
      points: 20,
      color: '#F59E0B',
    },
    {
      id: 'broccoli',
      name: 'Broccoli',
      shape: [[0, 1], [1, 1]],
      zoneRequirement: null,
      points: 25,
      color: '#16A34A',
    },
    {
      id: 'butter',
      name: 'Butter',
      shape: [[1, 1]],
      zoneRequirement: 'shelf',
      points: 15,
      color: '#FCD34D',
    },
    {
      id: 'yogurt',
      name: 'Yogurt',
      shape: [[1, 1], [1, 1]],
      zoneRequirement: 'cold',
      points: 20,
      color: '#BAE6FD',
    },
    {
      id: 'carrot',
      name: 'Carrot',
      shape: [[1], [1]],
      zoneRequirement: null,
      points: 10,
      color: '#F97316',
    },
  ],
};

export function useLevelLoader(options?: { mode?: string | null; existingLevelId?: string | null }) {
  const [levelId, setLevelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadLevel  = useGameStore((s) => s.loadLevel);
  const startSession = useSessionStore((s) => s.startSession);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let level = DEMO_LEVEL;
      let sessionId: string | null = null;
      let playerId: string | null = null;

      try {
        try {
          const player = await ensureAuthenticatedPlayer();
          playerId = player.id;
          console.info('[frigi][level] player:ready', {
            playerId: player.id,
            username: player.username,
            mode: options?.mode ?? 'campaign',
            existingLevelId: options?.existingLevelId ?? null,
          });

          if (options?.existingLevelId) {
            level = await levelsApi.get(options.existingLevelId);
          } else if (options?.mode === 'daily') {
            level = await levelsApi.getDaily();
          } else {
            level = await levelsApi.generate({ difficulty: 0.3 });
          }
          const session = await sessionsApi.create(level.id);
          sessionId = session.id;
          playerId = session.playerId;
          console.info('[frigi][level] backend:loaded', {
            playerId: session.playerId,
            sessionId: session.id,
            levelId: level.id,
            progressionIndex: level.progressionIndex,
            isDaily: level.isDaily,
            theme: level.theme,
            difficulty: level.difficulty,
          });
        } catch (cause) {
          console.warn('Failed to load backend level or start backend session', cause);
          setError(cause instanceof Error ? cause : new Error('Level load failed'));
          console.warn('[frigi][level] fallback:demo', {
            playerId,
            levelId: level.id,
            reason: cause instanceof Error ? cause.message : 'unknown',
          });
          // API unavailable — use demo level so gameplay is fully testable
        }
      } finally {
        if (!cancelled) {
          loadLevel(level);
          console.info('[frigi][level] store:loaded', {
            playerId,
            sessionId,
            levelId: level.id,
            progressionIndex: level.progressionIndex,
            isDaily: level.isDaily,
          });
          setLevelId(level.id);
          startSession(sessionId, playerId);
          setIsLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [options?.existingLevelId, options?.mode]);

  return { levelId, isLoading, error };
}
