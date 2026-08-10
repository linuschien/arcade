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
    // 1. Pac-Man Open Mouth Texture (32x32 HD)
    if (!this.textures.exists('pacman:player_open')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfacc15, 1); // Yellow
      if (typeof (gfx as any).slice === 'function') {
        (gfx as any).slice(16, 16, 15, Phaser.Math.DegToRad(35), Phaser.Math.DegToRad(325), false);
        gfx.fillPath();
      } else {
        gfx.fillCircle(16, 16, 15);
      }
      gfx.generateTexture('pacman:player_open', 32, 32);
      gfx.destroy();
    }

    // 2. Pac-Man Closed Mouth Texture (32x32 HD)
    if (!this.textures.exists('pacman:player_closed')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfacc15, 1); // Yellow
      gfx.fillCircle(16, 16, 15);
      gfx.generateTexture('pacman:player_closed', 32, 32);
      gfx.destroy();
    }

    // Default key fallback
    if (!this.textures.exists('pacman:player')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfacc15, 1);
      gfx.fillCircle(16, 16, 15);
      gfx.generateTexture('pacman:player', 32, 32);
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
          (gfx as any).slice(16, 16, 15, startRad, endRad, false);
          gfx.fillPath();
        } else {
          gfx.fillCircle(16, 16, Math.max(2, 15 - idx * 1.5));
        }
        gfx.generateTexture(key, 32, 32);
        gfx.destroy();
      }
    });

    // Final pop death frames
    if (!this.textures.exists('pacman:death_8')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfacc15, 1);
      gfx.fillCircle(16, 16, 6);
      gfx.generateTexture('pacman:death_8', 32, 32);
      gfx.destroy();
    }
    if (!this.textures.exists('pacman:death_9')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfacc15, 1);
      gfx.fillCircle(16, 16, 3);
      gfx.generateTexture('pacman:death_9', 32, 32);
      gfx.destroy();
    }
    if (!this.textures.exists('pacman:death_10')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.generateTexture('pacman:death_10', 32, 32);
      gfx.destroy();
    }

    // Helper to draw authentic ghost body with 2-frame animated scalloped wavy skirt (32x32 HD)
    const drawGhostBodyWithSkirt = (gfx: Phaser.GameObjects.Graphics, color: number, frame: number = 0) => {
      gfx.fillStyle(color, 1);
      gfx.fillCircle(16, 13, 13);
      gfx.fillRect(3, 13, 26, 11);

      if (typeof (gfx as any).fillTriangle === 'function') {
        if (frame === 0) {
          // 3 Scalloped Wavy Feet (Frame 0 - Pattern A)
          (gfx as any).fillTriangle(3, 24, 7.3, 30, 11.6, 24);
          (gfx as any).fillTriangle(11.6, 24, 16, 30, 20.3, 24);
          (gfx as any).fillTriangle(20.3, 24, 24.6, 30, 29, 24);
        } else {
          // 4 Scalloped Wavy Feet (Frame 1 - Pattern B Shifted Ripple)
          (gfx as any).fillTriangle(3, 24, 5.5, 29, 8, 24);
          (gfx as any).fillTriangle(8, 24, 12, 29, 16, 24);
          (gfx as any).fillTriangle(16, 24, 20, 29, 24, 24);
          (gfx as any).fillTriangle(24, 24, 26.5, 29, 29, 24);
        }
      } else {
        gfx.fillRect(3, 24, 26, 5);
      }
    };

    // Helper to draw eyes facing a specific direction
    const drawGhostEyes = (gfx: Phaser.GameObjects.Graphics, dir: string) => {
      let offsetX = 0;
      let offsetY = 0;
      if (dir === 'left') offsetX = -2.5;
      else if (dir === 'right') offsetX = 2.5;
      else if (dir === 'up') offsetY = -2.5;
      else if (dir === 'down') offsetY = 2.5;

      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(10, 10, 5);
      gfx.fillCircle(22, 10, 5);
      gfx.fillStyle(0x1e3a8a, 1);
      gfx.fillCircle(10 + offsetX, 10 + offsetY, 2.5);
      gfx.fillCircle(22 + offsetX, 10 + offsetY, 2.5);
    };

    const directions = ['left', 'right', 'up', 'down'];

    // 4. Ghost Textures with 2-Frame Skirt Animation & Directional Eyes
    const ghostColors: Array<{ baseKey: string; color: number }> = [
      { baseKey: 'pacman:ghost_blinky', color: 0xef4444 }, // Red
      { baseKey: 'pacman:ghost_pinky', color: 0xf472b6 },  // Pink
      { baseKey: 'pacman:ghost_inky', color: 0x06b6d4 },   // Cyan
      { baseKey: 'pacman:ghost_clyde', color: 0xf97316 },  // Orange
    ];

    ghostColors.forEach(({ baseKey, color }) => {
      directions.forEach((dir) => {
        [0, 1].forEach((frame) => {
          const key = `${baseKey}_${dir}_${frame}`;
          if (!this.textures.exists(key)) {
            const gfx = this.make.graphics({ x: 0, y: 0 });
            drawGhostBodyWithSkirt(gfx, color, frame);
            drawGhostEyes(gfx, dir);
            gfx.generateTexture(key, 32, 32);

            // Fallback base keys
            if (frame === 0 && !this.textures.exists(`${baseKey}_${dir}`)) {
              gfx.generateTexture(`${baseKey}_${dir}`, 32, 32);
            }
            if (dir === 'left' && frame === 0 && !this.textures.exists(`${baseKey}_${frame}`)) {
              gfx.generateTexture(`${baseKey}_${frame}`, 32, 32);
            }
            if (dir === 'left' && frame === 0 && !this.textures.exists(baseKey)) {
              gfx.generateTexture(baseKey, 32, 32);
            }
            gfx.destroy();
          }
        });
      });
    });

    // 5. Frightened Ghost (Blue) 2-Frame Animation
    [0, 1].forEach((frame) => {
      const key = `pacman:ghost_frightened_${frame}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        drawGhostBodyWithSkirt(gfx, 0x1d4ed8, frame);

        gfx.fillStyle(0xfde047, 1);
        gfx.fillCircle(10, 10, 3.5);
        gfx.fillCircle(22, 10, 3.5);

        gfx.generateTexture(key, 32, 32);
        if (frame === 0 && !this.textures.exists('pacman:ghost_frightened')) {
          gfx.generateTexture('pacman:ghost_frightened', 32, 32);
        }
        gfx.destroy();
      }
    });

    // 6. Frightened Ghost Flashing (White/Blue) 2-Frame Animation
    [0, 1].forEach((frame) => {
      const key = `pacman:ghost_frightened_flash_${frame}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        drawGhostBodyWithSkirt(gfx, 0xf8fafc, frame); // White body

        gfx.fillStyle(0xef4444, 1); // Red eyes
        gfx.fillCircle(10, 10, 3.5);
        gfx.fillCircle(22, 10, 3.5);

        gfx.generateTexture(key, 32, 32);
        if (frame === 0 && !this.textures.exists('pacman:ghost_frightened_flash')) {
          gfx.generateTexture('pacman:ghost_frightened_flash', 32, 32);
        }
        gfx.destroy();
      }
    });

    // 7. Eaten Ghost Eyes Directional Textures
    directions.forEach((dir) => {
      const key = `pacman:ghost_eyes_${dir}`;
      if (!this.textures.exists(key)) {
        let offsetX = 0;
        let offsetY = 0;
        if (dir === 'left') offsetX = -3;
        else if (dir === 'right') offsetX = 3;
        else if (dir === 'up') offsetY = -3;
        else if (dir === 'down') offsetY = 3;

        const gfx = this.make.graphics({ x: 0, y: 0 });
        gfx.fillStyle(0xffffff, 1);
        gfx.fillCircle(10, 12, 6);
        gfx.fillCircle(22, 12, 6);
        gfx.fillStyle(0x1e3a8a, 1);
        gfx.fillCircle(10 + offsetX, 12 + offsetY, 3);
        gfx.fillCircle(22 + offsetX, 12 + offsetY, 3);
        gfx.generateTexture(key, 32, 32);
        if (dir === 'left' && !this.textures.exists('pacman:ghost_eyes')) {
          gfx.generateTexture('pacman:ghost_eyes', 32, 32);
        }
        gfx.destroy();
      }
    });

    // 8. Pellet
    if (!this.textures.exists('pacman:pellet')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfef08a, 1);
      gfx.fillCircle(4, 4, 3.5);
      gfx.generateTexture('pacman:pellet', 8, 8);
      gfx.destroy();
    }

    // 9. Power Pellet
    if (!this.textures.exists('pacman:power_pellet')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xfde047, 1);
      gfx.fillCircle(9, 9, 8);
      gfx.generateTexture('pacman:power_pellet', 18, 18);
      gfx.destroy();
    }

    // 10. Fruit Textures
    const fruitKeys = ['Cherry', 'Strawberry', 'Peach', 'Apple', 'Pineapple', 'Galaxian', 'Bell', 'Key'];
    fruitKeys.forEach((fruit) => {
      const key = `pacman:fruit_${fruit.toLowerCase()}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        gfx.fillStyle(0xef4444, 1);
        gfx.fillCircle(16, 17, 11);
        gfx.fillStyle(0x22c55e, 1);
        gfx.fillRect(14, 3, 4, 8);
        gfx.generateTexture(key, 32, 32);
        gfx.destroy();
      }
    });
  }
}
