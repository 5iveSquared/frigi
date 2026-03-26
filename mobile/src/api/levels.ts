import type { Level } from '@frigi/shared';
import { apiClient } from './client';

interface BackendLevel extends Omit<Level, 'optimalScore' | 'isDaily' | 'dailyDate' | 'progressionIndex'> {
  progression_index: number;
  optimal_score: number;
  is_daily: boolean;
  daily_date: string | null;
}

function mapLevel(data: BackendLevel): Level {
  return {
    id: data.id,
    grid: data.grid,
    items: data.items,
    constraints: data.constraints,
    theme: data.theme,
    difficulty: data.difficulty,
    progressionIndex: data.progression_index,
    optimalScore: data.optimal_score,
    isDaily: data.is_daily,
    dailyDate: data.daily_date,
  };
}

export const levelsApi = {
  generate: async (params: { difficulty: number }): Promise<Level> => {
    const { data } = await apiClient.post<BackendLevel>('/levels/generate', params);
    return mapLevel(data);
  },

  get: async (id: string): Promise<Level> => {
    const { data } = await apiClient.get<BackendLevel>(`/levels/${id}`);
    return mapLevel(data);
  },

  getDaily: async (): Promise<Level> => {
    const { data } = await apiClient.get<BackendLevel>('/levels/daily');
    return mapLevel(data);
  },
};
