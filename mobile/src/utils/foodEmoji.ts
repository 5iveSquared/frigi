import { findCatalogEmoji } from '@frigi/shared';

const EMOJI_MAP: [string, string][] = [
  ['frozen pizza', '🍕'],
  ['watermelon', '🍉'],
  ['turkey',     '🦃'],
  ['lasagna',    '🍝'],
  ['egg',        '🥚'],
  ['ice cubes',  '🧊'],
  ['ice cube',   '🧊'],
  ['apple',      '🍎'],
  ['chicken',    '🍗'],
  ['fish',       '🐟'],
  ['salmon',     '🐟'],
  ['shrimp',     '🍤'],
  ['beer',       '🍺'],
  ['wine',       '🍷'],
  ['grape',      '🍇'],
  ['lemon',      '🍋'],
  ['orange',     '🍊'],
  ['tomato',     '🍅'],
  ['pepper',     '🫑'],
  ['mushroom',   '🍄'],
  ['lettuce',    '🥬'],
  ['onion',      '🧅'],
  ['garlic',     '🧄'],
  ['cucumber',   '🥒'],
  ['avocado',    '🥑'],
  ['meat',       '🥩'],
  ['steak',      '🥩'],
  ['sausage',    '🌭'],
  ['bacon',      '🥓'],
  ['ham',        '🍖'],
  ['cake',       '🎂'],
  ['cream',      '🍦'],
  ['ice',        '🧊'],
  ['water',      '💧'],
  ['cola',       '🥤'],
  ['soda',       '🥤'],
  ['chocolate',  '🍫'],
  ['jam',        '🍓'],
  ['sauce',      '🫙'],
  ['leftovers',  '🍱'],
  ['pizza',      '🍕'],
];

export function getFoodEmoji(name: string): string {
  const catalogEmoji = findCatalogEmoji(name);
  if (catalogEmoji) return catalogEmoji;

  const lower = name.toLowerCase();
  for (const [key, emoji] of EMOJI_MAP) {
    if (lower.includes(key)) return emoji;
  }
  return '🍽️';
}
