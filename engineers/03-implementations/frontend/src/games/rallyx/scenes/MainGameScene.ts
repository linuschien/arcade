/**
 * MainGameScene.ts
 * Core 60fps Phaser Canvas Scene for New Rally-X.
 * Implements 640x480 dual-viewport (480x480 playfield + 160x480 radar HUD),
 * inertial continuous cruising, 90° turn buffer, instant 180° U-turns,
 * auto-turn with clockwise priority, Lucky flag freeze refueling,
 * and comprehensive memory cleanup.
 */

import Phaser from 'phaser';
import { BaseArcadeScene } from '@/core/phaser/BaseArcadeScene';
import { InputService, PlayerIndex, ArcadeAction } from '@/core/input/InputService';
import { ArcadeBridge } from '@/core/bridge/ArcadeBridge';
import { SoundEngine } from '@/core/audio/SoundEngine';
import {
  Direction,
  DIRECTION_VECTORS,
  OPPOSITE_DIRECTIONS,
  RELATIVE_CLOCKWISE_DIRECTIONS,
  RELATIVE_COUNTER_CLOCKWISE_DIRECTIONS,
  RallyXTileType,
  buildRallyXTileMatrix,
  isRallyXWall,
  RALLYX_TOTAL_COLS,
  RALLYX_TOTAL_ROWS,
  RALLYX_BORDER_WIDTH,
  RALLYX_TILE_SIZE,
  GridPos,
} from '../logic/RallyXMaze';
import {
  RallyXGameState,
  RallyXPlayState,
  MAX_FUEL,
  LUCKY_REFILL_SPEED,
} from '../logic/RallyXGameState';
import {
  RallyXEnemyAI,
  EnemyCar,
  EnemyState,
  DIRECTION_ANGLES,
  lerpAngleDeg,
} from '../logic/RallyXEnemyAI';
import { RallyXAudioService } from '../audio/RallyXAudioService';
import { getDynamicResolution } from '@/core/phaser/init-high-dpi';

const PLAYER_BASE_SPEED = 240; // 240 pixels per second (5 tiles / sec @ 48px/tile)
const RADAR_SCALE = 5; // 32 cols * 5 = 160px (full HUD width), 56 rows * 5 = 280px

export class MainGameScene extends BaseArcadeScene {
  private gameState!: RallyXGameState;
  private tileMatrix!: RallyXTileType[][];

  // World Game Objects
  private mazeGraphics!: Phaser.GameObjects.Graphics;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private enemySprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private flagSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private collectedFlagKeys: Set<string> = new Set();
  private rockSprites: Phaser.GameObjects.Sprite[] = [];
  private smokeSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();

  private borderTileSprites: Phaser.GameObjects.TileSprite[] = [];

  // Player Car Kinematics
  private playerX: number = 0;
  private playerY: number = 0;
  private playerCol: number = 0;
  private playerRow: number = 0;
  private currentDirection: Direction = Direction.UP;
  private bufferedDirection: Direction = Direction.NONE;

  // Player Dynamic Turning Animation (Scheme B & C)
  private playerVisualAngleDeg: number = 0;
  private playerTurnStartAngleDeg: number = 0;
  private playerTurnTargetAngleDeg: number = 0;
  private playerTurnTimerSec: number = 0;
  private playerTurnDurationSec: number = 0.06;

  // Enemies
  private enemies: EnemyCar[] = [];

  // Smoke Puff Queue for 3-puff sequence
  private pendingSmokePuffs: Array<{ delayMs: number }> = [];

  // HUD Game Objects
  private hudBg!: Phaser.GameObjects.Graphics;
  private scLabel!: Phaser.GameObjects.Text;
  private rndLabel!: Phaser.GameObjects.Text;
  private fuelLabel!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private roundText!: Phaser.GameObjects.Text;
  private statusBannerText!: Phaser.GameObjects.Text;
  private luckyBannerText!: Phaser.GameObjects.Text;
  private radarGraphics!: Phaser.GameObjects.Graphics;
  private fuelBarGraphics!: Phaser.GameObjects.Graphics;
  private lifeIcons: Phaser.GameObjects.Sprite[] = [];

  // Blinking timers
  private radarBlinkTimer: number = 0;
  private isRadarPlayerDotVisible: boolean = true;
  private lowFuelAlarmActive: boolean = false;

  // Stage Clear Fuel Discharge Animation ("卸油" 節奏)
  private isStageClearFuelDraining: boolean = false;
  private stageClearInitialFuel: number = 0;
  private stageClearDisplayFuel: number = 0;
  private stageClearTargetScore: number = 0;
  private stageClearDisplayScore: number = 0;
  private stageClearDrainDurationSec: number = 0;
  private stageClearDrainTimerSec: number = 0;
  private stageClearTickTimerSec: number = 0;

  constructor() {
    super({ key: 'rallyx:MainGameScene' });
  }

  public create(): void {
    this.initHighDpiCamera(640);

    this.gameState = new RallyXGameState(1);
    this.tileMatrix = buildRallyXTileMatrix(this.gameState.getRound(), true);
    this.collectedFlagKeys.clear();

    this.createWorldElements();
    this.createHUDElements();
    this.resetLevelEntities();

    // Start Ready State
    this.startRoundIntro();

    // Scene lifecycle events
    if (typeof this.events?.on === 'function') {
      this.events.on(Phaser.Scenes.Events.PAUSE, () => {
        RallyXAudioService.pauseBGM();
        RallyXAudioService.stopLowFuelAlarm();
        SoundEngine.suspend();
      });
      this.events.on(Phaser.Scenes.Events.RESUME, () => {
        SoundEngine.resume();
        if (this.gameState.getPlayState() === RallyXPlayState.PLAYING) {
          RallyXAudioService.resumeBGM();
          if (this.gameState.isFuelEmpty()) {
            RallyXAudioService.startLowFuelAlarm();
          }
        }
      });
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleTeardown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.handleTeardown, this);
  }

  protected override onPauseAudio(): void {
    RallyXAudioService.pauseBGM();
    RallyXAudioService.stopLowFuelAlarm();
  }

  protected override onResumeAudio(): void {
    if (this.gameState?.getPlayState() === RallyXPlayState.PLAYING) {
      RallyXAudioService.resumeBGM();
      if (this.gameState.isFuelEmpty()) {
        RallyXAudioService.startLowFuelAlarm();
      }
    }
  }

