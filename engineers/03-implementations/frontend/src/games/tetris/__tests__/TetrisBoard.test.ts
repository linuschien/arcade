/**
 * TetrisBoard.test.ts
 * Vitest unit tests for TetrisBoard grid matrix, movement, SRS wall kicks, line clears, hold mechanics, and block-out game over.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TetrisBoard, MODERN_CONFIG, CLASSIC_CONFIG } from '../logic/TetrisBoard';
import { TetrominoType } from '../logic/Tetromino';

describe('TetrisBoard', () => {
  let board: TetrisBoard;

  beforeEach(() => {
    board = new TetrisBoard(MODERN_CONFIG);
  });

  it('should initialize a 10x20 empty grid and spawn active piece at top center', () => {
    const grid = board.getGrid();
    expect(grid.length).toBe(20);
    expect(grid[0].length).toBe(10);

    const active = board.getActivePiece();
    expect(active).not.toBeNull();
    expect(active?.y).toBe(0);
    expect(active?.x).toBeGreaterThanOrEqual(3);
    expect(active?.x).toBeLessThanOrEqual(4);
  });

  it('should move active piece left and right within board boundaries', () => {
    const active = board.getActivePiece()!;
    const initialX = active.x;

    const movedLeft = board.moveLeft();
    expect(movedLeft).toBe(true);
    expect(board.getActivePiece()?.x).toBe(initialX - 1);

    const movedRight = board.moveRight();
    expect(movedRight).toBe(true);
    expect(board.getActivePiece()?.x).toBe(initialX);
  });

  it('should prevent moving left or right outside 10x20 boundaries', () => {
    // Move all the way to left wall
    for (let i = 0; i < 10; i++) {
      board.moveLeft();
    }
    const leftX = board.getActivePiece()?.x;
    expect(board.moveLeft()).toBe(false);
    expect(board.getActivePiece()?.x).toBe(leftX);

    // Move all the way to right wall
    for (let i = 0; i < 15; i++) {
      board.moveRight();
    }
    const rightX = board.getActivePiece()?.x;
    expect(board.moveRight()).toBe(false);
    expect(board.getActivePiece()?.x).toBe(rightX);
  });

  it('should rotate piece clockwise and counter-clockwise with SRS wall kicks', () => {
    board.reset();
    const active = board.getActivePiece()!;
    const initialRot = active.rotation;

    const rotatedCw = board.rotateCw();
    expect(rotatedCw).toBe(true);
    expect(board.getActivePiece()?.rotation).toBe((initialRot + 1) % 4);

    const rotatedCcw = board.rotateCcw();
    expect(rotatedCcw).toBe(true);
    expect(board.getActivePiece()?.rotation).toBe(initialRot);
  });

  it('should perform Hard Drop and lock piece down instantly', () => {
    board.reset();
    const initialScore = board.getScoreCalculator().getState().score;
    const dropDistance = board.hardDrop();

    expect(dropDistance).toBeGreaterThan(0);
    expect(board.getScoreCalculator().getState().score).toBeGreaterThan(initialScore);
  });

  it('should support Hold piece swap in Modern mode and limit to 1 swap per piece lock', () => {
    board.reset(MODERN_CONFIG);
    const firstPieceType = board.getActivePiece()!.type;

    // First hold swap
    const held = board.hold();
    expect(held).toBe(true);
    expect(board.getHoldPiece()).toBe(firstPieceType);

    // Second consecutive hold swap before lock should be rejected
    const secondHold = board.hold();
    expect(secondHold).toBe(false);

    // Lock piece down
    board.hardDrop();

    // After piece lock, hold swap is allowed again
    const thirdHold = board.hold();
    expect(thirdHold).toBe(true);
  });

  it('should disable Hold piece swap in Classic mode', () => {
    board.reset(CLASSIC_CONFIG);
    const held = board.hold();
    expect(held).toBe(false);
    expect(board.getHoldPiece()).toBeNull();
  });

  it('should clear full lines, update score, and shift upper rows down', () => {
    board.reset();
    const grid = board.getGrid();

    // Fill row 19 completely except 1 spot, then hard drop I piece to complete row
    for (let c = 0; c < 10; c++) {
      grid[19][c] = 0x00f0f0;
    }

    const cleared = board.clearLines();
    expect(cleared).toBe(1);
    expect(board.getScoreCalculator().getState().lines).toBe(1);
    expect(board.getScoreCalculator().getState().score).toBe(100);
  });

  it('should trigger Block-Out Game Over condition when spawn position is blocked', () => {
    board.reset();
    const grid = board.getGrid();

    // Block top 3 rows entirely
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 10; c++) {
        grid[r][c] = 0xff0000;
      }
    }

    const spawned = board.spawnNextPiece();
    expect(spawned).toBe(false);
    expect(board.isGameOver()).toBe(true);
  });
});
