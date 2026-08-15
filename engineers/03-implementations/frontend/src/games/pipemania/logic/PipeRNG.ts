/**
 * PipeRNG.ts
 * Pure Linear Unified Weighted Drop Rates generator & 7-Bag Generator for Pipe Mania.
 * Shared 100% by FIFO Queue and Preset Fixed Pipe generation.
 */

import {
  PipeType,
  STANDARD_PIPES,
  ONE_WAY_PIPES,
  RESERVOIR_PIPES,
} from './PipeTypes';
import { PipeManiaLevelSpecs, DropRates } from './PipeManiaLevelSpecs';

export class PipeRNG {
  /**
   * Returns the exact linear drop rates computed for level L.
   */
  public static getDropRates(level: number): DropRates {
    return PipeManiaLevelSpecs.getLevelConfig(level).dropRates;
  }

  /**
   * Generate a single random placeable pipe based on the unified linear drop rates.
   * Used for single independent rolls (e.g. preset fixed pipes).
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

/**
 * PipeBagGenerator
 * 7-Bag Generator with Fractional Accumulator and Uniform Slot Replacement.
 * Ensures:
 * 1. Zero starvation (all standard pipe directions appear every 7-card cycle).
 * 2. Exactly matches linear drop rates over time.
 * 3. Continuous deck feed for the 5-slot queue.
 */
export class PipeBagGenerator {
  private level: number;
  private rng: () => number;
  private deck: PipeType[] = [];
  private accReservoir: number = 0;
  private accOneWay: number = 0;

  constructor(level: number, rng: () => number = Math.random) {
    this.level = level;
    this.rng = rng;
    this.refillBag();
  }

  public draw(): PipeType {
    if (this.deck.length < 5) {
      this.refillBag();
    }
    return this.deck.shift() || PipeType.HORIZONTAL;
  }

  public drawN(count: number): PipeType[] {
    const result: PipeType[] = [];
    for (let i = 0; i < count; i++) {
      result.push(this.draw());
    }
    return result;
  }

  public getDeck(): PipeType[] {
    return [...this.deck];
  }

  /**
   * Refill a 7-Bag with fractional accumulation and uniform slot replacement.
   */
  private refillBag(): void {
    const { pReservoir, pOneWay } = PipeRNG.getDropRates(this.level);

    // 1. Start with the canonical 7 standard pipes
    const bag: PipeType[] = [...STANDARD_PIPES];

    // 2. Accumulate expected fractional special pipe counts for this 7-bag
    this.accReservoir += 7 * pReservoir;
    this.accOneWay += 7 * pOneWay;

    const countReservoir = Math.floor(this.accReservoir);
    this.accReservoir -= countReservoir;

    const countOneWay = Math.floor(this.accOneWay);
    this.accOneWay -= countOneWay;

    // 3. Uniform Slot Replacement: pick available slots uniformly at random
    const availableSlotIndices = [0, 1, 2, 3, 4, 5, 6];
    this.shuffleArray(availableSlotIndices);

    // Replace for Reservoirs
    for (let i = 0; i < countReservoir && availableSlotIndices.length > 0; i++) {
      const slotIndex = availableSlotIndices.pop()!;
      const resPipe = RESERVOIR_PIPES[Math.floor(this.rng() * RESERVOIR_PIPES.length)];
      bag[slotIndex] = resPipe;
    }

    // Replace for One-Ways
    for (let i = 0; i < countOneWay && availableSlotIndices.length > 0; i++) {
      const slotIndex = availableSlotIndices.pop()!;
      const owPipe = ONE_WAY_PIPES[Math.floor(this.rng() * ONE_WAY_PIPES.length)];
      bag[slotIndex] = owPipe;
    }

    // 4. Fisher-Yates shuffle the final 7-bag
    this.shuffleArray(bag);

    // 5. Append to deck
    this.deck.push(...bag);
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }
}
