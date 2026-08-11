import { describe, it, expect } from 'vitest';
import { getLevelSpec } from '../logic/PacmanLevelSpecs';

describe('PacmanLevelSpecs Unit Tests', () => {
  it('should return correct Level 1 specs with linear initial speed ratios and exit delays', () => {
    const spec = getLevelSpec(1);
    expect(spec.level).toBe(1);
    expect(spec.fruit).toBe('Cherry');
    expect(spec.fruitScore).toBe(100);
    expect(spec.pacmanSpeedRatio).toBe(0.85);
    expect(spec.pacmanFrightSpeedRatio).toBe(0.952);
    expect(spec.ghostSpeedRatio).toBe(0.68);
    expect(spec.ghostFrightSpeedRatio).toBe(0.408);
    expect(spec.ghostTunnelSpeedRatio).toBe(0.34);
    expect(spec.ghostExitDelaysSec).toEqual({ pinky: 2.0, inky: 5.0, clyde: 10.0 });
    expect(spec.frightDurationSec).toBe(6.0);
    expect(spec.frightFlashCount).toBe(5);
    expect(spec.timerArraySec).toEqual([7, 20, 7, 20, 5, 20, 5, Infinity]);
  });

  it('should return correct Level 9 specs with linear mid-point speed ratios and exit delays', () => {
    const spec = getLevelSpec(9);
    expect(spec.fruit).toBe('Galaxian');
    expect(spec.fruitScore).toBe(2000);
    expect(spec.pacmanSpeedRatio).toBe(0.925);
    expect(spec.ghostSpeedRatio).toBe(0.82);
    expect(spec.ghostExitDelaysSec).toEqual({ pinky: 1.1, inky: 2.9, clyde: 6.0 });
    expect(spec.frightDurationSec).toBe(1.0);
    expect(spec.frightFlashCount).toBe(3);
  });

  it('should enforce Level 17+ specs with max speed ratios and min exit delays', () => {
    const spec17 = getLevelSpec(17);
    expect(spec17.fruit).toBe('Key');
    expect(spec17.fruitScore).toBe(5000);
    expect(spec17.pacmanSpeedRatio).toBe(1.0);
    expect(spec17.ghostSpeedRatio).toBe(0.96);
    expect(spec17.ghostFrightSpeedRatio).toBe(0.576);
    expect(spec17.ghostTunnelSpeedRatio).toBe(0.48);
    expect(spec17.ghostExitDelaysSec).toEqual({ pinky: 0.2, inky: 0.8, clyde: 2.0 });
    expect(spec17.frightDurationSec).toBe(0.0);
    expect(spec17.frightFlashCount).toBe(0);

    const spec25 = getLevelSpec(25);
    expect(spec25.pacmanSpeedRatio).toBe(1.0);
    expect(spec25.ghostSpeedRatio).toBe(0.96);
    expect(spec25.frightDurationSec).toBe(0.0);
    expect(spec25.frightFlashCount).toBe(0);
  });
});
