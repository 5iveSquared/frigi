import { useCallback } from 'react';
import { useGameStore } from '~/store/gameStore';
import { useSessionStore } from '~/store/sessionStore';
import { sessionsApi } from '~/api/sessions';

export function useScoreSubmit() {
  const completeGame = useGameStore((s) => s.completeGame);
  const grid = useGameStore((s) => s.grid);
  const placedItems = useGameStore((s) => s.placedItems);
  const moveCount = useGameStore((s) => s.moveCount);
  const { sessionId, getElapsedSeconds, endSession } = useSessionStore();

  const submit = useCallback(async () => {
    const elapsedSeconds = getElapsedSeconds();
    const payloadSummary = {
      sessionId,
      gridArea: grid ? grid.rows * grid.cols : null,
      placedItems: placedItems.length,
      moveCount,
      elapsedSeconds,
    };
    console.info('[frigi][complete] submit:start', payloadSummary);
    completeGame(elapsedSeconds);

    try {
      if (!sessionId || !grid) {
        console.warn('[frigi][complete] submit:skipped', {
          reason: !sessionId ? 'missing_session_id' : 'missing_grid',
          ...payloadSummary,
        });
        return;
      }

      const session = await sessionsApi.complete(sessionId, {
        finalPlacement: {
          placedItems,
          gridArea: grid.rows * grid.cols,
        },
        durationMs: elapsedSeconds * 1000,
        moveCount,
      });
      console.info('[frigi][complete] submit:success', {
        sessionId: session.id,
        levelId: session.levelId,
        status: session.status,
        durationMs: session.durationMs,
        moveCount: session.moveCount,
        placedItems: placedItems.length,
      });
    } catch (error) {
      console.warn('Failed to submit session', error);
    } finally {
      console.info('[frigi][complete] submit:end', { sessionId });
      endSession();
    }
  }, [sessionId, grid, placedItems, moveCount, getElapsedSeconds, completeGame, endSession]);

  return { submit };
}
