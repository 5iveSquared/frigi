// Polar Kitchen palette — deep fridge blues, ice zone tints, emerald freshness
export const polar = {
  // Backgrounds
  void:     '#060E1A',   // deepest — outside fridge
  depth:    '#0A1628',   // app background
  cavity:   '#0D2040',   // fridge interior casing
  interior: '#0F2B4E',   // fridge interior background

  // Cells
  cellStandard: 'rgba(214, 237, 255, 0.82)',
  cellCold:     'rgba(125, 211, 252, 0.45)',
  cellFrozen:   'rgba(167, 139, 250, 0.40)',
  cellShelf:    'rgba(253, 224, 134, 0.45)',

  // Accent
  emerald:      '#10B981',
  emeraldDim:   '#065F46',
  emeraldGlow:  'rgba(16, 185, 129, 0.25)',

  // Text
  textPrimary:   '#E2F4FF',
  textSecondary: '#6BA3CC',
  textMuted:     '#2E5F8A',
  textLabel:     '#94C5E8',

  // HUD
  hudBg:     'rgba(10, 22, 40, 0.96)',
  hudBorder: 'rgba(100, 160, 210, 0.15)',

  // Tray
  trayBg:    '#07101E',
  trayBorder:'rgba(100, 160, 210, 0.12)',

  // Item card
  itemCardBg:           'rgba(255,255,255,0.04)',
  itemCardBorder:       'rgba(255,255,255,0.08)',
  itemCardActive:       'rgba(16, 185, 129, 0.15)',
  itemCardActiveBorder: '#10B981',

  // Cell borders
  borderDefault: 'rgba(148, 194, 232, 0.20)',
  borderActive:  'rgba(16, 185, 129, 0.5)',
} as const;

export const ZONE_COLORS = {
  standard: polar.cellStandard,
  cold:     polar.cellCold,
  frozen:   polar.cellFrozen,
  shelf:    polar.cellShelf,
} as const;

type AppColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  background: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  error: string;
  success: string;
  warning: string;
};

// Light-mode palette for non-game screens
export const colors: AppColors = {
  primary:       '#10B981',
  primaryLight:  '#6EE7B7',
  primaryDark:   '#065F46',
  background:    '#FFFFFF',
  surface:       '#F5F5F5',
  border:        '#E0E0E0',
  textPrimary:   '#212121',
  textSecondary: '#757575',
  error:         '#F44336',
  success:       '#10B981',
  warning:       '#FF9800',
};

export const darkColors: AppColors = {
  primary:       '#10B981',
  primaryLight:  '#6EE7B7',
  primaryDark:   '#065F46',
  background:    '#0A1628',
  surface:       '#0D2040',
  border:        '#1E3A5F',
  textPrimary:   '#E2F4FF',
  textSecondary: '#6BA3CC',
  error:         '#EF5350',
  success:       '#10B981',
  warning:       '#FFA726',
};

// Frigi UI palette (MagicPatterns reference)
export const frigi = {
  red: '#FF4D6A',
  mint: '#6EE7B7',
  orange: '#FF9F43',
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#1F2937',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  shadow: 'rgba(15, 23, 42, 0.08)',
} as const;

export const frigiZones = {
  standard: '#F1F5F9',
  cold: '#DBEAFE',
  frozen: '#EDE9FE',
  shelf: '#FEF3C7',
} as const;
