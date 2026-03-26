import type { Grid, Item, PlacedItem } from '@frigi/shared';
import { rotateShape } from './rotation';
import { checkPlacement } from './placement';
import { placeItem } from './grid';
import { getOccupiedCells } from './rotation';

export interface SolverHint {
  itemId: string;
  anchorRow: number;
  anchorCol: number;
  rotation: 0 | 90 | 180 | 270;
}

const ROTATIONS = [0, 90, 180, 270] as const;

export function findHint(
  grid: Grid,
  unplacedItems: Item[]
): SolverHint | null {
  if (unplacedItems.length === 0) return null;

  for (const item of unplacedItems) {
    for (const rotation of ROTATIONS) {
      const rotatedShape = rotateShape(item.shape, rotation);
      const placedItem: PlacedItem = {
        ...item,
        anchorRow: 0,
        anchorCol: 0,
        rotation,
        rotatedShape,
      };

      for (let r = 0; r < grid.rows; r++) {
        for (let c = 0; c < grid.cols; c++) {
          const result = checkPlacement(grid, placedItem, r, c);
          if (result.valid) {
            return { itemId: item.id, anchorRow: r, anchorCol: c, rotation };
          }
        }
      }
    }
  }

  return null;
}

function countItemCells(item: Item): number {
  let total = 0;
  for (const row of item.shape) {
    for (const cell of row) {
      total += cell;
    }
  }
  return total;
}

type Candidate = {
  item: Item;
  rotation: 0 | 90 | 180 | 270;
  anchorRow: number;
  anchorCol: number;
  rotatedShape: ReturnType<typeof rotateShape>;
};

function getCandidates(
  grid: Grid,
  item: Item,
  rotations: ReadonlyArray<0 | 90 | 180 | 270>
): Candidate[] {
  const candidates: Candidate[] = [];
  for (const rotation of rotations) {
    const rotatedShape = rotateShape(item.shape, rotation);
    const placedItem: PlacedItem = {
      ...item,
      anchorRow: 0,
      anchorCol: 0,
      rotation,
      rotatedShape,
    };

    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const result = checkPlacement(grid, placedItem, r, c);
        if (result.valid) {
          candidates.push({ item, rotation, anchorRow: r, anchorCol: c, rotatedShape });
        }
      }
    }
  }
  return candidates;
}

export function solveLevel(
  grid: Grid,
  items: Item[],
  rotations: ReadonlyArray<0 | 90 | 180 | 270> = ROTATIONS
): PlacedItem[] | null {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => countItemCells(b) - countItemCells(a));

  const backtrack = (currentGrid: Grid, remaining: Item[], placed: PlacedItem[]): PlacedItem[] | null => {
    if (remaining.length === 0) return placed;

    let bestIndex = -1;
    let bestCandidates: Candidate[] | null = null;

    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];
      const candidates = getCandidates(currentGrid, item, rotations);
      if (candidates.length === 0) return null;
      if (!bestCandidates || candidates.length < bestCandidates.length) {
        bestCandidates = candidates;
        bestIndex = i;
        if (candidates.length === 1) break;
      }
    }

    if (!bestCandidates || bestIndex === -1) return null;

    const nextRemaining = remaining.filter((_, i) => i !== bestIndex);

    for (const candidate of bestCandidates) {
      const placedItem: PlacedItem = {
        ...candidate.item,
        anchorRow: candidate.anchorRow,
        anchorCol: candidate.anchorCol,
        rotation: candidate.rotation,
        rotatedShape: candidate.rotatedShape,
      };
      const occupiedCells = getOccupiedCells(
        candidate.rotatedShape,
        candidate.anchorRow,
        candidate.anchorCol
      );
      const nextGrid = placeItem(currentGrid, candidate.item.id, occupiedCells);
      const result = backtrack(nextGrid, nextRemaining, [...placed, placedItem]);
      if (result) return result;
    }

    return null;
  };

  return backtrack(grid, sorted, []);
}
