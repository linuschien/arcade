/**
 * MainGameScene.ts
 * Core 60fps Phaser 4 Canvas Scene for Pac-Man.
 * Manages rendering, input buffer, ghosts FSM timers, collision math, and memory teardown.
 */

import Phaser from 'phaser';
import { InputService, PlayerIndex, ArcadeAction } from '@/core/input/InputService';
import { ArcadeBridge } from '@/core/bridge/ArcadeBridge';
import { SoundEngine } from '@/core/audio/SoundEngine';
import { PacmanMaze, TileType, Direction, DIRECTION_VECTORS, OPPOSITE_DIRECTIONS, GridPos, MAZE_COLS, MAZE_ROWS, DEFAULT_TILE_SIZE, TUNNEL_ROW } from '../logic/PacmanMaze';
import { PacmanGameState, PlayState, FRUIT_SPAWN_TILE } from '../logic/PacmanGameState';
import { GhostAI, GhostType, GhostMode, GHOST_CORNER_TARGETS } from '../logic/GhostAI';
import { PacmanAudioService } from '../audio/PacmanAudioService';

const SPEED_PACMAN_BASE = 130; // Pixels per second
const SPEED_GHOST_BASE = 120;  // Pixels per second

export enum GhostHouseState {
  HOME = 'HOME',
  EXITING = 'EXITING',
  OUTSIDE = 'OUTSIDE',
}

interface GhostEntity {
  type: GhostType;
  mode: GhostMode;
  houseState: GhostHouseState;
  exitDelaySec: number;
  homeBaseX: number;
  homeBaseY: number;
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
  private pacmanGridPos: GridPos = { col: 13, row: 23 };
  private currentDirection: Direction = Direction.NONE;
  private queuedDirection: Direction = Direction.NONE;
  private pacmanSprite!: Phaser.GameObjects.Sprite;
  private chompTimerMs: number = 0;
  private isMouthOpen: boolean = true;

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
  private offsetX: number = 106; // Center 588px grid inside 800px canvas width
  private offsetY: number = 0;   // 36 rows * 21px = 756px height fits canvas perfectly

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

    // Start in READY state for full 3.7s Intro Theme music playback
    this.startReadyStateIntro();

