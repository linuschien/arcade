/**
 * SokobanGameState.test.ts
 * Verifies game state transitions, movement, undo, soft timer, 1.0s hold give-up,
 * deadlock countdowns, life deduction, and stage clearance.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SokobanGameState } from '../logic/SokobanGameState';
import { Direction } from '../logic/SokobanMaze';

describe('SokobanGameState Unit Tests', () => {
  let state: SokobanGameState;

  beforeEach(() => {
    state = new SokobanGameState();
  });

  it('should initialize into TITLE_MENU with 3 lives and load stage 1 on startNewGame', () => {
    expect(state.status).toBe('TITLE_MENU');
    expect(state.lives).toBe(3);

    state.startNewGame();
    expect(state.status).toBe('PLAYING');
    expect(state.currentStageNumber).toBe(1);
    expect(state.maze.getBoxCount()).toBe(1);
    expect(state.undoStack.getRemainingQuota()).toBe(2);
  });

  it('should clear stage 1 when box is pushed onto goal', () => {
    state.startNewGame();
    // Stage 1 (Microban #44):
    // 5x3 map:
    // #####
    // #@$.#
    // #####
    // Push RIGHT once moves box onto goal
    const event = state.stepMove(Direction.RIGHT);
    expect(event.actionResult?.success).toBe(true);
    expect(event.actionResult?.isPush).toBe(true);
    expect(event.actionResult?.boxPlacedOnGoal).toBe(true);
    expect(event.stageCleared).toBe(true);
    expect(state.status).toBe('STAGE_CLEAR_FANFARE');
    expect(state.maxClearedStage).toBe(1);
    expect(event.scoreBreakdown?.stageTotal).toBeGreaterThan(0);
  });

  it('should execute instant undo and restore coordinates on box push', () => {
    state.startNewGame();
    // Load Stage 2 where there are 2 boxes and 1 push does not clear the level
    state.loadStage(2);
    state.status = 'PLAYING';

    // Navigate worker: (5,3) -> UP (5,2) -> UP (5,1) -> LEFT (4,1) -> LEFT (3,1) -> DOWN (3,2)
    state.stepMove(Direction.UP);
    state.stepMove(Direction.UP);
    state.stepMove(Direction.LEFT);
    state.stepMove(Direction.LEFT);
    state.stepMove(Direction.DOWN);

    expect(state.maze.getWorkerPos()).toEqual({ col: 3, row: 2 });
    expect(state.undoStack.getUsedCount()).toBe(0); // Pure walking did not use undo quota!

    // Push box down from (3,3) to (3,4)
    const pushEvent = state.stepMove(Direction.DOWN);
    expect(pushEvent.actionResult?.success).toBe(true);
    expect(pushEvent.actionResult?.isPush).toBe(true);
    expect(state.maze.getWorkerPos()).toEqual({ col: 3, row: 3 });
    expect(state.maze.hasBox(3, 4)).toBe(true);
    expect(state.status).toBe('PLAYING');

    // Execute instant undo
    const undoEvent = state.stepUndo();
    expect(undoEvent.isUndo).toBe(true);
    expect(state.maze.getWorkerPos()).toEqual({ col: 3, row: 2 });
    expect(state.maze.hasBox(3, 3)).toBe(true);
    expect(state.undoStack.getUsedCount()).toBe(1);
  });

  it('should handle soft timer countdown without stopping gameplay', () => {
    state.startNewGame();
    const tSoft = state.currentStageConfig.tSoft;

    // Advance tick by tSoft seconds
    const event = state.tick(tSoft * 1000);
    expect(event.timeoutTriggered).toBe(true);
    expect(state.softTimeoutFired).toBe(true);
    expect(state.status).toBe('PLAYING'); // Gameplay continues uninterrupted!
  });

  it('should deduct life and restart when holding [R] for 1.0 second', () => {
    state.startNewGame();
    expect(state.lives).toBe(3);

    state.setHoldGiveUp(true);
    state.tick(500); // 0.5s
    expect(state.lives).toBe(3);

    const event = state.tick(500); // reaches 1.0s!
    expect(event.lifeLost).toBe(true);
    expect(state.lives).toBe(2);
    expect(state.status).toBe('PLAYING');
  });

  it('should trigger GAME_OVER when all lives are exhausted', () => {
    state.startNewGame();
    state.lives = 1;

    state.setHoldGiveUp(true);
    state.tick(1000);
    expect(state.lives).toBe(0);
    expect(state.status).toBe('GAME_OVER');
  });

  it('should cancel give up when releasing [R] key before 1.0 second', () => {
    state.startNewGame();
    state.setHoldGiveUp(true);
    state.tick(600);
    expect(state.giveUpHoldMs).toBe(600);

    state.setHoldGiveUp(false);
    expect(state.isGivingUp).toBe(false);
    expect(state.giveUpHoldMs).toBe(0);
  });

  it('should continue game from next uncleared stage', () => {
    state.maxClearedStage = 5;
    state.continueGame();
    expect(state.currentStageNumber).toBe(6);
    expect(state.status).toBe('PLAYING');
  });

  it('should advance stages and declare ALL_CLEAR at stage 50', () => {
    state.startNewGame();
    state.loadStage(49);
    expect(state.advanceNextStage()).toBe(true);
    expect(state.currentStageNumber).toBe(50);

    expect(state.advanceNextStage()).toBe(false);
    expect(state.status).toBe('ALL_CLEAR');
  });

  it('should execute retryCurrentStage and ignore moves when not PLAYING', () => {
    state.startNewGame();
    state.status = 'TITLE_MENU';
    const ignored = state.stepMove(Direction.UP);
    expect(ignored.actionResult).toBeUndefined();

    state.retryCurrentStage();
    expect(state.status).toBe('PLAYING');

    const emptyUndo = state.stepUndo();
    expect(emptyUndo.isUndo).toBe(false);
  });

  it('should deduct life when critical deadlock countdown reaches 0', () => {
    state.startNewGame();
    // Simulate critical deadlock state
    state.status = 'DEADLOCK_CRITICAL_PENDING';
    (state as any).criticalDeadlockDelayMs = 1200;

    state.tick(600);
    expect(state.lives).toBe(3);

    const event = state.tick(700); // 1300ms total -> countdown reached 0
    expect(event.lifeLost).toBe(true);
    expect(state.lives).toBe(2);
  });
});
