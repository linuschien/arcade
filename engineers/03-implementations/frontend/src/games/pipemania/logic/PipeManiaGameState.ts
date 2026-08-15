/**
 * PipeManiaGameState.ts
 * Core Game State Machine, Liquid Flow Physics, 5-Slot FIFO Queue,
 * Scoring Matrix, Wrenches Life System, and Fast Forward mechanics.
 */

import {
  GRID_COLS,
  GRID_ROWS,
  QUEUE_SIZE,
  Direction,
  DIRECTION_VECTORS,
  OPPOSITE_DIRECTIONS,
  GridCoord,
  GridCell,
  PipeType,
  PIPE_PORT_CONFIGS,
} from './PipeTypes';
import { PipeRNG } from './PipeRNG';
import { PipeGrid, PlaceResult } from './PipeGrid';
import { PipeManiaLevelSpecs, LevelConfig } from './PipeManiaLevelSpecs';

export enum PlayState {
  STAGE_INTRO = 'STAGE_INTRO',
  READY_COUNTDOWN = 'READY_COUNTDOWN',
  FLOWING = 'FLOWING',
  LEVEL_CLEAR = 'LEVEL_CLEAR',
  LEVEL_FAILED = 'LEVEL_FAILED',
  GAME_OVER = 'GAME_OVER',
}

export enum FailureReason {
  NONE = 'NONE',
  SPILL = 'SPILL',
  UNDERFLOW = 'UNDERFLOW',
}

export interface GameStepEvent {
  type:
    | 'COUNTDOWN_TICK'
    | 'FLOW_START'
    | 'CELL_FILL_START'
    | 'CELL_FILL_PROGRESS'
    | 'CELL_FILLED'
    | 'RESERVOIR_FILL_START'
    | 'LEVEL_CLEAR'
    | 'SPILL'
    | 'UNDERFLOW'
    | 'EXTEND_LIFE'
    | 'GAME_OVER';
  cell?: GridCell;
  scoreGained?: number;
  remainingCountdown?: number;
}

export class PipeManiaGameState {
  private grid: PipeGrid;
  private queue: PipeType[] = [];
  private currentLevel: number = 1;
  private levelConfig!: LevelConfig;
  private playState: PlayState = PlayState.STAGE_INTRO;
  private failureReason: FailureReason = FailureReason.NONE;

  private score: number = 0;
  private nextExtendScoreThreshold: number = 50000;
  private wrenches: number = 3;
  private floodedCount: number = 0;
  private fastForward: boolean = false;

  private stageIntroRemainingMs: number = 1500;
  private countdownRemainingSec: number = 10;
  private lastCountDownIntSec: number = 10;
  private currentHeadCoord: GridCoord | null = null;
  private currentHeadDir: Direction = Direction.NONE;
  private currentCellFlowElapsedMs: number = 0;
  private currentCellRequiredMs: number = 1500;

  // Game statistics
  private totalPipesPlaced: number = 0;
  private totalPipesReplaced: number = 0;
  private totalFlowDurationSec: number = 0;

  private rng: () => number;

  constructor(initialLevel: number = 1, customRng: () => number = Math.random) {
    this.rng = customRng;
    this.grid = new PipeGrid();
    this.currentLevel = Math.max(1, initialLevel);
    this.startLevel(this.currentLevel);
  }

  /**
   * Start or restart a level.
   */
  public startLevel(level: number): void {
    this.currentLevel = Math.max(1, level);
    this.levelConfig = this.grid.generateLevel(this.currentLevel, this.rng);
    this.playState = PlayState.STAGE_INTRO;
    this.stageIntroRemainingMs = 1500;
    this.failureReason = FailureReason.NONE;
    this.floodedCount = 0;
    this.fastForward = false;
    this.countdownRemainingSec = this.levelConfig.delaySeconds;
    this.lastCountDownIntSec = Math.ceil(this.countdownRemainingSec);

    this.currentHeadCoord = null;
    this.currentHeadDir = Direction.NONE;
    this.currentCellFlowElapsedMs = 0;

    // Fill 5-slot queue
    this.queue = [];
    for (let i = 0; i < QUEUE_SIZE; i++) {
      this.queue.push(PipeRNG.getRandomPipe(this.currentLevel, this.rng));
    }
  }

