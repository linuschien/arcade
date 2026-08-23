/**
 * init-high-dpi.test.ts
 * Unit tests for Phaser High-DPI initialization and resolution helper.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { getDynamicResolution } from '../init-high-dpi';
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

  it('should have patched Phaser.GameObjects.GameObjectFactory.prototype.text with __highDpiPatched flag', () => {
    const textProto = Phaser.GameObjects.GameObjectFactory.prototype.text as any;
    expect(textProto.__highDpiPatched).toBe(true);
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
});
