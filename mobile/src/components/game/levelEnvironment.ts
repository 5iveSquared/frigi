import { frigi, polar } from '~/utils/colors';

export type LevelEnvironment = {
  name: string;
  screenBg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  shadow: string;
  appliance: string;
  applianceBorder: string;
  topPanel: string;
  cavity: string;
  door: string;
  drawer: string;
  glow: string;
};

const MORNING_KITCHEN: LevelEnvironment = {
  name: 'Morning Kitchen',
  screenBg: '#F7FBFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB',
  border: '#E5E7EB',
  accent: frigi.red,
  accentSoft: 'rgba(255,77,106,0.10)',
  text: frigi.text,
  textMuted: frigi.textMuted,
  shadow: 'rgba(15, 23, 42, 0.08)',
  appliance: '#E5E7EB',
  applianceBorder: '#D1D5DB',
  topPanel: '#FFFFFF',
  cavity: '#F9FAFB',
  door: '#F3F4F6',
  drawer: '#F3F4F6',
  glow: 'rgba(148,163,184,0.35)',
};

const ENVIRONMENTS: Array<{ minLevel: number; value: LevelEnvironment }> = [
  { minLevel: 1, value: MORNING_KITCHEN },
  {
    minLevel: 6,
    value: {
      name: 'Grocery Day',
      screenBg: '#F6FFF8',
      surface: '#FFFFFF',
      surfaceAlt: '#F2FBF5',
      border: '#D9F0E2',
      accent: '#10B981',
      accentSoft: 'rgba(16,185,129,0.12)',
      text: '#173628',
      textMuted: '#5E7B69',
      shadow: 'rgba(16, 185, 129, 0.14)',
      appliance: '#E6F4EC',
      applianceBorder: '#BFE5D0',
      topPanel: '#FFFFFF',
      cavity: '#F8FFF9',
      door: '#EEF9F2',
      drawer: '#E7F6ED',
      glow: 'rgba(16,185,129,0.24)',
    },
  },
  {
    minLevel: 11,
    value: {
      name: 'Meal Prep',
      screenBg: '#F5F7FA',
      surface: '#FFFFFF',
      surfaceAlt: '#F3F5F8',
      border: '#D8DEE8',
      accent: '#64748B',
      accentSoft: 'rgba(100,116,139,0.12)',
      text: '#172033',
      textMuted: '#64748B',
      shadow: 'rgba(71, 85, 105, 0.16)',
      appliance: '#DDE3EA',
      applianceBorder: '#BFC8D4',
      topPanel: '#F8FAFC',
      cavity: '#F8FAFC',
      door: '#EDF1F5',
      drawer: '#E7ECF2',
      glow: 'rgba(100,116,139,0.24)',
    },
  },
  {
    minLevel: 16,
    value: {
      name: 'Night Snack',
      screenBg: '#101827',
      surface: '#182235',
      surfaceAlt: '#121C2E',
      border: 'rgba(255,255,255,0.10)',
      accent: '#F59E0B',
      accentSoft: 'rgba(245,158,11,0.14)',
      text: '#F8FAFC',
      textMuted: '#AAB6C7',
      shadow: 'rgba(0, 0, 0, 0.28)',
      appliance: '#263247',
      applianceBorder: '#3B465A',
      topPanel: '#1C273A',
      cavity: '#172337',
      door: '#202B3E',
      drawer: '#1C273A',
      glow: 'rgba(245,158,11,0.26)',
    },
  },
  {
    minLevel: 21,
    value: {
      name: 'Deep Freeze',
      screenBg: '#EAF7FF',
      surface: '#F8FCFF',
      surfaceAlt: '#EFF9FF',
      border: '#C8E7FB',
      accent: '#38BDF8',
      accentSoft: 'rgba(56,189,248,0.15)',
      text: '#0F2740',
      textMuted: '#4A789A',
      shadow: 'rgba(56, 189, 248, 0.18)',
      appliance: '#D8EFFB',
      applianceBorder: '#A8D8F2',
      topPanel: '#F8FCFF',
      cavity: '#F0FAFF',
      door: '#E4F5FE',
      drawer: '#DDF1FC',
      glow: 'rgba(56,189,248,0.28)',
    },
  },
];

export function getLevelEnvironment(level?: { isDaily?: boolean; progressionIndex?: number } | null): LevelEnvironment {
  if (level?.isDaily) {
    return {
      name: 'Daily Drop',
      screenBg: polar.depth,
      surface: polar.hudBg,
      surfaceAlt: polar.trayBg,
      border: polar.hudBorder,
      accent: polar.emerald,
      accentSoft: polar.emeraldGlow,
      text: polar.textPrimary,
      textMuted: polar.textSecondary,
      shadow: '#020913',
      appliance: '#0A1C31',
      applianceBorder: '#183353',
      topPanel: '#0E2440',
      cavity: '#10233E',
      door: '#07101E',
      drawer: '#0E2440',
      glow: 'rgba(110,231,183,0.28)',
    };
  }

  const levelNumber = Math.max(1, level?.progressionIndex ?? 1);
  let environment = MORNING_KITCHEN;
  for (const candidate of ENVIRONMENTS) {
    if (levelNumber >= candidate.minLevel) {
      environment = candidate.value;
    }
  }
  return environment;
}