  public getGrid(): PipeGrid {
    return this.grid;
  }

  public getQueue(): PipeType[] {
    return [...this.queue];
  }

  public getActivePipe(): PipeType {
    return this.queue[0] || PipeType.HORIZONTAL;
  }

  public getPlayState(): PlayState {
    return this.playState;
  }

  public getFailureReason(): FailureReason {
    return this.failureReason;
  }

  public getScore(): number {
    return this.score;
  }

  public getWrenches(): number {
    return this.wrenches;
  }

  public getLevel(): number {
    return this.currentLevel;
  }

  public getLevelConfig(): LevelConfig {
    return { ...this.levelConfig };
  }

  public getFloodedCount(): number {
    return this.floodedCount;
  }

  public isFastForwarding(): boolean {
    return this.fastForward;
  }

  public getCountdownRemainingSec(): number {
    return this.countdownRemainingSec;
  }

  public getCurrentHeadCoord(): GridCoord | null {
    return this.currentHeadCoord ? { ...this.currentHeadCoord } : null;
  }

  public setFastForward(active: boolean): void {
    this.fastForward = active;
  }

  /**
   * Place current active pipe on grid cell (col, row).
   */
  public placeActivePipe(col: number, row: number): PlaceResult {
    if (
      this.playState !== PlayState.STAGE_INTRO &&
      this.playState !== PlayState.READY_COUNTDOWN &&
      this.playState !== PlayState.FLOWING
    ) {
      return { success: false, isReplacement: false };
    }

    const activePipe = this.getActivePipe();
    const result = this.grid.placePipe(col, row, activePipe);

    if (result.success) {
      this.totalPipesPlaced++;

      if (result.isReplacement) {
        this.totalPipesReplaced++;
        // Replacement penalty: -50 points (clamped to 0 minimum score)
        this.score = Math.max(0, this.score - 50);
      }

      // Pop and Shift Queue
      this.queue.shift();
      this.queue.push(PipeRNG.getRandomPipe(this.currentLevel, this.rng));
    }

    return result;
  }

  /**
   * Main game tick update loop.
   * Frame-rate independent: accepts deltaMs in milliseconds.
   */
  public update(deltaMs: number): GameStepEvent[] {
    const events: GameStepEvent[] = [];

    if (this.playState === PlayState.STAGE_INTRO) {
      if (this.fastForward) {
        this.stageIntroRemainingMs = 0;
      } else {
        this.stageIntroRemainingMs -= deltaMs;
      }

      if (this.stageIntroRemainingMs <= 0) {
        this.stageIntroRemainingMs = 0;
        this.playState = PlayState.READY_COUNTDOWN;
        this.countdownRemainingSec = this.levelConfig.delaySeconds;
        this.lastCountDownIntSec = Math.ceil(this.countdownRemainingSec);
      }
    } else if (this.playState === PlayState.READY_COUNTDOWN) {
      // If fast forwarding during countdown, skip countdown directly to 0
      if (this.fastForward) {
        this.countdownRemainingSec = 0;
      } else {
        this.countdownRemainingSec -= deltaMs / 1000;
      }

      const currIntSec = Math.ceil(Math.max(0, this.countdownRemainingSec));
      if (currIntSec < this.lastCountDownIntSec && currIntSec > 0) {
        this.lastCountDownIntSec = currIntSec;
        events.push({
          type: 'COUNTDOWN_TICK',
          remainingCountdown: currIntSec,
        });
      }

      if (this.countdownRemainingSec <= 0) {
        this.countdownRemainingSec = 0;
        this.startLiquidFlow(events);
      }
    } else if (this.playState === PlayState.FLOWING) {
      this.totalFlowDurationSec += deltaMs / 1000;
      this.updateLiquidFlow(deltaMs, events);
    }

    return events;
  }

