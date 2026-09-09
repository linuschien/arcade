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

const PLAYER_BASE_SPEED = 120; // 120 pixels per second (5 tiles / sec)
const RADAR_SCALE = 4; // 32 cols * 4 = 128px, 56 rows * 4 = 224px

export class MainGameScene extends BaseArcadeScene {
  private gameState!: RallyXGameState;
  private tileMatrix!: RallyXTileType[][];

  // Containers for dual camera separation
  private worldContainer!: Phaser.GameObjects.Container;
  private hudContainer!: Phaser.GameObjects.Container;
  private hudCamera!: Phaser.Cameras.Scene2D.Camera;

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
    this.gameState = new RallyXGameState(1);
    this.tileMatrix = buildRallyXTileMatrix(this.gameState.getRound(), true);

    // Containers for Main vs HUD cameras
    this.worldContainer = this.add.container(0, 0);
    this.hudContainer = this.add.container(0, 0);

    this.setupCameras();
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

  private setupCameras(): void {
    const dpr = (this.scale?.width ? this.scale.width / 640 : 1) || 1;
    const worldWidth = RALLYX_TOTAL_COLS * RALLYX_TILE_SIZE;
    const worldHeight = RALLYX_TOTAL_ROWS * RALLYX_TILE_SIZE;

    // Main Camera: 480x480 square playfield with 2x zoom (centered on player)
    this.cameras.main.setViewport(0, 0, 480 * dpr, 480 * dpr);
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.setOrigin(0.5, 0.5);
    this.cameras.main.setZoom(2.0 * dpr);

    // HUD Camera: 160x480 right sidebar
    this.hudCamera = this.cameras.add(480 * dpr, 0, 160 * dpr, 480 * dpr);
    this.hudCamera.setOrigin(0, 0);
    this.hudCamera.setScroll(0, 0);
    this.hudCamera.setZoom(dpr);

    // Ensure camera isolation
    this.cameras.main.ignore(this.hudContainer);
    this.hudCamera.ignore(this.worldContainer);
  }

  private createWorldElements(): void {
    this.mazeGraphics = this.add.graphics();
    this.worldContainer.add(this.mazeGraphics);

    this.playerSprite = this.add.sprite(0, 0, 'rallyx:player_up');
    this.playerSprite.setOrigin(0.5, 0.5);
    this.worldContainer.add(this.playerSprite);

    this.cameras.main.startFollow(this.playerSprite, true, 1, 1);
  }

  private createHUDElements(): void {
    // 1. Sidebar Background
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x090d16, 1);
    hudBg.fillRect(0, 0, 160, 480);
    hudBg.lineStyle(2, 0x1e293b, 1);
    hudBg.lineBetween(0, 0, 0, 480);
    this.hudContainer.add(hudBg);

    // 2. Score & Round Headers
    const labelStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#f59e0b',
      fontStyle: 'bold',
    };
    const valStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
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
    const fuelLabel = this.add.text(16, 350, 'FUEL', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.fuelBarGraphics = this.add.graphics();
    this.hudContainer.add([fuelLabel, this.fuelBarGraphics]);

    // 5. Reserve Lives Icons (x:16, y:395)
    for (let i = 0; i < 4; i++) {
      const icon = this.add.sprite(26 + i * 22, 405, 'rallyx:hud_life');
      icon.setVisible(false);
      this.lifeIcons.push(icon);
      this.hudContainer.add(icon);
    }

    // 6. Centered Status Banner (e.g. READY! / GAME OVER / CLEAR)
    this.statusBannerText = this.add.text(80, 430, 'READY!', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#facc15',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.hudContainer.add(this.statusBannerText);

    // 7. Lucky Refill Overlay Banner
    this.luckyBannerText = this.add.text(80, 455, '★ LUCKY! ★', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#22c55e',
      fontStyle: 'bold',
    }).setOrigin(0.5, 0.5);
    this.luckyBannerText.setVisible(false);
    this.hudContainer.add(this.luckyBannerText);
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
    if (this.cameras?.main && typeof this.cameras.main.centerOn === 'function') {
      this.cameras.main.centerOn(this.playerX, this.playerY);
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

    // Theme wall colors per maze: 0=Green, 1=Red, 2=Cyan, 3=Grey
    const wallColors = [0x16a34a, 0xea580c, 0x0284c7, 0x475569];
    const wallColor = wallColors[mazeIndex % 4] || 0x16a34a;

    for (let r = 0; r < RALLYX_TOTAL_ROWS; r++) {
      for (let c = 0; c < RALLYX_TOTAL_COLS; c++) {
        const tile = this.tileMatrix[r][c];
        const x = c * RALLYX_TILE_SIZE;
        const y = r * RALLYX_TILE_SIZE;

        if (tile === RallyXTileType.BORDER_DECORATIVE) {
          // Checkered road border
          const isDark = (r + c) % 2 === 0;
          this.mazeGraphics.fillStyle(isDark ? 0x1e293b : 0x0f172a, 1);
          this.mazeGraphics.fillRect(x, y, RALLYX_TILE_SIZE, RALLYX_TILE_SIZE);
        } else if (tile === RallyXTileType.WALL) {
          // Maze wall blocks
          this.mazeGraphics.fillStyle(wallColor, 1);
          this.mazeGraphics.fillRect(x, y, RALLYX_TILE_SIZE, RALLYX_TILE_SIZE);
          this.mazeGraphics.lineStyle(1, 0x0f172a, 0.6);
          this.mazeGraphics.strokeRect(x, y, RALLYX_TILE_SIZE, RALLYX_TILE_SIZE);
        } else {
          // Road corridor
          this.mazeGraphics.fillStyle(0x060b13, 1);
          this.mazeGraphics.fillRect(x, y, RALLYX_TILE_SIZE, RALLYX_TILE_SIZE);
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
    if (distToCenter <= moveDist + 1.5) {
      if (this.bufferedDirection !== Direction.NONE) {
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
    }

    // Check forward collision for current direction
    const curV = DIRECTION_VECTORS[this.currentDirection];
    const forwardC = this.playerCol + curV.col;
    const forwardR = this.playerRow + curV.row;

    if (isRallyXWall(this.tileMatrix, forwardC, forwardR)) {
      // Approaching wall: clamp at tile center and auto-turn (Clockwise Priority)
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
      if (Math.hypot(this.playerX - rx, this.playerY - ry) <= 14) {
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
  }
}
