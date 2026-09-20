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

    // 1. Worker Animations (Down, Up, Left, Right x Idle, Walk1, Walk2, Push)
    const dirs: ('down' | 'up' | 'left' | 'right')[] = ['down', 'up', 'left', 'right'];
    for (const dir of dirs) {
      // Primary idle key (backward-compatible)
      this.generateWorkerTexture(`sokoban:worker_${dir}`, S, dir, 'idle');
      // Dedicated action frames
      this.generateWorkerTexture(`sokoban:worker_${dir}_idle`, S, dir, 'idle');
      this.generateWorkerTexture(`sokoban:worker_${dir}_walk1`, S, dir, 'walk1');
      this.generateWorkerTexture(`sokoban:worker_${dir}_walk2`, S, dir, 'walk2');
      this.generateWorkerTexture(`sokoban:worker_${dir}_push`, S, dir, 'push');
    }

    // 2. 3D Pushable Wooden Cargo Crate
    if (!this.textures.exists('sokoban:crate')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });

      // Drop shadow underneath (ground contact)
      gfx.fillStyle(0x000000, 0.42);
      gfx.fillRoundedRect(5, 7, S - 10, S - 10, 6);

      // Main timber box body (warm rich cedar wood)
      gfx.fillStyle(0xb45309, 1);
      gfx.fillRoundedRect(3, 3, S - 8, S - 8, 4);

      // 3D Light & Shadow Bevels (2.5D perspective)
      gfx.fillStyle(0xd97706, 0.9);
      gfx.fillRect(3, 3, S - 8, 3);
      gfx.fillRect(3, 3, 3, S - 8);
      gfx.fillStyle(0x451a03, 0.95);
      gfx.fillRect(3, S - 8, S - 8, 3);
      gfx.fillRect(S - 8, 3, 3, S - 8);

      // Horizontal Wood Planks (3 distinct slats with dark grooved joints)
      const slatH = Math.floor((S - 14) / 3);
      const slatY1 = 7;
      const slatY2 = slatY1 + slatH;
      const slatY3 = slatY2 + slatH;

      // Dark joint seams
      gfx.lineStyle(2, 0x451a03, 0.95);
      gfx.lineBetween(6, slatY2, S - 8, slatY2);
      gfx.lineBetween(6, slatY3, S - 8, slatY3);

      // Subtle plank wood grain variance
      gfx.fillStyle(0x92400e, 0.35);
      gfx.fillRect(7, slatY1 + 2, S - 14, slatH - 4);
      gfx.fillStyle(0xd97706, 0.25);
      gfx.fillRect(7, slatY2 + 2, S - 14, slatH - 4);

      // Diagonal timber cross bracing
      gfx.lineStyle(5, 0x451a03, 0.45); // Brace drop shadow
      gfx.lineBetween(11, 12, S - 11, S - 10);
      gfx.lineStyle(4, 0x9a3412, 1); // Main wood brace
      gfx.lineBetween(10, 10, S - 12, S - 12);
      gfx.lineStyle(1, 0xd97706, 0.8); // Brace top highlight
      gfx.lineBetween(10, 9, S - 13, S - 14);

      // Inner wood frame border
      gfx.lineStyle(2, 0x78350f, 0.9);
      gfx.strokeRoundedRect(6, 6, S - 14, S - 14, 3);

      // Stenciled Shipping Upward Arrows "⬆ ⬆" (THIS SIDE UP)
      gfx.fillStyle(0x451a03, 0.85);
      const a1x = S / 2 - 8;
      const a2x = S / 2 + 8;
      const ay = S / 2 - 2;
      for (const ax of [a1x, a2x]) {
        gfx.fillRect(ax - 1, ay - 2, 3, 7); // Stem
        gfx.beginPath();
        gfx.moveTo(ax, ay - 7);
        gfx.lineTo(ax + 4, ay - 2);
        gfx.lineTo(ax - 4, ay - 2);
        gfx.closePath();
        gfx.fillPath();
      }

      // Heavy-Duty Steel L-Shaped Corner Brackets (四角鋼鐵防撞包角)
      const bracketSize = 13;
      const bracketThickness = 4;
      const steelColor = 0x334155;
      const steelHighlight = 0x64748b;

      // Top-Left L-bracket
      gfx.fillStyle(steelColor, 1);
      gfx.fillRect(4, 4, bracketSize, bracketThickness);
      gfx.fillRect(4, 4, bracketThickness, bracketSize);
      gfx.fillStyle(steelHighlight, 0.8);
      gfx.fillRect(4, 4, bracketSize, 1);

      // Top-Right L-bracket
      gfx.fillStyle(steelColor, 1);
      gfx.fillRect(S - 4 - bracketSize, 4, bracketSize, bracketThickness);
      gfx.fillRect(S - 4 - bracketThickness, 4, bracketThickness, bracketSize);
      gfx.fillStyle(steelHighlight, 0.8);
      gfx.fillRect(S - 4 - bracketSize, 4, bracketSize, 1);

      // Bottom-Left L-bracket
      gfx.fillStyle(steelColor, 1);
      gfx.fillRect(4, S - 4 - bracketThickness, bracketSize, bracketThickness);
      gfx.fillRect(4, S - 4 - bracketSize, bracketThickness, bracketSize);

      // Bottom-Right L-bracket
      gfx.fillStyle(steelColor, 1);
      gfx.fillRect(S - 4 - bracketSize, S - 4 - bracketThickness, bracketSize, bracketThickness);
      gfx.fillRect(S - 4 - bracketThickness, S - 4 - bracketSize, bracketThickness, bracketSize);

      // Metallic Shiny Corner Rivets (鉚釘)
      const rivets = [
        [7, 6], [6, 12],
        [S - 8, 6], [S - 7, 12],
        [7, S - 8], [6, S - 14],
        [S - 8, S - 8], [S - 7, S - 14],
      ];
      for (const [rx, ry] of rivets) {
        gfx.fillStyle(0x0f172a, 0.8);
        gfx.fillCircle(rx, ry, 2.2);
        gfx.fillStyle(0xe2e8f0, 1);
        gfx.fillCircle(rx - 0.5, ry - 0.5, 1.4);
      }

      gfx.generateTexture('sokoban:crate', S, S);
      gfx.destroy();
    }

    // 3. Goal Placed Golden Crate (Luminous vault core & polished brass borders)
    if (!this.textures.exists('sokoban:crate_gold')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });

      // Drop shadow
      gfx.fillStyle(0x000000, 0.5);
      gfx.fillRoundedRect(5, 7, S - 10, S - 10, 6);

      // Polished Imperial Gold Body
      gfx.fillStyle(0xd97706, 1);
      gfx.fillRoundedRect(3, 3, S - 8, S - 8, 5);
      gfx.fillStyle(0xf59e0b, 1);
      gfx.fillRoundedRect(5, 5, S - 12, S - 12, 4);

      // 3D Gold Top Bevel Highlight
      gfx.fillStyle(0xfef08a, 0.95);
      gfx.fillRect(3, 3, S - 8, 3);
      gfx.fillRect(3, 3, 3, S - 8);
      gfx.fillStyle(0x78350f, 0.95);
      gfx.fillRect(3, S - 8, S - 8, 3);
      gfx.fillRect(S - 8, 3, 3, S - 8);

      // Radiant Gold Inset Frame
      gfx.lineStyle(2, 0xfef08a, 0.9);
      gfx.strokeRoundedRect(7, 7, S - 16, S - 16, 4);

      // Center Emerald Diamond Crest Plate
      gfx.fillStyle(0x78350f, 0.8);
      gfx.beginPath();
      gfx.moveTo(S / 2, 12);
      gfx.lineTo(S - 12, S / 2);
      gfx.lineTo(S / 2, S - 12);
      gfx.lineTo(12, S / 2);
      gfx.closePath();
      gfx.fillPath();

      gfx.fillStyle(0xfef08a, 1);
      gfx.beginPath();
      gfx.moveTo(S / 2, 14);
      gfx.lineTo(S - 14, S / 2);
      gfx.lineTo(S / 2, S - 14);
      gfx.lineTo(14, S / 2);
      gfx.closePath();
      gfx.fillPath();

      // Glowing Emerald Core Jewel
      gfx.fillStyle(0x059669, 1);
      gfx.fillCircle(S / 2, S / 2, 8);
      gfx.fillStyle(0x10b981, 1);
      gfx.fillCircle(S / 2, S / 2, 6);
      gfx.fillStyle(0x6ee7b7, 1);
      gfx.fillCircle(S / 2 - 2, S / 2 - 2, 2.5);
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(S / 2 - 2, S / 2 - 2, 1.2);

      // Corner Gold Brackets
      const bSize = 13;
      const bThick = 4;
      gfx.fillStyle(0xfef08a, 1);
      gfx.fillRect(4, 4, bSize, bThick);
      gfx.fillRect(4, 4, bThick, bSize);
      gfx.fillRect(S - 4 - bSize, 4, bSize, bThick);
      gfx.fillRect(S - 4 - bThick, 4, bThick, bSize);
      gfx.fillRect(4, S - 4 - bThick, bSize, bThick);
      gfx.fillRect(4, S - 4 - bSize, bThick, bSize);
      gfx.fillRect(S - 4 - bSize, S - 4 - bThick, bSize, bThick);
      gfx.fillRect(S - 4 - bThick, S - 4 - bSize, bThick, bSize);

      // Diamond Stud Rivets
      const gRivets = [
        [7, 6], [6, 12],
        [S - 8, 6], [S - 7, 12],
        [7, S - 8], [6, S - 14],
        [S - 8, S - 8], [S - 7, S - 14],
      ];
      for (const [rx, ry] of gRivets) {
        gfx.fillStyle(0xffffff, 1);
        gfx.fillCircle(rx, ry, 1.5);
      }

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
      mega_terminal: { face: 0x181825, highlight: 0x6366f1, shadow: 0x090912, accent: 0x38bdf8 },
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
      mega_terminal: { base: 0x181c2b, inner: 0x24283b, grid: 0x121522, accent: 0x94a3b8 },
    };

    for (const [key, t] of Object.entries(floorThemes)) {
      this.generateFloorTexture(`sokoban:floor_${key}`, S, key, t);
    }
    // Backward-compatible short aliases
    this.generateFloorTexture('sokoban:floor_cargo', S, 'cargo_depot', floorThemes.cargo_depot);
    this.generateFloorTexture('sokoban:floor_cyber', S, 'cyber_vault', floorThemes.cyber_vault);
    this.generateFloorTexture('sokoban:floor_steel', S, 'steel_works', floorThemes.steel_works);
    this.generateFloorTexture('sokoban:floor_mega', S, 'mega_terminal', floorThemes.mega_terminal);

    // 7. Ambient World Backdrops (Tiled over 880x660 arena to eliminate pitch-black voids)
    // S_AMBIENT = 44: Exact integer common divisor of 880 (20 tiles) and 660 (15 tiles) preventing edge cutoff
    const S_AMBIENT = 44;
    const ambientThemes = ['cargo_depot', 'cyber_vault', 'steel_works', 'mega_terminal'];
    for (const key of ambientThemes) {
      this.generateAmbientTexture(`sokoban:ambient_${key}`, S_AMBIENT, key);
    }
    this.generateAmbientTexture('sokoban:ambient_cargo', S_AMBIENT, 'cargo_depot');
    this.generateAmbientTexture('sokoban:ambient_cyber', S_AMBIENT, 'cyber_vault');
    this.generateAmbientTexture('sokoban:ambient_steel', S_AMBIENT, 'steel_works');
    this.generateAmbientTexture('sokoban:ambient_mega', S_AMBIENT, 'mega_terminal');
  }

  private generateWorkerTexture(
    key: string,
    S: number,
    dir: 'down' | 'up' | 'left' | 'right',
    pose: 'idle' | 'walk1' | 'walk2' | 'push' = 'idle'
  ): void {
    if (this.textures.exists(key)) return;

    const gfx = this.make.graphics({ x: 0, y: 0 });
    const cx = S / 2;

    // Palette
    const cBoot = 0x1e293b;
    const cBootSole = 0x0f172a;
    const cBootToe = 0x475569;
    const cDenim = 0x1d4ed8;
    const cDenimDark = 0x1e3a8a;
    const cVest = 0xf97316; // Hi-Vis Safety Orange
    const cReflect = 0xfacc15; // Reflective Neon Yellow
    const cBelt = 0x78350f;
    const cBuckle = 0xe2e8f0;
    const cGlove = 0xf59e0b; // Tough Leather Glove
    const cGloveCuff = 0xd97706;
    const cSkin = 0xfde047;
    const cSkinShadow = 0xfcd34d;
    const cHelmet = 0xeab308; // Industrial Yellow Hardhat
    const cHelmetRidge = 0xfacc15;
    const cHelmetBrim = 0xca8a04;
    const cLampHousing = 0x334155;
    const cLampLens = 0x38bdf8;

    // 1. Ground Drop Shadow
    gfx.fillStyle(0x000000, 0.38);
    if (dir === 'left') {
      gfx.fillEllipse(cx - 2, 57, 30, 11);
    } else if (dir === 'right') {
      gfx.fillEllipse(cx + 2, 57, 30, 11);
    } else {
      gfx.fillEllipse(cx, 57, 32, 11);
    }

    if (dir === 'down') {
      // --- DOWN (Facing Player) ---
      // A. Steel-Toed Boots
      if (pose === 'walk1') {
        // Left foot forward, right foot back
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 13, 53, 11, 4, 1);
        gfx.fillRoundedRect(cx + 3, 56, 10, 3, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 13, 47, 11, 7, 2);
        gfx.fillRoundedRect(cx + 3, 51, 10, 6, 2);
        gfx.fillStyle(cBootToe, 1);
        gfx.fillRect(cx - 12, 52, 9, 2);
        gfx.fillRect(cx + 4, 55, 8, 2);
      } else if (pose === 'walk2') {
        // Right foot forward, left foot back
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 12, 56, 10, 3, 1);
        gfx.fillRoundedRect(cx + 2, 53, 11, 4, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 12, 51, 10, 6, 2);
        gfx.fillRoundedRect(cx + 2, 47, 11, 7, 2);
        gfx.fillStyle(cBootToe, 1);
        gfx.fillRect(cx - 11, 55, 8, 2);
        gfx.fillRect(cx + 3, 52, 9, 2);
      } else if (pose === 'push') {
        // Wide braced pushing stance
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 16, 54, 12, 4, 1);
        gfx.fillRoundedRect(cx + 4, 54, 12, 4, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 16, 49, 12, 6, 2);
        gfx.fillRoundedRect(cx + 4, 49, 12, 6, 2);
        gfx.fillStyle(cBootToe, 1);
        gfx.fillRect(cx - 15, 53, 10, 2);
        gfx.fillRect(cx + 5, 53, 10, 2);
      } else {
        // Idle
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 13, 55, 11, 3, 1);
        gfx.fillRoundedRect(cx + 2, 55, 11, 3, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 13, 49, 11, 7, 2);
        gfx.fillRoundedRect(cx + 2, 49, 11, 7, 2);
        gfx.fillStyle(cBootToe, 1);
        gfx.fillRect(cx - 12, 54, 9, 2);
        gfx.fillRect(cx + 3, 54, 9, 2);
      }

      // B. Denim Overalls Legs
      gfx.fillStyle(cDenimDark, 1);
      gfx.fillRect(cx - 13, 38, 26, 12);
      gfx.fillStyle(cDenim, 1);
      const legW = pose === 'push' ? 10 : 9;
      const legOff = pose === 'push' ? 14 : 12;
      gfx.fillRect(cx - legOff, 38, legW, 11);
      gfx.fillRect(cx + legOff - legW, 38, legW, 11);

      // C. Torso & Hi-Vis Safety Vest
      gfx.fillStyle(cDenimDark, 1);
      gfx.fillRoundedRect(cx - 14, 23, 28, 17, 4);
      // Safety Vest
      gfx.fillStyle(cVest, 1);
      gfx.fillRoundedRect(cx - 13, 23, 26, 14, 3);
      // Reflective Stripes
      gfx.fillStyle(cReflect, 1);
      gfx.fillRect(cx - 8, 23, 3, 14);
      gfx.fillRect(cx + 5, 23, 3, 14);
      gfx.fillRect(cx - 13, 33, 26, 2.5);
      // Utility Belt & Metal Buckle
      gfx.fillStyle(cBelt, 1);
      gfx.fillRect(cx - 14, 37, 28, 3.5);
      gfx.fillStyle(cBuckle, 1);
      gfx.fillRect(cx - 3, 36.5, 6, 4.5);

      // D. Arms & Gloves
      if (pose === 'push') {
        // Both hands thrust downward-forward pressing into the crate
        gfx.fillStyle(cDenimDark, 1);
        gfx.fillRect(cx - 14, 28, 8, 12);
        gfx.fillRect(cx + 6, 28, 8, 12);
        gfx.fillStyle(cGloveCuff, 1);
        gfx.fillRect(cx - 14, 39, 9, 3);
        gfx.fillRect(cx + 5, 39, 9, 3);
        gfx.fillStyle(cGlove, 1);
        gfx.fillRoundedRect(cx - 14, 41, 10, 8, 3);
        gfx.fillRoundedRect(cx + 4, 41, 10, 8, 3);
        // Finger knuckles
        gfx.fillStyle(0xd97706, 1);
        gfx.fillRect(cx - 13, 47, 8, 2);
        gfx.fillRect(cx + 5, 47, 8, 2);
      } else if (pose === 'walk1') {
        // Left arm forward (higher), right arm back (lower)
        gfx.fillStyle(cDenimDark, 1);
        gfx.fillRect(cx - 17, 24, 5, 10);
        gfx.fillRect(cx + 12, 28, 5, 10);
        gfx.fillStyle(cGlove, 1);
        gfx.fillRoundedRect(cx - 18, 28, 6, 9, 2);
        gfx.fillRoundedRect(cx + 12, 35, 6, 8, 2);
      } else if (pose === 'walk2') {
        // Right arm forward (higher), left arm back (lower)
        gfx.fillStyle(cDenimDark, 1);
        gfx.fillRect(cx - 17, 28, 5, 10);
        gfx.fillRect(cx + 12, 24, 5, 10);
        gfx.fillStyle(cGlove, 1);
        gfx.fillRoundedRect(cx - 18, 35, 6, 8, 2);
        gfx.fillRoundedRect(cx + 12, 28, 6, 9, 2);
      } else {
        // Idle: hands resting at sides
        gfx.fillStyle(cDenimDark, 1);
        gfx.fillRect(cx - 17, 25, 5, 10);
        gfx.fillRect(cx + 12, 25, 5, 10);
        gfx.fillStyle(cGlove, 1);
        gfx.fillRoundedRect(cx - 18, 32, 6, 9, 2);
        gfx.fillRoundedRect(cx + 12, 32, 6, 9, 2);
      }

      // E. Head & Face
      gfx.fillStyle(cSkinShadow, 1);
      gfx.fillRect(cx - 4, 21, 8, 4); // Neck
      gfx.fillStyle(cSkin, 1);
      gfx.fillCircle(cx, 16, 9);
      // Ears
      gfx.fillCircle(cx - 9, 16, 2.5);
      gfx.fillCircle(cx + 9, 16, 2.5);
      // Eyes with expressive arcade glint
      gfx.fillStyle(0x0f172a, 1);
      gfx.fillRect(cx - 6, 15, 3, 4);
      gfx.fillRect(cx + 3, 15, 3, 4);
      gfx.fillStyle(0xffffff, 1);
      gfx.fillRect(cx - 6, 15, 1.2, 1.5);
      gfx.fillRect(cx + 3, 15, 1.2, 1.5);
      // In push: focused determination eyebrows
      if (pose === 'push') {
        gfx.fillStyle(0x78350f, 1);
        gfx.fillRect(cx - 7, 13, 5, 1.5);
        gfx.fillRect(cx + 2, 13, 5, 1.5);
      }

      // F. Yellow Industrial Hardhat
      gfx.fillStyle(cHelmet, 1);
      gfx.fillRoundedRect(cx - 12, 6, 24, 11, 5);
      gfx.fillStyle(cHelmetRidge, 1);
      gfx.fillRoundedRect(cx - 2.5, 4, 5, 12, 2);
      gfx.fillStyle(cHelmetBrim, 1);
      gfx.fillRect(cx - 14, 14, 28, 3.5);
      // Miner Headlamp on helmet
      gfx.fillStyle(cLampHousing, 1);
      gfx.fillRoundedRect(cx - 4, 10, 8, 4.5, 1.5);
      gfx.fillStyle(cLampLens, 1);
      gfx.fillCircle(cx, 12, 2.5);
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(cx - 0.5, 11.5, 1);

    } else if (dir === 'up') {
      // --- UP (Facing Away / North) ---
      // A. Boots (Heel view)
      if (pose === 'walk1') {
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 12, 54, 9, 3, 1);
        gfx.fillRoundedRect(cx + 3, 51, 10, 4, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 12, 49, 9, 6, 2);
        gfx.fillRoundedRect(cx + 3, 46, 10, 7, 2);
      } else if (pose === 'walk2') {
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 13, 51, 10, 4, 1);
        gfx.fillRoundedRect(cx + 2, 54, 9, 3, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 13, 46, 10, 7, 2);
        gfx.fillRoundedRect(cx + 2, 49, 9, 6, 2);
      } else {
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 12, 54, 10, 3, 1);
        gfx.fillRoundedRect(cx + 2, 54, 10, 3, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 12, 48, 10, 7, 2);
        gfx.fillRoundedRect(cx + 2, 48, 10, 7, 2);
      }

      // B. Denim Legs
      gfx.fillStyle(cDenimDark, 1);
      gfx.fillRect(cx - 13, 38, 26, 12);
      gfx.fillStyle(cDenim, 1);
      gfx.fillRect(cx - 11, 38, 9, 11);
      gfx.fillRect(cx + 2, 38, 9, 11);
      // Back pockets
      gfx.fillStyle(cDenimDark, 1);
      gfx.fillRect(cx - 10, 36, 6, 5);
      gfx.fillRect(cx + 4, 36, 6, 5);

      // C. Torso & Vest Back Harness
      gfx.fillStyle(cDenimDark, 1);
      gfx.fillRoundedRect(cx - 14, 23, 28, 17, 4);
      gfx.fillStyle(cVest, 1);
      gfx.fillRoundedRect(cx - 13, 23, 26, 14, 3);
      // Reflective 'H' Cross harness
      gfx.fillStyle(cReflect, 1);
      gfx.fillRect(cx - 8, 23, 3, 14);
      gfx.fillRect(cx + 5, 23, 3, 14);
      gfx.fillRect(cx - 8, 28, 16, 3);
      // Belt
      gfx.fillStyle(cBelt, 1);
      gfx.fillRect(cx - 14, 37, 28, 3.5);

      // D. Arms & Hands
      if (pose === 'push') {
        // Both hands thrust UPWARD against the crate at the top
        gfx.fillStyle(cDenimDark, 1);
        gfx.fillRect(cx - 14, 14, 8, 14);
        gfx.fillRect(cx + 6, 14, 8, 14);
        gfx.fillStyle(cGloveCuff, 1);
        gfx.fillRect(cx - 14, 12, 9, 3);
        gfx.fillRect(cx + 5, 12, 9, 3);
        gfx.fillStyle(cGlove, 1);
        gfx.fillRoundedRect(cx - 14, 6, 10, 8, 3);
        gfx.fillRoundedRect(cx + 4, 6, 10, 8, 3);
      } else {
        gfx.fillStyle(cDenimDark, 1);
        gfx.fillRect(cx - 17, 25, 5, 10);
        gfx.fillRect(cx + 12, 25, 5, 10);
        gfx.fillStyle(cGlove, 1);
        gfx.fillRoundedRect(cx - 18, 32, 6, 9, 2);
        gfx.fillRoundedRect(cx + 12, 32, 6, 9, 2);
      }

      // E. Back of Head & Hardhat
      gfx.fillStyle(cSkinShadow, 1);
      gfx.fillRect(cx - 4, 21, 8, 4);
      gfx.fillStyle(cHelmet, 1);
      gfx.fillRoundedRect(cx - 12, 6, 24, 15, 6);
      gfx.fillStyle(cHelmetRidge, 1);
      gfx.fillRoundedRect(cx - 2.5, 4, 5, 16, 2);
      gfx.fillStyle(cHelmetBrim, 1);
      gfx.fillRect(cx - 13, 18, 26, 3);

    } else if (dir === 'left') {
      // --- LEFT (Profile Facing West) ---
      const leanX = pose === 'push' ? -3 : 0;

      // A. Boots
      if (pose === 'push') {
        // Back leg braced far right, front leg firmly planted left
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 17, 54, 13, 4, 1);
        gfx.fillRoundedRect(cx + 5, 55, 11, 3, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 17, 49, 13, 7, 2);
        gfx.fillRoundedRect(cx + 5, 51, 11, 6, 2);
        gfx.fillStyle(cBootToe, 1);
        gfx.fillRect(cx - 17, 52, 4, 3);
      } else if (pose === 'walk1') {
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 14, 53, 12, 3, 1);
        gfx.fillRoundedRect(cx + 2, 55, 10, 3, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 14, 48, 12, 6, 2);
        gfx.fillRoundedRect(cx + 2, 51, 10, 6, 2);
      } else if (pose === 'walk2') {
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 8, 55, 10, 3, 1);
        gfx.fillRoundedRect(cx - 2, 53, 12, 3, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 8, 51, 10, 6, 2);
        gfx.fillRoundedRect(cx - 2, 48, 12, 6, 2);
      } else {
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 11, 54, 13, 3, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 11, 49, 13, 7, 2);
        gfx.fillStyle(cBootToe, 1);
        gfx.fillRect(cx - 11, 52, 4, 3);
      }

      // B. Denim Legs
      gfx.fillStyle(cDenim, 1);
      gfx.fillRect(cx - 11 + leanX, 38, 18, 12);

      // C. Torso & Vest
      gfx.fillStyle(cDenimDark, 1);
      gfx.fillRoundedRect(cx - 12 + leanX, 23, 22, 17, 4);
      gfx.fillStyle(cVest, 1);
      gfx.fillRoundedRect(cx - 11 + leanX, 23, 20, 14, 3);
      gfx.fillStyle(cReflect, 1);
      gfx.fillRect(cx - 7 + leanX, 23, 3.5, 14);
      gfx.fillRect(cx - 11 + leanX, 32, 20, 2.5);
      // Belt
      gfx.fillStyle(cBelt, 1);
      gfx.fillRect(cx - 12 + leanX, 37, 22, 3.5);

      // D. Hands & Pushing Arms
      if (pose === 'push') {
        // Both arms fully extended LEFT pressing flat against crate
        gfx.fillStyle(cDenimDark, 1);
        gfx.fillRect(cx - 18, 25, 16, 7);
        gfx.fillRect(cx - 14, 29, 14, 7);
        gfx.fillStyle(cGloveCuff, 1);
        gfx.fillRect(cx - 20, 24, 3, 14);
        gfx.fillStyle(cGlove, 1);
        gfx.fillRoundedRect(cx - 25, 24, 7, 14, 2);
      } else {
        gfx.fillStyle(cDenimDark, 1);
        gfx.fillRect(cx - 8, 25, 6, 11);
        gfx.fillStyle(cGlove, 1);
        gfx.fillRoundedRect(cx - 10, 33, 7, 8, 2);
      }

      // E. Head Profile
      gfx.fillStyle(cSkin, 1);
      gfx.fillCircle(cx - 3 + leanX, 16, 8.5);
      // Focused Eye
      gfx.fillStyle(0x0f172a, 1);
      gfx.fillRect(cx - 9 + leanX, 15, 3, 4);
      gfx.fillStyle(0xffffff, 1);
      gfx.fillRect(cx - 9 + leanX, 15, 1.2, 1.5);
      if (pose === 'push') {
        gfx.fillStyle(0x78350f, 1);
        gfx.fillRect(cx - 10 + leanX, 13, 5, 1.5);
      }

      // F. Hardhat & Lamp Profile
      gfx.fillStyle(cHelmet, 1);
      gfx.fillRoundedRect(cx - 12 + leanX, 6, 20, 11, 4);
      gfx.fillStyle(cHelmetBrim, 1);
      gfx.fillRect(cx - 15 + leanX, 14, 22, 3.5);
      // Headlamp beaming left
      gfx.fillStyle(cLampHousing, 1);
      gfx.fillRect(cx - 16 + leanX, 10, 4, 5);
      gfx.fillStyle(cLampLens, 1);
      gfx.fillRect(cx - 17 + leanX, 10.5, 2, 4);

    } else {
      // --- RIGHT (Profile Facing East) ---
      const leanX = pose === 'push' ? 3 : 0;

      // A. Boots
      if (pose === 'push') {
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 16, 55, 11, 3, 1);
        gfx.fillRoundedRect(cx + 4, 54, 13, 4, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 16, 51, 11, 6, 2);
        gfx.fillRoundedRect(cx + 4, 49, 13, 7, 2);
        gfx.fillStyle(cBootToe, 1);
        gfx.fillRect(cx + 13, 52, 4, 3);
      } else if (pose === 'walk1') {
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 12, 55, 10, 3, 1);
        gfx.fillRoundedRect(cx + 2, 53, 12, 3, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 12, 51, 10, 6, 2);
        gfx.fillRoundedRect(cx + 2, 48, 12, 6, 2);
      } else if (pose === 'walk2') {
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 2, 53, 12, 3, 1);
        gfx.fillRoundedRect(cx + 4, 55, 10, 3, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 2, 48, 12, 6, 2);
        gfx.fillRoundedRect(cx + 4, 51, 10, 6, 2);
      } else {
        gfx.fillStyle(cBootSole, 1);
        gfx.fillRoundedRect(cx - 2, 54, 13, 3, 1);
        gfx.fillStyle(cBoot, 1);
        gfx.fillRoundedRect(cx - 2, 49, 13, 7, 2);
        gfx.fillStyle(cBootToe, 1);
        gfx.fillRect(cx + 7, 52, 4, 3);
      }

      // B. Denim Legs
      gfx.fillStyle(cDenim, 1);
      gfx.fillRect(cx - 7 + leanX, 38, 18, 12);

      // C. Torso & Vest
      gfx.fillStyle(cDenimDark, 1);
      gfx.fillRoundedRect(cx - 10 + leanX, 23, 22, 17, 4);
      gfx.fillStyle(cVest, 1);
      gfx.fillRoundedRect(cx - 9 + leanX, 23, 20, 14, 3);
      gfx.fillStyle(cReflect, 1);
      gfx.fillRect(cx + 3.5 + leanX, 23, 3.5, 14);
      gfx.fillRect(cx - 9 + leanX, 32, 20, 2.5);
      // Belt
      gfx.fillStyle(cBelt, 1);
      gfx.fillRect(cx - 10 + leanX, 37, 22, 3.5);

      // D. Hands & Pushing Arms
      if (pose === 'push') {
        // Both arms fully extended RIGHT pressing flat against crate
        gfx.fillStyle(cDenimDark, 1);
        gfx.fillRect(cx + 2, 25, 16, 7);
        gfx.fillRect(cx, 29, 14, 7);
        gfx.fillStyle(cGloveCuff, 1);
        gfx.fillRect(cx + 17, 24, 3, 14);
        gfx.fillStyle(cGlove, 1);
        gfx.fillRoundedRect(cx + 18, 24, 7, 14, 2);
      } else {
        gfx.fillStyle(cDenimDark, 1);
        gfx.fillRect(cx + 2, 25, 6, 11);
        gfx.fillStyle(cGlove, 1);
        gfx.fillRoundedRect(cx + 3, 33, 7, 8, 2);
      }

      // E. Head Profile
      gfx.fillStyle(cSkin, 1);
      gfx.fillCircle(cx + 3 + leanX, 16, 8.5);
      // Focused Eye
      gfx.fillStyle(0x0f172a, 1);
      gfx.fillRect(cx + 6 + leanX, 15, 3, 4);
      gfx.fillStyle(0xffffff, 1);
      gfx.fillRect(cx + 7.8 + leanX, 15, 1.2, 1.5);
      if (pose === 'push') {
        gfx.fillStyle(0x78350f, 1);
        gfx.fillRect(cx + 5 + leanX, 13, 5, 1.5);
      }

      // F. Hardhat & Lamp Profile
      gfx.fillStyle(cHelmet, 1);
      gfx.fillRoundedRect(cx - 8 + leanX, 6, 20, 11, 4);
      gfx.fillStyle(cHelmetBrim, 1);
      gfx.fillRect(cx - 7 + leanX, 14, 22, 3.5);
      // Headlamp beaming right
      gfx.fillStyle(cLampHousing, 1);
      gfx.fillRect(cx + 12 + leanX, 10, 4, 5);
      gfx.fillStyle(cLampLens, 1);
      gfx.fillRect(cx + 15 + leanX, 10.5, 2, 4);
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
      // Mega Terminal: High-Tech Concourse Bulkhead (大型太空航站高科技隔艙壁)
      // Monolithic aerospace wall with dual structural pylons, recessed blast louvers, and cyan guide light:

      // 1. Central Inset Machinery & Blast Louver Bay (中央深色精密通風格柵槽)
      const bayX = 11;
      const bayW = S - 22;
      gfx.fillStyle(colors.shadow, 0.95);
      gfx.fillRect(bayX, 6, bayW, S - 12);

      // Horizontal precision blast louvers (航太通風/防爆導流葉片)
      for (let y = 12; y <= S - 14; y += 6) {
        // Deep shadow slit
        gfx.fillStyle(colors.shadow, 1);
        gfx.fillRect(bayX + 2, y, bayW - 4, 3);
        // Beveled metallic louver slat
        gfx.fillStyle(colors.face, 1);
        gfx.fillRect(bayX + 2, y, bayW - 4, 2);
        gfx.fillStyle(colors.highlight, 0.4);
        gfx.fillRect(bayX + 2, y, bayW - 4, 1);
      }

      // 2. Central Cyan Terminal Status Guide Lightstrip (中央青色終端導引光條)
      gfx.fillStyle(colors.shadow, 1);
      gfx.fillRect(bayX + 2, S / 2 - 2, bayW - 4, 4);
      gfx.fillStyle(colors.accent, 0.95);
      gfx.fillRect(bayX + 4, S / 2 - 1, bayW - 8, 2);
      gfx.fillStyle(0xffffff, 1);
      gfx.fillRect(S / 2 - 2, S / 2 - 1, 4, 2);

      // 3. Dual Vertical Structural Pylons (左右兩側立體加固承重柱)
      // Left Pylon
      gfx.fillStyle(colors.face, 1);
      gfx.fillRect(4, 4, 7, S - 8);
      gfx.fillStyle(colors.highlight, 0.7);
      gfx.fillRect(4, 4, 2, S - 8);
      gfx.fillStyle(colors.shadow, 0.8);
      gfx.fillRect(9, 4, 2, S - 8);

      // Right Pylon
      gfx.fillStyle(colors.face, 1);
      gfx.fillRect(S - 11, 4, 7, S - 8);
      gfx.fillStyle(colors.highlight, 0.7);
      gfx.fillRect(S - 11, 4, 2, S - 8);
      gfx.fillStyle(colors.shadow, 0.8);
      gfx.fillRect(S - 6, 4, 2, S - 8);

      // 4. Heavy Structural Pylon Anchor Bolts (立柱重型固定錨栓)
      const anchorBolts = [
        [7, 8],
        [7, S - 9],
        [S - 8, 8],
        [S - 8, S - 9],
      ];
      for (const [bx, by] of anchorBolts) {
        gfx.fillStyle(colors.shadow, 1);
        gfx.fillCircle(bx, by, 2.2);
        gfx.fillStyle(colors.accent, 0.85);
        gfx.fillCircle(bx, by, 1.4);
        gfx.fillStyle(0xffffff, 0.9);
        gfx.fillCircle(bx - 0.5, by - 0.5, 0.7);
      }
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
      // Mega Terminal: High-Tech Concourse Slate Floor with 4 Stainless Steel Corner Screws
      gfx.lineStyle(1, colors.grid, 0.7);
      gfx.lineBetween(S / 2, 2, S / 2, S - 2);
      gfx.lineBetween(2, S / 2, S - 2, S / 2);

      gfx.fillStyle(colors.grid, 0.8);
      gfx.fillCircle(S / 2, S / 2, 2.5);

      const screwCoords = [
        [6, 6],
        [S - 6, 6],
        [6, S - 6],
        [S - 6, S - 6],
      ];
      for (const [sx, sy] of screwCoords) {
        // Dark recessed socket hole
        gfx.fillStyle(colors.grid, 1);
        gfx.fillCircle(sx, sy, 3.0);
        // Polished stainless steel screw head (Slate-400 silver)
        gfx.fillStyle(colors.accent, 1);
        gfx.fillCircle(sx, sy, 2.0);
        // Specular white glint highlight
        gfx.fillStyle(0xffffff, 0.95);
        gfx.fillCircle(sx - 0.7, sy - 0.7, 0.9);
      }
    }

    gfx.generateTexture(key, S, S);
    gfx.destroy();
  }

  private generateAmbientTexture(key: string, S: number, theme: string): void {
    if (this.textures.exists(key)) return;
    const gfx = this.make.graphics({ x: 0, y: 0 });

    if (theme.includes('cargo')) {
      // Dark seamless wooden warehouse floorboards
      gfx.fillStyle(0x180f08, 1);
      gfx.fillRect(0, 0, S, S);

      // Plank blocks
      const pw = S / 2;
      const ph = S / 2;
      gfx.fillStyle(0x23170e, 0.85);
      gfx.fillRect(1, 1, pw - 2, ph - 2);
      gfx.fillRect(pw + 1, ph + 1, pw - 2, ph - 2);
      gfx.fillStyle(0x1d120a, 0.85);
      gfx.fillRect(pw + 1, 1, pw - 2, ph - 2);
      gfx.fillRect(1, ph + 1, pw - 2, ph - 2);

      // Seams
      gfx.lineStyle(1, 0x100905, 0.9);
      gfx.lineBetween(0, ph, S, ph);
      gfx.lineBetween(pw, 0, pw, S);

      // Nail dots
      gfx.fillStyle(0x452a15, 0.6);
      gfx.fillRect(4, 4, 2, 2);
      gfx.fillRect(pw - 6, 4, 2, 2);
      gfx.fillRect(pw + 4, ph + 4, 2, 2);
      gfx.fillRect(S - 6, ph + 4, 2, 2);
    } else if (theme.includes('cyber')) {
      // Cyber matrix motherboard / data bus
      gfx.fillStyle(0x060b14, 1);
      gfx.fillRect(0, 0, S, S);

      // Circuit grid lines
      gfx.lineStyle(1, 0x0c192d, 0.8);
      gfx.strokeRect(0, 0, S, S);
      gfx.lineBetween(S / 2, 0, S / 2, S);
      gfx.lineBetween(0, S / 2, S, S / 2);

      // Diagonal circuit traces
      gfx.lineStyle(1, 0x0369a1, 0.45);
      gfx.lineBetween(8, 0, 0, 8);
      gfx.lineBetween(S, S - 8, S - 8, S);
      gfx.lineBetween(S / 2, 16, S - 16, S / 2);

      // Glowing micro node junctions
      gfx.fillStyle(0x38bdf8, 0.6);
      gfx.fillCircle(S / 2, S / 2, 2);
      gfx.fillCircle(0, 0, 1.5);
      gfx.fillCircle(S, 0, 1.5);
      gfx.fillCircle(0, S, 1.5);
      gfx.fillCircle(S, S, 1.5);
    } else if (theme.includes('steel')) {
      // Industrial cold-rolled steel diamond treadplate
      gfx.fillStyle(0x101622, 1);
      gfx.fillRect(0, 0, S, S);

      // Steel panel border
      gfx.lineStyle(1, 0x0a0f18, 0.8);
      gfx.strokeRect(0, 0, S, S);

      // Diamond treadplate pairs
      gfx.fillStyle(0x273448, 0.8);
      gfx.fillRect(10, 10, 8, 2);
      gfx.fillRect(13, 7, 2, 8);
      gfx.fillRect(S - 18, S - 18, 8, 2);
      gfx.fillRect(S - 15, S - 21, 2, 8);
      gfx.fillRect(S / 2 - 4, S / 2 - 1, 8, 2);
      gfx.fillRect(S / 2 - 1, S / 2 - 4, 2, 8);

      // Panel corner rivet dots
      gfx.fillStyle(0x3b4d66, 0.5);
      gfx.fillCircle(3, 3, 1.5);
      gfx.fillCircle(S - 3, 3, 1.5);
      gfx.fillCircle(3, S - 3, 1.5);
      gfx.fillCircle(S - 3, S - 3, 1.5);
    } else {
      // Mega Terminal: Obsidian terrazzo with fine gold inlay
      gfx.fillStyle(0x09090d, 1);
      gfx.fillRect(0, 0, S, S);

      // Inset dark terrazzo tiles
      gfx.fillStyle(0x13131a, 0.85);
      gfx.fillRect(2, 2, S / 2 - 3, S / 2 - 3);
      gfx.fillRect(S / 2 + 1, 2, S / 2 - 3, S / 2 - 3);
      gfx.fillRect(2, S / 2 + 1, S / 2 - 3, S / 2 - 3);
      gfx.fillRect(S / 2 + 1, S / 2 + 1, S / 2 - 3, S / 2 - 3);

      // Fine antique gold inlay grid
      gfx.lineStyle(1, 0x52320c, 0.6);
      gfx.strokeRect(0, 0, S, S);
      gfx.lineBetween(S / 2, 0, S / 2, S);
      gfx.lineBetween(0, S / 2, S, S / 2);

      // Center gold emblem pip
      gfx.fillStyle(0x784c15, 0.7);
      gfx.fillCircle(S / 2, S / 2, 2);
      gfx.fillRect(0, 0, 2, 2);
      gfx.fillRect(S - 2, 0, 2, 2);
      gfx.fillRect(0, S - 2, 2, 2);
      gfx.fillRect(S - 2, S - 2, 2, 2);
    }

    gfx.generateTexture(key, S, S);
    gfx.destroy();
  }
}

