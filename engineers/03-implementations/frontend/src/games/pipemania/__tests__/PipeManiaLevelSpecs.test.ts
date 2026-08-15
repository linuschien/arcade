import { describe, it, expect } from 'vitest';
import { PipeManiaLevelSpecs } from '../logic/PipeManiaLevelSpecs';

describe('PipeManiaLevelSpecs Unit Tests', () => {
  it('should match sample specifications for Level 1', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(1);
    expect(config.level).toBe(1);
    expect(config.delaySeconds).toBe(10.0);
    expect(config.flowIntervalMs).toBe(1500);
    expect(config.reservoirIntervalMs).toBe(6000);
    expect(config.targetLength).toBe(10);
    expect(config.obstacleCount).toBe(0);
    expect(config.presetPipeCount).toBe(0);
    expect(config.manhattanDistance).toBe(12);
    expect(config.endOrientationMode).toBe('FACING');
  });

  it('should match sample specifications for Level 5', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(5);
    expect(config.delaySeconds).toBe(9.0);
    expect(config.flowIntervalMs).toBe(1500 - 28 * 4); // 1388ms
    expect(config.reservoirIntervalMs).toBe(1388 * 4.0);
    expect(config.targetLength).toBe(13); // 10 + floor(0.85*4) = 13
    expect(config.obstacleCount).toBe(1); // floor(0.35*4) = 1
    expect(config.presetPipeCount).toBe(0); // floor(0.18*2) = 0
    expect(config.manhattanDistance).toBe(10); // floor(12 - 0.28*4) = 10
    expect(config.endOrientationMode).toBe('FACING');
  });

  it('should match sample specifications for Level 9', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(9);
    expect(config.delaySeconds).toBe(8.0);
    expect(config.flowIntervalMs).toBe(1500 - 28 * 8); // 1276ms
    expect(config.targetLength).toBe(16); // 10 + floor(0.85*8) = 16
    expect(config.obstacleCount).toBe(2); // floor(0.35*8) = 2
    expect(config.presetPipeCount).toBe(1); // floor(0.18*6) = 1
    expect(config.manhattanDistance).toBe(9); // floor(12 - 0.28*8) = 9
    expect(config.endOrientationMode).toBe('ORTHOGONAL');
  });

  it('should match sample specifications for Level 21', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(21);
    expect(config.delaySeconds).toBe(5.0);
    expect(config.flowIntervalMs).toBe(1500 - 28 * 20); // 940ms
    expect(config.targetLength).toBe(27);
    expect(config.obstacleCount).toBe(7);
    expect(config.presetPipeCount).toBe(3);
    expect(config.endOrientationMode).toBe('AWAY');
  });

  it('should match sample specifications for Level 36', () => {
    const config = PipeManiaLevelSpecs.getLevelConfig(36);
    expect(config.delaySeconds).toBe(1.25);
    expect(config.flowIntervalMs).toBe(520);
    expect(config.reservoirIntervalMs).toBe(2080);
    expect(config.targetLength).toBe(39); // floor(10 + 0.85*35) = 39
    expect(config.obstacleCount).toBe(12);
    expect(config.presetPipeCount).toBe(5);
    expect(config.manhattanDistance).toBe(2);
    expect(config.endOrientationMode).toBe('AWAY');
  });

  it('should calculate Endless Loop specifications for Level > 36', () => {
    const configL37 = PipeManiaLevelSpecs.getLevelConfig(37);
    expect(configL37.loopRound).toBe(1);
    expect(configL37.baseLevel).toBe(1);
    expect(configL37.delaySeconds).toBeCloseTo(9.0, 1);
    expect(configL37.flowIntervalMs).toBe(1350); // 1500 * 0.9 = 1350

    const configL72 = PipeManiaLevelSpecs.getLevelConfig(72);
    expect(configL72.loopRound).toBe(1);
    expect(configL72.baseLevel).toBe(36);
    expect(configL72.delaySeconds).toBeCloseTo(1.125, 2);
    expect(configL72.flowIntervalMs).toBe(468); // 520 * 0.9 = 468

    const configL180 = PipeManiaLevelSpecs.getLevelConfig(180); // BaseLevel 36 in Loop 4
    expect(configL180.delaySeconds).toBe(1.0); // 1.25 * 0.9^4 = 0.82 -> Clamped to 1.0s floor
    expect(configL180.flowIntervalMs).toBeGreaterThanOrEqual(350); // Clamped to 350ms floor
  });
});
