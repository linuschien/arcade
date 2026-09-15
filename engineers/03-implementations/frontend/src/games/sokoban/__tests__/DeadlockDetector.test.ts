/**
 * DeadlockDetector.test.ts
 * Verifies strict orthogonal corner trap detection, goal immunity, and warning vs critical states.
 */

import { describe, it, expect } from 'vitest';
import { SokobanMaze } from '../logic/SokobanMaze';
import { DeadlockDetector } from '../logic/DeadlockDetector';

describe('DeadlockDetector Unit Tests', () => {
  it('should detect top-left, top-right, bottom-left, and bottom-right corner traps', () => {
    // 4 boxes trapped in 4 corners of an empty room
    const cornerMap = [
      '######',
      '#$  $#',
      '#    #',
      '#$  $#',
      '######',
    ];
    const maze = new SokobanMaze(cornerMap);

    const reportWarning = DeadlockDetector.checkDeadlock(maze, 3);
    expect(reportWarning.isDeadlocked).toBe(true);
    expect(reportWarning.status).toBe('DEADLOCK_WARNING');
    expect(reportWarning.deadlockedBoxes.length).toBe(4);

    const reportCritical = DeadlockDetector.checkDeadlock(maze, 0);
    expect(reportCritical.isDeadlocked).toBe(true);
    expect(reportCritical.status).toBe('DEADLOCK_CRITICAL');
  });

  it('should grant immunity to boxes placed on goal points in corners', () => {
    // Top-left has a goal with a box on it ('*')
    const goalCornerMap = [
      '######',
      '#*   #',
      '#    #',
      '######',
    ];
    const maze = new SokobanMaze(goalCornerMap);

    const report = DeadlockDetector.checkDeadlock(maze, 2);
    expect(report.isDeadlocked).toBe(false);
    expect(report.status).toBe('NORMAL');
    expect(report.deadlockedBoxes.length).toBe(0);
  });

  it('should detect cascading box deadlocks against already trapped boxes', () => {
    // Box 1 at (1,1) is trapped in top-left corner.
    // Box 2 at (2,1) is adjacent to Box 1 and the top wall.
    const cascadeMap = [
      '######',
      '#$$  #',
      '#    #',
      '######',
    ];
    const maze = new SokobanMaze(cascadeMap);

    const report = DeadlockDetector.checkDeadlock(maze, 1);
    expect(report.isDeadlocked).toBe(true);
    expect(report.deadlockedBoxes.length).toBe(2);
  });
});

