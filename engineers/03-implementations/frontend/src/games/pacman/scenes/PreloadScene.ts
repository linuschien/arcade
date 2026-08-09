/**
 * PreloadScene.ts
 * Generates and preloads all namespaced textures ('pacman:*') procedurally.
 */

import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'pacman:PreloadScene' });
  }

  public preload(): void {
    this.createProceduralTextures();
  }

  public create(): void {
    this.scene.start('pacman:MainGameScene');
  }

  private createProceduralTextures(): void {
    // 1. Pac-Man Open Mouth Texture
    if (!this.textures.exists('pacman:player_open')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfacc15, 1); // Yellow
      if (typeof (gfx as any).slice === 'function') {
        (gfx as any).slice(10, 10, 9, Phaser.Math.DegToRad(35), Phaser.Math.DegToRad(325), false);
        gfx.fillPath();
      } else {
        gfx.fillCircle(10, 10, 9);
      }
      gfx.generateTexture('pacman:player_open', 20, 20);
      gfx.destroy();
    }

    // 2. Pac-Man Closed Mouth Texture
    if (!this.textures.exists('pacman:player_closed')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfacc15, 1); // Yellow
      gfx.fillCircle(10, 10, 9);
      gfx.generateTexture('pacman:player_closed', 20, 20);
      gfx.destroy();
    }

    // Default key fallback
    if (!this.textures.exists('pacman:player')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfacc15, 1);
      gfx.fillCircle(10, 10, 9);
      gfx.generateTexture('pacman:player', 20, 20);
      gfx.destroy();
    }

    // 3. Ghost Textures (Blinky, Pinky, Inky, Clyde)
    const ghostColors: Array<{ key: string; color: number }> = [
      { key: 'pacman:ghost_blinky', color: 0xef4444 }, // Red
      { key: 'pacman:ghost_pinky', color: 0xf472b6 },  // Pink
      { key: 'pacman:ghost_inky', color: 0x06b6d4 },   // Cyan
      { key: 'pacman:ghost_clyde', color: 0xf97316 },  // Orange
    ];

    ghostColors.forEach(({ key, color }) => {
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        gfx.fillStyle(color, 1);
        gfx.fillCircle(10, 8, 8);
        gfx.fillRect(2, 8, 16, 10);

        // Eyes
        gfx.fillStyle(0xffffff, 1);
        gfx.fillCircle(6, 6, 3);
        gfx.fillCircle(14, 6, 3);
        gfx.fillStyle(0x1e3a8a, 1);
        gfx.fillCircle(6, 6, 1.5);
        gfx.fillCircle(14, 6, 1.5);

        gfx.generateTexture(key, 20, 20);
        gfx.destroy();
      }
    });

    // 4. Frightened Ghost (Blue)
    if (!this.textures.exists('pacman:ghost_frightened')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0x1d4ed8, 1);
      gfx.fillCircle(10, 8, 8);
      gfx.fillRect(2, 8, 16, 10);
      gfx.fillStyle(0xfde047, 1);
      gfx.fillCircle(6, 6, 2);
      gfx.fillCircle(14, 6, 2);
      gfx.generateTexture('pacman:ghost_frightened', 20, 20);
      gfx.destroy();
    }

    // 5. Frightened Flashing Ghost (White)
    if (!this.textures.exists('pacman:ghost_frightened_flash')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xf8fafc, 1);
      gfx.fillCircle(10, 8, 8);
      gfx.fillRect(2, 8, 16, 10);
      gfx.fillStyle(0xef4444, 1);
      gfx.fillCircle(6, 6, 2);
      gfx.fillCircle(14, 6, 2);
      gfx.generateTexture('pacman:ghost_frightened_flash', 20, 20);
      gfx.destroy();
    }

    // 6. Eaten Ghost Eyes
    if (!this.textures.exists('pacman:ghost_eyes')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(6, 8, 4);
      gfx.fillCircle(14, 8, 4);
      gfx.fillStyle(0x1e3a8a, 1);
      gfx.fillCircle(6, 8, 2);
      gfx.fillCircle(14, 8, 2);
      gfx.generateTexture('pacman:ghost_eyes', 20, 20);
      gfx.destroy();
    }

    // 7. Pellet
    if (!this.textures.exists('pacman:pellet')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfef08a, 1);
      gfx.fillCircle(3, 3, 2.5);
      gfx.generateTexture('pacman:pellet', 6, 6);
      gfx.destroy();
    }

    // 8. Power Pellet
    if (!this.textures.exists('pacman:power_pellet')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfde047, 1);
      gfx.fillCircle(6, 6, 5.5);
      gfx.generateTexture('pacman:power_pellet', 12, 12);
      gfx.destroy();
    }

    // 9. Fruit Textures
    const fruitKeys = ['Cherry', 'Strawberry', 'Peach', 'Apple', 'Pineapple', 'Galaxian', 'Bell', 'Key'];
    fruitKeys.forEach((fruit) => {
      const key = `pacman:fruit_${fruit.toLowerCase()}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        gfx.fillStyle(0xef4444, 1);
        gfx.fillCircle(8, 8, 7);
        gfx.fillStyle(0x22c55e, 1);
        gfx.fillRect(7, 1, 2, 4);
        gfx.generateTexture(key, 16, 16);
        gfx.destroy();
      }
    });
  }
}
