/**
 * MainGameScene.ts
 * Phaser 4 Canvas Scene rendering Tetris Playfield, Active Piece, Ghost Piece, Hold Box, NEXT Queue, and Score HUD.
 * Handles unified input via InputService and updates ArcadeBridge events.
 */

import Phaser from 'phaser';
import { GAME_ID } from './PreloadScene';
import { TetrisBoard, MODERN_CONFIG } from '../logic/TetrisBoard';
import { TETROMINOES, TetrominoType } from '../logic/Tetromino';
import { InputService, PlayerIndex, ArcadeAction } from '@/core/input/InputService';
import { ArcadeBridge } from '@/core/bridge/ArcadeBridge';

export class MainGameScene extends Phaser.Scene {
  private board!: TetrisBoard;
  private dropTimerAccumulator: number = 0;
  private lockTimerAccumulator: number = 0;
  private readonly LOCK_DELAY_MS: number = 500; // 500ms Lock Delay

  // Input debouncing / repeat key trackers
  private prevActionState: Map<ArcadeAction, boolean> = new Map();
  private moveLeftTimer: number = 0;
  private moveRightTimer: number = 0;
  private softDropTimer: number = 0;
  private readonly DAS_DELAY: number = 150; // Delayed Auto Shift initial delay ms
  private readonly ARR_SPEED: number = 40; // Auto Repeat Rate ms

  // Visual offsets & dimensions
  private readonly TILE_SIZE: number = 32;
  private readonly BOARD_OFFSET_X: number = 240;
  private readonly BOARD_OFFSET_Y: number = 40;

  // Graphics and text UI elements
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private pieceGraphics!: Phaser.GameObjects.Graphics;
  private scoreText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private linesText!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;
  private gameOverText!: Phaser.GameObjects.Text;

  private startTimeSeconds: number = 0;
  private isPaused: boolean = false;
  private isModernMode: boolean = true;
  private isClearingLines: boolean = false;

  constructor() {
    super({ key: `${GAME_ID}:MainGameScene` });
  }

