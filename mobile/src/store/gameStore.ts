import { create } from 'zustand';
import type { Grid, Item, PlacedItem, Level } from '@frigi/shared';
import type { ScoreResult } from '~/engine/scoring';
import { placeItem, removeItem } from '~/engine/grid';
import { rotateShape, getOccupiedCells } from '~/engine/rotation';
import { checkPlacement } from '~/engine/placement';
import { calculateScore } from '~/engine/scoring';
import { solveLevel } from '~/engine/solver';

interface GameState {
  level: Level | null;
  grid: Grid | null;
  unplacedItems: Item[];
  placedItems: PlacedItem[];
  activeItem: Item | null;
  activeRotation: 0 | 90 | 180 | 270;
  moveCount: number;
  score: ScoreResult | null;
  isComplete: boolean;

  loadLevel: (level: Level) => void;
  setActiveItem: (item: Item | null) => void;
  setActiveRotation: (rotation: 0 | 90 | 180 | 270) => void;
  rotateActive: () => void;
  placeActiveItem: (anchorRow: number, anchorCol: number, rotation: 0 | 90 | 180 | 270) => boolean;
  removePlacedItem: (itemId: string) => void;
  completeGame: (elapsedSeconds: number) => void;
  showSolution: () => boolean;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  level: null,
  grid: null,
  unplacedItems: [],
  placedItems: [],
  activeItem: null,
  activeRotation: 0,
  moveCount: 0,
  score: null,
  isComplete: false,

  loadLevel: (level) => {
    set({
      level,
      grid: level.grid,
      unplacedItems: [...level.items],
      placedItems: [],
      activeItem: null,
      activeRotation: 0,
      moveCount: 0,
      score: null,
      isComplete: false,
    });
  },

  setActiveItem: (item) => set({ activeItem: item, activeRotation: 0 }),

  setActiveRotation: (rotation) => set({ activeRotation: rotation }),

  rotateActive: () => {
    const current = get().activeRotation;
    const next = ((current + 90) % 360) as 0 | 90 | 180 | 270;
    set({ activeRotation: next });
  },

  placeActiveItem: (anchorRow, anchorCol, rotation) => {
    const { activeItem, grid, unplacedItems, placedItems } = get();
    if (!activeItem || !grid) return false;

    const rotatedShape = rotateShape(activeItem.shape, rotation);
    const placedItem: PlacedItem = { ...activeItem, anchorRow, anchorCol, rotation, rotatedShape };
    const result = checkPlacement(grid, placedItem, anchorRow, anchorCol);

    if (!result.valid) return false;

    const cells = getOccupiedCells(rotatedShape, anchorRow, anchorCol);
    const nextGrid = placeItem(grid, activeItem.id, cells);

    set({
      grid: nextGrid,
      placedItems: [...placedItems, placedItem],
      unplacedItems: unplacedItems.filter((i) => i.id !== activeItem.id),
      activeItem: null,
      activeRotation: 0,
      moveCount: get().moveCount + 1,
    });
    return true;
  },

  removePlacedItem: (itemId) => {
    const { grid, placedItems } = get();
    if (!grid) return;
    const item = placedItems.find((i) => i.id === itemId);
    if (!item) return;

    set({
      grid: removeItem(grid, itemId),
      placedItems: placedItems.filter((i) => i.id !== itemId),
      unplacedItems: [...get().unplacedItems, item],
      moveCount: get().moveCount + 1,
    });
  },

  completeGame: (elapsedSeconds) => {
    const { grid, placedItems, level } = get();
    if (!grid || !level) return;

    const score = calculateScore({
      grid,
      placedItems,
      constraints: level.constraints,
      elapsedSeconds,
      moveCount: get().moveCount,
    });
    set({ score, isComplete: true });
  },

  showSolution: () => {
    const { level } = get();
    if (!level) return false;

    const baseGrid: Grid = {
      rows: level.grid.rows,
      cols: level.grid.cols,
      cells: level.grid.cells.map((row) =>
        row.map((cell) => ({
          ...cell,
          occupied: false,
          itemId: null,
        }))
      ),
    };

    const solution = solveLevel(baseGrid, level.items);
    if (!solution) return false;

    let solvedGrid = baseGrid;
    for (const item of solution) {
      const cells = getOccupiedCells(item.rotatedShape, item.anchorRow, item.anchorCol);
      solvedGrid = placeItem(solvedGrid, item.id, cells);
    }

    set({
      grid: solvedGrid,
      placedItems: solution,
      unplacedItems: [],
      activeItem: null,
      activeRotation: 0,
    });
    return true;
  },

  reset: () =>
    set({
      level: null,
      grid: null,
      unplacedItems: [],
      placedItems: [],
      activeItem: null,
      activeRotation: 0,
      moveCount: 0,
      score: null,
      isComplete: false,
    }),
}));
