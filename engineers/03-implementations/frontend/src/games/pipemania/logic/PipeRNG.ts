/**
 * PipeRNG.ts
 * Pure Linear Unified Weighted Drop Rates generator for Pipe Mania.
 * Shared 100% by FIFO Queue and Preset Fixed Pipe generation.
 */

import {
  PipeType,
  STANDARD_PIPES,
  ONE_WAY_PIPES,
  RESERVOIR_PIPES,
} from './PipeTypes';

export interface DropRateBreakdown {
  pOneWay: number; // 0.0 to 0.20
  pReservoir: number; // 0.15 down to 0.05
  pStandard: number; // 0.85 down to 0.75
  standardPerType: number; // pStandard / 7
  oneWayPerType: number; // pOneWay / 4
  reservoirPerType: number; // pReservoir / 2
}

export class PipeRNG {
  /**
   * Calculate exact linear drop rates for a given level L.
   * Eliminates branches, pure math formulas with min/max clamps.
   */
  public static getDropRates(level: number): DropRateBreakdown {
    const L = Math.max(1, level);

    // One-Way: L <= 8 is 0%, L > 8 increases by 0.72% per level up to 20% at L=36+
    const pOneWay = Math.min(0.20, Math.max(0.0, 0.0072 * (L - 8)));

    // Reservoir: Starts at 15% at L=1, decreases by 0.30% per level down to min 5%
    const pReservoir = Math.max(0.05, 0.15 - 0.0030 * (L - 1));

    // Standard: Remaining probability distributed evenly across 7 standard pipes
    const pStandard = Math.max(0.0, 1.0 - pOneWay - pReservoir);

    return {
      pOneWay,
      pReservoir,
      pStandard,
      standardPerType: pStandard / STANDARD_PIPES.length,
      oneWayPerType: ONE_WAY_PIPES.length > 0 ? pOneWay / ONE_WAY_PIPES.length : 0,
      reservoirPerType: RESERVOIR_PIPES.length > 0 ? pReservoir / RESERVOIR_PIPES.length : 0,
    };
  }

  /**
   * Generate a random placeable pipe based on the unified linear drop rates.
   * Accepts an optional deterministic PRNG fn for unit testing.
   */
  public static getRandomPipe(level: number, rng: () => number = Math.random): PipeType {
    const rates = this.getDropRates(level);
    const roll = rng();

    let cumulative = 0;

    // 1. Check Standard Pipes
    for (const pipe of STANDARD_PIPES) {
      cumulative += rates.standardPerType;
      if (roll < cumulative) {
        return pipe;
      }
    }

    // 2. Check Reservoir Pipes
    for (const pipe of RESERVOIR_PIPES) {
      cumulative += rates.reservoirPerType;
      if (roll < cumulative) {
        return pipe;
      }
    }

    // 3. Check One-Way Pipes
    for (const pipe of ONE_WAY_PIPES) {
      cumulative += rates.oneWayPerType;
      if (roll < cumulative) {
        return pipe;
      }
    }

    // Fallback to horizontal
    return PipeType.HORIZONTAL;
  }
}
