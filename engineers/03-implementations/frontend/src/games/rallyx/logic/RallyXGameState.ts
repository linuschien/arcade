/**
 * RallyXGameState.ts
 * Framework-agnostic pure logic state machine for New Rally-X.
 * Manages FSM, Fuel mechanics, Smoke Screen cooldown/puffs, Flag collection & scoring,
 * 1UP life milestones, and level progression according to PRD-05 & US-06.
 */

import { FlagType, RallyXLevelConfig, getRallyXLevelConfig } from './RallyXMaze';

export enum RallyXPlayState {
  READY = 'READY',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  LUCKY_REFILL = 'LUCKY_REFILL', // Gameplay frozen while fuel gauge animates to full
  STAGE_CLEARED = 'STAGE_CLEARED',
  DYING = 'DYING',
  GAME_OVER = 'GAME_OVER',
}

export interface SmokePuff {
  id: string;
  x: number;
  y: number;
  remainingTimeSec: number;
}

export interface FlagCollectResult {
  flagType: FlagType;
  basePoints: number;
  multiplierApplied: boolean;
  totalPoints: number;
  luckyFuelBonus: number;
  isStageClear: boolean;
  stageClearFuelBonus: number;
  isSpecialActivated: boolean;
  isLuckyActivated: boolean;
}

export const MAX_FUEL = 1000;
export const PASSIVE_FUEL_DRAIN_NORMAL = 8.0; // 8 points / second in normal stages
export const SMOKE_FUEL_COST = 30;
export const SMOKE_COOLDOWN_SEC = 0.4;
export const SMOKE_PUFF_DURATION_SEC = 3.5;
export const LUCKY_REFILL_SPEED = 1200; // Fuel points per second during Lucky refill animation (~0.8s)
export const LUCKY_CYCLE_COUNT = 3;
export const LUCKY_CYCLE_DURATION_SEC = 0.35; // 0.35s per cycle, 1.05s total (0 to full 3 times)

export class RallyXGameState {
  private score: number = 0;
  private highScore: number = 0;
  private lives: number = 3;
  private round: number = 1;
  private playState: RallyXPlayState = RallyXPlayState.READY;
  private playTimeSeconds: number = 0;

  // Fuel System
  private fuel: number = MAX_FUEL;
  private luckyCycle: number = 0;
  private luckyCycleTimerSec: number = 0;

  // Smoke System
  private smokeCooldown: number = 0;
  private activeSmokePuffs: SmokePuff[] = [];
  private smokeIdCounter: number = 0;

  // Flag & Scoring System
  private flagsCollectedInRound: number = 0; // Total out of 10
  private flagScoreSequence: number = 0; // Pick index n (1..10), resets to 0 on death
  private isSpecialMultiplierActive: boolean = false; // 2x multiplier from "S" flag

  // 1UP Extend Milestones
  private awardedExtend20k: boolean = false;
  private awardedExtend80k: boolean = false;

  // Level config cache
  private currentLevelConfig: RallyXLevelConfig;

  constructor(initialRound: number = 1, initialHighScore: number = 0) {
    this.round = initialRound;
    this.highScore = initialHighScore;
    this.currentLevelConfig = getRallyXLevelConfig(this.round);
  }

  // --- Getters & Setters ---

  public getScore(): number {
    return this.score;
  }

  public getHighScore(): number {
    return this.highScore;
  }

  public getLives(): number {
    return this.lives;
  }

  public getRound(): number {
    return this.round;
  }

  public getPlayState(): RallyXPlayState {
    return this.playState;
  }

  public setPlayState(state: RallyXPlayState): void {
    this.playState = state;
  }

  public getPlayTimeSeconds(): number {
    return this.playTimeSeconds;
  }

  public getFuel(): number {
    return this.fuel;
  }

  public isFuelEmpty(): boolean {
    return this.fuel <= 0;
  }

  public isSpecialActive(): boolean {
    return this.isSpecialMultiplierActive;
  }

  public getFlagsCollected(): number {
    return this.flagsCollectedInRound;
  }

  public getActiveSmokePuffs(): readonly SmokePuff[] {
    return this.activeSmokePuffs;
  }

  public getSmokeCooldown(): number {
    return this.smokeCooldown;
  }

  public getCurrentLevelConfig(): RallyXLevelConfig {
    return this.currentLevelConfig;
  }

  public isChallengingStage(): boolean {
    return this.currentLevelConfig.isChallengingStage;
  }

