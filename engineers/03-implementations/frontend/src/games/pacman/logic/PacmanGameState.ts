/**
 * PacmanGameState.ts
 * High-level FSM, Score Multipliers, Life Count, Fruit Spawning & Stage Progression.
 */

import { FruitType, LevelSpec, getLevelSpec } from './PacmanLevelSpecs';
import { GridPos } from './PacmanMaze';

export enum PlayState {
  READY = 'READY',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  LEVEL_CLEAR = 'LEVEL_CLEAR',
  DYING = 'DYING',
  GAME_OVER = 'GAME_OVER',
}

export const FRUIT_SPAWN_TILE: GridPos = { col: 13, row: 20 };
export const FRUIT_DURATION_SEC = 9.5;

export interface ActiveFruit {
  type: FruitType;
  score: number;
  gridPos: GridPos;
  remainingTimeSec: number;
}

export class PacmanGameState {
  private score: number = 0;
  private lives: number = 3;
  private level: number = 1;
  private playState: PlayState = PlayState.READY;
  private playTimeSeconds: number = 0;

  private currentSpec: LevelSpec;
  private ghostEatingMultiplierIndex: number = 0; // 0=200, 1=400, 2=800, 3=1600
  private activeFruit: ActiveFruit | null = null;
  private fruitTriggered174: boolean = false;
  private fruitTriggered74: boolean = false;

  constructor(initialLevel: number = 1) {
    this.level = initialLevel;
    this.currentSpec = getLevelSpec(this.level);
  }

  public getScore(): number {
    return this.score;
  }

  public getLives(): number {
    return this.lives;
  }

  public getLevel(): number {
    return this.level;
  }

  public getPlayState(): PlayState {
    return this.playState;
  }

  public setPlayState(state: PlayState): void {
    this.playState = state;
  }

  public getPlayTimeSeconds(): number {
    return this.playTimeSeconds;
  }

  public addPlayTime(deltaSec: number): void {
    if (this.playState === PlayState.PLAYING) {
      this.playTimeSeconds += deltaSec;
    }
  }

  public getCurrentSpec(): LevelSpec {
    return this.currentSpec;
  }

  public getActiveFruit(): ActiveFruit | null {
    return this.activeFruit;
  }

  /**
   * Add score points.
   */
  public addScore(pts: number): void {
    this.score += pts;
  }

  /**
   * Process pellet eating score and check fruit spawn triggers.
   */
  public onEatPellet(remainingPellets: number): void {
    this.addScore(10);
    this.checkFruitSpawnTrigger(remainingPellets);
  }

  public onEatPowerPellet(remainingPellets: number): void {
    this.addScore(50);
    this.resetGhostEatingMultiplier();
    this.checkFruitSpawnTrigger(remainingPellets);
  }

  private checkFruitSpawnTrigger(remainingPellets: number): void {
    if (!this.fruitTriggered174 && remainingPellets <= 174) {
      this.fruitTriggered174 = true;
      this.spawnFruit();
    } else if (!this.fruitTriggered74 && remainingPellets <= 74) {
      this.fruitTriggered74 = true;
      this.spawnFruit();
    }
  }

  private spawnFruit(): void {
    this.activeFruit = {
      type: this.currentSpec.fruit,
      score: this.currentSpec.fruitScore,
      gridPos: { ...FRUIT_SPAWN_TILE },
      remainingTimeSec: FRUIT_DURATION_SEC,
    };
  }

  public updateFruitTimer(deltaSec: number): void {
    if (this.activeFruit) {
      this.activeFruit.remainingTimeSec -= deltaSec;
      if (this.activeFruit.remainingTimeSec <= 0) {
        this.activeFruit = null;
      }
    }
  }

  public consumeFruit(): number | null {
    if (this.activeFruit) {
      const score = this.activeFruit.score;
      this.addScore(score);
      this.activeFruit = null;
      return score;
    }
    return null;
  }

  /**
   * Reset ghost eat multiplier when Frightened Mode starts.
   */
  public resetGhostEatingMultiplier(): void {
    this.ghostEatingMultiplierIndex = 0;
  }

  /**
   * Get score awarded for next eaten ghost in Frightened Mode cycle.
   */
  public eatGhost(): number {
    const scores = [200, 400, 800, 1600];
    const pts = scores[Math.min(this.ghostEatingMultiplierIndex, 3)];
    this.ghostEatingMultiplierIndex++;
    this.addScore(pts);
    return pts;
  }

  /**
   * Handle Pac-Man death. Decrements life count.
   */
  public loseLife(): number {
    this.lives = Math.max(0, this.lives - 1);
    if (this.lives === 0) {
      this.playState = PlayState.GAME_OVER;
    } else {
      this.playState = PlayState.DYING;
    }
    return this.lives;
  }

  /**
   * Advance to next level upon maze clear (244 pellets eaten).
   */
  public advanceLevel(): LevelSpec {
    this.level += 1;
    this.currentSpec = getLevelSpec(this.level);
    this.fruitTriggered174 = false;
    this.fruitTriggered74 = false;
    this.activeFruit = null;
    this.playState = PlayState.READY;
    return this.currentSpec;
  }

  public resetGame(): void {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.playTimeSeconds = 0;
    this.currentSpec = getLevelSpec(1);
    this.fruitTriggered174 = false;
    this.fruitTriggered74 = false;
    this.activeFruit = null;
    this.ghostEatingMultiplierIndex = 0;
    this.playState = PlayState.READY;
  }
}
