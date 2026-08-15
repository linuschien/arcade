import { describe, it, expect } from 'vitest';
import { PipeGrid } from '../logic/PipeGrid';
import { PipeType, GRID_COLS, GRID_ROWS } from '../logic/PipeTypes';

describe('PipeGrid Unit Tests', () => {
  it('should initialize empty 10x7 grid', () => {
    const grid = new PipeGrid();
    const cells = grid.getCells();
    expect(cells.length).toBe(GRID_ROWS); // 7
    expect(cells[0].length).toBe(GRID_COLS); // 10
    expect(grid.getCell(0, 0)?.type).toBe(PipeType.EMPTY);
    expect(grid.getCell(-1, 0)).toBeNull();
    expect(grid.getCell(10, 7)).toBeNull();
  });

  it('should allow placing pipe on empty cell', () => {
    const grid = new PipeGrid();
    const result = grid.placePipe(2, 2, PipeType.HORIZONTAL);
    expect(result.success).toBe(true);
    expect(result.isReplacement).toBe(false);
    expect(grid.getCell(2, 2)?.type).toBe(PipeType.HORIZONTAL);
  });

  it('should allow replacement on unflooded placed pipe', () => {
    const grid = new PipeGrid();
    grid.placePipe(2, 2, PipeType.HORIZONTAL);
    const replaceResult = grid.placePipe(2, 2, PipeType.VERTICAL);
    expect(replaceResult.success).toBe(true);
    expect(replaceResult.isReplacement).toBe(true);
    expect(replaceResult.oldType).toBe(PipeType.HORIZONTAL);
    expect(grid.getCell(2, 2)?.type).toBe(PipeType.VERTICAL);
  });

  it('should disallow placement on flooded or flooding cell', () => {
    const grid = new PipeGrid();
    grid.placePipe(2, 2, PipeType.HORIZONTAL);
    const cell = grid.getCell(2, 2)!;
    cell.isFlooding = true;

    const result = grid.placePipe(2, 2, PipeType.VERTICAL);
    expect(result.success).toBe(false);

    cell.isFlooding = false;
    cell.isFlooded = true;
    const result2 = grid.placePipe(2, 2, PipeType.VERTICAL);
    expect(result2.success).toBe(false);
  });

  it('should generate solvable level with BFS connectivity check', () => {
    const grid = new PipeGrid();
    const config = grid.generateLevel(1);
    expect(config.level).toBe(1);

    const startCoord = grid.getStartCoord();
    const endCoord = grid.getEndCoord();
    const startCell = grid.getCell(startCoord.col, startCoord.row);
    const endCell = grid.getCell(endCoord.col, endCoord.row);

    expect(startCell?.type).toBe(PipeType.START);
    expect(endCell?.type).toBe(PipeType.END);
    expect(grid.checkBFSConnectivity()).toBe(true);
    expect(grid.computeMaxPotentialPath()).toBeGreaterThanOrEqual(config.targetLength);
  });

  it('should place preset bolted pipes on higher levels', () => {
    const grid = new PipeGrid();
    grid.generateLevel(10);
    const cells = grid.getCells().flat();
    const presetPipes = cells.filter((c) => c.isPreset);
    expect(presetPipes.length).toBeGreaterThan(0);

    // Preset pipes cannot be overwritten
    const preset = presetPipes[0];
    const placeRes = grid.placePipe(preset.col, preset.row, PipeType.HORIZONTAL);
    expect(placeRes.success).toBe(false);
  });
});
