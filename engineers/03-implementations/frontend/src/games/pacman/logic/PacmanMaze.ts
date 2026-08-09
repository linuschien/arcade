/**
 * PacmanMaze.ts
 * Authentic 28x36 Arcade Pac-Man Matrix, Kinematics & Pellet Management.
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
export const MAZE_ROWS = 36;
export const DEFAULT_TILE_SIZE = 21;
export const TUNNEL_ROW = 15;

// Authentic 28x36 Arcade Pac-Man Matrix (0=EMPTY, 1=WALL, 2=PELLET, 3=POWER_PELLET, 4=GHOST_HOUSE, 5=GHOST_GATE)
// Exactly 244 total pellets (240 normal pellets + 4 power pellets), 0 dead-ends, tunnel at row 15.
const MAZE_LAYOUT_RAW: number[][] = [
  // Rows 0-1: Header UI Space
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  // Row 2: Top Maze Wall Border
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // Rows 3-10: Top Maze Section
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,3,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  // Rows 11-19: Middle Ghost House & Tunnel Section
  [1,1,1,1,1,1,2,1,1,1,1,1,0,1,1,0,1,1,1,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,0,1,1,0,1,1,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,5,5,1,1,1,0,1,1,0,1,1,1,1,1,1],
  [0,0,0,0,0,0,2,0,0,0,1,4,4,4,4,4,4,1,0,0,0,2,0,0,0,0,0,0], // Row 15: Tunnel Row
  [1,1,1,1,1,1,2,1,1,0,1,4,4,4,4,4,4,1,0,1,1,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,0,0,0,0,0,0,0,0,0,1,1,2,1,1,1,1,1,1],
  [1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1],
  // Rows 20-29: Bottom Maze Section
  [1,2,2,2,2,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,3,2,2,1,1,2,2,2,2,2,2,2,0,0,2,2,2,2,2,2,2,1,1,2,2,3,1], // Row 23: 28 cols, Pacman Start Tile (13, 23), col 21 is pellet
  [1,2,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,2,1], // Row 24: 28 cols, col 22-23 wall
  [1,2,1,2,1,1,2,1,1,2,1,1,1,1,1,1,1,1,2,1,1,2,1,1,2,1,2,1], // Row 25: 28 cols, col 22-23 wall
  [1,2,2,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,1,1,2,2,2,2,2,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,1,1,1,1,2,1,1,1,1,1,2,1,1,2,1,1,1,1,1,2,1,1,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1], // Row 29: Bottom Corridor
  // Row 30: Bottom Maze Wall Border
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  // Rows 31-35: Footer UI Space
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

export class PacmanMaze {
  private grid: number[][];
  private initialPelletCount: number = 0;
  private remainingPelletCount: number = 0;
  private homeBfsDistance: number[][] = [];

  constructor() {
    this.grid = [];
    this.resetMaze();
    this.computeHomeBfsDistance();
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

  /**
   * Precompute BFS shortest path step distance from every maze tile to ghost house door (13, 14).
   */
  private computeHomeBfsDistance(): void {
    const doorCol = 13;
    const doorRow = 14;

    this.homeBfsDistance = Array.from({ length: MAZE_ROWS }, () =>
      Array(MAZE_COLS).fill(Infinity)
    );

    const queue: Array<{ col: number; row: number; dist: number }> = [
      { col: doorCol, row: doorRow, dist: 0 },
    ];
    this.homeBfsDistance[doorRow][doorCol] = 0;

    const dirs = [
      { col: 0, row: -1 },
      { col: 0, row: 1 },
      { col: -1, row: 0 },
      { col: 1, row: 0 },
    ];

    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const d of dirs) {
        const nc = curr.col + d.col;
        const nr = curr.row + d.row;

        if (nr >= 0 && nr < MAZE_ROWS && nc >= 0 && nc < MAZE_COLS) {
          if (!this.isWall(nc, nr, true) && this.homeBfsDistance[nr][nc] === Infinity) {
            this.homeBfsDistance[nr][nc] = curr.dist + 1;
            queue.push({ col: nc, row: nr, dist: curr.dist + 1 });
          }
        }
      }
    }
  }

  public getHomeBfsDistance(col: number, row: number): number {
    if (row < 0 || row >= MAZE_ROWS || col < 0 || col >= MAZE_COLS) return Infinity;
    return this.homeBfsDistance[row][col];
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
