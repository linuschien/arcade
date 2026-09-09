import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreloadScene } from '../PreloadScene';

describe('PreloadScene Unit Tests', () => {
  let scene: PreloadScene;
  let mockGraphics: any;
  let mockTextures: any;
  let mockScenePlugin: any;

  beforeEach(() => {
    scene = new PreloadScene();

    mockGraphics = {
      fillStyle: vi.fn(),
      fillRect: vi.fn(),
      fillCircle: vi.fn(),
      fillTriangle: vi.fn(),
      generateTexture: vi.fn(),
      destroy: vi.fn(),
    };

    mockTextures = {
      exists: vi.fn().mockReturnValue(false),
      removeKey: vi.fn(),
    };

    mockScenePlugin = {
      start: vi.fn(),
    };

    (scene as any).make = {
      graphics: vi.fn().mockReturnValue(mockGraphics),
    };
    (scene as any).textures = mockTextures;
    (scene as any).scene = mockScenePlugin;
  });

  it('should generate all namespaced textures on preload', () => {
    scene.preload();

    expect(mockGraphics.generateTexture).toHaveBeenCalled();
    const generatedKeys = mockGraphics.generateTexture.mock.calls.map((c: any[]) => c[0]);

    expect(generatedKeys).toContain('rallyx:player_up');
    expect(generatedKeys).toContain('rallyx:player_down');
    expect(generatedKeys).toContain('rallyx:player_left');
    expect(generatedKeys).toContain('rallyx:player_right');
    expect(generatedKeys).toContain('rallyx:enemy_up');
    expect(generatedKeys).toContain('rallyx:enemy_down');
    expect(generatedKeys).toContain('rallyx:enemy_left');
    expect(generatedKeys).toContain('rallyx:enemy_right');
    expect(generatedKeys).toContain('rallyx:smoke');
    expect(generatedKeys).toContain('rallyx:rock');
    expect(generatedKeys).toContain('rallyx:flag_regular');
    expect(generatedKeys).toContain('rallyx:flag_special');
    expect(generatedKeys).toContain('rallyx:flag_lucky');
    expect(generatedKeys).toContain('rallyx:hud_life');
  });

  it('should transition to MainGameScene on create', () => {
    scene.create();
    expect(mockScenePlugin.start).toHaveBeenCalledWith('rallyx:MainGameScene');
  });
});

