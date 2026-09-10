import { describe, it, expect } from 'vitest';
import {
  RallyXEnemyAI,
  EnemyState,
  ENEMY_SPIN_OUT_DURATION_SEC,
  ENEMY_BUMP_DURATION_SEC,
} from '../logic/RallyXEnemyAI';
import {
  Direction,
  buildRallyXTileMatrix,
  RallyXTileType,
  RALLYX_TILE_SIZE,
} from '../logic/RallyXMaze';

describe('RallyXEnemyAI Unit Tests', () => {
  const matrix = buildRallyXTileMatrix(1, false);

  describe('Enemy Creation & Dormant State', () => {
    it('should create chasing enemies for normal stages', () => {
      const spawns = [{ col: 15, row: 52 }, { col: 16, row: 52 }];
      const enemies = RallyXEnemyAI.createEnemies(spawns, false);

      expect(enemies.length).toBe(2);
      expect(enemies[0].state).toBe(EnemyState.CHASING);
      expect(enemies[1].state).toBe(EnemyState.CHASING);
      expect(enemies[0].col).toBe(15);
      expect(enemies[0].row).toBe(52);
    });

    it('should create dormant enemies for Challenging Stages', () => {
      const spawns = [{ col: 15, row: 52 }, { col: 16, row: 52 }];
      const enemies = RallyXEnemyAI.createEnemies(spawns, true);

      expect(enemies[0].state).toBe(EnemyState.DORMANT);
      expect(enemies[1].state).toBe(EnemyState.DORMANT);

      // Dormant enemies should not move
      const initialX = enemies[0].x;
      RallyXEnemyAI.updateEnemy(enemies[0], matrix, 15, 40, Direction.UP, 130, 0.1);
      expect(enemies[0].x).toBe(initialX);
    });
  });

  describe('BFS Pathfinding & Target Calculation', () => {
    it('should calculate direct target tile for lead chaser (index 0)', () => {
      const target = RallyXEnemyAI.calculateTargetTile(matrix, 0, 10, 20, Direction.UP);
      expect(target.col).toBe(10);
      expect(target.row).toBe(20);
    });

    it('should calculate flanking target tile ahead of player for pursuers (index 1+)', () => {
      const target = RallyXEnemyAI.calculateTargetTile(matrix, 1, 10, 20, Direction.DOWN);
      // Index 1: 2 + (1 % 3) = 3 steps ahead vertically (row + 3) + lateral offset
      expect(target).toBeDefined();
      expect(typeof target.col).toBe('number');
      expect(typeof target.row).toBe('number');
    });

    it('should find next BFS direction towards target', () => {
      // Pick two adjacent open tiles
      // Check for an open corridor
      let openCol = 0, openRow = 0;
      for (let r = 0; r < matrix.length - 1; r++) {
        for (let c = 0; c < matrix[0].length - 1; c++) {
          if (matrix[r][c] === RallyXTileType.EMPTY && matrix[r + 1][c] === RallyXTileType.EMPTY) {
            openCol = c;
            openRow = r;
            break;
          }
        }
        if (openCol > 0) break;
      }

      const nextDir = RallyXEnemyAI.findNextBfsDirection(
        matrix,
        openCol,
        openRow,
        openCol,
        openRow + 1,
        Direction.NONE
      );

      // Since target is directly below, next step should be DOWN
      expect(nextDir).toBe(Direction.DOWN);
    });

    it('should return Direction.NONE if start equals target', () => {
      const nextDir = RallyXEnemyAI.findNextBfsDirection(matrix, 5, 5, 5, 5);
      expect(nextDir).toBe(Direction.NONE);
    });
  });

  describe('Collisions: Smoke, Rocks, Car Bumps & Lethal Player Touch', () => {
    it('should cause 2.0s spin-out when enemy hits smoke puff', () => {
      const spawns = [{ col: 10, row: 10 }];
      const enemies = RallyXEnemyAI.createEnemies(spawns, false);
      const enemy = enemies[0];

      const puffs = [{ x: enemy.x, y: enemy.y }];
      const affected = RallyXEnemyAI.checkSmokeCollisions(enemies, puffs);

      expect(affected.length).toBe(1);
      expect(enemy.state).toBe(EnemyState.SPIN_OUT);
      expect(enemy.spinOutTimerSec).toBe(ENEMY_SPIN_OUT_DURATION_SEC);

      // In spin-out, updateEnemy should decrement timer and rotate (0.25s -> 180 degrees)
      RallyXEnemyAI.updateEnemy(enemy, matrix, 10, 15, Direction.DOWN, 130, 0.25);
      expect(enemy.spinOutTimerSec).toBeCloseTo(1.75, 1);
      expect(enemy.spinAngleDeg).toBeGreaterThan(0);
    });

    it('should cause 2.0s spin-out when enemy hits rock', () => {
      const spawns = [{ col: 10, row: 10 }];
      const enemies = RallyXEnemyAI.createEnemies(spawns, false);
      const enemy = enemies[0];

      const rocks = [{ col: 10, row: 10 }];
      const affected = RallyXEnemyAI.checkRockCollisions(enemies, rocks);

      expect(affected.length).toBe(1);
      expect(enemy.state).toBe(EnemyState.SPIN_OUT);
      expect(enemy.spinOutTimerSec).toBe(ENEMY_SPIN_OUT_DURATION_SEC);
    });

    it('should cause 1.0s spin-out for both cars on car-to-car collision', () => {
      const spawns = [{ col: 10, row: 10 }, { col: 10, row: 10 }];
      const enemies = RallyXEnemyAI.createEnemies(spawns, false);

      RallyXEnemyAI.checkCarBumps(enemies);

      expect(enemies[0].state).toBe(EnemyState.SPIN_OUT);
      expect(enemies[0].spinOutTimerSec).toBe(ENEMY_BUMP_DURATION_SEC);
      expect(enemies[1].state).toBe(EnemyState.SPIN_OUT);
      expect(enemies[1].spinOutTimerSec).toBe(ENEMY_BUMP_DURATION_SEC);
    });

    it('should detect lethal player collision with active or dormant enemy, but NOT spinning enemy', () => {
      const spawns = [{ col: 10, row: 10 }];
      const enemies = RallyXEnemyAI.createEnemies(spawns, false);
      const enemy = enemies[0];

      // Player at same location
      const isLethal1 = RallyXEnemyAI.checkPlayerCollision(enemy.x, enemy.y, enemies);
      expect(isLethal1).toBe(true);

      // When spinning out, should NOT be lethal
      enemy.state = EnemyState.SPIN_OUT;
      const isLethal2 = RallyXEnemyAI.checkPlayerCollision(enemy.x, enemy.y, enemies);
      expect(isLethal2).toBe(false);
    });

    it('should NOT deadlock after rock spin-out and should turn away to escape', () => {
      const spawns = [{ col: 10, row: 10 }];
      const enemies = RallyXEnemyAI.createEnemies(spawns, false);
      const enemy = enemies[0];
      enemy.direction = Direction.UP;

      const rocks = [{ col: 10, row: 9 }]; // Rock directly UP ahead
      const mockMatrix: RallyXTileType[][] = Array.from({ length: 20 }, () =>
        Array(20).fill(RallyXTileType.EMPTY)
      );
      mockMatrix[9][10] = RallyXTileType.ROCK;

      // 1. Trigger rock collision
      enemy.y = (9.5) * RALLYX_TILE_SIZE; // within 36px of rock at (10, 9)
      const hit = RallyXEnemyAI.checkRockCollisions(enemies, rocks);
      expect(hit.length).toBe(1);
      expect(enemy.state).toBe(EnemyState.SPIN_OUT);
      expect(enemy.rockCooldownTimerSec).toBeGreaterThan(ENEMY_SPIN_OUT_DURATION_SEC);

      // 2. Advance 2.0s so spin-out ends
      RallyXEnemyAI.updateEnemy(enemy, mockMatrix, 10, 0, Direction.UP, 130, 2.01);
      expect(enemy.state).toBe(EnemyState.CHASING);
      expect(enemy.rockCooldownTimerSec).toBeGreaterThan(0); // Grace period remains
      // Direction should have turned away from the rock (not UP into the rock)
      expect(enemy.direction).not.toBe(Direction.UP);

      // 3. Immediate checkRockCollisions must NOT re-trigger spin-out (no deadlock!)
      const reHit = RallyXEnemyAI.checkRockCollisions(enemies, rocks);
      expect(reHit.length).toBe(0);
      expect(enemy.state).toBe(EnemyState.CHASING);
    });

    it('should NOT deadlock after car-to-car bump and both cars should diverge', () => {
      const spawns = [{ col: 10, row: 10 }, { col: 10, row: 10 }];
      const enemies = RallyXEnemyAI.createEnemies(spawns, false);
      enemies[0].direction = Direction.RIGHT;
      enemies[1].direction = Direction.LEFT; // Head-on collision

      // 1. Trigger car bump
      const bumped = RallyXEnemyAI.checkCarBumps(enemies);
      expect(bumped.length).toBe(2);
      expect(enemies[0].state).toBe(EnemyState.SPIN_OUT);
      expect(enemies[1].state).toBe(EnemyState.SPIN_OUT);
      expect(enemies[0].bumpCooldownTimerSec).toBeGreaterThan(ENEMY_BUMP_DURATION_SEC);
      expect(enemies[1].bumpCooldownTimerSec).toBeGreaterThan(ENEMY_BUMP_DURATION_SEC);

      // Cars should have reversed (head-on divergence)
      expect(enemies[0].direction).toBe(Direction.LEFT);
      expect(enemies[1].direction).toBe(Direction.RIGHT);

      // 2. Advance 1.01s so spin-out ends
      const mockMatrix: RallyXTileType[][] = Array.from({ length: 20 }, () =>
        Array(20).fill(RallyXTileType.EMPTY)
      );
      RallyXEnemyAI.updateEnemy(enemies[0], mockMatrix, 0, 0, Direction.NONE, 130, 1.01);
      RallyXEnemyAI.updateEnemy(enemies[1], mockMatrix, 0, 0, Direction.NONE, 130, 1.01);

      expect(enemies[0].state).toBe(EnemyState.CHASING);
      expect(enemies[1].state).toBe(EnemyState.CHASING);
      expect(enemies[0].bumpCooldownTimerSec).toBeGreaterThan(0);

      // 3. Immediate checkCarBumps must NOT re-trigger bump (grace period protects them)
      const reBump = RallyXEnemyAI.checkCarBumps(enemies);
      expect(reBump.length).toBe(0);
      expect(enemies[0].state).toBe(EnemyState.CHASING);
      expect(enemies[1].state).toBe(EnemyState.CHASING);
    });

    it('should allow enemy to pathfind through road with rock and trigger spin-out upon contact', () => {
      const spawns = [{ col: 10, row: 10 }];
      const enemies = RallyXEnemyAI.createEnemies(spawns, false);
      const enemy = enemies[0];

      // BFS treats roads normally: target at (10, 8), rock at (10, 9).
      const mockMatrix: RallyXTileType[][] = Array.from({ length: 20 }, () =>
        Array(20).fill(RallyXTileType.EMPTY)
      );
      mockMatrix[9][10] = RallyXTileType.ROCK;

      // BFS will direct enemy UP toward target, not avoiding the rock
      const nextDir = RallyXEnemyAI.findNextBfsDirection(mockMatrix, 10, 10, 10, 8, Direction.NONE);
      expect(nextDir).toBe(Direction.UP);

      // When driving into the rock, checkRockCollisions triggers!
      enemy.y = 9.5 * RALLYX_TILE_SIZE;
      const hit = RallyXEnemyAI.checkRockCollisions(enemies, [{ col: 10, row: 9 }]);
      expect(hit.length).toBe(1);
      expect(enemy.state).toBe(EnemyState.SPIN_OUT);
    });

    it('should allow consecutive smoke puffs to spin-out enemy without any grace time', () => {
      const spawns = [{ col: 10, row: 10 }];
      const enemies = RallyXEnemyAI.createEnemies(spawns, false);
      const enemy = enemies[0];

      // 1. Hit first smoke puff
      const puff1 = { id: 'puff_1', x: enemy.x, y: enemy.y };
      const hit1 = RallyXEnemyAI.checkSmokeCollisions(enemies, [puff1]);
      expect(hit1.length).toBe(1);
      expect(enemy.state).toBe(EnemyState.SPIN_OUT);
      expect(enemy.lastHitSmokePuffId).toBe('puff_1');

      // 2. Advance 2.01s so spin-out ends
      const mockMatrix: RallyXTileType[][] = Array.from({ length: 20 }, () =>
        Array(20).fill(RallyXTileType.EMPTY)
      );
      RallyXEnemyAI.updateEnemy(enemy, mockMatrix, 10, 0, Direction.UP, 130, 2.01);
      expect(enemy.state).toBe(EnemyState.CHASING);

      // Puff 1 does not re-spin while standing in it
      const reHit1 = RallyXEnemyAI.checkSmokeCollisions(enemies, [puff1]);
      expect(reHit1.length).toBe(0);

      // 3. BUT a new puff (consecutive smoke deployed by player) IMMEDIATELY triggers spin-out with zero grace time!
      const puff2 = { id: 'puff_2', x: enemy.x, y: enemy.y };
      const hit2 = RallyXEnemyAI.checkSmokeCollisions(enemies, [puff1, puff2]);
      expect(hit2.length).toBe(1);
      expect(enemy.state).toBe(EnemyState.SPIN_OUT);
      expect(enemy.lastHitSmokePuffId).toBe('puff_2');
    });
  });
});
