/**
 * PreloadScene.ts
 * Generates and preloads all namespaced textures ('pacman:*') procedurally.
 * Features authentic 2-frame ghost skirt flutter walking animations and rich fruit textures.
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

    // 3. Pac-Man Death Wilting Animation Textures (pacman:death_0 .. pacman:death_10)
    const deathAngles = [40, 70, 110, 150, 190, 240, 300, 340];
    deathAngles.forEach((angleDeg, idx) => {
      const key = `pacman:death_${idx}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        gfx.fillStyle(0xfacc15, 1);
        const startRad = Phaser.Math.DegToRad(angleDeg / 2);
        const endRad = Phaser.Math.DegToRad(360 - angleDeg / 2);
        if (typeof (gfx as any).slice === 'function') {
          (gfx as any).slice(10, 10, 9, startRad, endRad, false);
          gfx.fillPath();
        } else {
          gfx.fillCircle(10, 10, Math.max(1, 9 - idx));
        }
        gfx.generateTexture(key, 20, 20);
        gfx.destroy();
      }
    });

    // Final pop death frames
    if (!this.textures.exists('pacman:death_8')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfacc15, 1);
      gfx.fillCircle(10, 10, 4);
      gfx.generateTexture('pacman:death_8', 20, 20);
      gfx.destroy();
    }
    if (!this.textures.exists('pacman:death_9')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfacc15, 1);
      gfx.fillCircle(10, 10, 1.5);
      gfx.generateTexture('pacman:death_9', 20, 20);
      gfx.destroy();
    }
    if (!this.textures.exists('pacman:death_10')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.generateTexture('pacman:death_10', 20, 20);
      gfx.destroy();
    }

    // Helper to draw authentic ghost body with 2-frame animated scalloped wavy skirt
    const drawGhostBodyWithSkirt = (gfx: Phaser.GameObjects.Graphics, color: number, frame: number = 0) => {
      gfx.fillStyle(color, 1);
      gfx.fillCircle(10, 8, 8);
      gfx.fillRect(2, 8, 16, 7);

      if (typeof (gfx as any).fillTriangle === 'function') {
        if (frame === 0) {
          // 3 Scalloped Wavy Feet (Frame 0 - Pattern A)
          (gfx as any).fillTriangle(2, 15, 4.6, 19, 7.3, 15);
          (gfx as any).fillTriangle(7.3, 15, 10, 19, 12.7, 15);
          (gfx as any).fillTriangle(12.7, 15, 15.4, 19, 18, 15);
        } else {
          // 4 Scalloped Wavy Feet (Frame 1 - Pattern B Shifted Ripple)
          (gfx as any).fillTriangle(2, 15, 3.5, 18, 5, 15);
          (gfx as any).fillTriangle(5, 15, 7.5, 18, 10, 15);
          (gfx as any).fillTriangle(10, 15, 12.5, 18, 15, 15);
          (gfx as any).fillTriangle(15, 15, 17.5, 18, 18, 15);
        }
      } else {
        gfx.fillRect(2, 15, 16, 3);
      }
    };

    // 4. Ghost Textures with 2-Frame Skirt Animation (Blinky, Pinky, Inky, Clyde)
    const ghostColors: Array<{ baseKey: string; color: number }> = [
      { baseKey: 'pacman:ghost_blinky', color: 0xef4444 }, // Red
      { baseKey: 'pacman:ghost_pinky', color: 0xf472b6 },  // Pink
      { baseKey: 'pacman:ghost_inky', color: 0x06b6d4 },   // Cyan
      { baseKey: 'pacman:ghost_clyde', color: 0xf97316 },  // Orange
    ];

    ghostColors.forEach(({ baseKey, color }) => {
      [0, 1].forEach((frame) => {
        const key = `${baseKey}_${frame}`;
        if (!this.textures.exists(key)) {
          const gfx = this.make.graphics({ x: 0, y: 0 });
          drawGhostBodyWithSkirt(gfx, color, frame);

          // Eyes
          gfx.fillStyle(0xffffff, 1);
          gfx.fillCircle(6, 6, 3);
          gfx.fillCircle(14, 6, 3);
          gfx.fillStyle(0x1e3a8a, 1);
          gfx.fillCircle(6, 6, 1.5);
          gfx.fillCircle(14, 6, 1.5);

          gfx.generateTexture(key, 20, 20);
          if (frame === 0 && !this.textures.exists(baseKey)) {
            gfx.generateTexture(baseKey, 20, 20);
          }
          gfx.destroy();
        }
      });
    });

    // 5. Frightened Ghost (Blue) 2-Frame Animation
    [0, 1].forEach((frame) => {
      const key = `pacman:ghost_frightened_${frame}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        drawGhostBodyWithSkirt(gfx, 0x1d4ed8, frame);

        gfx.fillStyle(0xfde047, 1);
        gfx.fillCircle(6, 6, 2);
        gfx.fillCircle(14, 6, 2);
        gfx.generateTexture(key, 20, 20);
        if (frame === 0 && !this.textures.exists('pacman:ghost_frightened')) {
          gfx.generateTexture('pacman:ghost_frightened', 20, 20);
        }
        gfx.destroy();
      }
    });

    // 6. Frightened Flashing Ghost (White) 2-Frame Animation
    [0, 1].forEach((frame) => {
      const key = `pacman:ghost_frightened_flash_${frame}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        drawGhostBodyWithSkirt(gfx, 0xf8fafc, frame);

        gfx.fillStyle(0xef4444, 1);
        gfx.fillCircle(6, 6, 2);
        gfx.fillCircle(14, 6, 2);
        gfx.generateTexture(key, 20, 20);
        if (frame === 0 && !this.textures.exists('pacman:ghost_frightened_flash')) {
          gfx.generateTexture('pacman:ghost_frightened_flash', 20, 20);
        }
        gfx.destroy();
      }
    });

    // 7. Eaten Ghost Eyes
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

    // 8. Pellet
    if (!this.textures.exists('pacman:pellet')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfef08a, 1);
      gfx.fillCircle(3, 3, 2.5);
      gfx.generateTexture('pacman:pellet', 6, 6);
      gfx.destroy();
    }

    // 9. Power Pellet
    if (!this.textures.exists('pacman:power_pellet')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfde047, 1);
      gfx.fillCircle(6, 6, 5.5);
      gfx.generateTexture('pacman:power_pellet', 12, 12);
      gfx.destroy();
    }

    // 10. Fruit Textures
    const fruitKeys = ['Cherry', 'Strawberry', 'Peach', 'Apple', 'Pineapple', 'Galaxian', 'Bell', 'Key'];
    fruitKeys.forEach((fruit) => {
      const key = `pacman:fruit_${fruit.toLowerCase()}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        gfx.fillStyle(0xef4444, 1);
        gfx.fillCircle(10, 11, 7);
        gfx.fillStyle(0x22c55e, 1);
        gfx.fillRect(9, 2, 2, 5);
        gfx.generateTexture(key, 20, 20);
        gfx.destroy();
      }
    });
  }
}
