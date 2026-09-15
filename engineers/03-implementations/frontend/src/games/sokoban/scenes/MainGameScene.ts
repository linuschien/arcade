/**
 * MainGameScene.ts
 * Core 60fps Phaser 4 Canvas Scene for Sokoban 50.
 * Features a Three-Column Layout:
 * - Left HUD (200px): World Badge, Stage indicator, Soft Timer with countdown bar, Undo quota lamps.
 * - Center Diorama (880px): Dynamic 4:3 sand table centering, adaptive tile scaling (20-64px),
 *   recessed target plates, golden crate glow, orthogonal deadlock banners, and hold-to-give-up modal.
 * - Right HUD (200px): 8-digit Gold score, 3 lives icons, 1UP 100,000 extend meter, and permanent key legend.
 */

import Phaser from 'phaser';
import { BaseArcadeScene } from '@/core/phaser/BaseArcadeScene';
import { InputService, PlayerIndex, ArcadeAction } from '@/core/input/InputService';
import { ArcadeBridge } from '@/core/bridge/ArcadeBridge';
import { SokobanGameState } from '../logic/SokobanGameState';
import { Direction, GridPos, posKey } from '../logic/SokobanMaze';
import { SokobanAudioService } from '../audio/SokobanAudioService';

export class MainGameScene extends BaseArcadeScene {
  private state!: SokobanGameState;

  // Board layout geometry
  private tileSize: number = 48;
  private boardStartX: number = 200;
  private boardStartY: number = 30;

  // Render Containers & Graphics
  private ambientBackdrop!: Phaser.GameObjects.TileSprite;
  private vignetteGfx!: Phaser.GameObjects.Graphics;
  private centerArenaGfx!: Phaser.GameObjects.Graphics;
  private boardLayer!: Phaser.GameObjects.Container;
  private tileSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private boxSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private workerSprite!: Phaser.GameObjects.Sprite;

  // Left HUD
  private leftHudGfx!: Phaser.GameObjects.Graphics;
  private worldBadgeText!: Phaser.GameObjects.Text;
  private stageTitleText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private timerBarGfx!: Phaser.GameObjects.Graphics;
  private undoLampsGfx!: Phaser.GameObjects.Graphics;
  private undoCountText!: Phaser.GameObjects.Text;

  // Right HUD
  private rightHudGfx!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private livesGfx!: Phaser.GameObjects.Graphics;
  private extendBarGfx!: Phaser.GameObjects.Graphics;
  private extendLabelText!: Phaser.GameObjects.Text;

  // Overlays (Alerts, Hold-Give-Up, Stage Clear, Menu)
  private deadlockBannerContainer!: Phaser.GameObjects.Container;
  private deadlockBannerBg!: Phaser.GameObjects.Graphics;
  private deadlockBannerText!: Phaser.GameObjects.Text;

  private giveUpModalContainer!: Phaser.GameObjects.Container;
  private giveUpBarGfx!: Phaser.GameObjects.Graphics;

  private modalOverlayContainer!: Phaser.GameObjects.Container;
  private modalBg!: Phaser.GameObjects.Graphics;
  private modalTitleText!: Phaser.GameObjects.Text;
  private modalBodyText!: Phaser.GameObjects.Text;
  private modalPromptText!: Phaser.GameObjects.Text;

  // Input edge detection & Delayed Auto Shift (DAS)
  private prevActionDown: Map<ArcadeAction, boolean> = new Map();
  private readonly DAS_DELAY_MS: number = 260; // Initial delay before hold auto-repeat begins
  private readonly ARR_SPEED_MS: number = 140; // Auto-repeat rate once hold threshold is reached
  private activeMoveDir: Direction = Direction.NONE;
  private moveHoldTimer: number = 0;
  private giveUpLockedUntilRelease: boolean = false;

  private currentWorkerFacing: 'down' | 'up' | 'left' | 'right' = 'down';
  private titleMenuSelectedIndex: number = 0;

  private isActionJustPressed(action: ArcadeAction): boolean {
    const isDown = InputService.isActionDown(PlayerIndex.P1, action);
    const wasDown = this.prevActionDown.get(action) || false;
    this.prevActionDown.set(action, isDown);
    return isDown && !wasDown;
  }

  constructor() {
    super({ key: 'sokoban:MainGameScene' });
  }

  public create(): void {
    this.initHighDpiCamera(1280);
    this.state = new SokobanGameState();

    // Setup base visual layers
    this.createBackground();
    this.createLeftHUD();
    this.createCenterDiorama();
    this.createRightHUD();
    this.createOverlays();

    // Register teardown cleanup
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.handleShutdown, this);

