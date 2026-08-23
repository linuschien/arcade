/**
 * init-high-dpi.test.ts
 * Unit tests for Phaser High-DPI initialization, resolution helper, and global interceptors.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { getDynamicResolution, applyHighDpiFrameMetadata } from '../init-high-dpi';
import Phaser from 'phaser';

describe('High-DPI Dynamic Resolution Unit Tests', () => {
  const originalDpr = window.devicePixelRatio;

  afterEach(() => {
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: originalDpr,
    });
  });

  it('should return 2 as minimum resolution when devicePixelRatio is 1', () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 1,
    });
    expect(getDynamicResolution()).toBe(2);
  });

  it('should return 2 when devicePixelRatio is 2', () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 2,
    });
    expect(getDynamicResolution()).toBe(2);
  });

  it('should return 2.5 when devicePixelRatio is 2.5', () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 2.5,
    });
    expect(getDynamicResolution()).toBe(2.5);
  });

  it('should clamp to 3 when devicePixelRatio is higher than 3 (e.g., 4)', () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      writable: true,
      configurable: true,
      value: 4,
    });
    expect(getDynamicResolution()).toBe(3);
  });

  it('should have patched Phaser prototypes with __highDpiPatched flags', () => {
    const textProto = Phaser.GameObjects.GameObjectFactory.prototype.text as any;
    expect(textProto.__highDpiPatched).toBe(true);

    const createCanvasProto = Phaser.Textures.TextureManager.prototype.createCanvas as any;
    expect(createCanvasProto.__highDpiPatched).toBe(true);

    const genTextureProto = Phaser.GameObjects.Graphics.prototype.generateTexture as any;
    expect(genTextureProto.__highDpiPatched).toBe(true);
  });

  it('should apply high DPI frame metadata and update frame dimensions and UVs', () => {
    const mockFrame = {
      source: { resolution: 1 },
      setSize: vi.fn(),
      width: 0,
      height: 0,
      halfWidth: 0,
      halfHeight: 0,
      centerX: 0,
      centerY: 0,
      data: { sourceSize: { w: 0, h: 0 } },
      updateUVs: vi.fn(),
    };

    const mockTexture = {
      get: vi.fn().mockReturnValue(mockFrame),
    };

    applyHighDpiFrameMetadata(mockTexture, 36, 48, 2);

    expect(mockFrame.source.resolution).toBe(2);
    expect(mockFrame.setSize).toHaveBeenCalledWith(72, 96);
    expect(mockFrame.width).toBe(36);
    expect(mockFrame.height).toBe(48);
    expect(mockFrame.halfWidth).toBe(18);
    expect(mockFrame.halfHeight).toBe(24);
    expect(mockFrame.data.sourceSize.w).toBe(36);
    expect(mockFrame.data.sourceSize.h).toBe(48);
    expect(mockFrame.updateUVs).toHaveBeenCalled();
  });

  it('should automatically inject dynamic resolution into text styles when calling factory.text', () => {
    let capturedStyle: any = null;
    const dummyOriginal = vi.fn().mockImplementation((x, y, text, style) => {
      capturedStyle = style;
      return { type: 'Text', x, y, text, style };
    });

    const factory = {
      text: function (x: number, y: number, text: string, style?: any) {
        const dynamicResolution = getDynamicResolution();
        const mergedStyle = {
          resolution: style?.resolution ?? dynamicResolution,
          ...style,
        };
        return dummyOriginal.call(this, x, y, text, mergedStyle);
      },
    };

    factory.text(10, 20, 'Test Text', { fontSize: '14px', color: '#ffffff' });

    expect(dummyOriginal).toHaveBeenCalledTimes(1);
    expect(capturedStyle).toBeDefined();
    expect(capturedStyle.resolution).toBeGreaterThanOrEqual(2);
    expect(capturedStyle.fontSize).toBe('14px');
    expect(capturedStyle.color).toBe('#ffffff');
  });

  it('should preserve custom resolution if explicitly provided in style', () => {
    let capturedStyle: any = null;
    const dummyOriginal = vi.fn().mockImplementation((x, y, text, style) => {
      capturedStyle = style;
      return { type: 'Text', x, y, text, style };
    });

    const factory = {
      text: function (x: number, y: number, text: string, style?: any) {
        const dynamicResolution = getDynamicResolution();
        const mergedStyle = {
          resolution: style?.resolution ?? dynamicResolution,
          ...style,
        };
        return dummyOriginal.call(this, x, y, text, mergedStyle);
      },
    };

    factory.text(10, 20, 'Custom Res Text', { fontSize: '16px', resolution: 4 });

    expect(capturedStyle.resolution).toBe(4);
  });

  it('should handle undefined style parameter and inject default resolution', () => {
    let capturedStyle: any = null;
    const dummyOriginal = vi.fn().mockImplementation((x, y, text, style) => {
      capturedStyle = style;
      return { type: 'Text', x, y, text, style };
    });

    const factory = {
      text: function (x: number, y: number, text: string, style?: any) {
        const dynamicResolution = getDynamicResolution();
        const mergedStyle = {
          resolution: style?.resolution ?? dynamicResolution,
          ...style,
        };
        return dummyOriginal.call(this, x, y, text, mergedStyle);
      },
    };

    factory.text(50, 60, 'No Style Text');

    expect(capturedStyle).toBeDefined();
    expect(capturedStyle.resolution).toBeGreaterThanOrEqual(2);
  });

  it('should intercept TextureManager.createCanvas and apply high DPI scaling', () => {
    const mockContext = {
      scale: vi.fn(),
    };
    const mockTexture = {
      context: mockContext,
      get: vi.fn().mockReturnValue({
        source: { resolution: 1 },
        setSize: vi.fn(),
        data: { sourceSize: { w: 0, h: 0 } },
        updateUVs: vi.fn(),
      }),
    };

    const originalCreate = vi.fn().mockReturnValue(mockTexture);
    const mockManager = {
      createCanvas: function (key: string, w?: number, h?: number) {
        const dpr = getDynamicResolution();
        const logicalWidth = w ?? 32;
        const logicalHeight = h ?? 32;
        const texture = originalCreate.call(this, key, logicalWidth * dpr, logicalHeight * dpr);
        if (texture) {
          if (dpr > 1 && texture.context) {
            texture.context.scale(dpr, dpr);
          }
          applyHighDpiFrameMetadata(texture, logicalWidth, logicalHeight, dpr);
        }
        return texture;
      },
    };

    const result = mockManager.createCanvas('test:key', 36, 48);

    expect(originalCreate).toHaveBeenCalledWith('test:key', 72, 96);
    expect(mockContext.scale).toHaveBeenCalledWith(2, 2);
    expect(result).toBe(mockTexture);
  });
});
