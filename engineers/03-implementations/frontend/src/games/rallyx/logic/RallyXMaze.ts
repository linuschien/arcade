/**
 * RallyXMaze.ts
 * Authentic 1981 Namco Arcade New Rally-X Level & Maze Specifications.
 * Inner Playable Area: 32 columns x 56 rows (1,792 tiles).
 * Outer Decorative Border: 3 tiles wide on all sides (Total World: 38 cols x 62 rows).
 * Defines 4 Master Mazes in ASCII format and the complete 16-Round specification.
 */

export enum RallyXTileType {
  EMPTY = 0,
  WALL = 1,
  FLAG_REGULAR = 2,
  FLAG_SPECIAL = 3, // "S" Flag (Double Score Multiplier)
  FLAG_LUCKY = 4,   // "L" Flag (Fuel Bonus & Restore Tank)
  ROCK = 5,
  PLAYER_SPAWN = 6,
  ENEMY_SPAWN = 7,
  BORDER_DECORATIVE = 8, // Outer 3-cell decorative border frame
}

export interface GridPos {
  col: number;
  row: number;
}

export enum Direction {
  NONE = "NONE",
  UP = "UP",
  DOWN = "DOWN",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
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

// Relative turning directions from vehicle's heading
export const RELATIVE_CLOCKWISE_DIRECTIONS: Record<Direction, Direction> = {
  [Direction.NONE]: Direction.NONE,
  [Direction.UP]: Direction.RIGHT,
  [Direction.RIGHT]: Direction.DOWN,
  [Direction.DOWN]: Direction.LEFT,
  [Direction.LEFT]: Direction.UP,
};

export const RELATIVE_COUNTER_CLOCKWISE_DIRECTIONS: Record<Direction, Direction> = {
  [Direction.NONE]: Direction.NONE,
  [Direction.UP]: Direction.LEFT,
  [Direction.LEFT]: Direction.DOWN,
  [Direction.DOWN]: Direction.RIGHT,
  [Direction.RIGHT]: Direction.UP,
};

// Inner playable maze dimensions (authentic arcade grid)
export const RALLYX_INNER_MAZE_COLS = 32;
export const RALLYX_INNER_MAZE_ROWS = 56;

// Outer decorative border frame dimensions (3 tiles wide on all 4 sides)
export const RALLYX_BORDER_WIDTH = 3;
export const RALLYX_TOTAL_COLS = RALLYX_INNER_MAZE_COLS + RALLYX_BORDER_WIDTH * 2; // 38
export const RALLYX_TOTAL_ROWS = RALLYX_INNER_MAZE_ROWS + RALLYX_BORDER_WIDTH * 2; // 62
export const RALLYX_TILE_SIZE = 24;

// Standard maze dimensions alias
export const RALLYX_MAZE_COLS = RALLYX_INNER_MAZE_COLS;
export const RALLYX_MAZE_ROWS = RALLYX_INNER_MAZE_ROWS;

// Native arcade resolution and viewport partitioning (1980/1981 Namco hardware: 288x224)
export const RALLYX_ARCADE_SCREEN_WIDTH = 288;         // Total screen width in pixels (36 chars @ 8px)
export const RALLYX_ARCADE_SCREEN_HEIGHT = 224;        // Total screen height in pixels (28 chars @ 8px)
export const RALLYX_PLAYFIELD_VIEWPORT_WIDTH = 224;    // Square scrolling playfield (28 chars @ 8px, ~9.33 tiles)
export const RALLYX_PLAYFIELD_VIEWPORT_HEIGHT = 224;   // Square scrolling playfield (28 chars @ 8px, ~9.33 tiles)
export const RALLYX_RADAR_PANEL_WIDTH = 64;            // Right sidebar radar & HUD (8 chars @ 8px)
export const RALLYX_RADAR_PANEL_HEIGHT = 224;          // Full height right sidebar HUD

// Clean integer tile viewport configuration (10x10 tiles @ 24px = 240x240 px, paired with 80px radar for 320x240 4:3 QVGA)
export const RALLYX_VIEWPORT_TILES_X = 10;
export const RALLYX_VIEWPORT_TILES_Y = 10;
export const RALLYX_INTEGER_VIEWPORT_WIDTH = RALLYX_VIEWPORT_TILES_X * RALLYX_TILE_SIZE; // 240 px
export const RALLYX_INTEGER_VIEWPORT_HEIGHT = RALLYX_VIEWPORT_TILES_Y * RALLYX_TILE_SIZE; // 240 px
export const RALLYX_INTEGER_RADAR_WIDTH = 80; // 80 px (1/3 of playfield)
export const RALLYX_INTEGER_SCREEN_WIDTH = RALLYX_INTEGER_VIEWPORT_WIDTH + RALLYX_INTEGER_RADAR_WIDTH; // 320 px (Classic 4:3)
export const RALLYX_INTEGER_SCREEN_HEIGHT = 240; // 240 px

export type FlagType = "REGULAR" | "SPECIAL" | "LUCKY";

export interface FlagSpec {
  col: number;
  row: number;
  type: FlagType;
}

export interface RallyXLevelConfig {
  round: number;
  mazeIndex: number; // 0=Maze1(Green), 1=Maze2(Red), 2=Maze3(Cyan), 3=Maze4(Grey)
  mazeName: string;
  isChallengingStage: boolean;
  playerStart: GridPos;
  enemySpawns: GridPos[];
  rocks: GridPos[];
  flags: FlagSpec[];
}

/**
 * Master Maze 1 (Green / Geometric Vortex) (32 cols x 56 rows)
 * "#" = Wall, " " = Pathway corridor
 */
export const RALLYX_MAZE_1_ASCII: string[] = [
  "               ########         ", // Row  0
  " ### ##### ##      #### ####### ", // Row  1
  " ### ##### ##   #  ####         ", // Row  2
  "                #       ### ### ", // Row  3
  " ###### #####      #### ### ### ", // Row  4
  "               ### ####         ", // Row  5
  "    ###### # ##### #### ####### ", // Row  6
  "# # #    # # ###                ", // Row  7
  "# # # ## # # ### ### ######### #", // Row  8
  "# # # ## # # ### ### #       # #", // Row  9
  "# # #    # #     ### #       # #", // Row 10
  "  # #    # # ### ### # ##### # #", // Row 11
  " ## #    # # ### ### # ##### # #", // Row 12
  " ## #    # #         #       # #", // Row 13
  "    #      # ### ##  ###  #### #", // Row 14
  " ## # ###### ### ##  ###  #### #", // Row 15
  " ##          ### ##  ###  ####  ", // Row 16
  " ########### ###                ", // Row 17
  "      ##                 ### ## ", // Row 18
  " #### ## #######  ###### ### ## ", // Row 19
  " ####        ###  ######     ## ", // Row 20
  " #### ## ### ###      ## ###  # ", // Row 21
  "      ## ###      ##  ## ###  # ", // Row 22
  "# ###### #######  ##  ## #### # ", // Row 23
  "#                 ##          # ", // Row 24
  "# ###### #######  ###### #### # ", // Row 25
  "# ###### #######  ###### #### # ", // Row 26
  "#                               ", // Row 27
  "# ### ## #### ##  ### ## #### # ", // Row 28
  "# ### ## #### ##  ### ## #### # ", // Row 29
  "# ### ## ##           ## ##   # ", // Row 30
  "# ### ## ## # ##  ### ## ## # # ", // Row 31
  "#             ##  ###    ## # # ", // Row 32
  "# ## ### #### ##      ##    #   ", // Row 33
  "  ## ### #### ##  ### ## #####  ", // Row 34
  "           ## ##  ### ## #####  ", // Row 35
  "  #### ###                      ", // Row 36
  "  #### ###                      ", // Row 37
  "         ### ## ### #### ## ##  ", // Row 38
  "  ## ### ### ## ### #### ## ##  ", // Row 39
  "  ## ### ###        #### ## ##  ", // Row 40
  "  ## ### ### ## ###      ##     ", // Row 41
  "  ##         ##     # ## ## ##  ", // Row 42
  "  ## ##### #### ### # ## ## ##  ", // Row 43
  "  ## ##### #### ### # ## ## ##  ", // Row 44
  "                    #       ##  ", // Row 45
  "## ### ## ##### ### # ## ## ##  ", // Row 46
  "## ### ## ##### ### # ## ## ##  ", // Row 47
  "##                    ## ## ##  ", // Row 48
  "## ### ## # # # # # # ## ## ##  ", // Row 49
  "## ### ## # # # # # # ##        ", // Row 50
  "    ##    # # # # # #    #####  ", // Row 51
  " ##    ## # # # # # # ## #####  ", // Row 52
  " ## ##### # # # # # # ##    ##  ", // Row 53
  " ## ##### # # # # # # ## ## ##  ", // Row 54
  "                         ##     ", // Row 55
];

/**
 * Master Maze 2 (Red / Mud Circuit) (32 cols x 56 rows)
 * "#" = Wall, " " = Pathway corridor
 */
export const RALLYX_MAZE_2_ASCII: string[] = [
  "#############                   ", // Row  0
  "#           # # # # ###### #### ", // Row  1
  "# #### #### # # # # ###### #### ", // Row  2
  "# #       # # # # #           # ", // Row  3
  "# # ## ## # # # # # ### ## ## # ", // Row  4
  "# # #   # # # # # # ### ## ## # ", // Row  5
  "# # #   # # #                   ", // Row  6
  "# # # # # # # # ## ## ####### # ", // Row  7
  "# # # # # # # # ## ## #       # ", // Row  8
  "#   # # #     # ## ## # ##### # ", // Row  9
  "# # # # # # # # ## ## # #     # ", // Row 10
  "# # #   # # #           # ### # ", // Row 11
  "# # #   # # # # ## ## # #     # ", // Row 12
  "# # ## ## # # # ## ## # ##### # ", // Row 13
  "# #       # # # ## ## #       # ", // Row 14
  "# ######### # # ## ## ####### # ", // Row 15
  "#           #                   ", // Row 16
  "###### ###### # ## ## ## #### # ", // Row 17
  "              # ## ## ## #### # ", // Row 18
  "# # ## #### ### ##            # ", // Row 19
  "# # ## #### ### ##### #### ## # ", // Row 20
  "# # ## #### ### ##### #### ## # ", // Row 21
  "# # ## #### ### ##### #### ## # ", // Row 22
  "  #                   #### ## # ", // Row 23
  "  # ### #### #####              ", // Row 24
  "  # ### ##     #                ", // Row 25
  "  #     ## ### # #### ### ##### ", // Row 26
  "  # ### ## ### # #### ### ##### ", // Row 27
  "  # ### ## ###   #### ### ##### ", // Row 28
  "                 ###   ## ##    ", // Row 29
  "  # ### ######   ### # ## ## ## ", // Row 30
  "  # ### ######   ### # ## ## ## ", // Row 31
  "  # #     ####               ## ", // Row 32
  "    #     ####   ### # ## ## ## ", // Row 33
  "  # #  ## ####   ### # ## ## ## ", // Row 34
  "  # #  ## ####   ###   ## ##    ", // Row 35
  "  # #            #### ### ##### ", // Row 36
  "  # ####### ##   #### ### ##### ", // Row 37
  "            ##   ####           ", // Row 38
  " ## ## ## # ##   #### ######### ", // Row 39
  " ## ## ## #           ##        ", // Row 40
  "            ### ## ## ## ### ## ", // Row 41
  " ## ## ## # ###    ##        ## ", // Row 42
  " ## ## ## # ### ##### ######### ", // Row 43
  "          #                     ", // Row 44
  " ## ## ## # ### ### ##### ### ##", // Row 45
  " ## ## ## # ### ### ##### ### ##", // Row 46
  "                      ### ### ##", // Row 47
  "### #### ## # # # # #           ", // Row 48
  "### ####  # # # # # # ### ##### ", // Row 49
  "### ##### # # # # # #           ", // Row 50
  "       ## # # # # # # ###### ## ", // Row 51
  " ## ## ## # # # # # # #      ## ", // Row 52
  " ## ##                # #### ## ", // Row 53
  " ## ## ## ##### ##### # #### ## ", // Row 54
  "                        ####    ", // Row 55
];

/**
 * Master Maze 3 (Cyan / Waterway Matrix) (32 cols x 56 rows)
 * "#" = Wall, " " = Pathway corridor
 */
export const RALLYX_MAZE_3_ASCII: string[] = [
  "                    ###         ", // Row  0
  "  ###### #### # # # ### ### ### ", // Row  1
  "  #      #### # # #     ###     ", // Row  2
  "  #      #### # # # ### ### ### ", // Row  3
  "  #           # # # ###     ### ", // Row  4
  "  ######## ## # # # ##### ##### ", // Row  5
  "    ###### ##       ##### ##### ", // Row  6
  "  # ###### #### ###             ", // Row  7
  "  #             ### ##### ##  # ", // Row  8
  "  # ## ### #### ### ##### ##  # ", // Row  9
  "  # ## ### ####           ##  # ", // Row 10
  "       ### #### # # ##### ##  # ", // Row 11
  " ##### ### #### # # ##### ##  # ", // Row 12
  " ##### ###      # # ##### ##    ", // Row 13
  " ##### ### #### # # ##        # ", // Row 14
  " ##### ### #### # # ## #####  # ", // Row 15
  "           #### # # ## #####  # ", // Row 16
  " ##### ### #### # # ## #####  # ", // Row 17
  " ##### ### #### # # ## #####  # ", // Row 18
  " ##### ###                      ", // Row 19
  " ##### ##### ##     #### ## ##  ", // Row 20
  " ##       ## ########### ## ##  ", // Row 21
  " ##  ###  ## #         # ## ## #", // Row 22
  "     ###     # ##  ### # ## ## #", // Row 23
  " ##       ## #         # ##    #", // Row 24
  " ##### ##### # ##  ### # ##### #", // Row 25
  " ##### ##### #         # ##### #", // Row 26
  " ##### ##### ####  #####        ", // Row 27
  "             ####  ##### #####  ", // Row 28
  "             ####  ##### #####  ", // Row 29
  "### ## ## ##                    ", // Row 30
  "### ## ## ##                    ", // Row 31
  "### ## ## ## ##### #### ####### ", // Row 32
  "    ## ##    ##### #### ####### ", // Row 33
  " ##### #### ###### ####    #### ", // Row 34
  " ##### #### ####     ## ## #### ", // Row 35
  "                 ### ## ##   ## ", // Row 36
  " ##### #### #### ###    #### ## ", // Row 37
  " ##### #### ####     ## ####    ", // Row 38
  "    ## ##   #### ### ## ####### ", // Row 39
  " ## ## ## ###    ### ## ####### ", // Row 40
  " ## ## ##     ##                ", // Row 41
  " ## ## ## ## ### #### #### #### ", // Row 42
  " ##       ## ### #### #### #### ", // Row 43
  " ##### ## #        ## #### #### ", // Row 44
  " ##### ##   ### ## ##           ", // Row 45
  "            ### ## ## ######### ", // Row 46
  " ######## #                     ", // Row 47
  " ######## # # # # # # ### ##### ", // Row 48
  " ###      # # # # # # #   #   # ", // Row 49
  " ### #### # # # # # # # # # # # ", // Row 50
  "     #### # # # # # # # # # # # ", // Row 51
  " ######## # # # # # # # # # # # ", // Row 52
  " ###                  # #     # ", // Row 53
  " ### #### ####### ### # ##### # ", // Row 54
  "     ####                       ", // Row 55
];

/**
 * Master Maze 4 (Grey / Industrial Ruins) (32 cols x 56 rows)
 * "#" = Wall, " " = Pathway corridor
 */
export const RALLYX_MAZE_4_ASCII: string[] = [
  "                                ", // Row  0
  " ####### ####      ### ######## ", // Row  1
  "   ##### ####      ### ######## ", // Row  2
  " #  #### ####      ###          ", // Row  3
  " ##  ### #### #  # #### #### #  ", // Row  4
  " ###       ## #  # #### #### #  ", // Row  5
  " #### #### ## #  # #### #### #  ", // Row  6
  " #### ###     #  #       ### #  ", // Row  7
  " #### ### ### #  # ##### ### #  ", // Row  8
  " #### ###  ## #  # ##### ### #  ", // Row  9
  "      #### ## #  # ##### ### #  ", // Row 10
  " ### ##### ##      #####     #  ", // Row 11
  " ###       ####  ######## ## #  ", // Row 12
  " ##### ### ####  ######## ## #  ", // Row 13
  " ##### ### #        ##### ## #  ", // Row 14
  " ##### ### #        ##### ##    ", // Row 15
  " ##### ### #  ####  ##### ##### ", // Row 16
  "              ####              ", // Row 17
  "              ####       # #### ", // Row 18
  "## ### #####  ####  ## #   #### ", // Row 19
  "## ### #####        ## ### #### ", // Row 20
  "## ### #####        #    #    # ", // Row 21
  "           ####  #### ## #### # ", // Row 22
  "## ### ### ####  ##   ##        ", // Row 23
  "## ### ### ####  ## ###### ## # ", // Row 24
  "## ### ### ####  ## ###    ## # ", // Row 25
  "##               ## ### ##### # ", // Row 26
  "## ### ### # ##  ## ### ##### # ", // Row 27
  "## ### ### # ##  ## ### ##### # ", // Row 28
  "    ## ### # ##  ## ### ##### # ", // Row 29
  " ##                     ####    ", // Row 30
  " ##         ###  ## ### #### ## ", // Row 31
  " ## ####### ###  ## ### ####    ", // Row 32
  "  #         ###  ## ### #### ###", // Row 33
  "  #  ###    ###  ## ##    ## ###", // Row 34
  "  #         ###  ## ## ##    ###", // Row 35
  "  # ####         ## ## ## ######", // Row 36
  "       #  # ###        ## ######", // Row 37
  "  # ## #  # ###  ## ##          ", // Row 38
  "  # ## #  # ###  ## ## ## ##### ", // Row 39
  "  #  # #  # ###  ## ## ## ###   ", // Row 40
  "  ## # #  # ###  ##       ### # ", // Row 41
  "  ## # #  # ###  ## ## ## ### # ", // Row 42
  " ###   #  # ###  ## ## ##       ", // Row 43
  " ##### #  # ###  ## ##### ##### ", // Row 44
  " ##### #  # ###  ## ##### #   # ", // Row 45
  " #                          # # ", // Row 46
  " # # # #  # # # # # # ## ## # # ", // Row 47
  " # # # #  # # # # # # ## ## # # ", // Row 48
  "   # # #  # # # # # # ## ##   # ", // Row 49
  " ### # #  # # # # # # ## ## # # ", // Row 50
  "     # #  # # # # # # ## ## # # ", // Row 51
  " ##### #  #           ## ## # # ", // Row 52
  " ##### #  # ######### ## ##     ", // Row 53
  "       #  # #########    ###### ", // Row 54
  "                                ", // Row 55
];

export const RALLYX_MASTER_MAZES: string[][] = [
  RALLYX_MAZE_1_ASCII,
  RALLYX_MAZE_2_ASCII,
  RALLYX_MAZE_3_ASCII,
  RALLYX_MAZE_4_ASCII,
];

/**
 * Full 16-Round Level Configurations (4x4 Symmetric Matrix, 1:1 Mapping to MazeDeathRallyX.png).
 * Every level features authentic car garage spawns, fixed rocks, and 10 flags (including 1 Special and 1 Lucky flag).
 * All entity coordinates are defined within the 32x56 inner playable grid.
 */
export const RALLYX_LEVEL_CONFIGS: RallyXLevelConfig[] = [
  {
    round: 1,
    mazeIndex: 0,
    mazeName: "Maze 1 (Green / Geometric Vortex)",
    isChallengingStage: false,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 15, row: 52 }],
    rocks: [{ col: 8, row: 7 }, { col: 17, row: 30 }, { col: 30, row: 47 }, { col: 9, row: 50 }],
    flags: [
      { col: 6, row: 37, type: "SPECIAL" },
      { col: 24, row: 30, type: "LUCKY" },
      { col: 31, row: 6, type: "REGULAR" },
      { col: 16, row: 9, type: "REGULAR" },
      { col: 0, row: 11, type: "REGULAR" },
      { col: 26, row: 17, type: "REGULAR" },
      { col: 8, row: 29, type: "REGULAR" },
      { col: 1, row: 30, type: "REGULAR" },
      { col: 5, row: 52, type: "REGULAR" },
      { col: 10, row: 55, type: "REGULAR" },
    ],
  },
  {
    round: 2,
    mazeIndex: 0,
    mazeName: "Maze 1 (Green / Geometric Vortex)",
    isChallengingStage: false,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 13, row: 52 }, { col: 15, row: 52 }],
    rocks: [{ col: 10, row: 8 }, { col: 14, row: 24 }, { col: 30, row: 33 }, { col: 9, row: 48 }],
    flags: [
      { col: 24, row: 39, type: "SPECIAL" },
      { col: 8, row: 22, type: "LUCKY" },
      { col: 6, row: 3, type: "REGULAR" },
      { col: 13, row: 10, type: "REGULAR" },
      { col: 7, row: 14, type: "REGULAR" },
      { col: 0, row: 16, type: "REGULAR" },
      { col: 24, row: 25, type: "REGULAR" },
      { col: 0, row: 45, type: "REGULAR" },
      { col: 29, row: 50, type: "REGULAR" },
      { col: 5, row: 55, type: "REGULAR" },
    ],
  },
  {
    round: 3,
    mazeIndex: 0,
    mazeName: "Maze 1 (Green / Geometric Vortex)",
    isChallengingStage: true,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 15, row: 1 }, { col: 17, row: 1 }, { col: 11, row: 52 }, { col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }, { col: 19, row: 52 }],
    rocks: [{ col: 3, row: 5 }, { col: 27, row: 7 }, { col: 19, row: 39 }, { col: 4, row: 43 }, { col: 8, row: 51 }],
    flags: [
      { col: 29, row: 0, type: "SPECIAL" },
      { col: 3, row: 9, type: "LUCKY" },
      { col: 3, row: 3, type: "REGULAR" },
      { col: 12, row: 8, type: "REGULAR" },
      { col: 1, row: 11, type: "REGULAR" },
      { col: 7, row: 12, type: "REGULAR" },
      { col: 16, row: 26, type: "REGULAR" },
      { col: 28, row: 27, type: "REGULAR" },
      { col: 17, row: 30, type: "REGULAR" },
      { col: 31, row: 31, type: "REGULAR" },
    ],
  },
  {
    round: 4,
    mazeIndex: 0,
    mazeName: "Maze 1 (Green / Geometric Vortex)",
    isChallengingStage: false,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }],
    rocks: [{ col: 24, row: 17 }, { col: 1, row: 30 }, { col: 7, row: 35 }, { col: 11, row: 42 }, { col: 4, row: 48 }],
    flags: [
      { col: 8, row: 41, type: "SPECIAL" },
      { col: 12, row: 21, type: "LUCKY" },
      { col: 24, row: 0, type: "REGULAR" },
      { col: 26, row: 7, type: "REGULAR" },
      { col: 5, row: 13, type: "REGULAR" },
      { col: 25, row: 15, type: "REGULAR" },
      { col: 8, row: 22, type: "REGULAR" },
      { col: 26, row: 27, type: "REGULAR" },
      { col: 27, row: 39, type: "REGULAR" },
      { col: 24, row: 53, type: "REGULAR" },
    ],
  },
  {
    round: 5,
    mazeIndex: 1,
    mazeName: "Maze 2 (Red / Mud Circuit)",
    isChallengingStage: false,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }],
    rocks: [{ col: 13, row: 6 }, { col: 11, row: 14 }, { col: 6, row: 19 }, { col: 26, row: 20 }, { col: 6, row: 38 }, { col: 9, row: 49 }],
    flags: [
      { col: 21, row: 27, type: "SPECIAL" },
      { col: 5, row: 38, type: "LUCKY" },
      { col: 11, row: 5, type: "REGULAR" },
      { col: 13, row: 10, type: "REGULAR" },
      { col: 27, row: 14, type: "REGULAR" },
      { col: 3, row: 29, type: "REGULAR" },
      { col: 7, row: 32, type: "REGULAR" },
      { col: 29, row: 48, type: "REGULAR" },
      { col: 31, row: 49, type: "REGULAR" },
      { col: 31, row: 53, type: "REGULAR" },
    ],
  },
  {
    round: 6,
    mazeIndex: 1,
    mazeName: "Maze 2 (Red / Mud Circuit)",
    isChallengingStage: false,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 11, row: 52 }, { col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }],
    rocks: [{ col: 2, row: 1 }, { col: 19, row: 19 }, { col: 15, row: 21 }, { col: 1, row: 24 }, { col: 6, row: 35 }, { col: 10, row: 55 }],
    flags: [
      { col: 13, row: 3, type: "SPECIAL" },
      { col: 25, row: 31, type: "LUCKY" },
      { col: 11, row: 21, type: "REGULAR" },
      { col: 14, row: 25, type: "REGULAR" },
      { col: 1, row: 27, type: "REGULAR" },
      { col: 7, row: 27, type: "REGULAR" },
      { col: 25, row: 35, type: "REGULAR" },
      { col: 7, row: 36, type: "REGULAR" },
      { col: 11, row: 46, type: "REGULAR" },
      { col: 9, row: 50, type: "REGULAR" },
    ],
  },
  {
    round: 7,
    mazeIndex: 1,
    mazeName: "Maze 2 (Red / Mud Circuit)",
    isChallengingStage: true,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 15, row: 1 }, { col: 17, row: 1 }, { col: 11, row: 52 }, { col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }, { col: 19, row: 52 }],
    rocks: [{ col: 9, row: 1 }, { col: 21, row: 11 }, { col: 31, row: 19 }, { col: 15, row: 23 }, { col: 11, row: 29 }, { col: 0, row: 36 }, { col: 27, row: 40 }],
    flags: [
      { col: 23, row: 3, type: "SPECIAL" },
      { col: 21, row: 13, type: "LUCKY" },
      { col: 5, row: 7, type: "REGULAR" },
      { col: 13, row: 12, type: "REGULAR" },
      { col: 1, row: 15, type: "REGULAR" },
      { col: 17, row: 16, type: "REGULAR" },
      { col: 23, row: 16, type: "REGULAR" },
      { col: 4, row: 23, type: "REGULAR" },
      { col: 18, row: 23, type: "REGULAR" },
      { col: 14, row: 30, type: "REGULAR" },
    ],
  },
  {
    round: 8,
    mazeIndex: 1,
    mazeName: "Maze 2 (Red / Mud Circuit)",
    isChallengingStage: false,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 11, row: 52 }, { col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }],
    rocks: [{ col: 1, row: 3 }, { col: 29, row: 4 }, { col: 25, row: 11 }, { col: 5, row: 12 }, { col: 1, row: 22 }, { col: 22, row: 25 }, { col: 6, row: 53 }],
    flags: [
      { col: 24, row: 38, type: "SPECIAL" },
      { col: 16, row: 39, type: "LUCKY" },
      { col: 31, row: 15, type: "REGULAR" },
      { col: 13, row: 23, type: "REGULAR" },
      { col: 14, row: 23, type: "REGULAR" },
      { col: 21, row: 27, type: "REGULAR" },
      { col: 5, row: 33, type: "REGULAR" },
      { col: 2, row: 47, type: "REGULAR" },
      { col: 21, row: 50, type: "REGULAR" },
      { col: 22, row: 55, type: "REGULAR" },
    ],
  },
  {
    round: 9,
    mazeIndex: 2,
    mazeName: "Maze 3 (Cyan / Waterway Matrix)",
    isChallengingStage: false,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 11, row: 52 }, { col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }, { col: 19, row: 52 }],
    rocks: [{ col: 13, row: 5 }, { col: 28, row: 17 }, { col: 24, row: 31 }, { col: 3, row: 33 }, { col: 13, row: 36 }, { col: 23, row: 39 }, { col: 2, row: 46 }, { col: 3, row: 46 }],
    flags: [
      { col: 18, row: 32, type: "SPECIAL" },
      { col: 4, row: 2, type: "LUCKY" },
      { col: 31, row: 11, type: "REGULAR" },
      { col: 28, row: 12, type: "REGULAR" },
      { col: 12, row: 26, type: "REGULAR" },
      { col: 17, row: 30, type: "REGULAR" },
      { col: 16, row: 41, type: "REGULAR" },
      { col: 8, row: 46, type: "REGULAR" },
      { col: 4, row: 53, type: "REGULAR" },
      { col: 29, row: 54, type: "REGULAR" },
    ],
  },
  {
    round: 10,
    mazeIndex: 2,
    mazeName: "Maze 3 (Cyan / Waterway Matrix)",
    isChallengingStage: false,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 11, row: 52 }, { col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }, { col: 19, row: 52 }],
    rocks: [{ col: 13, row: 5 }, { col: 28, row: 13 }, { col: 31, row: 19 }, { col: 6, row: 29 }, { col: 11, row: 38 }, { col: 30, row: 38 }, { col: 25, row: 50 }, { col: 31, row: 50 }, { col: 31, row: 55 }],
    flags: [
      { col: 24, row: 22, type: "SPECIAL" },
      { col: 4, row: 2, type: "LUCKY" },
      { col: 4, row: 3, type: "REGULAR" },
      { col: 31, row: 10, type: "REGULAR" },
      { col: 29, row: 11, type: "REGULAR" },
      { col: 9, row: 22, type: "REGULAR" },
      { col: 12, row: 28, type: "REGULAR" },
      { col: 21, row: 44, type: "REGULAR" },
      { col: 26, row: 47, type: "REGULAR" },
      { col: 9, row: 55, type: "REGULAR" },
    ],
  },
  {
    round: 11,
    mazeIndex: 2,
    mazeName: "Maze 3 (Cyan / Waterway Matrix)",
    isChallengingStage: true,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 15, row: 1 }, { col: 17, row: 1 }, { col: 11, row: 52 }, { col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }, { col: 19, row: 52 }],
    rocks: [{ col: 4, row: 0 }, { col: 7, row: 3 }, { col: 17, row: 11 }, { col: 7, row: 21 }, { col: 22, row: 25 }, { col: 17, row: 27 }, { col: 12, row: 28 }, { col: 23, row: 38 }, { col: 13, row: 41 }, { col: 20, row: 53 }],
    flags: [
      { col: 30, row: 19, type: "SPECIAL" },
      { col: 23, row: 35, type: "LUCKY" },
      { col: 25, row: 7, type: "REGULAR" },
      { col: 3, row: 8, type: "REGULAR" },
      { col: 25, row: 14, type: "REGULAR" },
      { col: 18, row: 19, type: "REGULAR" },
      { col: 30, row: 25, type: "REGULAR" },
      { col: 25, row: 27, type: "REGULAR" },
      { col: 20, row: 36, type: "REGULAR" },
      { col: 7, row: 49, type: "REGULAR" },
    ],
  },
  {
    round: 12,
    mazeIndex: 2,
    mazeName: "Maze 3 (Cyan / Waterway Matrix)",
    isChallengingStage: false,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 15, row: 1 }, { col: 11, row: 52 }, { col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }, { col: 19, row: 52 }],
    rocks: [{ col: 2, row: 0 }, { col: 31, row: 0 }, { col: 23, row: 4 }, { col: 18, row: 10 }, { col: 29, row: 10 }, { col: 28, row: 19 }, { col: 16, row: 20 }, { col: 2, row: 28 }, { col: 8, row: 28 }, { col: 17, row: 31 }],
    flags: [
      { col: 24, row: 28, type: "SPECIAL" },
      { col: 3, row: 42, type: "LUCKY" },
      { col: 28, row: 13, type: "REGULAR" },
      { col: 17, row: 15, type: "REGULAR" },
      { col: 15, row: 18, type: "REGULAR" },
      { col: 20, row: 30, type: "REGULAR" },
      { col: 23, row: 31, type: "REGULAR" },
      { col: 3, row: 40, type: "REGULAR" },
      { col: 6, row: 46, type: "REGULAR" },
      { col: 20, row: 55, type: "REGULAR" },
    ],
  },
  {
    round: 13,
    mazeIndex: 3,
    mazeName: "Maze 4 (Grey / Industrial Ruins)",
    isChallengingStage: false,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 15, row: 1 }, { col: 11, row: 52 }, { col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }, { col: 19, row: 52 }],
    rocks: [{ col: 18, row: 0 }, { col: 1, row: 2 }, { col: 13, row: 8 }, { col: 16, row: 14 }, { col: 7, row: 22 }, { col: 18, row: 30 }, { col: 16, row: 33 }, { col: 25, row: 34 }, { col: 19, row: 37 }, { col: 11, row: 45 }],
    flags: [
      { col: 23, row: 55, type: "SPECIAL" },
      { col: 9, row: 9, type: "LUCKY" },
      { col: 12, row: 21, type: "REGULAR" },
      { col: 26, row: 24, type: "REGULAR" },
      { col: 19, row: 31, type: "REGULAR" },
      { col: 23, row: 32, type: "REGULAR" },
      { col: 30, row: 38, type: "REGULAR" },
      { col: 24, row: 41, type: "REGULAR" },
      { col: 22, row: 43, type: "REGULAR" },
      { col: 1, row: 51, type: "REGULAR" },
    ],
  },
  {
    round: 14,
    mazeIndex: 3,
    mazeName: "Maze 4 (Grey / Industrial Ruins)",
    isChallengingStage: false,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 15, row: 1 }, { col: 17, row: 1 }, { col: 11, row: 52 }, { col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }, { col: 19, row: 52 }],
    rocks: [{ col: 21, row: 17 }, { col: 1, row: 22 }, { col: 9, row: 22 }, { col: 20, row: 23 }, { col: 28, row: 23 }, { col: 27, row: 35 }, { col: 14, row: 36 }, { col: 6, row: 40 }, { col: 6, row: 52 }, { col: 27, row: 52 }],
    flags: [
      { col: 10, row: 15, type: "SPECIAL" },
      { col: 3, row: 54, type: "LUCKY" },
      { col: 10, row: 16, type: "REGULAR" },
      { col: 6, row: 23, type: "REGULAR" },
      { col: 26, row: 24, type: "REGULAR" },
      { col: 16, row: 37, type: "REGULAR" },
      { col: 0, row: 38, type: "REGULAR" },
      { col: 1, row: 42, type: "REGULAR" },
      { col: 0, row: 54, type: "REGULAR" },
      { col: 15, row: 55, type: "REGULAR" },
    ],
  },
  {
    round: 15,
    mazeIndex: 3,
    mazeName: "Maze 4 (Grey / Industrial Ruins)",
    isChallengingStage: true,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 15, row: 1 }, { col: 17, row: 1 }, { col: 11, row: 52 }, { col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }, { col: 19, row: 52 }],
    rocks: [{ col: 18, row: 4 }, { col: 12, row: 18 }, { col: 26, row: 25 }, { col: 5, row: 26 }, { col: 16, row: 33 }, { col: 15, row: 38 }, { col: 0, row: 48 }, { col: 8, row: 48 }, { col: 0, row: 50 }, { col: 27, row: 55 }],
    flags: [
      { col: 18, row: 7, type: "SPECIAL" },
      { col: 24, row: 8, type: "LUCKY" },
      { col: 6, row: 0, type: "REGULAR" },
      { col: 28, row: 5, type: "REGULAR" },
      { col: 12, row: 7, type: "REGULAR" },
      { col: 5, row: 9, type: "REGULAR" },
      { col: 10, row: 23, type: "REGULAR" },
      { col: 10, row: 25, type: "REGULAR" },
      { col: 15, row: 26, type: "REGULAR" },
      { col: 11, row: 30, type: "REGULAR" },
    ],
  },
  {
    round: 16,
    mazeIndex: 3,
    mazeName: "Maze 4 (Grey / Industrial Ruins)",
    isChallengingStage: false,
    playerStart: { col: 15, row: 49 },
    enemySpawns: [{ col: 15, row: 1 }, { col: 17, row: 1 }, { col: 11, row: 52 }, { col: 13, row: 52 }, { col: 15, row: 52 }, { col: 17, row: 52 }, { col: 19, row: 52 }],
    rocks: [{ col: 24, row: 0 }, { col: 0, row: 3 }, { col: 31, row: 9 }, { col: 2, row: 10 }, { col: 15, row: 27 }, { col: 17, row: 30 }, { col: 15, row: 31 }, { col: 4, row: 34 }, { col: 8, row: 47 }, { col: 9, row: 50 }, { col: 3, row: 55 }],
    flags: [
      { col: 31, row: 22, type: "SPECIAL" },
      { col: 26, row: 19, type: "LUCKY" },
      { col: 31, row: 3, type: "REGULAR" },
      { col: 10, row: 5, type: "REGULAR" },
      { col: 23, row: 5, type: "REGULAR" },
      { col: 28, row: 17, type: "REGULAR" },
      { col: 5, row: 35, type: "REGULAR" },
      { col: 4, row: 37, type: "REGULAR" },
      { col: 31, row: 38, type: "REGULAR" },
      { col: 21, row: 46, type: "REGULAR" },
    ],
  },
];

