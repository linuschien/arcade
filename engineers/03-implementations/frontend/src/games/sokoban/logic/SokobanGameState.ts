/**
 * SokobanGameState.ts
 * Master Game State Machine for Sokoban 50.
 * Orchestrates maze state, movements, snapshots, soft timer, 1.0s hold-to-give-up,
 * deadlock countdowns, life deductions, scoring, and continuation flow.
 */

import { SokobanMaze, Direction, GridPos } from './SokobanMaze';
import { PushActionEngine, ActionResult } from './PushActionEngine';
import { UndoSnapshotStack } from './UndoSnapshotStack';
import { DeadlockDetector, DeadlockReport } from './DeadlockDetector';
import { SokobanScoreKeeper, StageScoreBreakdown } from './SokobanScoreKeeper';
import { LevelCatalog, SokobanStageConfig } from './LevelCatalog';

export type GameStatus =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'DEADLOCK_CRITICAL_PENDING'
  | 'STAGE_CLEAR_FANFARE'
  | 'GAME_OVER'
  | 'ALL_CLEAR';

export interface GameStepEvent {
  actionResult?: ActionResult;
  isUndo?: boolean;
  deadlockReport: DeadlockReport;
  stageCleared?: boolean;
  scoreBreakdown?: StageScoreBreakdown;
  lifeLost?: boolean;
  lifeAwarded?: boolean;
  timeoutTriggered?: boolean;
}

const STORAGE_KEY_MAX_CLEARED = 'arcade:sokoban:maxClearedStage';

export class SokobanGameState {
  public status: GameStatus = 'TITLE_MENU';
  public lives: number = 3;
  public currentStageNumber: number = 1;
  public maxClearedStage: number = 0;

  public maze!: SokobanMaze;
  public undoStack: UndoSnapshotStack = new UndoSnapshotStack(0);
  public scoreKeeper: SokobanScoreKeeper = new SokobanScoreKeeper();
  public currentStageConfig!: SokobanStageConfig;

  public elapsedSeconds: number = 0;
  public softTimeoutFired: boolean = false;

  public giveUpHoldMs: number = 0;
  public isGivingUp: boolean = false;

  private criticalDeadlockDelayMs: number = 0;
  private pendingDeadlockReport: DeadlockReport = {
    isDeadlocked: false,
    status: 'NORMAL',
    deadlockedBoxes: [],
  };

  public getDeadlockReport(): DeadlockReport {
    return this.pendingDeadlockReport;
  }

  constructor() {
    this.loadPersistence();
  }