  private createWorldElements(): void {
    const extraBorderTiles = 2; // 2 tiles (96px) outer coverage margin
    const extraPx = extraBorderTiles * RALLYX_TILE_SIZE;
    const worldWidth = RALLYX_TOTAL_COLS * RALLYX_TILE_SIZE;
    const worldHeight = RALLYX_TOTAL_ROWS * RALLYX_TILE_SIZE;
    const borderPx = RALLYX_BORDER_WIDTH * RALLYX_TILE_SIZE;
    const innerHeight = worldHeight - 2 * borderPx;

    if (typeof (this.add as any).tileSprite === 'function') {
      const topBorder = (this.add as any).tileSprite(
        -extraPx,
        -extraPx,
        worldWidth + 2 * extraPx,
        borderPx + extraPx,
        'rallyx:border_theme_0'
      );
      topBorder.setOrigin(0, 0);
      topBorder.setDepth(0);

      const botBorder = (this.add as any).tileSprite(
        -extraPx,
        worldHeight - borderPx,
        worldWidth + 2 * extraPx,
        borderPx + extraPx,
        'rallyx:border_theme_0'
      );
      botBorder.setOrigin(0, 0);
      botBorder.setDepth(0);

      const leftBorder = (this.add as any).tileSprite(
        -extraPx,
        borderPx,
        borderPx + extraPx,
        innerHeight,
        'rallyx:border_theme_0'
      );
      leftBorder.setOrigin(0, 0);
      leftBorder.setDepth(0);

      const rightBorder = (this.add as any).tileSprite(
        worldWidth - borderPx,
        borderPx,
        borderPx + extraPx,
        innerHeight,
        'rallyx:border_theme_0'
      );
      rightBorder.setOrigin(0, 0);
      rightBorder.setDepth(0);

      this.borderTileSprites = [topBorder, botBorder, leftBorder, rightBorder];
    }

    this.mazeGraphics = this.add.graphics();
    this.mazeGraphics.setDepth(1);

    this.playerSprite = this.add.sprite(0, 0, 'rallyx:player_up');
    this.playerSprite.setOrigin(0.5, 0.5);
    this.playerSprite.setDepth(5);

    // Single High-DPI Camera: centers player at (240, 240) in 480x480 playfield
    if (this.cameras?.main && typeof this.cameras.main.startFollow === 'function') {
      this.cameras.main.startFollow(this.playerSprite, true, 1, 1, 240, 240);
      if (typeof this.cameras.main.setRoundPixels === 'function') {
        this.cameras.main.setRoundPixels(true);
      }
    }
  }

