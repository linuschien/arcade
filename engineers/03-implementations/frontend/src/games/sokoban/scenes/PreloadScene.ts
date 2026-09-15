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

    // 5. Themed Walls (Full theme keys & backward-compatible short aliases)
    const wallThemes: Record<string, { face: number; highlight: number; shadow: number; accent: number }> = {
      cargo_depot: { face: 0x9a3412, highlight: 0xfbbf24, shadow: 0x431407, accent: 0xd97706 },
      cyber_vault: { face: 0x0369a1, highlight: 0x38bdf8, shadow: 0x082f49, accent: 0x67e8f9 },
      steel_works: { face: 0x475569, highlight: 0xe2e8f0, shadow: 0x0f172a, accent: 0x94a3b8 },
      mega_terminal: { face: 0x312e81, highlight: 0xfbbf24, shadow: 0x090514, accent: 0xa855f7 },
    };

    for (const [key, t] of Object.entries(wallThemes)) {
      this.generateWallTexture(`sokoban:wall_${key}`, S, key, t);
    }
    // Backward-compatible short aliases
    this.generateWallTexture('sokoban:wall_cargo', S, 'cargo_depot', wallThemes.cargo_depot);
    this.generateWallTexture('sokoban:wall_cyber', S, 'cyber_vault', wallThemes.cyber_vault);
    this.generateWallTexture('sokoban:wall_steel', S, 'steel_works', wallThemes.steel_works);
    this.generateWallTexture('sokoban:wall_mega', S, 'mega_terminal', wallThemes.mega_terminal);

    // 6. Themed Floors (Full theme keys & backward-compatible short aliases)
    const floorThemes: Record<string, { base: number; inner: number; grid: number; accent: number }> = {
      cargo_depot: { base: 0x261911, inner: 0x322217, grid: 0x160d08, accent: 0x78350f },
      cyber_vault: { base: 0x0a101f, inner: 0x0f172a, grid: 0x1e293b, accent: 0x0284c7 },
      steel_works: { base: 0x161d2b, inner: 0x1e293b, grid: 0x0f172a, accent: 0x273549 },
      mega_terminal: { base: 0x0e0e12, inner: 0x18181f, grid: 0x522d0c, accent: 0x713f12 },
    };

    for (const [key, t] of Object.entries(floorThemes)) {
      this.generateFloorTexture(`sokoban:floor_${key}`, S, key, t);
    }
    // Backward-compatible short aliases
    this.generateFloorTexture('sokoban:floor_cargo', S, 'cargo_depot', floorThemes.cargo_depot);
    this.generateFloorTexture('sokoban:floor_cyber', S, 'cyber_vault', floorThemes.cyber_vault);
    this.generateFloorTexture('sokoban:floor_steel', S, 'steel_works', floorThemes.steel_works);
    this.generateFloorTexture('sokoban:floor_mega', S, 'mega_terminal', floorThemes.mega_terminal);
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

  private generateWallTexture(
    key: string,
    S: number,
    theme: string,
    colors: { face: number; highlight: number; shadow: number; accent: number }
  ): void {
    if (this.textures.exists(key)) return;
    const gfx = this.make.graphics({ x: 0, y: 0 });

    // 1. Dark under-shadow base
    gfx.fillStyle(colors.shadow, 1);
    gfx.fillRect(0, 0, S, S);

    // 2. Main 3D raised block face
    gfx.fillStyle(colors.face, 1);
    gfx.fillRect(2, 2, S - 4, S - 4);

    // 3. Top & Left 3D Chamfer Bevel Highlight (2.5D lighting)
    gfx.fillStyle(colors.highlight, 0.9);
    gfx.fillRect(0, 0, S, 3);
    gfx.fillRect(0, 0, 3, S);

    // 4. Bottom & Right 3D Shadow Bevel
    gfx.fillStyle(colors.shadow, 0.95);
    gfx.fillRect(0, S - 3, S, 3);
    gfx.fillRect(S - 3, 0, 3, S);

    // 5. Distinct theme-specific architectural patterns
    if (theme.includes('cargo')) {
      // Running-bond brick masonry pattern
      gfx.lineStyle(2, colors.shadow, 0.9);
      gfx.lineBetween(2, S / 2, S - 2, S / 2);
      gfx.lineBetween(S / 2, 2, S / 2, S / 2);
      gfx.lineBetween(S / 4, S / 2, S / 4, S - 2);
      gfx.lineBetween((3 * S) / 4, S / 2, (3 * S) / 4, S - 2);

      // Warm mortar highlights
      gfx.lineStyle(1, colors.accent, 0.5);
      gfx.lineBetween(3, 4, S - 3, 4);
      gfx.lineBetween(3, S / 2 + 2, S - 3, S / 2 + 2);
    } else if (theme.includes('cyber')) {
      // Inset glowing cyber conduit & circuit node
      gfx.fillStyle(colors.shadow, 0.8);
      gfx.fillRect(8, 8, S - 16, S - 16);
      gfx.lineStyle(2, colors.highlight, 0.9);
      gfx.strokeRect(8, 8, S - 16, S - 16);

      // Center glowing core
      gfx.fillStyle(colors.accent, 1);
      gfx.fillCircle(S / 2, S / 2, 4);
      gfx.lineStyle(1, colors.highlight, 0.8);
      gfx.lineBetween(8, S / 2, S - 8, S / 2);
      gfx.lineBetween(S / 2, 8, S / 2, S - 8);
    } else if (theme.includes('steel')) {
      // Reinforced steel plate with heavy rivets & cross girders
      gfx.lineStyle(2, colors.shadow, 0.8);
      gfx.strokeRect(6, 6, S - 12, S - 12);
      gfx.lineBetween(8, 8, S - 8, S - 8);
      gfx.lineBetween(S - 8, 8, 8, S - 8);

      // 4 heavy steel corner rivets with specular glints
      const rivetCoords = [
        [7, 7],
        [S - 7, 7],
        [7, S - 7],
        [S - 7, S - 7],
      ];
      for (const [rx, ry] of rivetCoords) {
        gfx.fillStyle(0x1e293b, 1);
        gfx.fillCircle(rx, ry, 3);
        gfx.fillStyle(0xf8fafc, 0.9);
        gfx.fillCircle(rx - 1, ry - 1, 1);
      }
    } else {
      // Mega Terminal: Regal obsidian-gold vault barrier
      gfx.fillStyle(colors.shadow, 0.85);
      gfx.fillRect(6, 6, S - 12, S - 12);
      gfx.lineStyle(2, colors.highlight, 1);
      gfx.strokeRect(6, 6, S - 12, S - 12);

      // Center gold vault lock crest
      gfx.fillStyle(colors.highlight, 0.9);
      gfx.beginPath();
      gfx.moveTo(S / 2, 16);
      gfx.lineTo(S - 16, S / 2);
      gfx.lineTo(S / 2, S - 16);
      gfx.lineTo(16, S / 2);
      gfx.closePath();
      gfx.fillPath();

      gfx.fillStyle(colors.accent, 1);
      gfx.fillCircle(S / 2, S / 2, 3);
    }

    gfx.generateTexture(key, S, S);
    gfx.destroy();
  }

  private generateFloorTexture(
    key: string,
    S: number,
    theme: string,
    colors: { base: number; inner: number; grid: number; accent: number }
  ): void {
    if (this.textures.exists(key)) return;
    const gfx = this.make.graphics({ x: 0, y: 0 });

    // 1. Base grid border
    gfx.fillStyle(colors.base, 1);
    gfx.fillRect(0, 0, S, S);

    // 2. Inner flat walkable face
    gfx.fillStyle(colors.inner, 1);
    gfx.fillRect(1, 1, S - 2, S - 2);

    // 3. Grid contour
    gfx.lineStyle(1, colors.grid, 0.8);
    gfx.strokeRect(0, 0, S, S);

    // 4. Distinct walkable floor details
    if (theme.includes('cargo')) {
      // Warehouse wooden floorboards
      const plankW = Math.floor(S / 3);
      gfx.lineStyle(1, colors.grid, 0.9);
      gfx.lineBetween(plankW, 2, plankW, S - 2);
      gfx.lineBetween(plankW * 2, 2, plankW * 2, S - 2);

      // Plank nail dots
      gfx.fillStyle(colors.accent, 0.6);
      gfx.fillRect(plankW / 2, 3, 2, 2);
      gfx.fillRect(plankW / 2, S - 5, 2, 2);
      gfx.fillRect(plankW + plankW / 2, 3, 2, 2);
      gfx.fillRect(plankW + plankW / 2, S - 5, 2, 2);
      gfx.fillRect(plankW * 2 + plankW / 2, 3, 2, 2);
      gfx.fillRect(plankW * 2 + plankW / 2, S - 5, 2, 2);
    } else if (theme.includes('cyber')) {
      // Cyber runway grid with subtle center crosshair
      gfx.lineStyle(1, colors.accent, 0.35);
      gfx.lineBetween(S / 2 - 6, S / 2, S / 2 + 6, S / 2);
      gfx.lineBetween(S / 2, S / 2 - 6, S / 2, S / 2 + 6);
      gfx.fillStyle(colors.accent, 0.5);
      gfx.fillCircle(S / 2, S / 2, 2);
    } else if (theme.includes('steel')) {
      // Industrial diamond treadplate notches
      gfx.fillStyle(colors.accent, 0.8);
      gfx.fillRect(10, 10, 6, 2);
      gfx.fillRect(S - 16, 10, 6, 2);
      gfx.fillRect(10, S - 12, 6, 2);
      gfx.fillRect(S - 16, S - 12, 6, 2);
      gfx.fillRect(S / 2 - 3, S / 2 - 1, 6, 2);

      // Corner flush screws
      gfx.fillStyle(0x334155, 0.5);
      gfx.fillCircle(3, 3, 1.5);
      gfx.fillCircle(S - 3, 3, 1.5);
      gfx.fillCircle(3, S - 3, 1.5);
      gfx.fillCircle(S - 3, S - 3, 1.5);
    } else {
      // Mega terminal: Polished obsidian marble with gold corner accents
      gfx.fillStyle(colors.accent, 0.5);
      gfx.fillRect(2, 2, 3, 3);
      gfx.fillRect(S - 5, 2, 3, 3);
      gfx.fillRect(2, S - 5, 3, 3);
      gfx.fillRect(S - 5, S - 5, 3, 3);
      gfx.fillStyle(colors.grid, 0.6);
      gfx.fillCircle(S / 2, S / 2, 2);
    }

    gfx.generateTexture(key, S, S);
    gfx.destroy();
  }
}

