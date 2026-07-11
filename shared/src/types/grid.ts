export type CellZone = 'standard' | 'cold' | 'frozen' | 'shelf';

export interface Cell {
  row: number;
  col: number;
  zone: CellZone;
  occupied: boolean;
  /** Pre-filled with leftovers by the generator — never placeable or clearable. */
  blocked?: boolean;
  itemId: string | null;
}

export interface Grid {
  rows: number;
  cols: number;
  cells: Cell[][];
}

export interface GridSnapshot {
  grid: Grid;
  timestamp: number;
  moveCount: number;
}
