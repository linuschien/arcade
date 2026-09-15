/**
 * UndoSnapshotStack.test.ts
 * Verifies instant snapshot push, restore, quota decrement, and boundary enforcement.
 */

import { describe, it, expect } from 'vitest';
import { SokobanMaze, Direction } from '../logic/SokobanMaze';
import { PushActionEngine } from '../logic/PushActionEngine';
import { UndoSnapshotStack } from '../logic/UndoSnapshotStack';

describe('UndoSnapshotStack Unit Tests', () => {
  const map = [
    '######',
    '#@$ .#',
    '######',
  ];

  it('should push snapshot, pop snapshot, and restore state instantly', () => {
    const maze = new SokobanMaze(map);
    const undoStack = new UndoSnapshotStack(5);

    expect(undoStack.getRemainingQuota()).toBe(5);
    expect(undoStack.canUndo()).toBe(false);

    // Save snapshot before push
    undoStack.pushSnapshot(maze);
    PushActionEngine.tryMove(maze, Direction.RIGHT);

    expect(maze.getWorkerPos()).toEqual({ col: 2, row: 1 });
    expect(maze.hasBox(3, 1)).toBe(true);
    expect(undoStack.canUndo()).toBe(true);

    // Perform undo
    const restored = undoStack.undo(maze);
    expect(restored).toBe(true);
    expect(maze.getWorkerPos()).toEqual({ col: 1, row: 1 });
    expect(maze.hasBox(2, 1)).toBe(true);
    expect(undoStack.getRemainingQuota()).toBe(4);
    expect(undoStack.getUsedCount()).toBe(1);
  });

  it('should forbid undo when quota is exhausted', () => {
    const maze = new SokobanMaze(map);
    const undoStack = new UndoSnapshotStack(1);

    undoStack.pushSnapshot(maze);
    PushActionEngine.tryMove(maze, Direction.RIGHT);

    // First undo succeeds
    expect(undoStack.undo(maze)).toBe(true);
    expect(undoStack.getRemainingQuota()).toBe(0);

    // Second undo push and attempt
    undoStack.pushSnapshot(maze);
    PushActionEngine.tryMove(maze, Direction.RIGHT);
    expect(undoStack.canUndo()).toBe(false);
    expect(undoStack.undo(maze)).toBe(false);
  });

  it('should support discarding top snapshot without consuming quota', () => {
    const maze = new SokobanMaze(map);
    const undoStack = new UndoSnapshotStack(3);

    undoStack.pushSnapshot(maze);
    expect(undoStack.getStackDepth()).toBe(1);

    undoStack.discardTopSnapshot();
    expect(undoStack.getStackDepth()).toBe(0);
    expect(undoStack.getRemainingQuota()).toBe(3);
    expect(undoStack.getMaxQuota()).toBe(3);
    expect(undoStack.undo(maze)).toBe(false);
  });
});
