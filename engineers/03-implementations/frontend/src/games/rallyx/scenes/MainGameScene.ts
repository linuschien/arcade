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
} from '../logic/RallyXEnemyAI';
import { RallyXAudioService } from '../audio/RallyXAudioService';
import { getDynamicResolution } from '@/core/phaser/init-high-dpi';

const PLAYER_BASE_SPEED = 240; // 240 pixels per second (5 tiles / sec @ 48px/tile)
const RADAR_SCALE = 4; // 32 cols * 4 = 128px, 56 rows * 4 = 224px

export class MainGameScene extends BaseArcadeScene {
  private gameState!: RallyXGameState;
  private tileMatrix!: RallyXTileType[][];

  // Containers for World elements vs fixed HUD sidebar
  private worldContainer!: Phaser.GameObjects.Container;
  private hudContainer!: Phaser.GameObjects.Container;

  // World Game Objects
  private mazeGraphics!: Phaser.GameObjects.Graphics;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private enemySprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private flagSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private rockSprites: Phaser.GameObjects.Sprite[] = [];
  private smokeSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();

  // Player Car Kinematics
  private playerX: number = 0;
  private playerY: number = 0;
  private playerCol: number = 0;
  private playerRow: number = 0;
  private currentDirection: Direction = Direction.UP;
  private bufferedDirection: Direction = Direction.NONE;

  // Enemies
  private enemies: EnemyCar[] = [];

  // Smoke Puff Queue for 3-puff sequence
  private pendingSmokePuffs: Array<{ x: number; y: number; delayMs: number }> = [];

  // HUD Game Objects
  private highScoreText!: Phaser.GameObjects.Text;
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

  constructor() {
    super({ key: 'rallyx:MainGameScene' });
  }

  public create(): void {
    this.initHighDpiCamera(640);

    this.gameState = new RallyXGameState(1);
    this.tileMatrix = buildRallyXTileMatrix(this.gameState.getRound(), true);

    // Containers for World elements vs fixed HUD sidebar
    this.worldContainer = this.add.container(0, 0);
    this.hudContainer = this.add.container(0, 0);

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
    this.mazeGraphics = this.add.graphics();
    this.worldContainer.add(this.mazeGraphics);

    this.playerSprite = this.add.sprite(0, 0, 'rallyx:player_up');
    this.playerSprite.setOrigin(0.5, 0.5);
    this.worldContainer.add(this.playerSprite);

    // Single High-DPI Camera: centers player at (240, 240) in 480x480 playfield
    if (this.cameras?.main && typeof this.cameras.main.startFollow === 'function') {
      this.cameras.main.startFollow(this.playerSprite, true, 1, 1, 240, 240);
      if (typeof this.cameras.main.setRoundPixels === 'function') {
        this.cameras.main.setRoundPixels(true);
      }
    }
  }

  private createHUDElements(): void {
    // Fixed Right Sidebar: 160x480 at (480, 0)
    this.hudContainer.setPosition(480, 0);
    this.hudContainer.setDepth(1000);

    // 1. Sidebar Background
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x090d16, 1);
    hudBg.fillRect(0, 0, 160, 480);
    hudBg.lineStyle(2, 0x1e293b, 1);
    hudBg.lineBetween(0, 0, 0, 480);
    this.hudContainer.add(hudBg);

