/**
 * PushActionEngine.ts
 * Kinematics and collision solver for Sokoban worker movements and box pushing.
 * Strictly distinguishes pure worker movements (no snapshot) from box pushes (triggers snapshot).
 */

import { SokobanMaze, Direction, GridPos, DIRECTION_VECTORS } from './SokobanMaze';

export interface ActionResult {
  success: boolean;
  isPush: boolean;
  workerFrom: GridPos;
  workerTo: GridPos;
  boxFrom?: GridPos;
  boxTo?: GridPos;
  boxPlacedOnGoal?: boolean;
}

export class PushActionEngine {
  /**
   * Attempt to move the worker in the specified direction.
   * Mutates the maze if valid and returns action details.
   */
  public static tryMove(maze: SokobanMaze, direction: Direction): ActionResult {
    const vector = DIRECTION_VECTORS[direction];
    if (!vector || (vector.col === 0 && vector.row === 0)) {
      const current = maze.getWorkerPos();
      return {
        success: false,
        isPush: false,
        workerFrom: current,
        workerTo: current,
      };
    }

    const workerFrom = maze.getWorkerPos();
    const workerTo: GridPos = {
      col: workerFrom.col + vector.col,
      row: workerFrom.row + vector.row,
    };

    // 1. Boundary check
    if (!maze.isInBounds(workerTo.col, workerTo.row)) {
      return { success: false, isPush: false, workerFrom, workerTo: workerFrom };
    }

    // 2. Wall collision
    if (maze.isWall(workerTo.col, workerTo.row)) {
      return { success: false, isPush: false, workerFrom, workerTo: workerFrom };
    }

    // 3. Open Floor / Goal Walk (No Box Push)
    if (!maze.hasBox(workerTo.col, workerTo.row)) {
      maze.setWorkerPos(workerTo);
      return {
        success: true,
        isPush: false,
        workerFrom,
        workerTo,
      };
    }

    // 4. Box Push Attempt
    const boxFrom: GridPos = { ...workerTo };
    const boxTo: GridPos = {
      col: boxFrom.col + vector.col,
      row: boxFrom.row + vector.row,
    };

    // Destination of pushed box must be inside bounds, not a wall, and not another box
    if (!maze.isInBounds(boxTo.col, boxTo.row)) {
      return { success: false, isPush: false, workerFrom, workerTo: workerFrom };
    }
    if (maze.isWall(boxTo.col, boxTo.row) || maze.hasBox(boxTo.col, boxTo.row)) {
      return { success: false, isPush: false, workerFrom, workerTo: workerFrom };
    }

    // Execute valid box push and worker step
    maze.moveBox(boxFrom, boxTo);
    maze.setWorkerPos(workerTo);

    const boxPlacedOnGoal = maze.isGoal(boxTo.col, boxTo.row);

    return {
      success: true,
      isPush: true,
      workerFrom,
      workerTo,
      boxFrom,
      boxTo,
      boxPlacedOnGoal,
    };
  }
}

