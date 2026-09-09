import { describe, it, expect } from 'vitest';
import {
  buildRallyXTileMatrix,
  getRallyXLevelConfig,
  RALLYX_BORDER_WIDTH,
  RALLYX_TILE_SIZE,
  Direction,
  DIRECTION_VECTORS,
  isRallyXWall,
  RELATIVE_CLOCKWISE_DIRECTIONS,
  RELATIVE_COUNTER_CLOCKWISE_DIRECTIONS,
  OPPOSITE_DIRECTIONS,
} from '../logic/RallyXMaze';
import { RallyXEnemyAI, EnemyCar } from '../logic/RallyXEnemyAI';

describe('Movement simulation with corrected enemy logic', () => {
  it('simulates both player and enemy over 180 frames at 60 FPS', () => {
    const config = getRallyXLevelConfig(1);
    const tileMatrix = buildRallyXTileMatrix(1, true);

    let playerCol = config.playerStart.col + RALLYX_BORDER_WIDTH;
    let playerRow = config.playerStart.row + RALLYX_BORDER_WIDTH;
    let playerX = (playerCol + 0.5) * RALLYX_TILE_SIZE;
    let playerY = (playerRow + 0.5) * RALLYX_TILE_SIZE;
    let currentDirection: Exclude<Direction, Direction.NONE> = Direction.UP;
    let bufferedDirection: Direction = Direction.NONE;

    const enemies = RallyXEnemyAI.createEnemies(config.enemySpawns, false, RALLYX_BORDER_WIDTH);
    const enemy = enemies[0];

    const PLAYER_BASE_SPEED = 240;
    const deltaSec = 1 / 60;

    let crashedAtFrame = -1;

    for (let frame = 1; frame <= 180; frame++) {
      // 1. Player
      const speed = PLAYER_BASE_SPEED;
      const moveDist = speed * deltaSec;
      const centerTileX = (playerCol + 0.5) * RALLYX_TILE_SIZE;
      const centerTileY = (playerRow + 0.5) * RALLYX_TILE_SIZE;
      const distToCenter = Math.hypot(playerX - centerTileX, playerY - centerTileY);

      if (
        bufferedDirection !== Direction.NONE &&
        bufferedDirection !== currentDirection &&
        distToCenter <= moveDist + 2.0
      ) {
        const v = DIRECTION_VECTORS[bufferedDirection as Exclude<Direction, Direction.NONE>];
        const nextC = playerCol + v.col;
        const nextR = playerRow + v.row;
        if (!isRallyXWall(tileMatrix, nextC, nextR)) {
          playerX = centerTileX;
          playerY = centerTileY;
          currentDirection = bufferedDirection as Exclude<Direction, Direction.NONE>;
          bufferedDirection = Direction.NONE;
        }
      }

      const curV = DIRECTION_VECTORS[currentDirection];
      const forwardC = playerCol + curV.col;
      const forwardR = playerRow + curV.row;

      if (isRallyXWall(tileMatrix, forwardC, forwardR)) {
        const reachedCenter =
          (currentDirection === Direction.UP && playerY <= centerTileY) ||
          (currentDirection === Direction.DOWN && playerY >= centerTileY) ||
          (currentDirection === Direction.LEFT && playerX <= centerTileX) ||
          (currentDirection === Direction.RIGHT && playerX >= centerTileX);

        if (reachedCenter) {
          playerX = centerTileX;
          playerY = centerTileY;

          const cw = RELATIVE_CLOCKWISE_DIRECTIONS[currentDirection] as Exclude<Direction, Direction.NONE>;
          const cwV = DIRECTION_VECTORS[cw];
          const ccw = RELATIVE_COUNTER_CLOCKWISE_DIRECTIONS[currentDirection] as Exclude<Direction, Direction.NONE>;
          const ccwV = DIRECTION_VECTORS[ccw];
          const opp = OPPOSITE_DIRECTIONS[currentDirection] as Exclude<Direction, Direction.NONE>;

          if (!isRallyXWall(tileMatrix, playerCol + cwV.col, playerRow + cwV.row)) {
            currentDirection = cw;
          } else if (!isRallyXWall(tileMatrix, playerCol + ccwV.col, playerRow + ccwV.row)) {
            currentDirection = ccw;
          } else {
            currentDirection = opp;
          }
        }
      }

      playerX += curV.col * moveDist;
      playerY += curV.row * moveDist;
      playerCol = Math.floor(playerX / RALLYX_TILE_SIZE);
      playerRow = Math.floor(playerY / RALLYX_TILE_SIZE);

      // 2. Enemy (using official RallyXEnemyAI.updateEnemy logic)
      RallyXEnemyAI.updateEnemy(
        enemy,
        tileMatrix,
        playerCol,
        playerRow,
        currentDirection,
        PLAYER_BASE_SPEED,
        deltaSec
      );

      const collision = RallyXEnemyAI.checkPlayerCollision(playerX, playerY, [enemy]);
      if (collision && crashedAtFrame === -1) {
        crashedAtFrame = frame;
      }
    }

    // Both cars drove 180 frames (3 full seconds) without instant collision!
    expect(crashedAtFrame).toBe(-1);
    expect(playerX).toBeGreaterThan(0);
    expect(enemy.x).toBeGreaterThan(0);
  });
});
