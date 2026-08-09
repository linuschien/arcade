/**
 * PacmanMaze.ts
 * 28x33 Discrete Grid Matrix, Movement Kinematics & Pellet Management.
 */

export enum TileType {
  EMPTY = 0,
  WALL = 1,
  PELLET = 2,
  POWER_PELLET = 3,
  GHOST_HOUSE = 4,
  GHOST_GATE = 5,
}

export interface GridPos {
  col: number;
  row: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export enum Direction {
  NONE = 'NONE',
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export const DIRECTION_VECTORS: Record<Direction, GridPos> = {
  [Direction.NONE]: { col: 0, row: 0 },
  [Direction.UP]: { col: 0, row: -1 },
  [Direction.DOWN]: { col: 0, row: 1 },
  [Direction.LEFT]: { col: -1, row: 0 },
  [Direction.RIGHT]: { col: 1, row: 0 },
};

export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  [Direction.NONE]: Direction.NONE,
  [Direction.UP]: Direction.DOWN,
  [Direction.DOWN]: Direction.UP,
  [Direction.LEFT]: Direction.RIGHT,
  [Direction.RIGHT]: Direction.LEFT,
};

export const MAZE_COLS = 28;
export const MAZE_ROWS = 33;
export const DEFAULT_TILE_SIZE = 20;
export const TUNNEL_ROW = 13;

// 28x33 Arcade Pac-Man Layout (0=EMPTY, 1=WALL, 2=PELLET, 3=POWER_PELLET, 4=GHOST_HOUSE, 5=GHOST_GATE)
// Exactly 244 total pellets (240 normal pellets + 4 power pellets).
const MAZE_LAYOUT_RAW: number[][] = [
  // Row 0: Top wall border
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // Row 1-8: Top maze section
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  // Row 9-17: Middle section (Ghost House & Tunnels)
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,2,0,0,0,0,0,0,0,0,2,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,5,5,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [0,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,0], // Row 13: Tunnel Row
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,2,0,0,0,0,0,0,0,0,2,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  // Row 18-28: Bottom section
  [1,2,2,2,2,2,2,2,2,2,2,2,0,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,3,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,1,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,1,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 26: Pacman Start Path Row!
  [1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  // Row 29: Bottom maze wall
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // Row 30-32: Footer UI space
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

export class PacmanMaze {
  private grid: number[][];
  private initialPelletCount: number = 0;
  private remainingPelletCount: number = 0;

  constructor() {
    this.grid = [];
    this.resetMaze();
  }

  /**
   * Reset maze grid state and count total pellets.
   */
  public resetMaze(): void {
    this.grid = MAZE_LAYOUT_RAW.map((row) => [...row]);
    let count = 0;
    for (let r = 0; r < MAZE_ROWS; r++) {
      for (let c = 0; c < MAZE_COLS; c++) {
        const val = this.grid[r][c];
        if (val === TileType.PELLET || val === TileType.POWER_PELLET) {
          count++;
        }
      }
    }
    this.initialPelletCount = count;
    this.remainingPelletCount = count;
  }

  public getGrid(): number[][] {
    return this.grid;
  }

  public getInitialPelletCount(): number {
    return this.initialPelletCount;
  }

  public getRemainingPelletCount(): number {
    return this.remainingPelletCount;
  }

  public getEatenPelletCount(): number {
    return this.initialPelletCount - this.remainingPelletCount;
  }

  public getTile(col: number, row: number): TileType {
    if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS) {
      // Tunnel row exception
      if (row === TUNNEL_ROW && (col < 0 || col >= MAZE_COLS)) {
        return TileType.EMPTY;
      }
      return TileType.WALL;
    }
    return this.grid[row][col] as TileType;
  }

  public isWall(col: number, row: number, allowGhostGate: boolean = false): boolean {
    // Tunnel row horizontally wrapping
    if (row === TUNNEL_ROW && (col < 0 || col >= MAZE_COLS)) {
      return false;
    }
    const tile = this.getTile(col, row);
    if (tile === TileType.WALL) return true;
    if (!allowGhostGate && (tile === TileType.GHOST_GATE || tile === TileType.GHOST_HOUSE)) {
      return true;
    }
    return false;
  }

  /**
   * Tile Center snapping formula: (col + 0.5) * tileSize, (row + 0.5) * tileSize
   */
  public static tileToWorld(col: number, row: number, tileSize: number = DEFAULT_TILE_SIZE): Vector2D {
    return {
      x: (col + 0.5) * tileSize,
      y: (row + 0.5) * tileSize,
    };
  }

  public static worldToTile(x: number, y: number, tileSize: number = DEFAULT_TILE_SIZE): GridPos {
    return {
      col: Math.floor(x / tileSize),
      row: Math.floor(y / tileSize),
    };
  }

  /**
   * Wrap tunnel grid coordinates horizontally.
   */
  public static wrapTunnelCol(col: number): number {
    if (col < 0) return MAZE_COLS - 1;
    if (col >= MAZE_COLS) return 0;
    return col;
  }

  /**
   * Consume pellet at given grid coordinate. Returns collected TileType or EMPTY.
   */
  public consumePellet(col: number, row: number): TileType {
    if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS) {
      return TileType.EMPTY;
    }
    const tile = this.grid[row][col];
    if (tile === TileType.PELLET || tile === TileType.POWER_PELLET) {
      this.grid[row][col] = TileType.EMPTY;
      this.remainingPelletCount = Math.max(0, this.remainingPelletCount - 1);
      return tile as TileType;
    }
    return TileType.EMPTY;
  }
}
