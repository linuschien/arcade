/**
 * MainGameScene.ts
 * Core 60fps Phaser 4 Canvas Scene for Pipe Mania.
 * Features Continuous Fill Mask animations, 5-Slot FIFO queue sidebar,
 * multi-device unified input reticle, WebAudio integration, and clean memory teardown.
 */

import Phaser from 'phaser';
import { InputService, PlayerIndex, ArcadeAction } from '@/core/input/InputService';
import { ArcadeBridge } from '@/core/bridge/ArcadeBridge';
import {
  GRID_COLS,
  GRID_ROWS,
  Direction,
  PipeType,
  GridCell,
} from '../logic/PipeTypes';
import { PipeManiaGameState, PlayState, GameStepEvent } from '../logic/PipeManiaGameState';
import { PipeManiaAudioService } from '../audio/PipeManiaAudioService';

const TILE_SIZE = 56;
const BOARD_X = 135;
const BOARD_Y = 70;
const SIDEBAR_X = 15;
const SIDEBAR_Y = 70;

export class MainGameScene extends Phaser.Scene {
  private gameState!: PipeManiaGameState;
  private isPausedState: boolean = false;

  // Render Objects
  private boardFrameGfx!: Phaser.GameObjects.Graphics;
  private tileSprites: Phaser.GameObjects.Sprite[][] = [];
  private presetBoltSprites: Phaser.GameObjects.Sprite[][] = [];
  private liquidGraphics!: Phaser.GameObjects.Graphics;
  private reticleSprite!: Phaser.GameObjects.Sprite;
  private queueSprites: Phaser.GameObjects.Sprite[] = [];
  private queueHighlight!: Phaser.GameObjects.Graphics;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private targetText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private countdownBar!: Phaser.GameObjects.Graphics;
  private wrenchSprites: Phaser.GameObjects.Sprite[] = [];
  private ffButtonBg!: Phaser.GameObjects.Rectangle;
  private ffButtonText!: Phaser.GameObjects.Text;

  // Input state
  private cursorCol: number = 2;
  private cursorRow: number = 3;
  private inputDebounceMs: number = 0;
  private actionDebounceMs: number = 0;

  // Transitions
  private transitionTimerMs: number = 0;

  constructor() {
    super({ key: 'pipemania:MainGameScene' });
  }

  public create(): void {
    this.gameState = new PipeManiaGameState(1);

    this.createBoardFrame();
    this.createHUD();
    this.createSidebarQueue();
    this.createBoardGrid();
    this.createReticle();
    this.setupPointerInput();

    // Start BGM
    PipeManiaAudioService.playBGM();

    // Mandatory Teardown
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  public setPauseState(paused: boolean): void {
    this.isPausedState = paused;
    if (paused) {
      PipeManiaAudioService.stopBGM();
    } else {
      PipeManiaAudioService.playBGM();
    }
  }

  private createBoardFrame(): void {
    this.boardFrameGfx = this.add.graphics();
    
    // Glowing Cyberpunk Outer Border around 10x7 Grid
    const bw = GRID_COLS * TILE_SIZE; // 560
    const bh = GRID_ROWS * TILE_SIZE; // 392

    // Outer cyan shadow
    this.boardFrameGfx.lineStyle(4, 0x0284c7, 0.4);
    this.boardFrameGfx.strokeRoundedRect(BOARD_X - 4, BOARD_Y - 4, bw + 8, bh + 8, 8);

    // Inner bright neon cyan border
    this.boardFrameGfx.lineStyle(2, 0x38bdf8, 1);
    this.boardFrameGfx.strokeRoundedRect(BOARD_X - 2, BOARD_Y - 2, bw + 4, bh + 4, 6);

    // Corner decorative brackets
    this.boardFrameGfx.fillStyle(0x38bdf8, 1);
    this.boardFrameGfx.fillRect(BOARD_X - 6, BOARD_Y - 6, 12, 3);
    this.boardFrameGfx.fillRect(BOARD_X - 6, BOARD_Y - 6, 3, 12);
    this.boardFrameGfx.fillRect(BOARD_X + bw - 6, BOARD_Y - 6, 12, 3);
    this.boardFrameGfx.fillRect(BOARD_X + bw + 3, BOARD_Y - 6, 3, 12);
    this.boardFrameGfx.fillRect(BOARD_X - 6, BOARD_Y + bh + 3, 12, 3);
    this.boardFrameGfx.fillRect(BOARD_X - 6, BOARD_Y + bh - 6, 3, 12);
    this.boardFrameGfx.fillRect(BOARD_X + bw - 6, BOARD_Y + bh + 3, 12, 3);
    this.boardFrameGfx.fillRect(BOARD_X + bw + 3, BOARD_Y + bh - 6, 3, 12);
  }

  private createHUD(): void {
    // Top HUD Bar Background
    const hudBg = this.add.rectangle(360, 32, 720, 64, 0x070b14);
    hudBg.setStrokeStyle(1, 0x1e293b);

    // Score Text with glowing green
    this.scoreText = this.add.text(20, 16, 'SCORE: 0', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f8fafc',
      fontStyle: 'bold',
    });

    // Target Pipes vs Current Flooded Text
    this.targetText = this.add.text(220, 16, 'PIPES: 0 / 10', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#38bdf8',
      fontStyle: 'bold',
    });

