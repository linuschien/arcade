/**
 * RallyXEnemyAI.ts
 * Pure logic Enemy AI behaviors, BFS pathfinding, and collision physics for Red Cars.
 * Implements Lead Chaser, Flanking Pursuers, Anti-Stacking Dispersions,
 * 2.0s Spin-Out on Smoke/Rocks, 1.0s Car-to-Car bumps, and Dormant mode for Challenging Stages.
 */

import {
  Direction,
  DIRECTION_VECTORS,
  OPPOSITE_DIRECTIONS,
  GridPos,
  RallyXTileType,
  isRallyXWall,
  RALLYX_INNER_MAZE_COLS,
  RALLYX_INNER_MAZE_ROWS,
  RALLYX_TILE_SIZE,
} from './RallyXMaze';

export enum EnemyState {
  CHASING = 'CHASING',
  SPIN_OUT = 'SPIN_OUT',
  DORMANT = 'DORMANT',
}

export interface EnemyCar {
  id: string;
  index: number;
  col: number;
  row: number;
  x: number;
  y: number;
  direction: Direction;
  state: EnemyState;
  spinOutTimerSec: number;
  spinAngleDeg: number;
  cornerDelayTimerSec: number;
}

export const ENEMY_SPIN_OUT_DURATION_SEC = 2.0; // 2.0s spin-out on smoke or rocks
export const ENEMY_BUMP_DURATION_SEC = 1.0;     // 1.0s spin-out on car-to-car bumps
export const ENEMY_CORNER_DELAY_SEC = 0.06;     // Micro-delay when taking 90° corners

export class RallyXEnemyAI {
  /**
   * Initializes enemy cars for a round given spawn coordinates.
   */
  public static createEnemies(
    spawns: GridPos[],
    isChallengingStage: boolean,
    borderOffset: number = 0
  ): EnemyCar[] {
    return spawns.map((spawn, index) => {
      const col = spawn.col + borderOffset;
      const row = spawn.row + borderOffset;
      return {
        id: `enemy_${index}`,
        index,
        col,
        row,
        x: (col + 0.5) * RALLYX_TILE_SIZE,
        y: (row + 0.5) * RALLYX_TILE_SIZE,
        direction: Direction.UP,
        state: isChallengingStage ? EnemyState.DORMANT : EnemyState.CHASING,
        spinOutTimerSec: 0,
        spinAngleDeg: 0,
        cornerDelayTimerSec: 0,
      };
    });
  }

  /**
   * Breadth-First Search (BFS) to find the shortest path from start to target.
   * Returns the next step direction from (startCol, startRow).
   */
  public static findNextBfsDirection(
    matrix: RallyXTileType[][],
    startCol: number,
    startRow: number,
    targetCol: number,
    targetRow: number,
    currentDir: Direction = Direction.NONE
  ): Direction {
    if (startCol === targetCol && startRow === targetRow) {
      return Direction.NONE;
    }

    const maxRows = matrix.length;
    const maxCols = matrix[0]?.length || 0;

    // Disallowed 180° reverse unless no other choice
    const oppositeDir = OPPOSITE_DIRECTIONS[currentDir];

    // Priority directions: check open adjacent tiles
    const candidates: Direction[] = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];
    const availableDirs = candidates.filter((d) => {
      const v = DIRECTION_VECTORS[d];
      const nc = startCol + v.col;
      const nr = startRow + v.row;
      if (nc < 0 || nc >= maxCols || nr < 0 || nr >= maxRows) return false;
      return !isRallyXWall(matrix, nc, nr);
    });

    if (availableDirs.length === 0) {
      return Direction.NONE;
    }

    // If only one direction available, take it
    if (availableDirs.length === 1) {
      return availableDirs[0];
    }

    // Filter out opposite direction if there are other valid choices (avoid erratic 180° flapping)
    let nonReverseDirs = availableDirs.filter((d) => d !== oppositeDir);
    if (nonReverseDirs.length === 0) {
      nonReverseDirs = availableDirs;
    }

    // BFS Queue
    const visited = new Uint8Array(maxCols * maxRows);
    const startIndex = startRow * maxCols + startCol;
    visited[startIndex] = 1;

    // Queue entries: [col, row, firstStepDir]
    const queue: Array<[number, number, Direction]> = [];

    // Seed queue with valid first steps
    for (const d of nonReverseDirs) {
      const v = DIRECTION_VECTORS[d];
      const nc = startCol + v.col;
      const nr = startRow + v.row;
      if (nc === targetCol && nr === targetRow) {
        return d;
      }
      const idx = nr * maxCols + nc;
      visited[idx] = 1;
      queue.push([nc, nr, d]);
    }

    let head = 0;
    while (head < queue.length) {
      const [currCol, currRow, firstDir] = queue[head++];

      if (currCol === targetCol && currRow === targetRow) {
        return firstDir;
      }

      for (const d of candidates) {
        const v = DIRECTION_VECTORS[d];
        const nc = currCol + v.col;
        const nr = currRow + v.row;
        if (nc < 0 || nc >= maxCols || nr < 0 || nr >= maxRows) continue;
        if (isRallyXWall(matrix, nc, nr)) continue;

        const idx = nr * maxCols + nc;
        if (!visited[idx]) {
          visited[idx] = 1;
          queue.push([nc, nr, firstDir]);
        }
      }
    }

