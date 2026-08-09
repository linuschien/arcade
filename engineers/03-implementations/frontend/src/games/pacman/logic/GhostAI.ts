/**
 * GhostAI.ts
 * AI Targeting Formulas & Direction Selection for Blinky, Pinky, Inky, and Clyde.
 */

import { GridPos, Direction, DIRECTION_VECTORS, OPPOSITE_DIRECTIONS, PacmanMaze } from './PacmanMaze';

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

export const GHOST_HOUSE_RESPAWN: GridPos = { col: 13, row: 15 };

export interface GhostState {
  type: GhostType;
  mode: GhostMode;
  gridPos: GridPos;
  direction: Direction;
  targetPos: GridPos;
  speedRatio: number;
}

export class GhostAI {
  /**
   * Calculate Target Tile in Chase Mode based on PRD-02 / BDD specs.
   */
  public static calculateTargetTile(
    ghostType: GhostType,
    pacmanPos: GridPos,
    pacmanDir: Direction,
    blinkyPos: GridPos,
    clydePos: GridPos
  ): GridPos {
    const dirVector = DIRECTION_VECTORS[pacmanDir] || { col: 0, row: 0 };

    switch (ghostType) {
      case GhostType.BLINKY:
        // Target = Pacman.tilePosition
        return { ...pacmanPos };

      case GhostType.PINKY:
        // Target = Pacman.tilePosition + Pacman.direction * 4
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

      if (!maze.isWall(nextCol, nextRow, true)) {
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
