export type CellZone = 'standard' | 'cold' | 'frozen' | 'shelf';

export interface Cell {
  row: number;
  col: number;
  zone: CellZone;
  occupied: boolean;
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
