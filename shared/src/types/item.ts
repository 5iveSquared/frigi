export type ItemShape = (0 | 1)[][];
export type RotationDegrees = 0 | 90 | 180 | 270;
export type CellZone = 'standard' | 'cold' | 'frozen' | 'shelf';

export interface Item {
  id: string;
  name: string;
  shape: ItemShape;
  zoneRequirement: CellZone | null;
  points: number;
  color: string;
}

export interface PlacedItem extends Item {
  anchorRow: number;
  anchorCol: number;
  rotation: RotationDegrees;
  rotatedShape: ItemShape; // pre-computed
}
