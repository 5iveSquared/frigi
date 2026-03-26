import type { ItemShape, RotationDegrees } from '@frigi/shared';

export function rotateShape(shape: ItemShape, degrees: RotationDegrees): ItemShape {
  if (degrees === 0) return shape;
  let result = shape;
  const times = degrees / 90;
  for (let i = 0; i < times; i++) {
    result = rotate90(result);
  }
  return result;
}

function rotate90(shape: ItemShape): ItemShape {
  const rows = shape.length;
  const cols = shape[0].length;
  return Array.from({ length: cols }, (_, newRow) =>
    Array.from({ length: rows }, (_, newCol) => shape[rows - 1 - newCol][newRow])
  );
}

export function getShapeDimensions(shape: ItemShape): { rows: number; cols: number } {
  return { rows: shape.length, cols: shape[0]?.length ?? 0 };
}

export function getOccupiedCells(
  shape: ItemShape,
  anchorRow: number,
  anchorCol: number
): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 1) {
        cells.push([anchorRow + r, anchorCol + c]);
      }
    }
  }
  return cells;
}
