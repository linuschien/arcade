/**
 * SokobanMaze.ts
 * Authentic Sokoban Grid Matrix, Topology & State representation.
 * Follows the naming and architectural convention of PacmanMaze and RallyXMaze.
 * 100% decoupled from Phaser and DOM for deterministic logic and Vitest execution.
 */

export enum TileType {
  EMPTY = ' ',
  WALL = '#',
  FLOOR = ' ',
  GOAL = '.',
  BOX = '$',
  BOX_ON_GOAL = '*',
  WORKER = '@',
  WORKER_ON_GOAL = '+',
}

export interface GridPos {
  col: number;
  row: number;
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

export function posKey(col: number, row: number): string {
  return `${col},${row}`;
}

export function parsePosKey(key: string): GridPos {
  const [col, row] = key.split(',').map(Number);
  return { col, row };
}

export class SokobanMaze {
  public readonly width: number;
  public readonly height: number;

  private walls: Set<string> = new Set();
  private goals: Set<string> = new Set();
  private boxes: Set<string> = new Set();
  private workerPos: GridPos = { col: 0, row: 0 };

  constructor(mapLines: string[]) {
    this.height = mapLines.length;
    this.width = Math.max(...mapLines.map((line) => line.length), 0);

    for (let row = 0; row < mapLines.length; row++) {
      const line = mapLines[row];
      for (let col = 0; col < line.length; col++) {
        const char = line[col];
        const key = posKey(col, row);

        switch (char) {
          case TileType.WALL:
            this.walls.add(key);
            break;
          case TileType.GOAL:
            this.goals.add(key);
            break;
          case TileType.BOX:
            this.boxes.add(key);
            break;
          case TileType.BOX_ON_GOAL:
            this.boxes.add(key);
            this.goals.add(key);
            break;
          case TileType.WORKER:
            this.workerPos = { col, row };
            break;
          case TileType.WORKER_ON_GOAL:
            this.workerPos = { col, row };
            this.goals.add(key);
            break;
          default:
            // Empty / Floor space
            break;
        }
      }
    }
  }

  public isInBounds(col: number, row: number): boolean {
    return col >= 0 && col < this.width && row >= 0 && row < this.height;
  }

  public isWall(col: number, row: number): boolean {
    return this.walls.has(posKey(col, row));
  }

  public isGoal(col: number, row: number): boolean {
    return this.goals.has(posKey(col, row));
  }

  public hasBox(col: number, row: number): boolean {
    return this.boxes.has(posKey(col, row));
  }

  public isWalkable(col: number, row: number): boolean {
    if (!this.isInBounds(col, row)) return false;
    if (this.isWall(col, row)) return false;
    if (this.hasBox(col, row)) return false;
    return true;
  }

  public getWorkerPos(): GridPos {
    return { ...this.workerPos };
  }

  public setWorkerPos(pos: GridPos): void {
    this.workerPos = { ...pos };
  }

  public getBoxPositions(): GridPos[] {
    return Array.from(this.boxes).map(parsePosKey);
  }

  public getGoalPositions(): GridPos[] {
    return Array.from(this.goals).map(parsePosKey);
  }

  public getBoxCount(): number {
    return this.boxes.size;
  }

  public getGoalCount(): number {
    return this.goals.size;
  }

  public moveBox(from: GridPos, to: GridPos): boolean {
    const fromKey = posKey(from.col, from.row);
    const toKey = posKey(to.col, to.row);

    if (!this.boxes.has(fromKey)) return false;
    if (this.isWall(to.col, to.row) || this.boxes.has(toKey)) return false;

    this.boxes.delete(fromKey);
    this.boxes.add(toKey);
    return true;
  }

  public isCompleted(): boolean {
    if (this.goals.size === 0 || this.boxes.size === 0) return false;
    for (const goalKey of this.goals) {
      if (!this.boxes.has(goalKey)) {
        return false;
      }
    }
    return true;
  }

  public getCompletedBoxCount(): number {
    let count = 0;
    for (const boxKey of this.boxes) {
      if (this.goals.has(boxKey)) {
        count++;
      }
    }
    return count;
  }

  public restoreState(workerPos: GridPos, boxPositions: GridPos[]): void {
    this.workerPos = { ...workerPos };
    this.boxes.clear();
    for (const b of boxPositions) {
      this.boxes.add(posKey(b.col, b.row));
    }
  }

  public clone(): SokobanMaze {
    // Construct dummy map lines and copy internal sets
    const emptyLines = Array.from({ length: this.height }, () => ' '.repeat(this.width));
    const cloned = new SokobanMaze(emptyLines);
    cloned.walls = new Set(this.walls);
    cloned.goals = new Set(this.goals);
    cloned.boxes = new Set(this.boxes);
    cloned.workerPos = { ...this.workerPos };
    return cloned;
  }
}

