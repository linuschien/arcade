/**
 * ScoreCalculator.test.ts
 * Vitest unit tests for line clear scoring, soft/hard drop points, and level 1..15 speed curve.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreCalculator } from '../logic/ScoreCalculator';

describe('ScoreCalculator', () => {
  let calc: ScoreCalculator;

  beforeEach(() => {
    calc = new ScoreCalculator(1);
  });

  it('should calculate line clear scores correctly at Level 1', () => {
    // 1 line: +100 * Level
    expect(calc.addLineClears(1)).toBe(100);
    expect(calc.getState().score).toBe(100);

    // 2 lines: +300 * Level
    calc.reset(1);
    expect(calc.addLineClears(2)).toBe(300);

    // 3 lines: +500 * Level
    calc.reset(1);
    expect(calc.addLineClears(3)).toBe(500);

    // 4 lines (Tetris): +800 * Level
    calc.reset(1);
    expect(calc.addLineClears(4)).toBe(800);
  });

  it('should scale scoring multipliers with current level', () => {
    calc.reset(5); // Level 5
    // 4 lines at level 5 = 800 * 5 = 4000
    expect(calc.addLineClears(4)).toBe(4000);
    expect(calc.getState().score).toBe(4000);
  });

  it('should calculate soft drop (+1/cell) and hard drop (+2/cell) points', () => {
    calc.addSoftDrop(5);
    expect(calc.getState().score).toBe(5);

    calc.addHardDrop(10);
    expect(calc.getState().score).toBe(25); // 5 + 10*2
  });

  it('should increase level every 10 lines cleared up to cap Level 15', () => {
    expect(calc.getState().level).toBe(1);

    calc.addLineClears(4); // total 4 lines
    expect(calc.getState().level).toBe(1);

    calc.addLineClears(4); // total 8 lines
    expect(calc.getState().level).toBe(1);

    calc.addLineClears(4); // total 12 lines -> level 2
    expect(calc.getState().level).toBe(2);

    // Add 150 lines -> 162 total lines -> should cap at level 15
    for (let i = 0; i < 38; i++) {
      calc.addLineClears(4);
    }

    expect(calc.getState().lines).toBe(164);
    expect(calc.getState().level).toBe(15);
  });

  it('should return correct drop intervals according to casual speed curve', () => {
    calc.reset(1);
    expect(calc.getDropInterval()).toBe(1000);

    calc.reset(3);
    expect(calc.getDropInterval()).toBe(800);

    calc.reset(5);
    expect(calc.getDropInterval()).toBe(600);

    calc.reset(8);
    expect(calc.getDropInterval()).toBe(450);

    calc.reset(10);
    expect(calc.getDropInterval()).toBe(350);

    calc.reset(12);
    expect(calc.getDropInterval()).toBe(250);

    calc.reset(15);
    expect(calc.getDropInterval()).toBe(200); // Level 15 Cap
  });
});
