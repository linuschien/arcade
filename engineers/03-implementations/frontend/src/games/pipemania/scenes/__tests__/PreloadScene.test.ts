import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreloadScene } from '../PreloadScene';

describe('PipeMania PreloadScene Unit Tests', () => {
  let scene: PreloadScene;
  let mockGfx: any;
  let mockTextures: any;
  let mockScenePlugin: any;

  beforeEach(() => {
    scene = new PreloadScene();

    mockGfx = {
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      fillRoundedRect: vi.fn().mockReturnThis(),
      fillTriangle: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      strokeRoundedRect: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      strokeLineShape: vi.fn().mockReturnThis(),
      beginPath: vi.fn().mockReturnThis(),
      arc: vi.fn().mockReturnThis(),
      closePath: vi.fn().mockReturnThis(),
      fillPath: vi.fn().mockReturnThis(),
      strokePath: vi.fn().mockReturnThis(),
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

  it('should generate all procedural pipemania:* textures during preload', () => {
    scene.preload();

    expect((scene as any).make.graphics).toHaveBeenCalled();
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pipemania:grid_tile', 56, 56);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pipemania:obstacle_rock', 56, 56);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pipemania:start_valve', 56, 56);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pipemania:end_drain', 56, 56);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pipemania:pipe_horizontal', 56, 56);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pipemania:pipe_vertical', 56, 56);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pipemania:pipe_cross', 56, 56);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pipemania:pipe_oneway_right', 56, 56);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pipemania:pipe_reservoir_h', 56, 56);
  });

  it('should transition to MainGameScene on create', () => {
    scene.create();
    expect(mockScenePlugin.start).toHaveBeenCalledWith('pipemania:MainGameScene');
  });

  it('should skip texture generation if texture already exists', () => {
    mockTextures.exists.mockReturnValue(true);
    scene.preload();
    expect(mockGfx.generateTexture).not.toHaveBeenCalled();
  });
});
