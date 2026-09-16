/**
 * SokobanScoreKeeper.test.ts
 * Verifies stage clear evaluation, modulo 100 constraint, 1UP extend triggers,
 * and standard score steganography cases A, B, C, D from PRD Section 4.4.
 */

import { describe, it, expect } from 'vitest';
import { SokobanScoreKeeper } from '../logic/SokobanScoreKeeper';

describe('SokobanScoreKeeper Unit Tests', () => {
  it('should calculate stage clear score with all breakdown items conforming to modulo 100', () => {
    const scoreKeeper = new SokobanScoreKeeper();

    // Stage 1 (W1): T_soft = 60s, t_elapsed = 25s, u_quota = 2, u_remaining = 2
    // pBase = 200
    // remaining = 60 - 25 = 35 -> floor(35/5)*100 = 700
    // pUndo = 2 * 100 = 200
    // pPerf = 100 * (2*1 + 1) = 300
    // total = 200 + 700 + 200 + 300 = 1400
    const result = scoreKeeper.evaluateStageClear(1, 60, 25, 2, 2);

    expect(result.breakdown.pBase).toBe(200);
    expect(result.breakdown.pTime).toBe(700);
    expect(result.breakdown.pUndo).toBe(200);
    expect(result.breakdown.pPerf).toBe(300);
    expect(result.breakdown.stageTotal).toBe(1400);
    expect(result.breakdown.isPerfect).toBe(true);
    expect(result.breakdown.stageTotal % 100).toBe(0);
    expect(scoreKeeper.getRawScore()).toBe(1400);
    expect(scoreKeeper.getLastClearedStage()).toBe(1);
  });

  it('should zero out time bonus and perfect bonus on timeout', () => {
    const scoreKeeper = new SokobanScoreKeeper();

    // Stage 1 (W1): T_soft = 60s, t_elapsed = 75s (timeout!), u_quota = 2, u_remaining = 1
    // pBase = 200
    // pTime = 0
    // pUndo = 100
    // pPerf = 0
    // total = 300
    const result = scoreKeeper.evaluateStageClear(1, 60, 75, 2, 1);
    expect(result.breakdown.pTime).toBe(0);
    expect(result.breakdown.pPerf).toBe(0);
    expect(result.breakdown.stageTotal).toBe(300);
    expect(result.breakdown.isPerfect).toBe(false);
  });

  it('should award 1UP life extend upon crossing 10,000 threshold', () => {
    const scoreKeeper = new SokobanScoreKeeper(9000);
    expect(scoreKeeper.getExtendProgress()).toBeCloseTo(0.9, 1);

    // Add 1400 points -> 10,400 (crosses 10k)
    // Stage 1 (W1, pBase=200, pTime=700, pUndo=200, pPerf=300 = 1400)
    const result = scoreKeeper.evaluateStageClear(1, 60, 25, 2, 2);
    expect(result.newExtends).toBe(1);
    expect(scoreKeeper.getRawScore()).toBe(10400);
    expect(scoreKeeper.getExtendProgress()).toBeCloseTo(0.04, 2);
  });

  describe('PRD Section 4.4 Steganographic Cases', () => {
    it('Case Zero: Died on Stage 1 with 0 points (lastClearedStage = 0, RawScore = 0) -> 0', () => {
      const keeper = new SokobanScoreKeeper(0, 0);
      expect(keeper.getSteganographicScore()).toBe(0);
    });

    it('Case A: Died on Stage 1 (lastClearedStage = 0, RawScore = 800) -> 800', () => {
      const keeper = new SokobanScoreKeeper(800, 0);
      expect(keeper.getSteganographicScore()).toBe(800);
    });

    it('Case B: Died on Stage 3 (lastClearedStage = 2, RawScore = 3200) -> 3202', () => {
      const keeper = new SokobanScoreKeeper(3200, 2);
      expect(keeper.getSteganographicScore()).toBe(3202);
    });

    it('Case C: Died on Stage 14 (lastClearedStage = 13, RawScore = 28400) -> 28413', () => {
      const keeper = new SokobanScoreKeeper(28400, 13);
      expect(keeper.getSteganographicScore()).toBe(28413);
    });

    it('Case D: Stage 50 ALL CLEAR (lastClearedStage = 50, RawScore = 328000) -> 328050', () => {
      const keeper = new SokobanScoreKeeper(328000, 50);
      expect(keeper.getSteganographicScore()).toBe(328050);
    });
  });
});

