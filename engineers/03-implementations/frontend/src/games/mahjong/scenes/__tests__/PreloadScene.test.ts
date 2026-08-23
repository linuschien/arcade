/**
 * PreloadScene.test.ts
 * Unit tests for procedural texture generation in Mahjong PreloadScene.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreloadScene } from '../PreloadScene';

describe('Mahjong PreloadScene Unit Tests', () => {
  let scene: PreloadScene;
  let mockTextures: any;
  let mockScenePlugin: any;

  beforeEach(() => {
    scene = new PreloadScene();

    const mockContext = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      rect: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      roundRect: vi.fn(),
      ellipse: vi.fn(),
      quadraticCurveTo: vi.fn(),
      fillText: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      translate: vi.fn(),
      setLineDash: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    };

    const mockCanvasTexture = {
      context: mockContext,
      refresh: vi.fn(),
    };

    mockTextures = {
      exists: vi.fn().mockReturnValue(false),
      createCanvas: vi.fn().mockReturnValue(mockCanvasTexture),
    };

    mockScenePlugin = {
      start: vi.fn(),
    };

    (scene as any).textures = mockTextures;
    (scene as any).scene = mockScenePlugin;
  });

  it('should generate all procedural mahjong:* textures during preload via createCanvas', () => {
    scene.preload();

    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:tile_face_base', 36, 48);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:tile_back', 36, 48);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:compass_dial', 156, 156);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:tile_1m', 36, 48);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:tile_9p', 36, 48);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:tile_1s', 36, 48);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:tile_east', 36, 48);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:tile_red', 36, 48);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:tile_spring', 36, 48);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:action_btn_hu', 64, 36);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:action_btn_zimo', 64, 36);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:wall_tile_stack', 22, 30);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:wall_tile_stack_iron', 22, 30);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:dice_cup', 110, 130);
    expect(mockTextures.createCanvas).toHaveBeenCalledWith('mahjong:dice_tray', 240, 140);
  });

  it('should transition to MainGameScene on create', () => {
    scene.create();
    expect(mockScenePlugin.start).toHaveBeenCalledWith('mahjong:MainGameScene');
  });

  it('should skip texture generation if texture already exists', () => {
    mockTextures.exists.mockReturnValue(true);
    scene.preload();
    expect(mockTextures.createCanvas).not.toHaveBeenCalled();
  });
});