    // Teardown event listeners
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleTeardown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.handleTeardown, this);
  }

  private startReadyStateIntro(): void {
    this.gameState.setPlayState(PlayState.READY);
    this.statusText.setText('READY!');
    this.statusText.setVisible(true);

    PacmanAudioService.playGameStart();

    // Wait 3.7s for full 32-note Intro Fanfare before starting gameplay loop & siren
    this.time.delayedCall(3700, () => {
      this.statusText.setVisible(false);
      this.gameState.setPlayState(PlayState.PLAYING);
      PacmanAudioService.startSiren(false);
    });
  }

  public setPauseState(paused: boolean): void {
    this.isPausedState = paused;
    if (paused) {
      this.statusText.setText('PAUSED');
      this.statusText.setVisible(true);
      PacmanAudioService.stopSiren();
    } else {
      this.statusText.setVisible(false);
      PacmanAudioService.startSiren(this.frightenedTimeSec > 0);
    }
  }

  private createUI(): void {
    this.scoreText = this.add.text(20, 8, '1UP: 0', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    });

    this.levelText = this.add.text(350, 8, 'LVL 1', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#facc15',
    });

    this.livesText = this.add.text(680, 8, 'LIVES: 3', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ef4444',
    });

    this.statusText = this.add.text(400, 430, 'READY!', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#fde047',
    }).setOrigin(0.5);
    this.statusText.setVisible(false);
  }

  private resetEntityPositions(): void {
    // Pacman Start Position: Tile (13, 23) - Authentic Arcade Pacman Start Corridor
    this.pacmanGridPos = { col: 13, row: 23 };
    const worldPos = PacmanMaze.tileToWorld(13, 23, DEFAULT_TILE_SIZE);
    this.pacmanX = this.offsetX + worldPos.x;
    this.pacmanY = this.offsetY + worldPos.y;
    this.currentDirection = Direction.LEFT;
    this.queuedDirection = Direction.LEFT;

    if (!this.pacmanSprite) {
      this.pacmanSprite = this.add.sprite(this.pacmanX, this.pacmanY, 'pacman:player_open');
    } else {
      this.pacmanSprite.setTexture('pacman:player_open');
      if (typeof this.pacmanSprite.setRotation === 'function') {
        this.pacmanSprite.setRotation(Math.PI); // Facing LEFT
      }
      this.pacmanSprite.setPosition(this.pacmanX, this.pacmanY);
      this.pacmanSprite.setVisible(true);
    }

    // Ghost Start Configurations: Timed House Exits & Bouncing Home Position
    const ghostConfigs: Array<{
      type: GhostType;
      startCol: number;
      startRow: number;
      houseState: GhostHouseState;
      exitDelaySec: number;
      key: string;
    }> = [
      { type: GhostType.BLINKY, startCol: 13, startRow: 14, houseState: GhostHouseState.OUTSIDE, exitDelaySec: 0, key: 'pacman:ghost_blinky' },
      { type: GhostType.PINKY, startCol: 13, startRow: 16, houseState: GhostHouseState.HOME, exitDelaySec: 0.5, key: 'pacman:ghost_pinky' },
      { type: GhostType.INKY, startCol: 11, startRow: 16, houseState: GhostHouseState.HOME, exitDelaySec: 4.0, key: 'pacman:ghost_inky' },
      { type: GhostType.CLYDE, startCol: 15, startRow: 16, houseState: GhostHouseState.HOME, exitDelaySec: 8.0, key: 'pacman:ghost_clyde' },
    ];

    ghostConfigs.forEach(({ type, startCol, startRow, houseState, exitDelaySec, key }) => {
      const gWorld = PacmanMaze.tileToWorld(startCol, startRow, DEFAULT_TILE_SIZE);
      const gx = this.offsetX + gWorld.x;
      const gy = this.offsetY + gWorld.y;

      let ghost = this.ghosts.get(type);
      if (!ghost) {
        const sprite = this.add.sprite(gx, gy, key);
        ghost = {
          type,
          mode: GhostMode.SCATTER,
          houseState,
          exitDelaySec,
          homeBaseX: gx,
          homeBaseY: gy,
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
        ghost.houseState = houseState;
        ghost.exitDelaySec = exitDelaySec;
        ghost.homeBaseX = gx;
        ghost.homeBaseY = gy;
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

  public update(time: number, deltaMs: number): void {
    if (this.isPausedState || this.gameState.getPlayState() !== PlayState.PLAYING) {
      return;
    }

    const deltaSec = deltaMs / 1000;
    this.gameState.addPlayTime(deltaSec);

    this.handleInputQueries();
    this.updatePacmanPosition(deltaSec, deltaMs);
    this.updateGhostFSM(deltaSec);
    this.updateGhostsPosition(deltaSec, time);
    this.updateFruit(deltaSec, time);
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

  private updatePacmanPosition(deltaSec: number, deltaMs: number): void {
    const tileCenter = PacmanMaze.tileToWorld(this.pacmanGridPos.col, this.pacmanGridPos.row, DEFAULT_TILE_SIZE);
    const worldCenterX = this.offsetX + tileCenter.x;
    const worldCenterY = this.offsetY + tileCenter.y;

    const distToCenter = Phaser.Math.Distance.Between(this.pacmanX, this.pacmanY, worldCenterX, worldCenterY);

    // 1. Instant 180-degree reverse handling
    if (
      this.queuedDirection !== Direction.NONE &&
      this.queuedDirection === OPPOSITE_DIRECTIONS[this.currentDirection]
    ) {
      const vec = DIRECTION_VECTORS[this.queuedDirection];
      const nextCol = this.pacmanGridPos.col + vec.col;
      const nextRow = this.pacmanGridPos.row + vec.row;
      if (!this.maze.isWall(nextCol, nextRow, false)) {
        this.currentDirection = this.queuedDirection;
      }
    }

    // 2. Corner turns at intersections or initial move start
    if (
      this.queuedDirection !== Direction.NONE &&
      this.queuedDirection !== this.currentDirection &&
      (distToCenter <= 6 || this.currentDirection === Direction.NONE)
    ) {
      const vec = DIRECTION_VECTORS[this.queuedDirection];
      const nextCol = this.pacmanGridPos.col + vec.col;
      const nextRow = this.pacmanGridPos.row + vec.row;

      if (!this.maze.isWall(nextCol, nextRow, false)) {
        this.currentDirection = this.queuedDirection;
        this.pacmanX = worldCenterX;
        this.pacmanY = worldCenterY;
      }
    }

    // 3. Move Pac-Man in current direction with precise wall stopping at tile center
    let isMoving = false;
    if (this.currentDirection !== Direction.NONE) {
      const speed = SPEED_PACMAN_BASE * deltaSec;
      const moveVec = DIRECTION_VECTORS[this.currentDirection];

      const aheadCol = this.pacmanGridPos.col + moveVec.col;
      const aheadRow = this.pacmanGridPos.row + moveVec.row;
      const isAheadWall = this.maze.isWall(aheadCol, aheadRow, false);

      const newX = this.pacmanX + moveVec.col * speed;
      const newY = this.pacmanY + moveVec.row * speed;

      if (isAheadWall) {
        // Clamp position so Pac-Man advances up to worldCenterX/Y of current tile, but not into wall
        if (moveVec.col > 0) this.pacmanX = Math.min(newX, worldCenterX);
        else if (moveVec.col < 0) this.pacmanX = Math.max(newX, worldCenterX);
        else this.pacmanX = newX;

        if (moveVec.row > 0) this.pacmanY = Math.min(newY, worldCenterY);
        else if (moveVec.row < 0) this.pacmanY = Math.max(newY, worldCenterY);
        else this.pacmanY = newY;

        isMoving = (this.pacmanX !== worldCenterX || this.pacmanY !== worldCenterY);
      } else {
        this.pacmanX = newX;
        this.pacmanY = newY;
        isMoving = true;
      }

      // Tunnel Horizontal Teleport Wrapping (Row 15)
      if (this.pacmanGridPos.row === TUNNEL_ROW) {
        const leftBoundary = this.offsetX - DEFAULT_TILE_SIZE * 0.5;
        const rightBoundary = this.offsetX + (MAZE_COLS + 0.5) * DEFAULT_TILE_SIZE;

        if (this.pacmanX < leftBoundary) {
          this.pacmanX = this.offsetX + (MAZE_COLS - 0.5) * DEFAULT_TILE_SIZE;
        } else if (this.pacmanX > rightBoundary) {
          this.pacmanX = this.offsetX + 0.5 * DEFAULT_TILE_SIZE;
        }
      }

      // Update grid pos
      const newTile = PacmanMaze.worldToTile(this.pacmanX - this.offsetX, this.pacmanY - this.offsetY, DEFAULT_TILE_SIZE);
      const wrappedCol = PacmanMaze.wrapTunnelCol(newTile.col);
      this.pacmanGridPos = { col: wrappedCol, row: newTile.row };
    }

    // 4. Pac-Man Chomping Animation & Directional Rotation
    if (isMoving) {
      this.chompTimerMs += deltaMs;
      if (this.chompTimerMs >= 100) {
        this.chompTimerMs = 0;
        this.isMouthOpen = !this.isMouthOpen;
      }
    } else {
      this.isMouthOpen = true;
    }

    const openTex = this.textures.exists('pacman:player_open') ? 'pacman:player_open' : 'pacman:player';
    const closeTex = this.textures.exists('pacman:player_closed') ? 'pacman:player_closed' : 'pacman:player';
    this.pacmanSprite.setTexture(this.isMouthOpen ? openTex : closeTex);

    // Direction Rotation Angles
    let rot = 0;
    if (this.currentDirection === Direction.RIGHT) rot = 0;
    else if (this.currentDirection === Direction.DOWN) rot = Math.PI / 2;
    else if (this.currentDirection === Direction.LEFT) rot = Math.PI;
    else if (this.currentDirection === Direction.UP) rot = -Math.PI / 2;

    if (typeof this.pacmanSprite.setRotation === 'function') {
      this.pacmanSprite.setRotation(rot);
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
    PacmanAudioService.setFrightenedSiren(true);

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
        PacmanAudioService.setFrightenedSiren(false);

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

  private updateGhostsPosition(deltaSec: number, timeMs: number): void {
    const blinkyPos = this.ghosts.get(GhostType.BLINKY)?.gridPos || { col: 13, row: 14 };
    const clydePos = this.ghosts.get(GhostType.CLYDE)?.gridPos || { col: 15, row: 16 };
    const spec = this.gameState.getCurrentSpec();

    this.ghosts.forEach((ghost) => {
      // 1. Ghost House Timed Exit FSM & Active Bouncing Animation
      if (ghost.houseState === GhostHouseState.HOME) {
        ghost.exitDelaySec -= deltaSec;

        // Smooth vertical bounce inside ghost house while waiting
        ghost.y = ghost.homeBaseY + Math.sin(timeMs * 0.008) * 4;
        ghost.sprite.setPosition(ghost.x, ghost.y);

        if (ghost.exitDelaySec <= 0) {
          ghost.houseState = GhostHouseState.EXITING;
        }
        return;
      }

      if (ghost.houseState === GhostHouseState.EXITING) {
        const doorWorld = PacmanMaze.tileToWorld(13, 14, DEFAULT_TILE_SIZE);
        const doorX = this.offsetX + doorWorld.x;
        const doorY = this.offsetY + doorWorld.y;

        // Move to house center (13, 16) first if at side
        const houseCenterX = this.offsetX + PacmanMaze.tileToWorld(13, 16, DEFAULT_TILE_SIZE).x;
        if (Math.abs(ghost.x - houseCenterX) > 2) {
          ghost.x += (houseCenterX > ghost.x ? 1 : -1) * SPEED_GHOST_BASE * deltaSec * 0.8;
        } else {
          ghost.x = houseCenterX;
          ghost.y -= SPEED_GHOST_BASE * deltaSec * 0.8;
        }

        const newTile = PacmanMaze.worldToTile(ghost.x - this.offsetX, ghost.y - this.offsetY, DEFAULT_TILE_SIZE);
        ghost.gridPos = { col: newTile.col, row: newTile.row };
        ghost.sprite.setPosition(ghost.x, ghost.y);

        if (Phaser.Math.Distance.Between(ghost.x, ghost.y, doorX, doorY) < 4) {
          ghost.houseState = GhostHouseState.OUTSIDE;
          ghost.direction = Direction.LEFT;
        }
        return;
      }

      // 2. Determine Target Tile for Ghost Outside
      const allowGatePass = ghost.mode === GhostMode.EATEN;

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
        // Eaten ghost target door (13, 14) first while outside to avoid wall bumping
        if (ghost.gridPos.col === 13 && (ghost.gridPos.row === 14 || ghost.gridPos.row === 15)) {
          ghost.targetTile = { col: 13, row: 16 }; // Inside house center
        } else {
          ghost.targetTile = { col: 13, row: 14 }; // Door entrance outside house
        }
      }

      // 3. Tile Center Steering
      const center = PacmanMaze.tileToWorld(ghost.gridPos.col, ghost.gridPos.row, DEFAULT_TILE_SIZE);
      const wCenterX = this.offsetX + center.x;
      const wCenterY = this.offsetY + center.y;
      const dist = Phaser.Math.Distance.Between(ghost.x, ghost.y, wCenterX, wCenterY);

      if (dist < 4) {
        if (ghost.mode === GhostMode.EATEN && ghost.gridPos.col === 13 && ghost.gridPos.row === 16) {
          // Revive eaten ghost: reset texture, set houseState = HOME, and rest for 2.0 seconds inside house!
          ghost.mode = this.getCurrentPhaseMode();
          ghost.sprite.setTexture(`pacman:ghost_${ghost.type.toLowerCase()}`);
          ghost.houseState = GhostHouseState.HOME;
          ghost.exitDelaySec = 2.0;
          ghost.homeBaseX = wCenterX;
          ghost.homeBaseY = wCenterY;
          return;
        } else {
          const isEaten = ghost.mode === GhostMode.EATEN;
          ghost.direction = GhostAI.getNextDirection(
            this.maze,
            ghost.gridPos,
            ghost.direction,
            ghost.targetTile,
            allowGatePass,
            false,
            isEaten
          );
        }
      }

      // 4. Move Ghost
      let speedMult = spec.ghostSpeedRatio;
      if (ghost.mode === GhostMode.FRIGHTENED) speedMult = 0.5;
      if (ghost.mode === GhostMode.EATEN) speedMult = 1.8;

      const speed = SPEED_GHOST_BASE * speedMult * deltaSec;
      const moveVec = DIRECTION_VECTORS[ghost.direction];
      ghost.x += moveVec.col * speed;
      ghost.y += moveVec.row * speed;

      // Tunnel Horizontal Teleport Wrapping for Ghosts
      if (ghost.gridPos.row === TUNNEL_ROW) {
        const leftBoundary = this.offsetX - DEFAULT_TILE_SIZE * 0.5;
        const rightBoundary = this.offsetX + (MAZE_COLS + 0.5) * DEFAULT_TILE_SIZE;

        if (ghost.x < leftBoundary) {
          ghost.x = this.offsetX + (MAZE_COLS - 0.5) * DEFAULT_TILE_SIZE;
        } else if (ghost.x > rightBoundary) {
          ghost.x = this.offsetX + 0.5 * DEFAULT_TILE_SIZE;
        }
      } else {
        // Clamp to active maze bounds when not in tunnel
        ghost.x = Phaser.Math.Clamp(ghost.x, this.offsetX + 10, this.offsetX + (MAZE_COLS - 0.5) * DEFAULT_TILE_SIZE);
        ghost.y = Phaser.Math.Clamp(ghost.y, this.offsetY + 10, this.offsetY + (MAZE_ROWS - 0.5) * DEFAULT_TILE_SIZE);
      }

      const newTile = PacmanMaze.worldToTile(ghost.x - this.offsetX, ghost.y - this.offsetY, DEFAULT_TILE_SIZE);
      ghost.gridPos = { col: PacmanMaze.wrapTunnelCol(newTile.col), row: newTile.row };
      ghost.sprite.setPosition(ghost.x, ghost.y);
    });
  }

  private updateFruit(deltaSec: number, timeMs: number): void {
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

      // Fruit Flash Hint: Flash during first 1.5s (remainingTimeSec >= 8.0s) and final 2.0s (remainingTimeSec <= 2.0s)
      const timer = activeFruit.remainingTimeSec;
      const isFlashingPeriod = (timer >= 8.0 || timer <= 2.0);

      if (isFlashingPeriod && this.fruitSprite) {
        const isVisible = Math.floor(timeMs * 0.008) % 2 === 0;
        this.fruitSprite.setVisible(isVisible);
      } else if (this.fruitSprite) {
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
      // Only check collisions if ghost is outside house
      if (ghost.houseState !== GhostHouseState.OUTSIDE) return;

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
    this.gameState.setPlayState(PlayState.DYING);
    PacmanAudioService.stopSiren();
    PacmanAudioService.playDeath();

    // Hide ghost sprites during death animation
    this.ghosts.forEach((g) => g.sprite.setVisible(false));

    // Play 11-frame wilting death animation
    for (let frame = 0; frame <= 10; frame++) {
      this.time.delayedCall(frame * 90, () => {
        if (this.pacmanSprite) {
          const key = `pacman:death_${frame}`;
          if (this.textures.exists(key)) {
            this.pacmanSprite.setTexture(key);
          }
        }
      });
    }

    // After 1.0s death animation finishes, process lives & reset/respawn
    this.time.delayedCall(1050, () => {
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
        // Respawn & play Intro Fanfare again with READY banner!
        this.resetEntityPositions();
        this.startReadyStateIntro();
      }
    });
  }

  private handleLevelClear(): void {
    PacmanAudioService.stopSiren();
    PacmanAudioService.playLevelClear();
    this.gameState.advanceLevel();
    this.maze.resetMaze();
    this.renderPellets();
    this.resetEntityPositions();

    this.statusText.setText(`STAGE ${this.gameState.getLevel()}`);
    this.statusText.setVisible(true);
    this.time.delayedCall(2000, () => {
      this.statusText.setVisible(false);
      this.gameState.setPlayState(PlayState.PLAYING);
      PacmanAudioService.startSiren(false);
    });
  }

  private updateUI(): void {
    this.scoreText.setText(`1UP: ${this.gameState.getScore()}`);
    this.levelText.setText(`LVL ${this.gameState.getLevel()}`);
    this.livesText.setText(`LIVES: ${this.gameState.getLives()}`);
  }

  private handleTeardown(): void {
    PacmanAudioService.stopSiren();

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
      'pacman:player_open',
      'pacman:player_closed',
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

    for (let f = 0; f <= 10; f++) {
      pacmanTextureKeys.push(`pacman:death_${f}`);
    }

    pacmanTextureKeys.forEach((key) => {
      if (this.textures.exists(key)) {
        this.textures.removeKey(key);
      }
    });
  }
}
