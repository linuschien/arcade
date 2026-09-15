/**
 * LevelCatalog.ts
 * Loads 50-stage master catalog from external-specs and calculates dynamic runtime parameters.
 * Maintains docs/01-requirements/external-specs/sokoban_50_master.json as single source of truth.
 */

import masterCatalogData from '@external-specs/sokoban_50_master.json';
import {
  WorldThemeKey,
  getWorldSpecForStage,
  calculateSoftTime,
  calculateUndoQuota,
  calculateBaseScore,
  calculatePerfBonus,
} from './SokobanLevelSpecs';

export interface RawStageRecord {
  stage: number;
  world: number;
  world_name: string;
  theme_key: string;
  source_file: string;
  source_level_index: number;
  title: string;
  is_rotated: boolean;
  grid_width: number;
  grid_height: number;
  aspect_ratio: number;
  box_count: number;
  t_soft: number;
  u_quota: number;
  p_base: number;
  p_perf: number;
  map_lines: string[];
}

export interface SokobanStageConfig {
  stage: number;
  worldId: number;
  worldName: string;
  themeKey: WorldThemeKey;
  sourceFile: string;
  sourceLevelIndex: number;
  title: string;
  isRotated: boolean;
  gridWidth: number;
  gridHeight: number;
  aspectRatio: number;
  boxCount: number;
  tSoft: number; // Dynamically evaluated from formula
  uQuota: number; // Dynamically evaluated from formula
  pBase: number;
  pPerf: number;
  mapLines: string[];
  rawBaseline: {
    tSoft: number;
    uQuota: number;
  };
}

class LevelCatalogManager {
  private stages: Map<number, SokobanStageConfig> = new Map();

  constructor() {
    this.loadCatalog();
  }

  private loadCatalog(): void {
    const rawStages: RawStageRecord[] = (masterCatalogData as any).stages || [];
    for (const raw of rawStages) {
      const stageNum = raw.stage;
      const boxCount = raw.box_count;
      const worldSpec = getWorldSpecForStage(stageNum);

      // Dynamically compute runtime values via canonical formulas
      const computedTSoft = calculateSoftTime(stageNum, boxCount);
      const computedUQuota = calculateUndoQuota(stageNum, boxCount);
      const computedPBase = calculateBaseScore(stageNum);
      const computedPPerf = calculatePerfBonus(stageNum);

      const config: SokobanStageConfig = {
        stage: stageNum,
        worldId: worldSpec.worldId,
        worldName: worldSpec.name,
        themeKey: worldSpec.themeKey,
        sourceFile: raw.source_file,
        sourceLevelIndex: raw.source_level_index,
        title: raw.title,
        isRotated: raw.is_rotated,
        gridWidth: raw.grid_width,
        gridHeight: raw.grid_height,
        aspectRatio: raw.aspect_ratio,
        boxCount: boxCount,
        tSoft: computedTSoft,
        uQuota: computedUQuota,
        pBase: computedPBase,
        pPerf: computedPPerf,
        mapLines: raw.map_lines,
        rawBaseline: {
          tSoft: raw.t_soft,
          uQuota: raw.u_quota,
        },
      };

      this.stages.set(stageNum, config);
    }
  }

  public getStage(stageNumber: number): SokobanStageConfig {
    const clamped = Math.max(1, Math.min(stageNumber, this.getTotalStages()));
    const stage = this.stages.get(clamped);
    if (!stage) {
      throw new Error(`[LevelCatalog] Stage ${stageNumber} not found in catalog.`);
    }
    return stage;
  }

  public getTotalStages(): number {
    return this.stages.size;
  }

  public getAllStages(): SokobanStageConfig[] {
    return Array.from(this.stages.values()).sort((a, b) => a.stage - b.stage);
  }
}

export const LevelCatalog = new LevelCatalogManager();

