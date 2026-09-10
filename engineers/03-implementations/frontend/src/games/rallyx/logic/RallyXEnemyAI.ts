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
  RELATIVE_CLOCKWISE_DIRECTIONS,
  RELATIVE_COUNTER_CLOCKWISE_DIRECTIONS,
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
  // Rock & bump recovery timers (Zero global smoke grace time!)
  lastHitRockIndex: number;
  lastHitRockPos: { col: number; row: number } | null;
  rockCooldownTimerSec: number;
  bumpCooldownTimerSec: number;
  lastHitSmokePuffId: string | null;
  // Dynamic visual cornering orientation (Scheme B & C)
  visualAngleDeg: number;
  turnStartAngleDeg: number;
  turnTargetAngleDeg: number;
}

export const DIRECTION_ANGLES: Record<Direction, number> = {
  [Direction.UP]: 0,
  [Direction.RIGHT]: 90,
  [Direction.DOWN]: 180,
  [Direction.LEFT]: 270,
  [Direction.NONE]: 0,
};

export function normalizeAngleDeg(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export function lerpAngleDeg(current: number, target: number, t: number): number {
  const normCurrent = normalizeAngleDeg(current);
  const normTarget = normalizeAngleDeg(target);
  let diff = (normTarget - normCurrent) % 360;
  if (diff < -180) diff += 360;
  if (diff > 180) diff -= 360;
  return normalizeAngleDeg(normCurrent + diff * Math.min(1.0, Math.max(0.0, t)));
}

export const ENEMY_SPIN_OUT_DURATION_SEC = 2.0; // 2.0s spin-out on smoke or rocks
export const ENEMY_BUMP_DURATION_SEC = 1.0;     // 1.0s spin-out on car-to-car bumps
export const ENEMY_CORNER_DELAY_SEC = 0.06;     // Micro-delay when taking 90° corners
export const ENEMY_ROCK_GRACE_SEC = 1.0;        // Grace period to escape rock after spin-out
export const ENEMY_BUMP_GRACE_SEC = 1.0;        // Grace period to diverge after car-to-car bump

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
      const initialDirection = spawn.row <= 5 ? Direction.DOWN : Direction.UP;
      const initialAngle = DIRECTION_ANGLES[initialDirection];
      return {
        id: `enemy_${index}`,
        index,
        col,
        row,
        x: (col + 0.5) * RALLYX_TILE_SIZE,
        y: (row + 0.5) * RALLYX_TILE_SIZE,
        direction: initialDirection,
        state: isChallengingStage ? EnemyState.DORMANT : EnemyState.CHASING,
        spinOutTimerSec: 0,
        spinAngleDeg: 0,
        cornerDelayTimerSec: 0,
        lastHitRockIndex: -1,
        lastHitRockPos: null,
        rockCooldownTimerSec: 0,
        bumpCooldownTimerSec: 0,
        lastHitSmokePuffId: null,
        visualAngleDeg: initialAngle,
        turnStartAngleDeg: initialAngle,
        turnTargetAngleDeg: initialAngle,
      };
    });
  }

  /**
   * Checks whether a tile is impassable for enemy cars (walls, border decor, and rocks).
   */
  public static isTileBlockedForEnemy(
    matrix: RallyXTileType[][],
    col: number,
    row: number
  ): boolean {
    if (isRallyXWall(matrix, col, row)) return true;
    const tile = matrix[row]?.[col];
    return tile === RallyXTileType.ROCK;
  }

  /**
   * Finds an open non-blocked exit direction for an enemy to escape an obstacle.
   * Prioritizes reversing (180° U-turn) to back out of deadlocks, then lateral directions.
   */
  public static findEscapeDirection(
    matrix: RallyXTileType[][],
    col: number,
    row: number,
    currentDir: Direction,
    blockedTile?: { col: number; row: number }
  ): Direction {
    const opp = OPPOSITE_DIRECTIONS[currentDir];
    if (opp !== Direction.NONE) {
      const v = DIRECTION_VECTORS[opp];
      const nc = col + v.col;
      const nr = row + v.row;
      const isBlocked = blockedTile && nc === blockedTile.col && nr === blockedTile.row;
      if (!isBlocked && !RallyXEnemyAI.isTileBlockedForEnemy(matrix, nc, nr)) {
        return opp;
      }
    }

    const candidates: Direction[] = [
      RELATIVE_CLOCKWISE_DIRECTIONS[currentDir],
      RELATIVE_COUNTER_CLOCKWISE_DIRECTIONS[currentDir],
    ];
    for (const d of candidates) {
      if (d !== Direction.NONE) {
        const v = DIRECTION_VECTORS[d];
        const nc = col + v.col;
        const nr = row + v.row;
        const isBlocked = blockedTile && nc === blockedTile.col && nr === blockedTile.row;
        if (!isBlocked && !RallyXEnemyAI.isTileBlockedForEnemy(matrix, nc, nr)) {
          return d;
        }
      }
    }

    return Direction.NONE;
  }

  /**
   * Diverges two enemy cars upon bumping to prevent endless deadlock loops.
   * Reverses head-on collisions, diverts rear-end pursuers, and applies a separation nudge.
   */
  public static divergeCarsOnBump(a: EnemyCar, b: EnemyCar): void {
    // 1. Head-on collision: reverse both cars so they cruise away from each other
    if (a.direction === OPPOSITE_DIRECTIONS[b.direction]) {
      a.direction = OPPOSITE_DIRECTIONS[a.direction];
      b.direction = OPPOSITE_DIRECTIONS[b.direction];
    } else if (a.direction === b.direction) {
      // 2. Same direction (rear-end): follower reverses, leader keeps heading forward
      let follower = a;
      let leader = b;
      if (a.direction === Direction.UP) {
        if (a.y > b.y) { follower = a; leader = b; } else { follower = b; leader = a; }
      } else if (a.direction === Direction.DOWN) {
        if (a.y < b.y) { follower = a; leader = b; } else { follower = b; leader = a; }
      } else if (a.direction === Direction.LEFT) {
        if (a.x > b.x) { follower = a; leader = b; } else { follower = b; leader = a; }
      } else if (a.direction === Direction.RIGHT) {
        if (a.x < b.x) { follower = a; leader = b; } else { follower = b; leader = a; }
      }
      follower.direction = OPPOSITE_DIRECTIONS[follower.direction];
    } else {
      // 3. Perpendicular/intersection collision: reverse one car to divert paths
      b.direction = OPPOSITE_DIRECTIONS[b.direction];
    }

    // 4. Positional separation nudge to prevent sharing the identical pixel coordinate
    const nudge = 3;
    const va = DIRECTION_VECTORS[a.direction];
    a.x += va.col * nudge;
    a.y += va.row * nudge;
    const vb = DIRECTION_VECTORS[b.direction];
    b.x += vb.col * nudge;
    b.y += vb.row * nudge;
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
    currentDir: Direction = Direction.NONE,
    blockedTile?: { col: number; row: number },
    otherEnemies?: readonly EnemyCar[]
  ): Direction {
    if (startCol === targetCol && startRow === targetRow) {
      return Direction.NONE;
    }

    const maxRows = matrix.length;
    const maxCols = matrix[0]?.length || 0;

    // Disallowed 180° reverse unless no other choice
    const oppositeDir = OPPOSITE_DIRECTIONS[currentDir];

    // Priority directions: check open adjacent tiles (walls only; enemies do not have radar omniscience for rocks)
    const candidates: Direction[] = [Direction.UP, Direction.RIGHT, Direction.DOWN, Direction.LEFT];
    const availableDirs = candidates.filter((d) => {
      const v = DIRECTION_VECTORS[d];
      const nc = startCol + v.col;
      const nr = startRow + v.row;
      if (nc < 0 || nc >= maxCols || nr < 0 || nr >= maxRows) return false;
      if (blockedTile && nc === blockedTile.col && nr === blockedTile.row) return false;
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

    // Check if moving in direction d heads into an oncoming chasing teammate in the same corridor
    const hasOncomingTeammate = (d: Direction): boolean => {
      if (!otherEnemies || otherEnemies.length <= 1) return false;
      const v = DIRECTION_VECTORS[d];
      const oppD = OPPOSITE_DIRECTIONS[d];
      // Check corridor up to 5 tiles ahead
      for (let step = 1; step <= 5; step++) {
        const c = startCol + v.col * step;
        const r = startRow + v.row * step;
        if (c < 0 || c >= maxCols || r < 0 || r >= maxRows) break;
        if (isRallyXWall(matrix, c, r)) break;
        for (const other of otherEnemies) {
          if (other.col === startCol && other.row === startRow) continue;
          if (other.state !== EnemyState.CHASING) continue;
          if (other.col === c && other.row === r && other.direction === oppD) {
            return true;
          }
        }
      }
      return false;
    };

    // Filter out directions that would lead to immediate head-on crash with an oncoming teammate
    let candidateDirs = nonReverseDirs;
    if (nonReverseDirs.length > 1) {
      const safeDirs = nonReverseDirs.filter((d) => !hasOncomingTeammate(d));
      if (safeDirs.length > 0) {
        candidateDirs = safeDirs;
      }
    }

    // BFS Queue
    const visited = new Uint8Array(maxCols * maxRows);
    const startIndex = startRow * maxCols + startCol;
    visited[startIndex] = 1;
    if (
      blockedTile &&
      blockedTile.col >= 0 &&
      blockedTile.col < maxCols &&
      blockedTile.row >= 0 &&
      blockedTile.row < maxRows
    ) {
      visited[blockedTile.row * maxCols + blockedTile.col] = 1;
    }

    // Queue entries: [col, row, firstStepDir]
    const queue: Array<[number, number, Direction]> = [];

    // Seed queue with valid first steps (using candidateDirs that avoid oncoming teammates)
    for (const d of candidateDirs) {
      const v = DIRECTION_VECTORS[d];
      const nc = startCol + v.col;
      const nr = startRow + v.row;
      if (blockedTile && nc === blockedTile.col && nr === blockedTile.row) continue;
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
        if (blockedTile && nc === blockedTile.col && nr === blockedTile.row) continue;
        if (isRallyXWall(matrix, nc, nr)) continue;

        const idx = nr * maxCols + nc;
        if (!visited[idx]) {
          visited[idx] = 1;
          queue.push([nc, nr, firstDir]);
        }
      }
    }

    // If target not reachable via BFS, pick the first safe direction closest by Manhattan distance
    let bestDir = candidateDirs[0];
    let bestDist = Infinity;
    for (const d of candidateDirs) {
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
   * - Cars 1+ (Flanking Pursuers): Targets 2~4 tiles ahead along Blue car's heading.
   *   When enemy position is provided, it maintains its natural flank relative to the player
   *   to prevent criss-crossing into teammates.
   */
  public static calculateTargetTile(
    matrix: RallyXTileType[][],
    carIndex: number,
    blueCol: number,
    blueRow: number,
    blueDir: Direction,
    enemyCol?: number,
    enemyRow?: number
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

    // Lateral flanking:
    // If enemy position is known, keep enemy on its own natural flank relative to the player
    // to avoid criss-crossing teammates into head-on collisions.
    if (enemyCol !== undefined) {
      if (enemyCol < blueCol) {
        // Enemy is west of player -> flank on west side
        targetCol += v.row !== 0 ? -1 : 0;
        targetRow += v.col !== 0 ? 1 : 0;
      } else if (enemyCol > blueCol) {
        // Enemy is east of player -> flank on east side
        targetCol += v.row !== 0 ? 1 : 0;
        targetRow += v.col !== 0 ? -1 : 0;
      }
    } else {
      // Deterministic fallback if enemyCol not supplied
      if (carIndex % 2 === 1) {
        targetCol += -v.row * (carIndex > 2 ? 2 : 1);
        targetRow += v.col * (carIndex > 2 ? 2 : 1);
      } else {
        targetCol += v.row * 1;
        targetRow += -v.col * 1;
      }
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
   * - Handles Spin-Out timer, escape orientation, and rotation
   * - Decrements rock, bump, and smoke collision cooldown timers
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
    deltaSec: number,
    otherEnemies?: readonly EnemyCar[]
  ): void {
    // Decrement rock and bump cooldown timers
    if (enemy.rockCooldownTimerSec > 0) {
      enemy.rockCooldownTimerSec = Math.max(0, enemy.rockCooldownTimerSec - deltaSec);
      if (enemy.rockCooldownTimerSec === 0) {
        enemy.lastHitRockIndex = -1;
        enemy.lastHitRockPos = null;
      }
    }
    if (enemy.bumpCooldownTimerSec > 0) {
      enemy.bumpCooldownTimerSec = Math.max(0, enemy.bumpCooldownTimerSec - deltaSec);
    }

    // Dormant enemies in Challenging Stages do not move or calculate paths
    if (enemy.state === EnemyState.DORMANT) {
      return;
    }

    // Spin-Out state
    if (enemy.state === EnemyState.SPIN_OUT) {
      enemy.spinOutTimerSec -= deltaSec;
      enemy.spinAngleDeg = (enemy.spinAngleDeg + 360 * deltaSec * 2) % 360; // Spin 720 deg/sec
      enemy.visualAngleDeg = (enemy.turnStartAngleDeg + enemy.spinAngleDeg) % 360;
      if (enemy.spinOutTimerSec <= 0) {
        enemy.state = EnemyState.CHASING;
        enemy.spinOutTimerSec = 0;
        enemy.spinAngleDeg = 0;

        // If enemy was spinning out on a rock, reverse 180° away from the rock!
        // US-06-04 AC4: "結束後轉向避開岩石繼續巡航"
        if (enemy.lastHitRockIndex !== -1) {
          const opp = OPPOSITE_DIRECTIONS[enemy.direction];
          const oppVec = DIRECTION_VECTORS[opp];
          const oppCol = enemy.col + oppVec.col;
          const oppRow = enemy.row + oppVec.row;
          const oppIsRock =
            enemy.lastHitRockPos &&
            oppCol === enemy.lastHitRockPos.col &&
            oppRow === enemy.lastHitRockPos.row;

          if (
            opp !== Direction.NONE &&
            !oppIsRock &&
            !isRallyXWall(matrix, oppCol, oppRow)
          ) {
            enemy.direction = opp;
          } else {
            const escapeDir = RallyXEnemyAI.findEscapeDirection(
              matrix,
              enemy.col,
              enemy.row,
              enemy.direction,
              enemy.lastHitRockPos || undefined
            );
            if (escapeDir !== Direction.NONE) {
              enemy.direction = escapeDir;
            }
          }
        }
        enemy.visualAngleDeg = DIRECTION_ANGLES[enemy.direction];
        enemy.turnStartAngleDeg = enemy.visualAngleDeg;
        enemy.turnTargetAngleDeg = enemy.visualAngleDeg;
      }
      return;
    }

    // Cornering delay check (Dynamic Cornering Lerp - Scheme B)
    if (enemy.cornerDelayTimerSec > 0) {
      enemy.cornerDelayTimerSec = Math.max(0, enemy.cornerDelayTimerSec - deltaSec);
      const progress = 1.0 - (enemy.cornerDelayTimerSec / ENEMY_CORNER_DELAY_SEC);
      enemy.visualAngleDeg = lerpAngleDeg(enemy.turnStartAngleDeg, enemy.turnTargetAngleDeg, progress);
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

      // Find target tile (pass enemy's current col/row to retain natural flanking corridor)
      const target = RallyXEnemyAI.calculateTargetTile(
        matrix,
        enemy.index,
        blueCol,
        blueRow,
        blueDir,
        enemy.col,
        enemy.row
      );

      // BFS to select best direction (pass lastHitRockPos as blockedTile, otherEnemies for corridor collision safety)
      const nextDir = RallyXEnemyAI.findNextBfsDirection(
        matrix,
        enemy.col,
        enemy.row,
        target.col,
        target.row,
        enemy.direction,
        enemy.lastHitRockPos || undefined,
        otherEnemies
      );

      if (nextDir !== Direction.NONE) {
        if (nextDir !== enemy.direction) {
          // Incur micro corner delay when turning (stays at center during corner delay)
          enemy.cornerDelayTimerSec = ENEMY_CORNER_DELAY_SEC;
          enemy.turnStartAngleDeg = enemy.visualAngleDeg;
          enemy.turnTargetAngleDeg = DIRECTION_ANGLES[nextDir];
          enemy.direction = nextDir;
        } else {
          enemy.direction = nextDir;
          enemy.visualAngleDeg = DIRECTION_ANGLES[enemy.direction];
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
      enemy.visualAngleDeg = DIRECTION_ANGLES[enemy.direction];
    }

    // Update coordinates and grid position
    enemy.col = Math.floor(enemy.x / RALLYX_TILE_SIZE);
    enemy.row = Math.floor(enemy.y / RALLYX_TILE_SIZE);
  }

  /**
   * Checks collisions between enemy cars and active smoke puffs.
   * Puts affected enemy cars into 2.0s Spin-Out state.
   * ZERO global grace time: every distinct smoke puff can spin the enemy!
   * Consecutive smoke screens will continuously stall pursuing red cars.
   */
  public static checkSmokeCollisions(
    enemies: EnemyCar[],
    smokePuffs: readonly { id?: string; x: number; y: number }[],
    radius: number = 36
  ): EnemyCar[] {
    const affected: EnemyCar[] = [];
    const activePuffIds = new Set(
      smokePuffs.map((p) => p.id || `${p.x}_${p.y}`)
    );

    for (const enemy of enemies) {
      // Clear lastHitSmokePuffId if that puff has expired from the map
      if (enemy.lastHitSmokePuffId && !activePuffIds.has(enemy.lastHitSmokePuffId)) {
        enemy.lastHitSmokePuffId = null;
      }

      if (enemy.state !== EnemyState.CHASING) continue;

      for (const puff of smokePuffs) {
        const puffId = puff.id || `${puff.x}_${puff.y}`;
        // Only skip the specific single puff instance that the enemy is currently standing in
        if (enemy.lastHitSmokePuffId === puffId) continue;

        const dist = Math.hypot(enemy.x - puff.x, enemy.y - puff.y);
        if (dist <= radius) {
          enemy.state = EnemyState.SPIN_OUT;
          enemy.spinOutTimerSec = ENEMY_SPIN_OUT_DURATION_SEC;
          enemy.spinAngleDeg = 0;
          enemy.turnStartAngleDeg = enemy.visualAngleDeg;
          enemy.lastHitSmokePuffId = puffId;
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
   * Red cars can and WILL hit rocks whenever their path crosses one!
   * Only protects the enemy from the specific rock it is actively escaping from to prevent deadlocks.
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

      for (let rIdx = 0; rIdx < rocks.length; rIdx++) {
        const rock = rocks[rIdx];
        const rockCol = rock.col + borderOffset;
        const rockRow = rock.row + borderOffset;
        const rockX = (rockCol + 0.5) * RALLYX_TILE_SIZE;
        const rockY = (rockRow + 0.5) * RALLYX_TILE_SIZE;
        const dist = Math.hypot(enemy.x - rockX, enemy.y - rockY);

        // If enemy is currently escaping from this exact rock:
        if (enemy.lastHitRockIndex === rIdx) {
          // If car has moved away beyond 1.5 tiles (72px), clear rock memory
          if (dist > RALLYX_TILE_SIZE * 1.5) {
            enemy.lastHitRockIndex = -1;
            enemy.lastHitRockPos = null;
          } else {
            // Check movement direction relative to rock
            const toRockX = rockX - enemy.x;
            const toRockY = rockY - enemy.y;
            const moveVec = DIRECTION_VECTORS[enemy.direction];
            const dot = moveVec.col * toRockX + moveVec.row * toRockY;
            // Moving away from the rock: allow escape without re-spinning
            if (dot <= 0) {
              continue;
            }
          }
        }

        if (dist <= radius) {
          enemy.state = EnemyState.SPIN_OUT;
          enemy.spinOutTimerSec = ENEMY_SPIN_OUT_DURATION_SEC;
          enemy.lastHitRockIndex = rIdx;
          enemy.lastHitRockPos = { col: rockCol, row: rockRow };
          enemy.rockCooldownTimerSec = ENEMY_SPIN_OUT_DURATION_SEC + ENEMY_ROCK_GRACE_SEC;
          enemy.spinAngleDeg = 0;
          enemy.turnStartAngleDeg = enemy.visualAngleDeg;
          affected.push(enemy);
          break;
        }
      }
    }
    return affected;
  }

  /**
   * Checks car-to-car collisions between pursuing red cars.
   * Both cars spin-out for 1.0s and diverge without exploding or deadlocking.
   */
  public static checkCarBumps(enemies: EnemyCar[], bumpDist: number = 28): EnemyCar[] {
    const affected: EnemyCar[] = [];
    const len = enemies.length;
    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        const a = enemies[i];
        const b = enemies[j];
        if (
          a.state === EnemyState.CHASING &&
          b.state === EnemyState.CHASING &&
          a.bumpCooldownTimerSec <= 0 &&
          b.bumpCooldownTimerSec <= 0
        ) {
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          // In arcade Rally-X (and PRD-05 2.9), cars bump on head-on / intersection meetings.
          // Cars traveling in the same direction form a convoy / pursuit pack and do not spin-out each other.
          if (a.direction === b.direction && dist > 8) {
            continue;
          }
          if (dist <= bumpDist) {
            a.state = EnemyState.SPIN_OUT;
            a.spinOutTimerSec = ENEMY_BUMP_DURATION_SEC;
            a.bumpCooldownTimerSec = ENEMY_BUMP_DURATION_SEC + ENEMY_BUMP_GRACE_SEC;
            a.spinAngleDeg = 0;
            a.turnStartAngleDeg = a.visualAngleDeg;

            b.state = EnemyState.SPIN_OUT;
            b.spinOutTimerSec = ENEMY_BUMP_DURATION_SEC;
            b.bumpCooldownTimerSec = ENEMY_BUMP_DURATION_SEC + ENEMY_BUMP_GRACE_SEC;
            b.spinAngleDeg = 0;
            b.turnStartAngleDeg = b.visualAngleDeg;

            RallyXEnemyAI.divergeCarsOnBump(a, b);

            if (!affected.includes(a)) affected.push(a);
            if (!affected.includes(b)) affected.push(b);
          }
        }
      }
    }
    return affected;
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
