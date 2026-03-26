export type SessionStatus = 'pending' | 'active' | 'completed' | 'abandoned';

export interface GameSession {
  id: string;
  playerId: string;
  levelId: string;
  status: SessionStatus;
  startedAt: string;       // ISO 8601
  completedAt: string | null;
  durationMs: number | null;
  moveCount: number;
  finalPlacement: Record<string, unknown> | null;
}
