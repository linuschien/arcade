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
  });
});
