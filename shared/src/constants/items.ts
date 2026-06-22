import type { CellZone, Item, ItemShape } from '../types/item';

export interface GroceryDefinition {
  id: string;
  name: string;
  shapeVariants: ItemShape[];
  zoneRequirement: CellZone | null;
  points: number;
  color: string;
  emoji: string;
  aliases?: string[];
}

export const GROCERY_CATALOG = [
  {
    id: 'milk',
    name: 'Milk',
    shapeVariants: [[[1], [1], [1]], [[1], [1]]],
    zoneRequirement: 'cold',
    points: 30,
    color: '#FAFAFA',
    emoji: '🥛',
  },
  {
    id: 'cheese',
    name: 'Cheese',
    shapeVariants: [[[1, 1], [1, 0]], [[1, 1]]],
    zoneRequirement: null,
    points: 20,
    color: '#F59E0B',
    emoji: '🧀',
  },
  {
    id: 'broccoli',
    name: 'Broccoli',
    shapeVariants: [[[0, 1], [1, 1]], [[1, 1], [1, 0]]],
    zoneRequirement: null,
    points: 25,
    color: '#16A34A',
    emoji: '🥦',
  },
  {
    id: 'butter',
    name: 'Butter',
    shapeVariants: [[[1]], [[1, 1]]],
    zoneRequirement: 'shelf',
    points: 15,
    color: '#FCD34D',
    emoji: '🧈',
  },
  {
    id: 'yogurt',
    name: 'Yogurt',
    shapeVariants: [[[1, 1], [1, 1]], [[1], [1]]],
    zoneRequirement: 'cold',
    points: 20,
    color: '#BAE6FD',
    emoji: '🫙',
  },
  {
    id: 'carrot',
    name: 'Carrot',
    shapeVariants: [[[1], [1]], [[1, 1]]],
    zoneRequirement: null,
    points: 10,
    color: '#F97316',
    emoji: '🥕',
  },
  {
    id: 'peas',
    name: 'Peas',
    shapeVariants: [[[1, 1, 1]], [[1, 1]]],
    zoneRequirement: 'frozen',
    points: 18,
    color: '#34D399',
    emoji: '🫛',
  },
  {
    id: 'juice',
    name: 'Juice',
    shapeVariants: [[[1], [1]], [[1]]],
    zoneRequirement: 'cold',
    points: 14,
    color: '#FBBF24',
    emoji: '🧃',
    aliases: ['juice box', 'juicebox'],
  },
  {
    id: 'eggs',
    name: 'Eggs',
    shapeVariants: [[[1, 1], [1, 1]], [[1, 1]]],
    zoneRequirement: 'shelf',
    points: 22,
    color: '#FDE68A',
    emoji: '🥚',
    aliases: ['egg'],
  },
  {
    id: 'berries',
    name: 'Berries',
    shapeVariants: [[[1, 1, 0], [0, 1, 1]], [[1, 1], [1, 0]]],
    zoneRequirement: 'cold',
    points: 28,
    color: '#FB7185',
    emoji: '🫐',
    aliases: ['berry', 'strawberry', 'strawberries'],
  },
] satisfies GroceryDefinition[];

export function buildCatalogItem(id: string, variantIndex = 0): Item {
  const definition = GROCERY_CATALOG.find((item) => item.id === id);
  if (!definition) {
    throw new Error(`Unknown grocery catalog item: ${id}`);
  }
  const shape = definition.shapeVariants[variantIndex % definition.shapeVariants.length];
  return {
    id: definition.id,
    name: definition.name,
    shape,
    zoneRequirement: definition.zoneRequirement,
    points: definition.points,
    color: definition.color,
  };
}

export function findCatalogEmoji(name: string): string | null {
  const normalized = name.toLowerCase();
  for (const item of GROCERY_CATALOG) {
    const keys = [item.id, item.name, ...(item.aliases ?? [])];
    if (keys.some((key) => normalized.includes(key.toLowerCase()))) {
      return item.emoji;
    }
  }
  return null;
}
