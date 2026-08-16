/**
 * PipeManiaLevelSpecs.ts
 * Pure Linear Level Parameters & Difficulty Curves for Pipe Mania.
 * 100% pure math formulas eliminating if-else branches, supporting Levels 1~36 and Endless Mode.
 */

export interface DropRates {
  pOneWay: number; // 0.0 to 0.20
  pReservoir: number; // 0.15 down to 0.05
  pStandard: number; // 0.85 down to 0.75
  standardPerType: number; // pStandard / 7
  oneWayPerType: number; // pOneWay / 4
  reservoirPerType: number; // pReservoir / 2
}

export interface LevelConfig {
  level: number;
  loopRound: number; // 0 for 1-36, 1 for 37-72, etc.
  baseLevel: number; // 1-36
  delaySeconds: number; // T_delay: Countdown before liquid starts
  flowIntervalMs: number; // T_flow: Time to fill standard pipe
  reservoirIntervalMs: number; // T_reservoir: 4x flowIntervalMs
  targetLength: number; // N_target: Minimum required connected pipes to clear
  obstacleCount: number; // N_obstacle: Number of stone obstacles
  presetPipeCount: number; // N_fixed: Number of pre-placed golden pipes
  manhattanDistance: number; // D_manhattan: Start to End grid distance
  endOrientationMode: 'FACING' | 'ORTHOGONAL' | 'AWAY';
  dropRates: DropRates; // Unified linear drop rates for RNG and Presets
}

export interface LinearScaleSpec {
  startValue: number; // Start value at startLevel
  endValue: number; // End value at endLevel (slope direction auto-inferred)
  startLevel?: number; // Start level offset (default 1)
  endLevel?: number; // End level (default 36)
  slope?: number; // Optional explicit slope override
  rounding?: 'floor' | 'round' | 'none' | number; // Rounding strategy (number = decimal places)
}

export const LEVEL_SCALING_TABLE: Record<string, LinearScaleSpec> = {
  delaySeconds: { startValue: 30.0, endValue: 10.0, startLevel: 1, endLevel: 36, rounding: 2 },
  flowIntervalMs: { startValue: 3000, endValue: 1000, startLevel: 1, endLevel: 36, rounding: 'round' },
  targetLength: { startValue: 10, endValue: 30, startLevel: 1, endLevel: 36, rounding: 'floor' },
  obstacleCount: { startValue: 0, endValue: 6, startLevel: 1, endLevel: 36, rounding: 'floor' },
  presetPipeCount: { startValue: 0, endValue: 6, startLevel: 3, endLevel: 36, rounding: 'floor' },
  manhattanDistance: { startValue: 8, endValue: 2, startLevel: 1, endLevel: 36, rounding: 'floor' },
  pOneWay: { startValue: 0.0, endValue: 0.20, startLevel: 8, endLevel: 36, slope: 0.0072, rounding: 4 },
  pReservoir: { startValue: 0.15, endValue: 0.05, startLevel: 1, endLevel: 36, slope: -0.0030, rounding: 4 },
};

/**
 * Universal linear evaluator that automatically handles slope direction,
 * level offsets, clamping boundaries, and precision formatting.
 */
export function evaluateLinearScale(spec: LinearScaleSpec, level: number): number {
  const startL = spec.startLevel ?? 1;
  const endL = spec.endLevel ?? 36;
  const slope = spec.slope ?? ((spec.endValue - spec.startValue) / (endL - startL));
  const raw = spec.startValue + slope * (level - startL);

  const minVal = Math.min(spec.startValue, spec.endValue);
  const maxVal = Math.max(spec.startValue, spec.endValue);
  const clamped = Math.max(minVal, Math.min(maxVal, raw));

  if (spec.rounding === 'floor') return Math.floor(clamped);
  if (spec.rounding === 'round') return Math.round(clamped);
  if (typeof spec.rounding === 'number') {
    const factor = Math.pow(10, spec.rounding);
    return Math.round(clamped * factor) / factor;
  }
  return clamped;
}

export class PipeManiaLevelSpecs {
  /**
   * Compute complete level configuration for any level L >= 1.
   */
  public static getLevelConfig(level: number): LevelConfig {
    const L = Math.max(1, Math.floor(level));
    const loopRound = Math.floor((L - 1) / 36);
    const baseLevel = ((L - 1) % 36) + 1;
    const decayFactor = Math.pow(0.9, loopRound);

    // Compute base parameters from declarative linear scaling table
    const baseDelay = evaluateLinearScale(LEVEL_SCALING_TABLE.delaySeconds, baseLevel);
    const delaySeconds = Math.max(5.0, Math.round(baseDelay * decayFactor * 100) / 100);

    const baseFlow = evaluateLinearScale(LEVEL_SCALING_TABLE.flowIntervalMs, baseLevel);
    const flowIntervalMs = Math.max(600, Math.round(baseFlow * decayFactor));
    const reservoirIntervalMs = flowIntervalMs * 6.0;

    const targetLength = evaluateLinearScale(LEVEL_SCALING_TABLE.targetLength, baseLevel);
    const obstacleCount = evaluateLinearScale(LEVEL_SCALING_TABLE.obstacleCount, baseLevel);
    const presetPipeCount = evaluateLinearScale(LEVEL_SCALING_TABLE.presetPipeCount, baseLevel);
    const manhattanDistance = evaluateLinearScale(LEVEL_SCALING_TABLE.manhattanDistance, baseLevel);

    let endOrientationMode: 'FACING' | 'ORTHOGONAL' | 'AWAY' = 'FACING';
    if (baseLevel >= 21) {
      endOrientationMode = 'AWAY';
    } else if (baseLevel >= 9) {
      endOrientationMode = 'ORTHOGONAL';
    }

    // Linear Drop Rates based on baseLevel
    const pOneWay = evaluateLinearScale(LEVEL_SCALING_TABLE.pOneWay, baseLevel);
    const pReservoir = evaluateLinearScale(LEVEL_SCALING_TABLE.pReservoir, baseLevel);
    const pStandard = Math.max(0.0, 1.0 - pOneWay - pReservoir);

    const dropRates: DropRates = {
      pOneWay,
      pReservoir,
      pStandard,
      standardPerType: pStandard / 7,
      oneWayPerType: pOneWay / 4,
      reservoirPerType: pReservoir / 2,
    };

    return {
      level: L,
      loopRound,
      baseLevel,
      delaySeconds,
      flowIntervalMs,
      reservoirIntervalMs,
      targetLength,
      obstacleCount,
      presetPipeCount,
      manhattanDistance,
      endOrientationMode,
      dropRates,
    };
  }
}
