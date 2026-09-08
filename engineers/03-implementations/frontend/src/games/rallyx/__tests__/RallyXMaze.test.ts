import { describe, it, expect } from 'vitest';
import {
  RALLYX_INNER_MAZE_COLS,
  RALLYX_INNER_MAZE_ROWS,
  RALLYX_BORDER_WIDTH,
  RALLYX_TOTAL_COLS,
  RALLYX_TOTAL_ROWS,
  RALLYX_MAZE_COLS,
  RALLYX_MAZE_ROWS,
  RALLYX_MASTER_MAZES,
  RALLYX_LEVEL_CONFIGS,
  RallyXTileType,
  getRallyXLevelConfig,
  buildRallyXTileMatrix,
  isRallyXWall,
  innerToWorldTile,
  worldToInnerTile,
} from '../logic/RallyXMaze';

describe('RallyXMaze Unit Tests', () => {
  describe('Master Mazes Geometry & Dimensions', () => {
    it('should define inner playable mazes with exactly 32 columns and 56 rows', () => {
      expect(RALLYX_INNER_MAZE_COLS).toBe(32);
      expect(RALLYX_INNER_MAZE_ROWS).toBe(56);
      expect(RALLYX_MAZE_COLS).toBe(32);
      expect(RALLYX_MAZE_ROWS).toBe(56);

      expect(RALLYX_MASTER_MAZES.length).toBe(4);
      for (let i = 0; i < 4; i++) {
        const maze = RALLYX_MASTER_MAZES[i];
        expect(maze.length).toBe(RALLYX_INNER_MAZE_ROWS); // 56 rows
        for (let r = 0; r < RALLYX_INNER_MAZE_ROWS; r++) {
          expect(maze[r].length).toBe(RALLYX_INNER_MAZE_COLS); // 32 cols
        }
      }
    });

    it('should specify 3-tile decorative border frame yielding a 38x62 total world', () => {
      expect(RALLYX_BORDER_WIDTH).toBe(3);
      expect(RALLYX_TOTAL_COLS).toBe(38); // 3 + 32 + 3
      expect(RALLYX_TOTAL_ROWS).toBe(62); // 3 + 56 + 3
    });
  });

  describe('16-Round Level Configurations', () => {
    it('should define exactly 16 levels in RALLYX_LEVEL_CONFIGS', () => {
      expect(RALLYX_LEVEL_CONFIGS.length).toBe(16);
      for (let i = 0; i < 16; i++) {
        expect(RALLYX_LEVEL_CONFIGS[i].round).toBe(i + 1);
      }
    });

    it('should constrain all entities strictly within the 32x56 inner playable boundaries', () => {
      for (let r = 1; r <= 16; r++) {
        const config = getRallyXLevelConfig(r);

        // Player
        expect(config.playerStart.col).toBeGreaterThanOrEqual(0);
        expect(config.playerStart.col).toBeLessThan(32);
        expect(config.playerStart.row).toBeGreaterThanOrEqual(0);
        expect(config.playerStart.row).toBeLessThan(56);

        // Enemies
        for (const spawn of config.enemySpawns) {
          expect(spawn.col).toBeGreaterThanOrEqual(0);
          expect(spawn.col).toBeLessThan(32);
          expect(spawn.row).toBeGreaterThanOrEqual(0);
          expect(spawn.row).toBeLessThan(56);
        }

        // Flags
        for (const flag of config.flags) {
          expect(flag.col).toBeGreaterThanOrEqual(0);
          expect(flag.col).toBeLessThan(32);
          expect(flag.row).toBeGreaterThanOrEqual(0);
          expect(flag.row).toBeLessThan(56);
        }

        // Rocks
        for (const rock of config.rocks) {
          expect(rock.col).toBeGreaterThanOrEqual(0);
          expect(rock.col).toBeLessThan(32);
          expect(rock.row).toBeGreaterThanOrEqual(0);
          expect(rock.row).toBeLessThan(56);
        }
      }
    });

    it('should assign correct master mazes in 4-round blocks (Scheme B)', () => {
      for (let r = 1; r <= 16; r++) {
        const config = getRallyXLevelConfig(r);
        const expectedMazeIndex = Math.floor((r - 1) / 4);
        expect(config.mazeIndex).toBe(expectedMazeIndex);
      }
    });

    it('should identify Challenging Stages at rounds 3, 7, 11, and 15 (round % 4 === 3)', () => {
      const challengingRounds = [3, 7, 11, 15];
      for (let r = 1; r <= 16; r++) {
        const config = getRallyXLevelConfig(r);
        expect(config.isChallengingStage).toBe(challengingRounds.includes(r));
      }
    });

    it('should provide player spawn at (15, 49) on an open pathway for all 16 rounds', () => {
      for (let r = 1; r <= 16; r++) {
        const config = getRallyXLevelConfig(r);
        expect(config.playerStart).toEqual({ col: 15, row: 49 });

        const rawMaze = RALLYX_MASTER_MAZES[config.mazeIndex];
        expect(rawMaze[49][15]).toBe(' '); // Pathway
      }
    });

    it('should specify 10 flags per round with exactly 1 Special, 1 Lucky, and 8 Regular flags', () => {
      for (let r = 1; r <= 16; r++) {
        const config = getRallyXLevelConfig(r);
        expect(config.flags.length).toBe(10);

        const specialFlags = config.flags.filter((f) => f.type === 'SPECIAL');
        const luckyFlags = config.flags.filter((f) => f.type === 'LUCKY');
        const regularFlags = config.flags.filter((f) => f.type === 'REGULAR');

        expect(specialFlags.length).toBe(1);
        expect(luckyFlags.length).toBe(1);
        expect(regularFlags.length).toBe(8);

        // Ensure flags are on open pathways (not walls)
        const rawMaze = RALLYX_MASTER_MAZES[config.mazeIndex];
        for (const flag of config.flags) {
          expect(rawMaze[flag.row][flag.col]).toBe(' ');
        }
      }
    });

    it('should specify authentic rock distributions from 4 to 11 rocks across rounds 1 to 16', () => {
      const expectedRockCounts = [4, 4, 5, 5, 6, 6, 7, 7, 8, 9, 10, 10, 10, 10, 10, 11];

      for (let r = 1; r <= 16; r++) {
        const config = getRallyXLevelConfig(r);
        expect(config.rocks.length).toBe(expectedRockCounts[r - 1]);

        // Ensure all rocks are placed on pathways
        const rawMaze = RALLYX_MASTER_MAZES[config.mazeIndex];
        for (const rock of config.rocks) {
          expect(rawMaze[rock.row][rock.col]).toBe(' ');
        }

        // Ensure no rock overlaps with any flag
        for (const rock of config.rocks) {
          for (const flag of config.flags) {
            expect(`${rock.col},${rock.row}`).not.toBe(`${flag.col},${flag.row}`);
          }
        }
      }
    });

    it('should configure 7 dormant red cars during Challenging Stages', () => {
      for (const r of [3, 7, 11, 15]) {
        const config = getRallyXLevelConfig(r);
        expect(config.enemySpawns.length).toBe(7);
      }
    });
  });

  describe('Endless Loop Mode (Round 17+)', () => {
    it('should loop master mazes every 4 rounds and retain 7 enemy cars', () => {
      const r17 = getRallyXLevelConfig(17);
      expect(r17.round).toBe(17);
      expect(r17.mazeIndex).toBe(0); // Maze 1
      expect(r17.isChallengingStage).toBe(false);
      expect(r17.enemySpawns.length).toBe(7);

      const r19 = getRallyXLevelConfig(19);
      expect(r19.round).toBe(19);
      expect(r19.isChallengingStage).toBe(true); // 19 % 4 === 3
    });
  });

  describe('Matrix Building, Border Wrapping & Collision Detection', () => {
    it('should build a 56x32 inner matrix by default with walls, rocks, and flags baked in', () => {
      const matrix = buildRallyXTileMatrix(1, false);
      expect(matrix.length).toBe(56);
      expect(matrix[0].length).toBe(32);

      // Verify Special Flag is placed
      const level1 = getRallyXLevelConfig(1);
      const specialFlag = level1.flags.find((f) => f.type === 'SPECIAL')!;
      expect(matrix[specialFlag.row][specialFlag.col]).toBe(RallyXTileType.FLAG_SPECIAL);

      // Verify Lucky Flag is placed
      const luckyFlag = level1.flags.find((f) => f.type === 'LUCKY')!;
      expect(matrix[luckyFlag.row][luckyFlag.col]).toBe(RallyXTileType.FLAG_LUCKY);

      // Verify Rock is placed
      const rock0 = level1.rocks[0];
      expect(matrix[rock0.row][rock0.col]).toBe(RallyXTileType.ROCK);
    });

    it('should build a 62x38 full world matrix when includeBorder is true', () => {
      const fullMatrix = buildRallyXTileMatrix(1, true);
      expect(fullMatrix.length).toBe(62);
      expect(fullMatrix[0].length).toBe(38);

      // Verify outer 3 rows/cols are BORDER_DECORATIVE
      expect(fullMatrix[0][0]).toBe(RallyXTileType.BORDER_DECORATIVE);
      expect(fullMatrix[2][2]).toBe(RallyXTileType.BORDER_DECORATIVE);
      expect(fullMatrix[61][37]).toBe(RallyXTileType.BORDER_DECORATIVE);

      // Verify inner player start is mapped with +3 offset
      const innerPos = { col: 15, row: 49 };
      const worldPos = innerToWorldTile(innerPos);
      expect(worldPos).toEqual({ col: 18, row: 52 });
      expect(isRallyXWall(fullMatrix, worldPos.col, worldPos.row)).toBe(false);
      expect(worldToInnerTile(worldPos)).toEqual(innerPos);
    });

    it('should detect both WALL and BORDER_DECORATIVE as impassable walls', () => {
      const innerMatrix = buildRallyXTileMatrix(1, false);
      expect(isRallyXWall(innerMatrix, -1, 10)).toBe(true);
      expect(isRallyXWall(innerMatrix, 32, 10)).toBe(true);
      expect(isRallyXWall(innerMatrix, 10, -1)).toBe(true);
      expect(isRallyXWall(innerMatrix, 10, 56)).toBe(true);
      expect(isRallyXWall(innerMatrix, 15, 49)).toBe(false);

      const fullMatrix = buildRallyXTileMatrix(1, true);
      expect(isRallyXWall(fullMatrix, 1, 1)).toBe(true); // BORDER_DECORATIVE
      expect(isRallyXWall(fullMatrix, 18, 52)).toBe(false); // Player spawn
    });
  });
});
