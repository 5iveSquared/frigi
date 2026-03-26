export interface ScoreBreakdown {
  efficiencyScore: number;
  timeScore: number;
  constraintScore: number;
  moveScore: number;
}

export interface Score extends ScoreBreakdown {
  id: string;
  sessionId: string;
  playerId: string;
  levelId: string;
  totalScore: number;
  efficiencyPct: number;   // 0.0–1.0
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  totalScore: number;
  efficiencyPct: number;
  durationMs: number;
  createdAt: string;
}
