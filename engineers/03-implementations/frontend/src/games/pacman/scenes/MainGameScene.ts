/**
 * MainGameScene.ts
 * Core 60fps Phaser 4 Canvas Scene for Pac-Man.
 * Manages rendering, input buffer, ghosts FSM timers, collision math, and memory teardown.
 */

import Phaser from 'phaser';
import { InputService, PlayerIndex, ArcadeAction } from '@/core/input/InputService';
import { ArcadeBridge } from '@/core/bridge/ArcadeBridge';
import { PacmanMaze, TileType, Direction, DIRECTION_VECTORS, GridPos, MAZE_COLS, MAZE_ROWS, DEFAULT_TILE_SIZE } from '../logic/PacmanMaze';
import { PacmanGameState, PlayState, FRUIT_SPAWN_TILE } from '../logic/PacmanGameState';
import { GhostAI, GhostType, GhostMode, GHOST_CORNER_TARGETS, GHOST_HOUSE_RESPAWN } from '../logic/GhostAI';
import { PacmanAudioService } from '../audio/PacmanAudioService';

const SPEED_PACMAN_BASE = 130; // Pixels per second
const SPEED_GHOST_BASE = 120;  // Pixels per second

interface GhostEntity {
  type: GhostType;
  mode: GhostMode;
  x: number;
  y: number;
  gridPos: GridPos;
  direction: Direction;
  sprite: Phaser.GameObjects.Sprite;
  targetTile: GridPos;
}

export class MainGameScene extends Phaser.Scene {
  private maze!: PacmanMaze;
  private gameState!: PacmanGameState;

  private pacmanX: number = 0;
  private pacmanY: number = 0;
  private pacmanGridPos: GridPos = { col: 13, row: 26 };
  private currentDirection: Direction = Direction.NONE;
  private queuedDirection: Direction = Direction.NONE;
  private pacmanSprite!: Phaser.GameObjects.Sprite;

  private ghosts: Map<GhostType, GhostEntity> = new Map();

  // Maze rendering
  private mazeGraphics!: Phaser.GameObjects.Graphics;
  private pelletSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private fruitSprite: Phaser.GameObjects.Sprite | null = null;

  // Timers & FSM state
  private timerArrayPhaseIndex: number = 0;
  private phaseElapsedSec: number = 0;
  private frightenedTimeSec: number = 0;
  private frightenedFlashSec: number = 0;

  // UI Text
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  private isPausedState: boolean = false;
  private offsetX: number = 120; // Center 560px grid inside 800px width canvas
  private offsetY: number = 0;   // 720px height

  constructor() {
    super({ key: 'pacman:MainGameScene' });
  }

