export const CELL_SIZE = 58;
export const CELL_GAP = 3;
export const SHELF_HEIGHT = 8;
export const GRID_INNER_PAD = 14;
export const DOOR_WIDTH = 92;

export interface FridgeMetrics {
  cellSize: number;
  cellGap: number;
  shelfHeight: number;
  gridInnerPad: number;
  doorWidth: number;
  scale: number;
}

export interface GridFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GridCellTarget {
  row: number;
  col: number;
}

export function getFridgeMetrics(screenWidth: number, cols: number): FridgeMetrics {
  const baseGridWidth = cols * CELL_SIZE + (cols - 1) * CELL_GAP;
  const baseApplianceWidth = baseGridWidth + GRID_INNER_PAD * 2 + DOOR_WIDTH;
  const maxApplianceWidth = Math.max(300, screenWidth - 24);
  const scale = Math.max(0.78, Math.min(1, maxApplianceWidth / baseApplianceWidth));

  return {
    cellSize: Math.round(CELL_SIZE * scale),
    cellGap: Math.max(2, Math.round(CELL_GAP * scale)),
    shelfHeight: Math.max(6, Math.round(SHELF_HEIGHT * scale)),
    gridInnerPad: Math.max(10, Math.round(GRID_INNER_PAD * scale)),
    doorWidth: Math.max(72, Math.round(DOOR_WIDTH * scale)),
    scale,
  };
}

export function getCellFromRelativeCoordinates(
  x: number,
  y: number,
  rows: number,
  cols: number,
  metrics: FridgeMetrics
): GridCellTarget | null {
  if (x < 0 || y < 0) return null;

  const cellWidth = metrics.cellSize + metrics.cellGap;
  const rowHeight = metrics.cellSize + metrics.cellGap + metrics.shelfHeight;
  const col = Math.floor(x / cellWidth);
  const xOffset = x % cellWidth;
  if (col >= cols || xOffset >= metrics.cellSize) return null;

  const row = Math.floor(y / rowHeight);
  const yOffset = y % rowHeight;
  if (row >= rows || yOffset >= metrics.cellSize + metrics.cellGap) return null;

  return { row, col };
}

export function getCellFromScreenCoordinates(
  x: number,
  y: number,
  frame: GridFrame | null,
  rows: number,
  cols: number,
  metrics: FridgeMetrics
): GridCellTarget | null {
  if (!frame) return null;
  return getCellFromRelativeCoordinates(x - frame.x, y - frame.y, rows, cols, metrics);
}
