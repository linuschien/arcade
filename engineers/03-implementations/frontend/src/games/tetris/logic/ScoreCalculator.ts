/**
 * ScoreCalculator.ts
 * Pure TypeScript implementation for Tetris scoring, level progression, and casual speed curve.
 */

export interface ScoreState {
  score: number;
  lines: number;
  level: number;
}

export class ScoreCalculator {
  private score: number = 0;
  private lines: number = 0;
  private level: number = 1;

  // Level 1 to 15 speed curve table (in milliseconds)
  private static readonly DROP_INTERVALS: Record<number, number> = {
    1: 1000,
    2: 900,
    3: 800,
    4: 700,
    5: 600,
    6: 550,
    7: 500,
    8: 450,
    9: 400,
    10: 350,
    11: 300,
    12: 250,
    13: 230,
    14: 210,
    15: 200, // Capped at Level 15 (200ms)
  };

  constructor(initialLevel: number = 1) {
    this.level = Math.max(1, Math.min(15, initialLevel));
  }

  /**
   * Calculate points gained from line clears and update line count & level.
   */
  public addLineClears(count: number): number {
    if (count <= 0) return 0;

    let basePoints = 0;
    switch (count) {
      case 1:
        basePoints = 100;
        break;
      case 2:
        basePoints = 300;
        break;
      case 3:
        basePoints = 500;
        break;
      case 4:
        basePoints = 800;
        break;
      default:
        basePoints = 800 + (count - 4) * 200;
        break;
    }

    const pointsGained = basePoints * this.level;
    this.score += pointsGained;
    this.lines += count;

    // Progression: Level up every 10 lines, up to max cap Level 15
    const newLevel = Math.min(15, 1 + Math.floor(this.lines / 10));
    if (newLevel > this.level) {
      this.level = newLevel;
    }

    return pointsGained;
  }

  /**
   * Add points for Soft Drop (+1 per cell).
   */
  public addSoftDrop(cells: number): void {
    if (cells > 0) {
      this.score += cells * 1;
    }
  }

  /**
   * Add points for Hard Drop (+2 per cell).
   */
  public addHardDrop(cells: number): void {
    if (cells > 0) {
      this.score += cells * 2;
    }
  }

  /**
   * Get drop interval in milliseconds corresponding to current level.
   */
  public getDropInterval(): number {
    const cappedLevel = Math.min(15, Math.max(1, this.level));
    return ScoreCalculator.DROP_INTERVALS[cappedLevel] || 200;
  }

  public getState(): ScoreState {
    return {
      score: this.score,
      lines: this.lines,
      level: this.level,
    };
  }

  public reset(initialLevel: number = 1): void {
    this.score = 0;
    this.lines = 0;
    this.level = Math.max(1, Math.min(15, initialLevel));
  }
}
