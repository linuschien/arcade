import { describe, it, expect, beforeEach } from 'vitest';
import { PacmanMaze, TileType, MAZE_COLS, MAZE_ROWS, TUNNEL_ROW } from '../logic/PacmanMaze';

describe('PacmanMaze Unit Tests', () => {
  let maze: PacmanMaze;

  beforeEach(() => {
    maze = new PacmanMaze();
  });

  it('should initialize grid with 244 total pellets', () => {
    const grid = maze.getGrid();
    expect(grid.length).toBe(MAZE_ROWS);
    expect(grid[0].length).toBe(MAZE_COLS);
    expect(maze.getInitialPelletCount()).toBe(244);
    expect(maze.getRemainingPelletCount()).toBe(244);
  });

  it('should calculate tile to world and world to tile coordinates accurately', () => {
    const world = PacmanMaze.tileToWorld(13, 29, 20);
    expect(world.x).toBe(13.5 * 20); // 270
    expect(world.y).toBe(29.5 * 20); // 590

    const tile = PacmanMaze.worldToTile(world.x, world.y, 20);
    expect(tile.col).toBe(13);
    expect(tile.row).toBe(29);
  });

  it('should detect wall collisions and ghost gate rules', () => {
    // Outer border at row 2 is wall
    expect(maze.isWall(0, 2)).toBe(true);
    // Open path tile
    expect(maze.isWall(1, 3)).toBe(false);
    // Tunnel row horizontal wrap
    expect(maze.isWall(-1, TUNNEL_ROW)).toBe(false);
    expect(maze.isWall(MAZE_COLS, TUNNEL_ROW)).toBe(false);
  });

  it('should wrap tunnel column indices correctly', () => {
    expect(PacmanMaze.wrapTunnelCol(-1)).toBe(MAZE_COLS - 1);
    expect(PacmanMaze.wrapTunnelCol(MAZE_COLS)).toBe(0);
    expect(PacmanMaze.wrapTunnelCol(10)).toBe(10);
  });

  it('should consume pellets and update pellet counters', () => {
    // Tile (1, 3) is a pellet
    const initialRemaining = maze.getRemainingPelletCount();
    const consumed = maze.consumePellet(1, 3);

    expect(consumed).toBe(TileType.PELLET);
    expect(maze.getRemainingPelletCount()).toBe(initialRemaining - 1);
    expect(maze.getEatenPelletCount()).toBe(1);

    // Consuming empty tile returns EMPTY
    const emptyConsumed = maze.consumePellet(1, 3);
    expect(emptyConsumed).toBe(TileType.EMPTY);
    expect(maze.getRemainingPelletCount()).toBe(initialRemaining - 1);
  });
});
