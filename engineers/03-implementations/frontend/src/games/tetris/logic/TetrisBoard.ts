/**
 * TetrisBoard.ts
 * Pure TypeScript implementation of the 10x20 Tetris matrix state, SRS wall kick collision,
 * movement, soft/hard drop, line clearing, hold mechanics, and game over detection.
 */

import { TetrominoType, RotationState, TETROMINOES, getSrsKicks } from './Tetromino';
import { SevenBag } from './SevenBag';
import { ScoreCalculator } from './ScoreCalculator';

export interface ActivePiece {
  type: TetrominoType;
  x: number; // Grid column index
  y: number; // Grid row index
  rotation: RotationState;
}

export interface TetrisModeConfig {
  enableHold: boolean;
  enableGhost: boolean;
  nextPreviewCount: number; // 1 for Classic, 3 for Modern
}

export const MODERN_CONFIG: TetrisModeConfig = {
  enableHold: true,
  enableGhost: true,
  nextPreviewCount: 3,
};

export const CLASSIC_CONFIG: TetrisModeConfig = {
  enableHold: false,
  enableGhost: false,
  nextPreviewCount: 1,
};

export class TetrisBoard {
  public static readonly COLS = 10;
  public static readonly ROWS = 20;

  // Grid matrix: grid[row][col], 0 = empty, hex number = block color
  private grid: number[][];
  private activePiece: ActivePiece | null = null;
  private holdPiece: TetrominoType | null = null;
  private canHoldSwap: boolean = true;
  private isGameOverState: boolean = false;

  private sevenBag: SevenBag;
  private scoreCalculator: ScoreCalculator;
  private modeConfig: TetrisModeConfig;

  constructor(
    modeConfig: TetrisModeConfig = MODERN_CONFIG,
    sevenBag?: SevenBag,
    scoreCalculator?: ScoreCalculator
  ) {
    this.modeConfig = modeConfig;
    this.sevenBag = sevenBag || new SevenBag();
    this.scoreCalculator = scoreCalculator || new ScoreCalculator();
    this.grid = this.createEmptyGrid();
    this.spawnNextPiece();
  }

  private createEmptyGrid(): number[][] {
    return Array.from({ length: TetrisBoard.ROWS }, () => Array(TetrisBoard.COLS).fill(0));
  }

  /**
   * Spawns the next piece from SevenBag into the playfield.
   */
  public spawnNextPiece(): boolean {
    const nextType = this.sevenBag.next();
    return this.spawnPiece(nextType);
  }

  /**
   * Spawns a specific piece type at top-center position.
   */
  public spawnPiece(type: TetrominoType): boolean {
    const matrix = TETROMINOES[type].matrices[0];
    const pieceWidth = matrix[0].length;
    const startX = Math.floor((TetrisBoard.COLS - pieceWidth) / 2);
    const startY = 0;

    const candidate: ActivePiece = {
      type,
      x: startX,
      y: startY,
      rotation: 0,
    };

    if (this.checkCollision(candidate, candidate.x, candidate.y, candidate.rotation)) {
      // Block out condition -> Game Over
      this.isGameOverState = true;
      this.activePiece = candidate;
      return false;
    }

    this.activePiece = candidate;
    this.canHoldSwap = true;
    return true;
  }

