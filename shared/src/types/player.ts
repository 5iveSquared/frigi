export interface PlayerStats {
  totalGames: number;
  averageScore: number;
  bestScore: number;
  averageEfficiencyPct: number;
  currentStreak: number;
  longestStreak: number;
}

export interface Player {
  id: string;
  username: string;
  email: string;
  eloRating: number;       // default 1000
  stats: PlayerStats;
  createdAt: string;
}
