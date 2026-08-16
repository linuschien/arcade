import { describe, it, expect } from 'vitest';
import { PipeManiaLevelSpecs } from '../logic/PipeManiaLevelSpecs';

describe('PipeManiaLevelSpecs Unit Tests', () => {
  it('should match sample specifications for Level 1', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(1);
    expect(config.level).toBe(1);
    expect(config.delaySeconds).toBe(20.0);
    expect(config.flowIntervalMs).toBe(2500);
    expect(config.reservoirIntervalMs).toBe(15000);
    expect(config.targetLength).toBe(10);
    expect(config.obstacleCount).toBe(0);
    expect(config.presetPipeCount).toBe(0);
    expect(config.manhattanDistance).toBe(6);
    expect(config.endOrientationMode).toBe('FACING');
    expect(config.dropRates.pOneWay).toBe(0);
    expect(config.dropRates.pReservoir).toBeCloseTo(0.15, 4);
    expect(config.dropRates.pStandard).toBeCloseTo(0.85, 4);
  });

  it('should match sample specifications for Level 5', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(5);
    expect(config.delaySeconds).toBeCloseTo(18.4, 1);
    expect(config.flowIntervalMs).toBe(2300); // 2500 - 50 * 4 = 2300ms
    expect(config.reservoirIntervalMs).toBe(2300 * 6.0); // 13800ms
    expect(config.targetLength).toBe(12); // 10 + floor(0.58*4) = 12
    expect(config.obstacleCount).toBe(0); // floor(0.18*4) = 0
    expect(config.presetPipeCount).toBe(0); // floor(0.19*2) = 0
    expect(config.manhattanDistance).toBe(5); // floor(6 - 0.11*4) = 5
    expect(config.endOrientationMode).toBe('FACING');
  });

  it('should match sample specifications for Level 9', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(9);
    expect(config.delaySeconds).toBeCloseTo(16.8, 1);
    expect(config.flowIntervalMs).toBe(2100); // 2500 - 50 * 8 = 2100ms
    expect(config.reservoirIntervalMs).toBe(2100 * 6.0); // 12600ms
    expect(config.targetLength).toBe(14); // 10 + floor(0.58*8) = 14
    expect(config.obstacleCount).toBe(1); // floor(0.18*8) = 1
    expect(config.presetPipeCount).toBe(1); // floor(0.19*6) = 1
    expect(config.manhattanDistance).toBe(5); // floor(6 - 0.11*8) = 5
    expect(config.endOrientationMode).toBe('ORTHOGONAL');
    expect(config.dropRates.pOneWay).toBeCloseTo(0.0072 * 1, 4);
  });

  it('should match sample specifications for Level 21', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(21);
    expect(config.delaySeconds).toBeCloseTo(12.0, 1);
    expect(config.flowIntervalMs).toBe(1500); // 2500 - 50 * 20 = 1500ms
    expect(config.reservoirIntervalMs).toBe(1500 * 6.0); // 9000ms
    expect(config.targetLength).toBe(21); // 10 + floor(0.58*20) = 21
    expect(config.obstacleCount).toBe(3); // floor(0.18*20) = 3
    expect(config.presetPipeCount).toBe(3); // floor(0.19*18) = 3
    expect(config.manhattanDistance).toBe(3); // floor(6 - 0.11*20) = 3
    expect(config.endOrientationMode).toBe('AWAY');
  });

  it('should match sample specifications for Level 36', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(36);
    expect(config.delaySeconds).toBe(6.0);
    expect(config.flowIntervalMs).toBe(800);
    expect(config.reservoirIntervalMs).toBe(4800);
    expect(config.targetLength).toBe(30); // max 30
    expect(config.obstacleCount).toBe(6); // max 6
    expect(config.presetPipeCount).toBe(6); // max 6
    expect(config.manhattanDistance).toBe(2); // max(2, floor(6 - 0.11*35)) = 2
    expect(config.endOrientationMode).toBe('AWAY');
    expect(config.dropRates.pOneWay).toBeCloseTo(0.20, 2);
    expect(config.dropRates.pReservoir).toBeCloseTo(0.05, 2);
    expect(config.dropRates.pStandard).toBeCloseTo(0.75, 2);
  });

  it('should calculate Endless Loop specifications for Level > 36', () => {
    const configL37 = PipeManiaLevelSpecs.getLevelConfig(37);
    expect(configL37.loopRound).toBe(1);
    expect(configL37.baseLevel).toBe(1);
    expect(configL37.delaySeconds).toBeCloseTo(18.0, 1);
    expect(configL37.flowIntervalMs).toBe(2250); // 2500 * 0.9 = 2250

    const configL72 = PipeManiaLevelSpecs.getLevelConfig(72);
    expect(configL72.loopRound).toBe(1);
    expect(configL72.baseLevel).toBe(36);
    expect(configL72.delaySeconds).toBeCloseTo(5.4, 1);
    expect(configL72.flowIntervalMs).toBe(720); // 800 * 0.9 = 720

    const configL180 = PipeManiaLevelSpecs.getLevelConfig(180); // BaseLevel 36 in Loop 4
    expect(configL180.delaySeconds).toBe(4.0); // Clamped to 4.0s floor
    expect(configL180.flowIntervalMs).toBeGreaterThanOrEqual(500); // Clamped to 500ms floor
  });
});