  public create(): void {
    this.maze = new PacmanMaze();
    this.gameState = new PacmanGameState(1);

    this.mazeGraphics = this.add.graphics();
    this.createUI();
    this.resetEntityPositions();
    this.renderMazeStatic();
    this.renderPellets();

    this.gameState.setPlayState(PlayState.PLAYING);

    // Teardown event listeners
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleTeardown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.handleTeardown, this);
  }

  public setPauseState(paused: boolean): void {
    this.isPausedState = paused;
    if (paused) {
      this.statusText.setText('PAUSED');
      this.statusText.setVisible(true);
    } else {
      this.statusText.setVisible(false);
    }
  }

  private createUI(): void {
    this.scoreText = this.add.text(20, 10, '1UP: 0', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    });

    this.levelText = this.add.text(350, 10, 'LVL 1', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#facc15',
    });

    this.livesText = this.add.text(680, 10, 'LIVES: 3', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ef4444',
    });

    this.statusText = this.add.text(400, 420, 'READY!', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#fde047',
    }).setOrigin(0.5);
    this.statusText.setVisible(false);
  }

  private resetEntityPositions(): void {
    // Pacman Start Position: Tile (13, 26)
    this.pacmanGridPos = { col: 13, row: 26 };
    const worldPos = PacmanMaze.tileToWorld(13, 26, DEFAULT_TILE_SIZE);
    this.pacmanX = this.offsetX + worldPos.x;
    this.pacmanY = this.offsetY + worldPos.y;
    this.currentDirection = Direction.LEFT;
    this.queuedDirection = Direction.LEFT;

    if (!this.pacmanSprite) {
      this.pacmanSprite = this.add.sprite(this.pacmanX, this.pacmanY, 'pacman:player');
    } else {
      this.pacmanSprite.setPosition(this.pacmanX, this.pacmanY);
      this.pacmanSprite.setVisible(true);
    }

    // Ghost Start Positions
    const ghostConfigs: Array<{ type: GhostType; startCol: number; startRow: number; key: string }> = [
      { type: GhostType.BLINKY, startCol: 13, startRow: 14, key: 'pacman:ghost_blinky' },
      { type: GhostType.PINKY, startCol: 13, startRow: 17, key: 'pacman:ghost_pinky' },
      { type: GhostType.INKY, startCol: 11, startRow: 17, key: 'pacman:ghost_inky' },
      { type: GhostType.CLYDE, startCol: 15, startRow: 17, key: 'pacman:ghost_clyde' },
    ];

    ghostConfigs.forEach(({ type, startCol, startRow, key }) => {
      const gWorld = PacmanMaze.tileToWorld(startCol, startRow, DEFAULT_TILE_SIZE);
      const gx = this.offsetX + gWorld.x;
      const gy = this.offsetY + gWorld.y;

      let ghost = this.ghosts.get(type);
      if (!ghost) {
        const sprite = this.add.sprite(gx, gy, key);
        ghost = {
          type,
          mode: GhostMode.SCATTER,
          x: gx,
          y: gy,
          gridPos: { col: startCol, row: startRow },
          direction: Direction.UP,
          sprite,
          targetTile: GHOST_CORNER_TARGETS[type],
        };
        this.ghosts.set(type, ghost);
      } else {
        ghost.mode = GhostMode.SCATTER;
        ghost.x = gx;
        ghost.y = gy;
        ghost.gridPos = { col: startCol, row: startRow };
        ghost.direction = Direction.UP;
        ghost.sprite.setTexture(key);
        ghost.sprite.setPosition(gx, gy);
        ghost.sprite.setVisible(true);
      }
    });

    this.timerArrayPhaseIndex = 0;
    this.phaseElapsedSec = 0;
    this.frightenedTimeSec = 0;
  }

  private renderMazeStatic(): void {
    this.mazeGraphics.clear();
    const grid = this.maze.getGrid();

    for (let r = 0; r < MAZE_ROWS; r++) {
      for (let c = 0; c < MAZE_COLS; c++) {
        const val = grid[r][c];
        const x = this.offsetX + c * DEFAULT_TILE_SIZE;
        const y = this.offsetY + r * DEFAULT_TILE_SIZE;

        if (val === TileType.WALL) {
          this.mazeGraphics.fillStyle(0x1e3a8a, 1); // Dark blue wall fill
          this.mazeGraphics.fillRect(x, y, DEFAULT_TILE_SIZE, DEFAULT_TILE_SIZE);
          this.mazeGraphics.lineStyle(1, 0x3b82f6, 1); // Neon blue stroke
          this.mazeGraphics.strokeRect(x, y, DEFAULT_TILE_SIZE, DEFAULT_TILE_SIZE);
        } else if (val === TileType.GHOST_GATE) {
          this.mazeGraphics.fillStyle(0xf472b6, 0.8);
          this.mazeGraphics.fillRect(x, y + 8, DEFAULT_TILE_SIZE, 4);
        }
      }
    }
  }

  private renderPellets(): void {
    // Clear old pellet sprites
    this.pelletSprites.forEach((sprite) => sprite.destroy());
    this.pelletSprites.clear();

    const grid = this.maze.getGrid();

    for (let r = 0; r < MAZE_ROWS; r++) {
      for (let c = 0; c < MAZE_COLS; c++) {
        const val = grid[r][c];
        const worldPos = PacmanMaze.tileToWorld(c, r, DEFAULT_TILE_SIZE);
        const x = this.offsetX + worldPos.x;
        const y = this.offsetY + worldPos.y;

        const key = `${c},${r}`;
        if (val === TileType.PELLET) {
          const sprite = this.add.sprite(x, y, 'pacman:pellet');
          this.pelletSprites.set(key, sprite);
        } else if (val === TileType.POWER_PELLET) {
          const sprite = this.add.sprite(x, y, 'pacman:power_pellet');
          this.pelletSprites.set(key, sprite);
        }
      }
    }
  }

  public update(_time: number, deltaMs: number): void {
    if (this.isPausedState || this.gameState.getPlayState() !== PlayState.PLAYING) {
      return;
    }

    const deltaSec = deltaMs / 1000;
    this.gameState.addPlayTime(deltaSec);

    this.handleInputQueries();
    this.updatePacmanPosition(deltaSec);
    this.updateGhostFSM(deltaSec);
    this.updateGhostsPosition(deltaSec);
    this.updateFruit(deltaSec);
    this.checkCollisions();
    this.updateUI();
  }

  private handleInputQueries(): void {
    if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.UP)) {
      this.queuedDirection = Direction.UP;
    } else if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.DOWN)) {
      this.queuedDirection = Direction.DOWN;
    } else if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.LEFT)) {
      this.queuedDirection = Direction.LEFT;
    } else if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.RIGHT)) {
      this.queuedDirection = Direction.RIGHT;
    }
  }

  private updatePacmanPosition(deltaSec: number): void {
    const tileCenter = PacmanMaze.tileToWorld(this.pacmanGridPos.col, this.pacmanGridPos.row, DEFAULT_TILE_SIZE);
    const worldCenterX = this.offsetX + tileCenter.x;
    const worldCenterY = this.offsetY + tileCenter.y;

    const distToCenter = Phaser.Math.Distance.Between(this.pacmanX, this.pacmanY, worldCenterX, worldCenterY);

    // If close to tile center, attempt to apply queued direction turn
    if (distToCenter < 4 && this.queuedDirection !== Direction.NONE) {
      const vec = DIRECTION_VECTORS[this.queuedDirection];
      const nextCol = this.pacmanGridPos.col + vec.col;
      const nextRow = this.pacmanGridPos.row + vec.row;

      if (!this.maze.isWall(nextCol, nextRow, false)) {
        this.currentDirection = this.queuedDirection;
        this.pacmanX = worldCenterX;
        this.pacmanY = worldCenterY;
      }
    }

    // Move in current direction if no wall
    const moveVec = DIRECTION_VECTORS[this.currentDirection];
    const nextCol = this.pacmanGridPos.col + moveVec.col;
    const nextRow = this.pacmanGridPos.row + moveVec.row;

    if (!this.maze.isWall(nextCol, nextRow, false)) {
      const speed = SPEED_PACMAN_BASE * deltaSec;
      this.pacmanX += moveVec.col * speed;
      this.pacmanY += moveVec.row * speed;

      // Update grid pos
      const newTile = PacmanMaze.worldToTile(this.pacmanX - this.offsetX, this.pacmanY - this.offsetY, DEFAULT_TILE_SIZE);
      const wrappedCol = PacmanMaze.wrapTunnelCol(newTile.col);
      this.pacmanGridPos = { col: wrappedCol, row: newTile.row };
    }

    this.pacmanSprite.setPosition(this.pacmanX, this.pacmanY);

    // Consume Pellet Check
    const consumed = this.maze.consumePellet(this.pacmanGridPos.col, this.pacmanGridPos.row);
    if (consumed !== TileType.EMPTY) {
      const key = `${this.pacmanGridPos.col},${this.pacmanGridPos.row}`;
      const sprite = this.pelletSprites.get(key);
      if (sprite) {
        sprite.destroy();
        this.pelletSprites.delete(key);
      }

      if (consumed === TileType.PELLET) {
        this.gameState.onEatPellet(this.maze.getRemainingPelletCount());
        PacmanAudioService.playWakka();
      } else if (consumed === TileType.POWER_PELLET) {
        this.gameState.onEatPowerPellet(this.maze.getRemainingPelletCount());
        PacmanAudioService.playPowerPellet();
        this.triggerFrightenedMode();
      }

      // Stage Clear Check
      if (this.maze.getRemainingPelletCount() === 0) {
        this.handleLevelClear();
      }
    }
  }

  private triggerFrightenedMode(): void {
    const spec = this.gameState.getCurrentSpec();
    if (spec.frightDurationSec <= 0) return;

    this.frightenedTimeSec = spec.frightDurationSec;

    this.ghosts.forEach((ghost) => {
      if (ghost.mode !== GhostMode.EATEN) {
        ghost.mode = GhostMode.FRIGHTENED;
        ghost.sprite.setTexture('pacman:ghost_frightened');
      }
    });
  }

  private updateGhostFSM(deltaSec: number): void {
    const spec = this.gameState.getCurrentSpec();

    // 1. Handle Frightened Timer
    if (this.frightenedTimeSec > 0) {
      this.frightenedTimeSec -= deltaSec;

      // Handle flashing blue/white near end of frightened mode
      if (this.frightenedTimeSec <= 2.0 && spec.frightFlashCount > 0) {
        this.frightenedFlashSec += deltaSec;
        const isWhite = Math.floor(this.frightenedFlashSec * 6) % 2 === 0;
        this.ghosts.forEach((g) => {
          if (g.mode === GhostMode.FRIGHTENED) {
            g.sprite.setTexture(isWhite ? 'pacman:ghost_frightened_flash' : 'pacman:ghost_frightened');
          }
        });
      }

      if (this.frightenedTimeSec <= 0) {
        this.frightenedTimeSec = 0;
        this.ghosts.forEach((g) => {
          if (g.mode === GhostMode.FRIGHTENED) {
            const currentPhaseMode = this.getCurrentPhaseMode();
            g.mode = currentPhaseMode;
            g.sprite.setTexture(`pacman:ghost_${g.type.toLowerCase()}`);
          }
        });
      }
      return;
    }

    // 2. Handle Scatter/Chase Timer Cycle Array
    this.phaseElapsedSec += deltaSec;
    const currentPhaseDuration = spec.timerArraySec[this.timerArrayPhaseIndex];

    if (currentPhaseDuration !== Infinity && this.phaseElapsedSec >= currentPhaseDuration) {
      this.phaseElapsedSec = 0;
      this.timerArrayPhaseIndex = Math.min(this.timerArrayPhaseIndex + 1, spec.timerArraySec.length - 1);
      const newMode = this.getCurrentPhaseMode();

      this.ghosts.forEach((g) => {
        if (g.mode === GhostMode.SCATTER || g.mode === GhostMode.CHASE) {
          g.mode = newMode;
        }
      });
    }
  }

  private getCurrentPhaseMode(): GhostMode {
    // Indices 0, 2, 4, 6 are SCATTER; Indices 1, 3, 5, 7 are CHASE
    return this.timerArrayPhaseIndex % 2 === 0 ? GhostMode.SCATTER : GhostMode.CHASE;
  }

  private updateGhostsPosition(deltaSec: number): void {
    const blinkyPos = this.ghosts.get(GhostType.BLINKY)?.gridPos || { col: 13, row: 14 };
    const clydePos = this.ghosts.get(GhostType.CLYDE)?.gridPos || { col: 15, row: 17 };
    const spec = this.gameState.getCurrentSpec();

    this.ghosts.forEach((ghost) => {
      // 1. Determine Target Tile
      if (ghost.mode === GhostMode.SCATTER) {
        ghost.targetTile = GHOST_CORNER_TARGETS[ghost.type];
      } else if (ghost.mode === GhostMode.CHASE) {
        ghost.targetTile = GhostAI.calculateTargetTile(
          ghost.type,
          this.pacmanGridPos,
          this.currentDirection,
          blinkyPos,
          clydePos
        );
      } else if (ghost.mode === GhostMode.EATEN) {
        ghost.targetTile = GHOST_HOUSE_RESPAWN;
      }

      // 2. Tile Center Steering
      const center = PacmanMaze.tileToWorld(ghost.gridPos.col, ghost.gridPos.row, DEFAULT_TILE_SIZE);
      const wCenterX = this.offsetX + center.x;
      const wCenterY = this.offsetY + center.y;
      const dist = Phaser.Math.Distance.Between(ghost.x, ghost.y, wCenterX, wCenterY);

      if (dist < 4) {
        if (ghost.mode === GhostMode.EATEN && ghost.gridPos.col === GHOST_HOUSE_RESPAWN.col && ghost.gridPos.row === GHOST_HOUSE_RESPAWN.row) {
          // Revive ghost
          ghost.mode = this.getCurrentPhaseMode();
          ghost.sprite.setTexture(`pacman:ghost_${ghost.type.toLowerCase()}`);
        } else {
          ghost.direction = GhostAI.getNextDirection(this.maze, ghost.gridPos, ghost.direction, ghost.targetTile);
        }
      }

      // 3. Move Ghost
      let speedMult = spec.ghostSpeedRatio;
      if (ghost.mode === GhostMode.FRIGHTENED) speedMult = 0.5;
      if (ghost.mode === GhostMode.EATEN) speedMult = 1.8;

      const speed = SPEED_GHOST_BASE * speedMult * deltaSec;
      const moveVec = DIRECTION_VECTORS[ghost.direction];
      ghost.x += moveVec.col * speed;
      ghost.y += moveVec.row * speed;

      const newTile = PacmanMaze.worldToTile(ghost.x - this.offsetX, ghost.y - this.offsetY, DEFAULT_TILE_SIZE);
      ghost.gridPos = { col: PacmanMaze.wrapTunnelCol(newTile.col), row: newTile.row };
      ghost.sprite.setPosition(ghost.x, ghost.y);
    });
  }

  private updateFruit(deltaSec: number): void {
    this.gameState.updateFruitTimer(deltaSec);
    const activeFruit = this.gameState.getActiveFruit();

    if (activeFruit) {
      if (!this.fruitSprite) {
        const worldPos = PacmanMaze.tileToWorld(FRUIT_SPAWN_TILE.col, FRUIT_SPAWN_TILE.row, DEFAULT_TILE_SIZE);
        const key = `pacman:fruit_${activeFruit.type.toLowerCase()}`;
        this.fruitSprite = this.add.sprite(this.offsetX + worldPos.x, this.offsetY + worldPos.y, key);
      } else {
        this.fruitSprite.setVisible(true);
      }

      // Pac-Man eat fruit check
      if (this.pacmanGridPos.col === FRUIT_SPAWN_TILE.col && this.pacmanGridPos.row === FRUIT_SPAWN_TILE.row) {
        this.gameState.consumeFruit();
        PacmanAudioService.playEatFruit();
        this.fruitSprite.destroy();
        this.fruitSprite = null;
      }
    } else if (this.fruitSprite) {
      this.fruitSprite.destroy();
      this.fruitSprite = null;
    }
  }

  private checkCollisions(): void {
    this.ghosts.forEach((ghost) => {
      const dist = Phaser.Math.Distance.Between(this.pacmanX, this.pacmanY, ghost.x, ghost.y);
      if (dist < 14) {
        if (ghost.mode === GhostMode.FRIGHTENED) {
          // Eat Ghost
          this.gameState.eatGhost();
          PacmanAudioService.playEatGhost();
          ghost.mode = GhostMode.EATEN;
          ghost.sprite.setTexture('pacman:ghost_eyes');
        } else if (ghost.mode === GhostMode.SCATTER || ghost.mode === GhostMode.CHASE) {
          // Pacman Dies
          this.handlePacmanDeath();
        }
      }
    });
  }

  private handlePacmanDeath(): void {
    PacmanAudioService.playDeath();
    const remainingLives = this.gameState.loseLife();

    if (remainingLives === 0) {
      this.statusText.setText('GAME OVER');
      this.statusText.setVisible(true);

      ArcadeBridge.emit('GAME_OVER', {
        gameId: 'pacman',
        score: this.gameState.getScore(),
        playTimeSeconds: Math.floor(this.gameState.getPlayTimeSeconds()),
        creditsUsed: 1,
      });
    } else {
      this.resetEntityPositions();
    }
  }

  private handleLevelClear(): void {
    PacmanAudioService.playLevelClear();
    this.gameState.advanceLevel();
    this.maze.resetMaze();
    this.renderPellets();
    this.resetEntityPositions();

    this.statusText.setText(`STAGE ${this.gameState.getLevel()}`);
    this.statusText.setVisible(true);
    this.time.delayedCall(2000, () => {
      this.statusText.setVisible(false);
    });
  }

  private updateUI(): void {
    this.scoreText.setText(`1UP: ${this.gameState.getScore()}`);
    this.levelText.setText(`LVL ${this.gameState.getLevel()}`);
    this.livesText.setText(`LIVES: ${this.gameState.getLives()}`);
  }

  private handleTeardown(): void {
    this.pelletSprites.forEach((s) => s.destroy());
    this.pelletSprites.clear();

    if (this.fruitSprite) {
      this.fruitSprite.destroy();
      this.fruitSprite = null;
    }

    this.ghosts.forEach((g) => g.sprite.destroy());
    this.ghosts.clear();

    if (this.pacmanSprite) {
      this.pacmanSprite.destroy();
    }

    if (this.mazeGraphics) {
      this.mazeGraphics.destroy();
    }

    // Teardown dynamic textures
    const pacmanTextureKeys = [
      'pacman:player',
      'pacman:ghost_blinky',
      'pacman:ghost_pinky',
      'pacman:ghost_inky',
      'pacman:ghost_clyde',
      'pacman:ghost_frightened',
      'pacman:ghost_frightened_flash',
      'pacman:ghost_eyes',
      'pacman:pellet',
      'pacman:power_pellet',
    ];

    pacmanTextureKeys.forEach((key) => {
      if (this.textures.exists(key)) {
        this.textures.removeKey(key);
      }
    });
  }
}
