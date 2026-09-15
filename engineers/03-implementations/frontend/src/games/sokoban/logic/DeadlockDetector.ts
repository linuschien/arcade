/**
 * DeadlockDetector.ts
 * Strict Orthogonal Corner Trap & Deadlock analysis engine.
 * Identifies unplaced boxes trapped in perpendicular wall/obstacle corners.
 */

import { SokobanMaze, GridPos, posKey } from './SokobanMaze';

export type DeadlockStatus = 'NORMAL' | 'DEADLOCK_WARNING' | 'DEADLOCK_CRITICAL';

export interface DeadlockReport {
  isDeadlocked: boolean;
  status: DeadlockStatus;
  deadlockedBoxes: GridPos[];
}

export class DeadlockDetector {
  /**
   * Evaluates the maze for any strict orthogonal corner deadlocks.
   * A box not on a goal is deadlocked if two adjacent perpendicular sides are impassable.
   */
  public static checkDeadlock(maze: SokobanMaze, remainingUndoQuota: number): DeadlockReport {
    const deadlockedSet = new Set<string>();
    const boxes = maze.getBoxPositions();

    // Iterate until fixpoint to account for cascade box-against-box corner traps
    let newlyAdded = true;
    while (newlyAdded) {
      newlyAdded = false;

      for (const box of boxes) {
        const bKey = posKey(box.col, box.row);
        if (deadlockedSet.has(bKey)) continue;

        // Boxes safely placed on goal points are exempt from corner traps
        if (maze.isGoal(box.col, box.row)) continue;

        const isObstacle = (c: number, r: number): boolean => {
          if (!maze.isInBounds(c, r)) return true;
          if (maze.isWall(c, r)) return true;
          if (deadlockedSet.has(posKey(c, r))) return true;
          return false;
        };

        const upBlocked = isObstacle(box.col, box.row - 1);
        const downBlocked = isObstacle(box.col, box.row + 1);
        const leftBlocked = isObstacle(box.col - 1, box.row);
        const rightBlocked = isObstacle(box.col + 1, box.row);

        // Check 4 perpendicular corner combinations
        const isCornerTrapped =
          (upBlocked && leftBlocked) ||
          (upBlocked && rightBlocked) ||
          (downBlocked && leftBlocked) ||
          (downBlocked && rightBlocked);

        if (isCornerTrapped) {
          deadlockedSet.add(bKey);
          newlyAdded = true;
        }
      }
    }

    const deadlockedBoxes = boxes.filter((b) => deadlockedSet.has(posKey(b.col, b.row)));
    const isDeadlocked = deadlockedBoxes.length > 0;

    let status: DeadlockStatus = 'NORMAL';
    if (isDeadlocked) {
      status = remainingUndoQuota > 0 ? 'DEADLOCK_WARNING' : 'DEADLOCK_CRITICAL';
    }

    return {
      isDeadlocked,
      status,
      deadlockedBoxes,
    };
  }
}

