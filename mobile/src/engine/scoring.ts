import type { Grid, PlacedItem, Constraint } from '@frigi/shared';
import { SCORE_WEIGHTS } from '@frigi/shared';
import { countOccupied } from './grid';

export interface ScoreResult {
  total: number;
  efficiency: number;
  time: number;
  constraint: number;
  moves: number;
  efficiencyPct: number;
}

export function calculateScore(params: {
  grid: Grid;
  placedItems: PlacedItem[];
  constraints: Constraint[];
  elapsedSeconds: number;
  moveCount: number;
}): ScoreResult {
  const { grid, constraints, elapsedSeconds, moveCount } = params;

  const gridArea = grid.rows * grid.cols;
  const occupied = countOccupied(grid);
  const fillRatio = occupied / gridArea;
  const efficiencyPct = fillRatio;

  const efficiency = Math.floor(fillRatio * gridArea * SCORE_WEIGHTS.EFFICIENCY_MULTIPLIER);
  const time = Math.floor(
    SCORE_WEIGHTS.TIME_BASE * Math.exp(-SCORE_WEIGHTS.TIME_DECAY * elapsedSeconds)
  );
  const constraint = constraints.reduce((sum, c) => sum + c.points, 0);
  const moves = Math.max(0, SCORE_WEIGHTS.MOVE_BASE - moveCount * SCORE_WEIGHTS.MOVE_PENALTY);

  return {
    total: efficiency + time + constraint + moves,
    efficiency,
    time,
    constraint,
    moves,
    efficiencyPct,
  };
}
