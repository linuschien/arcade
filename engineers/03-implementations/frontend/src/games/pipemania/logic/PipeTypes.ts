/**
 * PipeTypes.ts
 * Type definitions, Enums, and Port Connectivity Matrix for Pipe Mania.
 * Decoupled pure logic definitions for all 13 Pipe Types, Grid States, and Directions.
 */

export const GRID_COLS = 10;
export const GRID_ROWS = 7;
export const QUEUE_SIZE = 5;

export enum Direction {
  NONE = 'NONE',
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface GridCoord {
  col: number; // 0 to 9
  row: number; // 0 to 6
}

export const DIRECTION_VECTORS: Record<Direction, { dx: number; dy: number }> = {
  [Direction.NONE]: { dx: 0, dy: 0 },
  [Direction.UP]: { dx: 0, dy: -1 },
  [Direction.DOWN]: { dx: 0, dy: 1 },
  [Direction.LEFT]: { dx: -1, dy: 0 },
  [Direction.RIGHT]: { dx: 1, dy: 0 },
};

export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  [Direction.NONE]: Direction.NONE,
  [Direction.UP]: Direction.DOWN,
  [Direction.DOWN]: Direction.UP,
  [Direction.LEFT]: Direction.RIGHT,
  [Direction.RIGHT]: Direction.LEFT,
};

export enum PipeType {
  EMPTY = 'EMPTY',
  OBSTACLE = 'OBSTACLE',
  START = 'START',
  END = 'END',

  // 7 Standard Pipes
  HORIZONTAL = 'HORIZONTAL', // ─ (LEFT <-> RIGHT)
  VERTICAL = 'VERTICAL', // │ (UP <-> DOWN)
  CORNER_TOP_RIGHT = 'CORNER_TOP_RIGHT', // ╝ (UP <-> RIGHT)
  CORNER_TOP_LEFT = 'CORNER_TOP_LEFT', // ╚ (UP <-> LEFT)
  CORNER_BOTTOM_RIGHT = 'CORNER_BOTTOM_RIGHT', // ╗ (DOWN <-> RIGHT)
  CORNER_BOTTOM_LEFT = 'CORNER_BOTTOM_LEFT', // ╔ (DOWN <-> LEFT)
  CROSS = 'CROSS', // ╬ (Horizontal & Vertical independent)

  // 4 One-Way Pipes
  ONE_WAY_RIGHT = 'ONE_WAY_RIGHT', // → (In from LEFT -> Out to RIGHT)
  ONE_WAY_LEFT = 'ONE_WAY_LEFT', // ← (In from RIGHT -> Out to LEFT)
  ONE_WAY_DOWN = 'ONE_WAY_DOWN', // ↓ (In from UP -> Out to DOWN)
  ONE_WAY_UP = 'ONE_WAY_UP', // ↑ (In from DOWN -> Out to UP)

  // 2 Reservoir Tanks (4.0x fill duration)
  RESERVOIR_HORIZONTAL = 'RESERVOIR_HORIZONTAL', // In from LEFT/RIGHT -> Out opposite
  RESERVOIR_VERTICAL = 'RESERVOIR_VERTICAL', // In from UP/DOWN -> Out opposite
}

export const STANDARD_PIPES: PipeType[] = [
  PipeType.HORIZONTAL,
  PipeType.VERTICAL,
  PipeType.CORNER_TOP_RIGHT,
  PipeType.CORNER_TOP_LEFT,
  PipeType.CORNER_BOTTOM_RIGHT,
  PipeType.CORNER_BOTTOM_LEFT,
  PipeType.CROSS,
];

export const ONE_WAY_PIPES: PipeType[] = [
  PipeType.ONE_WAY_RIGHT,
  PipeType.ONE_WAY_LEFT,
  PipeType.ONE_WAY_DOWN,
  PipeType.ONE_WAY_UP,
];

export const RESERVOIR_PIPES: PipeType[] = [
  PipeType.RESERVOIR_HORIZONTAL,
  PipeType.RESERVOIR_VERTICAL,
];

export const ALL_PLACEABLE_PIPES: PipeType[] = [
  ...STANDARD_PIPES,
  ...ONE_WAY_PIPES,
  ...RESERVOIR_PIPES,
];

export interface PipePortConfig {
  allowedInputs: Direction[];
  getExitDirection: (entryDir: Direction) => Direction | null;
  isCross?: boolean;
  isReservoir?: boolean;
  isOneWay?: boolean;
}

/**
 * Given the direction the liquid is MOVING when it ENTERS the pipe,
 * determine if it's allowed and which direction it EXITS to.
 * 
 * Note: 'entryDir' is the travel direction of the liquid entering this tile.
 * e.g., If moving RIGHT, it enters the LEFT side of the tile.
 */
