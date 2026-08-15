import { describe, it, expect } from 'vitest';
import { PipeRNG } from '../logic/PipeRNG';
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
});