  // --- Fuel Mechanics ---

  /**
   * Passive fuel drain during cruising.
   * Challenging Stage has ZERO passive fuel drain.
   */
  public updatePassiveFuel(deltaSec: number): void {
    if (this.playState !== RallyXPlayState.PLAYING) return;
    if (this.isChallengingStage()) return; // PRD 2.7: Zero passive fuel drain in challenging stages

    if (this.fuel > 0) {
      this.fuel = Math.max(0, this.fuel - PASSIVE_FUEL_DRAIN_NORMAL * deltaSec);
    }
  }

  /**
   * Lucky "L" flag 3-cycle rapid fuel refill animation update.
   * Sweeps fuel gauge from 0% to 100% three times (~0.35s per cycle, 1.05s total).
   * Returns true when all 3 cycles complete and tank is locked at MAX_FUEL (1000).
   */
  public updateLuckyRefill(deltaSec: number): boolean {
    if (this.playState !== RallyXPlayState.LUCKY_REFILL) return false;

    let remainingSec = deltaSec;
    while (remainingSec > 0) {
      const timeNeeded = LUCKY_CYCLE_DURATION_SEC - this.luckyCycleTimerSec;
      if (remainingSec >= timeNeeded) {
        remainingSec -= timeNeeded;
        this.luckyCycle++;
        this.luckyCycleTimerSec = 0;
        if (this.luckyCycle >= LUCKY_CYCLE_COUNT) {
          this.fuel = MAX_FUEL;
          this.playState = RallyXPlayState.PLAYING;
          return true;
        }
      } else {
        this.luckyCycleTimerSec += remainingSec;
        remainingSec = 0;
      }
    }

    const progress = Math.min(1.0, this.luckyCycleTimerSec / LUCKY_CYCLE_DURATION_SEC);
    this.fuel = Math.max(1, Math.floor(progress * MAX_FUEL));
    return false;
  }

  /**
   * Refills fuel tank unconditionally to MAX_FUEL (e.g. on respawn or round clear).
   */
  public restoreFullFuel(): void {
    this.fuel = MAX_FUEL;
  }

  // --- Smoke Screen Mechanics ---

  /**
   * Checks whether smoke screen can be activated.
   * Requires Fuel >= 30, Cooldown <= 0, and state === PLAYING.
   */
  public canDeploySmoke(): boolean {
    return (
      this.playState === RallyXPlayState.PLAYING &&
      this.fuel >= SMOKE_FUEL_COST &&
      this.smokeCooldown <= 0
    );
  }

  /**
   * Deploys smoke screen: deducts 30 fuel points and resets 0.4s cooldown.
   * Returns true if successfully triggered.
   */
  public triggerSmokeDeployment(): boolean {
    if (!this.canDeploySmoke()) return false;

    this.fuel -= SMOKE_FUEL_COST;
    this.smokeCooldown = SMOKE_COOLDOWN_SEC;
    return true;
  }

  /**
   * Adds an active smoke puff into the simulation.
   */
  public addSmokePuff(x: number, y: number): SmokePuff {
    const puff: SmokePuff = {
      id: `smoke_${++this.smokeIdCounter}`,
      x,
      y,
      remainingTimeSec: SMOKE_PUFF_DURATION_SEC,
    };
    this.activeSmokePuffs.push(puff);
    return puff;
  }

  /**
   * Updates smoke cooldown timers and active smoke puff durations.
   */
  public updateSmoke(deltaSec: number): void {
    if (this.smokeCooldown > 0) {
      this.smokeCooldown = Math.max(0, this.smokeCooldown - deltaSec);
    }

    if (this.playState === RallyXPlayState.PLAYING || this.playState === RallyXPlayState.LUCKY_REFILL) {
      for (let i = this.activeSmokePuffs.length - 1; i >= 0; i--) {
        this.activeSmokePuffs[i].remainingTimeSec -= deltaSec;
        if (this.activeSmokePuffs[i].remainingTimeSec <= 0) {
          this.activeSmokePuffs.splice(i, 1);
        }
      }
    }
  }

  // --- Scoring & Lives ---

