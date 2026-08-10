/**
 * PacmanMaze.ts
 * Authentic 28x36 Arcade Pac-Man Matrix, Kinematics & Pellet Management.
 * Uses a 100% authentic Arcade Pac-Man ASCII map for maximum clarity and exact layout verification.
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
export const MAZE_ROWS = 35;
export const DEFAULT_TILE_SIZE = 21;
export const TUNNEL_ROW = 16;

/**
 * Authentic 1980 Namco Arcade Pac-Man ASCII Map (28 columns x 35 rows)
 * Legend:
 * '#' = Wall
 * '.' = Pellet
 * 'o' = Power Pellet
 * '-' = Ghost House Gate
 * 'H' = Ghost House Interior
 * ' ' = Empty Walkway / Header & Footer UI Space
 */
export const PACMAN_ASCII_MAP: string[] = [
  "                            ", // Row 0: Header UI Space
  "                            ", // Row 1: Header UI Space
  "############################", // Row 2: Top Outer Wall Border
  "#............##............#", // Row 3
  "#.####.#####.##.#####.####.#", // Row 4
  "#o####.#####.##.#####.####o#", // Row 5: Top Power Pellets
  "#.####.#####.##.#####.####.#", // Row 6
  "#..........................#", // Row 7
  "#.####.##.########.##.####.#", // Row 8
  "#.####.##.########.##.####.#", // Row 9
  "#......##....##....##......#", // Row 10
  "######.##### ## #####.######", // Row 11: Side Outer Walls & Upper T-stem
  "     #.##### ## #####.#     ", // Row 12: Upper T-bar horizontal wall
  "     #.##          ##.#     ", // Row 13: OPEN horizontal exit corridor for ghosts
  "     #.## ###--### ##.#     ", // Row 14: Ghost House Roof & Pink Gate (1/5)
  "######.## #HHHHHH# ##.######", // Row 15: Ghost House Upper Interior (2/5)
  "      .   #HHHHHH#   .      ", // Row 16: Tunnel Row (Wrap Teleport) & Ghost House Center (3/5)
  "######.## #HHHHHH# ##.######", // Row 17: Ghost House Lower Interior (4/5)
  "     #.## ######## ##.#     ", // Row 18: Ghost House Bottom Wall (5/5)
  "     #.##          ##.#     ", // Row 19: Corridor below Ghost House
  "     #.## ######## ##.#     ", // Row 20: 2-tile thick T-bar top row (1/2)
  "######.## ######## ##.######", // Row 21: 2-tile thick T-bar bottom row (2/2)
  "#............##............#", // Row 22: Middle-bottom horizontal pellet corridor
  "#.####.#####.##.#####.####.#", // Row 23: Top bar of left/right inverted-T
  "#.####.#####.##.#####.####.#", // Row 24: Top bar of left/right inverted-T
  "#o..##.......  .......##..o#", // Row 25: Power Pellets in authentic Nook & Pacman Start Tile
  "###.##.##.########.##.##.###", // Row 26: Center T-wall bar & left/right inverted-T stems
  "###.##.##.########.##.##.###", // Row 27: Center T-wall bar & left/right inverted-T stems
  "#......##....##....##......#", // Row 28: Horizontal corridor under inverted-T walls
  "#.##########.##.##########.#", // Row 29: Horizontal bar of Inverted-T
  "#.##########.##.##########.#", // Row 30: Horizontal bar of Inverted-T
  "#..........................#", // Row 31: Bottom-most horizontal pellet corridor
  "############################", // Row 32: Bottom Outer Wall Border
  "                            ", // Row 33: Footer UI Space
  "                            ", // Row 34: Footer UI Space
];

function parseAsciiMap(map: string[]): number[][] {
  return map.map((rowStr) => {
    const row: number[] = [];
    for (let c = 0; c < MAZE_COLS; c++) {
      const char = rowStr[c] || ' ';
      switch (char) {
        case '#':
          row.push(TileType.WALL);
          break;
        case '.':
          row.push(TileType.PELLET);
          break;
        case 'o':
          row.push(TileType.POWER_PELLET);
          break;
        case 'H':
          row.push(TileType.GHOST_HOUSE);
          break;
        case '-':
          row.push(TileType.GHOST_GATE);
          break;
        case ' ':
        default:
          row.push(TileType.EMPTY);
          break;
      }
    }
    return row;
  });
}

const MAZE_LAYOUT_RAW: number[][] = parseAsciiMap(PACMAN_ASCII_MAP);

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
   * Precompute BFS shortest path step distance from every maze tile to ghost house door (13, 16).
   */
  private computeHomeBfsDistance(): void {
    const doorCol = 13;
    const doorRow = 16;

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
