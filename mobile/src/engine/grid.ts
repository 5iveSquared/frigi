import type { Grid, Cell, CellZone } from '@frigi/shared';

export function createGrid(rows: number, cols: number, defaultZone: CellZone = 'standard'): Grid {
  const cells: Cell[][] = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      zone: defaultZone,
      occupied: false,
      itemId: null,
    }))
  );
  return { rows, cols, cells };
}

export function getCell(grid: Grid, row: number, col: number): Cell | null {
  if (row < 0 || row >= grid.rows || col < 0 || col >= grid.cols) return null;
  return grid.cells[row][col];
}

export function isOccupied(grid: Grid, row: number, col: number): boolean {
  return grid.cells[row]?.[col]?.occupied ?? false;
}

function cloneGrid(grid: Grid): Grid {
  return {
    rows: grid.rows,
    cols: grid.cols,
    cells: grid.cells.map((row) => row.map((cell) => ({ ...cell }))),
  };
}

export function placeItem(grid: Grid, itemId: string, cells: [number, number][]): Grid {
  const next = cloneGrid(grid);
  for (const [r, c] of cells) {
    next.cells[r][c].occupied = true;
    next.cells[r][c].itemId = itemId;
  }
  return next;
}

export function removeItem(grid: Grid, itemId: string): Grid {
  const next = cloneGrid(grid);
  for (const row of next.cells) {
    for (const cell of row) {
      if (cell.itemId === itemId) {
        cell.occupied = false;
        cell.itemId = null;
      }
    }
  }
  return next;
}

export function countOccupied(grid: Grid): number {
  return grid.cells.flat().filter((c) => c.occupied).length;
}