  create(): void {
    this.board = new TetrisBoard(MODERN_CONFIG);
    this.dropTimerAccumulator = 0;
    this.lockTimerAccumulator = 0;
    this.startTimeSeconds = this.time.now / 1000;
    this.isPaused = false;

    this.gridGraphics = this.add.graphics();
    this.pieceGraphics = this.add.graphics();

    this.createUI();

    // Scene teardown event registration
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.onShutdown, this);
  }

  private createUI(): void {
    // 1. Draw Playfield Background & Border
    this.gridGraphics.fillStyle(0x0f172a, 1);
    this.gridGraphics.fillRect(
      this.BOARD_OFFSET_X,
      this.BOARD_OFFSET_Y,
      TetrisBoard.COLS * this.TILE_SIZE,
      TetrisBoard.ROWS * this.TILE_SIZE
    );

    this.gridGraphics.lineStyle(2, 0x334155, 1);
    this.gridGraphics.strokeRect(
      this.BOARD_OFFSET_X - 2,
      this.BOARD_OFFSET_Y - 2,
      TetrisBoard.COLS * this.TILE_SIZE + 4,
      TetrisBoard.ROWS * this.TILE_SIZE + 4
    );

    // 2. Draw Hold Box (Left Side)
    const holdX = 60;
    const holdY = 40;
    this.gridGraphics.strokeRect(holdX, holdY, 140, 140);
    this.add.text(holdX + 45, holdY + 10, 'HOLD', {
      fontSize: '18px',
      color: '#94a3b8',
      fontStyle: 'bold',
    });

    // 3. Draw NEXT Preview Box (Right Side)
    const nextX = 600;
    const nextY = 40;
    this.gridGraphics.strokeRect(nextX, nextY, 140, 340);
    this.add.text(nextX + 45, nextY + 10, 'NEXT', {
      fontSize: '18px',
      color: '#94a3b8',
      fontStyle: 'bold',
    });

    // Mode Text Indicator (Left Side below Hold)
    this.add.text(60, 200, 'MODE (Press M)', { fontSize: '12px', color: '#64748b' });
    this.modeText = this.add.text(60, 218, 'MODERN', {
      fontSize: '16px',
      color: '#a855f7',
      fontStyle: 'bold',
    });

    // 4. Score, Level, Lines HUD (Right Side below NEXT)
    const hudX = 600;
    const hudY = 400;

    this.add.text(hudX, hudY, 'SCORE', { fontSize: '14px', color: '#64748b' });
    this.scoreText = this.add.text(hudX, hudY + 20, '0', {
      fontSize: '24px',
      color: '#38bdf8',
      fontStyle: 'bold',
    });

    this.add.text(hudX, hudY + 60, 'LEVEL', { fontSize: '14px', color: '#64748b' });
    this.levelText = this.add.text(hudX, hudY + 80, '1', {
      fontSize: '24px',
      color: '#f59e0b',
      fontStyle: 'bold',
    });

    this.add.text(hudX, hudY + 120, 'LINES', { fontSize: '14px', color: '#64748b' });
    this.linesText = this.add.text(hudX, hudY + 140, '0', {
      fontSize: '24px',
      color: '#10b981',
      fontStyle: 'bold',
    });

    // 5. Game Over Banner Text
    this.gameOverText = this.add.text(
      this.BOARD_OFFSET_X + 40,
      this.BOARD_OFFSET_Y + 280,
      'GAME OVER',
      {
        fontSize: '36px',
        color: '#ef4444',
        fontStyle: 'bold',
        backgroundColor: '#000000bb',
        padding: { x: 20, y: 10 },
      }
    );
    this.gameOverText.setVisible(false);
  }

  update(time: number, delta: number): void {
    if (this.isPaused || this.board.isGameOver() || this.isClearingLines) return;

    this.handleInput(delta);
    this.handleGravity(delta);
    this.renderState();
  }

  private handleInput(delta: number): void {
    // Helper to query single action press edge (just down)
    const isJustPressed = (action: ArcadeAction): boolean => {
      const current = InputService.isActionDown(PlayerIndex.P1, action);
      const prev = this.prevActionState.get(action) || false;
      this.prevActionState.set(action, current);
      return current && !prev;
    };

    // 1. Hard Drop (BUTTON_A)
    if (isJustPressed(ArcadeAction.BUTTON_A)) {
      this.board.hardDrop(false);
      const fullLines = this.board.getFullLineIndices();
      if (fullLines.length > 0) {
        this.isClearingLines = true;
        this.renderState();
        this.triggerLineClearAnimation(fullLines, () => {
          this.board.clearLinesAndSpawn();
          this.isClearingLines = false;
          this.onBoardMutation();
        });
      } else {
        this.board.clearLinesAndSpawn();
        this.onBoardMutation();
      }
      return;
    }

    // 2. Rotate CW (BUTTON_B or UP)
    if (isJustPressed(ArcadeAction.BUTTON_B) || isJustPressed(ArcadeAction.UP)) {
      if (this.board.rotateCw()) {
        this.lockTimerAccumulator = 0; // Reset lock delay on successful move/rotation
      }
    }

    // 3. Hold Swap (BUTTON_C)
    if (isJustPressed(ArcadeAction.BUTTON_C)) {
      if (this.board.hold()) {
        this.lockTimerAccumulator = 0;
      }
    }

    // 4. Mode Switch (BUTTON_D or Key M)
    if (isJustPressed(ArcadeAction.BUTTON_D)) {
      this.isModernMode = !this.isModernMode;
      const newConfig = this.isModernMode
        ? { enableHold: true, enableGhost: true, nextPreviewCount: 3 }
        : { enableHold: false, enableGhost: false, nextPreviewCount: 1 };
      this.board.reset(newConfig);
      this.modeText.setText(this.isModernMode ? 'MODERN' : 'CLASSIC 1989');
      this.lockTimerAccumulator = 0;
    }

    // 4. Horizontal Movement (LEFT / RIGHT) with DAS / ARR
    const leftDown = InputService.isActionDown(PlayerIndex.P1, ArcadeAction.LEFT);
    const rightDown = InputService.isActionDown(PlayerIndex.P1, ArcadeAction.RIGHT);

    if (leftDown) {
      if (this.moveLeftTimer === 0) {
        if (this.board.moveLeft()) this.lockTimerAccumulator = 0;
      }
      this.moveLeftTimer += delta;
      if (this.moveLeftTimer >= this.DAS_DELAY + this.ARR_SPEED) {
        if (this.board.moveLeft()) this.lockTimerAccumulator = 0;
        this.moveLeftTimer = this.DAS_DELAY;
      }
    } else {
      this.moveLeftTimer = 0;
    }

    if (rightDown) {
      if (this.moveRightTimer === 0) {
        if (this.board.moveRight()) this.lockTimerAccumulator = 0;
      }
      this.moveRightTimer += delta;
      if (this.moveRightTimer >= this.DAS_DELAY + this.ARR_SPEED) {
        if (this.board.moveRight()) this.lockTimerAccumulator = 0;
        this.moveRightTimer = this.DAS_DELAY;
      }
    } else {
      this.moveRightTimer = 0;
    }

    // 5. Soft Drop (DOWN)
    const downDown = InputService.isActionDown(PlayerIndex.P1, ArcadeAction.DOWN);
    if (downDown) {
      this.softDropTimer += delta;
      if (this.softDropTimer >= 50) {
        this.softDropTimer = 0;
        if (this.board.softDrop()) {
          this.lockTimerAccumulator = 0;
        }
      }
    } else {
      this.softDropTimer = 0;
    }
  }

  private onPieceLock(): void {
    this.board.lockCurrentPiece(false);
    const fullLines = this.board.getFullLineIndices();
    if (fullLines.length > 0) {
      this.isClearingLines = true;
      this.renderState();
      this.triggerLineClearAnimation(fullLines, () => {
        this.board.clearLinesAndSpawn();
        this.isClearingLines = false;
        this.onBoardMutation();
      });
    } else {
      this.board.clearLinesAndSpawn();
      this.onBoardMutation();
    }
  }

  private handleGravity(delta: number): void {
    const dropInterval = this.board.getScoreCalculator().getDropInterval();
    this.dropTimerAccumulator += delta;

    if (this.dropTimerAccumulator >= dropInterval) {
      this.dropTimerAccumulator = 0;
      const moved = this.board.moveDown();
      if (moved) {
        this.lockTimerAccumulator = 0;
      }
    }

    // Check lock down state if piece cannot move down further
    const active = this.board.getActivePiece();
    if (active && this.board.checkCollision(active, active.x, active.y + 1, active.rotation)) {
      this.lockTimerAccumulator += delta;
      if (this.lockTimerAccumulator >= this.LOCK_DELAY_MS) {
        this.lockTimerAccumulator = 0;
        this.onPieceLock();
      }
    } else {
      this.lockTimerAccumulator = 0;
    }
  }

  private triggerLineClearAnimation(lines: number[], onComplete?: () => void): void {
    if (lines.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    const currentLevel = this.board.getScoreCalculator().getState().level;
    // Classic Arcade/NES style: Flash speed scales with Level
    // Level 1 = 80ms/blink, Level 15 = 35ms/blink
    const blinkInterval = Math.max(35, 80 - (currentLevel - 1) * 3);
    const totalBlinks = 3; // Flashes 3 times (On -> Off -> On -> Off -> On -> Off)

    const flashGraphics = this.add.graphics();
    let toggleCount = 0;

    this.time.addEvent({
      delay: blinkInterval,
      repeat: totalBlinks * 2 - 1,
      callback: () => {
        flashGraphics.clear();
        toggleCount++;
        // Odd ticks: draw bright white highlight; Even ticks: clear (transparent)
        if (toggleCount % 2 === 1) {
          flashGraphics.fillStyle(0xffffff, 0.95);
          lines.forEach((r) => {
            const px = this.BOARD_OFFSET_X;
            const py = this.BOARD_OFFSET_Y + r * this.TILE_SIZE;
            flashGraphics.fillRect(px, py, TetrisBoard.COLS * this.TILE_SIZE, this.TILE_SIZE);
          });
        }
      },
    });

    // Cleanup graphics object after all blinks complete
    this.time.delayedCall(blinkInterval * totalBlinks * 2 + 20, () => {
      flashGraphics.destroy();
      if (onComplete) onComplete();
    });
  }

  private onBoardMutation(): void {
    const scoreState = this.board.getScoreCalculator().getState();

    // Emit score update event to ArcadeBridge
    ArcadeBridge.emit('SCORE_UPDATED', scoreState);

    // Update HUD text
    this.scoreText.setText(scoreState.score.toString());
    this.levelText.setText(scoreState.level.toString());
    this.linesText.setText(scoreState.lines.toString());

    // Check Game Over condition
    if (this.board.isGameOver()) {
      this.gameOverText.setVisible(true);

      const elapsedSeconds = Math.round(this.time.now / 1000 - this.startTimeSeconds);
      ArcadeBridge.emit('GAME_OVER', {
        gameId: GAME_ID,
        score: scoreState.score,
        playTimeSeconds: elapsedSeconds,
        creditsUsed: 1,
      });
    }
  }

  private renderState(): void {
    this.pieceGraphics.clear();

    const grid = this.board.getGrid();

    // 1. Draw locked blocks on grid
    for (let r = 0; r < TetrisBoard.ROWS; r++) {
      for (let c = 0; c < TetrisBoard.COLS; c++) {
        const color = grid[r][c];
        if (color !== 0) {
          const px = this.BOARD_OFFSET_X + c * this.TILE_SIZE;
          const py = this.BOARD_OFFSET_Y + r * this.TILE_SIZE;
          this.drawBlock(px, py, color);
        }
      }
    }

    const active = this.board.getActivePiece();
    if (active) {
      const matrix = TETROMINOES[active.type].matrices[active.rotation];

      // 2. Draw Ghost Piece (if enabled by mode config)
      if (this.board.getModeConfig().enableGhost) {
        const ghostY = this.board.getGhostY();

        for (let r = 0; r < matrix.length; r++) {
          for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] !== 0) {
              const gx = this.BOARD_OFFSET_X + (active.x + c) * this.TILE_SIZE;
              const gy = this.BOARD_OFFSET_Y + (ghostY + r) * this.TILE_SIZE;
              this.pieceGraphics.lineStyle(2, 0x94a3b8, 0.6);
              this.pieceGraphics.strokeRect(gx + 2, gy + 2, this.TILE_SIZE - 4, this.TILE_SIZE - 4);
            }
          }
        }
      }

      // 3. Draw Active Falling Piece
      const color = TETROMINOES[active.type].color;
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            const px = this.BOARD_OFFSET_X + (active.x + c) * this.TILE_SIZE;
            const py = this.BOARD_OFFSET_Y + (active.y + r) * this.TILE_SIZE;
            this.drawBlock(px, py, color);
          }
        }
      }
    }

    // 4. Draw Hold Piece Preview
    const holdPiece = this.board.getHoldPiece();
    if (holdPiece) {
      this.drawMiniPiece(holdPiece, 80, 80);
    }

    // 5. Draw NEXT Queue Preview
    const nextQueue = this.board.getNextQueue();
    nextQueue.forEach((type, idx) => {
      this.drawMiniPiece(type, 620, 80 + idx * 90);
    });
  }

  private drawBlock(x: number, y: number, color: number): void {
    this.pieceGraphics.fillStyle(color, 1);
    this.pieceGraphics.fillRect(x + 1, y + 1, this.TILE_SIZE - 2, this.TILE_SIZE - 2);

    // Bevel highlights
    this.pieceGraphics.fillStyle(0xffffff, 0.3);
    this.pieceGraphics.fillRect(x + 1, y + 1, this.TILE_SIZE - 2, 3);
    this.pieceGraphics.fillRect(x + 1, y + 1, 3, this.TILE_SIZE - 2);

    this.pieceGraphics.fillStyle(0x000000, 0.3);
    this.pieceGraphics.fillRect(x + 1, y + this.TILE_SIZE - 4, this.TILE_SIZE - 2, 3);
    this.pieceGraphics.fillRect(x + this.TILE_SIZE - 4, y + 1, 3, this.TILE_SIZE - 2);
  }

  private drawMiniPiece(type: TetrominoType, startX: number, startY: number): void {
    const matrix = TETROMINOES[type].matrices[0];
    const color = TETROMINOES[type].color;
    const miniSize = 20;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const px = startX + c * miniSize;
          const py = startY + r * miniSize;
          this.pieceGraphics.fillStyle(color, 1);
          this.pieceGraphics.fillRect(px, py, miniSize - 1, miniSize - 1);
        }
      }
    }
  }

  public setPauseState(paused: boolean): void {
    this.isPaused = paused;
  }

  private onShutdown(): void {
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.onShutdown, this);

    this.gridGraphics.destroy();
    this.pieceGraphics.destroy();
    this.scoreText.destroy();
    this.levelText.destroy();
    this.linesText.destroy();
    this.gameOverText.destroy();
    this.prevActionState.clear();
  }
}
