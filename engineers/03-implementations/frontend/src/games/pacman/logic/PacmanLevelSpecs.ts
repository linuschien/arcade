/**
 * PacmanLevelSpecs.ts
 * Exact parameters for Levels 1 through 17+ per official Arcade Pac-Man specifications.
 * Uses a linear interpolation function of `level` (Levels 1 to 17) to smoothly scale
 * Pac-Man and Ghost base speeds and state multipliers without abrupt difficulty walls.
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
  pacmanSpeedRatio: number;       // Normal Pac-Man speed ratio (0.85 ~ 1.00)
  pacmanFrightSpeedRatio: number; // Frightened Pac-Man speed ratio (12% boost, max 1.00)
  ghostSpeedRatio: number;        // Normal Ghost speed ratio (0.68 ~ 0.96)
  ghostFrightSpeedRatio: number;  // Frightened Ghost speed ratio (ghostSpeedRatio * 0.60)
  ghostTunnelSpeedRatio: number;  // Tunnel Ghost speed ratio (ghostSpeedRatio * 0.50)
  frightDurationSec: number;
  frightFlashCount: number;
  timerArraySec: number[];
  ghostExitDelaysSec?: { pinky: number; inky: number; clyde: number };
}

const DEFAULT_TIMERS_LVL1_2 = [7, 20, 7, 20, 5, 20, 5, Infinity];
const DEFAULT_TIMERS_LVL3_PLUS = [5, 20, 5, 20, 5, 20, 5, Infinity];

const LEVEL_METADATA_MAP: Record<number, { fruit: FruitType; fruitScore: number; frightDurationSec: number; frightFlashCount: number; timerArraySec: number[] }> = {
  1:  { fruit: 'Cherry',     fruitScore: 100,  frightDurationSec: 6.0, frightFlashCount: 5, timerArraySec: DEFAULT_TIMERS_LVL1_2 },
  2:  { fruit: 'Strawberry', fruitScore: 300,  frightDurationSec: 5.0, frightFlashCount: 5, timerArraySec: DEFAULT_TIMERS_LVL1_2 },
  3:  { fruit: 'Peach',      fruitScore: 500,  frightDurationSec: 4.0, frightFlashCount: 5, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS },
  4:  { fruit: 'Peach',      fruitScore: 500,  frightDurationSec: 3.0, frightFlashCount: 5, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS },
  5:  { fruit: 'Apple',      fruitScore: 700,  frightDurationSec: 2.0, frightFlashCount: 5, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS },
  6:  { fruit: 'Apple',      fruitScore: 700,  frightDurationSec: 5.0, frightFlashCount: 5, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS }, // Grace Level
  7:  { fruit: 'Pineapple',  fruitScore: 1000, frightDurationSec: 2.0, frightFlashCount: 5, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS },
  8:  { fruit: 'Pineapple',  fruitScore: 1000, frightDurationSec: 2.0, frightFlashCount: 5, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS },
  9:  { fruit: 'Galaxian',   fruitScore: 2000, frightDurationSec: 1.0, frightFlashCount: 3, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS },
  10: { fruit: 'Galaxian',   fruitScore: 2000, frightDurationSec: 5.0, frightFlashCount: 5, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS }, // Grace Level
  11: { fruit: 'Bell',       fruitScore: 3000, frightDurationSec: 2.0, frightFlashCount: 5, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS },
  12: { fruit: 'Bell',       fruitScore: 3000, frightDurationSec: 1.0, frightFlashCount: 3, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS },
  13: { fruit: 'Key',        fruitScore: 5000, frightDurationSec: 1.0, frightFlashCount: 3, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS },
  14: { fruit: 'Key',        fruitScore: 5000, frightDurationSec: 3.0, frightFlashCount: 5, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS }, // Grace Level
  15: { fruit: 'Key',        fruitScore: 5000, frightDurationSec: 1.0, frightFlashCount: 3, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS },
  16: { fruit: 'Key',        fruitScore: 5000, frightDurationSec: 1.0, frightFlashCount: 3, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS },
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

  // Linear Interpolation progress ratio (0.0 at Level 1 to 1.0 at Level 17+)
  const progress = Math.min((Math.max(1, level) - 1) / 16, 1.0);

  // Linear Base Speeds
  const pacmanSpeedRatio = Number((0.85 + progress * (1.00 - 0.85)).toFixed(4));
  const ghostSpeedRatio = Number((0.68 + progress * (0.96 - 0.68)).toFixed(4));

  // Relative State Multipliers
  const pacmanFrightSpeedRatio = Number(Math.min(pacmanSpeedRatio * 1.12, 1.00).toFixed(4));
  const ghostFrightSpeedRatio = Number((ghostSpeedRatio * 0.60).toFixed(4));
  const ghostTunnelSpeedRatio = Number((ghostSpeedRatio * 0.50).toFixed(4));

  const meta = level >= 17
    ? { fruit: 'Key' as FruitType, fruitScore: 5000, frightDurationSec: 0.0, frightFlashCount: 0, timerArraySec: DEFAULT_TIMERS_LVL3_PLUS }
    : (LEVEL_METADATA_MAP[level] || LEVEL_METADATA_MAP[1]);

  return {
    level,
    ghostExitDelaysSec: defaultDelays,
    pacmanSpeedRatio,
    pacmanFrightSpeedRatio,
    ghostSpeedRatio,
    ghostFrightSpeedRatio,
    ghostTunnelSpeedRatio,
    ...meta,
  };
}
