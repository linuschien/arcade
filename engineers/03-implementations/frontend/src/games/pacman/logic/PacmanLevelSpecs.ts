/**
 * PacmanLevelSpecs.ts
 * Exact parameters for Levels 1 through 17+ per PRD-02.
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
  ghostSpeedRatio: number; // e.g. 0.75 for 75%
  frightDurationSec: number;
  frightFlashCount: number;
  timerArraySec: number[]; // e.g. [7, 20, 7, 20, 5, 20, 5, Infinity]
  ghostExitDelaysSec?: { pinky: number; inky: number; clyde: number };
}

const DEFAULT_TIMERS_LVL1_2 = [7, 20, 7, 20, 5, 20, 5, Infinity];
const DEFAULT_TIMERS_LVL3_PLUS = [5, 20, 5, 20, 5, 20, 5, Infinity];

const LEVEL_SPECS_MAP: Record<number, Omit<LevelSpec, 'level'>> = {
  1: {
    fruit: 'Cherry',
    fruitScore: 100,
    ghostSpeedRatio: 0.75,
    frightDurationSec: 6.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL1_2,
  },
  2: {
    fruit: 'Strawberry',
    fruitScore: 300,
    ghostSpeedRatio: 0.85,
    frightDurationSec: 5.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL1_2,
  },
  3: {
    fruit: 'Peach',
    fruitScore: 500,
    ghostSpeedRatio: 0.85,
    frightDurationSec: 4.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  4: {
    fruit: 'Peach',
    fruitScore: 500,
    ghostSpeedRatio: 0.85,
    frightDurationSec: 3.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  5: {
    fruit: 'Apple',
    fruitScore: 700,
    ghostSpeedRatio: 0.95,
    frightDurationSec: 2.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  6: {
    fruit: 'Apple',
    fruitScore: 700,
    ghostSpeedRatio: 0.95,
    frightDurationSec: 5.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  7: {
    fruit: 'Pineapple',
    fruitScore: 1000,
    ghostSpeedRatio: 0.95,
    frightDurationSec: 2.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  8: {
    fruit: 'Pineapple',
    fruitScore: 1000,
    ghostSpeedRatio: 0.95,
    frightDurationSec: 2.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  9: {
    fruit: 'Galaxian',
    fruitScore: 2000,
    ghostSpeedRatio: 0.95,
    frightDurationSec: 1.0,
    frightFlashCount: 3,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  10: {
    fruit: 'Galaxian',
    fruitScore: 2000,
    ghostSpeedRatio: 0.95,
    frightDurationSec: 5.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  11: {
    fruit: 'Bell',
    fruitScore: 3000,
    ghostSpeedRatio: 0.95,
    frightDurationSec: 2.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  12: {
    fruit: 'Bell',
    fruitScore: 3000,
    ghostSpeedRatio: 0.95,
    frightDurationSec: 1.0,
    frightFlashCount: 3,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  13: {
    fruit: 'Key',
    fruitScore: 5000,
    ghostSpeedRatio: 0.95,
    frightDurationSec: 1.0,
    frightFlashCount: 3,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  14: {
    fruit: 'Key',
    fruitScore: 5000,
    ghostSpeedRatio: 0.95,
    frightDurationSec: 3.0,
    frightFlashCount: 5,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  15: {
    fruit: 'Key',
    fruitScore: 5000,
    ghostSpeedRatio: 0.95,
    frightDurationSec: 1.0,
    frightFlashCount: 3,
    timerArraySec: DEFAULT_TIMERS_LVL3_PLUS,
  },
  16: {
    fruit: 'Key',
    fruitScore: 5000,
    ghostSpeedRatio: 0.95,
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
      ghostSpeedRatio: 1.0,
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