/**
 * Retrieves the Level Configuration for any given round (handles Round 1..16 and Round 17+ Endless Loop).
 */
export function getRallyXLevelConfig(round: number): RallyXLevelConfig {
  const clampedRound = Math.max(1, round);
  if (clampedRound <= 16) {
    return RALLYX_LEVEL_CONFIGS[clampedRound - 1];
  }
  // Round 17+ Endless Loop: Cycle master maze every 4 rounds, lock enemies to 7 cars
  const loopIndex = (clampedRound - 1) % 16;
  const baseConfig = RALLYX_LEVEL_CONFIGS[loopIndex];
  return {
    ...baseConfig,
    round: clampedRound,
    isChallengingStage: (clampedRound % 4 === 3),
    enemySpawns: RALLYX_LEVEL_CONFIGS[15].enemySpawns, // Full 7 cars in endless loop
  };
}

/**
 * Translates an inner grid coordinate to full world coordinate (including 3-tile decorative border).
 */
export function innerToWorldTile(pos: GridPos): GridPos {
  return { col: pos.col + RALLYX_BORDER_WIDTH, row: pos.row + RALLYX_BORDER_WIDTH };
}

/**
 * Translates a full world coordinate to inner grid coordinate.
 */
export function worldToInnerTile(pos: GridPos): GridPos {
  return { col: pos.col - RALLYX_BORDER_WIDTH, row: pos.row - RALLYX_BORDER_WIDTH };
}

