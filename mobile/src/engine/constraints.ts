import type { Grid, PlacedItem, Constraint, CellZone } from '@frigi/shared';
import { getOccupiedCells } from './rotation';

// Mirrors backend/app/services/constraint_engine.py — both sides must agree
// on constraint semantics so the local score matches the server's.

export interface ConstraintResult {
  constraint: Constraint;
  satisfied: boolean;
}

type CellKey = string;

const key = (row: number, col: number): CellKey => `${row},${col}`;

function cellsForItem(item: PlacedItem): Set<CellKey> {
  const cells = new Set<CellKey>();
  for (const [r, c] of getOccupiedCells(item.rotatedShape, item.anchorRow, item.anchorCol)) {
    cells.add(key(r, c));
  }
  return cells;
}

export function evaluateConstraints(
  grid: Grid,
  placedItems: PlacedItem[],
  constraints: Constraint[]
): ConstraintResult[] {
  const cellsByItem = new Map<string, Set<CellKey>>();
  for (const item of placedItems) {
    cellsByItem.set(item.id, cellsForItem(item));
  }

  const zoneByCell = new Map<CellKey, CellZone>();
  const blockedCells = new Set<CellKey>();
  for (const row of grid.cells) {
    for (const cell of row) {
      zoneByCell.set(key(cell.row, cell.col), cell.zone);
      if (cell.blocked) blockedCells.add(key(cell.row, cell.col));
    }
  }

  const occupiedCells = new Set<CellKey>();
  for (const cells of cellsByItem.values()) {
    for (const cell of cells) occupiedCells.add(cell);
  }

  return constraints.map((constraint) => ({
    constraint,
    satisfied: check(constraint, cellsByItem, zoneByCell, blockedCells, occupiedCells),
  }));
}

export function satisfiedPoints(results: ConstraintResult[]): number {
  return results.reduce((sum, r) => (r.satisfied ? sum + r.constraint.points : sum), 0);
}

function check(
  constraint: Constraint,
  cellsByItem: Map<string, Set<CellKey>>,
  zoneByCell: Map<CellKey, CellZone>,
  blockedCells: Set<CellKey>,
  occupiedCells: Set<CellKey>
): boolean {
  const params = constraint.params ?? {};

  switch (constraint.type) {
    case 'zone': {
      const itemIds = params.itemIds as string[] | undefined;
      const zone = params.zone as CellZone | undefined;
      if (!itemIds?.length || !zone) return false;
      return itemIds.every((itemId) => {
        const cells = cellsByItem.get(itemId);
        if (!cells || cells.size === 0) return false;
        for (const cell of cells) {
          if (zoneByCell.get(cell) !== zone) return false;
        }
        return true;
      });
    }

    case 'adjacency': {
      const itemIds = params.itemIds as string[] | undefined;
      if (!itemIds || itemIds.length !== 2) return false;
      const cellsA = cellsByItem.get(itemIds[0]);
      const cellsB = cellsByItem.get(itemIds[1]);
      if (!cellsA?.size || !cellsB?.size) return false;
      let touching = false;
      for (const cell of cellsA) {
        const [r, c] = cell.split(',').map(Number);
        if (
          cellsB.has(key(r + 1, c)) ||
          cellsB.has(key(r - 1, c)) ||
          cellsB.has(key(r, c + 1)) ||
          cellsB.has(key(r, c - 1))
        ) {
          touching = true;
          break;
        }
      }
      return (params.mode ?? 'together') === 'together' ? touching : !touching;
    }

    case 'exclusion': {
      const zone = params.zone as CellZone | undefined;
      const minEmpty = (params.minEmpty as number | undefined) ?? 1;
      if (!zone) return false;
      let free = 0;
      for (const [cell, cellZone] of zoneByCell) {
        if (cellZone === zone && !occupiedCells.has(cell) && !blockedCells.has(cell)) {
          free += 1;
        }
      }
      return free >= minEmpty;
    }

    case 'count': {
      const zone = params.zone as CellZone | undefined;
      const maxItems = params.maxItems as number | undefined;
      if (!zone || maxItems == null) return false;
      let itemsInZone = 0;
      for (const cells of cellsByItem.values()) {
        for (const cell of cells) {
          if (zoneByCell.get(cell) === zone) {
            itemsInZone += 1;
            break;
          }
        }
      }
      return itemsInZone <= maxItems;
    }

    default:
      return false;
  }
}
