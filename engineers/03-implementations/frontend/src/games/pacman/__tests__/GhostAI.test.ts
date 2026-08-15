import { describe, it, expect } from 'vitest';
import { GhostAI, GhostType } from '../logic/GhostAI';
import { Direction, PacmanMaze, GridPos } from '../logic/PacmanMaze';

describe('GhostAI Unit Tests', () => {
  const pacmanPos: GridPos = { col: 10, row: 10 };
  const blinkyPos: GridPos = { col: 5, row: 5 };
  const clydePosNear: GridPos = { col: 12, row: 12 };
  const clydePosFar: GridPos = { col: 25, row: 25 };

  it('should calculate Blinky target (Direct Pursuit)', () => {
    const target = GhostAI.calculateTargetTile(
      GhostType.BLINKY,
      pacmanPos,
      Direction.RIGHT,
      blinkyPos,
      clydePosFar
    );
    expect(target).toEqual(pacmanPos);
  });

  it('should calculate Pinky target (4-Tile Ambush in facing direction)', () => {
    const targetRight = GhostAI.calculateTargetTile(
      GhostType.PINKY,
      pacmanPos,
      Direction.RIGHT,
      blinkyPos,
      clydePosFar
    );
    expect(targetRight).toEqual({ col: 14, row: 10 });

    const targetUp = GhostAI.calculateTargetTile(
      GhostType.PINKY,
      pacmanPos,
      Direction.UP,
      blinkyPos,
      clydePosFar
    );
    expect(targetUp).toEqual({ col: 10, row: 6 });
  });

  it('should calculate Inky target (Vector Intercept based on Blinky)', () => {
    const target = GhostAI.calculateTargetTile(
      GhostType.INKY,
      pacmanPos,
      Direction.RIGHT,
      blinkyPos,
      clydePosFar
    );
    expect(target).toEqual({ col: 19, row: 15 });
  });

  it('should calculate Clyde target based on 8-tile radius threshold', () => {
    // When distance > 8 tiles, target = Pacman
    const targetFar = GhostAI.calculateTargetTile(
      GhostType.CLYDE,
      pacmanPos,
      Direction.RIGHT,
      blinkyPos,
      clydePosFar
    );
    expect(targetFar).toEqual(pacmanPos);

    // When distance <= 8 tiles, target = Patrol Point (0, 35)
    const targetNear = GhostAI.calculateTargetTile(
      GhostType.CLYDE,
      pacmanPos,
      Direction.RIGHT,
      blinkyPos,
      clydePosNear
    );
    expect(targetNear).toEqual({ col: 0, row: 35 });
  });

  it('should select next direction avoiding 180-degree reverses', () => {
    const maze = new PacmanMaze();
    const currentPos: GridPos = { col: 1, row: 3 };
    const currentDir = Direction.RIGHT;
    const targetTile: GridPos = { col: 10, row: 3 };

    const nextDir = GhostAI.getNextDirection(maze, currentPos, currentDir, targetTile);
    expect(nextDir).not.toBe(Direction.LEFT);
  });

  it('should navigate eaten ghosts successfully from all corners to doorstep using BFS home map', () => {
    const maze = new PacmanMaze();
    const cornerStarts: GridPos[] = [
      { col: 1, row: 3 },   // Top-Left
      { col: 26, row: 3 },  // Top-Right
      { col: 1, row: 31 },  // Bottom-Left
      { col: 26, row: 31 }, // Bottom-Right
      { col: 0, row: 16 },  // Left Tunnel
      { col: 27, row: 16 }, // Right Tunnel
    ];

    for (const start of cornerStarts) {
      let currentPos = { ...start };
      let currentDir = Direction.NONE;
      let steps = 0;
      const maxSteps = 100;

      while (steps < maxSteps) {
        if (currentPos.row === 13 && (currentPos.col === 13 || currentPos.col === 14)) {
          // Successfully reached doorstep!
          break;
        }

        const nextDir = GhostAI.getNextDirection(
          maze,
          currentPos,
          currentDir,
          { col: 13, row: 13 },
          false,
          false,
          true
        );

        expect(nextDir).not.toBe(Direction.NONE);
        currentDir = nextDir;
        const vec = {
          NONE: { col: 0, row: 0 },
          UP: { col: 0, row: -1 },
          DOWN: { col: 0, row: 1 },
          LEFT: { col: -1, row: 0 },
          RIGHT: { col: 1, row: 0 },
        }[currentDir];

        let nextCol = currentPos.col + vec.col;
        let nextRow = currentPos.row + vec.row;
        if (nextRow === 16) {
          if (nextCol < 0) nextCol = 27;
          else if (nextCol >= 28) nextCol = 0;
        }

        currentPos = { col: nextCol, row: nextRow };
        steps++;
      }

      // Must reach doorstep within maxSteps without getting stuck in corners or loops
      expect(steps).toBeLessThan(maxSteps);
      expect(currentPos.row).toBe(13);
      expect(currentPos.col === 13 || currentPos.col === 14).toBe(true);
    }
  });
});
