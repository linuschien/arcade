import { describe, it, expect } from 'vitest';
import { PipeManiaGameState, PlayState } from '../logic/PipeManiaGameState';
import { PipeType, Direction, DIRECTION_VECTORS } from '../logic/PipeTypes';

describe('PipeManiaGameState Unit Tests', () => {
  it('should initialize with 3 wrenches, score 0, and 5-slot queue', () => {
    const gameState = new PipeManiaGameState(1);
    expect(gameState.getWrenches()).toBe(3);
    expect(gameState.getScore()).toBe(0);
    expect(gameState.getQueue().length).toBe(5);
    expect(gameState.getPlayState()).toBe(PlayState.READY_COUNTDOWN);
  });

  it('should pop and shift 5-slot FIFO queue upon pipe placement', () => {
    const gameState = new PipeManiaGameState(1);
    const initialQueue = gameState.getQueue();

    // Place active pipe
    const res = gameState.placeActivePipe(0, 0);
    if (res.success) {
      const newQueue = gameState.getQueue();
      expect(newQueue[0]).toBe(initialQueue[1]);
      expect(newQueue[1]).toBe(initialQueue[2]);
      expect(newQueue[2]).toBe(initialQueue[3]);
      expect(newQueue[3]).toBe(initialQueue[4]);
      expect(newQueue.length).toBe(5);
    }
  });

  it('should apply -50 points penalty on pipe replacement', () => {
    const gameState = new PipeManiaGameState(1);
    // Artificially give score
    (gameState as any).score = 200;

    let targetCol = 0;
    let targetRow = 0;
    const grid = gameState.getGrid();
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 10; c++) {
        if (grid.getCell(c, r)?.type === PipeType.EMPTY) {
          targetCol = c;
          targetRow = r;
          break;
        }
      }
    }

    const firstPlace = gameState.placeActivePipe(targetCol, targetRow);
    expect(firstPlace.success).toBe(true);
    expect(gameState.getScore()).toBe(200);

    // Replace unflooded pipe
    const secondPlace = gameState.placeActivePipe(targetCol, targetRow);
    expect(secondPlace.success).toBe(true);
    expect(secondPlace.isReplacement).toBe(true);
    expect(gameState.getScore()).toBe(150);
  });

  it('should count down and begin liquid flow', () => {
    const gameState = new PipeManiaGameState(1);
    const delaySec = gameState.getLevelConfig().delaySeconds;

    // Advance halfway
    gameState.update(1000);
    expect(gameState.getPlayState()).toBe(PlayState.READY_COUNTDOWN);

    // Advance past total delay
    gameState.update(delaySec * 1000 + 500);
    expect(gameState.getPlayState()).not.toBe(PlayState.READY_COUNTDOWN);
  });

  it('should handle continuous fill and cell completion scoring', () => {
    const gameState = new PipeManiaGameState(1);
    const startCoord = gameState.getGrid().getStartCoord();
    const startCell = gameState.getGrid().getCell(startCoord.col, startCoord.row)!;
    const outflowDir = startCell.startOutflowDir || Direction.RIGHT;
    const vec = DIRECTION_VECTORS[outflowDir];
    const frontCol = startCoord.col + vec.dx;
    const frontRow = startCoord.row + vec.dy;

    // Place connecting pipe in front of start
    const matchingPipe = (outflowDir === Direction.RIGHT || outflowDir === Direction.LEFT)
      ? PipeType.HORIZONTAL
      : PipeType.VERTICAL;
    gameState.getGrid().placePipe(frontCol, frontRow, matchingPipe);

    // Start liquid flow
    (gameState as any).countdownRemainingSec = 0;
    gameState.update(10);

    expect(gameState.getPlayState()).toBe(PlayState.FLOWING);

    // Step liquid past completion duration
    gameState.update(gameState.getLevelConfig().flowIntervalMs + 50);
    expect(gameState.getScore()).toBeGreaterThanOrEqual(50);
    expect(gameState.getFloodedCount()).toBeGreaterThanOrEqual(1);
  });

  it('should handle spill and deduct wrench', () => {
    const gameState = new PipeManiaGameState(1);
    const initialWrenches = gameState.getWrenches();

    // Trigger flow into empty tile directly -> spill
    (gameState as any).countdownRemainingSec = 0;
    gameState.update(10);

    expect(gameState.getWrenches()).toBe(initialWrenches - 1);
    expect(gameState.getFailureReason()).toBe('SPILL');
  });

  it('should trigger GAME_OVER when wrenches reach 0', () => {
    const gameState = new PipeManiaGameState(1);
    (gameState as any).wrenches = 1;

    // Trigger spill
    (gameState as any).countdownRemainingSec = 0;
    gameState.update(10);

    expect(gameState.getWrenches()).toBe(0);
    expect(gameState.getPlayState()).toBe(PlayState.GAME_OVER);
  });

  it('should award extra life (Extend) at 50,000 points threshold', () => {
    const gameState = new PipeManiaGameState(1);
    (gameState as any).wrenches = 2;

    (gameState as any).addScore(50000, []);
    expect(gameState.getWrenches()).toBe(3);
  });
});
