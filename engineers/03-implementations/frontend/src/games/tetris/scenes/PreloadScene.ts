/**
 * PreloadScene.ts
 * Preloads and dynamically generates texture assets namespaced with `${game_id}:`.
 * Enforces strict WebGL texture teardown on Scene SHUTDOWN / DESTROY.
 */

import Phaser from 'phaser';

export const GAME_ID = 'tetris';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: `${GAME_ID}:PreloadScene` });
  }

  preload(): void {
    // Generate block texture sprites dynamically for 7 tetromino colors
    const colors: Record<string, number> = {
      I: 0x00f0f0, // Cyan
      J: 0x0000f0, // Blue
      L: 0xf0a000, // Orange
      O: 0xf0f000, // Yellow
      S: 0x00f000, // Green
      T: 0xa000f0, // Purple
      Z: 0xf00000, // Red
      GHOST: 0x444444, // Ghost
    };

    const blockSize = 32;

    Object.entries(colors).forEach(([key, colorHex]) => {
      const textureKey = `${GAME_ID}:block_${key}`;
      if (!this.textures.exists(textureKey)) {
        const graphics = this.make.graphics({ x: 0, y: 0 });
        
        // Fill main block rectangle
        graphics.fillStyle(colorHex, 1);
        graphics.fillRect(0, 0, blockSize, blockSize);

        // Add 3D bevel borders
        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillRect(0, 0, blockSize, 4);
        graphics.fillRect(0, 0, 4, blockSize);

        graphics.fillStyle(0x000000, 0.4);
        graphics.fillRect(0, blockSize - 4, blockSize, 4);
        graphics.fillRect(blockSize - 4, 0, 4, blockSize);

        graphics.generateTexture(textureKey, blockSize, blockSize);
        graphics.destroy();
      }
    });

    // Cleanup handlers
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.onShutdown, this);
  }

  create(): void {
    this.scene.start(`${GAME_ID}:MainGameScene`);
  }

  private onShutdown(): void {
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.onShutdown, this);

    // Explicit WebGL texture removal
    ['I', 'J', 'L', 'O', 'S', 'T', 'Z', 'GHOST'].forEach((key) => {
      const textureKey = `${GAME_ID}:block_${key}`;
      if (this.textures.exists(textureKey)) {
        this.textures.removeKey(textureKey);
      }
    });
  }
}
