/**
 * PreloadScene.ts
 * Generates procedural arcade textures for Sokoban 50 with strict namespace 'sokoban:*'.
 * Generates directional worker sprites, wooden & golden goal crates, recessed target plates,
 * and 4 themed world floor and wall tiles.
 */

import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'sokoban:PreloadScene' });
  }

  public preload(): void {
    this.createProceduralTextures();
  }

  public create(): void {
    this.scene.start('sokoban:MainGameScene');
  }

  private createProceduralTextures(): void {
    const S = 64; // Base tile resolution

    // 1. Worker Directions (Down, Up, Left, Right)
    this.generateWorkerTexture('sokoban:worker_down', S, 'down');
    this.generateWorkerTexture('sokoban:worker_up', S, 'up');
    this.generateWorkerTexture('sokoban:worker_left', S, 'left');
    this.generateWorkerTexture('sokoban:worker_right', S, 'right');

    // 2. Pushable Wooden Crate
    if (!this.textures.exists('sokoban:crate')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Crate body (rich timber)
      gfx.fillStyle(0xb45309, 1);
      gfx.fillRoundedRect(4, 4, S - 8, S - 8, 4);

      // Inner plank border
      gfx.lineStyle(2, 0x78350f, 1);
      gfx.strokeRoundedRect(6, 6, S - 12, S - 12, 3);

      // Diagonal cross planks
      gfx.lineStyle(3, 0x92400e, 0.9);
      gfx.lineBetween(10, 10, S - 10, S - 10);
      gfx.lineBetween(S - 10, 10, 10, S - 10);

      // Metallic corner rivets
      gfx.fillStyle(0xfef3c7, 0.8);
      gfx.fillRect(8, 8, 4, 4);
      gfx.fillRect(S - 12, 8, 4, 4);
      gfx.fillRect(8, S - 12, 4, 4);
      gfx.fillRect(S - 12, S - 12, 4, 4);

      gfx.generateTexture('sokoban:crate', S, S);
      gfx.destroy();
    }

    // 3. Goal Placed Golden Crate (Luminous pulse & gold borders)
    if (!this.textures.exists('sokoban:crate_gold')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Golden body
      gfx.fillStyle(0xf59e0b, 1);
      gfx.fillRoundedRect(4, 4, S - 8, S - 8, 4);

      // Bright glowing border
      gfx.lineStyle(3, 0xfef08a, 1);
      gfx.strokeRoundedRect(5, 5, S - 10, S - 10, 3);

      // Diamond center crest
      gfx.fillStyle(0xfef9c3, 1);
      gfx.beginPath();
      gfx.moveTo(S / 2, 14);
      gfx.lineTo(S - 14, S / 2);
      gfx.lineTo(S / 2, S - 14);
      gfx.lineTo(14, S / 2);
      gfx.closePath();
      gfx.fillPath();

      // Center emerald star dot
      gfx.fillStyle(0x10b981, 1);
      gfx.fillCircle(S / 2, S / 2, 5);

      gfx.generateTexture('sokoban:crate_gold', S, S);
      gfx.destroy();
    }

    // 4. Floor Goal Target Marker
    if (!this.textures.exists('sokoban:goal')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Outer subtle ring
      gfx.lineStyle(2, 0x10b981, 0.6);
      gfx.strokeCircle(S / 2, S / 2, 18);

      // Inner energetic target circle
      gfx.fillStyle(0x34d399, 0.85);
      gfx.fillCircle(S / 2, S / 2, 9);

      // Center bright beacon point
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(S / 2, S / 2, 3);

      gfx.generateTexture('sokoban:goal', S, S);
      gfx.destroy();
    }

    // 5. Themed Walls
    this.generateWallTexture('sokoban:wall_cargo', S, 0x78350f, 0x451a03);
    this.generateWallTexture('sokoban:wall_cyber', S, 0x0ea5e9, 0x032541);
    this.generateWallTexture('sokoban:wall_steel', S, 0x64748b, 0x1e293b);
    this.generateWallTexture('sokoban:wall_mega', S, 0x334155, 0x0f172a);

    // 6. Themed Floors
    this.generateFloorTexture('sokoban:floor_cargo', S, 0x24140b, 0x1a0e08);
    this.generateFloorTexture('sokoban:floor_cyber', S, 0x0b1329, 0x060a17);
    this.generateFloorTexture('sokoban:floor_steel', S, 0x161d2b, 0x0d121c);
    this.generateFloorTexture('sokoban:floor_mega', S, 0x111827, 0x080d14);
  }

  private generateWorkerTexture(key: string, S: number, dir: 'down' | 'up' | 'left' | 'right'): void {
    if (this.textures.exists(key)) return;

    const gfx = this.make.graphics({ x: 0, y: 0 });
    const cx = S / 2;
    const cy = S / 2;

    // Drop shadow
    gfx.fillStyle(0x000000, 0.35);
    gfx.fillEllipse(cx, cy + 18, 22, 10);

    // Body / Work Vest (Arcade Blue)
    gfx.fillStyle(0x2563eb, 1);
    gfx.fillRoundedRect(cx - 10, cy - 2, 20, 16, 3);

    // Safety Reflective Belt
    gfx.fillStyle(0xfacc15, 1);
    gfx.fillRect(cx - 10, cy + 4, 20, 3);

    // Head / Face
    gfx.fillStyle(0xfde047, 1);
    gfx.fillCircle(cx, cy - 9, 8);

    // Safety Hardhat (Industrial Yellow)
    gfx.fillStyle(0xeab308, 1);
    gfx.fillRoundedRect(cx - 10, cy - 18, 20, 9, 4);
    gfx.fillRect(cx - 12, cy - 11, 24, 2); // Helmet brim

    // Directional facial / gaze features
    gfx.fillStyle(0x1e293b, 1);
    if (dir === 'down') {
      gfx.fillRect(cx - 4, cy - 8, 2, 2);
      gfx.fillRect(cx + 2, cy - 8, 2, 2);
    } else if (dir === 'up') {
      // Back of head / helmet
      gfx.fillStyle(0xca8a04, 1);
      gfx.fillCircle(cx, cy - 10, 7);
    } else if (dir === 'left') {
      gfx.fillRect(cx - 6, cy - 8, 2, 2);
    } else if (dir === 'right') {
      gfx.fillRect(cx + 4, cy - 8, 2, 2);
    }

    gfx.generateTexture(key, S, S);
    gfx.destroy();
  }

  private generateWallTexture(key: string, S: number, accentColor: number, baseColor: number): void {
    if (this.textures.exists(key)) return;
    const gfx = this.make.graphics({ x: 0, y: 0 });

    // Base block
    gfx.fillStyle(baseColor, 1);
    gfx.fillRect(0, 0, S, S);

    // 3D Bevel Top & Left
    gfx.lineStyle(2, accentColor, 0.9);
    gfx.strokeRect(1, 1, S - 2, S - 2);

    // Dual block inner split
    gfx.lineStyle(1, 0x000000, 0.6);
    gfx.lineBetween(0, S / 2, S, S / 2);
    gfx.lineBetween(S / 2, 0, S / 2, S / 2);
    gfx.lineBetween(S / 4, S / 2, S / 4, S);
    gfx.lineBetween((3 * S) / 4, S / 2, (3 * S) / 4, S);

    gfx.generateTexture(key, S, S);
    gfx.destroy();
  }

  private generateFloorTexture(key: string, S: number, baseColor: number, gridColor: number): void {
    if (this.textures.exists(key)) return;
    const gfx = this.make.graphics({ x: 0, y: 0 });

    gfx.fillStyle(baseColor, 1);
    gfx.fillRect(0, 0, S, S);

    // Grid contour
    gfx.lineStyle(1, gridColor, 0.7);
    gfx.strokeRect(0, 0, S, S);

    // Corner rivets
    gfx.fillStyle(gridColor, 0.4);
    gfx.fillRect(2, 2, 2, 2);
    gfx.fillRect(S - 4, 2, 2, 2);
    gfx.fillRect(2, S - 4, 2, 2);
    gfx.fillRect(S - 4, S - 4, 2, 2);

    gfx.generateTexture(key, S, S);
    gfx.destroy();
  }
}