    // Level Text
    this.levelText = this.add.text(420, 16, 'LEVEL 1', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#f59e0b',
      fontStyle: 'bold',
    });

    // Wrenches (Lives)
    for (let i = 0; i < 5; i++) {
      const wrench = this.add.sprite(580 + i * 26, 26, 'pipemania:wrench');
      wrench.setScale(1.1);
      this.wrenchSprites.push(wrench);
    }

    // Countdown Bar
    this.countdownBar = this.add.graphics();

    // Bottom Status Banner
    this.statusText = this.add.text(360, 495, 'CONNECT PIPES BEFORE FLOOZ FLOWS!', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#22c55e',
      fontStyle: 'bold',
    });
    this.statusText.setOrigin(0.5);
  }

  private createSidebarQueue(): void {
    const sidebarBg = this.add.rectangle(SIDEBAR_X + 50, SIDEBAR_Y + 180, 106, 380, 0x070b14);
    sidebarBg.setStrokeStyle(1, 0x1e293b);

    this.add.text(SIDEBAR_X + 50, SIDEBAR_Y - 5, 'NEXT', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#94a3b8',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Active Pipe Highlight Frame
    this.queueHighlight = this.add.graphics();
    this.queueHighlight.lineStyle(2, 0x22c55e, 1);
    this.queueHighlight.strokeRoundedRect(SIDEBAR_X + 15, SIDEBAR_Y + 10, 70, 70, 6);

    this.add.text(SIDEBAR_X + 50, SIDEBAR_Y + 84, 'ACTIVE', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#22c55e',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 5 Queue Slots
    for (let i = 0; i < 5; i++) {
      const y = SIDEBAR_Y + 45 + i * 58 + (i > 0 ? 15 : 0);
      const sprite = this.add.sprite(SIDEBAR_X + 50, y, 'pipemania:pipe_horizontal');
      sprite.setDisplaySize(48, 48);
      this.queueSprites.push(sprite);
    }

    // Fast Forward Button
    this.ffButtonBg = this.add.rectangle(SIDEBAR_X + 50, SIDEBAR_Y + 345, 96, 32, 0x1e293b);
    this.ffButtonBg.setStrokeStyle(1, 0x38bdf8);
    this.ffButtonBg.setInteractive({ useHandCursor: true });

    this.ffButtonText = this.add.text(SIDEBAR_X + 50, SIDEBAR_Y + 345, '>> FAST [F]', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#38bdf8',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.ffButtonBg.on('pointerdown', () => {
      this.gameState.setFastForward(true);
      PipeManiaAudioService.playFastForward();
    });
    this.ffButtonBg.on('pointerup', () => {
      this.gameState.setFastForward(false);
    });
    this.ffButtonBg.on('pointerout', () => {
      this.gameState.setFastForward(false);
    });
  }

  private createBoardGrid(): void {
    this.tileSprites = [];
    this.presetBoltSprites = [];

    for (let r = 0; r < GRID_ROWS; r++) {
      const rowSprites: Phaser.GameObjects.Sprite[] = [];
      const rowBolts: Phaser.GameObjects.Sprite[] = [];

      for (let c = 0; c < GRID_COLS; c++) {
        const x = BOARD_X + c * TILE_SIZE + TILE_SIZE / 2;
        const y = BOARD_Y + r * TILE_SIZE + TILE_SIZE / 2;

        // Base tile sprite
        const sprite = this.add.sprite(x, y, 'pipemania:grid_tile');
        sprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
        sprite.setInteractive({ useHandCursor: true });

        sprite.on('pointerdown', () => {
          this.cursorCol = c;
          this.cursorRow = r;
          this.tryPlacePipeAtCursor();
        });

        rowSprites.push(sprite);

        // Gold bolt indicator for preset pipes
        const bolt = this.add.sprite(x - TILE_SIZE / 2 + 6, y - TILE_SIZE / 2 + 6, 'pipemania:preset_bolt');
        bolt.setVisible(false);
        rowBolts.push(bolt);
      }
      this.tileSprites.push(rowSprites);
      this.presetBoltSprites.push(rowBolts);
    }

    // Liquid overlay Graphics
    this.liquidGraphics = this.add.graphics();
  }

  private createReticle(): void {
    this.reticleSprite = this.add.sprite(
      BOARD_X + this.cursorCol * TILE_SIZE + TILE_SIZE / 2,
      BOARD_Y + this.cursorRow * TILE_SIZE + TILE_SIZE / 2,
      'pipemania:reticle'
    );
    this.reticleSprite.setDisplaySize(TILE_SIZE, TILE_SIZE);
    this.reticleSprite.setDepth(10);
  }

  private setupPointerInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      const col = Math.floor((pointer.x - BOARD_X) / TILE_SIZE);
      const row = Math.floor((pointer.y - BOARD_Y) / TILE_SIZE);
      if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
        this.cursorCol = col;
        this.cursorRow = row;
      }
    });
  }

  public update(time: number, delta: number): void {
    if (this.isPausedState) return;

    // Handle Transitions
    if (this.transitionTimerMs > 0) {
      this.transitionTimerMs -= delta;
      if (this.transitionTimerMs <= 0) {
        this.transitionTimerMs = 0;
        if (this.gameState.getPlayState() === PlayState.LEVEL_CLEAR) {
          this.gameState.advanceToNextLevel();
        } else if (this.gameState.getPlayState() === PlayState.LEVEL_FAILED) {
          this.gameState.retryCurrentLevel();
        }
      }
      return;
    }

    // Update Input
    this.handleKeyboardAndGamepadInput(delta);

    // Update Pure Game State
    const events = this.gameState.update(delta);
    this.processGameEvents(events);

    // Render Scene Updates
    this.renderBoard();
    this.renderSidebarQueue();
    this.renderHUD();
    this.renderLiquidFlow();
  }

  private handleKeyboardAndGamepadInput(delta: number): void {
    this.inputDebounceMs -= delta;
    this.actionDebounceMs -= delta;

    // 1. D-Pad / Reticle Navigation (120ms debounce)
    if (this.inputDebounceMs <= 0) {
      let moved = false;
      if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.LEFT)) {
        this.cursorCol = Math.max(0, this.cursorCol - 1);
        moved = true;
      } else if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.RIGHT)) {
        this.cursorCol = Math.min(GRID_COLS - 1, this.cursorCol + 1);
        moved = true;
      }

      if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.UP)) {
        this.cursorRow = Math.max(0, this.cursorRow - 1);
        moved = true;
      } else if (InputService.isActionDown(PlayerIndex.P1, ArcadeAction.DOWN)) {
        this.cursorRow = Math.min(GRID_ROWS - 1, this.cursorRow + 1);
        moved = true;
      }

      if (moved) {
        this.inputDebounceMs = 120;
      }
    }

    // Update Reticle Position
    this.reticleSprite.setPosition(
      BOARD_X + this.cursorCol * TILE_SIZE + TILE_SIZE / 2,
      BOARD_Y + this.cursorRow * TILE_SIZE + TILE_SIZE / 2
    );

    // 2. Action 1: Place Pipe (BUTTON_A)
    if (this.actionDebounceMs <= 0 && InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_A)) {
      this.tryPlacePipeAtCursor();
      this.actionDebounceMs = 180;
    }

    // 3. Action 2: Fast Forward (BUTTON_B / BUTTON_C)
    const isFF = InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_B) ||
                 InputService.isActionDown(PlayerIndex.P1, ArcadeAction.BUTTON_C);
    this.gameState.setFastForward(isFF);
  }

  private tryPlacePipeAtCursor(): void {
    const result = this.gameState.placeActivePipe(this.cursorCol, this.cursorRow);
    if (result.success) {
      if (result.isReplacement) {
        PipeManiaAudioService.playPipeReplace();
      } else {
        PipeManiaAudioService.playPipePlace();
      }
    }
  }

  private processGameEvents(events: GameStepEvent[]): void {
    for (const ev of events) {
      switch (ev.type) {
        case 'COUNTDOWN_TICK':
          PipeManiaAudioService.playCountdownTick();
          break;
        case 'FLOW_START':
        case 'CELL_FILL_START':
          PipeManiaAudioService.playFlowBubble();
          break;
        case 'RESERVOIR_FILL_START':
          PipeManiaAudioService.playReservoirFill();
          break;
        case 'LEVEL_CLEAR':
          PipeManiaAudioService.playLevelClear();
          PipeManiaAudioService.playVictory();
          this.transitionTimerMs = 2500; // 2.5s victory delay
          break;
        case 'SPILL':
        case 'UNDERFLOW':
          PipeManiaAudioService.playSpillBurst();
          if (this.gameState.getWrenches() > 0) {
            this.transitionTimerMs = 1800; // 1.8s retry delay
          }
          break;
        case 'EXTEND_LIFE':
          PipeManiaAudioService.playExtendLife();
          break;
        case 'GAME_OVER':
          PipeManiaAudioService.stopBGM();
          PipeManiaAudioService.playGameOver();
          ArcadeBridge.emit('GAME_OVER', {
            gameId: 'pipemania',
            score: this.gameState.getScore(),
            playTimeSeconds: 60,
            creditsUsed: 1,
            extraData: { level: this.gameState.getLevel() },
          });
          break;
      }
    }
  }

  private renderBoard(): void {
    const grid = this.gameState.getGrid();
    const cells = grid.getCells();

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = cells[r][c];
        const sprite = this.tileSprites[r][c];
        const bolt = this.presetBoltSprites[r][c];

        const textureKey = this.getTextureForCell(cell);
        if (sprite.texture.key !== textureKey) {
          sprite.setTexture(textureKey);
        }

        // Show preset gold bolt if applicable
        bolt.setVisible(cell.isPreset);
      }
    }
  }

  private getTextureForCell(cell: GridCell): string {
    switch (cell.type) {
      case PipeType.EMPTY:
        return 'pipemania:grid_tile';
      case PipeType.OBSTACLE:
        return 'pipemania:obstacle_rock';
      case PipeType.START: {
        const dir = (cell.startOutflowDir || Direction.RIGHT).toLowerCase();
        return `pipemania:start_valve_${dir}`;
      }
      case PipeType.END: {
        const dir = (cell.endInflowDir || Direction.LEFT).toLowerCase();
        return `pipemania:end_drain_${dir}`;
      }
      case PipeType.HORIZONTAL:
        return 'pipemania:pipe_horizontal';
      case PipeType.VERTICAL:
        return 'pipemania:pipe_vertical';
      case PipeType.CORNER_TOP_RIGHT:
        return 'pipemania:pipe_corner_tr';
      case PipeType.CORNER_TOP_LEFT:
        return 'pipemania:pipe_corner_tl';
      case PipeType.CORNER_BOTTOM_RIGHT:
        return 'pipemania:pipe_corner_br';
      case PipeType.CORNER_BOTTOM_LEFT:
        return 'pipemania:pipe_corner_bl';
      case PipeType.CROSS:
        return 'pipemania:pipe_cross';
      case PipeType.ONE_WAY_RIGHT:
        return 'pipemania:pipe_oneway_right';
      case PipeType.ONE_WAY_LEFT:
        return 'pipemania:pipe_oneway_left';
      case PipeType.ONE_WAY_DOWN:
        return 'pipemania:pipe_oneway_down';
      case PipeType.ONE_WAY_UP:
        return 'pipemania:pipe_oneway_up';
      case PipeType.RESERVOIR_HORIZONTAL:
        return 'pipemania:pipe_reservoir_h';
      case PipeType.RESERVOIR_VERTICAL:
        return 'pipemania:pipe_reservoir_v';
      default:
        return 'pipemania:grid_tile';
    }
  }

  private renderSidebarQueue(): void {
    const queue = this.gameState.getQueue();
    for (let i = 0; i < 5; i++) {
      const pipeType = queue[i] || PipeType.HORIZONTAL;
      const key = this.getTextureForCell({ type: pipeType } as GridCell);
      if (this.queueSprites[i].texture.key !== key) {
        this.queueSprites[i].setTexture(key);
      }
    }

    // Fast Forward button glow
    if (this.gameState.isFastForwarding()) {
      this.ffButtonBg.setFillStyle(0x0284c7, 1);
      this.ffButtonText.setColor('#ffffff');
    } else {
      this.ffButtonBg.setFillStyle(0x1e293b, 1);
      this.ffButtonText.setColor('#38bdf8');
    }
  }

  private renderHUD(): void {
    this.scoreText.setText(`SCORE: ${this.gameState.getScore()}`);
    this.targetText.setText(`PIPES: ${this.gameState.getFloodedCount()} / ${this.gameState.getLevelConfig().targetLength}`);
    this.levelText.setText(`LEVEL ${this.gameState.getLevel()}`);

    // Update Wrenches
    const wrenches = this.gameState.getWrenches();
    for (let i = 0; i < 5; i++) {
      this.wrenchSprites[i].setVisible(i < wrenches);
    }

    // Countdown Bar
    this.countdownBar.clear();
    const config = this.gameState.getLevelConfig();
    const remaining = this.gameState.getCountdownRemainingSec();
    const totalDelay = config.delaySeconds;

    if (this.gameState.getPlayState() === PlayState.READY_COUNTDOWN) {
      const pct = Math.max(0, Math.min(1.0, remaining / totalDelay));
      this.countdownBar.fillStyle(0x1e293b, 1);
      this.countdownBar.fillRect(BOARD_X, 58, GRID_COLS * TILE_SIZE, 6);
      this.countdownBar.fillStyle(0x22c55e, 1);
      this.countdownBar.fillRect(BOARD_X, 58, GRID_COLS * TILE_SIZE * pct, 6);
    }

    // Status Banner Text
    const state = this.gameState.getPlayState();
    if (state === PlayState.READY_COUNTDOWN) {
      this.statusText.setText(`READY: FLOOZ IN ${Math.ceil(remaining)}s`);
      this.statusText.setColor('#22c55e');
    } else if (state === PlayState.FLOWING) {
      if (this.gameState.isFastForwarding()) {
        this.statusText.setText('>> FAST FORWARDING! (2x BONUS)');
        this.statusText.setColor('#38bdf8');
      } else {
        this.statusText.setText('FLOOZ FLOWING...');
        this.statusText.setColor('#a855f7');
      }
    } else if (state === PlayState.LEVEL_CLEAR) {
      this.statusText.setText('★ LEVEL COMPLETE! ★');
      this.statusText.setColor('#facc15');
    } else if (state === PlayState.LEVEL_FAILED) {
      this.statusText.setText(
        this.gameState.getFailureReason() === 'UNDERFLOW'
          ? '✖ UNDERFLOW! NOT ENOUGH PIPES'
          : '✖ SPILL! BURST PIPE'
      );
      this.statusText.setColor('#ef4444');
    } else if (state === PlayState.GAME_OVER) {
      this.statusText.setText('GAME OVER - INSERT COIN');
      this.statusText.setColor('#ef4444');
    }
  }

  /**
   * Continuous Fill Mask Animation for liquid flowing through pipes.
   */
  private renderLiquidFlow(): void {
    this.liquidGraphics.clear();
    const cells = this.gameState.getGrid().getCells();

    const FLUID_COLOR = 0x22c55e; // Neon green
    const FLUID_CORE = 0x86efac; // Glowing core highlight
    const PIPE_INSET = (TILE_SIZE - 22) / 2; // 17

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = cells[r][c];
        if (!cell.isFlooded && !cell.isFlooding) continue;

        const bx = BOARD_X + c * TILE_SIZE;
        const by = BOARD_Y + r * TILE_SIZE;
        const progress = cell.fillProgress;

        this.drawCellFluid(bx, by, cell, progress, FLUID_COLOR, FLUID_CORE, PIPE_INSET);
      }
    }
  }

  private drawCellFluid(
    bx: number,
    by: number,
    cell: GridCell,
    progress: number,
    color: number,
    coreColor: number,
    inset: number
  ): void {
    const gfx = this.liquidGraphics;
    const pipeWidth = 22;

    if (cell.type === PipeType.START) {
      gfx.fillStyle(color, 0.9);
      gfx.fillCircle(bx + TILE_SIZE / 2, by + TILE_SIZE / 2, 14);
      return;
    }

    if (cell.type === PipeType.HORIZONTAL || cell.type === PipeType.ONE_WAY_RIGHT || cell.type === PipeType.ONE_WAY_LEFT) {
      const movingRight = cell.entryDir === Direction.RIGHT || cell.type === PipeType.ONE_WAY_RIGHT;
      const fillW = TILE_SIZE * progress;
      const startX = movingRight ? bx : bx + TILE_SIZE - fillW;

      gfx.fillStyle(color, 0.9);
      gfx.fillRect(startX, by + inset + 2, fillW, pipeWidth - 4);
      gfx.fillStyle(coreColor, 1);
      gfx.fillRect(startX, by + inset + 8, fillW, pipeWidth - 16);
    } else if (cell.type === PipeType.VERTICAL || cell.type === PipeType.ONE_WAY_DOWN || cell.type === PipeType.ONE_WAY_UP) {
      const movingDown = cell.entryDir === Direction.DOWN || cell.type === PipeType.ONE_WAY_DOWN;
      const fillH = TILE_SIZE * progress;
      const startY = movingDown ? by : by + TILE_SIZE - fillH;

      gfx.fillStyle(color, 0.9);
      gfx.fillRect(bx + inset + 2, startY, pipeWidth - 4, fillH);
      gfx.fillStyle(coreColor, 1);
      gfx.fillRect(bx + inset + 8, startY, pipeWidth - 16, fillH);
    } else if (cell.type === PipeType.RESERVOIR_HORIZONTAL) {
      // Horizontal reservoir pipe flow + tank chamber fill
      const movingRight = cell.entryDir === Direction.RIGHT;
      const fillW = TILE_SIZE * progress;
      const startX = movingRight ? bx : bx + TILE_SIZE - fillW;

      // Fill horizontal tube channel
      gfx.fillStyle(color, 0.9);
      gfx.fillRect(startX, by + inset + 2, fillW, pipeWidth - 4);
      gfx.fillStyle(coreColor, 1);
      gfx.fillRect(startX, by + inset + 8, fillW, pipeWidth - 16);

      // Expansion glass tank chamber filling smoothly
      const tankH = 34 * progress;
      gfx.fillStyle(color, 0.85);
      gfx.fillRect(bx + 11, by + 11 + (34 - tankH), 34, tankH);
      gfx.fillStyle(coreColor, 1);
      gfx.fillRect(bx + 14, by + 11 + (34 - tankH), 28, 2);
    } else if (cell.type === PipeType.RESERVOIR_VERTICAL) {
      // Vertical reservoir pipe flow + tank chamber fill
      const movingDown = cell.entryDir === Direction.DOWN;
      const fillH = TILE_SIZE * progress;
      const startY = movingDown ? by : by + TILE_SIZE - fillH;

      // Fill vertical tube channel
      gfx.fillStyle(color, 0.9);
      gfx.fillRect(bx + inset + 2, startY, pipeWidth - 4, fillH);
      gfx.fillStyle(coreColor, 1);
      gfx.fillRect(bx + inset + 8, startY, pipeWidth - 16, fillH);

      // Expansion glass tank chamber filling smoothly
      const tankH = 36 * progress;
      gfx.fillStyle(color, 0.85);
      gfx.fillRect(bx + 12, by + 10 + (36 - tankH), 32, tankH);
      gfx.fillStyle(coreColor, 1);
      gfx.fillRect(bx + 15, by + 10 + (36 - tankH), 26, 2);
    } else if (cell.type === PipeType.CROSS) {
      // Cross pipe dual axes with correct direction-aware fill
      // 1. Horizontal Channel
      if (cell.crossHorizontalFlooded || cell.entryDir === Direction.RIGHT || cell.entryDir === Direction.LEFT) {
        const isFlooded = cell.crossHorizontalFlooded === true && cell.entryDir !== Direction.RIGHT && cell.entryDir !== Direction.LEFT;
        const p = isFlooded ? 1.0 : (cell.crossHorizontalProgress ?? progress);
        const movingRight = isFlooded ? true : (cell.entryDir === Direction.RIGHT);
        const fillW = TILE_SIZE * p;
        const startX = movingRight ? bx : bx + TILE_SIZE - fillW;

        gfx.fillStyle(color, 0.9);
        gfx.fillRect(startX, by + inset + 2, fillW, pipeWidth - 4);
        gfx.fillStyle(coreColor, 1);
        gfx.fillRect(startX, by + inset + 8, fillW, pipeWidth - 16);
      }
      // 2. Vertical Channel
      if (cell.crossVerticalFlooded || cell.entryDir === Direction.DOWN || cell.entryDir === Direction.UP) {
        const isFlooded = cell.crossVerticalFlooded === true && cell.entryDir !== Direction.DOWN && cell.entryDir !== Direction.UP;
        const p = isFlooded ? 1.0 : (cell.crossVerticalProgress ?? progress);
        const movingDown = isFlooded ? true : (cell.entryDir === Direction.DOWN);
        const fillH = TILE_SIZE * p;
        const startY = movingDown ? by : by + TILE_SIZE - fillH;

        gfx.fillStyle(color, 0.9);
        gfx.fillRect(bx + inset + 2, startY, pipeWidth - 4, fillH);
        gfx.fillStyle(coreColor, 1);
        gfx.fillRect(bx + inset + 8, startY, pipeWidth - 16, fillH);
      }
    } else {
      // Smooth Quarter-Torus Corner fluid stream
      this.drawCornerFluidStream(bx, by, cell, progress, color, coreColor, inset);
    }
  }

  /**
   * Continuous curved fluid stream along the smooth quarter-torus arc.
   */
  private drawCornerFluidStream(
    bx: number,
    by: number,
    cell: GridCell,
    progress: number,
    color: number,
    coreColor: number,
    offset: number
  ): void {
    const gfx = this.liquidGraphics;
    let cx = 0;
    let cy = 0;
    let startAngle = 0;
    let endAngle = 0;

    if (cell.type === PipeType.CORNER_TOP_RIGHT) {
      // Connects TOP and RIGHT -> Center is Top-Right corner (bx + TILE_SIZE, by)
      cx = bx + TILE_SIZE;
      cy = by;
      if (cell.entryDir === Direction.DOWN) {
        // Enters from TOP (180 deg) -> exits RIGHT (90 deg)
        startAngle = Math.PI;
        endAngle = Math.PI / 2;
      } else {
        // Enters from RIGHT (90 deg) -> exits TOP (180 deg)
        startAngle = Math.PI / 2;
        endAngle = Math.PI;
      }
    } else if (cell.type === PipeType.CORNER_TOP_LEFT) {
      // Connects TOP and LEFT -> Center is Top-Left corner (bx, by)
      cx = bx;
      cy = by;
      if (cell.entryDir === Direction.DOWN) {
        // Enters from TOP (0 deg) -> exits LEFT (90 deg)
        startAngle = 0;
        endAngle = Math.PI / 2;
      } else {
        // Enters from LEFT (90 deg) -> exits TOP (0 deg)
        startAngle = Math.PI / 2;
        endAngle = 0;
      }
    } else if (cell.type === PipeType.CORNER_BOTTOM_RIGHT) {
      // Connects BOTTOM and RIGHT -> Center is Bottom-Right corner (bx + TILE_SIZE, by + TILE_SIZE)
      cx = bx + TILE_SIZE;
      cy = by + TILE_SIZE;
      if (cell.entryDir === Direction.UP) {
        // Enters from BOTTOM (180 deg) -> exits RIGHT (270 deg)
        startAngle = Math.PI;
        endAngle = Math.PI * 1.5;
      } else {
        // Enters from RIGHT (270 deg) -> exits BOTTOM (180 deg)
        startAngle = Math.PI * 1.5;
        endAngle = Math.PI;
      }
    } else if (cell.type === PipeType.CORNER_BOTTOM_LEFT) {
      // Connects BOTTOM and LEFT -> Center is Bottom-Left corner (bx, by + TILE_SIZE)
      cx = bx;
      cy = by + TILE_SIZE;
      if (cell.entryDir === Direction.UP) {
        // Enters from BOTTOM (360/0 deg) -> exits LEFT (270 deg)
        startAngle = 0;
        endAngle = -Math.PI / 2;
      } else {
        // Enters from LEFT (270/-90 deg) -> exits BOTTOM (360/0 deg)
        startAngle = -Math.PI / 2;
        endAngle = 0;
      }
    }

    const R_mid = TILE_SIZE / 2;
    const currentAngle = startAngle + (endAngle - startAngle) * progress;
    const anticlockwise = endAngle < startAngle;

    // Green fluid stream
    gfx.lineStyle(16, color, 0.95);
    gfx.beginPath();
    gfx.arc(cx, cy, R_mid, startAngle, currentAngle, anticlockwise);
    gfx.strokePath();

    // Bright glowing core
    gfx.lineStyle(6, coreColor, 1);
    gfx.beginPath();
    gfx.arc(cx, cy, R_mid, startAngle, currentAngle, anticlockwise);
    gfx.strokePath();
  }

  private cleanup(): void {
    PipeManiaAudioService.stopBGM();
    this.events.off(Phaser.Scenes.Events.SHUTDOWN);
    this.events.off(Phaser.Scenes.Events.DESTROY);

    if (this.liquidGraphics) {
      this.liquidGraphics.destroy();
    }
    if (this.boardFrameGfx) {
      this.boardFrameGfx.destroy();
    }
  }
}
