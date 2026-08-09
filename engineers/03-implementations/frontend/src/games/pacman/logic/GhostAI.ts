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
   * Select next direction at intersection (cannot turn 180 degrees backward unless mode changed).
   */
  public static getNextDirection(
    maze: PacmanMaze,
    currentPos: GridPos,
    currentDir: Direction,
    targetTile: GridPos,
    allowGhostGate: boolean = false,
    allowReverse: boolean = false
  ): Direction {
    const validDirs: Direction[] = [Direction.UP, Direction.LEFT, Direction.DOWN, Direction.RIGHT];
    const opposite = OPPOSITE_DIRECTIONS[currentDir];

    let bestDir = currentDir;
    let minDistance = Infinity;

    for (const dir of validDirs) {
      // Disallow 180 turn unless forced
      if (!allowReverse && dir === opposite && currentDir !== Direction.NONE) {
        continue;
      }

      const vec = DIRECTION_VECTORS[dir];
      const nextCol = currentPos.col + vec.col;
      const nextRow = currentPos.row + vec.row;

      if (!maze.isWall(nextCol, nextRow, allowGhostGate)) {
        const dx = nextCol - targetTile.col;
        const dy = nextRow - targetTile.row;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDistance) {
          minDistance = distSq;
          bestDir = dir;
        }
      }
    }

    return bestDir;
  }
}
