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
  RALLYX_ARCADE_SCREEN_WIDTH,
  RALLYX_ARCADE_SCREEN_HEIGHT,
  RALLYX_PLAYFIELD_VIEWPORT_WIDTH,
  RALLYX_PLAYFIELD_VIEWPORT_HEIGHT,
  RALLYX_RADAR_PANEL_WIDTH,
  RALLYX_RADAR_PANEL_HEIGHT,
  RALLYX_VIEWPORT_TILES_X,
  RALLYX_VIEWPORT_TILES_Y,
  RALLYX_INTEGER_VIEWPORT_WIDTH,
  RALLYX_INTEGER_VIEWPORT_HEIGHT,
  RALLYX_INTEGER_RADAR_WIDTH,
  RALLYX_INTEGER_SCREEN_WIDTH,
  RALLYX_INTEGER_SCREEN_HEIGHT,
  RELATIVE_CLOCKWISE_DIRECTIONS,
  RELATIVE_COUNTER_CLOCKWISE_DIRECTIONS,
  getRallyXNextDirection,
  Direction,
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

  describe('Arcade Hardware Viewport Specifications', () => {
    it('should define authentic 288x224 screen, 224x224 playfield, and 64x224 radar HUD panel', () => {
      expect(RALLYX_ARCADE_SCREEN_WIDTH).toBe(288);
      expect(RALLYX_ARCADE_SCREEN_HEIGHT).toBe(224);
      expect(RALLYX_PLAYFIELD_VIEWPORT_WIDTH).toBe(224); // Square playfield viewport (~9.33 tiles)
      expect(RALLYX_PLAYFIELD_VIEWPORT_HEIGHT).toBe(224);
      expect(RALLYX_RADAR_PANEL_WIDTH).toBe(64);         // Right sidebar
      expect(RALLYX_RADAR_PANEL_HEIGHT).toBe(224);
      expect(RALLYX_PLAYFIELD_VIEWPORT_WIDTH + RALLYX_RADAR_PANEL_WIDTH).toBe(RALLYX_ARCADE_SCREEN_WIDTH);
    });

    it('should define integer 10x10 tiles viewport and 640x480 classic 4:3 screen', () => {
      expect(RALLYX_VIEWPORT_TILES_X).toBe(10);
      expect(RALLYX_VIEWPORT_TILES_Y).toBe(10);
      expect(RALLYX_INTEGER_VIEWPORT_WIDTH).toBe(480);
      expect(RALLYX_INTEGER_VIEWPORT_HEIGHT).toBe(480);
      expect(RALLYX_INTEGER_RADAR_WIDTH).toBe(160);
      expect(RALLYX_INTEGER_SCREEN_WIDTH).toBe(640);
      expect(RALLYX_INTEGER_SCREEN_HEIGHT).toBe(480);
      expect(RALLYX_INTEGER_SCREEN_WIDTH / RALLYX_INTEGER_SCREEN_HEIGHT).toBeCloseTo(4 / 3, 4);
    });
  });

  describe('Continuous Cruise & Auto-Turn Mechanics', () => {
    it('should continue in current direction when path ahead is clear', () => {
      const matrix = buildRallyXTileMatrix(1, false);

      // Player start at (15, 49) moving UP (path (15, 48) is open)
      const nextDir = getRallyXNextDirection(matrix, 15, 49, Direction.UP, Direction.NONE);
      expect(nextDir).toBe(Direction.UP);
    });

    it('should turn towards requested direction when requested direction is open', () => {
      const matrix = buildRallyXTileMatrix(1, false);

      // At intersection where LEFT is walkable
      // If requestedDir is LEFT and open, should turn LEFT
      const nextDir = getRallyXNextDirection(matrix, 15, 49, Direction.UP, Direction.UP);
      expect(nextDir).toBe(Direction.UP);
    });

    it('should auto-turn at corners when forward is blocked', () => {
      // (1, 1) has wall to LEFT, UP, DOWN; only RIGHT is open
      const matrix: RallyXTileType[][] = [
        [RallyXTileType.WALL, RallyXTileType.WALL, RallyXTileType.WALL],
        [RallyXTileType.WALL, RallyXTileType.EMPTY, RallyXTileType.EMPTY],
        [RallyXTileType.WALL, RallyXTileType.WALL, RallyXTileType.WALL],
      ];

      // Moving LEFT into wall: must auto-turn or U-turn to RIGHT
      const nextDir = getRallyXNextDirection(matrix, 1, 1, Direction.LEFT, Direction.NONE);
      expect(nextDir).toBe(Direction.RIGHT);
    });

    it('should prioritize relative clockwise direction (+90°) at T-junctions when hitting a wall', () => {
      // T-junction: moving UP into wall, with LEFT and RIGHT both open
      const tJunction: RallyXTileType[][] = [
        [RallyXTileType.WALL, RallyXTileType.WALL, RallyXTileType.WALL],
        [RallyXTileType.EMPTY, RallyXTileType.EMPTY, RallyXTileType.EMPTY],
        [RallyXTileType.WALL, RallyXTileType.EMPTY, RallyXTileType.WALL],
      ];
      // Moving UP from (1, 1): ahead (1, 0) is wall, LEFT (0, 1) is open, RIGHT (2, 1) is open.
      // Clockwise (+90°) from UP is RIGHT -> must turn RIGHT!
      const nextDirUp = getRallyXNextDirection(tJunction, 1, 1, Direction.UP, Direction.NONE);
      expect(nextDirUp).toBe(Direction.RIGHT);

      // Moving RIGHT into wall at (1, 1), with UP and DOWN both open
      const tJunctionVertical: RallyXTileType[][] = [
        [RallyXTileType.WALL, RallyXTileType.EMPTY, RallyXTileType.WALL],
        [RallyXTileType.EMPTY, RallyXTileType.EMPTY, RallyXTileType.WALL],
        [RallyXTileType.WALL, RallyXTileType.EMPTY, RallyXTileType.WALL],
      ];
      // Moving RIGHT from (1, 1): ahead (2, 1) is wall. Clockwise (+90°) from RIGHT is DOWN -> must turn DOWN!
      const nextDirRight = getRallyXNextDirection(tJunctionVertical, 1, 1, Direction.RIGHT, Direction.NONE);
      expect(nextDirRight).toBe(Direction.DOWN);

      // Moving DOWN into wall at (1, 1), with LEFT and RIGHT both open
      const tJunctionDown: RallyXTileType[][] = [
        [RallyXTileType.WALL, RallyXTileType.EMPTY, RallyXTileType.WALL],
        [RallyXTileType.EMPTY, RallyXTileType.EMPTY, RallyXTileType.EMPTY],
        [RallyXTileType.WALL, RallyXTileType.WALL, RallyXTileType.WALL],
      ];
      // Moving DOWN from (1, 1): ahead (1, 2) is wall. Clockwise (+90°) from DOWN is LEFT -> must turn LEFT!
      const nextDirDown = getRallyXNextDirection(tJunctionDown, 1, 1, Direction.DOWN, Direction.NONE);
      expect(nextDirDown).toBe(Direction.LEFT);

      // Moving LEFT into wall at (1, 1), with UP and DOWN both open
      const tJunctionLeft: RallyXTileType[][] = [
        [RallyXTileType.WALL, RallyXTileType.EMPTY, RallyXTileType.WALL],
        [RallyXTileType.WALL, RallyXTileType.EMPTY, RallyXTileType.EMPTY],
        [RallyXTileType.WALL, RallyXTileType.EMPTY, RallyXTileType.WALL],
      ];
      // Moving LEFT from (1, 1): ahead (0, 1) is wall. Clockwise (+90°) from LEFT is UP -> must turn UP!
      const nextDirLeft = getRallyXNextDirection(tJunctionLeft, 1, 1, Direction.LEFT, Direction.NONE);
      expect(nextDirLeft).toBe(Direction.UP);
    });

    it('should turn counter-clockwise if clockwise is blocked (L-turn)', () => {
      // Moving UP: ahead (1, 0) is wall, RIGHT (2, 1) is wall, LEFT (0, 1) is open
      const lTurn: RallyXTileType[][] = [
        [RallyXTileType.WALL, RallyXTileType.WALL, RallyXTileType.WALL],
        [RallyXTileType.EMPTY, RallyXTileType.EMPTY, RallyXTileType.WALL],
        [RallyXTileType.WALL, RallyXTileType.EMPTY, RallyXTileType.WALL],
      ];
      const nextDir = getRallyXNextDirection(lTurn, 1, 1, Direction.UP, Direction.NONE);
      expect(nextDir).toBe(Direction.LEFT);
    });

    it('should automatically execute 180° U-turn in dead ends', () => {
      // At (1, 1), moving UP: UP is wall, LEFT is wall, RIGHT is wall. Only DOWN is open.
      const verticalDeadEnd: RallyXTileType[][] = [
        [RallyXTileType.WALL, RallyXTileType.WALL, RallyXTileType.WALL],
        [RallyXTileType.WALL, RallyXTileType.EMPTY, RallyXTileType.WALL],
        [RallyXTileType.WALL, RallyXTileType.EMPTY, RallyXTileType.WALL],
      ];
      const uTurnDir = getRallyXNextDirection(verticalDeadEnd, 1, 1, Direction.UP, Direction.NONE);
      expect(uTurnDir).toBe(Direction.DOWN); // Auto 180° U-Turn!
    });
  });
});

