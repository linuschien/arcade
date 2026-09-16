/**
 * SokobanScoreKeeper.ts
 * Manages stage clear evaluation, modulo 100 anti-pressing integrity,
 * 10,000 points 1UP threshold tracking, and two-digit stage score steganography.
 */

import { getWorldSpecForStage } from './SokobanLevelSpecs';

export const SCORE_EXTEND_INTERVAL = 10000;

export interface StageScoreBreakdown {
  pBase: number;
  pTime: number;
  pUndo: number;
  pPerf: number;
  stageTotal: number;
  isPerfect: boolean;
}

export class SokobanScoreKeeper {
  private rawScore: number = 0;
  private lastClearedStage: number = 0;
  private extendThresholdsCrossed: number = 0;

  constructor(initialScore: number = 0, initialClearedStage: number = 0) {
    this.rawScore = initialScore;
    this.lastClearedStage = initialClearedStage;
    this.extendThresholdsCrossed = Math.floor(this.rawScore / SCORE_EXTEND_INTERVAL);
  }

  /**
   * Evaluates score for clearing a stage according to PRD Section 4.2.
   */
  public evaluateStageClear(
    stageNumber: number,
    tSoft: number,
    elapsedSeconds: number,
    uQuota: number,
    uRemaining: number,
  ): { breakdown: StageScoreBreakdown; newExtends: number } {
    const spec = getWorldSpecForStage(stageNumber);

    // 1. World Base Score: P_base = 200 * W
    const pBase = spec.pBase;

    // 2. Remaining Time Score: floor(max(0, T_soft - t_elapsed) / 5) * 100
    const remainingSeconds = Math.max(0, tSoft - Math.floor(elapsedSeconds));
    const pTime = Math.floor(remainingSeconds / 5) * 100;

    // 3. Saved Undo Score: u_remaining * 100
    const pUndo = Math.max(0, uRemaining) * 100;

    // 4. Perfect Bonus: P_perf = 100 * (2W + 1) if within time and 0 undo used
    const isPerfect = elapsedSeconds < tSoft && uRemaining === uQuota;
    const pPerf = isPerfect ? spec.pPerf : 0;

    const stageTotal = pBase + pTime + pUndo + pPerf;

    // Verify mathematical modulo 100 integrity
    if (stageTotal % 100 !== 0) {
      throw new Error(`[SokobanScoreKeeper] Stage score ${stageTotal} violated modulo 100 constraint.`);
    }

    const previousRaw = this.rawScore;
    this.rawScore += stageTotal;
    this.lastClearedStage = Math.max(this.lastClearedStage, stageNumber);

    // 1UP Extend Check: floor(Score_new / 10,000) > floor(Score_old / 10,000)
    const currentExtends = Math.floor(this.rawScore / SCORE_EXTEND_INTERVAL);
    const newExtends = Math.max(0, currentExtends - this.extendThresholdsCrossed);
    this.extendThresholdsCrossed = currentExtends;

    return {
      breakdown: {
        pBase,
        pTime,
        pUndo,
        pPerf,
        stageTotal,
        isPerfect,
      },
      newExtends,
    };
  }

  public getRawScore(): number {
    return this.rawScore;
  }

  public getLastClearedStage(): number {
    return this.lastClearedStage;
  }

  /**
   * Progress towards next 10,000 points 1UP threshold (0.0 to 1.0).
   */
  public getExtendProgress(): number {
    return (this.rawScore % SCORE_EXTEND_INTERVAL) / SCORE_EXTEND_INTERVAL;
  }

  /**
   * Final Score Steganography encoding (PRD Section 4.4):
   * FinalScore = (floor(RawScore / 100) * 100) + clamp(lastClearedStage, 0, 50)
   */
  public getSteganographicScore(): number {
    if (this.rawScore <= 0) {
      return 0;
    }
    const baseHundred = Math.floor(this.rawScore / 100) * 100;
    const stageCode = Math.max(0, Math.min(this.lastClearedStage, 50));
    return baseHundred + stageCode;
  }

  public reset(): void {
    this.rawScore = 0;
    this.lastClearedStage = 0;
    this.extendThresholdsCrossed = 0;
  }
}

