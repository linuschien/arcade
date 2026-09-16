/**
 * SokobanLevelSpecs.ts
 * Formula-Driven Parameter Calculation & World Specifications for Sokoban 50.
 * Single source of truth for dynamic progression math adhering to PRD Sections 3.1 & 4.1.
 */

export type WorldThemeKey = 'cargo_depot' | 'cyber_vault' | 'steel_works' | 'mega_terminal';

export interface WorldSpec {
  worldId: number;
  name: string;
  themeKey: WorldThemeKey;
  startStage: number;
  endStage: number;
  tBase: number;
  kT: number;
  uBase: number;
  kU: number;
  uMax: number;
  pBase: number;
  pPerf: number;
}

export const WORLD_SPECS: Record<number, WorldSpec> = {
  1: {
    worldId: 1,
    name: 'Cargo Depot',
    themeKey: 'cargo_depot',
    startStage: 1,
    endStage: 5,
    tBase: 50,
    kT: 10,
    uBase: 2,
    kU: 0.6,
    uMax: 6,
    pBase: 200,
    pPerf: 300,
  },
  2: {
    worldId: 2,
    name: 'Cyber Vault',
    themeKey: 'cyber_vault',
    startStage: 6,
    endStage: 20,
    tBase: 120,
    kT: 20,
    uBase: 4,
    kU: 0.6,
    uMax: 12,
    pBase: 400,
    pPerf: 500,
  },
  3: {
    worldId: 3,
    name: 'Steel Works',
    themeKey: 'steel_works',
    startStage: 21,
    endStage: 40,
    tBase: 160,
    kT: 15,
    uBase: 6,
    kU: 0.5,
    uMax: 14,
    pBase: 600,
    pPerf: 700,
  },
  4: {
    worldId: 4,
    name: 'Mega Terminal',
    themeKey: 'mega_terminal',
    startStage: 41,
    endStage: 50,
    tBase: 200,
    kT: 15,
    uBase: 8,
    kU: 0.5,
    uMax: 18,
    pBase: 800,
    pPerf: 900,
  },
};

/**
 * Retrieve WorldSpec for a given stage number (1..50).
 */
export function getWorldSpecForStage(stageNumber: number): WorldSpec {
  if (stageNumber <= 5) return WORLD_SPECS[1];
  if (stageNumber <= 20) return WORLD_SPECS[2];
  if (stageNumber <= 40) return WORLD_SPECS[3];
  return WORLD_SPECS[4];
}

/**
 * Calculate dynamic Soft Time T_soft in seconds.
 * Formula: T_soft(S, B, W) = T_base(W) + 2 * (S - S_start(W)) + B * K_t(W)
 */
export function calculateSoftTime(stageNumber: number, boxCount: number): number {
  const spec = getWorldSpecForStage(stageNumber);
  const deltaS = stageNumber - spec.startStage;
  return spec.tBase + 2 * deltaS + boxCount * spec.kT;
}

/**
 * Calculate dynamic Undo Quota U_quota in pushes.
 * Formula: U_quota(S, B, W) = min(U_max(W), floor(U_base(W) + B * K_u(W) + 0.15 * (S - S_start(W))))
 */
export function calculateUndoQuota(stageNumber: number, boxCount: number): number {
  const spec = getWorldSpecForStage(stageNumber);
  const deltaS = stageNumber - spec.startStage;
  const rawU = spec.uBase + boxCount * spec.kU + 0.15 * deltaS;
  return Math.min(spec.uMax, Math.floor(rawU));
}

/**
 * Get base stage clear points P_base for the world.
 */
export function calculateBaseScore(stageNumber: number): number {
  return getWorldSpecForStage(stageNumber).pBase;
}

/**
 * Get perfect bonus points P_perf for the world.
 */
export function calculatePerfBonus(stageNumber: number): number {
  return getWorldSpecForStage(stageNumber).pPerf;
}

/**
 * Checks whether the given stage number completes a themed world (World 1: 5, World 2: 20, World 3: 40).
 * World 4 ends at 50 (which triggers ALL CLEAR).
 */
export function isWorldEndStage(stageNumber: number): boolean {
  return stageNumber === 5 || stageNumber === 20 || stageNumber === 40;
}