  private loadPersistence(): void {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_MAX_CLEARED);
      if (saved) {
        this.maxClearedStage = Math.min(LevelCatalog.getTotalStages(), Math.max(0, parseInt(saved, 10) || 0));
      }
    }
  }

  private savePersistence(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_MAX_CLEARED, this.maxClearedStage.toString());
    }
  }

  public startNewGame(): void {
    this.lives = 3;
    this.scoreKeeper.reset();
    this.currentStageNumber = 1;
    this.loadStage(1);
    this.status = 'PLAYING';
  }

  public continueGame(): void {
    this.lives = 3;
    this.scoreKeeper.reset();
    const resumeStage = Math.min(LevelCatalog.getTotalStages(), Math.max(1, this.maxClearedStage + 1));
    this.currentStageNumber = resumeStage;
    this.loadStage(resumeStage);
    this.status = 'PLAYING';
  }

  public loadStage(stageNumber: number): void {
    this.currentStageNumber = stageNumber;
    this.currentStageConfig = LevelCatalog.getStage(stageNumber);
    this.maze = new SokobanMaze(this.currentStageConfig.mapLines);
    this.undoStack.reset(this.currentStageConfig.uQuota);

    this.elapsedSeconds = 0;
    this.softTimeoutFired = false;
    this.giveUpHoldMs = 0;
    this.isGivingUp = false;
    this.criticalDeadlockDelayMs = 0;

    this.pendingDeadlockReport = DeadlockDetector.checkDeadlock(
      this.maze,
      this.undoStack.getRemainingQuota(),
    );
  }

  public retryCurrentStage(): void {
    this.loadStage(this.currentStageNumber);
    this.status = 'PLAYING';
  }

  /**
   * Attempt worker movement in the given direction.
   */
  public stepMove(direction: Direction): GameStepEvent {
    if (this.status !== 'PLAYING') {
      return { deadlockReport: this.pendingDeadlockReport };
    }

    const workerPos = this.maze.getWorkerPos();
    const vec = {
      UP: { col: 0, row: -1 },
      DOWN: { col: 0, row: 1 },
      LEFT: { col: -1, row: 0 },
      RIGHT: { col: 1, row: 0 },
      NONE: { col: 0, row: 0 },
    }[direction];

    const targetPos: GridPos = {
      col: workerPos.col + vec.col,
      row: workerPos.row + vec.row,
    };

    // If target has box, save snapshot *before* executing push
    const willPush = this.maze.hasBox(targetPos.col, targetPos.row);
    if (willPush) {
      this.undoStack.pushSnapshot(this.maze);
    }

    const actionResult = PushActionEngine.tryMove(this.maze, direction);

    // If push failed, discard the speculative snapshot
    if (willPush && !actionResult.success) {
      this.undoStack.discardTopSnapshot();
    }

    const events: GameStepEvent = {
      actionResult,
      deadlockReport: this.pendingDeadlockReport,
    };

    if (actionResult.success) {
      // 1. Check Goal Completion
      if (this.maze.isCompleted()) {
        events.stageCleared = true;
        this.status = 'STAGE_CLEAR_FANFARE';

        const evalResult = this.scoreKeeper.evaluateStageClear(
          this.currentStageNumber,
          this.currentStageConfig.tSoft,
          this.elapsedSeconds,
          this.currentStageConfig.uQuota,
          this.undoStack.getRemainingQuota(),
        );

        events.scoreBreakdown = evalResult.breakdown;
        if (evalResult.newExtends > 0) {
          this.lives += evalResult.newExtends;
          events.lifeAwarded = true;
        }

        if (this.currentStageNumber > this.maxClearedStage) {
          this.maxClearedStage = this.currentStageNumber;
          this.savePersistence();
        }

        return events;
      }

      // 2. Deadlock Check
      this.pendingDeadlockReport = DeadlockDetector.checkDeadlock(
        this.maze,
        this.undoStack.getRemainingQuota(),
      );
      events.deadlockReport = this.pendingDeadlockReport;

      if (this.pendingDeadlockReport.status === 'DEADLOCK_CRITICAL') {
        this.status = 'DEADLOCK_CRITICAL_PENDING';
        this.criticalDeadlockDelayMs = 1200; // 1.2s countdown delay
      }
    }

    return events;
  }

  /**
   * Attempt instant push-granularity Undo.
   */
  public stepUndo(): GameStepEvent {
    if (this.status !== 'PLAYING' && this.status !== 'DEADLOCK_CRITICAL_PENDING') {
      return { deadlockReport: this.pendingDeadlockReport };
    }

    const restored = this.undoStack.undo(this.maze);
    if (restored) {
      // Reset critical deadlock timer if recovered
      this.status = 'PLAYING';
      this.criticalDeadlockDelayMs = 0;

      this.pendingDeadlockReport = DeadlockDetector.checkDeadlock(
        this.maze,
        this.undoStack.getRemainingQuota(),
      );

      return {
        isUndo: true,
        deadlockReport: this.pendingDeadlockReport,
      };
    }

    return {
      isUndo: false,
      deadlockReport: this.pendingDeadlockReport,
    };
  }

  /**
   * Universal 60fps tick timer for soft timer and hold/countdown mechanics.
   */
  public tick(deltaMs: number): GameStepEvent {
    const events: GameStepEvent = {
      deadlockReport: this.pendingDeadlockReport,
    };

    if (this.status === 'PLAYING') {
      this.elapsedSeconds += deltaMs / 1000;
      if (!this.softTimeoutFired && this.elapsedSeconds >= this.currentStageConfig.tSoft) {
        this.softTimeoutFired = true;
        events.timeoutTriggered = true;
      }
    }

    // Critical Deadlock 1.2s execution
    if (this.status === 'DEADLOCK_CRITICAL_PENDING') {
      this.criticalDeadlockDelayMs -= deltaMs;
      if (this.criticalDeadlockDelayMs <= 0) {
        this.deductLifeAndRestart(events);
      }
    }

    // Hold-to-give-up 1.0s execution
    if (this.isGivingUp && (this.status === 'PLAYING' || this.status === 'DEADLOCK_CRITICAL_PENDING')) {
      this.giveUpHoldMs += deltaMs;
      if (this.giveUpHoldMs >= 1000) {
        this.isGivingUp = false;
        this.giveUpHoldMs = 0;
        this.deductLifeAndRestart(events);
      }
    }

    return events;
  }

  public setHoldGiveUp(isHolding: boolean): void {
    this.isGivingUp = isHolding;
    if (!isHolding) {
      this.giveUpHoldMs = 0;
    }
  }

  private deductLifeAndRestart(events: GameStepEvent): void {
    this.lives--;
    events.lifeLost = true;

    if (this.lives <= 0) {
      this.status = 'GAME_OVER';
    } else {
      this.retryCurrentStage();
    }
  }

  public advanceNextStage(): boolean {
    if (this.currentStageNumber >= LevelCatalog.getTotalStages()) {
      this.status = 'ALL_CLEAR';
      return false;
    }
    this.loadStage(this.currentStageNumber + 1);
    this.status = 'PLAYING';
    return true;
  }
}