  /**
   * Checks if candidate piece collides with walls or locked blocks.
   */
  public checkCollision(piece: ActivePiece, targetX: number, targetY: number, targetRotation: RotationState): boolean {
    const matrix = TETROMINOES[piece.type].matrices[targetRotation];
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const boardX = targetX + c;
          const boardY = targetY + r;

          // Out of bounds checks
          if (boardX < 0 || boardX >= TetrisBoard.COLS || boardY >= TetrisBoard.ROWS) {
            return true;
          }

          // Locked block collision check (ignore above top row boardY < 0)
          if (boardY >= 0 && this.grid[boardY][boardX] !== 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Moves active piece left.
   */
  public moveLeft(): boolean {
    if (!this.activePiece || this.isGameOverState) return false;
    if (!this.checkCollision(this.activePiece, this.activePiece.x - 1, this.activePiece.y, this.activePiece.rotation)) {
      this.activePiece.x -= 1;
      return true;
    }
    return false;
  }

  /**
   * Moves active piece right.
   */
  public moveRight(): boolean {
    if (!this.activePiece || this.isGameOverState) return false;
    if (!this.checkCollision(this.activePiece, this.activePiece.x + 1, this.activePiece.y, this.activePiece.rotation)) {
      this.activePiece.x += 1;
      return true;
    }
    return false;
  }

  /**
   * Moves active piece down by 1 row (Soft Drop tick).
   */
  public moveDown(): boolean {
    if (!this.activePiece || this.isGameOverState) return false;
    if (!this.checkCollision(this.activePiece, this.activePiece.x, this.activePiece.y + 1, this.activePiece.rotation)) {
      this.activePiece.y += 1;
      return true;
    }
    return false;
  }

  /**
   * User soft drop: accelerates down 1 row and awards +1 score point.
   */
  public softDrop(): boolean {
    if (this.moveDown()) {
      this.scoreCalculator.addSoftDrop(1);
      return true;
    }
    return false;
  }

  /**
   * Hard Drop: instantly drops active piece to lowest valid position and locks down.
   */
  public hardDrop(): number {
    if (!this.activePiece || this.isGameOverState) return 0;

    const ghostY = this.getGhostY();
    const dropDistance = ghostY - this.activePiece.y;
    this.activePiece.y = ghostY;

    if (dropDistance > 0) {
      this.scoreCalculator.addHardDrop(dropDistance);
    }

    this.lockCurrentPiece();
    return dropDistance;
  }

  /**
   * Rotates active piece clockwise using SRS wall kick testing.
   */
  public rotateCw(): boolean {
    return this.rotate(1);
  }

  /**
   * Rotates active piece counter-clockwise using SRS wall kick testing.
   */
  public rotateCcw(): boolean {
    return this.rotate(-1);
  }

  private rotate(dir: 1 | -1): boolean {
    if (!this.activePiece || this.isGameOverState) return false;

    const fromState = this.activePiece.rotation;
    const toState = ((fromState + dir + 4) % 4) as RotationState;
    const kicks = getSrsKicks(this.activePiece.type, fromState, toState);

    for (const kick of kicks) {
      const targetX = this.activePiece.x + kick.x;
      // In SRS kick table standard, +y is upward; on canvas +y is downward so subtract kick.y
      const targetY = this.activePiece.y - kick.y;

      if (!this.checkCollision(this.activePiece, targetX, targetY, toState)) {
        this.activePiece.x = targetX;
        this.activePiece.y = targetY;
        this.activePiece.rotation = toState;
        return true;
      }
    }

    return false; // All 5 SRS kick points failed
  }

  /**
   * Executes Hold piece swap if enabled and allowed.
   */
  public hold(): boolean {
    if (!this.modeConfig.enableHold || !this.canHoldSwap || !this.activePiece || this.isGameOverState) {
      return false;
    }

    const currentType = this.activePiece.type;

    if (this.holdPiece === null) {
      this.holdPiece = currentType;
      this.spawnNextPiece();
    } else {
      const temp = this.holdPiece;
      this.holdPiece = currentType;
      this.spawnPiece(temp);
    }

    this.canHoldSwap = false;
    return true;
  }

  /**
   * Locks current active piece into playfield matrix and checks line clears.
   */
  public lockCurrentPiece(): number {
    if (!this.activePiece) return 0;

    const matrix = TETROMINOES[this.activePiece.type].matrices[this.activePiece.rotation];
    const color = TETROMINOES[this.activePiece.type].color;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const boardX = this.activePiece.x + c;
          const boardY = this.activePiece.y + r;
          if (boardY >= 0 && boardY < TetrisBoard.ROWS && boardX >= 0 && boardX < TetrisBoard.COLS) {
            this.grid[boardY][boardX] = color;
          }
        }
      }
    }

    const linesCleared = this.clearLines();
    this.activePiece = null;

    if (!this.isGameOverState) {
      this.spawnNextPiece();
    }

    return linesCleared;
  }

  /**
   * Clears completed rows and shifts remaining blocks down.
   */
  public clearLines(): number {
    let cleared = 0;

    for (let r = TetrisBoard.ROWS - 1; r >= 0; r--) {
      const isFull = this.grid[r].every((cell) => cell !== 0);
      if (isFull) {
        cleared++;
        this.grid.splice(r, 1);
        this.grid.unshift(Array(TetrisBoard.COLS).fill(0));
        r++; // Re-evaluate same row index since array shifted
      }
    }

    if (cleared > 0) {
      this.scoreCalculator.addLineClears(cleared);
    }

    return cleared;
  }

  /**
   * Calculates y row coordinate of Ghost piece.
   */
  public getGhostY(): number {
    if (!this.activePiece) return 0;

    let testY = this.activePiece.y;
    while (!this.checkCollision(this.activePiece, this.activePiece.x, testY + 1, this.activePiece.rotation)) {
      testY++;
    }

    return testY;
  }

  public getGrid(): number[][] {
    return this.grid;
  }

  public getActivePiece(): ActivePiece | null {
    return this.activePiece;
  }

  public getHoldPiece(): TetrominoType | null {
    return this.holdPiece;
  }

  public getNextQueue(): TetrominoType[] {
    return this.sevenBag.peek(this.modeConfig.nextPreviewCount);
  }

  public getScoreCalculator(): ScoreCalculator {
    return this.scoreCalculator;
  }

  public isGameOver(): boolean {
    return this.isGameOverState;
  }

  public getModeConfig(): TetrisModeConfig {
    return this.modeConfig;
  }

  public reset(modeConfig?: TetrisModeConfig): void {
    if (modeConfig) {
      this.modeConfig = modeConfig;
    }
    this.grid = this.createEmptyGrid();
    this.sevenBag.reset();
    this.scoreCalculator.reset();
    this.activePiece = null;
    this.holdPiece = null;
    this.canHoldSwap = true;
    this.isGameOverState = false;
    this.spawnNextPiece();
  }
}
