/**
 * SokobanMaze.test.ts
 * Verifies grid initialization, ASCII map parsing, tile collision, and goal completion checks.
 */

import { describe, it, expect } from 'vitest';
import { SokobanMaze } from '../logic/SokobanMaze';

describe('SokobanMaze Unit Tests', () => {
  const sampleMap = [
    '#####',
    '#@$.#',
    '#####',
  ];

  it('should correctly parse ASCII board elements and dimensions', () => {
    const maze = new SokobanMaze(sampleMap);
    expect(maze.width).toBe(5);
    expect(maze.height).toBe(3);

    expect(maze.getWorkerPos()).toEqual({ col: 1, row: 1 });
    expect(maze.getBoxCount()).toBe(1);
    expect(maze.getGoalCount()).toBe(1);

    expect(maze.isWall(0, 0)).toBe(true);
    expect(maze.isWall(1, 1)).toBe(false);
    expect(maze.hasBox(2, 1)).toBe(true);
    expect(maze.isGoal(3, 1)).toBe(true);
    expect(maze.isWalkable(1, 1)).toBe(true); // worker cell is free floor
  });

  it('should parse box on goal (*) and worker on goal (+)', () => {
    const mapWithGoalStates = [
      '####',
      '#+*#',
      '####',
    ];
    const maze = new SokobanMaze(mapWithGoalStates);
    expect(maze.getWorkerPos()).toEqual({ col: 1, row: 1 });
    expect(maze.isGoal(1, 1)).toBe(true);
    expect(maze.hasBox(2, 1)).toBe(true);
    expect(maze.isGoal(2, 1)).toBe(true);
    expect(maze.getGoalCount()).toBe(2);
    expect(maze.getBoxCount()).toBe(1);
    expect(maze.getCompletedBoxCount()).toBe(1);
    expect(maze.isCompleted()).toBe(false); // 1 out of 2 goals filled
  });

  it('should accurately evaluate completion status', () => {
    const maze = new SokobanMaze(sampleMap);
    expect(maze.isCompleted()).toBe(false);
    expect(maze.getCompletedBoxCount()).toBe(0);

    // Move box to goal
    maze.moveBox({ col: 2, row: 1 }, { col: 3, row: 1 });
    expect(maze.isCompleted()).toBe(true);
    expect(maze.getCompletedBoxCount()).toBe(1);
  });

  it('should support cloning and independent state mutation', () => {
    const maze = new SokobanMaze(sampleMap);
    const cloned = maze.clone();

    cloned.setWorkerPos({ col: 4, row: 4 });
    cloned.moveBox({ col: 2, row: 1 }, { col: 3, row: 1 });

    expect(maze.getWorkerPos()).toEqual({ col: 1, row: 1 });
    expect(maze.hasBox(2, 1)).toBe(true);
    expect(cloned.getWorkerPos()).toEqual({ col: 4, row: 4 });
    expect(cloned.hasBox(3, 1)).toBe(true);
    expect(cloned.isFloor(1, 1)).toBe(true);
  });

  it('should distinguish interior playable floor from exterior void', () => {
    const paddedMap = [
      '  ####',
      '  #  #',
      '###@ #',
      '#  $.#',
      '######',
    ];
    const maze = new SokobanMaze(paddedMap);

    // Exterior void (top-left empty spaces outside walls)
    expect(maze.isOutside(0, 0)).toBe(true);
    expect(maze.isOutside(1, 0)).toBe(true);
    expect(maze.isOutside(0, 1)).toBe(true);
    expect(maze.isOutside(1, 1)).toBe(true);
    expect(maze.isFloor(0, 0)).toBe(false);
    expect(maze.isFloor(1, 0)).toBe(false);

    // Walls
    expect(maze.isWall(2, 0)).toBe(true);
    expect(maze.isFloor(2, 0)).toBe(false);
    expect(maze.isOutside(2, 0)).toBe(false);

    // Interior floor / walkway
    expect(maze.isFloor(3, 1)).toBe(true);
    expect(maze.isOutside(3, 1)).toBe(false);
    expect(maze.isFloor(3, 2)).toBe(true); // worker cell
    expect(maze.isFloor(3, 3)).toBe(true); // box cell
    expect(maze.isFloor(4, 3)).toBe(true); // goal cell

    // Out of bounds checks
    expect(maze.isOutside(-1, -1)).toBe(true);
    expect(maze.isFloor(-1, -1)).toBe(false);
    expect(maze.isOutside(10, 10)).toBe(true);
    expect(maze.isFloor(10, 10)).toBe(false);
  });
});