  private createHUDElements(): void {
    // 1. Sidebar Background (Fixed 160x480 at x: 480, y: 0)
    this.hudBg = this.add.graphics();
    this.hudBg.fillStyle(0x090d16, 1);
    this.hudBg.fillRect(480, 0, 160, 480);
    this.hudBg.lineStyle(2, 0x1e293b, 1);
    this.hudBg.lineBetween(480, 0, 480, 480);
    this.hudBg.setScrollFactor(0);
    this.hudBg.setDepth(100);

    // 2. Score on single line at y: 10 (label on left, number right-aligned)
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#f59e0b',
      fontStyle: 'bold',
    };
    const scoreValStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    };

    this.scLabel = this.add.text(486, 10, 'SCORE', labelStyle).setOrigin(0, 0).setScrollFactor(0).setDepth(102);
    this.scoreText = this.add.text(632, 9, '0', scoreValStyle).setOrigin(1, 0).setScrollFactor(0).setDepth(102);

    // 3. Fuel Gauge Header & Bar (Centered at x: 560, y: 36)
    this.fuelLabel = this.add.text(560, 36, 'FUEL', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#22c55e',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(102);

    this.fuelBarGraphics = this.add.graphics();
    this.fuelBarGraphics.setScrollFactor(0);
    this.fuelBarGraphics.setDepth(101);

    // 4. Radar Minimap Graphics (160x280 at x: 480, y: 100 - vertically centered in 480px column)
    this.radarGraphics = this.add.graphics();
    this.radarGraphics.setScrollFactor(0);
    this.radarGraphics.setDepth(101);

    // 5. Round on single line at y: 396 (label on left, number right-aligned)
    this.rndLabel = this.add.text(486, 396, 'ROUND', labelStyle).setOrigin(0, 0).setScrollFactor(0).setDepth(102);
    this.roundText = this.add.text(632, 395, '1', {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#ffff00',
      fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(102);

    // 6. Reserve Lives Icons (Centered horizontally at y: 442)
    // 4 icons with 32px spacing: 512, 544, 576, 608
    for (let i = 0; i < 4; i++) {
      const icon = this.add.sprite(512 + i * 32, 442, 'rallyx:hud_life');
      icon.setVisible(false);
      icon.setScrollFactor(0);
      icon.setDepth(101);
      this.lifeIcons.push(icon);
    }

    // 7. Playfield Status Banner positioned above Player Car (x: 240, y: 160) - READY, STAGE CLEAR, GAME OVER
    this.statusBannerText = this.add.text(240, 160, 'READY!', {
      fontSize: '28px',
      fontFamily: 'monospace',
      color: '#facc15',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(200);

    // 8. Lucky Refill Overlay Banner positioned above Player Car (x: 240, y: 160)
    this.luckyBannerText = this.add.text(240, 160, '★ LUCKY! ★', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#22c55e',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(200);
    this.luckyBannerText.setVisible(false);
  }

  private resetLevelEntities(): void {
    const config = this.gameState.getCurrentLevelConfig();
    this.tileMatrix = buildRallyXTileMatrix(this.gameState.getRound(), true);

    // Draw static maze
    this.renderMazeGraphics(config.mazeIndex);

    // Spawn Rocks
    this.clearSprites(this.rockSprites);
    for (const rock of config.rocks) {
      const rx = (rock.col + RALLYX_BORDER_WIDTH + 0.5) * RALLYX_TILE_SIZE;
      const ry = (rock.row + RALLYX_BORDER_WIDTH + 0.5) * RALLYX_TILE_SIZE;
      const rockSprite = this.add.sprite(rx, ry, 'rallyx:rock');
      rockSprite.setOrigin(0.5, 0.5);
      rockSprite.setDepth(2);
      this.rockSprites.push(rockSprite);
    }

    // Spawn Flags (Skip flags that were already collected in this round)
    this.flagSprites.forEach((sp) => sp.destroy());
    this.flagSprites.clear();
    config.flags.forEach((flag) => {
      const flagKey = `flag_${flag.col}_${flag.row}`;
      if (this.collectedFlagKeys.has(flagKey)) {
        return;
      }
      const fx = (flag.col + RALLYX_BORDER_WIDTH + 0.5) * RALLYX_TILE_SIZE;
      const fy = (flag.row + RALLYX_BORDER_WIDTH + 0.5) * RALLYX_TILE_SIZE;
      const texKey = flag.type === 'SPECIAL'
        ? 'rallyx:flag_special'
        : flag.type === 'LUCKY'
        ? 'rallyx:flag_lucky'
        : 'rallyx:flag_regular';
      const flagSprite = this.add.sprite(fx, fy, texKey);
      flagSprite.setOrigin(0.5, 0.5);
      flagSprite.setDepth(3);
      this.flagSprites.set(flagKey, flagSprite);
    });

    // Reset Player Position
    this.playerCol = config.playerStart.col + RALLYX_BORDER_WIDTH;
    this.playerRow = config.playerStart.row + RALLYX_BORDER_WIDTH;
    this.playerX = (this.playerCol + 0.5) * RALLYX_TILE_SIZE;
    this.playerY = (this.playerRow + 0.5) * RALLYX_TILE_SIZE;
    this.currentDirection = Direction.UP;
    this.bufferedDirection = Direction.NONE;
    this.playerVisualAngleDeg = 0;
    this.playerTurnStartAngleDeg = 0;
    this.playerTurnTargetAngleDeg = 0;
    this.playerTurnTimerSec = 0;

    this.playerSprite.setPosition(this.playerX, this.playerY);
    this.playerSprite.setTexture('rallyx:player_up');
    this.playerSprite.setAngle(0);
    this.playerSprite.setVisible(true);
    if (this.cameras?.main) {
      this.cameras.main.scrollX = this.playerX - 240;
      this.cameras.main.scrollY = this.playerY - 240;
    }

    // Reset Enemies
    this.enemySprites.forEach((sp) => sp.destroy());
    this.enemySprites.clear();

    this.enemies = RallyXEnemyAI.createEnemies(
      config.enemySpawns,
      config.isChallengingStage,
      RALLYX_BORDER_WIDTH
    );

    this.enemies.forEach((enemy) => {
      const enemySprite = this.add.sprite(enemy.x, enemy.y, 'rallyx:enemy_up');
      enemySprite.setOrigin(0.5, 0.5);
      enemySprite.setAngle(enemy.visualAngleDeg);
      enemySprite.setDepth(4);
      this.enemySprites.set(enemy.id, enemySprite);
    });

    // Clear Smoke Puffs
    this.smokeSprites.forEach((sp) => sp.destroy());
    this.smokeSprites.clear();
    this.pendingSmokePuffs = [];

    this.updateHUD();
  }

  private renderMazeGraphics(mazeIndex: number): void {
    this.mazeGraphics.clear();

    // Authentic 1981 New Rally-X golden yellow road corridor
    const ROAD_COLOR = 0xc8a800;

    // Theme wall colors per maze: 0=Green, 1=Red, 2=Cyan, 3=Grey
    const wallColors = [0x00b800, 0xdc2626, 0x00a8e8, 0xd1d5db];
    const wallOutlineColors = [
      0xdc2626, // Maze 1 (Green wall): Vivid Red outline!
      0x000000, // Maze 2 (Red wall): Crisp Black outline!
      0xdc2626, // Maze 3 (Cyan wall): Vivid Red outline!
      0xdc2626, // Maze 4 (Grey wall): Vivid Red outline!
    ];
    const wallColor = wallColors[mazeIndex % 4] || 0x00b800;
    const outlineColor = wallOutlineColors[mazeIndex % 4] ?? 0xdc2626;
    const mazeTheme = mazeIndex % 4;

    // Update outer border tile sprites with theme texture (zero GPU vertex overhead)
    const borderKey = `rallyx:border_theme_${mazeTheme}`;
    this.borderTileSprites.forEach((ts) => {
      if (typeof ts.setTexture === 'function') {
        ts.setTexture(borderKey);
      }
    });

    // Fallback border fill if tile sprites are not available in test/headless environment
    if (this.borderTileSprites.length === 0) {
      const extraBorderTiles = 2;
      const extraPx = extraBorderTiles * RALLYX_TILE_SIZE;
      const worldWidth = RALLYX_TOTAL_COLS * RALLYX_TILE_SIZE;
      const worldHeight = RALLYX_TOTAL_ROWS * RALLYX_TILE_SIZE;
      const borderPx = RALLYX_BORDER_WIDTH * RALLYX_TILE_SIZE;
      this.mazeGraphics.fillStyle(0x002800, 1);
      this.mazeGraphics.fillRect(-extraPx, -extraPx, worldWidth + 2 * extraPx, borderPx + extraPx);
      this.mazeGraphics.fillRect(-extraPx, worldHeight - borderPx, worldWidth + 2 * extraPx, borderPx + extraPx);
      this.mazeGraphics.fillRect(-extraPx, borderPx, borderPx + extraPx, worldHeight - 2 * borderPx);
      this.mazeGraphics.fillRect(worldWidth - borderPx, borderPx, borderPx + extraPx, worldHeight - 2 * borderPx);
    }

    // 1. Fill entire road background across inner playable maze
    const innerX = RALLYX_BORDER_WIDTH * RALLYX_TILE_SIZE;
    const innerY = RALLYX_BORDER_WIDTH * RALLYX_TILE_SIZE;
    const innerW = (RALLYX_TOTAL_COLS - 2 * RALLYX_BORDER_WIDTH) * RALLYX_TILE_SIZE;
    const innerH = (RALLYX_TOTAL_ROWS - 2 * RALLYX_BORDER_WIDTH) * RALLYX_TILE_SIZE;
    this.mazeGraphics.fillStyle(ROAD_COLOR, 1);
    this.mazeGraphics.fillRect(innerX, innerY, innerW, innerH);

    // 2. Render inner maze walls with convex & concave rounded corners (32x56 inner grid)
    const cornerR = 12; // Outer convex corner radius
    const innerR = 8;   // Inner concave corner radius

    const isWallAt = (r: number, c: number): boolean => {
      if (r < 0 || r >= RALLYX_TOTAL_ROWS || c < 0 || c >= RALLYX_TOTAL_COLS) return false;
      return this.tileMatrix[r][c] === RallyXTileType.WALL;
    };

    // Pass 1: Solid wall fills, straight segments (with inner corner alignment), and outer convex arcs
    for (let r = RALLYX_BORDER_WIDTH; r < RALLYX_TOTAL_ROWS - RALLYX_BORDER_WIDTH; r++) {
      for (let c = RALLYX_BORDER_WIDTH; c < RALLYX_TOTAL_COLS - RALLYX_BORDER_WIDTH; c++) {
        const tile = this.tileMatrix[r][c];
        if (tile !== RallyXTileType.WALL) continue;

        const x = c * RALLYX_TILE_SIZE;
        const y = r * RALLYX_TILE_SIZE;

        const isTopWall = isWallAt(r - 1, c);
        const isBottomWall = isWallAt(r + 1, c);
        const isLeftWall = isWallAt(r, c - 1);
        const isRightWall = isWallAt(r, c + 1);

        // Exterior convex corner radii
        const tl = !isTopWall && !isLeftWall ? cornerR : 0;
        const tr = !isTopWall && !isRightWall ? cornerR : 0;
        const bl = !isBottomWall && !isLeftWall ? cornerR : 0;
        const br = !isBottomWall && !isRightWall ? cornerR : 0;

        // Inside solid fill with rounded corners
        this.mazeGraphics.fillStyle(wallColor, 1);
        if (typeof (this.mazeGraphics as any).fillRoundedRect === 'function') {
          (this.mazeGraphics as any).fillRoundedRect(x, y, RALLYX_TILE_SIZE, RALLYX_TILE_SIZE, { tl, tr, bl, br });
        } else {
          this.mazeGraphics.fillRect(x, y, RALLYX_TILE_SIZE, RALLYX_TILE_SIZE);
        }

        // Outer perimeter outline with rounded corners
        this.mazeGraphics.lineStyle(4, outlineColor, 1);

        // Straight segments with seamless inner corner alignment:
        // Top edge:
        if (!isTopWall) {
          const startX = !isLeftWall
            ? x + tl
            : (isWallAt(r - 1, c - 1) ? x + innerR : x);
          const endX = !isRightWall
            ? x + RALLYX_TILE_SIZE - tr
            : (isWallAt(r - 1, c + 1) ? x + RALLYX_TILE_SIZE - innerR : x + RALLYX_TILE_SIZE);
          this.mazeGraphics.lineBetween(startX, y + 2, endX, y + 2);
        }

        // Bottom edge:
        if (!isBottomWall) {
          const startX = !isLeftWall
            ? x + bl
            : (isWallAt(r + 1, c - 1) ? x + innerR : x);
          const endX = !isRightWall
            ? x + RALLYX_TILE_SIZE - br
            : (isWallAt(r + 1, c + 1) ? x + RALLYX_TILE_SIZE - innerR : x + RALLYX_TILE_SIZE);
          this.mazeGraphics.lineBetween(startX, y + RALLYX_TILE_SIZE - 2, endX, y + RALLYX_TILE_SIZE - 2);
        }

        // Left edge:
        if (!isLeftWall) {
          const startY = !isTopWall
            ? y + tl
            : (isWallAt(r - 1, c - 1) ? y + innerR : y);
          const endY = !isBottomWall
            ? y + RALLYX_TILE_SIZE - bl
            : (isWallAt(r + 1, c - 1) ? y + RALLYX_TILE_SIZE - innerR : y + RALLYX_TILE_SIZE);
          this.mazeGraphics.lineBetween(x + 2, startY, x + 2, endY);
        }

        // Right edge:
        if (!isRightWall) {
          const startY = !isTopWall
            ? y + tr
            : (isWallAt(r - 1, c + 1) ? y + innerR : y);
          const endY = !isBottomWall
            ? y + RALLYX_TILE_SIZE - br
            : (isWallAt(r + 1, c + 1) ? y + RALLYX_TILE_SIZE - innerR : y + RALLYX_TILE_SIZE);
          this.mazeGraphics.lineBetween(x + RALLYX_TILE_SIZE - 2, startY, x + RALLYX_TILE_SIZE - 2, endY);
        }

        // Exterior convex corner arcs
        const arcR = cornerR - 2;
        if (tl && typeof (this.mazeGraphics as any).beginPath === 'function' && typeof (this.mazeGraphics as any).arc === 'function') {
          (this.mazeGraphics as any).beginPath();
          (this.mazeGraphics as any).arc(x + cornerR, y + cornerR, arcR, Math.PI, Math.PI * 1.5);
          if (typeof (this.mazeGraphics as any).strokePath === 'function') {
            (this.mazeGraphics as any).strokePath();
          }
        }
        if (tr && typeof (this.mazeGraphics as any).beginPath === 'function' && typeof (this.mazeGraphics as any).arc === 'function') {
          (this.mazeGraphics as any).beginPath();
          (this.mazeGraphics as any).arc(x + RALLYX_TILE_SIZE - cornerR, y + cornerR, arcR, Math.PI * 1.5, Math.PI * 2);
          if (typeof (this.mazeGraphics as any).strokePath === 'function') {
            (this.mazeGraphics as any).strokePath();
          }
        }
        if (br && typeof (this.mazeGraphics as any).beginPath === 'function' && typeof (this.mazeGraphics as any).arc === 'function') {
          (this.mazeGraphics as any).beginPath();
          (this.mazeGraphics as any).arc(x + RALLYX_TILE_SIZE - cornerR, y + RALLYX_TILE_SIZE - cornerR, arcR, 0, Math.PI * 0.5);
          if (typeof (this.mazeGraphics as any).strokePath === 'function') {
            (this.mazeGraphics as any).strokePath();
          }
        }
        if (bl && typeof (this.mazeGraphics as any).beginPath === 'function' && typeof (this.mazeGraphics as any).arc === 'function') {
          (this.mazeGraphics as any).beginPath();
          (this.mazeGraphics as any).arc(x + cornerR, y + RALLYX_TILE_SIZE - cornerR, arcR, Math.PI * 0.5, Math.PI);
          if (typeof (this.mazeGraphics as any).strokePath === 'function') {
            (this.mazeGraphics as any).strokePath();
          }
        }
      }
    }

    // Pass 2: Inner concave fillet corner fills and outline arcs (where 3 walls meet 1 road at vertex)
    const arcInnerR = innerR + 2;
    for (let r = RALLYX_BORDER_WIDTH; r <= RALLYX_TOTAL_ROWS - RALLYX_BORDER_WIDTH; r++) {
      for (let c = RALLYX_BORDER_WIDTH; c <= RALLYX_TOTAL_COLS - RALLYX_BORDER_WIDTH; c++) {
        const wTL = isWallAt(r - 1, c - 1);
        const wTR = isWallAt(r - 1, c);
        const wBL = isWallAt(r, c - 1);
        const wBR = isWallAt(r, c);

        const wallCount = (wTL ? 1 : 0) + (wTR ? 1 : 0) + (wBL ? 1 : 0) + (wBR ? 1 : 0);
        if (wallCount !== 3) continue;

        const vx = c * RALLYX_TILE_SIZE;
        const vy = r * RALLYX_TILE_SIZE;

        // Case 1: Road is Bottom-Right (wBR is false)
        if (!wBR && wTL && wTR && wBL) {
          this.mazeGraphics.fillStyle(wallColor, 1);
          if (typeof (this.mazeGraphics as any).beginPath === 'function') {
            (this.mazeGraphics as any).beginPath();
            (this.mazeGraphics as any).moveTo(vx, vy);
            (this.mazeGraphics as any).lineTo(vx + innerR, vy);
            (this.mazeGraphics as any).arc(vx + innerR, vy + innerR, innerR, Math.PI * 1.5, Math.PI, true);
            (this.mazeGraphics as any).closePath();
            if (typeof (this.mazeGraphics as any).fillPath === 'function') {
              (this.mazeGraphics as any).fillPath();
            }
          }
          this.mazeGraphics.lineStyle(4, outlineColor, 1);
          if (typeof (this.mazeGraphics as any).beginPath === 'function' && typeof (this.mazeGraphics as any).arc === 'function') {
            (this.mazeGraphics as any).beginPath();
            (this.mazeGraphics as any).arc(vx + innerR, vy + innerR, arcInnerR, Math.PI, Math.PI * 1.5);
            if (typeof (this.mazeGraphics as any).strokePath === 'function') {
              (this.mazeGraphics as any).strokePath();
            }
          }
        }
        // Case 2: Road is Bottom-Left (wBL is false)
        else if (!wBL && wTL && wTR && wBR) {
          this.mazeGraphics.fillStyle(wallColor, 1);
          if (typeof (this.mazeGraphics as any).beginPath === 'function') {
            (this.mazeGraphics as any).beginPath();
            (this.mazeGraphics as any).moveTo(vx, vy);
            (this.mazeGraphics as any).lineTo(vx - innerR, vy);
            (this.mazeGraphics as any).arc(vx - innerR, vy + innerR, innerR, Math.PI * 1.5, Math.PI * 2, false);
            (this.mazeGraphics as any).closePath();
            if (typeof (this.mazeGraphics as any).fillPath === 'function') {
              (this.mazeGraphics as any).fillPath();
            }
          }
          this.mazeGraphics.lineStyle(4, outlineColor, 1);
          if (typeof (this.mazeGraphics as any).beginPath === 'function' && typeof (this.mazeGraphics as any).arc === 'function') {
            (this.mazeGraphics as any).beginPath();
            (this.mazeGraphics as any).arc(vx - innerR, vy + innerR, arcInnerR, Math.PI * 1.5, Math.PI * 2);
            if (typeof (this.mazeGraphics as any).strokePath === 'function') {
              (this.mazeGraphics as any).strokePath();
            }
          }
        }
        // Case 3: Road is Top-Right (wTR is false)
        else if (!wTR && wTL && wBL && wBR) {
          this.mazeGraphics.fillStyle(wallColor, 1);
          if (typeof (this.mazeGraphics as any).beginPath === 'function') {
            (this.mazeGraphics as any).beginPath();
            (this.mazeGraphics as any).moveTo(vx, vy);
            (this.mazeGraphics as any).lineTo(vx + innerR, vy);
            (this.mazeGraphics as any).arc(vx + innerR, vy - innerR, innerR, Math.PI * 0.5, Math.PI, false);
            (this.mazeGraphics as any).closePath();
            if (typeof (this.mazeGraphics as any).fillPath === 'function') {
              (this.mazeGraphics as any).fillPath();
            }
          }
          this.mazeGraphics.lineStyle(4, outlineColor, 1);
          if (typeof (this.mazeGraphics as any).beginPath === 'function' && typeof (this.mazeGraphics as any).arc === 'function') {
            (this.mazeGraphics as any).beginPath();
            (this.mazeGraphics as any).arc(vx + innerR, vy - innerR, arcInnerR, Math.PI * 0.5, Math.PI);
            if (typeof (this.mazeGraphics as any).strokePath === 'function') {
              (this.mazeGraphics as any).strokePath();
            }
          }
        }
        // Case 4: Road is Top-Left (wTL is false)
        else if (!wTL && wTR && wBL && wBR) {
          this.mazeGraphics.fillStyle(wallColor, 1);
          if (typeof (this.mazeGraphics as any).beginPath === 'function') {
            (this.mazeGraphics as any).beginPath();
            (this.mazeGraphics as any).moveTo(vx, vy);
            (this.mazeGraphics as any).lineTo(vx - innerR, vy);
            (this.mazeGraphics as any).arc(vx - innerR, vy - innerR, innerR, Math.PI * 0.5, 0, true);
            (this.mazeGraphics as any).closePath();
            if (typeof (this.mazeGraphics as any).fillPath === 'function') {
              (this.mazeGraphics as any).fillPath();
            }
          }
          this.mazeGraphics.lineStyle(4, outlineColor, 1);
          if (typeof (this.mazeGraphics as any).beginPath === 'function' && typeof (this.mazeGraphics as any).arc === 'function') {
            (this.mazeGraphics as any).beginPath();
            (this.mazeGraphics as any).arc(vx - innerR, vy - innerR, arcInnerR, 0, Math.PI * 0.5);
            if (typeof (this.mazeGraphics as any).strokePath === 'function') {
              (this.mazeGraphics as any).strokePath();
            }
          }
        }
      }
    }
  }

  private startRoundIntro(): void {
    this.gameState.setPlayState(RallyXPlayState.READY);
    const isChallenging = this.gameState.isChallengingStage();
    this.statusBannerText.setText(isChallenging ? 'CHALLENGE!' : 'READY!');
    this.statusBannerText.setVisible(true);

    RallyXAudioService.playGameStart();

    // Game Start Fanfare duration is ~4.5s (160 BPM) - perfectly synchronized to hardware audio
    this.time.delayedCall(4500, () => {
      this.statusBannerText.setVisible(false);
      this.gameState.setPlayState(RallyXPlayState.PLAYING);
      RallyXAudioService.startBGM();
    });
  }

  public override update(time: number, delta: number): void {
    if (this.isPausedState) return;

    const deltaSec = Math.min(delta / 1000, 0.1); // Clamp to prevent massive physics leaps
    const playState = this.gameState.getPlayState();

    // 1. Lucky Refill Animation State
    if (playState === RallyXPlayState.LUCKY_REFILL) {
      this.luckyBannerText.setVisible(true);
      const isFinished = this.gameState.updateLuckyRefill(deltaSec);
      const progress = this.gameState.getFuel() / MAX_FUEL;
      RallyXAudioService.playRefuelingChirp(progress);
      this.updateHUD();

      if (isFinished) {
        this.luckyBannerText.setVisible(false);
      }
      return;
    }

    // 2. Stage Clear Fuel Discharge Animation ("卸油" 節奏) & Post-Drain Hold
    if (playState === RallyXPlayState.STAGE_CLEARED) {
      if (this.isStageClearFuelDraining) {
        this.stageClearDrainTimerSec += deltaSec;
        const progress = Math.min(1.0, this.stageClearDrainTimerSec / this.stageClearDrainDurationSec);
        this.stageClearDisplayFuel = Math.max(0, this.stageClearInitialFuel * (1.0 - progress));
        this.stageClearDisplayScore = Math.floor(this.stageClearTargetScore - this.stageClearDisplayFuel * 10);

        this.stageClearTickTimerSec += deltaSec;
        if (this.stageClearTickTimerSec >= 0.05) {
          this.stageClearTickTimerSec = 0;
          RallyXAudioService.playFuelDrainTick();
        }

        if (progress >= 1.0) {
          this.isStageClearFuelDraining = false;
          this.stageClearDisplayFuel = 0;
          this.stageClearDisplayScore = this.stageClearTargetScore;
          this.gameState.emptyFuel();
        }
      }
      this.updateHUD();
      return;
    }

    // Allow pre-buffering direction during round intro
    if (playState === RallyXPlayState.READY) {
      this.handlePlayerInput();
    }

    // 2. Normal Playing State
    if (playState === RallyXPlayState.PLAYING) {
      this.handlePlayerInput();
      this.updatePlayerMovement(deltaSec);
      this.updatePendingSmokePuffs(delta);
      this.updateEnemies(deltaSec);
      this.checkCollisions();
      this.gameState.update(deltaSec);
      this.updateSmokeSprites();

      // Low fuel audio alarm check
      if (this.gameState.isFuelEmpty() && !this.lowFuelAlarmActive) {
        this.lowFuelAlarmActive = true;
        RallyXAudioService.startLowFuelAlarm();
      } else if (!this.gameState.isFuelEmpty() && this.lowFuelAlarmActive) {
        this.lowFuelAlarmActive = false;
        RallyXAudioService.stopLowFuelAlarm();
      }
    }

    // Radar blinking dot timer
    this.radarBlinkTimer += delta;
    if (this.radarBlinkTimer >= 150) {
      this.radarBlinkTimer = 0;
      this.isRadarPlayerDotVisible = !this.isRadarPlayerDotVisible;
    }

    this.updateHUD();
  }

  private handlePlayerInput(): void {
    // Direction inputs
    if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.UP)) {
      this.setRequestedDirection(Direction.UP);
    } else if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.DOWN)) {
      this.setRequestedDirection(Direction.DOWN);
    } else if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.LEFT)) {
      this.setRequestedDirection(Direction.LEFT);
    } else if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.RIGHT)) {
      this.setRequestedDirection(Direction.RIGHT);
    }

    // Smoke Screen Deployment
    if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_A)) {
      if (this.gameState.canDeploySmoke()) {
        const deployed = this.gameState.triggerSmokeDeployment();
        if (deployed) {
          RallyXAudioService.playSmokeHiss();
          this.queueSmokePuffsSequence(this.playerX, this.playerY);
        }
      }
    }
  }

  private startPlayerTurn(newDir: Direction, durationSec: number): void {
    if (newDir === Direction.NONE || newDir === this.currentDirection) return;
    this.playerTurnStartAngleDeg = this.playerVisualAngleDeg;
    this.playerTurnTargetAngleDeg = DIRECTION_ANGLES[newDir];
    this.playerTurnDurationSec = durationSec;
    this.playerTurnTimerSec = durationSec;
  }

  private setRequestedDirection(dir: Direction): void {
    if (dir === this.currentDirection) {
      this.bufferedDirection = Direction.NONE;
      return;
    }

    // US-06-01 AC3: Instant 180° U-turn on opposite input (Scheme C: 0.08s 180° rapid U-turn flip)
    if (OPPOSITE_DIRECTIONS[this.currentDirection] === dir) {
      this.startPlayerTurn(dir, 0.08);
      this.currentDirection = dir;
      this.bufferedDirection = Direction.NONE;
      this.updatePlayerSpriteTexture();
      return;
    }

    // Otherwise buffer direction for 90° turns at intersection
    this.bufferedDirection = dir;
  }

  private updatePlayerMovement(deltaSec: number): void {
    // 50% speed penalty when fuel is exhausted
    const speed = this.gameState.isFuelEmpty()
      ? PLAYER_BASE_SPEED * 0.5
      : PLAYER_BASE_SPEED;
    const moveDist = speed * deltaSec;

    // Tile Center coordinates for current grid cell
    const centerTileX = (this.playerCol + 0.5) * RALLYX_TILE_SIZE;
    const centerTileY = (this.playerRow + 0.5) * RALLYX_TILE_SIZE;

    const distToCenter = Math.hypot(this.playerX - centerTileX, this.playerY - centerTileY);

    // Check if within snap radius to execute buffered 90° turn (Scheme B: 0.06s 90° cornering lerp)
    if (
      this.bufferedDirection !== Direction.NONE &&
      this.bufferedDirection !== this.currentDirection &&
      distToCenter <= moveDist + 2.0
    ) {
      const v = DIRECTION_VECTORS[this.bufferedDirection];
      const nextC = this.playerCol + v.col;
      const nextR = this.playerRow + v.row;
      if (!isRallyXWall(this.tileMatrix, nextC, nextR)) {
        this.playerX = centerTileX;
        this.playerY = centerTileY;
        this.startPlayerTurn(this.bufferedDirection, 0.06);
        this.currentDirection = this.bufferedDirection;
        this.bufferedDirection = Direction.NONE;
        this.updatePlayerSpriteTexture();
      }
    }

    // Check forward collision for current direction
    const curV = DIRECTION_VECTORS[this.currentDirection];
    const forwardC = this.playerCol + curV.col;
    const forwardR = this.playerRow + curV.row;

    if (isRallyXWall(this.tileMatrix, forwardC, forwardR)) {
      // Only clamp and auto-turn when reaching or passing tile center
      const reachedCenter =
        (this.currentDirection === Direction.UP && this.playerY <= centerTileY) ||
        (this.currentDirection === Direction.DOWN && this.playerY >= centerTileY) ||
        (this.currentDirection === Direction.LEFT && this.playerX <= centerTileX) ||
        (this.currentDirection === Direction.RIGHT && this.playerX >= centerTileX);

      if (reachedCenter) {
        this.playerX = centerTileX;
        this.playerY = centerTileY;

        const cw = RELATIVE_CLOCKWISE_DIRECTIONS[this.currentDirection];
        const cwV = DIRECTION_VECTORS[cw];
        const ccw = RELATIVE_COUNTER_CLOCKWISE_DIRECTIONS[this.currentDirection];
        const ccwV = DIRECTION_VECTORS[ccw];
        const opp = OPPOSITE_DIRECTIONS[this.currentDirection];

        let newDir = Direction.NONE;
        if (!isRallyXWall(this.tileMatrix, this.playerCol + cwV.col, this.playerRow + cwV.row)) {
          newDir = cw;
        } else if (!isRallyXWall(this.tileMatrix, this.playerCol + ccwV.col, this.playerRow + ccwV.row)) {
          newDir = ccw;
        } else {
          // Dead end: automatic 180° U-turn!
          newDir = opp;
        }
        if (newDir !== Direction.NONE) {
          this.startPlayerTurn(newDir, newDir === opp ? 0.08 : 0.06);
          this.currentDirection = newDir;
        }
        this.updatePlayerSpriteTexture();
      }
    }

    // Advance position
    const vec = DIRECTION_VECTORS[this.currentDirection];
    this.playerX += vec.col * moveDist;
    this.playerY += vec.row * moveDist;

    this.playerCol = Math.floor(this.playerX / RALLYX_TILE_SIZE);
    this.playerRow = Math.floor(this.playerY / RALLYX_TILE_SIZE);

    this.playerSprite.setPosition(this.playerX, this.playerY);

    // Dynamic visual turning interpolation (Scheme B & C)
    if (this.playerTurnTimerSec > 0) {
      this.playerTurnTimerSec = Math.max(0, this.playerTurnTimerSec - deltaSec);
      const progress = 1.0 - (this.playerTurnTimerSec / this.playerTurnDurationSec);
      this.playerVisualAngleDeg = lerpAngleDeg(
        this.playerTurnStartAngleDeg,
        this.playerTurnTargetAngleDeg,
        progress
      );
    } else {
      this.playerVisualAngleDeg = DIRECTION_ANGLES[this.currentDirection];
    }
    this.playerSprite.setAngle(this.playerVisualAngleDeg);
  }

  private updatePlayerSpriteTexture(): void {
    if (this.playerSprite && this.playerSprite.active) {
      this.playerSprite.setTexture('rallyx:player_up');
      this.playerSprite.setAngle(this.playerVisualAngleDeg);
    }
  }

  private queueSmokePuffsSequence(x: number, y: number): void {
    // 3 sequential puffs emitted along the car's dynamic wake
    this.gameState.addSmokePuff(x, y);
    this.pendingSmokePuffs.push({ delayMs: 80 });
    this.pendingSmokePuffs.push({ delayMs: 160 });
  }

  private updatePendingSmokePuffs(deltaMs: number): void {
    for (let i = this.pendingSmokePuffs.length - 1; i >= 0; i--) {
      this.pendingSmokePuffs[i].delayMs -= deltaMs;
      if (this.pendingSmokePuffs[i].delayMs <= 0) {
        // Emit smoke puff along the car's current wake position
        this.gameState.addSmokePuff(this.playerX, this.playerY);
        this.pendingSmokePuffs.splice(i, 1);
      }
    }
  }

  private updateSmokeSprites(): void {
    const puffs = this.gameState.getActiveSmokePuffs();
    const activeIds = new Set(puffs.map((p) => p.id));

    // Remove expired smoke sprites
    this.smokeSprites.forEach((sprite, id) => {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.smokeSprites.delete(id);
      }
    });

    // Create or update smoke sprites with fade
    puffs.forEach((puff) => {
      let sp = this.smokeSprites.get(puff.id);
      if (!sp) {
        sp = this.add.sprite(puff.x, puff.y, 'rallyx:smoke');
        sp.setOrigin(0.5, 0.5);
        sp.setDepth(1);
        this.smokeSprites.set(puff.id, sp);
      }
      const alpha = Math.min(1.0, puff.remainingTimeSec / 2.0);
      sp.setAlpha(alpha);
    });
  }

  private updateEnemies(deltaSec: number): void {
    this.enemies.forEach((enemy) => {
      RallyXEnemyAI.updateEnemy(
        enemy,
        this.tileMatrix,
        this.playerCol,
        this.playerRow,
        this.currentDirection,
        PLAYER_BASE_SPEED,
        deltaSec,
        this.enemies
      );

      const sp = this.enemySprites.get(enemy.id);
      if (sp) {
        sp.setPosition(enemy.x, enemy.y);
        if (enemy.state === EnemyState.SPIN_OUT) {
          sp.setAngle(enemy.spinAngleDeg);
        } else {
          sp.setAngle(enemy.visualAngleDeg);
        }
      }
    });

    // Handle enemy collisions: smoke, rocks, bumps
    const activePuffs = this.gameState.getActiveSmokePuffs();
    const smokeHitEnemies = RallyXEnemyAI.checkSmokeCollisions(this.enemies, activePuffs);
    if (smokeHitEnemies.length > 0) {
      RallyXAudioService.playSpinOut();
    }

    const config = this.gameState.getCurrentLevelConfig();
    const rockHitEnemies = RallyXEnemyAI.checkRockCollisions(
      this.enemies,
      config.rocks,
      RALLYX_BORDER_WIDTH
    );
    if (rockHitEnemies.length > 0) {
      RallyXAudioService.playSpinOut();
    }

    const bumpedEnemies = RallyXEnemyAI.checkCarBumps(this.enemies);
    if (bumpedEnemies.length > 0) {
      RallyXAudioService.playSpinOut();
    }
  }

  private checkCollisions(): void {
    const config = this.gameState.getCurrentLevelConfig();

    // 1. Flag Collection
    const innerCol = this.playerCol - RALLYX_BORDER_WIDTH;
    const innerRow = this.playerRow - RALLYX_BORDER_WIDTH;
    const flagKey = `flag_${innerCol}_${innerRow}`;
    const flagSprite = this.flagSprites.get(flagKey);

    if (flagSprite && flagSprite.visible) {
      const flagSpec = config.flags.find((f) => f.col === innerCol && f.row === innerRow);
      if (flagSpec) {
        this.collectedFlagKeys.add(flagKey);
        flagSprite.setVisible(false);
        const result = this.gameState.collectFlag(flagSpec.type);

        if (result.awarded1UP) {
          RallyXAudioService.playExtraLife();
        }

        if (result.isSpecialActivated) {
          RallyXAudioService.playSpecialFlagFanfare();
        } else if (result.isLuckyActivated) {
          RallyXAudioService.playLuckyFlagChime();
        } else {
          RallyXAudioService.playFlagPickup(this.gameState.getFlagsCollected());
        }

        ArcadeBridge.emit('SCORE_UPDATED', { score: this.gameState.getScore() });

        if (result.isStageClear) {
          this.handleStageClear(result.stageClearFuelBonus / 10);
          return;
        }
      }
    }

    // 2. Rock Collision (Blue Car explodes)
    for (const rock of config.rocks) {
      const rx = (rock.col + RALLYX_BORDER_WIDTH + 0.5) * RALLYX_TILE_SIZE;
      const ry = (rock.row + RALLYX_BORDER_WIDTH + 0.5) * RALLYX_TILE_SIZE;
      if (Math.hypot(this.playerX - rx, this.playerY - ry) <= 28) {
        this.triggerPlayerCrash();
        return;
      }
    }

    // 3. Enemy Collision (Blue Car explodes)
    if (RallyXEnemyAI.checkPlayerCollision(this.playerX, this.playerY, this.enemies)) {
      this.triggerPlayerCrash();
    }
  }

  private triggerPlayerCrash(): void {
    RallyXAudioService.stopBGM();
    RallyXAudioService.stopLowFuelAlarm();
    RallyXAudioService.playCrash();

    const isGameOver = this.gameState.handlePlayerDeath();

    if (this.playerSprite && this.playerSprite.active) {
      this.playerSprite.setAngle(0);
    }

    // Multi-stage animated arcade explosion (Starburst -> Fireball & Shrapnel -> Smoke & Fire -> Dissipating Embers)
    const crashFrames = ['rallyx:crash_0', 'rallyx:crash_1', 'rallyx:crash_2', 'rallyx:crash_3'];
    crashFrames.forEach((frameKey, idx) => {
      this.time.delayedCall(idx * 140, () => {
        if (this.playerSprite && this.playerSprite.active) {
          this.playerSprite.setTexture(frameKey);
          this.playerSprite.setVisible(true);
        }
      });
    });

    this.time.delayedCall(crashFrames.length * 140 + 60, () => {
      if (this.playerSprite && this.playerSprite.active && !isGameOver) {
        this.playerSprite.setVisible(false);
      }
    });

    if (isGameOver) {
      this.statusBannerText.setText('GAME OVER');
      this.statusBannerText.setVisible(true);

      ArcadeBridge.emit('GAME_OVER', {
        gameId: 'rallyx',
        score: this.gameState.getScore(),
        round: this.gameState.getRound(),
        flagsCollected: this.gameState.getFlagsCollected(),
        playTimeSeconds: Math.floor(this.gameState.getPlayTimeSeconds()),
        creditsUsed: 1,
      });
    } else {
      this.time.delayedCall(1800, () => {
        this.gameState.resetAfterDeath();
        this.resetLevelEntities();
        this.startRoundIntro();
      });
    }
  }

  private handleStageClear(bonusFuel?: number): void {
    if (this.lowFuelAlarmActive) {
      this.lowFuelAlarmActive = false;
      RallyXAudioService.stopLowFuelAlarm();
    }
    RallyXAudioService.playRoundClear();
    const currentRound = this.gameState.getRound();
    const isGrandSlam = currentRound === 16;
    this.statusBannerText.setText(isGrandSlam ? 'CONGRATULATIONS!\nALL STAGES CLEARED!' : 'STAGE CLEAR!');
    this.statusBannerText.setVisible(true);

    // Initialize fuel discharge animation ("卸油" 節奏)
    const initialFuel = bonusFuel !== undefined ? Math.floor(bonusFuel) : Math.floor(this.gameState.getFuel());
    const bonusPoints = initialFuel * 10;
    this.gameState.emptyFuel();
    if (initialFuel > 0) {
      this.isStageClearFuelDraining = true;
      this.stageClearInitialFuel = initialFuel;
      this.stageClearDisplayFuel = initialFuel;
      this.stageClearTargetScore = this.gameState.getScore();
      this.stageClearDisplayScore = this.stageClearTargetScore - bonusPoints;
      // Discharges at deliberate pace (~550 fuel/sec): ~1.4s for full tank
      this.stageClearDrainDurationSec = Math.max(0.6, Math.min(1.6, initialFuel / 550));
      this.stageClearDrainTimerSec = 0;
      this.stageClearTickTimerSec = 0;
    } else {
      this.isStageClearFuelDraining = false;
      this.stageClearDisplayFuel = 0;
    }

    const clearDelay = isGrandSlam ? 4500 : 2600;
    this.time.delayedCall(clearDelay, () => {
      this.isStageClearFuelDraining = false;
      this.gameState.advanceToNextRound();
      this.collectedFlagKeys.clear();
      this.resetLevelEntities();
      this.startRoundIntro();
    });
  }

  private updateHUD(): void {
    if (this.isStageClearFuelDraining) {
      this.scoreText.setText(`${this.stageClearDisplayScore}`);
      this.roundText.setText(`${this.gameState.getRound()}`);

      const reserveLives = Math.max(0, this.gameState.getLives() - 1);
      for (let i = 0; i < 4; i++) {
        this.lifeIcons[i].setVisible(i < reserveLives);
      }

      this.renderFuelGauge(this.stageClearDisplayFuel);
      this.renderRadar();
      return;
    }

    if (this.gameState.getPlayState() === RallyXPlayState.STAGE_CLEARED) {
      this.scoreText.setText(`${this.gameState.getScore()}`);
      this.roundText.setText(`${this.gameState.getRound()}`);

      const reserveLives = Math.max(0, this.gameState.getLives() - 1);
      for (let i = 0; i < 4; i++) {
        this.lifeIcons[i].setVisible(i < reserveLives);
      }

      this.renderFuelGauge(0);
      this.renderRadar();
      return;
    }

    this.scoreText.setText(`${this.gameState.getScore()}`);
    this.roundText.setText(`${this.gameState.getRound()}`);

    // Update Reserve Lives Icons (lives - 1)
    const reserveLives = Math.max(0, this.gameState.getLives() - 1);
    for (let i = 0; i < 4; i++) {
      this.lifeIcons[i].setVisible(i < reserveLives);
    }

    // Update Fuel Bar & Ticks (Full 160px HUD width, zero left/right margin)
    this.renderFuelGauge();

    // Update Minimap Radar (160x280 at x: 480, y: 100 with authentic blue background)
    this.renderRadar();
  }

  private renderFuelGauge(customFuel?: number): void {
    this.fuelBarGraphics.clear();
    const barX = 480;
    const barWidth = 160;
    const tickY = 58;
    const barY = 67;
    const barHeight = 16;

    // 1. Tick Marks (刻度) - 10 divisions spanning full 160px HUD width (0 left/right margin)
    // Horizontal ruler baseline
    this.fuelBarGraphics.lineStyle(1, 0x475569, 0.9);
    this.fuelBarGraphics.lineBetween(barX, tickY + 6, barX + barWidth, tickY + 6);

    // Divisions at 0%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100%
    for (let i = 0; i <= 10; i++) {
      const tx = barX + Math.round(i * (barWidth / 10));
      const isMajor = i === 0 || i === 5 || i === 10;

      if (isMajor) {
        // Major Red Tick Pins (Empty, Half, Full)
        this.fuelBarGraphics.lineStyle(2, 0xef4444, 1);
        this.fuelBarGraphics.lineBetween(tx, tickY, tx, tickY + 7);
      } else {
        // Minor Yellow Tick Marks
        this.fuelBarGraphics.lineStyle(1, 0xfacc15, 1);
        this.fuelBarGraphics.lineBetween(tx, tickY + 2, tx, tickY + 7);
      }
    }

    // 2. Fuel Bar Background & Border
    this.fuelBarGraphics.fillStyle(0x090d16, 1);
    this.fuelBarGraphics.fillRect(barX, barY, barWidth, barHeight);
    this.fuelBarGraphics.lineStyle(1, 0x1e293b, 1);
    this.fuelBarGraphics.strokeRect(barX, barY, barWidth, barHeight);

    // 3. Fuel Bar Dynamic Fill
    const fuelVal = customFuel !== undefined ? customFuel : this.gameState.getFuel();
    const fuelRatio = Math.max(0, Math.min(1.0, fuelVal / MAX_FUEL));
    const fillWidth = Math.floor(barWidth * fuelRatio);

    if (fillWidth > 0) {
      let fillColor = 0xfacc15; // Authentic Arcade Yellow
      if (fuelRatio <= 0.2) {
        fillColor = this.isRadarPlayerDotVisible ? 0xef4444 : 0x7f1d1d; // Flashing Red
      } else if (fuelRatio <= 0.4) {
        fillColor = 0xf97316; // Warning Orange
      }
      this.fuelBarGraphics.fillStyle(fillColor, 1);
      this.fuelBarGraphics.fillRect(barX + 1, barY + 1, Math.max(0, fillWidth - 2), barHeight - 2);
    }
  }

  private renderRadar(): void {
    this.radarGraphics.clear();
    const radarX = 480;
    const radarY = 100;
    const radarW = 32 * RADAR_SCALE; // 32 * 5 = 160px (full HUD width)
    const radarH = 56 * RADAR_SCALE; // 56 * 5 = 280px

    // Radar Base Background: Authentic Arcade Namco Blue (0x214797)
    this.radarGraphics.fillStyle(0x214797, 1);
    this.radarGraphics.fillRect(radarX, radarY, radarW, radarH);
    // Top & Bottom border divider lines
    this.radarGraphics.lineStyle(1, 0x3b82f6, 0.8);
    this.radarGraphics.lineBetween(radarX, radarY, radarX + radarW, radarY);
    this.radarGraphics.lineBetween(radarX, radarY + radarH, radarX + radarW, radarY + radarH);

    // 1. Uncollected Flags: yellow dots centered in 5x5 cells
    const config = this.gameState.getCurrentLevelConfig();
    this.radarGraphics.fillStyle(0xffff00, 1);
    config.flags.forEach((flag) => {
      const key = `flag_${flag.col}_${flag.row}`;
      if (this.collectedFlagKeys.has(key)) return;
      const sp = this.flagSprites.get(key);
      if (sp && sp.visible) {
        const rx = radarX + flag.col * RADAR_SCALE;
        const ry = radarY + flag.row * RADAR_SCALE;
        this.radarGraphics.fillRect(rx + 1, ry + 1, 3, 3);
      }
    });

    // 2. Red Enemy Cars: 5x5 px bright red dots
    this.radarGraphics.fillStyle(0xff2222, 1);
    this.enemies.forEach((enemy) => {
      const innerCol = enemy.col - RALLYX_BORDER_WIDTH;
      const innerRow = enemy.row - RALLYX_BORDER_WIDTH;
      if (innerCol >= 0 && innerCol < 32 && innerRow >= 0 && innerRow < 56) {
        const rx = radarX + innerCol * RADAR_SCALE;
        const ry = radarY + innerRow * RADAR_SCALE;
        this.radarGraphics.fillRect(rx, ry, 5, 5);
      }
    });

    // 3. Blue Player Car: Solid electric blue dot matching car color (No blinking, eye-friendly)
    const innerPlayerCol = this.playerCol - RALLYX_BORDER_WIDTH;
    const innerPlayerRow = this.playerRow - RALLYX_BORDER_WIDTH;
    if (innerPlayerCol >= 0 && innerPlayerCol < 32 && innerPlayerRow >= 0 && innerPlayerRow < 56) {
      const rx = radarX + innerPlayerCol * RADAR_SCALE;
      const ry = radarY + innerPlayerRow * RADAR_SCALE;
      // Vibrant Player Blue (0x38bdf8 - Electric Azure matching Formula 1 body)
      this.radarGraphics.fillStyle(0x38bdf8, 1);
      this.radarGraphics.fillRect(rx, ry, 5, 5);
      // Crisp subtle white core to ensure distinct visibility against the dark blue radar
      this.radarGraphics.fillStyle(0xffffff, 1);
      this.radarGraphics.fillRect(rx + 1, ry + 1, 3, 3);
    }
  }

  private clearSprites(sprites: Phaser.GameObjects.Sprite[]): void {
    sprites.forEach((sp) => sp.destroy());
    sprites.length = 0;
  }

  private handleTeardown(): void {
    RallyXAudioService.stopAll();

    this.enemySprites.forEach((sp) => sp.destroy());
    this.enemySprites.clear();
    this.flagSprites.forEach((sp) => sp.destroy());
    this.flagSprites.clear();
    this.clearSprites(this.rockSprites);
    this.smokeSprites.forEach((sp) => sp.destroy());
    this.smokeSprites.clear();

    if (this.mazeGraphics) this.mazeGraphics.destroy();
    if (this.radarGraphics) this.radarGraphics.destroy();
    if (this.fuelBarGraphics) this.fuelBarGraphics.destroy();
    if (this.hudBg) this.hudBg.destroy();
    if (this.scLabel) this.scLabel.destroy();
    if (this.scoreText) this.scoreText.destroy();
    if (this.rndLabel) this.rndLabel.destroy();
    if (this.roundText) this.roundText.destroy();
    if (this.fuelLabel) this.fuelLabel.destroy();
    if (this.statusBannerText) this.statusBannerText.destroy();
    if (this.luckyBannerText) this.luckyBannerText.destroy();
    this.clearSprites(this.lifeIcons);
    this.borderTileSprites.forEach((ts) => ts.destroy());
    this.borderTileSprites.length = 0;
    this.collectedFlagKeys.clear();
  }
}
