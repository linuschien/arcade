import { describe, it, expect } from 'vitest';
import { PipeManiaLevelSpecs } from '../logic/PipeManiaLevelSpecs';

describe('PipeManiaLevelSpecs Unit Tests', () => {
  it('should match sample specifications for Level 1', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(1);
    expect(config.level).toBe(1);
    expect(config.delaySeconds).toBe(30.0);
    expect(config.flowIntervalMs).toBe(3000);
    expect(config.reservoirIntervalMs).toBe(18000);
    expect(config.targetLength).toBe(10);
    expect(config.obstacleCount).toBe(0);
    expect(config.presetPipeCount).toBe(0);
    expect(config.manhattanDistance).toBe(8);
    expect(config.endOrientationMode).toBe('FACING');
    expect(config.dropRates.pOneWay).toBe(0);
    expect(config.dropRates.pReservoir).toBeCloseTo(0.15, 4);
    expect(config.dropRates.pStandard).toBeCloseTo(0.85, 4);
  });

  it('should match sample specifications for Level 5', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(5);
    expect(config.delaySeconds).toBeCloseTo(27.7, 1);
    expect(config.flowIntervalMs).toBe(2771);
    expect(config.reservoirIntervalMs).toBe(2771 * 6.0);
    expect(config.targetLength).toBe(12); // 10 + floor(0.58*4) = 12
    expect(config.obstacleCount).toBe(0); // floor(0.18*4) = 0
    expect(config.presetPipeCount).toBe(0); // floor(0.19*2) = 0
    expect(config.manhattanDistance).toBe(7); // floor(8 - 0.171*4) = 7
    expect(config.endOrientationMode).toBe('FACING');
  });

  it('should match sample specifications for Level 9', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(9);
    expect(config.delaySeconds).toBeCloseTo(25.4, 1);
    expect(config.flowIntervalMs).toBe(2543);
    expect(config.reservoirIntervalMs).toBe(2543 * 6.0);
    expect(config.targetLength).toBe(14); // 10 + floor(0.58*8) = 14
    expect(config.obstacleCount).toBe(1); // floor(0.18*8) = 1
    expect(config.presetPipeCount).toBe(1); // floor(0.19*6) = 1
    expect(config.manhattanDistance).toBe(6); // floor(8 - 0.171*8) = 6
    expect(config.endOrientationMode).toBe('ORTHOGONAL');
    expect(config.dropRates.pOneWay).toBeCloseTo(0.0072 * 1, 4);
  });

  it('should match sample specifications for Level 21', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(21);
    expect(config.delaySeconds).toBeCloseTo(18.6, 1);
    expect(config.flowIntervalMs).toBe(1857);
    expect(config.reservoirIntervalMs).toBe(1857 * 6.0);
    expect(config.targetLength).toBe(21); // 10 + floor(0.58*20) = 21
    expect(config.obstacleCount).toBe(3); // floor(0.18*20) = 3
    expect(config.presetPipeCount).toBe(3); // floor(0.19*18) = 3
    expect(config.manhattanDistance).toBe(4); // floor(8 - 0.171*20) = 4
    expect(config.endOrientationMode).toBe('AWAY');
  });

  it('should match sample specifications for Level 36', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(36);
    expect(config.delaySeconds).toBe(10.0);
    expect(config.flowIntervalMs).toBe(1000);
    expect(config.reservoirIntervalMs).toBe(6000);
    expect(config.targetLength).toBe(30); // max 30
    expect(config.obstacleCount).toBe(6); // max 6
    expect(config.presetPipeCount).toBe(6); // max 6
    expect(config.manhattanDistance).toBe(2); // max(2, floor(8 - 0.171*35)) = 2
    expect(config.endOrientationMode).toBe('AWAY');
    expect(config.dropRates.pOneWay).toBeCloseTo(0.20, 2);
    expect(config.dropRates.pReservoir).toBeCloseTo(0.05, 2);
    expect(config.dropRates.pStandard).toBeCloseTo(0.75, 2);
  });

  it('should calculate Endless Loop specifications for Level > 36', () => {
    const configL37 = PipeManiaLevelSpecs.getLevelConfig(37);
    expect(configL37.loopRound).toBe(1);
    expect(configL37.baseLevel).toBe(1);
    expect(configL37.delaySeconds).toBeCloseTo(27.0, 1);
    expect(configL37.flowIntervalMs).toBe(2700); // 3000 * 0.9 = 2700

    const configL72 = PipeManiaLevelSpecs.getLevelConfig(72);
    expect(configL72.loopRound).toBe(1);
    expect(configL72.baseLevel).toBe(36);
    expect(configL72.delaySeconds).toBeCloseTo(9.0, 1);
    expect(configL72.flowIntervalMs).toBe(900); // 1000 * 0.9 = 900

    const configL180 = PipeManiaLevelSpecs.getLevelConfig(180); // BaseLevel 36 in Loop 4
    expect(configL180.delaySeconds).toBeCloseTo(6.6, 1);
    expect(configL180.flowIntervalMs).toBeGreaterThanOrEqual(600); // Clamped to 600ms floor
  });
});
