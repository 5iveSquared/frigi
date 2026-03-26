import { apiClient } from './client';

export interface PlayerProfile {
  id: string;
  username: string;
  email: string;
  eloRating: number;
  totalGames: number;
}

export interface PlayerLevelProgress {
  levelNumber: number;
  attempts: number;
  completions: number;
  bestScore: number | null;
  bestDurationMs: number | null;
  bestEfficiencyPct: number | null;
  stars: number;
  firstCompletedAt: string | null;
  lastCompletedAt: string | null;
}

export interface PlayerProgressSummary {
  completedLevels: number;
  currentLevelNumber: number;
  totalStars: number;
  levels: PlayerLevelProgress[];
  daily: DailyProgress | null;
}

export interface DailyProgress {
  levelId: string | null;
  dailyDate: string | null;
  hasAttempt: boolean;
  isCompleted: boolean;
  attempts: number;
  bestScore: number | null;
  completedAt: string | null;
}

interface BackendPlayerProfile {
  id: string;
  username: string;
  email: string;
  elo_rating: number;
  total_games: number;
}

interface BackendPlayerLevelProgress {
  level_number: number;
  attempts: number;
  completions: number;
  best_score: number | null;
  best_duration_ms: number | null;
  best_efficiency_pct: number | null;
  stars: number;
  first_completed_at: string | null;
  last_completed_at: string | null;
}

interface BackendPlayerProgressSummary {
  completed_levels: number;
  current_level_number: number;
  total_stars: number;
  levels: BackendPlayerLevelProgress[];
  daily: BackendDailyProgress | null;
}

interface BackendDailyProgress {
  level_id: string | null;
  daily_date: string | null;
  has_attempt: boolean;
  is_completed: boolean;
  attempts: number;
  best_score: number | null;
  completed_at: string | null;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
}

function mapPlayer(data: BackendPlayerProfile): PlayerProfile {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    eloRating: data.elo_rating,
    totalGames: data.total_games,
  };
}

function mapProgressRow(data: BackendPlayerLevelProgress): PlayerLevelProgress {
  return {
    levelNumber: data.level_number,
    attempts: data.attempts,
    completions: data.completions,
    bestScore: data.best_score,
    bestDurationMs: data.best_duration_ms,
    bestEfficiencyPct: data.best_efficiency_pct,
    stars: data.stars,
    firstCompletedAt: data.first_completed_at,
    lastCompletedAt: data.last_completed_at,
  };
}

function mapProgressSummary(data: BackendPlayerProgressSummary): PlayerProgressSummary {
  return {
    completedLevels: data.completed_levels,
    currentLevelNumber: data.current_level_number,
    totalStars: data.total_stars,
    levels: data.levels.map(mapProgressRow),
    daily: data.daily
      ? {
          levelId: data.daily.level_id,
          dailyDate: data.daily.daily_date,
          hasAttempt: data.daily.has_attempt,
          isCompleted: data.daily.is_completed,
          attempts: data.daily.attempts,
          bestScore: data.daily.best_score,
          completedAt: data.daily.completed_at,
        }
      : null,
  };
}

export const playersApi = {
  me: async (): Promise<PlayerProfile> => {
    const { data } = await apiClient.get<BackendPlayerProfile>('/players/me');
    return mapPlayer(data);
  },

  progress: async (): Promise<PlayerProgressSummary> => {
    const { data } = await apiClient.get<BackendPlayerProgressSummary>('/players/me/progress');
    return mapProgressSummary(data);
  },

  register: async (username: string, email: string, password: string): Promise<PlayerProfile> => {
    const { data } = await apiClient.post<BackendPlayerProfile>('/players/register', {
      username,
      email,
      password,
    });
    return mapPlayer(data);
  },

  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await apiClient.post<LoginResponse>('/players/login', { email, password });
    return data;
  },
};
