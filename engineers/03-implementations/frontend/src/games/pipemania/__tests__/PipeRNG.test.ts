import { describe, it, expect } from 'vitest';
import { PipeRNG, PipeBagGenerator } from '../logic/PipeRNG';
import { PipeType, STANDARD_PIPES, ONE_WAY_PIPES, RESERVOIR_PIPES } from '../logic/PipeTypes';

describe('PipeRNG Unit Tests', () => {
  it('should calculate correct drop rates for Level 1', () => {
    const rates = PipeRNG.getDropRates(1);
    expect(rates.pOneWay).toBe(0); // L <= 8 is 0%
    expect(rates.pReservoir).toBeCloseTo(0.15, 4); // 15% at L=1
    expect(rates.pStandard).toBeCloseTo(0.85, 4); // 85% at L=1
    expect(rates.standardPerType).toBeCloseTo(0.85 / 7, 4);
    expect(rates.oneWayPerType).toBe(0);
    expect(rates.reservoirPerType).toBeCloseTo(0.15 / 2, 4);
  });

  it('should calculate correct drop rates for Level 9', () => {
    const rates = PipeRNG.getDropRates(9);
    expect(rates.pOneWay).toBeCloseTo(0.0072 * (9 - 8), 4); // 0.72%
    expect(rates.pReservoir).toBeCloseTo(0.15 - 0.003 * 8, 4); // 12.6%
    expect(rates.pStandard).toBeCloseTo(1.0 - rates.pOneWay - rates.pReservoir, 4);
  });

  it('should clamp drop rates for high level (Level 36+)', () => {
    const rates = PipeRNG.getDropRates(36);
    expect(rates.pOneWay).toBeCloseTo(0.20, 2); // 20% cap
    expect(rates.pReservoir).toBeCloseTo(0.05, 2); // 5% floor
    expect(rates.pStandard).toBeCloseTo(0.75, 2); // 75%
  });

  it('should deterministically generate pipes with custom RNG', () => {
    // Force roll = 0.0 -> First standard pipe (HORIZONTAL)
    const pipe1 = PipeRNG.getRandomPipe(1, () => 0.001);
    expect(pipe1).toBe(PipeType.HORIZONTAL);

    // Roll inside reservoir range
    const rates = PipeRNG.getDropRates(1);
    const reservoirRoll = rates.pStandard + 0.01;
    const pipeRes = PipeRNG.getRandomPipe(1, () => reservoirRoll);
    expect(RESERVOIR_PIPES).toContain(pipeRes);

    // Roll inside one-way range on Level 36
    const rates36 = PipeRNG.getDropRates(36);
    const oneWayRoll = rates36.pStandard + rates36.pReservoir + 0.01;
    const pipeOneWay = PipeRNG.getRandomPipe(36, () => oneWayRoll);
    expect(ONE_WAY_PIPES).toContain(pipeOneWay);
  });

  describe('PipeBagGenerator 7-Bag Unit Tests', () => {
    it('should generate continuous stream of pipes with 7-bag cycle', () => {
      const generator = new PipeBagGenerator(1);
      const pipes = generator.drawN(14); // Draw 2 bags (14 pipes)
      expect(pipes.length).toBe(14);

      // Check that standard pipes and reservoirs are drawn
      const standardCount = pipes.filter((p) => STANDARD_PIPES.includes(p)).length;
      const reservoirCount = pipes.filter((p) => RESERVOIR_PIPES.includes(p)).length;
      expect(standardCount).toBeGreaterThanOrEqual(10);
      expect(reservoirCount).toBeGreaterThanOrEqual(1);
    });

    it('should accurately accumulate fractional replacements over multiple bags', () => {
      // At Level 1, pReservoir = 0.15, per 7-bag expected = 7 * 0.15 = 1.05
      // Over 20 bags (140 pipes), expected reservoir count is 21 pipes = 15.0%
      const generator = new PipeBagGenerator(1);
      const pipes = generator.drawN(140);
      const reservoirCount = pipes.filter((p) => RESERVOIR_PIPES.includes(p)).length;

      expect(reservoirCount).toBe(21); // Exactly 21 out of 140 = 15.0%
    });

    it('should include one-way pipes on Level 36', () => {
      // At Level 36, pOneWay = 0.20 (20%), pReservoir = 0.05 (5%)
      // Over 100 bags (700 pipes), expected one-way = 700 * 0.20 = 140 pipes
      const generator = new PipeBagGenerator(36);
      const pipes = generator.drawN(700);
      const oneWayCount = pipes.filter((p) => ONE_WAY_PIPES.includes(p)).length;
      const resCount = pipes.filter((p) => RESERVOIR_PIPES.includes(p)).length;

      expect(oneWayCount).toBe(140); // Exactly 140 / 700 = 20%
      expect(resCount).toBe(35); // Exactly 35 / 700 = 5%
    });
  });
});
