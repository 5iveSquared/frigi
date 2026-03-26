export const SCORE_WEIGHTS = {
  EFFICIENCY_MULTIPLIER: 100,   // fill_ratio × grid_area × 100
  TIME_BASE: 500,
  TIME_DECAY: 0.005,            // e^(−0.005 × elapsed_seconds)
  MOVE_BASE: 200,
  MOVE_PENALTY: 2,              // per move above 0
} as const;

export const TIME_BONUS_CURVE = {
  MAX: 500,
  DECAY_RATE: 0.005,
} as const;

export const ELO_CONFIG = {
  DEFAULT_RATING: 1000,
  K_FACTOR: 32,
  SCALE: 400,
  SIGMOID_SCALE: 200,
  MIN_DIFFICULTY: 0.1,
  MAX_DIFFICULTY: 0.95,
} as const;