/**
 * Builds a 2D tile matrix for a given round.
 * @param round Round number (1..16, or 17+ for endless loop).
 * @param includeBorder If true, returns 62x38 matrix wrapped with 3-tile decorative border frame.
 *                      If false (default), returns 56x32 inner playable matrix.
 */
export function buildRallyXTileMatrix(round: number, includeBorder = false): RallyXTileType[][] {
  const config = getRallyXLevelConfig(round);
  const asciiMap = RALLYX_MASTER_MAZES[config.mazeIndex];

  if (!includeBorder) {
    const matrix: RallyXTileType[][] = [];
    for (let r = 0; r < RALLYX_INNER_MAZE_ROWS; r++) {
      const row: RallyXTileType[] = [];
      const rowStr = asciiMap[r] || "";
      for (let c = 0; c < RALLYX_INNER_MAZE_COLS; c++) {
        row.push(rowStr[c] === "#" ? RallyXTileType.WALL : RallyXTileType.EMPTY);
      }
      matrix.push(row);
    }

    // Bake Rocks
    for (const rock of config.rocks) {
      if (matrix[rock.row] && matrix[rock.row][rock.col] !== undefined) {
        matrix[rock.row][rock.col] = RallyXTileType.ROCK;
      }
    }

    // Bake Flags
    for (const flag of config.flags) {
      if (matrix[flag.row] && matrix[flag.row][flag.col] !== undefined) {
        const fType = flag.type === "SPECIAL"
          ? RallyXTileType.FLAG_SPECIAL
          : flag.type === "LUCKY"
          ? RallyXTileType.FLAG_LUCKY
          : RallyXTileType.FLAG_REGULAR;
        matrix[flag.row][flag.col] = fType;
      }
    }
    return matrix;
  }

  // Build 62x38 matrix with 3-tile decorative border frame
  const fullMatrix: RallyXTileType[][] = [];
  for (let r = 0; r < RALLYX_TOTAL_ROWS; r++) {
    const row: RallyXTileType[] = [];
    const isBorderRow = (r < RALLYX_BORDER_WIDTH || r >= RALLYX_TOTAL_ROWS - RALLYX_BORDER_WIDTH);
    for (let c = 0; c < RALLYX_TOTAL_COLS; c++) {
      const isBorderCol = (c < RALLYX_BORDER_WIDTH || c >= RALLYX_TOTAL_COLS - RALLYX_BORDER_WIDTH);
      if (isBorderRow || isBorderCol) {
        row.push(RallyXTileType.BORDER_DECORATIVE);
      } else {
        const innerR = r - RALLYX_BORDER_WIDTH;
        const innerC = c - RALLYX_BORDER_WIDTH;
        const char = asciiMap[innerR]?.[innerC] || "#";
        row.push(char === "#" ? RallyXTileType.WALL : RallyXTileType.EMPTY);
      }
    }
    fullMatrix.push(row);
  }

  // Bake Rocks with offset
  for (const rock of config.rocks) {
    const wr = rock.row + RALLYX_BORDER_WIDTH;
    const wc = rock.col + RALLYX_BORDER_WIDTH;
    if (fullMatrix[wr] && fullMatrix[wr][wc] !== undefined) {
      fullMatrix[wr][wc] = RallyXTileType.ROCK;
    }
  }

  // Bake Flags with offset
  for (const flag of config.flags) {
    const wr = flag.row + RALLYX_BORDER_WIDTH;
    const wc = flag.col + RALLYX_BORDER_WIDTH;
    if (fullMatrix[wr] && fullMatrix[wr][wc] !== undefined) {
      const fType = flag.type === "SPECIAL"
        ? RallyXTileType.FLAG_SPECIAL
        : flag.type === "LUCKY"
        ? RallyXTileType.FLAG_LUCKY
        : RallyXTileType.FLAG_REGULAR;
      fullMatrix[wr][wc] = fType;
    }
  }

  return fullMatrix;
}

