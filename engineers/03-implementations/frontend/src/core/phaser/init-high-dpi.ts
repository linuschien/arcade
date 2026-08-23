/**
 * init-high-dpi.ts
 * Global High-DPI & Retina display optimization for Phaser 4 in Arcade Stadium.
 *
 * Automatically injects optimal text resolution and procedural texture metadata (Canvas 2D & Graphics)
 * across all Phaser scenes without modifying game logic or polluting domain models.
 */

import Phaser from 'phaser';

/**
 * Returns dynamic pixel resolution clamped between [2, 3] for crisp rendering on HiDPI displays.
 */
export const getDynamicResolution = (): number => {
  if (typeof window === 'undefined') return 2;
  const dpr = window.devicePixelRatio || 1;
  return Math.min(Math.max(dpr, 2), 3);
};

/**
 * Updates texture frame resolution, logical dimensions, and UV mapping for high-DPI scaling.
 */
export function applyHighDpiFrameMetadata(
  texture: any,
  logicalWidth: number,
  logicalHeight: number,
  scale: number
): void {
  const frame = typeof texture?.get === 'function' ? texture.get('__BASE') : null;
  if (frame) {
    if (frame.source) {
      frame.source.resolution = scale;
    }
    if (typeof frame.setSize === 'function') {
      frame.setSize(logicalWidth * scale, logicalHeight * scale);
    }
    frame.width = logicalWidth;
    frame.height = logicalHeight;
    frame.halfWidth = Math.floor(logicalWidth * 0.5);
    frame.halfHeight = Math.floor(logicalHeight * 0.5);
    frame.centerX = Math.floor(logicalWidth / 2);
    frame.centerY = Math.floor(logicalHeight / 2);

    if (frame.data?.sourceSize) {
      frame.data.sourceSize.w = logicalWidth;
      frame.data.sourceSize.h = logicalHeight;
    }
    if (typeof frame.updateUVs === 'function') {
      frame.updateUVs();
    }
  }
}

// 1. Global Text Factory interception (Automatic High-DPI text resolution)
if (typeof Phaser !== 'undefined' && Phaser.GameObjects?.GameObjectFactory) {
  const originalText = Phaser.GameObjects.GameObjectFactory.prototype.text;
  if (originalText && !(originalText as any).__highDpiPatched) {
    Phaser.GameObjects.GameObjectFactory.prototype.text = function (
      x: number,
      y: number,
      text: string | string[],
      style?: Phaser.Types.GameObjects.Text.TextStyle
    ) {
      const dynamicResolution = getDynamicResolution();
      const mergedStyle: Phaser.Types.GameObjects.Text.TextStyle = {
        resolution: style?.resolution ?? dynamicResolution,
        ...style,
      };

      return originalText.call(this, x, y, text, mergedStyle);
    };
    (Phaser.GameObjects.GameObjectFactory.prototype.text as any).__highDpiPatched = true;
  }
}

// 2. Global CanvasTexture Factory interception (Automatic High-DPI TextureManager.createCanvas)
if (typeof Phaser !== 'undefined' && Phaser.Textures?.TextureManager) {
  const originalCreateCanvas = Phaser.Textures.TextureManager.prototype.createCanvas;
  if (originalCreateCanvas && !(originalCreateCanvas as any).__highDpiPatched) {
    Phaser.Textures.TextureManager.prototype.createCanvas = function (
      key: string,
      width?: number,
      height?: number
    ) {
      const dpr = getDynamicResolution();
      const logicalWidth = width ?? 32;
      const logicalHeight = height ?? 32;

      const texture = originalCreateCanvas.call(
        this,
        key,
        logicalWidth * dpr,
        logicalHeight * dpr
      );

      if (texture) {
        if (dpr > 1 && texture.context) {
          texture.context.scale(dpr, dpr);
        }
        applyHighDpiFrameMetadata(texture, logicalWidth, logicalHeight, dpr);
      }

      return texture;
    };
    (Phaser.Textures.TextureManager.prototype.createCanvas as any).__highDpiPatched = true;
  }
}

// 3. Global Graphics Texture generation interception (Automatic High-DPI Graphics supersampling)
if (typeof Phaser !== 'undefined' && Phaser.GameObjects?.Graphics) {
  const originalGenerateTexture = Phaser.GameObjects.Graphics.prototype.generateTexture;
  if (originalGenerateTexture && !(originalGenerateTexture as any).__highDpiPatched) {
    Phaser.GameObjects.Graphics.prototype.generateTexture = function (
      key: string,
      width?: number,
      height?: number
    ) {
      const dpr = getDynamicResolution();
      const logicalWidth = width ?? (this as any).width ?? 32;
      const logicalHeight = height ?? (this as any).height ?? 32;

      if (dpr > 1) {
        this.setScale(dpr, dpr);
      }

      const result = originalGenerateTexture.call(
        this,
        key,
        logicalWidth * dpr,
        logicalHeight * dpr
      );

      const texture = (this.scene?.textures as any)?.get?.(key);
      if (texture && dpr > 1) {
        applyHighDpiFrameMetadata(texture, logicalWidth, logicalHeight, dpr);
      }

      return result;
    };
    (Phaser.GameObjects.Graphics.prototype.generateTexture as any).__highDpiPatched = true;
  }
}