  /**
   * Transition from countdown to liquid flowing from start tile.
   */
  private startLiquidFlow(events: GameStepEvent[]): void {
    this.playState = PlayState.FLOWING;
    const startCoord = this.grid.getStartCoord();
    const startCell = this.grid.getCell(startCoord.col, startCoord.row)!;

    startCell.isFlooded = true;
    startCell.fillProgress = 1.0;
    this.floodedCount = 0;

    const outflowDir = startCell.startOutflowDir || Direction.RIGHT;
    const startVec = DIRECTION_VECTORS[outflowDir];
    const nextCol = startCoord.col + startVec.dx;
    const nextRow = startCoord.row + startVec.dy;

    events.push({ type: 'FLOW_START', cell: startCell });

    this.advanceHeadToCell(nextCol, nextRow, outflowDir, events);
  }

  /**
   * Advances the liquid head to enter target (col, row) moving in entryDir.
   */
  private advanceHeadToCell(col: number, row: number, entryDir: Direction, events: GameStepEvent[]): void {
    const cell = this.grid.getCell(col, row);

    // 1. Boundary check: Out of bounds -> Spill
    if (!cell) {
      this.triggerSpill(events);
      return;
    }

    // 2. Destination is END drain tile
    if (cell.type === PipeType.END) {
      const requiredInDir = cell.endInflowDir || Direction.LEFT;
      if (entryDir === requiredInDir) {
        // Entering from correct port
        cell.isFlooded = true;
        cell.fillProgress = 1.0;

        if (this.floodedCount >= this.levelConfig.targetLength) {
          // Level Clear!
          this.triggerLevelClear(events);
        } else {
          // Underflow: Connected to end before meeting target pipe length
          this.triggerUnderflow(events);
        }
      } else {
        // Collided with end from wrong angle -> Spill
        this.triggerSpill(events);
      }
      return;
    }

    // 3. Destination is empty or obstacle -> Spill
    if (cell.type === PipeType.EMPTY || cell.type === PipeType.OBSTACLE || cell.type === PipeType.START) {
      this.triggerSpill(events);
      return;
    }

    // 4. Verify Pipe Port Connectivity
    const config = PIPE_PORT_CONFIGS[cell.type];
    if (!config || !config.allowedInputs.includes(entryDir)) {
      this.triggerSpill(events);
      return;
    }

    // 5. Check already flooded state
    if (config.isCross) {
      const isHorizontalFlow = entryDir === Direction.RIGHT || entryDir === Direction.LEFT;
      if (isHorizontalFlow && cell.crossHorizontalFlooded) {
        this.triggerSpill(events);
        return;
      }
      if (!isHorizontalFlow && cell.crossVerticalFlooded) {
        this.triggerSpill(events);
        return;
      }
    } else if (cell.isFlooded || cell.isFlooding) {
      this.triggerSpill(events);
      return;
    }

    // Setup new head cell
    const exitDir = config.getExitDirection(entryDir);
    if (!exitDir) {
      this.triggerSpill(events);
      return;
    }

    this.currentHeadCoord = { col, row };
    this.currentHeadDir = exitDir;
    this.currentCellFlowElapsedMs = 0;

    // Calculate required ms for this tile
    const baseFlowMs = this.levelConfig.flowIntervalMs;
    const isReservoir = config.isReservoir === true;
    this.currentCellRequiredMs = isReservoir ? baseFlowMs * 4.0 : baseFlowMs;

    cell.isFlooding = true;
    cell.entryDir = entryDir;
    cell.exitDir = exitDir;
    cell.fillProgress = 0;

    events.push({
      type: isReservoir ? 'RESERVOIR_FILL_START' : 'CELL_FILL_START',
      cell,
    });
  }

  /**
   * Update liquid continuous fill within current head tile.
   */
  private updateLiquidFlow(deltaMs: number, events: GameStepEvent[]): void {
    if (!this.currentHeadCoord) return;

    const cell = this.grid.getCell(this.currentHeadCoord.col, this.currentHeadCoord.row);
    if (!cell) return;

    // Fast Forward speeds up flow by reducing required step interval
    const stepDelta = this.fastForward
      ? deltaMs * (this.currentCellRequiredMs / (cell.type.includes('RESERVOIR') ? 200 : 50))
      : deltaMs;

    this.currentCellFlowElapsedMs += stepDelta;
    const progress = Math.min(1.0, this.currentCellFlowElapsedMs / this.currentCellRequiredMs);
    cell.fillProgress = progress;

    if (cell.type === PipeType.CROSS) {
      const isHoriz = cell.entryDir === Direction.RIGHT || cell.entryDir === Direction.LEFT;
      if (isHoriz) {
        cell.crossHorizontalProgress = progress;
      } else {
        cell.crossVerticalProgress = progress;
      }
    }

    events.push({
      type: 'CELL_FILL_PROGRESS',
      cell,
    });

    if (progress >= 1.0) {
      // Cell completely flooded
      this.onCellFilled(cell, events);
    }
  }

