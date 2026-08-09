import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreloadScene } from '../PreloadScene';

describe('PreloadScene Unit Tests', () => {
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
      fillTriangle: vi.fn().mockReturnThis(),
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

  it('should generate all procedural pacman:* textures during preload', () => {
    scene.preload();

    expect((scene as any).make.graphics).toHaveBeenCalled();
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pacman:player', 32, 32);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pacman:ghost_blinky', 32, 32);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pacman:ghost_frightened', 32, 32);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pacman:pellet', 8, 8);
    expect(mockGfx.generateTexture).toHaveBeenCalledWith('pacman:power_pellet', 18, 18);
  });

  it('should transition to MainGameScene on create', () => {
    scene.create();
    expect(mockScenePlugin.start).toHaveBeenCalledWith('pacman:MainGameScene');
  });

  it('should skip texture generation if texture already exists', () => {
    mockTextures.exists.mockReturnValue(true);
    scene.preload();
    expect(mockGfx.generateTexture).not.toHaveBeenCalled();
  });
});