    // 2. Score & Round Headers
    const fontStack = 'monospace, "Courier New", Courier, sans-serif';
    const resolution = getDynamicResolution();
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '11px',
      fontFamily: fontStack,
      color: '#f59e0b',
      fontStyle: 'bold',
      resolution,
    };
    const valStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '16px',
      fontFamily: fontStack,
      color: '#ffffff',
      fontStyle: 'bold',
      resolution,
    };

    const hiLabel = this.add.text(80, 10, 'HIGH SCORE', labelStyle).setOrigin(0.5, 0);
    this.highScoreText = this.add.text(80, 24, '0', valStyle).setOrigin(0.5, 0);

    const scLabel = this.add.text(80, 42, '1UP SCORE', labelStyle).setOrigin(0.5, 0);
    this.scoreText = this.add.text(80, 56, '0', valStyle).setOrigin(0.5, 0);

    const rndLabel = this.add.text(80, 74, 'ROUND', labelStyle).setOrigin(0.5, 0);
    this.roundText = this.add.text(80, 88, '1', valStyle).setOrigin(0.5, 0);

    this.hudContainer.add([hiLabel, this.highScoreText, scLabel, this.scoreText, rndLabel, this.roundText]);

    // 3. Radar Minimap Graphics (128x224 at x:16, y:115)
    this.radarGraphics = this.add.graphics();
    this.hudContainer.add(this.radarGraphics);

    // 4. Fuel Gauge
    const fuelLabel = this.add.text(16, 348, 'FUEL', {
      fontSize: '12px',
      fontFamily: fontStack,
      color: '#ffffff',
      fontStyle: 'bold',
      resolution,
    });
    this.fuelBarGraphics = this.add.graphics();
    this.hudContainer.add([fuelLabel, this.fuelBarGraphics]);

    // 5. Reserve Lives Icons (x:16, y:395)
    for (let i = 0; i < 4; i++) {
      const icon = this.add.sprite(28 + i * 26, 405, 'rallyx:hud_life');
      icon.setVisible(false);
      this.lifeIcons.push(icon);
      this.hudContainer.add(icon);
    }

    // 6. Centered Status Banner (e.g. READY! / GAME OVER / CLEAR)
    this.statusBannerText = this.add.text(80, 432, 'READY!', {
      fontSize: '20px',
      fontFamily: fontStack,
      color: '#facc15',
      fontStyle: 'bold',
      resolution,
    }).setOrigin(0.5, 0.5);
    this.hudContainer.add(this.statusBannerText);

    // 7. Lucky Refill Overlay Banner
    this.luckyBannerText = this.add.text(80, 458, '★ LUCKY! ★', {
      fontSize: '14px',
      fontFamily: fontStack,
      color: '#22c55e',
      fontStyle: 'bold',
      resolution,
    }).setOrigin(0.5, 0.5);
    this.luckyBannerText.setVisible(false);
    this.hudContainer.add(this.luckyBannerText);

    // Pin HUD so it never scrolls with world camera
    if (typeof this.hudContainer.setScrollFactor === 'function') {
      this.hudContainer.setScrollFactor(0, 0, true);
    }
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
      this.rockSprites.push(rockSprite);
      this.worldContainer.add(rockSprite);
    }

    // Spawn Flags
    this.flagSprites.forEach((sp) => sp.destroy());
    this.flagSprites.clear();
    config.flags.forEach((flag, idx) => {
      const fx = (flag.col + RALLYX_BORDER_WIDTH + 0.5) * RALLYX_TILE_SIZE;
      const fy = (flag.row + RALLYX_BORDER_WIDTH + 0.5) * RALLYX_TILE_SIZE;
      const texKey = flag.type === 'SPECIAL'
        ? 'rallyx:flag_special'
        : flag.type === 'LUCKY'
        ? 'rallyx:flag_lucky'
        : 'rallyx:flag_regular';
      const flagSprite = this.add.sprite(fx, fy, texKey);
      flagSprite.setOrigin(0.5, 0.5);
      this.flagSprites.set(`flag_${flag.col}_${flag.row}`, flagSprite);
      this.worldContainer.add(flagSprite);
    });

    // Reset Player Position
    this.playerCol = config.playerStart.col + RALLYX_BORDER_WIDTH;
    this.playerRow = config.playerStart.row + RALLYX_BORDER_WIDTH;
    this.playerX = (this.playerCol + 0.5) * RALLYX_TILE_SIZE;
    this.playerY = (this.playerRow + 0.5) * RALLYX_TILE_SIZE;
    this.currentDirection = Direction.UP;
    this.bufferedDirection = Direction.NONE;

    this.playerSprite.setPosition(this.playerX, this.playerY);
    this.playerSprite.setTexture('rallyx:player_up');
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
      this.enemySprites.set(enemy.id, enemySprite);
      this.worldContainer.add(enemySprite);
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

    for (let r = 0; r < RALLYX_TOTAL_ROWS; r++) {
      for (let c = 0; c < RALLYX_TOTAL_COLS; c++) {
        const tile = this.tileMatrix[r][c];
        const x = c * RALLYX_TILE_SIZE;
        const y = r * RALLYX_TILE_SIZE;

        if (tile === RallyXTileType.BORDER_DECORATIVE) {
          this.renderDecorativeBorderTile(x, y, r, c, mazeTheme);
        } else if (tile === RallyXTileType.WALL) {
          // 1. Inside solid fill (內部填滿)
          this.mazeGraphics.fillStyle(wallColor, 1);
          this.mazeGraphics.fillRect(x, y, RALLYX_TILE_SIZE, RALLYX_TILE_SIZE);

          // 2. Outer perimeter outline (外圍有框線) - only stroke edges bordering non-walls
          const isTopWall = r > 0 && this.tileMatrix[r - 1][c] === RallyXTileType.WALL;
          const isBottomWall = r < RALLYX_TOTAL_ROWS - 1 && this.tileMatrix[r + 1][c] === RallyXTileType.WALL;
          const isLeftWall = c > 0 && this.tileMatrix[r][c - 1] === RallyXTileType.WALL;
          const isRightWall = c < RALLYX_TOTAL_COLS - 1 && this.tileMatrix[r][c + 1] === RallyXTileType.WALL;

          this.mazeGraphics.lineStyle(4, outlineColor, 1);
          if (!isTopWall) {
            this.mazeGraphics.lineBetween(x, y + 2, x + RALLYX_TILE_SIZE, y + 2);
          }
          if (!isBottomWall) {
            this.mazeGraphics.lineBetween(x, y + RALLYX_TILE_SIZE - 2, x + RALLYX_TILE_SIZE, y + RALLYX_TILE_SIZE - 2);
          }
          if (!isLeftWall) {
            this.mazeGraphics.lineBetween(x + 2, y, x + 2, y + RALLYX_TILE_SIZE);
          }
          if (!isRightWall) {
            this.mazeGraphics.lineBetween(x + RALLYX_TILE_SIZE - 2, y, x + RALLYX_TILE_SIZE - 2, y + RALLYX_TILE_SIZE);
          }
        } else {
          // Road corridor: authentic golden yellow road!
          this.mazeGraphics.fillStyle(ROAD_COLOR, 1);
          this.mazeGraphics.fillRect(x, y, RALLYX_TILE_SIZE, RALLYX_TILE_SIZE);
        }
      }
    }
  }

  /**
   * Renders the outer 3-tile decorative border frame with distinct graphic motifs per maze theme:
   * Theme 0 (Maze 1): Lush green forest with 8-lobed scalloped bumpy tree canopies & black outline on dark dither
   * Theme 1 (Maze 2): Diagonal light grey stone cobblestones on green lawn
   * Theme 2 (Maze 3): Deep blue waterway with concentric turquoise water ripple rings & cross pattern
   * Theme 3 (Maze 4): Pointed pine/fir trees with black trunks on dark green forest floor
   */
  private renderDecorativeBorderTile(x: number, y: number, r: number, c: number, theme: number): void {
    const s = RALLYX_TILE_SIZE / 24;

    if (theme === 0) {
      // Maze 1: Forest / Green Trees (Authentic 8-lobed bumpy scalloped canopy with black outline on dark dither)
      this.mazeGraphics.fillStyle(0x002800, 1);
      this.mazeGraphics.fillRect(x, y, RALLYX_TILE_SIZE, RALLYX_TILE_SIZE);
      this.mazeGraphics.fillStyle(0x001400, 1);
      this.mazeGraphics.fillRect(x + 2 * s, y + 2 * s, 4, 4);
      this.mazeGraphics.fillRect(x + 14 * s, y + 2 * s, 4, 4);
      this.mazeGraphics.fillRect(x + 2 * s, y + 14 * s, 4, 4);
      this.mazeGraphics.fillRect(x + 14 * s, y + 14 * s, 4, 4);

      const cx = x + 12 * s;
      const cy = y + 12 * s;
      const lobeAngles = [0, 45, 90, 135, 180, 225, 270, 315];

      // 1. Black scalloped outline of the tree canopy
      this.mazeGraphics.fillStyle(0x000000, 1);
      this.mazeGraphics.fillCircle(cx, cy, 8.5 * s);
      for (const deg of lobeAngles) {
        const rad = Phaser.Math.DegToRad(deg);
        this.mazeGraphics.fillCircle(cx + Math.cos(rad) * 6 * s, cy + Math.sin(rad) * 6 * s, 5.5 * s);
      }

      // 2. Bright green foliage body
      this.mazeGraphics.fillStyle(0x00d800, 1);
      this.mazeGraphics.fillCircle(cx, cy, 7.5 * s);
      for (const deg of lobeAngles) {
        const rad = Phaser.Math.DegToRad(deg);
        this.mazeGraphics.fillCircle(cx + Math.cos(rad) * 6 * s, cy + Math.sin(rad) * 6 * s, 4.5 * s);
      }

      // 3. Inner shadow branch/leaf curves
      this.mazeGraphics.lineStyle(2 * s, 0x004d00, 1);
      this.mazeGraphics.lineBetween(cx - 3 * s, cy - 1 * s, cx + 3 * s, cy - 1 * s);
      this.mazeGraphics.lineBetween(cx - 2 * s, cy + 3 * s, cx + 4 * s, cy + 3 * s);

      // 4. Sunlight highlights on upper lobes
      this.mazeGraphics.fillStyle(0x76ff03, 1);
      this.mazeGraphics.fillCircle(cx - 3 * s, cy - 4 * s, 2 * s);
      this.mazeGraphics.fillCircle(cx + 3 * s, cy - 4 * s, 1.8 * s);
    } else if (theme === 1) {
      // Maze 2: Garden / Diagonal Grey Cobblestones on green lawn
      this.mazeGraphics.fillStyle(0x005500, 1);
      this.mazeGraphics.fillRect(x, y, RALLYX_TILE_SIZE, RALLYX_TILE_SIZE);

      // Diagonal stone pavers
      this.mazeGraphics.fillStyle(0x000000, 1);
      this.mazeGraphics.fillRect(x + 2 * s, y + 2 * s, 9 * s, 9 * s);
      this.mazeGraphics.fillRect(x + 13 * s, y + 13 * s, 9 * s, 9 * s);
      this.mazeGraphics.fillStyle(0xd1d5db, 1);
      this.mazeGraphics.fillRect(x + 3 * s, y + 3 * s, 7 * s, 7 * s);
      this.mazeGraphics.fillRect(x + 14 * s, y + 14 * s, 7 * s, 7 * s);

      // Stone highlight
      this.mazeGraphics.fillStyle(0xf3f4f6, 1);
      this.mazeGraphics.fillRect(x + 3 * s, y + 3 * s, 7 * s, 2 * s);
      this.mazeGraphics.fillRect(x + 14 * s, y + 14 * s, 7 * s, 2 * s);
    } else if (theme === 2) {
      // Maze 3: Waterway / Circular ripple rings on deep marine water
      this.mazeGraphics.fillStyle(0x075985, 1);
      this.mazeGraphics.fillRect(x, y, RALLYX_TILE_SIZE, RALLYX_TILE_SIZE);

      const cx = x + 12 * s;
      const cy = y + 12 * s;
      // Outer water ripple ring
      this.mazeGraphics.lineStyle(2 * s, 0x00d8f0, 1);
      this.mazeGraphics.strokeCircle(cx, cy, 9 * s);
      // Inner water ripple ring
      this.mazeGraphics.lineStyle(1.5 * s, 0x38bdf8, 1);
      this.mazeGraphics.strokeCircle(cx, cy, 5 * s);
      // Water cross ripple
      this.mazeGraphics.lineStyle(1 * s, 0x7dd3fc, 0.9);
      this.mazeGraphics.lineBetween(cx - 3 * s, cy, cx + 3 * s, cy);
      this.mazeGraphics.lineBetween(cx - 3 * s, cy, cx + 3 * s, cy);
      this.mazeGraphics.lineBetween(cx, cy - 3 * s, cx, cy + 3 * s);
    } else {
      // Maze 4: Pine Trees / Ruins
      this.mazeGraphics.fillStyle(0x003300, 1);
      this.mazeGraphics.fillRect(x, y, RALLYX_TILE_SIZE, RALLYX_TILE_SIZE);

      // Pine tree trunk
      this.mazeGraphics.fillStyle(0x000000, 1);
      this.mazeGraphics.fillRect(x + 11 * s, y + 16 * s, 3 * s, 6 * s);

      // Pointed pine canopy layers
      if (typeof (this.mazeGraphics as any).fillTriangle === 'function') {
        // Base pine layer
        this.mazeGraphics.fillStyle(0x000000, 1);
        (this.mazeGraphics as any).fillTriangle(
          x + 4 * s, y + 18 * s,
          x + 20 * s, y + 18 * s,
          x + 12 * s, y + 10 * s
        );
        this.mazeGraphics.fillStyle(0x00a800, 1);
        (this.mazeGraphics as any).fillTriangle(
          x + 5 * s, y + 17 * s,
          x + 19 * s, y + 17 * s,
          x + 12 * s, y + 11 * s
        );

        // Top pine layer
        this.mazeGraphics.fillStyle(0x000000, 1);
        (this.mazeGraphics as any).fillTriangle(
          x + 6 * s, y + 12 * s,
          x + 18 * s, y + 12 * s,
          x + 12 * s, y + 3 * s
        );
        this.mazeGraphics.fillStyle(0x00e000, 1);
        (this.mazeGraphics as any).fillTriangle(
          x + 7 * s, y + 11 * s,
          x + 17 * s, y + 11 * s,
          x + 12 * s, y + 4 * s
        );
      } else {
        this.mazeGraphics.fillStyle(0x00e000, 1);
        this.mazeGraphics.fillRect(x + 6 * s, y + 4 * s, 12 * s, 14 * s);
      }
    }
  }

  private startRoundIntro(): void {
    this.gameState.setPlayState(RallyXPlayState.READY);
    const isChallenging = this.gameState.isChallengingStage();
    this.statusBannerText.setText(isChallenging ? 'CHALLENGE!' : 'READY!');
    this.statusBannerText.setVisible(true);

    RallyXAudioService.playGameStart();

    // Game Start Fanfare duration is ~4.2s (160 BPM)
    this.time.delayedCall(4200, () => {
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

  private setRequestedDirection(dir: Direction): void {
    if (dir === this.currentDirection) {
      this.bufferedDirection = Direction.NONE;
      return;
    }

    // US-06-01 AC3: Instant 180° U-turn on opposite input
    if (OPPOSITE_DIRECTIONS[this.currentDirection] === dir) {
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

    // Check if within snap radius to execute buffered 90° turn
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

        if (!isRallyXWall(this.tileMatrix, this.playerCol + cwV.col, this.playerRow + cwV.row)) {
          this.currentDirection = cw;
        } else if (!isRallyXWall(this.tileMatrix, this.playerCol + ccwV.col, this.playerRow + ccwV.row)) {
          this.currentDirection = ccw;
        } else {
          // Dead end: automatic 180° U-turn!
          this.currentDirection = opp;
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
  }

  private updatePlayerSpriteTexture(): void {
    const dirMap: Record<Direction, string> = {
      [Direction.UP]: 'rallyx:player_up',
      [Direction.DOWN]: 'rallyx:player_down',
      [Direction.LEFT]: 'rallyx:player_left',
      [Direction.RIGHT]: 'rallyx:player_right',
      [Direction.NONE]: 'rallyx:player_up',
    };
    this.playerSprite.setTexture(dirMap[this.currentDirection]);
  }

  private queueSmokePuffsSequence(x: number, y: number): void {
    // 3 sequential puffs emitted in the car's wake
    this.gameState.addSmokePuff(x, y);
    this.pendingSmokePuffs.push({ x, y, delayMs: 80 });
    this.pendingSmokePuffs.push({ x, y, delayMs: 160 });
  }

  private updatePendingSmokePuffs(deltaMs: number): void {
    for (let i = this.pendingSmokePuffs.length - 1; i >= 0; i--) {
      this.pendingSmokePuffs[i].delayMs -= deltaMs;
      if (this.pendingSmokePuffs[i].delayMs <= 0) {
        this.gameState.addSmokePuff(this.pendingSmokePuffs[i].x, this.pendingSmokePuffs[i].y);
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
        this.smokeSprites.set(puff.id, sp);
        this.worldContainer.add(sp);
      }
      const alpha = Math.min(1.0, puff.remainingTimeSec / 2.0);
      sp.setAlpha(alpha);
    });
  }

  private updateEnemies(deltaSec: number): void {
    const playerBaseSpeed = this.gameState.isFuelEmpty()
      ? PLAYER_BASE_SPEED * 0.5
      : PLAYER_BASE_SPEED;

    this.enemies.forEach((enemy) => {
      RallyXEnemyAI.updateEnemy(
        enemy,
        this.tileMatrix,
        this.playerCol,
        this.playerRow,
        this.currentDirection,
        playerBaseSpeed,
        deltaSec
      );

      const sp = this.enemySprites.get(enemy.id);
      if (sp) {
        sp.setPosition(enemy.x, enemy.y);
        if (enemy.state === EnemyState.SPIN_OUT) {
          sp.setAngle(enemy.spinAngleDeg);
        } else {
          sp.setAngle(0);
          const dirKey = `rallyx:enemy_${enemy.direction.toLowerCase()}`;
          if (this.textures.exists(dirKey)) {
            sp.setTexture(dirKey);
          }
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

    RallyXEnemyAI.checkCarBumps(this.enemies);
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
        flagSprite.setVisible(false);
        const result = this.gameState.collectFlag(flagSpec.type);

        if (result.isSpecialActivated) {
          RallyXAudioService.playSpecialFlagFanfare();
        } else if (result.isLuckyActivated) {
          RallyXAudioService.playLuckyFlagChime();
        } else {
          RallyXAudioService.playFlagPickup(this.gameState.getFlagsCollected());
        }

        ArcadeBridge.emit('SCORE_UPDATED', { score: this.gameState.getScore() });

        if (result.isStageClear) {
          this.handleStageClear();
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

    this.playerSprite.setTexture('rallyx:crash_0');

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

  private handleStageClear(): void {
    RallyXAudioService.playRoundClear();
    this.statusBannerText.setText('STAGE CLEAR!');
    this.statusBannerText.setVisible(true);

    this.time.delayedCall(2200, () => {
      this.gameState.advanceToNextRound();
      this.resetLevelEntities();
      this.startRoundIntro();
    });
  }

  private updateHUD(): void {
    this.scoreText.setText(`${this.gameState.getScore()}`);
    this.highScoreText.setText(`${this.gameState.getHighScore()}`);
    this.roundText.setText(`${this.gameState.getRound()}`);

    // Update Reserve Lives Icons (lives - 1)
    const reserveLives = Math.max(0, this.gameState.getLives() - 1);
    for (let i = 0; i < 4; i++) {
      this.lifeIcons[i].setVisible(i < reserveLives);
    }

    // Update Fuel Bar (128x12 px at x:16, y:368)
    this.fuelBarGraphics.clear();
    const barWidth = 128;
    const barHeight = 12;
    const barX = 16;
    const barY = 368;

    // Fuel Border & Background
    this.fuelBarGraphics.fillStyle(0x0f172a, 1);
    this.fuelBarGraphics.fillRect(barX, barY, barWidth, barHeight);
    this.fuelBarGraphics.lineStyle(1, 0x334155, 1);
    this.fuelBarGraphics.strokeRect(barX, barY, barWidth, barHeight);

    const fuelRatio = Math.max(0, Math.min(1.0, this.gameState.getFuel() / MAX_FUEL));
    const fillWidth = Math.floor(barWidth * fuelRatio);

    if (fillWidth > 0) {
      let fillColor = 0x22c55e; // Green
      if (fuelRatio <= 0.2) {
        fillColor = this.isRadarPlayerDotVisible ? 0xef4444 : 0x7f1d1d; // Flashing Red
      } else if (fuelRatio <= 0.5) {
        fillColor = 0xeab308; // Yellow
      }
      this.fuelBarGraphics.fillStyle(fillColor, 1);
      this.fuelBarGraphics.fillRect(barX + 1, barY + 1, fillWidth - 2, barHeight - 2);
    }

    // Update Minimap Radar (128x224 at x:16, y:115)
    this.renderRadar();
  }

  private renderRadar(): void {
    this.radarGraphics.clear();
    const radarX = 16;
    const radarY = 115;
    const radarW = 32 * RADAR_SCALE; // 128px
    const radarH = 56 * RADAR_SCALE; // 224px

    // Radar Base Background & Grid Boundary
    this.radarGraphics.fillStyle(0x020617, 1);
    this.radarGraphics.fillRect(radarX, radarY, radarW, radarH);
    this.radarGraphics.lineStyle(1, 0x1e293b, 1);
    this.radarGraphics.strokeRect(radarX, radarY, radarW, radarH);

    // 1. Uncollected Flags: ALL rendered as identical yellow dots (Blind-test specification!)
    const config = this.gameState.getCurrentLevelConfig();
    this.radarGraphics.fillStyle(0xfde047, 1);
    config.flags.forEach((flag) => {
      const key = `flag_${flag.col}_${flag.row}`;
      const sp = this.flagSprites.get(key);
      if (sp && sp.visible) {
        const rx = radarX + flag.col * RADAR_SCALE;
        const ry = radarY + flag.row * RADAR_SCALE;
        this.radarGraphics.fillRect(rx, ry, 3, 3);
      }
    });

    // 2. Red Enemy Cars
    this.radarGraphics.fillStyle(0xef4444, 1);
    this.enemies.forEach((enemy) => {
      const innerCol = enemy.col - RALLYX_BORDER_WIDTH;
      const innerRow = enemy.row - RALLYX_BORDER_WIDTH;
      if (innerCol >= 0 && innerCol < 32 && innerRow >= 0 && innerRow < 56) {
        const rx = radarX + innerCol * RADAR_SCALE;
        const ry = radarY + innerRow * RADAR_SCALE;
        this.radarGraphics.fillRect(rx, ry, 4, 4);
      }
    });

    // 3. Blue Player Car: Blinking white/yellow square dot
    if (this.isRadarPlayerDotVisible) {
      const innerPlayerCol = this.playerCol - RALLYX_BORDER_WIDTH;
      const innerPlayerRow = this.playerRow - RALLYX_BORDER_WIDTH;
      if (innerPlayerCol >= 0 && innerPlayerCol < 32 && innerPlayerRow >= 0 && innerPlayerRow < 56) {
        this.radarGraphics.fillStyle(0xffffff, 1);
        const rx = radarX + innerPlayerCol * RADAR_SCALE;
        const ry = radarY + innerPlayerRow * RADAR_SCALE;
        this.radarGraphics.fillRect(rx, ry, 4, 4);
      }
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
    if (this.hudContainer) this.hudContainer.destroy();
    if (this.worldContainer) this.worldContainer.destroy();
  }
}
