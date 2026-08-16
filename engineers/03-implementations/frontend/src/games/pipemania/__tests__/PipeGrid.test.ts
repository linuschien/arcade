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

  it('should enforce Start/End 8-neighborhood clearance (no obstacles or preset pipes)', () => {
    const grid = new PipeGrid();
    grid.generateLevel(36); // High difficulty with 12 obstacles & 5 presets
    const startCoord = grid.getStartCoord();
    const endCoord = grid.getEndCoord();

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (grid.isNearStartOrEnd(c, r)) {
          const cell = grid.getCell(c, r)!;
          if ((c === startCoord.col && r === startCoord.row) || (c === endCoord.col && r === endCoord.row)) {
            expect([PipeType.START, PipeType.END]).toContain(cell.type);
          } else {
            // Must be completely EMPTY in the 8-neighborhood
            expect(cell.type).toBe(PipeType.EMPTY);
            expect(cell.isPreset).toBe(false);
          }
        }
      }
    }
  });

  it('should place preset bolted pipes on higher levels with 100% EMPTY port clearance', () => {
    const grid = new PipeGrid();
    grid.generateLevel(15);
    const cells = grid.getCells().flat();
    const presetPipes = cells.filter((c) => c.isPreset);
    expect(presetPipes.length).toBeGreaterThan(0);

    // Verify all preset pipes have clear ports pointing strictly to in-bounds EMPTY cells
    // AND all pairs of preset pipes maintain 3x3 8-neighborhood isolation (Chebyshev distance >= 2)
    for (let i = 0; i < presetPipes.length; i++) {
      const p1 = presetPipes[i];
      expect(grid.isPipePortsClear(p1.col, p1.row, p1.type)).toBe(true);
      expect(grid.isNearStartOrEnd(p1.col, p1.row)).toBe(false);

      for (let j = i + 1; j < presetPipes.length; j++) {
        const p2 = presetPipes[j];
        const chebyshevDist = Math.max(Math.abs(p1.col - p2.col), Math.abs(p1.row - p2.row));
        expect(chebyshevDist).toBeGreaterThanOrEqual(2);
      }
    }

    // Preset pipes cannot be overwritten
    const preset = presetPipes[0];
    const placeRes = grid.placePipe(preset.col, preset.row, PipeType.HORIZONTAL);
    expect(placeRes.success).toBe(false);
  });
});
