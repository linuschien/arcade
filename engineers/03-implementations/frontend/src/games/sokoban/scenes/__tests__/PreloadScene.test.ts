import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreloadScene } from '../PreloadScene';

describe('Sokoban PreloadScene Unit Tests', () => {
  let scene: PreloadScene;
  let mockGfx: any;
  let mockTextures: any;
  let mockScenePlugin: any;

  beforeEach(() => {
    scene = new PreloadScene();

    mockGfx = {
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      fillEllipse: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      fillRoundedRect: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      strokeRoundedRect: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      lineBetween: vi.fn().mockReturnThis(),
      beginPath: vi.fn().mockReturnThis(),
      moveTo: vi.fn().mockReturnThis(),
      lineTo: vi.fn().mockReturnThis(),
      closePath: vi.fn().mockReturnThis(),
      fillPath: vi.fn().mockReturnThis(),
      generateTexture: vi.fn().mockReturnThis(),
      destroy: vi.fn().mockReturnThis(),
    };

    mockTextures = {
      exists: vi.fn().mockReturnValue(false),
    };

    mockScenePlugin = {
      start: vi.fn(),
    };

    (scene as any).make = {
      graphics: vi.fn().mockReturnValue(mockGfx),
    };
    (scene as any).textures = mockTextures;
    (scene as any).scene = mockScenePlugin;
  });

  it('should generate all procedural sokoban:* textures during preload', () => {
    scene.preload();

    expect((scene as any).make.graphics).toHaveBeenCalled();
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('sokoban:worker_down', 64, 64);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('sokoban:worker_up', 64, 64);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('sokoban:worker_left', 64, 64);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('sokoban:worker_right', 64, 64);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('sokoban:crate', 64, 64);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('sokoban:crate_gold', 64, 64);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('sokoban:goal', 64, 64);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('sokoban:wall_cargo', 64, 64);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('sokoban:floor_cargo', 64, 64);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('sokoban:ambient_cargo', 44, 44);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('sokoban:ambient_cargo_depot', 44, 44);
  });

  it('should transition to sokoban:MainGameScene upon create', () => {
    scene.create();
    expect(mockScenePlugin.start).toHaveBeenCalledWith('sokoban:MainGameScene');
  });
});

