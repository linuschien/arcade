/**
 * PreloadScene.ts
 * Generates and preloads all namespaced textures ('rallyx:*') procedurally.
 * Features Formula 1 player/enemy cars, rocks, 3 flag types (Regular, S, L), smoke puffs, and crash debris.
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
    const keys = [
      'rallyx:player_up', 'rallyx:player_down', 'rallyx:player_left', 'rallyx:player_right', 'rallyx:player',
      'rallyx:enemy_up', 'rallyx:enemy_down', 'rallyx:enemy_left', 'rallyx:enemy_right', 'rallyx:enemy',
      'rallyx:smoke', 'rallyx:rock', 'rallyx:flag_regular', 'rallyx:flag_special', 'rallyx:flag_lucky',
      'rallyx:crash_0', 'rallyx:crash_1', 'rallyx:crash_2', 'rallyx:crash_3', 'rallyx:hud_life'
    ];
    keys.forEach((k) => {
      const tex = this.textures.get(k);
      if (tex && typeof tex.setFilter === 'function') {
        tex.setFilter(Phaser.Textures.FilterMode.LINEAR);
      }
    });

    this.scene.start('rallyx:MainGameScene');
  }

  private createProceduralTextures(): void {
    const size = 32;

    // Helper to draw a Formula 1 racing car in 4 directions
    const drawFormulaCar = (
      gfx: Phaser.GameObjects.Graphics,
      bodyColor: number,
      stripeColor: number,
      dir: 'up' | 'down' | 'left' | 'right'
    ) => {
      const tireColor = 0x0f172a; // Dark slate/black
      const cockpitColor = 0xf8fafc; // White helmet

      if (dir === 'up') {
        // Tires (4 corners)
        gfx.fillStyle(tireColor, 1);
        gfx.fillRect(4, 5, 5, 8);   // Front Left
        gfx.fillRect(23, 5, 5, 8);  // Front Right
        gfx.fillRect(4, 19, 6, 9);  // Rear Left
        gfx.fillRect(22, 19, 6, 9); // Rear Right

        // Main Body & Nosecone
        gfx.fillStyle(bodyColor, 1);
        gfx.fillRect(11, 4, 10, 24); // Chassis
        if (typeof (gfx as any).fillTriangle === 'function') {
          (gfx as any).fillTriangle(11, 8, 21, 8, 16, 2); // Nosecone tip
        }

        // Front & Rear Wings
        gfx.fillRect(6, 4, 20, 3);   // Front Wing
        gfx.fillRect(5, 26, 22, 4);  // Rear Spoiler

        // Racing Stripe
        gfx.fillStyle(stripeColor, 1);
        gfx.fillRect(14, 4, 4, 20);

        // Cockpit / Driver Helmet
        gfx.fillStyle(cockpitColor, 1);
        gfx.fillCircle(16, 16, 3.5);
      } else if (dir === 'down') {
        // Tires
        gfx.fillStyle(tireColor, 1);
        gfx.fillRect(4, 19, 5, 8);  // Front Left
        gfx.fillRect(23, 19, 5, 8); // Front Right
        gfx.fillRect(4, 4, 6, 9);   // Rear Left
        gfx.fillRect(22, 4, 6, 9);  // Rear Right

        // Main Body
        gfx.fillStyle(bodyColor, 1);
        gfx.fillRect(11, 4, 10, 24);
        if (typeof (gfx as any).fillTriangle === 'function') {
          (gfx as any).fillTriangle(11, 24, 21, 24, 16, 30);
        }

        // Wings
        gfx.fillRect(6, 25, 20, 3);
        gfx.fillRect(5, 2, 22, 4);

        // Stripe
        gfx.fillStyle(stripeColor, 1);
        gfx.fillRect(14, 8, 4, 20);

        // Cockpit
        gfx.fillStyle(cockpitColor, 1);
        gfx.fillCircle(16, 16, 3.5);
      } else if (dir === 'left') {
        // Tires
        gfx.fillStyle(tireColor, 1);
        gfx.fillRect(5, 4, 8, 5);   // Front Top
        gfx.fillRect(5, 23, 8, 5);  // Front Bottom
        gfx.fillRect(19, 4, 9, 6);  // Rear Top
        gfx.fillRect(19, 22, 9, 6); // Rear Bottom

        // Main Body
        gfx.fillStyle(bodyColor, 1);
        gfx.fillRect(4, 11, 24, 10);
        if (typeof (gfx as any).fillTriangle === 'function') {
          (gfx as any).fillTriangle(8, 11, 8, 21, 2, 16);
        }

        // Wings
        gfx.fillRect(4, 6, 3, 20);
        gfx.fillRect(26, 5, 4, 22);

        // Stripe
        gfx.fillStyle(stripeColor, 1);
        gfx.fillRect(4, 14, 20, 4);

        // Cockpit
        gfx.fillStyle(cockpitColor, 1);
        gfx.fillCircle(16, 16, 3.5);
      } else if (dir === 'right') {
        // Tires
        gfx.fillStyle(tireColor, 1);
        gfx.fillRect(19, 4, 8, 5);  // Front Top
        gfx.fillRect(19, 23, 8, 5); // Front Bottom
        gfx.fillRect(4, 4, 9, 6);   // Rear Top
        gfx.fillRect(4, 22, 9, 6);  // Rear Bottom

        // Main Body
        gfx.fillStyle(bodyColor, 1);
        gfx.fillRect(4, 11, 24, 10);
        if (typeof (gfx as any).fillTriangle === 'function') {
          (gfx as any).fillTriangle(24, 11, 24, 21, 30, 16);
        }

        // Wings
        gfx.fillRect(25, 6, 3, 20);
        gfx.fillRect(2, 5, 4, 22);

        // Stripe
        gfx.fillStyle(stripeColor, 1);
        gfx.fillRect(8, 14, 20, 4);

        // Cockpit
        gfx.fillStyle(cockpitColor, 1);
        gfx.fillCircle(16, 16, 3.5);
      }
    };

    const directions: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];

    // 1. Blue Player Car (rallyx:player_{up,down,left,right})
    directions.forEach((dir) => {
      const key = `rallyx:player_${dir}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        drawFormulaCar(gfx, 0x2563eb, 0xffffff, dir); // Blue with white stripe
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
        drawFormulaCar(gfx, 0xdc2626, 0xfacc15, dir); // Red with yellow stripe
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
      gfx.fillCircle(16, 16, 10);
      gfx.fillCircle(10, 14, 7);
      gfx.fillCircle(22, 14, 7);
      gfx.fillCircle(16, 10, 6);
      gfx.fillCircle(16, 22, 6);
      gfx.fillStyle(0xffffff, 0.9);
      gfx.fillCircle(14, 14, 4);
      gfx.generateTexture('rallyx:smoke', size, size);
      gfx.destroy();
    }

    // 4. Dirt Mound Obstacle (rallyx:rock) - Authentic arcade 土堆
    if (!this.textures.exists('rallyx:rock')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });

      // Base soil contact line
      gfx.fillStyle(0x3f1d0b, 1); // Deep earth shadow
      gfx.fillRect(6, 23, 20, 4);

      // Main dirt mound layers (tapered dome)
      gfx.fillStyle(0x78350f, 1); // Dark soil base layer
      gfx.fillCircle(16, 21, 9);
      gfx.fillCircle(10, 22, 5);
      gfx.fillCircle(22, 22, 5);

      gfx.fillStyle(0x92400e, 1); // Rich earth brown body
      gfx.fillCircle(16, 17, 7.5);
      gfx.fillCircle(12, 19, 4.5);
      gfx.fillCircle(20, 19, 4.5);

      gfx.fillStyle(0xb45309, 1); // Warm clay upper dome
      gfx.fillCircle(16, 13, 5.5);

      gfx.fillStyle(0xd97706, 1); // Sunlit sandy mound crest
      gfx.fillCircle(15, 10, 3.5);

      gfx.fillStyle(0xf59e0b, 1); // Peak dirt highlight
      gfx.fillCircle(15, 9, 1.8);

      // Dirt granules & pebbles
      gfx.fillStyle(0x451a03, 1); // Dark soil pebbles
      gfx.fillRect(9, 21, 2, 2);
      gfx.fillRect(21, 20, 2, 2);
      gfx.fillRect(13, 16, 2, 2);
      gfx.fillRect(18, 14, 2, 2);

      gfx.fillStyle(0xfde68a, 1); // Light sand specks
      gfx.fillRect(14, 11, 1.5, 1.5);
      gfx.fillRect(17, 16, 1.5, 1.5);
      gfx.fillRect(10, 18, 1.5, 1.5);

      gfx.generateTexture('rallyx:rock', size, size);
      gfx.destroy();
    }

    // 5. Regular Flag (rallyx:flag_regular)
    if (!this.textures.exists('rallyx:flag_regular')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Pole
      gfx.fillStyle(0x94a3b8, 1);
      gfx.fillRect(7, 4, 3, 24);
      // Yellow Flag Background
      gfx.fillStyle(0xfacc15, 1);
      gfx.fillRect(10, 4, 18, 13);
      // Red Triangle Pennant
      if (typeof (gfx as any).fillTriangle === 'function') {
        gfx.fillStyle(0xef4444, 1);
        (gfx as any).fillTriangle(11, 4, 11, 17, 26, 10.5);
      } else {
        gfx.fillStyle(0xef4444, 1);
        gfx.fillRect(11, 6, 12, 8);
      }
      gfx.generateTexture('rallyx:flag_regular', size, size);
      gfx.destroy();
    }

    // 6. Special Flag "S" (rallyx:flag_special)
    if (!this.textures.exists('rallyx:flag_special')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Pole
      gfx.fillStyle(0x94a3b8, 1);
      gfx.fillRect(7, 4, 3, 24);
      // Yellow Flag
      gfx.fillStyle(0xfacc15, 1);
      gfx.fillRect(10, 4, 18, 14);
      // Red "S" character glyph
      gfx.fillStyle(0xef4444, 1);
      gfx.fillRect(13, 6, 11, 2.5);  // Top bar
      gfx.fillRect(13, 6, 3, 5);    // Top left
      gfx.fillRect(13, 10, 11, 2.5); // Mid bar
      gfx.fillRect(21, 10, 3, 5);   // Bot right
      gfx.fillRect(13, 14, 11, 2.5); // Bot bar
      gfx.generateTexture('rallyx:flag_special', size, size);
      gfx.destroy();
    }

    // 7. Lucky Flag "L" (rallyx:flag_lucky)
    if (!this.textures.exists('rallyx:flag_lucky')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Pole
      gfx.fillStyle(0x94a3b8, 1);
      gfx.fillRect(7, 4, 3, 24);
      // Yellow Flag
      gfx.fillStyle(0xfacc15, 1);
      gfx.fillRect(10, 4, 18, 14);
      // Green "L" character glyph
      gfx.fillStyle(0x16a34a, 1);
      gfx.fillRect(14, 6, 3.5, 10); // Vertical stem
      gfx.fillRect(14, 13, 10, 3);  // Horizontal bottom
      gfx.generateTexture('rallyx:flag_lucky', size, size);
      gfx.destroy();
    }

    // 8. Player Crash Particles (rallyx:crash_0..3)
    [8, 6, 4, 2].forEach((radius, idx) => {
      const key = `rallyx:crash_${idx}`;
      if (!this.textures.exists(key)) {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        gfx.fillStyle(idx % 2 === 0 ? 0xef4444 : 0xfacc15, 1);
        gfx.fillCircle(16, 16, radius);
        gfx.generateTexture(key, size, size);
        gfx.destroy();
      }
    });

    // 9. HUD Life Mini Car Icon (rallyx:hud_life)
    if (!this.textures.exists('rallyx:hud_life')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0x2563eb, 1);
      gfx.fillRect(4, 2, 8, 12);
      gfx.fillStyle(0x0f172a, 1);
      gfx.fillRect(2, 3, 3, 4);
      gfx.fillRect(11, 3, 3, 4);
      gfx.fillRect(2, 9, 3, 4);
      gfx.fillRect(11, 9, 3, 4);
      gfx.generateTexture('rallyx:hud_life', 16, 16);
      gfx.destroy();
    }
  }
}