  /**
   * Cell filled handler: awards points, checks extends, and steps to next neighbor.
   */
  private onCellFilled(cell: GridCell, events: GameStepEvent[]): void {
    cell.isFlooding = false;
    cell.isFlooded = true;
    cell.fillProgress = 1.0;

    if (cell.type === PipeType.CROSS) {
      const isHoriz = cell.entryDir === Direction.RIGHT || cell.entryDir === Direction.LEFT;
      if (isHoriz) {
        cell.crossHorizontalFlooded = true;
      } else {
        cell.crossVerticalFlooded = true;
      }
    }

    this.floodedCount++;

    // Calculate score
    let baseScore = 50;
    if (cell.type === PipeType.CROSS) baseScore = 100;
    if (cell.type === PipeType.RESERVOIR_HORIZONTAL || cell.type === PipeType.RESERVOIR_VERTICAL) {
      baseScore = 300;
    }

    // Preset fixed pipe bonus (+200)
    if (cell.isPreset) {
      baseScore += 200;
    }

    // Fast forward multiplier (2x)
    const pointsAwarded = this.fastForward ? baseScore * 2 : baseScore;
    this.addScore(pointsAwarded, events);

    events.push({
      type: 'CELL_FILLED',
      cell,
      scoreGained: pointsAwarded,
    });

    // Advance head to next neighbor
    const exitVec = DIRECTION_VECTORS[cell.exitDir];
    const nextCol = cell.col + exitVec.dx;
    const nextRow = cell.row + exitVec.dy;

    this.advanceHeadToCell(nextCol, nextRow, cell.exitDir, events);
  }

  private addScore(points: number, events: GameStepEvent[]): void {
    this.score += points;

    // Check Extend every 50,000 pts (cap 5 wrenches)
    while (this.score >= this.nextExtendScoreThreshold) {
      this.nextExtendScoreThreshold += 50000;
      if (this.wrenches < 5) {
        this.wrenches++;
        events.push({ type: 'EXTEND_LIFE' });
      }
    }
  }

  private triggerLevelClear(events: GameStepEvent[]): void {
    this.playState = PlayState.LEVEL_CLEAR;

    // Extra length bonus (+100 pts per extra pipe beyond N_target)
    const extraPipes = Math.max(0, this.floodedCount - this.levelConfig.targetLength);
    const extraBonus = extraPipes * 100;
    if (extraBonus > 0) {
      this.addScore(extraBonus, events);
    }

    events.push({
      type: 'LEVEL_CLEAR',
      scoreGained: extraBonus,
    });
  }

  private triggerSpill(events: GameStepEvent[]): void {
    this.failureReason = FailureReason.SPILL;
    this.handleFailure(events, 'SPILL');
  }

  private triggerUnderflow(events: GameStepEvent[]): void {
    this.failureReason = FailureReason.UNDERFLOW;
    this.handleFailure(events, 'UNDERFLOW');
  }

  private handleFailure(events: GameStepEvent[], type: 'SPILL' | 'UNDERFLOW'): void {
    this.wrenches--;

    if (this.wrenches > 0) {
      this.playState = PlayState.LEVEL_FAILED;
      events.push({ type });
    } else {
      this.wrenches = 0;
      this.playState = PlayState.GAME_OVER;
      events.push({ type });
      events.push({ type: 'GAME_OVER' });
    }
  }

  /**
   * Retry the current level upon player losing a wrench.
   */
  public retryCurrentLevel(): void {
    if (this.wrenches > 0) {
      this.startLevel(this.currentLevel);
    }
  }

  /**
   * Progress to next level upon level clear.
   */
  public advanceToNextLevel(): void {
    this.startLevel(this.currentLevel + 1);
  }
}
