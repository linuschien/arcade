/**
 * init-high-dpi.ts
 * Global High-DPI & Retina display optimization for Phaser 4 in Arcade Stadium.
 *
 * Automatically injects optimal text resolution across all Phaser scenes
 * without modifying game logic or polluting domain models.
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

// Global text factory interception (Domain-agnostic, zero special cases)
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
