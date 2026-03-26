import { apiClient } from './client';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  totalScore: number;
  efficiencyPct: number;
  durationMs: number;
  createdAt: string;
}

interface BackendLeaderboardEntry {
  rank: number;
  player_id: string;
  username: string;
  total_score: number;
  efficiency_pct: number;
  duration_ms: number;
  created_at: string;
}

function mapEntry(data: BackendLeaderboardEntry): LeaderboardEntry {
  return {
    rank: data.rank,
    playerId: data.player_id,
    username: data.username,
    totalScore: data.total_score,
    efficiencyPct: data.efficiency_pct,
    durationMs: data.duration_ms,
    createdAt: data.created_at,
  };
}

export const scoresApi = {
  progression: async (levelNumber: number): Promise<LeaderboardEntry[]> => {
    const { data } = await apiClient.get<BackendLeaderboardEntry[]>(
      `/scores/leaderboard/progression/${levelNumber}`
    );
    return data.map(mapEntry);
  },

  daily: async (): Promise<LeaderboardEntry[]> => {
    const { data } = await apiClient.get<BackendLeaderboardEntry[]>('/scores/leaderboard/daily');
    return data.map(mapEntry);
  },

  level: async (levelId: string): Promise<LeaderboardEntry[]> => {
    const { data } = await apiClient.get<BackendLeaderboardEntry[]>(`/scores/leaderboard/${levelId}`);
    return data.map(mapEntry);
  },
};
