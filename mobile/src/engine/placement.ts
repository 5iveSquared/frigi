import type { Grid, PlacedItem, CellZone } from '@frigi/shared';
import { getOccupiedCells } from './rotation';
import { getCell, isOccupied } from './grid';

export interface PlacementResult {
  valid: boolean;
  reason?: string;
}

export function checkPlacement(
  grid: Grid,
  item: PlacedItem,
  anchorRow: number,
  anchorCol: number
): PlacementResult {
  const cells = getOccupiedCells(item.rotatedShape, anchorRow, anchorCol);

  for (const [r, c] of cells) {
    const cell = getCell(grid, r, c);
    if (!cell) return { valid: false, reason: 'out_of_bounds' };
    if (isOccupied(grid, r, c)) return { valid: false, reason: 'collision' };
    if (item.zoneRequirement && cell.zone !== item.zoneRequirement) {
      return { valid: false, reason: `zone_mismatch: requires ${item.zoneRequirement}` };
    }
  }

  return { valid: true };
}

export function getValidPlacements(
  grid: Grid,
  item: PlacedItem
): Array<{ row: number; col: number }> {
  const positions: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const result = checkPlacement(grid, item, r, c);
      if (result.valid) positions.push({ row: r, col: c });
    }
  }
  return positions;
}
