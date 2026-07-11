import type { Grid, PlacedItem, Constraint } from '@frigi/shared';
import { SCORE_WEIGHTS } from '@frigi/shared';
import { evaluateConstraints, satisfiedPoints, type ConstraintResult } from './constraints';

export interface ScoreResult {
  total: number;
  packing: number;
  time: number;
  constraint: number;
  moves: number;
  packedPoints: number;
  packedCount: number;
  efficiencyPct: number;
  constraintResults: ConstraintResult[];
}

// Mirrors backend/app/services/scoring_service.py: the score is driven by
// which items you chose to pack and which goals you satisfied — not by a
// fill ratio that is fixed at generation time.
export function calculateScore(params: {
  grid: Grid;
  placedItems: PlacedItem[];
  constraints: Constraint[];
  elapsedSeconds: number;
  moveCount: number;
}): ScoreResult {
  const { grid, placedItems, constraints, elapsedSeconds, moveCount } = params;

  const packedPoints = placedItems.reduce((sum, item) => sum + item.points, 0);
  const packing = packedPoints * SCORE_WEIGHTS.PACKING_MULTIPLIER;

  const constraintResults = evaluateConstraints(grid, placedItems, constraints);
  const constraint = satisfiedPoints(constraintResults);

  const time = Math.floor(
    SCORE_WEIGHTS.TIME_BASE * Math.exp(-SCORE_WEIGHTS.TIME_DECAY * elapsedSeconds)
  );
  const moves = Math.max(0, SCORE_WEIGHTS.MOVE_BASE - moveCount * SCORE_WEIGHTS.MOVE_PENALTY);

  const packedCells = placedItems.reduce(
    (sum, item) => sum + item.rotatedShape.flat().reduce((a: number, b: number) => a + b, 0),
    0
  );
  const packableCells = grid.cells.flat().filter((cell) => !cell.blocked).length;
  const efficiencyPct = packableCells > 0 ? packedCells / packableCells : 0;

  return {
    total: packing + constraint + time + moves,
    packing,
    time,
    constraint,
    moves,
    packedPoints,
    packedCount: placedItems.length,
    efficiencyPct,
    constraintResults,
  };
}
