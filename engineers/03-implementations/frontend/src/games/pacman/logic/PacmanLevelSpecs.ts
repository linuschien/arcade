/**
 * PacmanLevelSpecs.ts
 * Exact parameters for Levels 1 through 17+ per official Arcade Pac-Man specifications.
 * Defines level-based speed ratios for Pac-Man and Ghosts across normal, frightened, and tunnel states.
 */

export type FruitType =
  | 'Cherry'
  | 'Strawberry'
  | 'Peach'
  | 'Apple'
  | 'Pineapple'
  | 'Galaxian'
  | 'Bell'
  | 'Key';

export interface LevelSpec {
  level: number;
  fruit: FruitType;
  fruitScore: number;
  pacmanSpeedRatio: number;       // Normal Pac-Man speed ratio (0.80 ~ 1.00)
  pacmanFrightSpeedRatio: number; // Frightened Pac-Man speed ratio (0.90 ~ 1.00)
  ghostSpeedRatio: number;        // Normal Ghost speed ratio (0.75 ~ 0.95)
  ghostFrightSpeedRatio: number;  // Frightened Ghost speed ratio (0.50 ~ 0.60)
  ghostTunnelSpeedRatio: number;  // Tunnel Ghost speed ratio (0.40 ~ 0.50)
  frightDurationSec: number;
  frightFlashCount: number;
  timerArraySec: number[];
  ghostExitDelaysSec?: { pinky: number; inky: number; clyde: number };
}

const DEFAULT_TIMERS_LVL1_2 = [7, 20, 7, 20, 5, 20, 5, Infinity];
const DEFAULT_TIMERS_LVL3_PLUS = [5, 20, 5, 20, 5, 20, 5, Infinity];