    // If target not reachable via BFS, pick the first non-reverse direction closest by Manhattan distance
    let bestDir = nonReverseDirs[0];
    let bestDist = Infinity;
    for (const d of nonReverseDirs) {
      const v = DIRECTION_VECTORS[d];
      const nc = startCol + v.col;
      const nr = startRow + v.row;
      const dist = Math.abs(nc - targetCol) + Math.abs(nr - targetRow);
      if (dist < bestDist) {
        bestDist = dist;
        bestDir = d;
      }
    }

    return bestDir;
  }

  /**
   * Calculates target tile for an enemy car based on its index:
   * - Car 0 (Lead Chaser): Targets Blue car directly.
   * - Cars 1+ (Flanking Pursuers): Targets 2~4 tiles ahead along Blue car's heading,
   *   with deterministic anti-stacking jitter per car index.
   */
  public static calculateTargetTile(
    matrix: RallyXTileType[][],
    carIndex: number,
    blueCol: number,
    blueRow: number,
    blueDir: Direction
  ): GridPos {
    if (carIndex === 0) {
      return { col: blueCol, row: blueRow };
    }

    const maxRows = matrix.length;
    const maxCols = matrix[0]?.length || 0;
    const v = DIRECTION_VECTORS[blueDir] || { col: 0, row: 0 };

    // Offset based on car index (2, 4, 3, etc.)
    const stepAhead = 2 + (carIndex % 3);
    let targetCol = blueCol + v.col * stepAhead;
    let targetRow = blueRow + v.row * stepAhead;

    // Add lateral offset for odd/even pursuers to disperse flanking routes
    if (carIndex % 2 === 1) {
      targetCol += -v.row * (carIndex > 2 ? 2 : 1);
      targetRow += v.col * (carIndex > 2 ? 2 : 1);
    } else {
      targetCol += v.row * 1;
      targetRow += -v.col * 1;
    }

    // Clamp within bounds
    targetCol = Math.max(0, Math.min(maxCols - 1, targetCol));
    targetRow = Math.max(0, Math.min(maxRows - 1, targetRow));

    // If target lands on a wall, fallback to player tile
    if (isRallyXWall(matrix, targetCol, targetRow)) {
      return { col: blueCol, row: blueRow };
    }

    return { col: targetCol, row: targetRow };
  }

  /**
   * Updates an individual enemy car for one delta step:
   * - Handles Spin-Out timer and rotation
   * - Handles Cornering Delay
   * - Executes BFS pathfinding and grid/pixel movement
   */
  public static updateEnemy(
    enemy: EnemyCar,
    matrix: RallyXTileType[][],
    blueCol: number,
    blueRow: number,
    blueDir: Direction,
    baseSpeed: number, // Base Blue car speed (e.g. 130 px/s)
    deltaSec: number
  ): void {
    // Dormant enemies in Challenging Stages do not move or calculate paths
    if (enemy.state === EnemyState.DORMANT) {
      return;
    }

    // Spin-Out state
    if (enemy.state === EnemyState.SPIN_OUT) {
      enemy.spinOutTimerSec -= deltaSec;
      enemy.spinAngleDeg = (enemy.spinAngleDeg + 360 * deltaSec * 2) % 360; // Spin 720 deg/sec
      if (enemy.spinOutTimerSec <= 0) {
        enemy.state = EnemyState.CHASING;
        enemy.spinOutTimerSec = 0;
        enemy.spinAngleDeg = 0;
      }
      return;
    }

    // Cornering delay check
    if (enemy.cornerDelayTimerSec > 0) {
      enemy.cornerDelayTimerSec -= deltaSec;
      return;
    }

    // Red car straight speed is 108% of Blue car base speed
    const redSpeed = baseSpeed * 1.08;
    const moveDist = redSpeed * deltaSec;

    // Current tile center
    const centerTileX = (enemy.col + 0.5) * RALLYX_TILE_SIZE;
    const centerTileY = (enemy.row + 0.5) * RALLYX_TILE_SIZE;

    const curVec = DIRECTION_VECTORS[enemy.direction];
    const newX = enemy.x + curVec.col * moveDist;
    const newY = enemy.y + curVec.row * moveDist;

    // Check if enemy reaches or passes through tile center in its movement direction
    const crossedCenter =
      (enemy.direction === Direction.UP && enemy.y >= centerTileY && newY <= centerTileY) ||
      (enemy.direction === Direction.DOWN && enemy.y <= centerTileY && newY >= centerTileY) ||
      (enemy.direction === Direction.LEFT && enemy.x >= centerTileX && newX <= centerTileX) ||
      (enemy.direction === Direction.RIGHT && enemy.x <= centerTileX && newX >= centerTileX);

    if (crossedCenter) {
      // Snap to tile center
      enemy.x = centerTileX;
      enemy.y = centerTileY;

      // Find target tile
      const target = RallyXEnemyAI.calculateTargetTile(
        matrix,
        enemy.index,
        blueCol,
        blueRow,
        blueDir
      );

      // BFS to select best direction
      const nextDir = RallyXEnemyAI.findNextBfsDirection(
        matrix,
        enemy.col,
        enemy.row,
        target.col,
        target.row,
        enemy.direction
      );

      if (nextDir !== Direction.NONE) {
        if (nextDir !== enemy.direction) {
          // Incur micro corner delay when turning (stays at center during corner delay)
          enemy.cornerDelayTimerSec = ENEMY_CORNER_DELAY_SEC;
          enemy.direction = nextDir;
        } else {
          enemy.direction = nextDir;
          // Continue moving remaining distance along current straight direction
          const remDist = (enemy.direction === Direction.UP || enemy.direction === Direction.DOWN)
            ? Math.abs(newY - centerTileY)
            : Math.abs(newX - centerTileX);
          const nextVec = DIRECTION_VECTORS[enemy.direction];
          enemy.x += nextVec.col * remDist;
          enemy.y += nextVec.row * remDist;
        }
      }
    } else {
      enemy.x = newX;
      enemy.y = newY;
    }

    // Update coordinates and grid position
    enemy.col = Math.floor(enemy.x / RALLYX_TILE_SIZE);
    enemy.row = Math.floor(enemy.y / RALLYX_TILE_SIZE);
  }

  /**
   * Checks collisions between enemy cars and active smoke puffs.
   * Puts affected enemy cars into 2.0s Spin-Out state.
   */
  public static checkSmokeCollisions(
    enemies: EnemyCar[],
    smokePuffs: readonly { x: number; y: number }[],
    radius: number = 36
  ): EnemyCar[] {
    const affected: EnemyCar[] = [];
    for (const enemy of enemies) {
      if (enemy.state !== EnemyState.CHASING) continue;

      for (const puff of smokePuffs) {
        const dist = Math.hypot(enemy.x - puff.x, enemy.y - puff.y);
        if (dist <= radius) {
          enemy.state = EnemyState.SPIN_OUT;
          enemy.spinOutTimerSec = ENEMY_SPIN_OUT_DURATION_SEC;
          enemy.spinAngleDeg = 0;
          affected.push(enemy);
          break;
        }
      }
    }
    return affected;
  }

  /**
   * Checks collisions between enemy cars and rock obstacles.
   * Red cars do NOT explode on rocks; they spin-out for 2.0s.
   */
  public static checkRockCollisions(
    enemies: EnemyCar[],
    rocks: readonly GridPos[],
    borderOffset: number = 0,
    radius: number = 36
  ): EnemyCar[] {
    const affected: EnemyCar[] = [];
    for (const enemy of enemies) {
      if (enemy.state !== EnemyState.CHASING) continue;

      for (const rock of rocks) {
        const rockX = (rock.col + borderOffset + 0.5) * RALLYX_TILE_SIZE;
        const rockY = (rock.row + borderOffset + 0.5) * RALLYX_TILE_SIZE;
        const dist = Math.hypot(enemy.x - rockX, enemy.y - rockY);
        if (dist <= radius) {
          enemy.state = EnemyState.SPIN_OUT;
          enemy.spinOutTimerSec = ENEMY_SPIN_OUT_DURATION_SEC;
          enemy.spinAngleDeg = 0;
          affected.push(enemy);
          break;
        }
      }
    }
    return affected;
  }

  /**
   * Checks car-to-car collisions between pursuing red cars.
   * Both cars spin-out for 1.0s and diverge without exploding.
   */
  public static checkCarBumps(enemies: EnemyCar[], bumpDist: number = 28): void {
    const len = enemies.length;
    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const a = enemies[i];
        const b = enemies[j];
        if (a.state === EnemyState.CHASING && b.state === EnemyState.CHASING) {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist <= bumpDist) {
            a.state = EnemyState.SPIN_OUT;
            a.spinOutTimerSec = ENEMY_BUMP_DURATION_SEC;
            b.state = EnemyState.SPIN_OUT;
            b.spinOutTimerSec = ENEMY_BUMP_DURATION_SEC;
          }
        }
      }
    }
  }

  /**
   * Checks collision between Blue car and an Enemy car.
   * Returns true if lethal crash occurred (enemy is active/dormant, not spinning out).
   */
  public static checkPlayerCollision(
    playerX: number,
    playerY: number,
    enemies: readonly EnemyCar[],
    lethalRadius: number = 32
  ): boolean {
    for (const enemy of enemies) {
      // Spin-out enemies do not harm the player
      if (enemy.state === EnemyState.SPIN_OUT) continue;

      const dist = Math.hypot(playerX - enemy.x, playerY - enemy.y);
      if (dist <= lethalRadius) {
        return true;
      }
    }
    return false;
  }
}
