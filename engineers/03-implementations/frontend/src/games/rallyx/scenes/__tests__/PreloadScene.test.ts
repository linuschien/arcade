import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PreloadScene } from '../PreloadScene';

describe('PreloadScene Unit Tests', () => {
  let scene: PreloadScene;
  let mockContext: any;
  let mockCanvasTexture: any;
  let mockTextures: any;
  let mockScenePlugin: any;

  beforeEach(() => {
    scene = new PreloadScene();

    mockContext = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      shadowColor: '',
      shadowBlur: 0,
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
      bezierCurveTo: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      translate: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      createRadialGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    };

    mockCanvasTexture = {
      context: mockContext,
      refresh: vi.fn(),
    };

    mockTextures = {
      exists: vi.fn().mockReturnValue(false),
      get: vi.fn().mockReturnValue({ setFilter: vi.fn() }),
      createCanvas: vi.fn().mockReturnValue(mockCanvasTexture),
      removeKey: vi.fn(),
    };

    mockScenePlugin = {
      start: vi.fn(),
    };

    (scene as any).textures = mockTextures;
    (scene as any).scene = mockScenePlugin;
  });

  it('should generate all namespaced textures on preload via createCanvas', () => {
    scene.preload();

    expect(mockTextures.createCanvas).toHaveBeenCalled();
    const createdKeys = mockTextures.createCanvas.mock.calls.map((c: any[]) => c[0]);

    expect(createdKeys).toContain('rallyx:player_up');
    expect(createdKeys).toContain('rallyx:player_down');
    expect(createdKeys).toContain('rallyx:player_left');
    expect(createdKeys).toContain('rallyx:player_right');
    expect(createdKeys).toContain('rallyx:enemy_up');
    expect(createdKeys).toContain('rallyx:enemy_down');
    expect(createdKeys).toContain('rallyx:enemy_left');
    expect(createdKeys).toContain('rallyx:enemy_right');
    expect(createdKeys).toContain('rallyx:hud_life');
    expect(createdKeys).toContain('rallyx:smoke');
    expect(createdKeys).toContain('rallyx:rock');
    expect(createdKeys).toContain('rallyx:flag_regular');
    expect(createdKeys).toContain('rallyx:flag_special');
    expect(createdKeys).toContain('rallyx:flag_lucky');
    expect(createdKeys).toContain('rallyx:border_theme_0');
    expect(createdKeys).toContain('rallyx:border_theme_1');
    expect(createdKeys).toContain('rallyx:border_theme_2');
    expect(createdKeys).toContain('rallyx:border_theme_3');
  });

  it('should skip texture generation if texture already exists', () => {
    mockTextures.exists.mockReturnValue(true);
    scene.preload();
    expect(mockTextures.createCanvas).not.toHaveBeenCalled();
  });

  it('should transition to MainGameScene on create', () => {
    scene.create();
    expect(mockScenePlugin.start).toHaveBeenCalledWith('rallyx:MainGameScene');
  });
});