const LEVEL_SPECS_MAP: Record<number, Omit<LevelSpec, 'level'>> = {
  1: {
    fruit: 'Cherry',
    fruitScore: 100,
    pacmanSpeedRatio: 0.80,
    pacmanFrightSpeedRatio: 0.90,
    ghostSpeedRatio: 0.75,
    ghostFrightSpeedRatio: 0.50,
    ghostTunnelSpeedRatio: 0.40,
    frightDurationSec: 6.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL1_2,
  },
  2: {
    fruit: 'Strawberry',
    fruitScore: 300,
    pacmanSpeedRatio: 0.90,
    pacmanFrightSpeedRatio: 0.95,
    ghostSpeedRatio: 0.85,
    ghostFrightSpeedRatio: 0.55,
    ghostTunnelSpeedRatio: 0.45,
    frightDurationSec: 5.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL1_2,
  },
  3: {
    fruit: 'Peach',
    fruitScore: 500,
    pacmanSpeedRatio: 0.90,
    pacmanFrightSpeedRatio: 0.95,
    ghostSpeedRatio: 0.85,
    ghostFrightSpeedRatio: 0.55,
    ghostTunnelSpeedRatio: 0.45,
    frightDurationSec: 4.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  4: {
    fruit: 'Peach',
    fruitScore: 500,
    pacmanSpeedRatio: 0.90,
    pacmanFrightSpeedRatio: 0.95,
    ghostSpeedRatio: 0.85,
    ghostFrightSpeedRatio: 0.55,
    ghostTunnelSpeedRatio: 0.45,
    frightDurationSec: 3.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  5: {
    fruit: 'Apple',
    fruitScore: 700,
    pacmanSpeedRatio: 1.00,
    pacmanFrightSpeedRatio: 1.00,
    ghostSpeedRatio: 0.95,
    ghostFrightSpeedRatio: 0.60,
    ghostTunnelSpeedRatio: 0.50,
    frightDurationSec: 2.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  6: {
    fruit: 'Apple',
    fruitScore: 700,
    pacmanSpeedRatio: 1.00,
    pacmanFrightSpeedRatio: 1.00,
    ghostSpeedRatio: 0.95,
    ghostFrightSpeedRatio: 0.60,
    ghostTunnelSpeedRatio: 0.50,
    frightDurationSec: 5.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  7: {
    fruit: 'Pineapple',
    fruitScore: 1000,
    pacmanSpeedRatio: 1.00,
    pacmanFrightSpeedRatio: 1.00,
    ghostSpeedRatio: 0.95,
    ghostFrightSpeedRatio: 0.60,
    ghostTunnelSpeedRatio: 0.50,
    frightDurationSec: 2.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  8: {
    fruit: 'Pineapple',
    fruitScore: 1000,
    pacmanSpeedRatio: 1.00,
    pacmanFrightSpeedRatio: 1.00,
    ghostSpeedRatio: 0.95,
    ghostFrightSpeedRatio: 0.60,
    ghostTunnelSpeedRatio: 0.50,
    frightDurationSec: 2.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  9: {
    fruit: 'Galaxian',
    fruitScore: 2000,
    pacmanSpeedRatio: 1.00,
    pacmanFrightSpeedRatio: 1.00,
    ghostSpeedRatio: 0.95,
    ghostFrightSpeedRatio: 0.60,
    ghostTunnelSpeedRatio: 0.50,
    frightDurationSec: 1.0,
    frightFlashCount: 3,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  10: {
    fruit: 'Galaxian',
    fruitScore: 2000,
    pacmanSpeedRatio: 1.00,
    pacmanFrightSpeedRatio: 1.00,
    ghostSpeedRatio: 0.95,
    ghostFrightSpeedRatio: 0.60,
    ghostTunnelSpeedRatio: 0.50,
    frightDurationSec: 5.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  11: {
    fruit: 'Bell',
    fruitScore: 3000,
    pacmanSpeedRatio: 1.00,
    pacmanFrightSpeedRatio: 1.00,
    ghostSpeedRatio: 0.95,
    ghostFrightSpeedRatio: 0.60,
    ghostTunnelSpeedRatio: 0.50,
    frightDurationSec: 2.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  12: {
    fruit: 'Bell',
    fruitScore: 3000,
    pacmanSpeedRatio: 1.00,
    pacmanFrightSpeedRatio: 1.00,
    ghostSpeedRatio: 0.95,
    ghostFrightSpeedRatio: 0.60,
    ghostTunnelSpeedRatio: 0.50,
    frightDurationSec: 1.0,
    frightFlashCount: 3,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  13: {
    fruit: 'Key',
    fruitScore: 5000,
    pacmanSpeedRatio: 1.00,
    pacmanFrightSpeedRatio: 1.00,
    ghostSpeedRatio: 0.95,
    ghostFrightSpeedRatio: 0.60,
    ghostTunnelSpeedRatio: 0.50,
    frightDurationSec: 1.0,
    frightFlashCount: 3,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  14: {
    fruit: 'Key',
    fruitScore: 5000,
    pacmanSpeedRatio: 1.00,
    pacmanFrightSpeedRatio: 1.00,
    ghostSpeedRatio: 0.95,
    ghostFrightSpeedRatio: 0.60,
    ghostTunnelSpeedRatio: 0.50,
    frightDurationSec: 3.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  15: {
    fruit: 'Key',
    fruitScore: 5000,
    pacmanSpeedRatio: 1.00,
    pacmanFrightSpeedRatio: 1.00,
    ghostSpeedRatio: 0.95,
    ghostFrightSpeedRatio: 0.60,
    ghostTunnelSpeedRatio: 0.50,
    frightDurationSec: 1.0,
    frightFlashCount: 3,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  16: {
    fruit: 'Key',
    fruitScore: 5000,
    pacmanSpeedRatio: 1.00,
    pacmanFrightSpeedRatio: 1.00,
    ghostSpeedRatio: 0.95,
    ghostFrightSpeedRatio: 0.60,
    ghostTunnelSpeedRatio: 0.50,
    frightDurationSec: 1.0,
    frightFlashCount: 3,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
};

export function getLevelSpec(level: number): LevelSpec {
  const defaultDelays =
    level === 1
      ? { pinky: 2.0, inky: 5.0, clyde: 10.0 }
      : level === 2
      ? { pinky: 1.0, inky: 2.5, clyde: 5.0 }
      : level <= 4
      ? { pinky: 0.5, inky: 1.5, clyde: 3.5 }
      : { pinky: 0.2, inky: 0.8, clyde: 2.0 };

  if (level >= 17) {
    return {
      level,
      fruit: 'Key',
      fruitScore: 5000,
      pacmanSpeedRatio: 0.90,
      pacmanFrightSpeedRatio: 0.90,
      ghostSpeedRatio: 0.95,
      ghostFrightSpeedRatio: 0.60,
      ghostTunnelSpeedRatio: 0.50,
      frightDurationSec: 0.0,
      frightFlashCount: 0,
      timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
      ghostExitDelaysSec: defaultDelays,
    };
  }

  const spec = LEVEL_SPECS_MAP[level] || LEVEL_SPECS_MAP[1];
  return {
    level,
    ghostExitDelaysSec: defaultDelays,
    ...spec,
  };
}
