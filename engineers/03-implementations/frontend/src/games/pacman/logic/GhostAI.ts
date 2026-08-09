/**
 * GhostAI.ts
 * AI Targeting Formulas and Pathfinding for Blinky, Pinky, Inky, and Clyde.
 */

import { PacmanMaze, Direction, DIRECTION_VECTORS, OPPOSITE_DIRECTIONS, GridPos } from './PacmanMaze';

export enum GhostType {
  BLINKY = 'Blinky', // Red
  PINKY = 'Pinky',   // Pink
  INKY = 'Inky',     // Cyan
  CLYDE = 'Clyde',   // Orange
}

export enum GhostMode {
  SCATTER = 'SCATTER',
  CHASE = 'CHASE',
  FRIGHTENED = 'FRIGHTENED',
  EATEN = 'EATEN',
}

export const GHOST_CORNER_TARGETS: Record<GhostType, GridPos> = {
  [GhostType.BLINKY]: { col: 27, row: 0 },
  [GhostType.PINKY]: { col: 0, row: 0 },
  [GhostType.INKY]: { col: 27, row: 35 },
  [GhostType.CLYDE]: { col: 0, row: 35 },
};

export const GHOST_HOUSE_RESPAWN: GridPos = { col: 13, row: 16 };

export interface GhostState {
  type: GhostType;
  mode: GhostMode;
  pos: GridPos;
  dir: Direction;
  targetTile: GridPos;
}

export class GhostAI {
  /**
   * Calculate Target Tile for Ghost AI based on character role.
   */
  public static calculateTargetTile(
    ghostType: GhostType,
    pacmanPos: GridPos,
    pacmanDir: Direction,
    blinkyPos: GridPos,
    clydePos: GridPos
  ): GridPos {
    const dirVector = DIRECTION_VECTORS[pacmanDir] || DIRECTION_VECTORS[Direction.LEFT];

    switch (ghostType) {
      case GhostType.BLINKY:
        // Target = Pacman Current Tile (Direct Pursuit)
        return { ...pacmanPos };

      case GhostType.PINKY:
        // Target = Pacman.tilePosition + 4 tiles in facing direction (Ambush)
        return {
          col: pacmanPos.col + dirVector.col * 4,
          row: pacmanPos.row + dirVector.row * 4,
        };

      case GhostType.INKY: {
        // Target = (Pacman.tilePosition + Pacman.direction * 2) * 2 - Blinky.tilePosition
        const pivot: GridPos = {
          col: pacmanPos.col + dirVector.col * 2,
          row: pacmanPos.row + dirVector.row * 2,
        };
        return {
          col: pivot.col * 2 - blinkyPos.col,
          row: pivot.row * 2 - blinkyPos.row,
        };
      }

      case GhostType.CLYDE: {
        // If Dist(Clyde, Pacman) > 8 then Pacman.tilePosition else Patrol Point (0,35)
        const dx = clydePos.col - pacmanPos.col;
        const dy = clydePos.row - pacmanPos.row;
        const distSquared = dx * dx + dy * dy;
        if (distSquared > 64) {
          return { ...pacmanPos };
        } else {
          return GHOST_CORNER_TARGETS[GhostType.CLYDE];
        }
      }
    }
  }

  /**
   * Select next direction at intersection.
   * If useBfsHome is true, uses BFS distance map to navigate eaten ghosts directly to door (13, 14).
   */
  public static getNextDirection(
    maze: PacmanMaze,
    currentPos: GridPos,
    currentDir: Direction,
    targetTile: GridPos,
    allowGhostGate: boolean = false,
    allowReverse: boolean = false,
    useBfsHome: boolean = false
  ): Direction {
    const validDirs: Direction[] = [Direction.UP, Direction.LEFT, Direction.DOWN, Direction.RIGHT];
    const opposite = OPPOSITE_DIRECTIONS[currentDir];

    let bestDir = currentDir;
    let minMetric = Infinity;

    for (const dir of validDirs) {
      // Disallow 180 turn unless forced by dead-end
      if (!allowReverse && dir === opposite && currentDir !== Direction.NONE) {
        continue;
      }

      const vec = DIRECTION_VECTORS[dir];
      const nextCol = currentPos.col + vec.col;
      const nextRow = currentPos.row + vec.row;

      if (!maze.isWall(nextCol, nextRow, allowGhostGate)) {
        let metric = Infinity;
        if (useBfsHome) {
          metric = maze.getHomeBfsDistance(nextCol, nextRow);
        } else {
          const dx = nextCol - targetTile.col;
          const dy = nextRow - targetTile.row;
          metric = dx * dx + dy * dy;
        }

        if (metric < minMetric) {
          minMetric = metric;
          bestDir = dir;
        }
      }
    }

    // Fallback: If facing a wall with no open side directions, allow 180 reverse to prevent walking off-screen
    if (minMetric === Infinity && !allowReverse) {
      return GhostAI.getNextDirection(maze, currentPos, currentDir, targetTile, allowGhostGate, true, useBfsHome);
    }

    return bestDir;
  }
}
