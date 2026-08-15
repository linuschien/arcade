/**
 * PipeGrid.ts
 * Manages the 10x7 discrete grid, pipe placement, overwrite rules,
 * port clamping, BFS/DFS solvability verification, and level generation.
 */

import {
  GRID_COLS,
  GRID_ROWS,
  Direction,
  DIRECTION_VECTORS,
  OPPOSITE_DIRECTIONS,
  GridCoord,
  GridCell,
  PipeType,
  PIPE_PORT_CONFIGS,
  STANDARD_PIPES,
  ALL_PLACEABLE_PIPES,
} from './PipeTypes';
import { PipeRNG } from './PipeRNG';
import { PipeManiaLevelSpecs, LevelConfig } from './PipeManiaLevelSpecs';

export interface PlaceResult {
  success: boolean;
  isReplacement: boolean;
  oldType?: PipeType;
}

export class PipeGrid {
  private cells: GridCell[][];
  private startCoord: GridCoord = { col: 1, row: 3 };
  private endCoord: GridCoord = { col: 8, row: 3 };
  private levelConfig!: LevelConfig;

  constructor() {
    this.cells = this.createEmptyGrid();
  }

  private createEmptyGrid(): GridCell[][] {
    const grid: GridCell[][] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      const row: GridCell[] = [];
      for (let c = 0; c < GRID_COLS; c++) {
        row.push({
          col: c,
          row: r,
          type: PipeType.EMPTY,
          isPreset: false,
          isFlooded: false,
          isFlooding: false,
          fillProgress: 0,
          entryDir: Direction.NONE,
          exitDir: Direction.NONE,
        });
      }
      grid.push(row);
    }
    return grid;
  }

  public getCell(col: number, row: number): GridCell | null {
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) {
      return null;
    }
    return this.cells[row][col];
  }

  public getStartCoord(): GridCoord {
    return { ...this.startCoord };
  }

  public getEndCoord(): GridCoord {
    return { ...this.endCoord };
  }

  public getLevelConfig(): LevelConfig {
    return this.levelConfig;
  }

  public getCells(): GridCell[][] {
    return this.cells;
  }

  /**
   * Place a pipe from the player's hand onto the grid.
   */
  public placePipe(col: number, row: number, type: PipeType): PlaceResult {
    const cell = this.getCell(col, row);
    if (!cell) {
      return { success: false, isReplacement: false };
    }

    // Prohibited on START, END, OBSTACLE, PRESET
    if (
      cell.type === PipeType.START ||
      cell.type === PipeType.END ||
      cell.type === PipeType.OBSTACLE ||
      cell.isPreset
    ) {
      return { success: false, isReplacement: false };
    }

    // Locked if currently flooding or already flooded
    if (cell.isFlooding || cell.isFlooded) {
      return { success: false, isReplacement: false };
    }

    const isReplacement = cell.type !== PipeType.EMPTY;
    const oldType = cell.type;

    cell.type = type;
    cell.isPreset = false;
    cell.isFlooded = false;
    cell.isFlooding = false;
    cell.fillProgress = 0;
    cell.entryDir = Direction.NONE;
    cell.exitDir = Direction.NONE;

    return {
      success: true,
      isReplacement,
      oldType: isReplacement ? oldType : undefined,
    };
  }

  /**
   * Generate a guaranteed solvable level layout.
   */
  public generateLevel(level: number, rng: () => number = Math.random): LevelConfig {
    this.levelConfig = PipeManiaLevelSpecs.getLevelConfig(level);
    this.cells = this.createEmptyGrid();

    let retryCount = 0;
    let obstacleCount = this.levelConfig.obstacleCount;
    let success = false;

    while (!success && retryCount < 20) {
      this.cells = this.createEmptyGrid();
      this.setupStartAndEnd(this.levelConfig, rng);
      this.placeObstacles(obstacleCount, rng);

      // Verify Solvability
      const isConnected = this.checkBFSConnectivity();
      const maxPath = isConnected ? this.computeMaxPotentialPath() : 0;

      if (isConnected && maxPath >= this.levelConfig.targetLength) {
        success = true;
      } else {
        retryCount++;
        // If retried 10 times, start decrementing obstacle count to guarantee 100% solvability
        if (retryCount >= 10 && obstacleCount > 0) {
          obstacleCount--;
        }
      }
    }

    // Place Preset Fixed Pipes
    this.placePresetPipes(this.levelConfig.presetPipeCount, level, rng);

    return this.levelConfig;
  }

  /**
   * Position START and END ports based on Manhattan distance and orientation rules.
   * In FACING mode (Level 1~8), Start and End are positioned to directly face each other across the board.
   */
  private setupStartAndEnd(config: LevelConfig, rng: () => number): void {
    const targetDist = config.manhattanDistance;

    // 1. Pick Start position & outflow direction
    let startCol = 1;
    let startRow = 3;
    let startDir = Direction.RIGHT;

    if (config.endOrientationMode === 'FACING') {
      // Pick random boundary side for Start: Left, Top, Right, or Bottom
      const sides = [Direction.RIGHT, Direction.DOWN, Direction.LEFT, Direction.UP];
      startDir = sides[Math.floor(rng() * sides.length)];

      if (startDir === Direction.RIGHT) {
        startCol = Math.floor(rng() * 2) + 1; // col 1 to 2
        startRow = Math.floor(rng() * (GRID_ROWS - 2)) + 1; // row 1 to 5
      } else if (startDir === Direction.LEFT) {
        startCol = GRID_COLS - 2 - Math.floor(rng() * 2); // col 7 to 8
        startRow = Math.floor(rng() * (GRID_ROWS - 2)) + 1;
      } else if (startDir === Direction.DOWN) {
        startCol = Math.floor(rng() * (GRID_COLS - 2)) + 1;
        startRow = Math.floor(rng() * 2) + 1; // row 1 to 2
      } else {
        startCol = Math.floor(rng() * (GRID_COLS - 2)) + 1;
        startRow = GRID_ROWS - 2 - Math.floor(rng() * 2); // row 4 to 5
      }
    } else {
      startCol = Math.floor(rng() * (GRID_COLS - 2)) + 1;
      startRow = Math.floor(rng() * (GRID_ROWS - 2)) + 1;

      const validStartDirs: Direction[] = [];
      if (startCol + 1 < GRID_COLS) validStartDirs.push(Direction.RIGHT);
      if (startRow + 1 < GRID_ROWS) validStartDirs.push(Direction.DOWN);
      if (startRow - 1 >= 0) validStartDirs.push(Direction.UP);
      if (startCol - 1 >= 0) validStartDirs.push(Direction.LEFT);
      startDir = validStartDirs[Math.floor(rng() * validStartDirs.length)] || Direction.RIGHT;
    }

    this.startCoord = { col: startCol, row: startRow };
    const startCell = this.cells[startRow][startCol];
    startCell.type = PipeType.START;
    startCell.startOutflowDir = startDir;

    // 2. Pick End Position based on Orientation Mode with Exact-Distance Priority
    const allCandidates: Array<{ col: number; row: number; dist: number; diff: number }> = [];

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (c === startCol && r === startRow) continue;

        if (config.endOrientationMode === 'FACING') {
          // In FACING mode, candidate must be strictly in the forward direction of startDir
          if (startDir === Direction.RIGHT && c <= startCol) continue;
          if (startDir === Direction.LEFT && c >= startCol) continue;
          if (startDir === Direction.DOWN && r <= startRow) continue;
          if (startDir === Direction.UP && r >= startRow) continue;
        }

        const d = Math.abs(c - startCol) + Math.abs(r - startRow);
        const diff = Math.abs(d - targetDist);
        allCandidates.push({ col: c, row: r, dist: d, diff });
      }
    }

    let chosenEnd: { col: number; row: number; dist: number };
    if (allCandidates.length > 0) {
      // Filter strictly by minimum distance diff (diff = 0 whenever geometrically possible)
      const minDiff = Math.min(...allCandidates.map(c => c.diff));
      const optimalCandidates = allCandidates.filter(c => c.diff === minDiff);
      chosenEnd = optimalCandidates[Math.floor(rng() * optimalCandidates.length)];
    } else {
      chosenEnd = { col: GRID_COLS - 1, row: GRID_ROWS - 1, dist: 0 };
    }

    this.endCoord = { col: chosenEnd.col, row: chosenEnd.row };
    const endCell = this.cells[this.endCoord.row][this.endCoord.col];
    endCell.type = PipeType.END;

    // 3. Determine End Inflow Direction
    let endInDir: Direction = Direction.RIGHT;

    if (config.endOrientationMode === 'FACING') {
      // Facing: End directly accepts stream moving in startDir (inflow opening faces start)
      endInDir = startDir;
    } else if (config.endOrientationMode === 'ORTHOGONAL') {
      // 90° Turn
      if (startDir === Direction.RIGHT || startDir === Direction.LEFT) {
        endInDir = rng() < 0.5 ? Direction.DOWN : Direction.UP;
      } else {
        endInDir = rng() < 0.5 ? Direction.RIGHT : Direction.LEFT;
      }
    } else {
      // AWAY: 180° loop
      endInDir = OPPOSITE_DIRECTIONS[startDir];
    }

    // Clamp End Inflow: Ensure tile in front of END inflow is inside grid bounds
    const endInflowFrontVector = DIRECTION_VECTORS[OPPOSITE_DIRECTIONS[endInDir]];
    const frontCol = this.endCoord.col + endInflowFrontVector.dx;
    const frontRow = this.endCoord.row + endInflowFrontVector.dy;

    if (frontCol < 0 || frontCol >= GRID_COLS || frontRow < 0 || frontRow >= GRID_ROWS) {
      if (this.endCoord.col === 0) endInDir = Direction.RIGHT;
      else if (this.endCoord.col === GRID_COLS - 1) endInDir = Direction.LEFT;
      else if (this.endCoord.row === 0) endInDir = Direction.DOWN;
      else endInDir = Direction.UP;
    }

    endCell.endInflowDir = endInDir;
  }

  /**
   * Check if a coordinate is within the 3x3 neighborhood (8 surrounding tiles) of Start or End.
   */
  public isNearStartOrEnd(col: number, row: number): boolean {
    const distToStart = Math.max(Math.abs(col - this.startCoord.col), Math.abs(row - this.startCoord.row));
    const distToEnd = Math.max(Math.abs(col - this.endCoord.col), Math.abs(row - this.endCoord.row));
    return distToStart <= 1 || distToEnd <= 1;
  }

  /**
   * Distribute obstacles avoiding the 3x3 neighborhood surrounding Start and End.
   */
  private placeObstacles(count: number, rng: () => number): void {
    if (count <= 0) return;

    const available: GridCoord[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.isNearStartOrEnd(c, r)) {
          continue;
        }
        available.push({ col: c, row: r });
      }
    }

    // Shuffle and pick
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }

    const toPlace = Math.min(count, available.length);
    for (let i = 0; i < toPlace; i++) {
      const coord = available[i];
      this.cells[coord.row][coord.col].type = PipeType.OBSTACLE;
    }
  }

  /**
   * BFS to check if Start and End are connected through passable tiles.
   */
  public checkBFSConnectivity(): boolean {
    const queue: GridCoord[] = [this.startCoord];
    const visited: boolean[][] = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));
    visited[this.startCoord.row][this.startCoord.col] = true;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr.col === this.endCoord.col && curr.row === this.endCoord.row) {
        return true;
      }

      for (const dir of [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT]) {
        const v = DIRECTION_VECTORS[dir];
        const nc = curr.col + v.dx;
        const nr = curr.row + v.dy;

        if (nc >= 0 && nc < GRID_COLS && nr >= 0 && nr < GRID_ROWS) {
          if (!visited[nr][nc]) {
            const cell = this.cells[nr][nc];
            if (cell.type !== PipeType.OBSTACLE) {
              visited[nr][nc] = true;
              queue.push({ col: nc, row: nr });
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * DFS heuristic estimate of maximum potential path capacity from Start to End.
   * Uses bounded exploration and connected component capacity check (< 1ms).
   */
  public computeMaxPotentialPath(): number {
    // 1. Total passable cells in the reachable connected component
    let reachableCount = 0;
    const visitedBFS: boolean[][] = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));
    const queue: GridCoord[] = [this.startCoord];
    visitedBFS[this.startCoord.row][this.startCoord.col] = true;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      reachableCount++;

      for (const dir of [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT]) {
        const v = DIRECTION_VECTORS[dir];
        const nc = curr.col + v.dx;
        const nr = curr.row + v.dy;

        if (nc >= 0 && nc < GRID_COLS && nr >= 0 && nr < GRID_ROWS) {
          if (!visitedBFS[nr][nc]) {
            const cell = this.cells[nr][nc];
            if (cell.type !== PipeType.OBSTACLE) {
              visitedBFS[nr][nc] = true;
              queue.push({ col: nc, row: nr });
            }
          }
        }
      }
    }

    // 2. Bounded heuristic DFS to find a long simple path (max 500 evaluations)
    let maxPath = 0;
    let evalCount = 0;
    const visitedDFS: boolean[][] = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));

    const dfs = (c: number, r: number, currentLength: number) => {
      evalCount++;
      if (evalCount > 500) return;

      if (c === this.endCoord.col && r === this.endCoord.row) {
        if (currentLength > maxPath) {
          maxPath = currentLength;
        }
        return;
      }

      visitedDFS[r][c] = true;

      // Prioritize moves that explore open spaces
      const neighbors: Array<{ c: number; r: number }> = [];
      for (const dir of [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT]) {
        const v = DIRECTION_VECTORS[dir];
        const nc = c + v.dx;
        const nr = r + v.dy;

        if (nc >= 0 && nc < GRID_COLS && nr >= 0 && nr < GRID_ROWS) {
          if (!visitedDFS[nr][nc] && this.cells[nr][nc].type !== PipeType.OBSTACLE) {
            neighbors.push({ c: nc, r: nr });
          }
        }
      }

      for (const n of neighbors) {
        dfs(n.c, n.r, currentLength + 1);
        if (evalCount > 500) break;
      }

      visitedDFS[r][c] = false;
    };

    dfs(this.startCoord.col, this.startCoord.row, 0);

    // Theoretical upper bound capacity is reachableCount - 1
    return Math.max(maxPath, reachableCount - 1);
  }

  /**
   * Return required opening port directions for a given pipe type.
   */
  public getPipeOpenings(type: PipeType): Direction[] {
    switch (type) {
      case PipeType.HORIZONTAL:
      case PipeType.RESERVOIR_HORIZONTAL:
      case PipeType.ONE_WAY_RIGHT:
      case PipeType.ONE_WAY_LEFT:
        return [Direction.LEFT, Direction.RIGHT];
      case PipeType.VERTICAL:
      case PipeType.RESERVOIR_VERTICAL:
      case PipeType.ONE_WAY_UP:
      case PipeType.ONE_WAY_DOWN:
        return [Direction.UP, Direction.DOWN];
      case PipeType.CORNER_TOP_RIGHT:
        return [Direction.UP, Direction.RIGHT];
      case PipeType.CORNER_TOP_LEFT:
        return [Direction.UP, Direction.LEFT];
      case PipeType.CORNER_BOTTOM_RIGHT:
        return [Direction.DOWN, Direction.RIGHT];
      case PipeType.CORNER_BOTTOM_LEFT:
        return [Direction.DOWN, Direction.LEFT];
      case PipeType.CROSS:
        return [Direction.UP, Direction.DOWN, Direction.LEFT, Direction.RIGHT];
      default:
        return [];
    }
  }

  /**
   * Check if a pipe type's required opening ports all face in-bounds EMPTY cells.
   */
  public isPipePortsClear(col: number, row: number, type: PipeType): boolean {
    const openings = this.getPipeOpenings(type);
    if (openings.length === 0) return false;

    for (const dir of openings) {
      const v = DIRECTION_VECTORS[dir];
      const nc = col + v.dx;
      const nr = row + v.dy;

      // 1. Must be strictly within grid bounds
      if (nc < 0 || nc >= GRID_COLS || nr < 0 || nr >= GRID_ROWS) return false;

      // 2. Neighbor facing this port must be strictly EMPTY
      const neighborCell = this.cells[nr][nc];
      if (neighborCell.type !== PipeType.EMPTY) return false;
    }

    return true;
  }

  /**
   * Place preset fixed golden pipes outside the Start/End 3x3 neighborhood,
   * ensuring all opening ports strictly face in-bounds EMPTY cells.
   */
  private placePresetPipes(count: number, level: number, rng: () => number): void {
    if (count <= 0) return;

    const available: GridCoord[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.cells[r][c].type === PipeType.EMPTY && !this.isNearStartOrEnd(c, r)) {
          available.push({ col: c, row: r });
        }
      }
    }

    // Shuffle
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }

    let placed = 0;
    for (const coord of available) {
      if (placed >= count) break;

      let pipeType = PipeRNG.getRandomPipe(level, rng);

      // Fast-Path: If randomly drawn pipe already has 100% port clearance, use it immediately!
      if (!this.isPipePortsClear(coord.col, coord.row, pipeType)) {
        // Lazy Fallback: Only filter ALL_PLACEABLE_PIPES when the initial pipe fails port clearance
        const validTypes = ALL_PLACEABLE_PIPES.filter((t) => this.isPipePortsClear(coord.col, coord.row, t));
        if (validTypes.length === 0) {
          continue; // Cell is too constrained, skip to next candidate
        }
        pipeType = validTypes[Math.floor(rng() * validTypes.length)];
      }

      const cell = this.cells[coord.row][coord.col];
      cell.type = pipeType;
      cell.isPreset = true;
      placed++;
    }
  }
}
