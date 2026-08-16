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

export class PipeManiaLevelSpecs {
  /**
   * Compute complete level configuration for any level L >= 1.
   */
  public static getLevelConfig(level: number): LevelConfig {
    const L = Math.max(1, Math.floor(level));

    if (L <= 36) {
      // Mainline Levels 1..36
      const delaySeconds = Math.max(6.0, 20.0 - 0.40 * (L - 1));
      const flowIntervalMs = Math.max(800, 2500 - 50 * (L - 1));
      const reservoirIntervalMs = flowIntervalMs * 6.0;
      const targetLength = Math.min(30, Math.floor(10 + 0.58 * (L - 1)));
      const obstacleCount = Math.min(6, Math.floor(0.18 * (L - 1)));
      const presetPipeCount = Math.min(6, Math.max(0, Math.floor(0.19 * (L - 3))));
      const manhattanDistance = Math.max(2, Math.floor(6 - 0.11 * (L - 1)));

      let endOrientationMode: 'FACING' | 'ORTHOGONAL' | 'AWAY' = 'FACING';
      if (L >= 21) {
        endOrientationMode = 'AWAY';
      } else if (L >= 9) {
        endOrientationMode = 'ORTHOGONAL';
      }

      // Linear Drop Rates
      const pOneWay = Math.min(0.20, Math.max(0.0, 0.0072 * (L - 8)));
      const pReservoir = Math.max(0.05, 0.15 - 0.0030 * (L - 1));
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
        loopRound: 0,
        baseLevel: L,
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
    } else {
      // Endless Mode (L > 36)
      const loopRound = Math.floor((L - 1) / 36);
      const baseLevel = ((L - 1) % 36) + 1;
      const decayFactor = Math.pow(0.9, loopRound);

      // Delay floor is 4.0s in endless mode
      const baseDelay = Math.max(6.0, 20.0 - 0.40 * (baseLevel - 1));
      const delaySeconds = Math.max(4.0, baseDelay * decayFactor);

      // Flow speed floor is 500ms in endless mode
      const baseFlow = Math.max(800, 2500 - 50 * (baseLevel - 1));
      const flowIntervalMs = Math.max(500, Math.round(baseFlow * decayFactor));
      const reservoirIntervalMs = flowIntervalMs * 6.0;

      // Target, Obstacles & Presets scale with baseLevel & cap
      const targetLength = Math.min(30, Math.floor(10 + 0.58 * (baseLevel - 1)));
      const obstacleCount = Math.min(6, Math.floor(0.18 * (baseLevel - 1)));
      const presetPipeCount = Math.min(6, Math.max(0, Math.floor(0.19 * (baseLevel - 3))));
      const manhattanDistance = Math.max(2, Math.floor(6 - 0.11 * (baseLevel - 1)));

      let endOrientationMode: 'FACING' | 'ORTHOGONAL' | 'AWAY' = 'FACING';
      if (baseLevel >= 21) {
        endOrientationMode = 'AWAY';
      } else if (baseLevel >= 9) {
        endOrientationMode = 'ORTHOGONAL';
      }

      // Linear Drop Rates based on baseLevel
      const pOneWay = Math.min(0.20, Math.max(0.0, 0.0072 * (baseLevel - 8)));
      const pReservoir = Math.max(0.05, 0.15 - 0.0030 * (baseLevel - 1));
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
}
