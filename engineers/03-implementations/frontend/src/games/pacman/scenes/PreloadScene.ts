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

    const drawFrightenedFace = (gfx: Phaser.GameObjects.Graphics, color: number, frame: number = 0) => {
      // 1. Two small square eye dots
      gfx.fillStyle(color, 1);
      gfx.fillRect(8, 9, 4, 4);
      gfx.fillRect(20, 9, 4, 4);

      // 2. Wavy / Zigzag Animated Wiggling Mouth (Inverts wave between frame 0 & frame 1!)
      if (typeof (gfx as any).lineStyle === 'function') {
        (gfx as any).lineStyle(2, color, 1);
      }

      const isFrame0 = frame === 0;
      if (typeof (gfx as any).beginPath === 'function') {
        gfx.beginPath();
        if (isFrame0) {
          gfx.moveTo(6, 20);
          gfx.lineTo(9, 17);
          gfx.lineTo(12, 21);
          gfx.lineTo(15, 17);
          gfx.lineTo(18, 21);
          gfx.lineTo(21, 17);
          gfx.lineTo(24, 21);
          gfx.lineTo(26, 19);
        } else {
          gfx.moveTo(6, 18);
          gfx.lineTo(9, 21);
          gfx.lineTo(12, 17);
          gfx.lineTo(15, 21);
          gfx.lineTo(18, 17);
          gfx.lineTo(21, 21);
          gfx.lineTo(24, 17);
          gfx.lineTo(26, 20);
        }
        gfx.strokePath();
      } else {
        gfx.fillStyle(color, 1);
        if (isFrame0) {
          gfx.fillRect(6, 20, 3, 2);
          gfx.fillRect(9, 17, 3, 2);
          gfx.fillRect(12, 20, 3, 2);
          gfx.fillRect(15, 17, 3, 2);
          gfx.fillRect(18, 20, 3, 2);
          gfx.fillRect(21, 17, 3, 2);
          gfx.fillRect(24, 20, 3, 2);
        } else {
          gfx.fillRect(6, 18, 3, 2);
          gfx.fillRect(9, 21, 3, 2);
          gfx.fillRect(12, 17, 3, 2);
          gfx.fillRect(15, 21, 3, 2);
          gfx.fillRect(18, 17, 3, 2);
          gfx.fillRect(21, 21, 3, 2);
          gfx.fillRect(24, 17, 3, 2);
        }
      }
    };

    // 5. Frightened Ghost (Blue) 2-Frame Animation
    [0, 1].forEach((frame) => {
      const key = `pacman:ghost_frightened_${frame}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        drawGhostBodyWithSkirt(gfx, 0x1d4ed8, frame);
        drawFrightenedFace(gfx, 0xfde047, frame); // Yellow/Orange face with frame animation

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
        drawFrightenedFace(gfx, 0xef4444, frame); // Red face with frame animation

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

    // 10. Fruit Textures (Distinct HD Procedural Sprites for all 8 Arcade Fruits)
    const fruitDrawers: Record<string, (gfx: Phaser.GameObjects.Graphics) => void> = {
      cherry: (gfx) => {
        // Double Red Cherries with connected stems
        gfx.fillStyle(0xef4444, 1);
        gfx.fillCircle(10, 22, 6);
        gfx.fillCircle(21, 23, 6);
        // Highlights
        gfx.fillStyle(0xffffff, 0.8);
        gfx.fillCircle(8, 20, 1.8);
        gfx.fillCircle(19, 21, 1.8);
        // Stems & Leaf
        if (typeof (gfx as any).lineStyle === 'function') {
          (gfx as any).lineStyle(2, 0x16a34a, 1);
        }
        if (typeof (gfx as any).lineBetween === 'function') {
          (gfx as any).lineBetween(10, 16, 16, 5);
          (gfx as any).lineBetween(21, 17, 16, 5);
        }
        gfx.fillStyle(0x22c55e, 1);
        gfx.fillCircle(17, 6, 3);
      },
      strawberry: (gfx) => {
        // Red Strawberry Body
        gfx.fillStyle(0xdc2626, 1);
        gfx.fillCircle(16, 16, 9);
        if (typeof (gfx as any).fillTriangle === 'function') {
          (gfx as any).fillTriangle(7, 16, 25, 16, 16, 28);
        } else {
          gfx.fillRect(8, 16, 16, 10);
        }
        // Green Leaf Crown
        gfx.fillStyle(0x16a34a, 1);
        gfx.fillCircle(11, 8, 3.5);
        gfx.fillCircle(16, 7, 4);
        gfx.fillCircle(21, 8, 3.5);
        // Yellow Seeds
        gfx.fillStyle(0xfde047, 1);
        gfx.fillCircle(12, 15, 1);
        gfx.fillCircle(20, 15, 1);
        gfx.fillCircle(16, 20, 1);
        gfx.fillCircle(12, 23, 1);
        gfx.fillCircle(20, 23, 1);
      },
      peach: (gfx) => {
        // Peach / Orange Melon Body
        gfx.fillStyle(0xf97316, 1);
        gfx.fillCircle(16, 18, 11);
        // Peach Highlight & Crease
        gfx.fillStyle(0xfdba74, 1);
        gfx.fillCircle(13, 15, 6);
        if (typeof (gfx as any).lineStyle === 'function') {
          (gfx as any).lineStyle(2, 0xc2410c, 0.8);
        }
        if (typeof (gfx as any).lineBetween === 'function') {
          (gfx as any).lineBetween(16, 8, 16, 27);
        }
        // Brown Stem & Green Leaf
        gfx.fillStyle(0x78350f, 1);
        gfx.fillRect(15, 3, 3, 6);
        gfx.fillStyle(0x22c55e, 1);
        gfx.fillCircle(20, 6, 3.5);
      },
      apple: (gfx) => {
        // Bright Red Apple
        gfx.fillStyle(0xef4444, 1);
        gfx.fillCircle(12, 17, 8.5);
        gfx.fillCircle(20, 17, 8.5);
        gfx.fillRect(9, 17, 14, 8);
        // Highlight
        gfx.fillStyle(0xffffff, 0.8);
        gfx.fillCircle(9, 14, 2);
        // Stem & Leaf
        gfx.fillStyle(0x78350f, 1);
        gfx.fillRect(15, 3, 2, 7);
        gfx.fillStyle(0x16a34a, 1);
        gfx.fillCircle(20, 5, 3.5);
      },
      pineapple: (gfx) => {
        // Pineapple Body & Spiky Green Crown
        gfx.fillStyle(0x15803d, 1);
        gfx.fillRect(10, 2, 3, 10);
        gfx.fillRect(15, 1, 3, 11);
        gfx.fillRect(20, 2, 3, 10);
        // Golden Yellow Body
        gfx.fillStyle(0xeab308, 1);
        gfx.fillCircle(16, 20, 10);
        // Crosshatch Lines
        if (typeof (gfx as any).lineStyle === 'function') {
          (gfx as any).lineStyle(1.5, 0xa16207, 0.9);
        }
        if (typeof (gfx as any).lineBetween === 'function') {
          (gfx as any).lineBetween(8, 16, 24, 24);
          (gfx as any).lineBetween(8, 24, 24, 16);
        }
      },
      galaxian: (gfx) => {
        // Galaxian Flagship
        gfx.fillStyle(0x2563eb, 1); // Blue Wings
        if (typeof (gfx as any).fillTriangle === 'function') {
          (gfx as any).fillTriangle(4, 10, 16, 28, 28, 10);
        } else {
          gfx.fillRect(6, 10, 20, 12);
        }
        gfx.fillStyle(0xfacc15, 1); // Yellow Hull
        gfx.fillRect(12, 6, 8, 18);
        gfx.fillStyle(0xef4444, 1); // Red Core
        gfx.fillCircle(16, 15, 4);
      },
      bell: (gfx) => {
        // Golden Yellow Bell
        gfx.fillStyle(0xf59e0b, 1);
        gfx.fillCircle(16, 14, 8);
        gfx.fillRect(7, 14, 18, 10);
        gfx.fillRect(4, 21, 24, 4);
        // Highlight & Clapper
        gfx.fillStyle(0xfef08a, 1);
        gfx.fillCircle(12, 13, 2.5);
        gfx.fillStyle(0x0284c7, 1); // Cyan Clapper
        gfx.fillCircle(16, 26, 3.5);
      },
      key: (gfx) => {
        // Cyan / Silver Key
        if (typeof (gfx as any).lineStyle === 'function') {
          (gfx as any).lineStyle(3, 0x38bdf8, 1);
        }
        if (typeof (gfx as any).strokeCircle === 'function') {
          (gfx as any).strokeCircle(16, 8, 6);
        } else {
          gfx.fillStyle(0x38bdf8, 1);
          gfx.fillCircle(16, 8, 6);
        }
        gfx.fillStyle(0x38bdf8, 1);
        gfx.fillRect(14, 14, 4, 15);
        gfx.fillRect(18, 20, 5, 3);
        gfx.fillRect(18, 25, 5, 3);
      },
    };

    Object.entries(fruitDrawers).forEach(([fruitName, drawFn]) => {
      const key = `pacman:fruit_${fruitName}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        drawFn(gfx);
        gfx.generateTexture(key, 32, 32);
        gfx.destroy();
      }
    });
  }
}