    // Show initial title menu
    this.showTitleMenu();
  }

  protected override onPauseAudio(): void {
    SokobanAudioService.pauseBGM();
  }

  protected override onResumeAudio(): void {
    SokobanAudioService.resumeBGM();
  }

  private createBackground(): void {
    const bgGfx = this.add.graphics();
    // Arcade deep obsidian backdrop
    bgGfx.fillStyle(0x020617, 1);
    bgGfx.fillRect(0, 0, 1280, 720);
  }

  private createLeftHUD(): void {
    this.leftHudGfx = this.add.graphics();
    // Glass panel base & outer border
    this.leftHudGfx.fillStyle(0x090f1d, 0.75);
    this.leftHudGfx.fillRoundedRect(8, 30, 184, 660, 8);
    this.leftHudGfx.lineStyle(1.5, 0x334155, 0.8);
    this.leftHudGfx.strokeRoundedRect(8, 30, 184, 660, 8);

    this.timerBarGfx = this.add.graphics();
    this.undoLampsGfx = this.add.graphics();

    // World badge container
    this.worldBadgeText = this.add.text(100, 55, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#38bdf8',
      align: 'center',
    }).setOrigin(0.5);

    // Stage text
    this.stageTitleText = this.add.text(100, 85, '', {
      fontFamily: 'monospace',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#f8fafc',
      align: 'center',
    }).setOrigin(0.5);

    // Soft Timer text
    this.timerText = this.add.text(100, 160, '00:00', {
      fontFamily: 'monospace',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#10b981',
      align: 'center',
    }).setOrigin(0.5);

    // Undo text header
    this.add.text(100, 260, 'UNDO QUOTA [Z]', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#94a3b8',
      align: 'center',
    }).setOrigin(0.5);

    this.undoCountText = this.add.text(100, 285, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#e2e8f0',
      align: 'center',
    }).setOrigin(0.5);
  }

  private createCenterDiorama(): void {
    // 1. Layer 0 Ambient Themed Backdrop (880x660 at x: 200, y: 30)
    if (typeof (this.add as any).tileSprite === 'function') {
      this.ambientBackdrop = (this.add as any).tileSprite(
        200,
        30,
        880,
        660,
        'sokoban:ambient_cargo_depot'
      );
      this.ambientBackdrop.setOrigin(0, 0);
      this.ambientBackdrop.setDepth(0);
    }

    // 2. Layer 1 Drop Shadow & Arena Plinth
    this.centerArenaGfx = this.add.graphics();
    if (typeof (this.centerArenaGfx as any).setDepth === 'function') {
      this.centerArenaGfx.setDepth(1);
    }

    // 3. Layer 2 Board Container
    this.boardLayer = this.add.container(0, 0);
    if (typeof (this.boardLayer as any).setDepth === 'function') {
      this.boardLayer.setDepth(10);
    }

    // 4. Layer 3 Vignette Frame (Optical edge blending & rounded frame)
    this.vignetteGfx = this.add.graphics();
    if (typeof (this.vignetteGfx as any).setDepth === 'function') {
      this.vignetteGfx.setDepth(20);
    }
    this.drawVignetteFrame();
  }

  private drawVignetteFrame(): void {
    this.vignetteGfx.clear();

    // Edge gradient shadow bands to blend arena smoothly with Left/Right HUDs
    for (let i = 0; i < 16; i++) {
      const alpha = (1 - i / 16) * 0.35;
      this.vignetteGfx.fillStyle(0x020617, alpha);
      this.vignetteGfx.fillRect(200 + i, 30, 1, 660);
      this.vignetteGfx.fillRect(1080 - 1 - i, 30, 1, 660);
    }
    for (let i = 0; i < 16; i++) {
      const alpha = (1 - i / 16) * 0.35;
      this.vignetteGfx.fillStyle(0x020617, alpha);
      this.vignetteGfx.fillRect(200, 30 + i, 880, 1);
      this.vignetteGfx.fillRect(200, 690 - 1 - i, 880, 1);
    }

    // Outer rounded rect border around the 880x660 central arena (matching Left & Right HUDs)
    this.vignetteGfx.lineStyle(1.5, 0x334155, 0.8);
    this.vignetteGfx.strokeRoundedRect(200, 30, 880, 660, 8);
  }

  private createRightHUD(): void {
    this.rightHudGfx = this.add.graphics();
    // Glass panel base & outer border
    this.rightHudGfx.fillStyle(0x090f1d, 0.75);
    this.rightHudGfx.fillRoundedRect(1088, 30, 184, 660, 8);
    this.rightHudGfx.lineStyle(1.5, 0x334155, 0.8);
    this.rightHudGfx.strokeRoundedRect(1088, 30, 184, 660, 8);

    this.livesGfx = this.add.graphics();
    this.extendBarGfx = this.add.graphics();

    // Score Header
    this.add.text(1180, 55, 'TOTAL SCORE', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#94a3b8',
      align: 'center',
    }).setOrigin(0.5);

    // Clean Gold Score Display (no excessive leading zeros)
    this.scoreText = this.add.text(1180, 85, '0', {
      fontFamily: 'monospace',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#facc15',
      align: 'center',
    }).setOrigin(0.5);

    // Lives Header
    this.add.text(1180, 160, 'LIVES REMAINING', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#94a3b8',
      align: 'center',
    }).setOrigin(0.5);

    // 1UP Extend Header
    this.extendLabelText = this.add.text(1180, 260, '1UP PROGRESS (100K)', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#a855f7',
      align: 'center',
    }).setOrigin(0.5);

    // Permanent Keyboard Legend
    const legendY = 420;
    this.add.text(1180, legendY, 'KEY COMMANDS', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#64748b',
      align: 'center',
    }).setOrigin(0.5);

    const keysInfo = [
      '[ARROWS/WASD]',
      'MOVE / PUSH',
      '',
      '[Z] KEY',
      'UNDO MOVE',
      '',
      '[X] (HOLD 1S)',
      'GIVE UP & RETRY',
    ];

    keysInfo.forEach((line, idx) => {
      this.add.text(1180, legendY + 25 + idx * 18, line, {
        fontFamily: 'monospace',
        fontSize: idx % 3 === 0 ? '12px' : '11px',
        color: idx % 3 === 0 ? '#38bdf8' : '#94a3b8',
        align: 'center',
      }).setOrigin(0.5);
    });
  }

  private createOverlays(): void {
    // 1. Deadlock Banner (Top of center area)
    this.deadlockBannerContainer = this.add.container(640, 65).setVisible(false);
    if (typeof (this.deadlockBannerContainer as any).setDepth === 'function') {
      this.deadlockBannerContainer.setDepth(100);
    }
    this.deadlockBannerBg = this.add.graphics();
    this.deadlockBannerText = this.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);
    this.deadlockBannerContainer.add([this.deadlockBannerBg, this.deadlockBannerText]);

    // 2. Hold Give Up Modal (Center 320x120)
    this.giveUpModalContainer = this.add.container(640, 360).setVisible(false);
    if (typeof (this.giveUpModalContainer as any).setDepth === 'function') {
      this.giveUpModalContainer.setDepth(200);
    }
    const modalBg = this.add.graphics();
    modalBg.fillStyle(0x0f172a, 0.95);
    modalBg.fillRoundedRect(-160, -60, 320, 120, 8);
    modalBg.lineStyle(2, 0xef4444, 0.9);
    modalBg.strokeRoundedRect(-160, -60, 320, 120, 8);

    const giveUpTitle = this.add.text(0, -32, 'GIVING UP...', {
      fontFamily: 'monospace',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#f87171',
    }).setOrigin(0.5);

    const giveUpSub = this.add.text(0, 34, 'SACRIFICING 1 LIFE', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#fca5a5',
    }).setOrigin(0.5);

    this.giveUpBarGfx = this.add.graphics();
    this.giveUpModalContainer.add([modalBg, giveUpTitle, giveUpSub, this.giveUpBarGfx]);

    // 3. General Dialog Modal (Title Menu, Stage Clear, Game Over, Victory)
    this.modalOverlayContainer = this.add.container(640, 360).setVisible(false);
    if (typeof (this.modalOverlayContainer as any).setDepth === 'function') {
      this.modalOverlayContainer.setDepth(300);
    }
    this.modalBg = this.add.graphics();
    this.modalTitleText = this.add.text(0, -110, '', {
      fontFamily: 'monospace',
      fontSize: '24px',
      fontStyle: 'bold',
      color: '#facc15',
    }).setOrigin(0.5);

    this.modalBodyText = this.add.text(0, -5, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#f8fafc',
      align: 'center',
      lineSpacing: 8,
    }).setOrigin(0.5);

    this.modalPromptText = this.add.text(0, 115, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: '#38bdf8',
    }).setOrigin(0.5);

    this.modalOverlayContainer.add([
      this.modalBg,
      this.modalTitleText,
      this.modalBodyText,
      this.modalPromptText,
    ]);
  }

  private showTitleMenu(): void {
    this.modalOverlayContainer.setVisible(true);
    this.modalBg.clear();
    // Backdrop dimmer to ensure high contrast over center arena
    this.modalBg.fillStyle(0x000000, 0.65);
    this.modalBg.fillRect(-640, -360, 1280, 720);

    this.modalBg.fillStyle(0x0a0f1d, 0.95);
    this.modalBg.fillRoundedRect(-250, -150, 500, 300, 12);
    this.modalBg.lineStyle(2, 0x38bdf8, 0.85);
    this.modalBg.strokeRoundedRect(-250, -150, 500, 300, 12);

    this.modalTitleText.setText('SOKOBAN 50 SELECTION');
    this.modalTitleText.setColor('#facc15');

    this.titleMenuSelectedIndex = 0;
    this.updateTitleMenuDisplay();
    this.modalPromptText.setText('[↑ / ↓] SELECT    [SPACE] CONFIRM');
  }

  private updateTitleMenuDisplay(): void {
    const maxCleared = this.state.maxClearedStage;
    if (maxCleared > 0) {
      const optContinue = (this.titleMenuSelectedIndex === 0 ? '► ' : '  ') + `CONTINUE (STAGE ${maxCleared + 1})`;
      const optNewGame  = (this.titleMenuSelectedIndex === 1 ? '► ' : '  ') + 'NEW GAME (STAGE 01)';
      this.modalBodyText.setText(
        `SAVED PROGRESS: STAGE ${maxCleared} CLEARED\n\n` +
        `${optContinue}\n` +
        `${optNewGame}`
      );
    } else {
      this.titleMenuSelectedIndex = 0;
      this.modalBodyText.setText(
        '50 CURATED DIORAMA BOX-PUSHING PUZZLES\n' +
        'ACROSS 4 ATMOSPHERIC WORLDS\n\n' +
        '► START NEW GAME (STAGE 1)'
      );
    }
  }

  private renderStageBoard(): void {
    // Clear previous board objects
    this.boardLayer.removeAll(true);
    this.tileSprites.clear();
    this.boxSprites.clear();

    const maze = this.state.maze;
    const stageCfg = this.state.currentStageConfig;
    const themeKey = stageCfg.themeKey;

    // Update Layer 0 Ambient Backdrop to match active world
    if (this.ambientBackdrop && typeof this.ambientBackdrop.setTexture === 'function') {
      this.ambientBackdrop.setTexture(`sokoban:ambient_${themeKey}`);
    }

    // Calculate adaptive tile scaling for 880x660 arena (safe margin 820x600)
    const availableW = 820;
    const availableH = 600;
    this.tileSize = Math.min(
      Math.floor(availableW / maze.width),
      Math.floor(availableH / maze.height),
      96,
    );
    this.tileSize = Math.max(20, this.tileSize);

    const boardW = maze.width * this.tileSize;
    const boardH = maze.height * this.tileSize;
    this.boardStartX = 200 + (880 - boardW) / 2;
    this.boardStartY = 30 + (660 - boardH) / 2;

    // Draw Layer 1 2.5D drop shadow & island plinth onto the ambient floor
    this.centerArenaGfx.clear();
    // Deep 2.5D drop shadow under the maze island (+8px, +12px)
    this.centerArenaGfx.fillStyle(0x000000, 0.65);
    this.centerArenaGfx.fillRoundedRect(
      this.boardStartX + 8,
      this.boardStartY + 12,
      boardW,
      boardH,
      10
    );
    // Diorama floating island plinth / base
    this.centerArenaGfx.fillStyle(0x0b1120, 0.9);
    this.centerArenaGfx.fillRoundedRect(
      this.boardStartX - 4,
      this.boardStartY - 4,
      boardW + 8,
      boardH + 8,
      8
    );
    this.centerArenaGfx.lineStyle(2, 0x334155, 0.7);
    this.centerArenaGfx.strokeRoundedRect(
      this.boardStartX - 4,
      this.boardStartY - 4,
      boardW + 8,
      boardH + 8,
      8
    );

    const floorTexture = `sokoban:floor_${themeKey}`;
    const wallTexture = `sokoban:wall_${themeKey}`;

    // 1. Render Floor & Walls
    for (let r = 0; r < maze.height; r++) {
      for (let c = 0; c < maze.width; c++) {
        const x = this.boardStartX + c * this.tileSize + this.tileSize / 2;
        const y = this.boardStartY + r * this.tileSize + this.tileSize / 2;

        if (maze.isWall(c, r)) {
          const wall = this.add.sprite(x, y, wallTexture);
          wall.setDisplaySize(this.tileSize, this.tileSize);
          this.boardLayer.add(wall);
        } else if (maze.isFloor(c, r)) {
          const floor = this.add.sprite(x, y, floorTexture);
          floor.setDisplaySize(this.tileSize, this.tileSize);
          this.boardLayer.add(floor);

          // Add goal target marker if goal
          if (maze.isGoal(c, r)) {
            const goal = this.add.sprite(x, y, 'sokoban:goal');
            goal.setDisplaySize(this.tileSize, this.tileSize);
            this.boardLayer.add(goal);
          }
        }
      }
    }

    // 2. Render Boxes
    for (const boxPos of maze.getBoxPositions()) {
      const x = this.boardStartX + boxPos.col * this.tileSize + this.tileSize / 2;
      const y = this.boardStartY + boxPos.row * this.tileSize + this.tileSize / 2;
      const isGoal = maze.isGoal(boxPos.col, boxPos.row);
      const texture = isGoal ? 'sokoban:crate_gold' : 'sokoban:crate';

      const boxSprite = this.add.sprite(x, y, texture);
      boxSprite.setDisplaySize(this.tileSize, this.tileSize);
      this.boardLayer.add(boxSprite);
      this.boxSprites.set(posKey(boxPos.col, boxPos.row), boxSprite);
    }

    // 3. Render Worker
    const workerPos = maze.getWorkerPos();
    const wx = this.boardStartX + workerPos.col * this.tileSize + this.tileSize / 2;
    const wy = this.boardStartY + workerPos.row * this.tileSize + this.tileSize / 2;
    this.workerSprite = this.add.sprite(wx, wy, `sokoban:worker_${this.currentWorkerFacing}`);
    this.workerSprite.setDisplaySize(this.tileSize, this.tileSize);
    this.boardLayer.add(this.workerSprite);

    // Play World BGM
    SokobanAudioService.playWorldBGM(themeKey);

    // Refresh HUD
    this.updateHUD();
  }

  public update(_time: number, delta: number): void {
    if (!this.state) return;

    // Handle universal tick
    const tickEvent = this.state.tick(delta);
    if (tickEvent.timeoutTriggered) {
      SokobanAudioService.playTimeout();
    }
    if (tickEvent.lifeLost) {
      this.giveUpLockedUntilRelease = true; // Prevent chained sacrifice on continuous hold
      if (this.state.status === 'GAME_OVER') {
        this.showGameOver();
      } else {
        this.renderStageBoard();
      }
    }

    // Process inputs
    this.handleInput(delta);

    // Refresh HUD displays
    this.updateHUD();
  }

  private handleInput(delta: number): void {
    // 1. Title Menu Navigation & Confirmation
    if (this.state.status === 'TITLE_MENU') {
      const maxCleared = this.state.maxClearedStage;

      // Arrow Up (Edge-triggered: 1 tap = 1 step)
      const isUp = this.isActionJustPressed(ArcadeAction.UP);

      // Arrow Down (Edge-triggered: 1 tap = 1 step)
      const isDown = this.isActionJustPressed(ArcadeAction.DOWN);

      if (maxCleared > 0) {
        if (isUp) {
          this.titleMenuSelectedIndex = 0;
          this.updateTitleMenuDisplay();
          SokobanAudioService.playStep();
        } else if (isDown) {
          this.titleMenuSelectedIndex = 1;
          this.updateTitleMenuDisplay();
          SokobanAudioService.playStep();
        }
      }

      // Confirm selection with BUTTON_A (Edge-triggered: Space/Enter/Z/Gamepad A)
      const isConfirm = this.isActionJustPressed(ArcadeAction.BUTTON_A);

      if (isConfirm) {
        if (maxCleared > 0 && this.titleMenuSelectedIndex === 0) {
          this.state.continueGame();
        } else {
          this.state.startNewGame();
        }
        this.modalOverlayContainer.setVisible(false);
        this.renderStageBoard();
      }
      return;
    }

    // 2. Stage Clear Confirmation (Edge-triggered: cannot bleed into game)
    if (this.state.status === 'STAGE_CLEAR_FANFARE') {
      const isAdvance = this.isActionJustPressed(ArcadeAction.BUTTON_A);

      if (isAdvance) {
        this.modalOverlayContainer.setVisible(false);
        const hasNextStage = this.state.advanceNextStage();
        if (!hasNextStage) {
          this.showVictory();
        } else {
          this.renderStageBoard();
        }
      }
      return;
    }

    // 3. Game Over / All Clear Confirmation (Edge-triggered)
    if (this.state.status === 'GAME_OVER' || this.state.status === 'ALL_CLEAR') {
      const isRestart = this.isActionJustPressed(ArcadeAction.BUTTON_A);

      if (isRestart) {
        this.state.startNewGame();
        this.modalOverlayContainer.setVisible(false);
        this.renderStageBoard();
      }
      return;
    }

    // 4. Active Gameplay Inputs
    if (this.state.status === 'PLAYING' || this.state.status === 'DEADLOCK_CRITICAL_PENDING') {
      // 4A. Hold-to-Give-Up [X] / BUTTON_B (Guards against double-death on continuous hold)
      const rawGivingUp = InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_B);

      if (!rawGivingUp) {
        this.giveUpLockedUntilRelease = false;
      }

      const isGivingUp = rawGivingUp && !this.giveUpLockedUntilRelease;
      this.state.setHoldGiveUp(isGivingUp);
      this.updateGiveUpModal();

      // 4B. Undo [Z] / BUTTON_A (Edge-triggered: 1 tap = exactly 1 undo move)
      if (this.isActionJustPressed(ArcadeAction.BUTTON_A)) {
        const undoRes = this.state.stepUndo();
        if (undoRes.isUndo) {
          SokobanAudioService.playUndo();
          this.syncBoardSprites();
        }
      }

      // 4C. Directional Movement with Delayed Auto Shift (DAS)
      // Tap (<260ms): Takes 1 precision step immediately. Zero accidental double-steps.
      // Hold (>260ms): Waits DAS_DELAY_MS, then smoothly repeats at ARR_SPEED_MS (140ms).
      const vec = InputService.getActionVector(PlayerIndex.P1);
      let dir = Direction.NONE;

      if (vec.y < -0.4) dir = Direction.UP;
      else if (vec.y > 0.4) dir = Direction.DOWN;
      else if (vec.x < -0.4) dir = Direction.LEFT;
      else if (vec.x > 0.4) dir = Direction.RIGHT;

      if (dir !== Direction.NONE) {
        let shouldStep = false;

        if (dir !== this.activeMoveDir) {
          // New direction or initial press: step immediately!
          this.activeMoveDir = dir;
          this.moveHoldTimer = 0;
          shouldStep = true;
        } else {
          // Holding the same direction: wait for initial DAS delay, then repeat
          this.moveHoldTimer += delta;
          if (this.moveHoldTimer >= this.DAS_DELAY_MS + this.ARR_SPEED_MS) {
            shouldStep = true;
            this.moveHoldTimer = this.DAS_DELAY_MS;
          }
        }

        if (shouldStep) {
          this.currentWorkerFacing = {
            [Direction.UP]: 'up',
            [Direction.DOWN]: 'down',
            [Direction.LEFT]: 'left',
            [Direction.RIGHT]: 'right',
            [Direction.NONE]: this.currentWorkerFacing,
          }[dir] as any;

          const moveEvent = this.state.stepMove(dir);

          if (moveEvent.actionResult?.success) {
            if (moveEvent.actionResult.isPush) {
              if (moveEvent.actionResult.boxPlacedOnGoal) {
                SokobanAudioService.playBoxTarget();
              } else {
                SokobanAudioService.playPush();
              }
            } else {
              SokobanAudioService.playStep();
            }

            this.syncBoardSprites();

            if (moveEvent.stageCleared) {
              SokobanAudioService.playStageClear();
              this.showStageClear(moveEvent.scoreBreakdown!);
            } else if (moveEvent.deadlockReport.status === 'DEADLOCK_WARNING') {
              SokobanAudioService.playDeadlockWarn();
            } else if (moveEvent.deadlockReport.status === 'DEADLOCK_CRITICAL') {
              SokobanAudioService.playDeadlockWarn();
            }
          }
        }
      } else {
        // No direction active: reset DAS state
        this.activeMoveDir = Direction.NONE;
        this.moveHoldTimer = 0;
      }
    }
  }

  private syncBoardSprites(): void {
    const maze = this.state.maze;
    if (!maze) return;

    // Update Worker Position & Texture
    const wPos = maze.getWorkerPos();
    const wx = this.boardStartX + wPos.col * this.tileSize + this.tileSize / 2;
    const wy = this.boardStartY + wPos.row * this.tileSize + this.tileSize / 2;
    this.workerSprite.setPosition(wx, wy);
    this.workerSprite.setTexture(`sokoban:worker_${this.currentWorkerFacing}`);

    // Rebuild Box Sprites
    this.boxSprites.forEach((sp) => sp.destroy());
    this.boxSprites.clear();

    for (const boxPos of maze.getBoxPositions()) {
      const bx = this.boardStartX + boxPos.col * this.tileSize + this.tileSize / 2;
      const by = this.boardStartY + boxPos.row * this.tileSize + this.tileSize / 2;
      const isGoal = maze.isGoal(boxPos.col, boxPos.row);
      const texture = isGoal ? 'sokoban:crate_gold' : 'sokoban:crate';

      const boxSprite = this.add.sprite(bx, by, texture);
      boxSprite.setDisplaySize(this.tileSize, this.tileSize);
      this.boardLayer.add(boxSprite);
      this.boxSprites.set(posKey(boxPos.col, boxPos.row), boxSprite);
    }
  }

  private updateHUD(): void {
    if (!this.state || !this.state.currentStageConfig) return;

    const cfg = this.state.currentStageConfig;
    const worldSpec = this.state.currentStageConfig;

    // 1. Left HUD
    this.worldBadgeText.setText(`[ W${worldSpec.worldId} ${worldSpec.worldName.toUpperCase()} ]`);
    this.stageTitleText.setText(`STAGE ${cfg.stage.toString().padStart(2, '0')} / 50`);

    // Timer display
    const remainingTime = Math.max(0, cfg.tSoft - Math.floor(this.state.elapsedSeconds));
    const mins = Math.floor(remainingTime / 60).toString().padStart(2, '0');
    const secs = (remainingTime % 60).toString().padStart(2, '0');
    this.timerText.setText(`${mins}:${secs}`);

    // Timer bar & colors (Unified color: CSS string for Text, Hex integer for Graphics)
    const progress = Math.max(0, Math.min(remainingTime / cfg.tSoft, 1));
    const colorHex = progress < 0.2 ? 'ef4444' : progress < 0.5 ? 'facc15' : '10b981';

    this.timerText.setColor(`#${colorHex}`);

    this.timerBarGfx.clear();
    this.timerBarGfx.fillStyle(0x1e293b, 0.8);
    this.timerBarGfx.fillRoundedRect(20, 185, 160, 8, 3);
    this.timerBarGfx.fillStyle(parseInt(colorHex, 16), 1);
    this.timerBarGfx.fillRoundedRect(20, 185, 160 * progress, 8, 3);

    // Undo Lamps
    const uMax = cfg.uQuota;
    const uRem = this.state.undoStack.getRemainingQuota();
    this.undoCountText.setText(`${uRem} / ${uMax}`);

    this.undoLampsGfx.clear();
    const dotsPerRow = 6;
    const dotSpacing = 22;
    const dotStartX = 100 - ((Math.min(uMax, dotsPerRow) - 1) * dotSpacing) / 2;
    const dotStartY = 315;

    for (let i = 0; i < uMax; i++) {
      const row = Math.floor(i / dotsPerRow);
      const col = i % dotsPerRow;
      const dx = dotStartX + col * dotSpacing;
      const dy = dotStartY + row * dotSpacing;

      if (i < uRem) {
        this.undoLampsGfx.fillStyle(0x38bdf8, 1);
        this.undoLampsGfx.fillCircle(dx, dy, 5);
        this.undoLampsGfx.lineStyle(1, 0xbae6fd, 1);
        this.undoLampsGfx.strokeCircle(dx, dy, 5);
      } else {
        this.undoLampsGfx.fillStyle(0x1e293b, 0.8);
        this.undoLampsGfx.fillCircle(dx, dy, 4);
      }
    }

    // 2. Right HUD
    const scoreVal = this.state.scoreKeeper.getRawScore();
    this.scoreText.setText(scoreVal.toLocaleString());

    // Lives icons: spare reserve lives (excluding active worker in the arena)
    this.livesGfx.clear();
    const spareLives = Math.max(0, this.state.lives - 1);
    const lifeIconSpacing = 28;
    if (spareLives > 0) {
      const lifeStartX = 1180 - ((spareLives - 1) * lifeIconSpacing) / 2;
      for (let i = 0; i < spareLives; i++) {
        const lx = lifeStartX + i * lifeIconSpacing;
        const ly = 195;
        // Worker mini avatar icon
        this.livesGfx.fillStyle(0x2563eb, 1);
        this.livesGfx.fillCircle(lx, ly, 8);
        this.livesGfx.fillStyle(0xfacc15, 1);
        this.livesGfx.fillRect(lx - 6, ly - 8, 12, 5);
      }
    }

    // 1UP progress bar
    const extendProgress = this.state.scoreKeeper.getExtendProgress();
    this.extendBarGfx.clear();
    this.extendBarGfx.fillStyle(0x1e293b, 0.8);
    this.extendBarGfx.fillRoundedRect(1100, 285, 160, 8, 3);
    this.extendBarGfx.fillStyle(0xa855f7, 1);
    this.extendBarGfx.fillRoundedRect(1100, 285, 160 * extendProgress, 8, 3);

    // 3. Deadlock Alert Banner
    const dlReport = this.state.getDeadlockReport();
    if (dlReport && dlReport.isDeadlocked) {
      this.deadlockBannerContainer.setVisible(true);
      this.deadlockBannerBg.clear();
      if (dlReport.status === 'DEADLOCK_WARNING') {
        this.deadlockBannerBg.fillStyle(0xd97706, 0.95);
        this.deadlockBannerBg.fillRoundedRect(-200, -18, 400, 36, 8);
        this.deadlockBannerBg.lineStyle(2, 0xfef08a, 1);
        this.deadlockBannerBg.strokeRoundedRect(-200, -18, 400, 36, 8);
        this.deadlockBannerText.setText('⚠ DEADLOCK DETECTED! PRESS [Z] TO UNDO');
      } else {
        this.deadlockBannerBg.fillStyle(0xdc2626, 0.95);
        this.deadlockBannerBg.fillRoundedRect(-200, -18, 400, 36, 8);
        this.deadlockBannerBg.lineStyle(2, 0xfecaca, 1);
        this.deadlockBannerBg.strokeRoundedRect(-200, -18, 400, 36, 8);
        this.deadlockBannerText.setText('🚨 CRITICAL DEADLOCK! NO UNDO AVAILABLE');
      }
    } else {
      this.deadlockBannerContainer.setVisible(false);
    }
  }

  private updateGiveUpModal(): void {
    if (this.state.isGivingUp) {
      this.giveUpModalContainer.setVisible(true);
      const ratio = Math.min(this.state.giveUpHoldMs / 1000, 1);
      this.giveUpBarGfx.clear();
      this.giveUpBarGfx.fillStyle(0x1e293b, 0.8);
      this.giveUpBarGfx.fillRoundedRect(-120, 2, 240, 10, 4);

      // Color from yellow to red
      const fillColor = ratio > 0.7 ? 0xef4444 : 0xfacc15;
      this.giveUpBarGfx.fillStyle(fillColor, 1);
      this.giveUpBarGfx.fillRoundedRect(-120, 2, 240 * ratio, 10, 4);
    } else {
      this.giveUpModalContainer.setVisible(false);
    }
  }

  private showStageClear(breakdown: any): void {
    this.modalOverlayContainer.setVisible(true);
    this.modalBg.clear();
    // Backdrop dimmer to ensure high contrast over board
    this.modalBg.fillStyle(0x000000, 0.65);
    this.modalBg.fillRect(-640, -360, 1280, 720);

    this.modalBg.fillStyle(0x0a0f1d, 0.95);
    this.modalBg.fillRoundedRect(-250, -160, 500, 320, 12);
    this.modalBg.lineStyle(2, 0x10b981, 0.85);
    this.modalBg.strokeRoundedRect(-250, -160, 500, 320, 12);

    this.modalTitleText.setText(breakdown.isPerfect ? 'PERFECT STAGE CLEAR!' : 'STAGE CLEAR!');
    this.modalTitleText.setColor(breakdown.isPerfect ? '#facc15' : '#10b981');

    this.modalBodyText.setText(
      `BASE SCORE:     +${breakdown.pBase}\n` +
      `TIME BONUS:     +${breakdown.pTime}\n` +
      `SAVED UNDO:     +${breakdown.pUndo}\n` +
      `PERFECT BONUS:  +${breakdown.pPerf}\n` +
      `-------------------------\n` +
      `STAGE TOTAL:    +${breakdown.stageTotal} PTS`,
    );

    this.modalPromptText.setText('PRESS [SPACE / BUTTON A] FOR NEXT STAGE');
  }

  private showGameOver(): void {
    this.modalOverlayContainer.setVisible(true);
    this.modalBg.clear();
    // Backdrop dimmer to ensure high contrast over board
    this.modalBg.fillStyle(0x000000, 0.65);
    this.modalBg.fillRect(-640, -360, 1280, 720);

    this.modalBg.fillStyle(0x0a0f1d, 0.95);
    this.modalBg.fillRoundedRect(-250, -150, 500, 300, 12);
    this.modalBg.lineStyle(2, 0xef4444, 0.85);
    this.modalBg.strokeRoundedRect(-250, -150, 500, 300, 12);

    this.modalTitleText.setText('GAME OVER');
    this.modalTitleText.setColor('#ef4444');

    const finalStegoScore = this.state.scoreKeeper.getSteganographicScore();
    const lastCleared = this.state.scoreKeeper.getLastClearedStage();

    this.modalBodyText.setText(
      `LAST STAGE CLEARED: STAGE ${lastCleared.toString().padStart(2, '0')}\n` +
      `FINAL RECORD SCORE: ${finalStegoScore.toLocaleString()} PTS\n` +
      `(Includes two-digit stage steganography)`,
    );

    this.modalPromptText.setText('PRESS [SPACE / BUTTON A] TO PLAY AGAIN');

    // Emit GameOver via ArcadeBridge to React shell
    ArcadeBridge.emit('GAME_OVER', {
      gameId: 'sokoban',
      score: finalStegoScore,
      playTimeSeconds: Math.floor(this.state.elapsedSeconds),
      creditsUsed: 1,
    });
  }

  private showVictory(): void {
    this.modalOverlayContainer.setVisible(true);
    this.modalBg.clear();
    // Backdrop dimmer to ensure high contrast over board
    this.modalBg.fillStyle(0x000000, 0.65);
    this.modalBg.fillRect(-640, -360, 1280, 720);

    this.modalBg.fillStyle(0x0a0f1d, 0.95);
    this.modalBg.fillRoundedRect(-250, -150, 500, 300, 12);
    this.modalBg.lineStyle(2, 0xfacc15, 0.9);
    this.modalBg.strokeRoundedRect(-250, -150, 500, 300, 12);

    this.modalTitleText.setText('CONGRATULATIONS!');
    this.modalTitleText.setColor('#facc15');

    const finalStegoScore = this.state.scoreKeeper.getSteganographicScore();

    this.modalBodyText.setText(
      'ALL 50 CURATED STAGES COMPLETED!\n' +
      'YOU ARE THE ULTIMATE SOKOBAN GRANDMASTER!\n' +
      `FINAL SCORE: ${finalStegoScore.toLocaleString()} PTS`,
    );

    this.modalPromptText.setText('PRESS [SPACE / BUTTON A] TO RETURN TO TITLE');

    ArcadeBridge.emit('GAME_OVER', {
      gameId: 'sokoban',
      score: finalStegoScore,
      playTimeSeconds: Math.floor(this.state.elapsedSeconds),
      creditsUsed: 1,
    });
  }

  private handleShutdown(): void {
    SokobanAudioService.stopBGM();
    this.tweens.killAll();
    this.time.removeAllEvents();
    if (this.ambientBackdrop && typeof this.ambientBackdrop.destroy === 'function') {
      this.ambientBackdrop.destroy();
    }
    if (this.vignetteGfx && typeof this.vignetteGfx.destroy === 'function') {
      this.vignetteGfx.destroy();
    }
  }
}