  /**
   * Adds points to total score, updates high score, and checks 20k / 80k 1UP milestones.
   * Returns true if 1UP extra life was awarded.
   */
  public addScore(pts: number): boolean {
    this.score += pts;
    if (this.score > this.highScore) {
      this.highScore = this.score;
    }

    let awarded = false;
    if (!this.awardedExtend20k && this.score >= 20000) {
      this.awardedExtend20k = true;
      if (this.lives < 5) {
        this.lives++;
        awarded = true;
      }
    }

    if (!this.awardedExtend80k && this.score >= 80000) {
      this.awardedExtend80k = true;
      if (this.lives < 5) {
        this.lives++;
        awarded = true;
      }
    }

    return awarded;
  }

  /**
   * Collects a flag and calculates points, bonuses, and state transitions.
   */
  public collectFlag(flagType: FlagType): FlagCollectResult {
    this.flagsCollectedInRound++;
    this.flagScoreSequence++;

    const basePoints = 100 * this.flagScoreSequence;
    const multiplierApplied = this.isSpecialMultiplierActive;
    const totalPoints = multiplierApplied ? basePoints * 2 : basePoints;

    let luckyFuelBonus = 0;
    let isSpecialActivated = false;
    let isLuckyActivated = false;

    // Apply Flag Special Effects
    if (flagType === 'SPECIAL') {
      this.isSpecialMultiplierActive = true;
      isSpecialActivated = true;
    } else if (flagType === 'LUCKY') {
      // Award fuel bonus equal to current remaining fuel (rounded integer)
      luckyFuelBonus = Math.floor(this.fuel);
      isLuckyActivated = true;
      // Enter freeze refill state (runs 3-cycle 0-to-full gauge animation)
      this.playState = RallyXPlayState.LUCKY_REFILL;
      this.luckyCycle = 0;
      this.luckyCycleTimerSec = 0;
    }

    // Award flag score + any lucky fuel bonus
    this.addScore(totalPoints + luckyFuelBonus);

    // Check for Round Clear (10 flags collected)
    const isStageClear = this.flagsCollectedInRound >= 10;
    let stageClearFuelBonus = 0;

    if (isStageClear) {
      this.playState = RallyXPlayState.STAGE_CLEARED;
      // If Stage Clear, remaining fuel bonus is fuel * 10
      stageClearFuelBonus = Math.floor(this.fuel) * 10;
      this.addScore(stageClearFuelBonus);
    }

    return {
      flagType,
      basePoints,
      multiplierApplied,
      totalPoints,
      luckyFuelBonus,
      isStageClear,
      stageClearFuelBonus,
      isSpecialActivated,
      isLuckyActivated,
    };
  }

  /**
   * Handles player death from colliding with an enemy car or rock.
   * Returns true if GAME_OVER, false if remaining lives > 0 (can respawn).
   */
  public handlePlayerDeath(): boolean {
    this.lives--;
    this.activeSmokePuffs = []; // Clear smoke on crash
    this.smokeCooldown = 0;

    if (this.lives <= 0) {
      this.playState = RallyXPlayState.GAME_OVER;
      return true;
    }

    this.playState = RallyXPlayState.DYING;
    return false;
  }

  /**
   * Resets player state after death upon respawning:
   * - Restores fuel to 1000
   * - Resets flag sequence counter to 0 (next flag picked starts at n=1)
   * - Cancels Special "S" 2x multiplier
   * - Collected flags remain collected
   */
  public resetAfterDeath(): void {
    this.restoreFullFuel();
    this.flagScoreSequence = 0;
    this.isSpecialMultiplierActive = false;
    this.playState = RallyXPlayState.PLAYING;
  }

  /**
   * Advances to the next round:
   * - Increments round number
   * - Restores fuel to 1000
   * - Resets flags collected and sequence counter
   * - Resets Special "S" multiplier
   * - Clears smoke puffs
   * - Loads new level config
   */
  public advanceToNextRound(): void {
    this.round++;
    this.currentLevelConfig = getRallyXLevelConfig(this.round);
    this.restoreFullFuel();
    this.flagsCollectedInRound = 0;
    this.flagScoreSequence = 0;
    this.isSpecialMultiplierActive = false;
    this.activeSmokePuffs = [];
    this.smokeCooldown = 0;
    this.playState = RallyXPlayState.READY;
  }

  /**
   * Main game loop update for game state: updates play time and smoke puffs.
   */
  public update(deltaSec: number): void {
    if (this.playState === RallyXPlayState.PLAYING) {
      this.playTimeSeconds += deltaSec;
      this.updatePassiveFuel(deltaSec);
    }
    this.updateSmoke(deltaSec);
  }
}

