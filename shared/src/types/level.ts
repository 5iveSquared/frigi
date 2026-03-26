import type { Grid } from './grid';
import type { Item } from './item';

export type LevelTheme =
  | 'kitchen'
  | 'camping'
  | 'grocery'
  | 'holiday'
  | 'meal_prep';

export interface Constraint {
  id: string;
  description: string;
  points: number;
  type: 'zone' | 'adjacency' | 'count' | 'exclusion';
  params: Record<string, unknown>;
}

export interface Level {
  id: string;
  grid: Grid;
  items: Item[];
  constraints: Constraint[];
  theme: LevelTheme;
  difficulty: number;       // 0.0–1.0
  progressionIndex: number;
  optimalScore: number;     // server-computed
  isDaily: boolean;
  dailyDate: string | null;
}
