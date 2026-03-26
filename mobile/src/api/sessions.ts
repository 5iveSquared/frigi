import type { GameSession } from '@frigi/shared';
import { apiClient } from './client';

interface BackendGameSession {
  id: string;
  player_id: string;
  level_id: string;
  status: GameSession['status'];
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  move_count: number;
  final_placement: Record<string, unknown> | null;
}

function mapGameSession(data: BackendGameSession): GameSession {
  return {
    id: data.id,
    playerId: data.player_id,
    levelId: data.level_id,
    status: data.status,
    startedAt: data.started_at,
    completedAt: data.completed_at,
    durationMs: data.duration_ms,
    moveCount: data.move_count,
    finalPlacement: data.final_placement,
  };
}

export const sessionsApi = {
  create: async (levelId: string): Promise<GameSession> => {
    const { data } = await apiClient.post<BackendGameSession>('/sessions', { level_id: levelId });
    return mapGameSession(data);
  },

  complete: async (
    id: string,
    payload: {
      finalPlacement: Record<string, unknown>;
      durationMs: number;
      moveCount: number;
    }
  ): Promise<GameSession> => {
    const { data } = await apiClient.patch<BackendGameSession>(`/sessions/${id}/complete`, {
      final_placement: payload.finalPlacement,
      duration_ms: payload.durationMs,
      move_count: payload.moveCount,
    });
    return mapGameSession(data);
  },
};
