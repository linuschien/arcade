/**
 * SokobanLevelSpecs.test.ts
 * Verifies dynamic formula calculation and verifies against master catalog baseline.
 * Enforces: "The numbers could be part of test cases, but you need to implement it by the defined formula."
 */

import { describe, it, expect } from 'vitest';
import {
  WORLD_SPECS,
  getWorldSpecForStage,
  calculateSoftTime,
  calculateUndoQuota,
  calculateBaseScore,
  calculatePerfBonus,
} from '../logic/SokobanLevelSpecs';
import { LevelCatalog } from '../logic/LevelCatalog';

describe('SokobanLevelSpecs Formula Tests', () => {
  it('should return correct WorldSpec for boundary stages', () => {
    expect(getWorldSpecForStage(1).themeKey).toBe('cargo_depot');
    expect(getWorldSpecForStage(5).themeKey).toBe('cargo_depot');
    expect(getWorldSpecForStage(6).themeKey).toBe('cyber_vault');
    expect(getWorldSpecForStage(20).themeKey).toBe('cyber_vault');
    expect(getWorldSpecForStage(21).themeKey).toBe('steel_works');
    expect(getWorldSpecForStage(40).themeKey).toBe('steel_works');
    expect(getWorldSpecForStage(41).themeKey).toBe('mega_terminal');
    expect(getWorldSpecForStage(50).themeKey).toBe('mega_terminal');
  });

  it('should calculate base score and perfect bonus correctly', () => {
    expect(calculateBaseScore(1)).toBe(200);
    expect(calculatePerfBonus(1)).toBe(300);

    expect(calculateBaseScore(6)).toBe(400);
    expect(calculatePerfBonus(6)).toBe(500);

    expect(calculateBaseScore(21)).toBe(600);
    expect(calculatePerfBonus(21)).toBe(700);

    expect(calculateBaseScore(41)).toBe(800);
    expect(calculatePerfBonus(41)).toBe(900);
  });

  it('should calculate Soft Time according to PRD Section 4.1 formula', () => {
    // Stage 1: Cargo Depot (W1: T_base=50, K_t=10, S_start=1), B=1
    // T = 50 + 2*(1-1) + 1*10 = 60
    expect(calculateSoftTime(1, 1)).toBe(60);

    // Stage 20: Cyber Vault (W2: T_base=120, K_t=20, S_start=6), B=5
    // T = 120 + 2*(20-6) + 5*20 = 120 + 28 + 100 = 248
    expect(calculateSoftTime(20, 5)).toBe(248);

    // Stage 21: Steel Works (W3: T_base=160, K_t=15, S_start=21), B=6
    // T = 160 + 2*(21-21) + 6*15 = 160 + 0 + 90 = 250
    expect(calculateSoftTime(21, 6)).toBe(250);

    // Stage 41: Mega Terminal (W4: T_base=200, K_t=15, S_start=41), B=13
    // T = 200 + 2*(41-41) + 13*15 = 200 + 0 + 195 = 395
    expect(calculateSoftTime(41, 13)).toBe(395);
  });

  it('should calculate Undo Quota according to PRD Section 3.1 formula', () => {
    // Stage 1: Cargo Depot (W1: U_base=2, K_u=0.6, S_start=1), B=1
    // U = min(6, floor(2 + 1*0.6 + 0)) = 2
    expect(calculateUndoQuota(1, 1)).toBe(2);

    // Stage 20: Cyber Vault (W2: U_base=4, K_u=0.6, S_start=6), B=5
    // U = min(12, floor(4 + 5*0.6 + 0.15*14)) = min(12, floor(4 + 3 + 2.1)) = 9
    expect(calculateUndoQuota(20, 5)).toBe(9);

    // Stage 21: Steel Works (W3: U_base=6, K_u=0.5, S_start=21), B=6
    // U = min(14, floor(6 + 6*0.5 + 0)) = min(14, floor(6 + 3)) = 9
    expect(calculateUndoQuota(21, 6)).toBe(9);

    // Stage 41: Mega Terminal (W4: U_base=8, K_u=0.5, S_start=41), B=13
    // U = min(18, floor(8 + 13*0.5 + 0)) = min(18, floor(8 + 6.5)) = 14
    expect(calculateUndoQuota(41, 13)).toBe(14);
  });

  it('should assert that dynamically computed values match all 50 master catalog baselines 100%', () => {
    const allStages = LevelCatalog.getAllStages();
    expect(allStages.length).toBe(50);

    for (const stage of allStages) {
      expect(stage.tSoft).toBe(stage.rawBaseline.tSoft);
      expect(stage.uQuota).toBe(stage.rawBaseline.uQuota);
    }
  });

  it('should verify all 50 stages are strictly monotonic non-decreasing in T_soft and U_quota', () => {
    const allStages = LevelCatalog.getAllStages();
    for (let i = 1; i < allStages.length; i++) {
      const prev = allStages[i - 1];
      const curr = allStages[i];
      expect(curr.tSoft).toBeGreaterThanOrEqual(prev.tSoft);
      expect(curr.uQuota).toBeGreaterThanOrEqual(prev.uQuota);
    }
  });
});

