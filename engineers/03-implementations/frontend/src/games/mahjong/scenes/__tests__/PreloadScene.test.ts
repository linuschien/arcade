/**
 * PreloadScene.test.ts
 * Unit tests for procedural texture generation in Mahjong PreloadScene.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreloadScene } from '../PreloadScene';

describe('Mahjong PreloadScene Unit Tests', () => {
  let scene: PreloadScene;
  let mockGfx: any;
  let mockRenderTexture: any;
  let mockText: any;
  let mockTextures: any;
  let mockScenePlugin: any;

  beforeEach(() => {
    scene = new PreloadScene();

    mockGfx = {
      fillStyle: vi.fn().mockReturnThis(),
      fillCircle: vi.fn().mockReturnThis(),
      fillRect: vi.fn().mockReturnThis(),
      fillRoundedRect: vi.fn().mockReturnThis(),
      lineStyle: vi.fn().mockReturnThis(),
      strokeRect: vi.fn().mockReturnThis(),
      strokeRoundedRect: vi.fn().mockReturnThis(),
      strokeCircle: vi.fn().mockReturnThis(),
      beginPath: vi.fn().mockReturnThis(),
      moveTo: vi.fn().mockReturnThis(),
      lineTo: vi.fn().mockReturnThis(),
      closePath: vi.fn().mockReturnThis(),
      fillPath: vi.fn().mockReturnThis(),
      strokePath: vi.fn().mockReturnThis(),
      generateTexture: vi.fn().mockReturnThis(),
      destroy: vi.fn().mockReturnThis(),
    };

    mockText = {
      setOrigin: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };

    mockRenderTexture = {
      draw: vi.fn().mockReturnThis(),
      saveTexture: vi.fn().mockReturnThis(),
      destroy: vi.fn().mockReturnThis(),
    };

    mockTextures = {
      exists: vi.fn().mockReturnValue(false),
      addCanvas: vi.fn(),
    };

    mockScenePlugin = {
      start: vi.fn(),
    };

    (scene as any).make = {
      graphics: vi.fn().mockReturnValue(mockGfx),
      renderTexture: vi.fn().mockReturnValue(mockRenderTexture),
      text: vi.fn().mockReturnValue(mockText),
    };
    (scene as any).textures = mockTextures;
    (scene as any).scene = mockScenePlugin;
  });

  it('should generate all procedural mahjong:* textures during preload', () => {
    scene.preload();

    expect(mockTextures.addCanvas).toHaveBeenCalledWith('mahjong:tile_face_base', expect.anything());
    expect(mockTextures.addCanvas).toHaveBeenCalledWith('mahjong:tile_back', expect.anything());
    expect(mockTextures.addCanvas).toHaveBeenCalledWith('mahjong:compass_dial', expect.anything());
    expect(mockTextures.addCanvas).toHaveBeenCalledWith('mahjong:tile_1m', expect.anything());
    expect(mockTextures.addCanvas).toHaveBeenCalledWith('mahjong:tile_9p', expect.anything());
    expect(mockTextures.addCanvas).toHaveBeenCalledWith('mahjong:tile_1s', expect.anything());
    expect(mockTextures.addCanvas).toHaveBeenCalledWith('mahjong:tile_east', expect.anything());
    expect(mockTextures.addCanvas).toHaveBeenCalledWith('mahjong:tile_red', expect.anything());
    expect(mockTextures.addCanvas).toHaveBeenCalledWith('mahjong:tile_spring', expect.anything());
    expect(mockTextures.addCanvas).toHaveBeenCalledWith('mahjong:action_btn_hu', expect.anything());
    expect(mockTextures.addCanvas).toHaveBeenCalledWith('mahjong:wall_tile_stack', expect.anything());
  });

  it('should transition to MainGameScene on create', () => {
    scene.create();
    expect(mockScenePlugin.start).toHaveBeenCalledWith('mahjong:MainGameScene');
  });

  it('should skip texture generation if texture already exists', () => {
    mockTextures.exists.mockReturnValue(true);
    scene.preload();
    expect(mockTextures.addCanvas).not.toHaveBeenCalled();
  });
});