export const PIPE_PORT_CONFIGS: Partial<Record<PipeType, PipePortConfig>> = {
  [PipeType.HORIZONTAL]: {
    allowedInputs: [Direction.RIGHT, Direction.LEFT],
    getExitDirection: (entryDir) => {
      if (entryDir === Direction.RIGHT) return Direction.RIGHT;
      if (entryDir === Direction.LEFT) return Direction.LEFT;
      return null;
    },
  },
  [PipeType.VERTICAL]: {
    allowedInputs: [Direction.DOWN, Direction.UP],
    getExitDirection: (entryDir) => {
      if (entryDir === Direction.DOWN) return Direction.DOWN;
      if (entryDir === Direction.UP) return Direction.UP;
      return null;
    },
  },
  [PipeType.CORNER_TOP_RIGHT]: {
    // Connects UP and RIGHT
    // Moving DOWN enters from top -> exits RIGHT
    // Moving LEFT enters from right -> exits UP
    allowedInputs: [Direction.DOWN, Direction.LEFT],
    getExitDirection: (entryDir) => {
      if (entryDir === Direction.DOWN) return Direction.RIGHT;
      if (entryDir === Direction.LEFT) return Direction.UP;
      return null;
    },
  },
  [PipeType.CORNER_TOP_LEFT]: {
    // Connects UP and LEFT
    // Moving DOWN enters from top -> exits LEFT
    // Moving RIGHT enters from left -> exits UP
    allowedInputs: [Direction.DOWN, Direction.RIGHT],
    getExitDirection: (entryDir) => {
      if (entryDir === Direction.DOWN) return Direction.LEFT;
      if (entryDir === Direction.RIGHT) return Direction.UP;
      return null;
    },
  },
  [PipeType.CORNER_BOTTOM_RIGHT]: {
    // Connects DOWN and RIGHT
    // Moving UP enters from bottom -> exits RIGHT
    // Moving LEFT enters from right -> exits DOWN
    allowedInputs: [Direction.UP, Direction.LEFT],
    getExitDirection: (entryDir) => {
      if (entryDir === Direction.UP) return Direction.RIGHT;
      if (entryDir === Direction.LEFT) return Direction.DOWN;
      return null;
    },
  },
  [PipeType.CORNER_BOTTOM_LEFT]: {
    // Connects DOWN and LEFT
    // Moving UP enters from bottom -> exits LEFT
    // Moving RIGHT enters from left -> exits DOWN
    allowedInputs: [Direction.UP, Direction.RIGHT],
    getExitDirection: (entryDir) => {
      if (entryDir === Direction.UP) return Direction.LEFT;
      if (entryDir === Direction.RIGHT) return Direction.DOWN;
      return null;
    },
  },
  [PipeType.CROSS]: {
    allowedInputs: [Direction.RIGHT, Direction.LEFT, Direction.DOWN, Direction.UP],
    isCross: true,
    getExitDirection: (entryDir) => {
      // Straight through only
      return entryDir;
    },
  },
  [PipeType.ONE_WAY_RIGHT]: {
    allowedInputs: [Direction.RIGHT], // Only moving RIGHT (enters from LEFT)
    isOneWay: true,
    getExitDirection: (entryDir) => (entryDir === Direction.RIGHT ? Direction.RIGHT : null),
  },
  [PipeType.ONE_WAY_LEFT]: {
    allowedInputs: [Direction.LEFT], // Only moving LEFT (enters from RIGHT)
    isOneWay: true,
    getExitDirection: (entryDir) => (entryDir === Direction.LEFT ? Direction.LEFT : null),
  },
  [PipeType.ONE_WAY_DOWN]: {
    allowedInputs: [Direction.DOWN], // Only moving DOWN (enters from TOP)
    isOneWay: true,
    getExitDirection: (entryDir) => (entryDir === Direction.DOWN) ? Direction.DOWN : null,
  },
  [PipeType.ONE_WAY_UP]: {
    allowedInputs: [Direction.UP], // Only moving UP (enters from BOTTOM)
    isOneWay: true,
    getExitDirection: (entryDir) => (entryDir === Direction.UP ? Direction.UP : null),
  },
  [PipeType.RESERVOIR_HORIZONTAL]: {
    allowedInputs: [Direction.RIGHT, Direction.LEFT],
    isReservoir: true,
    getExitDirection: (entryDir) => {
      if (entryDir === Direction.RIGHT) return Direction.RIGHT;
      if (entryDir === Direction.LEFT) return Direction.LEFT;
      return null;
    },
  },
  [PipeType.RESERVOIR_VERTICAL]: {
    allowedInputs: [Direction.DOWN, Direction.UP],
    isReservoir: true,
    getExitDirection: (entryDir) => {
      if (entryDir === Direction.DOWN) return Direction.DOWN;
      if (entryDir === Direction.UP) return Direction.UP;
      return null;
    },
  },
};

export interface GridCell {
  col: number;
  row: number;
  type: PipeType;
  isPreset: boolean; // Golden bolted preset pipe
  isFlooded: boolean; // Completely filled
  isFlooding: boolean; // Currently filling (0% -> 100%)
  fillProgress: number; // 0.0 to 1.0
  entryDir: Direction; // Direction liquid entered from
  exitDir: Direction; // Direction liquid exits to

  // For Cross Pipe dual flow tracking
  crossHorizontalFlooded?: boolean;
  crossVerticalFlooded?: boolean;
  crossHorizontalProgress?: number;
  crossVerticalProgress?: number;

  // Start / End metadata
  startOutflowDir?: Direction;
  endInflowDir?: Direction;
}
