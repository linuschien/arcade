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
const CHARACTER_SPRITE_SIZE = 34; // Scaled to fill 35px visual corridor width

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

  // UI Text & Life Sprites
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private lifeSprites: Phaser.GameObjects.Sprite[] = [];

  private isPausedState: boolean = false;
  private offsetX: number = 6; // Center 588px grid inside 600px canvas width
  private offsetY: number = 0; // 33 rows * 21px = 693px height fits canvas perfectly

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

    // Listen for scene pause/resume events (e.g. window tab blur / refocus)
    if (typeof this.events?.on === 'function') {
      this.events.on(Phaser.Scenes.Events.PAUSE, () => {
        PacmanAudioService.stopSiren();
        SoundEngine.suspend();
      });
      this.events.on(Phaser.Scenes.Events.RESUME, () => {
        SoundEngine.resume();
        if (this.gameState.getPlayState() === PlayState.PLAYING) {
          PacmanAudioService.startSiren(this.frightenedTimeSec > 0);
        }
      });
    }

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
      SoundEngine.suspend();
    } else {
      this.statusText.setVisible(false);
      SoundEngine.resume();
      if (this.gameState.getPlayState() === PlayState.PLAYING) {
        PacmanAudioService.startSiren(this.frightenedTimeSec > 0);
      }
    }
  }

  private createUI(): void {
    // Top-Left: LEVEL text
    this.levelText = this.add.text(16, 8, 'LEVEL 1', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#facc15',
    });

    // Top-Center: Score text
    this.scoreText = this.add.text(300, 8, '1UP: 0', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5, 0);

    // Top-Right: Pac-Man Lives Icons (Max 5 reserve life icons, compact 18x18px size)
    this.lifeSprites = [];
    for (let i = 0; i < 5; i++) {
      const icon = this.add.sprite(580 - i * 22, 18, 'pacman:player_open');
      if (typeof icon.setDisplaySize === 'function') {
        icon.setDisplaySize(18, 18);
      }
      if (typeof icon.setRotation === 'function') {
        icon.setRotation(Math.PI); // Facing Left like classic Pacman extra life icons
      }
      icon.setVisible(false);
      this.lifeSprites.push(icon);
    }

    this.statusText = this.add.text(300, 400, 'READY!', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#fde047',
    }).setOrigin(0.5);
    this.statusText.setVisible(false);
  }

  private resetEntityPositions(): void {
    // Pacman Start Position: Tile (13.5, 23) - Centered in 2-tile wide central corridor (col 13 & 14)
    this.pacmanGridPos = { col: 13, row: 23 };
    const worldPos = PacmanMaze.tileToWorld(13.5, 23, DEFAULT_TILE_SIZE);
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
    if (typeof this.pacmanSprite.setDisplaySize === 'function') {
      this.pacmanSprite.setDisplaySize(CHARACTER_SPRITE_SIZE, CHARACTER_SPRITE_SIZE);
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
      if (typeof ghost.sprite.setDisplaySize === 'function') {
        ghost.sprite.setDisplaySize(CHARACTER_SPRITE_SIZE, CHARACTER_SPRITE_SIZE);
      }
    });

    this.timerArrayPhaseIndex = 0;
    this.phaseElapsedSec = 0;
    this.frightenedTimeSec = 0;
  }

  private renderMazeStatic(): void {
    this.mazeGraphics.clear();
    const grid = this.maze.getGrid();

    // 1. Draw dark background for wall tiles
    for (let r = 0; r < MAZE_ROWS; r++) {
      for (let c = 0; c < MAZE_COLS; c++) {
        const val = grid[r][c];
        const x = this.offsetX + c * DEFAULT_TILE_SIZE;
        const y = this.offsetY + r * DEFAULT_TILE_SIZE;

        if (val === TileType.WALL) {
          // Fill interior with pure dark canvas background
          this.mazeGraphics.fillStyle(0x050b14, 1);
          this.mazeGraphics.fillRect(x, y, DEFAULT_TILE_SIZE, DEFAULT_TILE_SIZE);
        } else if (val === TileType.GHOST_GATE) {
          this.mazeGraphics.fillStyle(0xf472b6, 0.9);
          this.mazeGraphics.fillRect(x, y + 8, DEFAULT_TILE_SIZE, 5);
        }
      }
    }

    const isWallTile = (col: number, row: number): boolean => {
      if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS) return true;
      return grid[row][col] === TileType.WALL;
    };

    const drawLine = (x1: number, y1: number, x2: number, y2: number) => {
      if (typeof this.mazeGraphics.lineBetween === 'function') {
        this.mazeGraphics.lineBetween(x1, y1, x2, y2);
      }
    };

    const s = DEFAULT_TILE_SIZE;
    const INSET_RATIO = 0.40; // 40% of tile size = 8px inset for 21px tile
    const inset = Math.round(s * INSET_RATIO);

    // Render single neon blue boundary line inset by 40% (8px).
    // This expands visual corridor width to 37px, shrinks 2-tile walls to 26px,
    // and keeps 1-tile walls (ghost house) crisp at 5px.
    // Endpoints extend by 1px to ensure 100% gapless stroke overlaps across all corners and tile joins.
    this.mazeGraphics.lineStyle(2, 0x1d6ef5, 1);

    for (let r = 0; r < MAZE_ROWS; r++) {
      for (let c = 0; c < MAZE_COLS; c++) {
        if (grid[r][c] !== TileType.WALL) continue;

        const x = this.offsetX + c * s;
        const y = this.offsetY + r * s;

        // Top inset line
        if (!isWallTile(c, r - 1)) {
          let x1 = x;
          if (!isWallTile(c - 1, r)) {
            x1 = x + inset; // Outer corner
          } else if (isWallTile(c - 1, r) && !isWallTile(c - 1, r - 1)) {
            x1 = x; // Straight horizontal wall continuation
          } else if (isWallTile(c - 1, r) && isWallTile(c - 1, r - 1)) {
            x1 = x - inset; // T-junction: extend LEFT to meet vertical bar at x - inset
          }

          let x2 = x + s;
          if (!isWallTile(c + 1, r)) {
            x2 = x + s - inset; // Outer corner
          } else if (isWallTile(c + 1, r) && !isWallTile(c + 1, r - 1)) {
            x2 = x + s; // Straight horizontal wall continuation
          } else if (isWallTile(c + 1, r) && isWallTile(c + 1, r - 1)) {
            x2 = x + s + inset; // T-junction: extend RIGHT to meet vertical bar at x + s + inset
          }
          drawLine(x1 - 1, y + inset, x2 + 1, y + inset);
        }

        // Bottom inset line
        if (!isWallTile(c, r + 1)) {
          let x1 = x;
          if (!isWallTile(c - 1, r)) {
            x1 = x + inset; // Outer corner
          } else if (isWallTile(c - 1, r) && !isWallTile(c - 1, r + 1)) {
            x1 = x; // Straight horizontal wall continuation
          } else if (isWallTile(c - 1, r) && isWallTile(c - 1, r + 1)) {
            x1 = x - inset; // T-junction: extend LEFT to meet vertical bar at x - inset
          }

          let x2 = x + s;
          if (!isWallTile(c + 1, r)) {
            x2 = x + s - inset; // Outer corner
          } else if (isWallTile(c + 1, r) && !isWallTile(c + 1, r + 1)) {
            x2 = x + s; // Straight horizontal wall continuation
          } else if (isWallTile(c + 1, r) && isWallTile(c + 1, r + 1)) {
            x2 = x + s + inset; // T-junction: extend RIGHT to meet vertical bar at x + s + inset
          }
          drawLine(x1 - 1, y + s - inset, x2 + 1, y + s - inset);
        }

        // Left inset line
        if (!isWallTile(c - 1, r)) {
          let y1 = y;
          if (!isWallTile(c, r - 1)) {
            y1 = y + inset; // Outer corner
          } else if (isWallTile(c, r - 1) && !isWallTile(c - 1, r - 1)) {
            y1 = y; // Straight vertical wall continuation
          } else if (isWallTile(c, r - 1) && isWallTile(c - 1, r - 1)) {
            y1 = y - inset; // T-junction: extend UP to meet horizontal bar at y - inset
          }

          let y2 = y + s;
          if (!isWallTile(c, r + 1)) {
            y2 = y + s - inset; // Outer corner
          } else if (isWallTile(c, r + 1) && !isWallTile(c - 1, r + 1)) {
            y2 = y + s; // Straight vertical wall continuation
          } else if (isWallTile(c, r + 1) && isWallTile(c - 1, r + 1)) {
            y2 = y + s + inset; // T-junction: extend DOWN to meet horizontal bar at y + s + inset
          }
          drawLine(x + inset, y1 - 1, x + inset, y2 + 1);
        }

        // Right inset line
        if (!isWallTile(c + 1, r)) {
          let y1 = y;
          if (!isWallTile(c, r - 1)) {
            y1 = y + inset; // Outer corner
          } else if (isWallTile(c, r - 1) && !isWallTile(c + 1, r - 1)) {
            y1 = y; // Straight vertical wall continuation
          } else if (isWallTile(c, r - 1) && isWallTile(c + 1, r - 1)) {
            y1 = y - inset; // T-junction: extend UP to meet horizontal bar at y - inset
          }

          let y2 = y + s;
          if (!isWallTile(c, r + 1)) {
            y2 = y + s - inset; // Outer corner
          } else if (isWallTile(c, r + 1) && !isWallTile(c + 1, r + 1)) {
            y2 = y + s; // Straight vertical wall continuation
          } else if (isWallTile(c, r + 1) && isWallTile(c + 1, r + 1)) {
            y2 = y + s + inset; // T-junction: extend DOWN to meet horizontal bar at y + s + inset
          }
          drawLine(x + s - inset, y1 - 1, x + s - inset, y2 + 1);
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
          if (typeof sprite.setDisplaySize === 'function') {
            sprite.setDisplaySize(8, 8);
          }
          this.pelletSprites.set(key, sprite);
        } else if (val === TileType.POWER_PELLET) {
          const sprite = this.add.sprite(x, y, 'pacman:power_pellet');
          if (typeof sprite.setDisplaySize === 'function') {
            sprite.setDisplaySize(18, 18);
          }
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
    if (typeof this.pacmanSprite.setDisplaySize === 'function') {
      this.pacmanSprite.setDisplaySize(CHARACTER_SPRITE_SIZE, CHARACTER_SPRITE_SIZE);
    }

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
        if (typeof ghost.sprite.setDisplaySize === 'function') {
          ghost.sprite.setDisplaySize(CHARACTER_SPRITE_SIZE, CHARACTER_SPRITE_SIZE);
        }
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
            if (typeof g.sprite.setDisplaySize === 'function') {
              g.sprite.setDisplaySize(CHARACTER_SPRITE_SIZE, CHARACTER_SPRITE_SIZE);
            }
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
            if (typeof g.sprite.setDisplaySize === 'function') {
              g.sprite.setDisplaySize(CHARACTER_SPRITE_SIZE, CHARACTER_SPRITE_SIZE);
            }
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
        const houseCenterX = this.offsetX + PacmanMaze.tileToWorld(13, 16, DEFAULT_TILE_SIZE).x;
        const houseCenterY = this.offsetY + PacmanMaze.tileToWorld(13, 16, DEFAULT_TILE_SIZE).y;
        const distToHomeCenter = Phaser.Math.Distance.Between(ghost.x, ghost.y, houseCenterX, houseCenterY);

        if (distToHomeCenter < 14 || (ghost.gridPos.col === 13 && ghost.gridPos.row === 16)) {
          // REVIVE GHOST: Always restore to ORIGINAL CHARACTER COLOR and normal SCATTER/CHASE mode!
          ghost.mode = this.getCurrentPhaseMode();
          ghost.sprite.setTexture(`pacman:ghost_${ghost.type.toLowerCase()}`);
          if (typeof ghost.sprite.setDisplaySize === 'function') {
            ghost.sprite.setDisplaySize(CHARACTER_SPRITE_SIZE, CHARACTER_SPRITE_SIZE);
          }
          ghost.x = houseCenterX;
          ghost.y = houseCenterY;
          ghost.homeBaseX = houseCenterX;
          ghost.homeBaseY = houseCenterY;
          ghost.gridPos = { col: 13, row: 16 };
          ghost.houseState = GhostHouseState.HOME;
          ghost.exitDelaySec = 2.0;
          ghost.sprite.setPosition(ghost.x, ghost.y);
          return;
        }

        // Target tile inside house center (13, 16)
        ghost.targetTile = { col: 13, row: 16 };
      }

      // 3. Tile Center Steering
      const center = PacmanMaze.tileToWorld(ghost.gridPos.col, ghost.gridPos.row, DEFAULT_TILE_SIZE);
      const wCenterX = this.offsetX + center.x;
      const wCenterY = this.offsetY + center.y;
      const dist = Phaser.Math.Distance.Between(ghost.x, ghost.y, wCenterX, wCenterY);

      if (dist < 4) {
        const isEaten = ghost.mode === GhostMode.EATEN;
        if (isEaten && ghost.gridPos.col === 13 && ghost.gridPos.row === 14) {
          ghost.direction = Direction.DOWN;
        } else {
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

      // 5. Ghost Skirt Flutter Walking Animation (Frame 0 & 1)
      const animFrame = Math.floor(timeMs * 0.007) % 2;
      let frameKey = '';

      if (ghost.mode === GhostMode.EATEN) {
        frameKey = 'pacman:ghost_eyes';
      } else if (ghost.mode === GhostMode.FRIGHTENED) {
        const isFlashing = this.frightenedTimeSec <= 2.0 && Math.floor(this.frightenedFlashSec * 6) % 2 === 0;
        const prefix = isFlashing ? 'pacman:ghost_frightened_flash' : 'pacman:ghost_frightened';
        frameKey = `${prefix}_${animFrame}`;
      } else {
        frameKey = `pacman:ghost_${ghost.type.toLowerCase()}_${animFrame}`;
      }

      if (this.textures.exists(frameKey)) {
        ghost.sprite.setTexture(frameKey);
      }
      if (typeof ghost.sprite.setDisplaySize === 'function') {
        ghost.sprite.setDisplaySize(CHARACTER_SPRITE_SIZE, CHARACTER_SPRITE_SIZE);
      }
    });
  }

  private showFloatingScore(x: number, y: number, score: number, color: string = '#38bdf8'): void {
    const textObj = this.add.text(x, y, score.toString(), {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 0.5).setDepth(100);

    let flashCount = 0;
    const flashTimer = this.time.addEvent({
      delay: 90,
      loop: true,
      callback: () => {
        flashCount++;
        if (textObj && textObj.active) {
          textObj.setVisible(flashCount % 2 === 0);
        }
      },
    });

    this.tweens.add({
      targets: textObj,
      y: y - 20,
      duration: 1000,
      onComplete: () => {
        flashTimer.destroy();
        if (textObj && textObj.active) {
          textObj.destroy();
        }
      },
    });
  }

  private updateFruit(deltaSec: number, timeMs: number): void {
    this.gameState.updateFruitTimer(deltaSec);
    const activeFruit = this.gameState.getActiveFruit();

    if (activeFruit) {
      if (!this.fruitSprite) {
        const worldPos = PacmanMaze.tileToWorld(13.5, FRUIT_SPAWN_TILE.row, DEFAULT_TILE_SIZE);
        const key = `pacman:fruit_${activeFruit.type.toLowerCase()}`;
        this.fruitSprite = this.add.sprite(this.offsetX + worldPos.x, this.offsetY + worldPos.y, key);
      } else {
        this.fruitSprite.setVisible(true);
      }

      if (typeof this.fruitSprite.setDisplaySize === 'function') {
        this.fruitSprite.setDisplaySize(CHARACTER_SPRITE_SIZE, CHARACTER_SPRITE_SIZE);
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

      // Pac-Man eat fruit check: triggers when Pac-Man enters row 20 in central corridor (col 13 or 14)
      if (this.pacmanGridPos.row === FRUIT_SPAWN_TILE.row && (this.pacmanGridPos.col === 13 || this.pacmanGridPos.col === 14)) {
        const fruitScore = this.gameState.consumeFruit();
        PacmanAudioService.playEatFruit();

        if (fruitScore) {
          const worldPos = PacmanMaze.tileToWorld(13.5, FRUIT_SPAWN_TILE.row, DEFAULT_TILE_SIZE);
          this.showFloatingScore(this.offsetX + worldPos.x, this.offsetY + worldPos.y, fruitScore, '#fde047');
        }

        if (this.fruitSprite) {
          this.fruitSprite.destroy();
          this.fruitSprite = null;
        }
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
          const ghostScore = this.gameState.eatGhost();
          PacmanAudioService.playEatGhost();
          ghost.mode = GhostMode.EATEN;
          ghost.sprite.setTexture('pacman:ghost_eyes');
          if (typeof ghost.sprite.setDisplaySize === 'function') {
            ghost.sprite.setDisplaySize(CHARACTER_SPRITE_SIZE, CHARACTER_SPRITE_SIZE);
          }

          // Show floating score popup at ghost location
          this.showFloatingScore(ghost.x, ghost.y, ghostScore, '#38bdf8');
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
      this.time.delayedCall(frame * 80, () => {
        if (this.pacmanSprite) {
          const key = `pacman:death_${frame}`;
          if (this.textures.exists(key)) {
            this.pacmanSprite.setTexture(key);
          }
        }
      });
    }

    // Hide pacman sprite right after wilting animation completes at 920ms
    this.time.delayedCall(920, () => {
      if (this.pacmanSprite) {
        this.pacmanSprite.setVisible(false);
      }
    });

    // After 1.45s complete death tune & 2 pop notes finish, process lives & reset/respawn
    this.time.delayedCall(1450, () => {
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

    this.statusText.setText(`LEVEL ${this.gameState.getLevel()}`);
    this.statusText.setVisible(true);
    this.time.delayedCall(2000, () => {
      // Start new level with full intro music fanfare and READY banner!
      this.startReadyStateIntro();
    });
  }

  private updateUI(): void {
    this.levelText.setText(`LEVEL ${this.gameState.getLevel()}`);
    this.scoreText.setText(`1UP: ${this.gameState.getScore()}`);

    const extraLives = Math.max(0, this.gameState.getLives() - 1);
    this.lifeSprites.forEach((sprite, index) => {
      if (sprite) {
        sprite.setVisible(index < extraLives);
      }
    });
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

    this.lifeSprites.forEach((s) => s.destroy());
    this.lifeSprites = [];

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
