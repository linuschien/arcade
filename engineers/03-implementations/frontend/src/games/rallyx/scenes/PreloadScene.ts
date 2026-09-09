/**
 * PreloadScene.ts
 * Generates and preloads all namespaced textures ('rallyx:*') procedurally at native 48x48 resolution.
 * Features authentic Formula 1 player/enemy cars, dirt mounds (土堆), 3 flag types (Regular, S, L),
 * smoke puffs, and crash debris without digital scaling blur.
 */

import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'rallyx:PreloadScene' });
  }

  public preload(): void {
    this.createProceduralTextures();
  }

  public create(): void {
    this.scene.start('rallyx:MainGameScene');
  }

  private createProceduralTextures(): void {
    const size = 48;

    // Helper to draw a Formula 1 racing car in 4 directions at native 48x48
    const drawFormulaCar = (
      gfx: Phaser.GameObjects.Graphics,
      bodyColor: number,
      stripeColor: number,
      dir: 'up' | 'down' | 'left' | 'right'
    ) => {
      const tireColor = 0x0f172a; // Dark charcoal
      const rimColor = 0x334155;  // Wheel rim
      const cockpitColor = 0xf8fafc; // White helmet

      if (dir === 'up') {
        // Tires (4 corners)
        gfx.fillStyle(tireColor, 1);
        gfx.fillRect(6, 7, 8, 12);   // Front Left
        gfx.fillRect(34, 7, 8, 12);  // Front Right
        gfx.fillRect(5, 28, 9, 14);  // Rear Left
        gfx.fillRect(34, 28, 9, 14); // Rear Right

        // Wheel Rims
        gfx.fillStyle(rimColor, 1);
        gfx.fillRect(8, 9, 4, 8);
        gfx.fillRect(36, 9, 4, 8);
        gfx.fillRect(7, 31, 5, 8);
        gfx.fillRect(36, 31, 5, 8);

        // Main Chassis & Nosecone
        gfx.fillStyle(bodyColor, 1);
        gfx.fillRect(16, 6, 16, 36);
        if (typeof (gfx as any).fillTriangle === 'function') {
          (gfx as any).fillTriangle(16, 12, 32, 12, 24, 3);
        }

        // Front & Rear Wings
        gfx.fillRect(9, 6, 30, 4);   // Front Wing
        gfx.fillRect(7, 39, 34, 5);  // Rear Spoiler

        // Racing Stripe
        gfx.fillStyle(stripeColor, 1);
        gfx.fillRect(21, 6, 6, 28);

        // Cockpit opening
        gfx.fillStyle(0x020617, 1);
        gfx.fillRect(20, 18, 8, 11);

        // Driver Helmet & Visor
        gfx.fillStyle(cockpitColor, 1);
        gfx.fillCircle(24, 23, 4.5);
        gfx.fillStyle(0x0f172a, 1);
        gfx.fillRect(22, 20, 4, 2);
      } else if (dir === 'down') {
        // Tires
        gfx.fillStyle(tireColor, 1);
        gfx.fillRect(6, 29, 8, 12);  // Front Left
        gfx.fillRect(34, 29, 8, 12); // Front Right
        gfx.fillRect(5, 6, 9, 14);   // Rear Left
        gfx.fillRect(34, 6, 9, 14);  // Rear Right

        // Wheel Rims
        gfx.fillStyle(rimColor, 1);
        gfx.fillRect(8, 31, 4, 8);
        gfx.fillRect(36, 31, 4, 8);
        gfx.fillRect(7, 9, 5, 8);
        gfx.fillRect(36, 9, 5, 8);

        // Main Chassis & Nosecone
        gfx.fillStyle(bodyColor, 1);
        gfx.fillRect(16, 6, 16, 36);
        if (typeof (gfx as any).fillTriangle === 'function') {
          (gfx as any).fillTriangle(16, 36, 32, 36, 24, 45);
        }

        // Front & Rear Wings
        gfx.fillRect(9, 38, 30, 4);
        gfx.fillRect(7, 4, 34, 5);

        // Racing Stripe
        gfx.fillStyle(stripeColor, 1);
        gfx.fillRect(21, 14, 6, 28);

        // Cockpit opening
        gfx.fillStyle(0x020617, 1);
        gfx.fillRect(20, 19, 8, 11);

        // Driver Helmet
        gfx.fillStyle(cockpitColor, 1);
        gfx.fillCircle(24, 25, 4.5);
        gfx.fillStyle(0x0f172a, 1);
        gfx.fillRect(22, 26, 4, 2);
      } else if (dir === 'left') {
        // Tires
        gfx.fillStyle(tireColor, 1);
        gfx.fillRect(7, 6, 12, 8);   // Front Top
        gfx.fillRect(7, 34, 12, 8);  // Front Bottom
        gfx.fillRect(28, 5, 14, 9);  // Rear Top
        gfx.fillRect(28, 34, 14, 9); // Rear Bottom

        // Wheel Rims
        gfx.fillStyle(rimColor, 1);
        gfx.fillRect(9, 8, 8, 4);
        gfx.fillRect(9, 36, 8, 4);
        gfx.fillRect(31, 7, 8, 5);
        gfx.fillRect(31, 36, 8, 5);

        // Main Chassis & Nosecone
        gfx.fillStyle(bodyColor, 1);
        gfx.fillRect(6, 16, 36, 16);
        if (typeof (gfx as any).fillTriangle === 'function') {
          (gfx as any).fillTriangle(12, 16, 12, 32, 3, 24);
        }

        // Wings
        gfx.fillRect(6, 9, 4, 30);
        gfx.fillRect(39, 7, 5, 34);

        // Stripe
        gfx.fillStyle(stripeColor, 1);
        gfx.fillRect(6, 21, 28, 6);

        // Cockpit
        gfx.fillStyle(0x020617, 1);
        gfx.fillRect(18, 20, 11, 8);

        // Driver Helmet
        gfx.fillStyle(cockpitColor, 1);
        gfx.fillCircle(23, 24, 4.5);
        gfx.fillStyle(0x0f172a, 1);
        gfx.fillRect(20, 22, 2, 4);
      } else if (dir === 'right') {
        // Tires
        gfx.fillStyle(tireColor, 1);
        gfx.fillRect(29, 6, 12, 8);  // Front Top
        gfx.fillRect(29, 34, 12, 8); // Front Bottom
        gfx.fillRect(6, 5, 14, 9);   // Rear Top
        gfx.fillRect(6, 34, 14, 9);  // Rear Bottom

        // Wheel Rims
        gfx.fillStyle(rimColor, 1);
        gfx.fillRect(31, 8, 8, 4);
        gfx.fillRect(31, 36, 8, 4);
        gfx.fillRect(9, 7, 8, 5);
        gfx.fillRect(9, 36, 8, 5);

        // Main Chassis & Nosecone
        gfx.fillStyle(bodyColor, 1);
        gfx.fillRect(6, 16, 36, 16);
        if (typeof (gfx as any).fillTriangle === 'function') {
          (gfx as any).fillTriangle(36, 16, 36, 32, 45, 24);
        }

        // Wings
        gfx.fillRect(38, 9, 4, 30);
        gfx.fillRect(4, 7, 5, 34);

        // Stripe
        gfx.fillStyle(stripeColor, 1);
        gfx.fillRect(14, 21, 28, 6);

        // Cockpit
        gfx.fillStyle(0x020617, 1);
        gfx.fillRect(19, 20, 11, 8);

        // Driver Helmet
        gfx.fillStyle(cockpitColor, 1);
        gfx.fillCircle(25, 24, 4.5);
        gfx.fillStyle(0x0f172a, 1);
        gfx.fillRect(26, 22, 2, 4);
      }
    };

    const directions: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];

    // 1. Blue Player Car (rallyx:player_{up,down,left,right})
    directions.forEach((dir) => {
      const key = `rallyx:player_${dir}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        drawFormulaCar(gfx, 0x2563eb, 0xffffff, dir); // Vivid Blue with white racing stripe
        gfx.generateTexture(key, size, size);
        if (dir === 'up' && !this.textures.exists('rallyx:player')) {
          gfx.generateTexture('rallyx:player', size, size);
        }
        gfx.destroy();
      }
    });

    // 2. Red Enemy Car (rallyx:enemy_{up,down,left,right})
    directions.forEach((dir) => {
      const key = `rallyx:enemy_${dir}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        drawFormulaCar(gfx, 0xdc2626, 0xfacc15, dir); // Crimson Red with yellow racing stripe
        gfx.generateTexture(key, size, size);
        if (dir === 'up' && !this.textures.exists('rallyx:enemy')) {
          gfx.generateTexture('rallyx:enemy', size, size);
        }
        gfx.destroy();
      }
    });

    // 3. Smoke Puff (rallyx:smoke)
    if (!this.textures.exists('rallyx:smoke')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xe2e8f0, 0.85); // Light slate smoke
      gfx.fillCircle(24, 24, 15);
      gfx.fillCircle(15, 21, 11);
      gfx.fillCircle(33, 21, 11);
      gfx.fillCircle(24, 15, 9);
      gfx.fillCircle(24, 33, 9);
      gfx.fillStyle(0xffffff, 0.95);
      gfx.fillCircle(21, 21, 6);
      gfx.generateTexture('rallyx:smoke', size, size);
      gfx.destroy();
    }

    // 4. Dirt Mound Obstacle (rallyx:rock) - Authentic arcade 土堆
    if (!this.textures.exists('rallyx:rock')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });

      // Base soil shadow
      gfx.fillStyle(0x3f1d0b, 1); // Deep earth shadow
      gfx.fillRect(8, 36, 32, 6);

      // Main dirt mound layers (tapered dome)
      gfx.fillStyle(0x78350f, 1); // Dark soil base layer
      gfx.fillCircle(24, 32, 14);
      gfx.fillCircle(14, 34, 8);
      gfx.fillCircle(34, 34, 8);

      gfx.fillStyle(0x92400e, 1); // Rich earth brown body
      gfx.fillCircle(24, 26, 11);
      gfx.fillCircle(18, 29, 7);
      gfx.fillCircle(30, 29, 7);

      gfx.fillStyle(0xb45309, 1); // Warm clay upper dome
      gfx.fillCircle(24, 20, 8);

      gfx.fillStyle(0xd97706, 1); // Sunlit sandy mound crest
      gfx.fillCircle(23, 15, 5.5);

      gfx.fillStyle(0xf59e0b, 1); // Peak dirt highlight
      gfx.fillCircle(23, 14, 2.5);

      // Dirt granules & pebbles
      gfx.fillStyle(0x451a03, 1); // Dark soil pebbles
      gfx.fillRect(13, 32, 3, 3);
      gfx.fillRect(31, 31, 3, 3);
      gfx.fillRect(20, 24, 3, 3);
      gfx.fillRect(27, 21, 3, 3);

      gfx.fillStyle(0xfde68a, 1); // Light sand specks
      gfx.fillRect(21, 17, 2, 2);
      gfx.fillRect(26, 24, 2, 2);
      gfx.fillRect(15, 27, 2, 2);

      gfx.generateTexture('rallyx:rock', size, size);
      gfx.destroy();
    }

    // 5. Regular Flag (rallyx:flag_regular)
    if (!this.textures.exists('rallyx:flag_regular')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Pole & Finial
      gfx.fillStyle(0x94a3b8, 1);
      gfx.fillRect(11, 6, 4, 36);
      gfx.fillStyle(0xe2e8f0, 1);
      gfx.fillCircle(13, 6, 3);

      // Yellow Flag Background
      gfx.fillStyle(0xfacc15, 1);
      gfx.fillRect(15, 6, 27, 22);

      // Red Triangle Pennant
      if (typeof (gfx as any).fillTriangle === 'function') {
        gfx.fillStyle(0xef4444, 1);
        (gfx as any).fillTriangle(16, 6, 16, 28, 39, 17);
      } else {
        gfx.fillStyle(0xef4444, 1);
        gfx.fillRect(16, 9, 20, 14);
      }
      gfx.generateTexture('rallyx:flag_regular', size, size);
      gfx.destroy();
    }

    // 6. Special Flag "S" (rallyx:flag_special)
    if (!this.textures.exists('rallyx:flag_special')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Pole & Finial
      gfx.fillStyle(0x94a3b8, 1);
      gfx.fillRect(11, 6, 4, 36);
      gfx.fillStyle(0xe2e8f0, 1);
      gfx.fillCircle(13, 6, 3);

      // Yellow Flag
      gfx.fillStyle(0xfacc15, 1);
      gfx.fillRect(15, 6, 27, 22);

      // Red "S" character glyph
      gfx.fillStyle(0xef4444, 1);
      gfx.fillRect(19, 8, 18, 4);   // Top bar
      gfx.fillRect(19, 8, 5, 8);    // Top left
      gfx.fillRect(19, 15, 18, 4);  // Mid bar
      gfx.fillRect(32, 15, 5, 9);   // Bot right
      gfx.fillRect(19, 21, 18, 4);  // Bot bar
      gfx.generateTexture('rallyx:flag_special', size, size);
      gfx.destroy();
    }

    // 7. Lucky Flag "L" (rallyx:flag_lucky)
    if (!this.textures.exists('rallyx:flag_lucky')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Pole & Finial
      gfx.fillStyle(0x94a3b8, 1);
      gfx.fillRect(11, 6, 4, 36);
      gfx.fillStyle(0xe2e8f0, 1);
      gfx.fillCircle(13, 6, 3);

      // Yellow Flag
      gfx.fillStyle(0xfacc15, 1);
      gfx.fillRect(15, 6, 27, 22);

      // Green "L" character glyph
      gfx.fillStyle(0x16a34a, 1);
      gfx.fillRect(20, 8, 5, 17);  // Vertical stem
      gfx.fillRect(20, 20, 17, 5); // Horizontal bottom
      gfx.generateTexture('rallyx:flag_lucky', size, size);
      gfx.destroy();
    }

    // 8. Player Crash Particles (rallyx:crash_0..3)
    [12, 9, 6, 3].forEach((radius, idx) => {
      const key = `rallyx:crash_${idx}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        gfx.fillStyle(idx % 2 === 0 ? 0xef4444 : 0xfacc15, 1);
        gfx.fillCircle(24, 24, radius);
        gfx.generateTexture(key, size, size);
        gfx.destroy();
      }
    });

    // 9. HUD Life Mini Car Icon (rallyx:hud_life)
    if (!this.textures.exists('rallyx:hud_life')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0x2563eb, 1);
      gfx.fillRect(6, 3, 12, 18);
      gfx.fillStyle(0x0f172a, 1);
      gfx.fillRect(3, 5, 4, 6);
      gfx.fillRect(17, 5, 4, 6);
      gfx.fillRect(3, 13, 4, 6);
      gfx.fillRect(17, 13, 4, 6);
      gfx.fillStyle(0xf8fafc, 1);
      gfx.fillCircle(12, 12, 2.5);
      gfx.generateTexture('rallyx:hud_life', 24, 24);
      gfx.destroy();
    }
  }
}

