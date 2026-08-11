import { describe, it, expect } from 'vitest';
import { getLevelSpec } from '../logic/PacmanLevelSpecs';

describe('PacmanLevelSpecs Unit Tests', () => {
  it('should return correct Level 1 specs per PRD-02', () => {
    const spec = getLevelSpec(1);
    expect(spec.level).toBe(1);
    expect(spec.fruit).toBe('Cherry');
    expect(spec.fruitScore).toBe(100);
    expect(spec.pacmanSpeedRatio).toBe(0.80);
    expect(spec.pacmanFrightSpeedRatio).toBe(0.90);
    expect(spec.ghostSpeedRatio).toBe(0.75);
    expect(spec.ghostFrightSpeedRatio).toBe(0.50);
    expect(spec.ghostTunnelSpeedRatio).toBe(0.40);
    expect(spec.frightDurationSec).toBe(6.0);
    expect(spec.frightFlashCount).toBe(5);
    expect(spec.timerArraySec).toEqual([7, 20, 7, 20, 5, 20, 5, Infinity]);
  });

  it('should return correct Level 2 specs', () => {
    const spec = getLevelSpec(2);
    expect(spec.fruit).toBe('Strawberry');
    expect(spec.fruitScore).toBe(300);
    expect(spec.ghostSpeedRatio).toBe(0.85);
    expect(spec.frightDurationSec).toBe(5.0);
  });

  it('should return correct Level 5 specs', () => {
    const spec = getLevelSpec(5);
    expect(spec.fruit).toBe('Apple');
    expect(spec.fruitScore).toBe(700);
    expect(spec.ghostSpeedRatio).toBe(0.95);
    expect(spec.frightDurationSec).toBe(2.0);
    expect(spec.timerArraySec).toEqual([5, 20, 5, 20, 5, 20, 5, Infinity]);
  });

  it('should return correct Level 9 specs', () => {
    const spec = getLevelSpec(9);
    expect(spec.fruit).toBe('Galaxian');
    expect(spec.fruitScore).toBe(2000);
    expect(spec.frightDurationSec).toBe(1.0);
    expect(spec.frightFlashCount).toBe(3);
  });

  it('should enforce Level 17+ specs (0.0s fright duration and 0 flashes)', () => {
    const spec17 = getLevelSpec(17);
    expect(spec17.fruit).toBe('Key');
    expect(spec17.fruitScore).toBe(5000);
    expect(spec17.ghostSpeedRatio).toBe(0.95);
    expect(spec17.frightDurationSec).toBe(0.0);
    expect(spec17.frightFlashCount).toBe(0);

    const spec25 = getLevelSpec(25);
    expect(spec25.frightDurationSec).toBe(0.0);
    expect(spec25.frightFlashCount).toBe(0);
  });
});
