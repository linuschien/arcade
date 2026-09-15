/**
 * PushActionEngine.test.ts
 * Verifies kinematics, walking vs pushing distinction, wall blocking, and box chaining prevention.
 */

import { describe, it, expect } from 'vitest';
import { SokobanMaze, Direction } from '../logic/SokobanMaze';
import { PushActionEngine } from '../logic/PushActionEngine';

describe('PushActionEngine Unit Tests', () => {
  it('should allow pure walking on empty floor without push flag', () => {
    const map = [
      '#####',
      '#@ .#',
      '#####',
    ];
    const maze = new SokobanMaze(map);

    const result = PushActionEngine.tryMove(maze, Direction.RIGHT);
    expect(result.success).toBe(true);
    expect(result.isPush).toBe(false);
    expect(result.workerTo).toEqual({ col: 2, row: 1 });
    expect(maze.getWorkerPos()).toEqual({ col: 2, row: 1 });
  });

  it('should block walking into walls', () => {
    const map = [
      '###',
      '#@#',
      '###',
    ];
    const maze = new SokobanMaze(map);

    const result = PushActionEngine.tryMove(maze, Direction.UP);
    expect(result.success).toBe(false);
    expect(result.isPush).toBe(false);
    expect(maze.getWorkerPos()).toEqual({ col: 1, row: 1 });
  });

  it('should successfully push a box into empty floor and goal', () => {
    const map = [
      '######',
      '#@$ .#',
      '######',
    ];
    const maze = new SokobanMaze(map);

    // Push box right: worker from (1,1) to (2,1), box from (2,1) to (3,1)
    const result1 = PushActionEngine.tryMove(maze, Direction.RIGHT);
    expect(result1.success).toBe(true);
    expect(result1.isPush).toBe(true);
    expect(result1.workerTo).toEqual({ col: 2, row: 1 });
    expect(result1.boxTo).toEqual({ col: 3, row: 1 });
    expect(result1.boxPlacedOnGoal).toBe(false);

    // Push box right again onto goal: worker from (2,1) to (3,1), box from (3,1) to (4,1)
    const result2 = PushActionEngine.tryMove(maze, Direction.RIGHT);
    expect(result2.success).toBe(true);
    expect(result2.isPush).toBe(true);
    expect(result2.boxPlacedOnGoal).toBe(true);
    expect(maze.isCompleted()).toBe(true);
  });

  it('should block pushing a box into a wall', () => {
    const map = [
      '####',
      '#@$#',
      '####',
    ];
    const maze = new SokobanMaze(map);

    const result = PushActionEngine.tryMove(maze, Direction.RIGHT);
    expect(result.success).toBe(false);
    expect(result.isPush).toBe(false);
    expect(maze.getWorkerPos()).toEqual({ col: 1, row: 1 });
    expect(maze.hasBox(2, 1)).toBe(true);
  });

  it('should block pushing a box into another box', () => {
    const map = [
      '######',
      '#@$$ #',
      '######',
    ];
    const maze = new SokobanMaze(map);

    const result = PushActionEngine.tryMove(maze, Direction.RIGHT);
    expect(result.success).toBe(false);
    expect(result.isPush).toBe(false);
    expect(maze.getWorkerPos()).toEqual({ col: 1, row: 1 });
  });

  it('should return failure when direction is NONE', () => {
    const map = [
      '###',
      '#@#',
      '###',
    ];
    const maze = new SokobanMaze(map);
    const result = PushActionEngine.tryMove(maze, Direction.NONE);
    expect(result.success).toBe(false);
    expect(result.isPush).toBe(false);
  });

  it('should prevent pushing box out of bounds', () => {
    const map = [
      '@$',
    ];
    const maze = new SokobanMaze(map);
    const result = PushActionEngine.tryMove(maze, Direction.RIGHT);
    expect(result.success).toBe(false);
  });
});
