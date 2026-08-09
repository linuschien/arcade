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
});
