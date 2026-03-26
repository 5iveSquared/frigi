const EMOJI_MAP: [string, string][] = [
  ['milk',       '🥛'],
  ['cheese',     '🧀'],
  ['broccoli',   '🥦'],
  ['butter',     '🧈'],
  ['yogurt',     '🫙'],
  ['egg',        '🥚'],
  ['apple',      '🍎'],
  ['carrot',     '🥕'],
  ['chicken',    '🍗'],
  ['fish',       '🐟'],
  ['salmon',     '🐟'],
  ['shrimp',     '🍤'],
  ['juice',      '🧃'],
  ['beer',       '🍺'],
  ['wine',       '🍷'],
  ['berry',      '🫐'],
  ['strawberry', '🍓'],
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
  const lower = name.toLowerCase();
  for (const [key, emoji] of EMOJI_MAP) {
    if (lower.includes(key)) return emoji;
  }
  return '🍽️';
}