/**
 * Verifies whether a given grid position is a solid wall or impassable boundary.
 */
export function isRallyXWall(matrix: RallyXTileType[][], col: number, row: number): boolean {
  const maxRows = matrix.length;
  const maxCols = matrix[0]?.length || 0;
  if (col < 0 || col >= maxCols || row < 0 || row >= maxRows) {
    return true;
  }
  const tile = matrix[row][col];
  return tile === RallyXTileType.WALL || tile === RallyXTileType.BORDER_DECORATIVE;
}

/**
 * Resolves the next moving direction for continuous cruise.
 * The car never stops:
 * 1. If requestedDir is non-NONE and walkable, take requestedDir.
 * 2. If currentDir is walkable, continue straight.
 * 3. If hitting an obstacle at a corner or intersection:
 *    - Search clockwise relative to current heading (+90° right turn first).
 *    - If blocked, search counter-clockwise (-90° left turn).
 * 4. If hitting a dead end (ahead, right, and left are all walls):
 *    - The remaining available path is 180° reverse, executing an automatic 180° U-turn!
 */
export function getRallyXNextDirection(
  matrix: RallyXTileType[][],
  col: number,
  row: number,
  currentDir: Direction,
  requestedDir: Direction = Direction.NONE
): Direction {
  const isWalkable = (dir: Direction) => {
    if (dir === Direction.NONE) return false;
    const vec = DIRECTION_VECTORS[dir];
    return !isRallyXWall(matrix, col + vec.col, row + vec.row);
  };

  // 1. Requested direction (if valid and walkable)
  if (requestedDir !== Direction.NONE && isWalkable(requestedDir)) {
    return requestedDir;
  }

  // 2. Continue current direction if walkable
  if (currentDir !== Direction.NONE && isWalkable(currentDir)) {
    return currentDir;
  }

  // 3. Auto-turn: Clockwise priority (+90° relative to vehicle heading)
  const cwDir = RELATIVE_CLOCKWISE_DIRECTIONS[currentDir];
  if (isWalkable(cwDir)) {
    return cwDir;
  }

  // 4. Auto-turn: Counter-clockwise (-90° relative to vehicle heading)
  const ccwDir = RELATIVE_COUNTER_CLOCKWISE_DIRECTIONS[currentDir];
  if (isWalkable(ccwDir)) {
    return ccwDir;
  }

  // 5. Dead end: auto 180° U-turn (the only open exit behind the car)
  const opposite = OPPOSITE_DIRECTIONS[currentDir];
  if (isWalkable(opposite)) {
    return opposite;
  }

  return currentDir;
}

