import { describe, it, expect } from 'vitest';
import {
  buildRallyXTileMatrix,
  getRallyXLevelConfig,
  RALLYX_BORDER_WIDTH,
  RALLYX_TILE_SIZE,
  Direction,
  DIRECTION_VECTORS,
  isRallyXWall,
} from '../logic/RallyXMaze';
import { RallyXEnemyAI, EnemyCar, EnemyState } from '../logic/RallyXEnemyAI';

describe('Simulate 3 enemy cars at start of Round 4', () => {
  it('prevents mutual head-on start collision between side chasers', () => {
    const config = getRallyXLevelConfig(4);
    const tileMatrix = buildRallyXTileMatrix(4, true);

    let playerCol = config.playerStart.col + RALLYX_BORDER_WIDTH;
    let playerRow = config.playerStart.row + RALLYX_BORDER_WIDTH;
    let playerX = (playerCol + 0.5) * RALLYX_TILE_SIZE;
    let playerY = (playerRow + 0.5) * RALLYX_TILE_SIZE;
    let currentDirection = Direction.UP;

    const enemies = RallyXEnemyAI.createEnemies(config.enemySpawns, false, RALLYX_BORDER_WIDTH);

    const PLAYER_BASE_SPEED = 240;
    const deltaSec = 1 / 60;

    let bumpCount = 0;

    for (let frame = 1; frame <= 180; frame++) {
      // Player moves up
      const moveDist = PLAYER_BASE_SPEED * deltaSec;
      playerY -= moveDist;
      playerRow = Math.floor(playerY / RALLYX_TILE_SIZE);

      enemies.forEach((enemy) => {
        RallyXEnemyAI.updateEnemy(
          enemy,
          tileMatrix,
          playerCol,
          playerRow,
          currentDirection,
          PLAYER_BASE_SPEED,
          deltaSec,
          enemies
        );
      });

      const bumps = RallyXEnemyAI.checkCarBumps(enemies);
      if (bumps.length > 0) {
        bumpCount++;
        console.log(`BUMP occurred at frame ${frame} (time ${(frame / 60).toFixed(2)}s)!`);
        bumps.forEach((b) => {
          console.log(
            `  Car ${b.index} at (${b.col - RALLYX_BORDER_WIDTH}, ${b.row - RALLYX_BORDER_WIDTH}) state: ${b.state} dir: ${b.direction}`
          );
        });
      }

      if (frame % 30 === 0) {
        console.log(`--- Frame ${frame} (${(frame / 60).toFixed(2)}s) ---`);
        console.log(
          `Player at col ${playerCol - RALLYX_BORDER_WIDTH}, row ${playerRow - RALLYX_BORDER_WIDTH}`
        );
        enemies.forEach((e) => {
          console.log(
            `  Enemy ${e.index}: inner col ${e.col - RALLYX_BORDER_WIDTH}, row ${e.row - RALLYX_BORDER_WIDTH}, dir ${e.direction}, state ${e.state}, x: ${e.x.toFixed(1)}, y: ${e.y.toFixed(1)}`
          );
        });
      }
    }

    console.log(`Total bumps: ${bumpCount}`);
    expect(bumpCount).toBe(0);
    // All 3 cars should remain in CHASING state throughout the start phase
    enemies.forEach((e) => {
      expect(e.state).toBe(EnemyState.CHASING);
    });
  });
});

