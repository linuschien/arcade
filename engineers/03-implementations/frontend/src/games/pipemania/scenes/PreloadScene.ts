/**
 * PreloadScene.ts
 * Generates high-fidelity, vibrant Arcade Cyberpunk textures ('pipemania:*') procedurally.
 * Features 3D-shaded cylindrical pipes, smooth quarter-torus curved elbows,
 * directional Start & End valves with bold illuminated indicators, and glowing grid tiles.
 */

import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'pipemania:PreloadScene' });
  }

  public preload(): void {
    this.createProceduralTextures();
  }

  public create(): void {
    this.scene.start('pipemania:MainGameScene');
  }

  private createProceduralTextures(): void {
    const TILE_SIZE = 64;
    const PIPE_WIDTH = 28;
    const PIPE_OFFSET = (TILE_SIZE - PIPE_WIDTH) / 2; // 18

    // 1. Cyberpunk Grid Tile (Dark Tech with Corner Crosshairs & Subtle Border)
    if (!this.textures.exists('pipemania:grid_tile')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Dark cyber slate base
      gfx.fillStyle(0x0a0f1d, 1);
      gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      
      // Grid cell bevel
      gfx.lineStyle(1, 0x1e293b, 0.8);
      gfx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);

      // Subtle inner grid dots
      gfx.fillStyle(0x334155, 0.5);
      gfx.fillRect(3, 3, 2, 2);
      gfx.fillRect(TILE_SIZE - 5, 3, 2, 2);
      gfx.fillRect(3, TILE_SIZE - 5, 2, 2);
      gfx.fillRect(TILE_SIZE - 5, TILE_SIZE - 5, 2, 2);

      // Center crosshair target
      gfx.fillStyle(0x1e293b, 0.6);
      gfx.fillRect(TILE_SIZE / 2 - 3, TILE_SIZE / 2, 6, 1);
      gfx.fillRect(TILE_SIZE / 2, TILE_SIZE / 2 - 3, 1, 6);

      gfx.generateTexture('pipemania:grid_tile', TILE_SIZE, TILE_SIZE);
      gfx.destroy();
    }

    // 2. Obstacle (3D Arcade Traffic Safety Cone with Hazard Markings)
    if (!this.textures.exists('pipemania:obstacle_rock')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      const S = TILE_SIZE; // 64

      // Steel grid base tile
      gfx.fillStyle(0x0f172a, 1);
      gfx.fillRoundedRect(2, 2, S - 4, S - 4, 6);
      gfx.lineStyle(1.5, 0x1e293b, 1);
      gfx.strokeRoundedRect(2, 2, S - 4, S - 4, 6);

      // Yellow & Black Diagonal Hazard Ground Plate (Caution Zone)
      gfx.fillStyle(0xd97706, 0.85); // Amber gold caution plate
      gfx.fillRoundedRect(7, 7, S - 14, S - 14, 4);

      // Dark diagonal stripes
      gfx.fillStyle(0x090d16, 0.92);
      for (let i = -2; i < 7; i++) {
        gfx.fillTriangle(
          7 + i * 12, 7,
          7 + (i + 1) * 12, 7,
          7, 7 + (i + 1) * 12
        );
        gfx.fillTriangle(
          7, 7 + (i + 1) * 12,
          7 + (i + 1) * 12, 7,
          7 + (i + 2) * 12, 7
        );
      }
      gfx.lineStyle(1, 0xb45309, 1);
      gfx.strokeRoundedRect(7, 7, S - 14, S - 14, 4);

      // Drop shadow underneath the traffic cone
      gfx.fillStyle(0x000000, 0.65);
      gfx.fillEllipse(32, 53, 34, 10);

      // --- Traffic Cone Heavy Rubber Base (Square/Rounded Plate) ---
      gfx.fillStyle(0x18181b, 1); // Dark vulcanized rubber
      gfx.fillRoundedRect(14, 46, 36, 9, 3);
      gfx.fillStyle(0x27272a, 1); // Rubber base bevel
      gfx.fillRoundedRect(16, 45, 32, 4, 2);
      gfx.lineStyle(1, 0x3f3f46, 0.8);
      gfx.strokeRoundedRect(14, 46, 36, 9, 3);

      // --- Vibrant Safety Orange Cone Body ---
      // Right shadow side
      gfx.fillStyle(0xc2410c, 1); // Deep orange shadow
      gfx.fillTriangle(32, 10, 44, 47, 32, 47);

      // Left light side
      gfx.fillStyle(0xf97316, 1); // Bright vibrant orange
      gfx.fillTriangle(32, 10, 20, 47, 32, 47);

      // Cone center blend
      gfx.fillStyle(0xea580c, 1);
      gfx.fillTriangle(32, 10, 24, 47, 40, 47);

      // --- Reflective Silver-White Safety Bands ---
      // Lower Reflective Band (Y: 33 to 41)
      gfx.fillStyle(0xf8fafc, 1);
      gfx.fillTriangle(24.5, 33, 39.5, 33, 22.5, 41);
      gfx.fillTriangle(39.5, 33, 41.5, 41, 22.5, 41);

      // Lower band shadow on right side
      gfx.fillStyle(0x94a3b8, 0.9);
      gfx.fillTriangle(32, 33, 39.5, 33, 32, 41);
      gfx.fillTriangle(39.5, 33, 41.5, 41, 32, 41);

      // Upper Reflective Band (Y: 20 to 27)
      gfx.fillStyle(0xf8fafc, 1);
      gfx.fillTriangle(27.8, 20, 36.2, 20, 25.8, 27);
      gfx.fillTriangle(36.2, 20, 38.2, 27, 25.8, 27);

      // Upper band shadow on right side
      gfx.fillStyle(0x94a3b8, 0.9);
      gfx.fillTriangle(32, 20, 36.2, 20, 32, 27);
      gfx.fillTriangle(36.2, 20, 38.2, 27, 32, 27);

      // Specular gloss vertical shine along the left highlight contour
      gfx.fillStyle(0xffffff, 0.45);
      gfx.fillTriangle(30, 12, 31.5, 12, 23.5, 46);
      gfx.fillTriangle(31.5, 12, 25, 46, 23.5, 46);

      // Top Cone Opening Hole (3D Rim & Depth)
      gfx.fillStyle(0x431407, 1); // Dark inner hole
      gfx.fillEllipse(32, 10, 6, 2.5);
      gfx.lineStyle(1, 0xfed7aa, 0.9); // Top rim highlight
      gfx.strokeEllipse(32, 10, 6, 2.5);

      gfx.generateTexture('pipemania:obstacle_rock', S, S);
      gfx.destroy();
    }

    // 3. Directional Start Valves (Cyan High-Tech Pump with Bold Outflow Nozzle & Arrow)
    this.createDirectionalStartValves(TILE_SIZE);

    // 4. Directional End Drains (Amber Drain Cyclone with Intake Funnel & Directional Grate)
    this.createDirectionalEndDrains(TILE_SIZE);

    // 5. Reticle Cursor
    if (!this.textures.exists('pipemania:reticle')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.lineStyle(2, 0x38bdf8, 1); // Neon cyan
      gfx.strokeRoundedRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2, 4);

      // Corner thick brackets
      gfx.fillStyle(0x00f0ff, 1);
      gfx.fillRect(1, 1, 14, 4);
      gfx.fillRect(1, 1, 4, 14);
      gfx.fillRect(TILE_SIZE - 15, 1, 14, 4);
      gfx.fillRect(TILE_SIZE - 5, 1, 4, 14);
      gfx.fillRect(1, TILE_SIZE - 5, 14, 4);
      gfx.fillRect(1, TILE_SIZE - 15, 4, 14);
      gfx.fillRect(TILE_SIZE - 15, TILE_SIZE - 5, 14, 4);
      gfx.fillRect(TILE_SIZE - 5, TILE_SIZE - 15, 4, 14);

      gfx.generateTexture('pipemania:reticle', TILE_SIZE, TILE_SIZE);
      gfx.destroy();
    }

    // 6. Wrench (Life Icon - Realistic Chrome Open-End / Combination Spanner)
    if (!this.textures.exists('pipemania:wrench')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      const W = 30;
      const H = 30;

      // 1. Diagonal Shaft / Handle (Chrome Steel with bevel)
      gfx.lineStyle(5, 0x334155, 1); // Dark metal contour
      gfx.strokeLineShape(new Phaser.Geom.Line(8, 22, 22, 8));

      gfx.lineStyle(3.5, 0x94a3b8, 1); // Steel body
      gfx.strokeLineShape(new Phaser.Geom.Line(8, 22, 22, 8));

      gfx.lineStyle(1.5, 0xf8fafc, 1); // Chrome specular center highlight
      gfx.strokeLineShape(new Phaser.Geom.Line(9, 21, 21, 9));

      // 2. Open-Ended U/C Jaw Head at Top-Right (22, 8)
      const hx = 22;
      const hy = 8;
      gfx.fillStyle(0x94a3b8, 1);
      gfx.fillCircle(hx, hy, 6);
      gfx.fillStyle(0x0a0f1d, 1); // Empty cutout opening
      gfx.fillTriangle(hx - 1, hy - 1, hx + 7, hy - 5, hx + 5, hy + 7);

      // Jaw tips
      gfx.fillStyle(0xe2e8f0, 1);
      gfx.fillCircle(hx + 2, hy - 4, 1.8);
      gfx.fillCircle(hx + 4, hy + 2, 1.8);

      // 3. Ring / Box Spanner End at Bottom-Left (8, 22)
      const rx = 8;
      const ry = 22;
      gfx.fillStyle(0x94a3b8, 1);
      gfx.fillCircle(rx, ry, 5.5);
      gfx.fillStyle(0x0a0f1d, 1);
      gfx.fillCircle(rx, ry, 2.5); // Inner hex hole

      // Chrome rim highlight
      gfx.lineStyle(1, 0xf8fafc, 0.9);
      gfx.strokeCircle(rx, ry, 5.5);

      gfx.generateTexture('pipemania:wrench', W, H);
      gfx.destroy();
    }

    // 7. Preset Gold Bolted Frame (4-Corner Heavy Golden Hex Bolts & Reinforced Brackets)
    if (!this.textures.exists('pipemania:preset_bolt')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      const S = TILE_SIZE; // 64

      const corners = [
        { cx: 8, cy: 8 }, // Top-Left
        { cx: S - 8, cy: 8 }, // Top-Right
        { cx: 8, cy: S - 8 }, // Bottom-Left
        { cx: S - 8, cy: S - 8 }, // Bottom-Right
      ];

      for (const { cx, cy } of corners) {
        // Drop shadow for bolt
        gfx.fillStyle(0x000000, 0.6);
        gfx.fillCircle(cx + 1, cy + 1, 5.5);

        // Golden L-Bracket Base Plate
        gfx.fillStyle(0x78350f, 1); // Dark gold bevel
        gfx.fillCircle(cx, cy, 6);

        // Metallic Golden Hex Bolt Base
        gfx.fillStyle(0xb45309, 1);
        gfx.fillCircle(cx, cy, 5);

        // Bright Gold Bolt Cap
        gfx.fillStyle(0xf59e0b, 1);
        gfx.fillCircle(cx, cy, 4);

        // Shiny Bevel Edge
        gfx.fillStyle(0xfef08a, 1);
        gfx.fillCircle(cx - 1, cy - 1, 2.2);

        // Center Screwdriver Slot / Hex Recess
        gfx.fillStyle(0x451a03, 1);
        gfx.fillRect(cx - 2.5, cy - 0.75, 5, 1.5);

        // Specular White Ping
        gfx.fillStyle(0xffffff, 0.95);
        gfx.fillCircle(cx - 1.5, cy - 1.5, 1);
      }

      // Subtle Golden Corner Rivet Brackets on outer border
      gfx.lineStyle(1.5, 0xf59e0b, 0.85);
      // Top-Left corner bracket
      gfx.strokeLineShape(new Phaser.Geom.Line(3, 14, 3, 3));
      gfx.strokeLineShape(new Phaser.Geom.Line(3, 3, 14, 3));
      // Top-Right corner bracket
      gfx.strokeLineShape(new Phaser.Geom.Line(S - 14, 3, S - 3, 3));
      gfx.strokeLineShape(new Phaser.Geom.Line(S - 3, 3, S - 3, 14));
      // Bottom-Left corner bracket
      gfx.strokeLineShape(new Phaser.Geom.Line(3, S - 14, 3, S - 3));
      gfx.strokeLineShape(new Phaser.Geom.Line(3, S - 3, 14, S - 3));
      // Bottom-Right corner bracket
      gfx.strokeLineShape(new Phaser.Geom.Line(S - 14, S - 3, S - 3, S - 3));
      gfx.strokeLineShape(new Phaser.Geom.Line(S - 3, S - 14, S - 3, S - 3));

      gfx.generateTexture('pipemania:preset_bolt', S, S);
      gfx.destroy();
    }

    // 8. Little Plumber Mascot Sprite (64x64 Retro Arcade Plumber)
    if (!this.textures.exists('pipemania:plumber')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      const S = 64;

      // Drop shadow underneath
      gfx.fillStyle(0x000000, 0.45);
      gfx.fillEllipse(32, 59, 28, 8);

      // --- Boots & Feet ---
      gfx.fillStyle(0x451a03, 1); // Dark leather
      gfx.fillRoundedRect(20, 52, 10, 8, 3);
      gfx.fillRoundedRect(34, 52, 10, 8, 3);
      gfx.fillStyle(0x78350f, 1); // Boot upper
      gfx.fillRoundedRect(20, 50, 10, 5, 2);
      gfx.fillRoundedRect(34, 50, 10, 5, 2);

      // --- Red Undershirt ---
      gfx.fillStyle(0xdc2626, 1); // Red shirt
      gfx.fillRoundedRect(22, 32, 20, 16, 4);
      // Left arm
      gfx.fillRoundedRect(15, 34, 8, 14, 3);
      // Right arm raised holding wrench
      gfx.fillRoundedRect(41, 28, 8, 14, 3);

      // --- Denim Overalls ---
      gfx.fillStyle(0x1d4ed8, 1); // Blue denim overalls
      gfx.fillRoundedRect(23, 37, 18, 15, 3);
      // Pants legs separation
      gfx.fillStyle(0x1e3a8a, 1);
      gfx.fillRect(31, 46, 2, 6);
      // Overalls suspender straps
      gfx.fillStyle(0x2563eb, 1);
      gfx.fillRect(25, 32, 3.5, 9);
      gfx.fillRect(35.5, 32, 3.5, 9);
      // Gold Buttons
      gfx.fillStyle(0xfbbf24, 1);
      gfx.fillCircle(26.7, 40, 1.8);
      gfx.fillCircle(37.2, 40, 1.8);
      // Center chest pocket
      gfx.lineStyle(1, 0x1e3a8a, 1);
      gfx.strokeRect(28, 41, 8, 6);

      // --- White Work Gloves ---
      gfx.fillStyle(0xf8fafc, 1);
      gfx.fillCircle(17, 46, 4.5); // Left glove
      gfx.fillCircle(47, 26, 4.5); // Right glove
      gfx.fillStyle(0xe2e8f0, 1);
      gfx.fillCircle(17, 46, 2.5);
      gfx.fillCircle(47, 26, 2.5);

      // --- Big Metallic Chrome Wrench in Right Hand ---
      gfx.lineStyle(4, 0x64748b, 1);
      gfx.strokeLineShape(new Phaser.Geom.Line(47, 26, 56, 14));
      gfx.lineStyle(2, 0xe2e8f0, 1);
      gfx.strokeLineShape(new Phaser.Geom.Line(47, 26, 56, 14));
      // Wrench Jaw
      gfx.fillStyle(0x94a3b8, 1);
      gfx.fillCircle(56, 14, 5);
      gfx.fillStyle(0x0a0f1d, 1);
      gfx.fillTriangle(54, 12, 60, 10, 58, 18);
      gfx.fillStyle(0xf8fafc, 1);
      gfx.fillCircle(55, 11, 1.5);
      gfx.fillCircle(58, 16, 1.5);

      // --- Head & Face ---
      // Ears
      gfx.fillStyle(0xfb923c, 1);
      gfx.fillCircle(20, 23, 3);
      gfx.fillCircle(44, 23, 3);
      // Face
      gfx.fillStyle(0xfdba74, 1); // Warm skin tone
      gfx.fillCircle(32, 23, 11);

      // Rosy Cheeks
      gfx.fillStyle(0xf43f5e, 0.45);
      gfx.fillCircle(24, 26, 2.5);
      gfx.fillCircle(40, 26, 2.5);

      // Big Sparkling Eyes
      gfx.fillStyle(0x0f172a, 1);
      gfx.fillCircle(27, 21, 2.5);
      gfx.fillCircle(37, 21, 2.5);
      gfx.fillStyle(0xffffff, 1); // Specular white pupil reflections
      gfx.fillCircle(27.8, 20.2, 1);
      gfx.fillCircle(37.8, 20.2, 1);

      // Cute Plumber Mustache & Nose
      gfx.fillStyle(0x78350f, 1); // Brown mustache
      gfx.fillEllipse(28.5, 27, 4.5, 2.5);
      gfx.fillEllipse(35.5, 27, 4.5, 2.5);
      gfx.fillStyle(0xf97316, 1); // Cute nose
      gfx.fillCircle(32, 24, 2);

      // --- Yellow Construction Helmet / Hardhat ---
      gfx.fillStyle(0xeab308, 1); // Hardhat brim
      gfx.fillRoundedRect(17, 16, 30, 4.5, 2);
      gfx.fillStyle(0xfacc15, 1); // Hardhat dome
      gfx.fillCircle(32, 14, 12.5);
      // Helmet specular gloss streak
      gfx.fillStyle(0xfef08a, 0.9);
      gfx.fillRoundedRect(24, 5, 10, 2.5, 1);
      // Front badge / lamp on helmet
      gfx.fillStyle(0x38bdf8, 1);
      gfx.fillCircle(32, 13, 2.5);
      gfx.fillStyle(0xffffff, 1);
      gfx.fillCircle(32, 13, 1);

      gfx.generateTexture('pipemania:plumber', S, S);
      gfx.destroy();
    }

    // Generate Standard and Specialized 3D Pipe Textures
    this.createHighClarityPipeTextures(TILE_SIZE, PIPE_WIDTH, PIPE_OFFSET);
  }

  /**
   * Generates Directional Start Valves for RIGHT, LEFT, UP, DOWN.
   * Clearly shows solid casing on 3 sides and an extended OUTFLOW NOZZLE on the active port.
   */
  private createDirectionalStartValves(tileSize: number): void {
    const directions = [
      { dir: 'right', nx: 1, ny: 0, label: 'START ▶' },
      { dir: 'left', nx: -1, ny: 0, label: '◀ START' },
      { dir: 'up', nx: 0, ny: -1, label: '▲ START' },
      { dir: 'down', nx: 0, ny: 1, label: '▼ START' },
    ];

    directions.forEach(({ dir, nx, ny }) => {
      const key = `pipemania:start_valve_${dir}`;
      this.drawAndSaveTexture(key, tileSize, (gfx) => {
        const cx = tileSize / 2;
        const cy = tileSize / 2;
        const nw = 26; // Nozzle width

        // Dark tile base
        gfx.fillStyle(0x0a0f1d, 1);
        gfx.fillRect(0, 0, tileSize, tileSize);

        // 1. Outflow Pipe Nozzle extending to the border
        gfx.fillStyle(0x0284c7, 1); // Sky blue nozzle body
        if (nx !== 0) {
          const x = nx > 0 ? cx : 0;
          gfx.fillRect(x, cy - nw / 2, cx, nw);
          // Inner green fluid channel
          gfx.fillStyle(0x15803d, 1);
          gfx.fillRect(x, cy - (nw - 8) / 2, cx, nw - 8);
          // Connection Flange Collar on the active border
          gfx.fillStyle(0x38bdf8, 1);
          gfx.fillRect(nx > 0 ? tileSize - 4 : 0, cy - nw / 2 - 2, 4, nw + 4);
        } else {
          const y = ny > 0 ? cy : 0;
          gfx.fillRect(cx - nw / 2, y, nw, cy);
          gfx.fillStyle(0x15803d, 1);
          gfx.fillRect(cx - (nw - 8) / 2, y, nw - 8, cy);
          gfx.fillStyle(0x38bdf8, 1);
          gfx.fillRect(cx - nw / 2 - 2, ny > 0 ? tileSize - 4 : 0, nw + 4, 4);
        }

        // 2. Heavy Pump Center Tank
        gfx.fillStyle(0x0369a1, 1);
        gfx.fillCircle(cx, cy, 21);
        gfx.lineStyle(2, 0x38bdf8, 1);
        gfx.strokeCircle(cx, cy, 21);

        // 3. Glowing Flooz Chemical Core
        gfx.fillStyle(0x22c55e, 1); // Neon green
        gfx.fillCircle(cx, cy, 12);
        gfx.fillStyle(0x86efac, 1); // Bright core
        gfx.fillCircle(cx, cy, 6);

        // 4. Directional Outflow Arrow in nozzle
        gfx.fillStyle(0xffffff, 1);
        if (nx > 0) {
          gfx.fillTriangle(cx + 8, cy - 6, cx + 8, cy + 6, cx + 18, cy);
        } else if (nx < 0) {
          gfx.fillTriangle(cx - 8, cy - 6, cx - 8, cy + 6, cx - 18, cy);
        } else if (ny > 0) {
          gfx.fillTriangle(cx - 6, cy + 8, cx + 6, cy + 8, cx, cy + 18);
        } else {
          gfx.fillTriangle(cx - 6, cy - 8, cx + 6, cy - 8, cx, cy - 18);
        }

        // Valve metallic wheel rim
        gfx.lineStyle(1.5, 0x94a3b8, 1);
        gfx.strokeCircle(cx, cy, 17);
      });
    });

    if (!this.textures.exists('pipemania:start_valve')) {
      this.drawAndSaveTexture('pipemania:start_valve', tileSize, (gfx) => {
        gfx.fillStyle(0x0369a1, 1);
        gfx.fillCircle(tileSize / 2, tileSize / 2, 20);
        gfx.fillStyle(0x22c55e, 1);
        gfx.fillCircle(tileSize / 2, tileSize / 2, 10);
      });
    }
  }

  /**
   * Generates Directional End Drains for RIGHT, LEFT, UP, DOWN.
   * Features a circular amber drain tank and extended INTAKE PIPE NOZZLE matching START valve.
   */
  private createDirectionalEndDrains(tileSize: number): void {
    const directions = [
      { dir: 'right', nx: 1, ny: 0 }, // Water travels RIGHT -> enters from LEFT edge
      { dir: 'left', nx: -1, ny: 0 },  // Water travels LEFT -> enters from RIGHT edge
      { dir: 'up', nx: 0, ny: -1 },    // Water travels UP -> enters from BOTTOM edge
      { dir: 'down', nx: 0, ny: 1 },   // Water travels DOWN -> enters from TOP edge
    ];

    directions.forEach(({ dir, nx, ny }) => {
      const key = `pipemania:end_drain_${dir}`;
      this.drawAndSaveTexture(key, tileSize, (gfx) => {
        const cx = tileSize / 2;
        const cy = tileSize / 2;
        const nw = 28; // Matching pipeWidth

        // Dark tile base
        gfx.fillStyle(0x0a0f1d, 1);
        gfx.fillRect(0, 0, tileSize, tileSize);

        // Active Inflow Port location (where water enters from neighbor cell)
        const inSideX = -nx;
        const inSideY = -ny;

        // 1. Extended Intake Pipe Nozzle reaching the active border
        gfx.fillStyle(0xd97706, 1); // Amber bronze intake body
        if (inSideX !== 0) {
          const x = inSideX > 0 ? cx : 0;
          gfx.fillRect(x, cy - nw / 2, cx, nw);
          // Dark receiving mouth groove
          gfx.fillStyle(0x031d38, 1);
          gfx.fillRect(x, cy - (nw - 8) / 2, cx, nw - 8);
          // Golden flange collar on receiving edge
          gfx.fillStyle(0xf59e0b, 1);
          gfx.fillRect(inSideX > 0 ? tileSize - 4 : 0, cy - nw / 2 - 2, 4, nw + 4);
        } else {
          const y = inSideY > 0 ? cy : 0;
          gfx.fillRect(cx - nw / 2, y, nw, cy);
          gfx.fillStyle(0x031d38, 1);
          gfx.fillRect(cx - (nw - 8) / 2, y, nw - 8, cy);
          gfx.fillStyle(0xf59e0b, 1);
          gfx.fillRect(cx - nw / 2 - 2, inSideY > 0 ? tileSize - 4 : 0, nw + 4, 4);
        }

        // 2. Circular Center Drain Cyclone Tank (Matching START circular housing)
        gfx.fillStyle(0x78350f, 1);
        gfx.fillCircle(cx, cy, 22);
        gfx.lineStyle(2.5, 0xf59e0b, 1);
        gfx.strokeCircle(cx, cy, 22);

        // 3. Cyclone Suction Vortex Drain Rings in center
        gfx.fillStyle(0x451a03, 1);
        gfx.fillCircle(cx, cy, 16);
        gfx.lineStyle(1.5, 0xd97706, 0.9);
        gfx.strokeCircle(cx, cy, 16);

        gfx.fillStyle(0x0f172a, 1); // Deep black vortex center hole
        gfx.fillCircle(cx, cy, 9);
        gfx.lineStyle(1.5, 0xfef08a, 0.8);
        gfx.strokeCircle(cx, cy, 9);

        // 4. Directional Intake Arrow inside the nozzle pointing INTO the drain
        gfx.fillStyle(0xfde047, 1); // Bright glowing gold/yellow
        if (nx > 0) {
          // Water moving right into left intake
          gfx.fillTriangle(cx - 18, cy - 6, cx - 18, cy + 6, cx - 8, cy);
        } else if (nx < 0) {
          // Water moving left into right intake
          gfx.fillTriangle(cx + 18, cy - 6, cx + 18, cy + 6, cx + 8, cy);
        } else if (ny > 0) {
          // Water moving down into top intake
          gfx.fillTriangle(cx - 6, cy - 18, cx + 6, cy - 18, cx, cy - 8);
        } else {
          // Water moving up into bottom intake
          gfx.fillTriangle(cx - 6, cy + 18, cx + 6, cy + 18, cx, cy + 8);
        }

        // Metallic rivet details on drain housing
        gfx.fillStyle(0xfef08a, 1);
        gfx.fillCircle(cx - 14, cy - 14, 1.5);
        gfx.fillCircle(cx + 14, cy - 14, 1.5);
        gfx.fillCircle(cx - 14, cy + 14, 1.5);
        gfx.fillCircle(cx + 14, cy + 14, 1.5);
      });
    });

    if (!this.textures.exists('pipemania:end_drain')) {
      this.drawAndSaveTexture('pipemania:end_drain', tileSize, (gfx) => {
        gfx.fillStyle(0xd97706, 1);
        gfx.fillCircle(tileSize / 2, tileSize / 2, 22);
        gfx.fillStyle(0x0f172a, 1);
        gfx.fillCircle(tileSize / 2, tileSize / 2, 10);
      });
    }
  }

  /**
   * Procedurally generates all 13 Pipe Textures with rich vibrant colors,
   * 3D cylindrical volumetric lighting, polished brass coupling flanges,
   * smooth curved quarter-torus elbows, and high-visibility direction indicators.
   */
  private createHighClarityPipeTextures(tileSize: number, pipeWidth: number, offset: number): void {
    // 1. Horizontal Pipe (─)
    this.drawAndSaveTexture('pipemania:pipe_horizontal', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);

      // A. Ambient Floor Drop Shadow
      gfx.fillStyle(0x000000, 0.45);
      gfx.fillRect(0, offset + 3, tileSize, pipeWidth);

      // B. 3D Cylindrical Metallic Body Layers
      // 1. Lower Shadow Ridge
      gfx.fillStyle(0x082f49, 1);
      gfx.fillRect(0, offset + pipeWidth - 7, tileSize, 7);

      // 2. Midtone Metallic Body
      gfx.fillStyle(0x0284c7, 1);
      gfx.fillRect(0, offset + 4, tileSize, pipeWidth - 11);

      // 3. Upper Light Ridge
      gfx.fillStyle(0x38bdf8, 1);
      gfx.fillRect(0, offset, tileSize, 6);

      // 4. White Glossy Specular Highlight Line
      gfx.fillStyle(0xf0fdf4, 0.95);
      gfx.fillRect(0, offset + 2, tileSize, 2);

      // C. Recessed Fluid Lumen Channel
      gfx.fillStyle(0x031d38, 0.95);
      gfx.fillRect(0, offset + 7, tileSize, pipeWidth - 14);

      // Neon Flow Track Guide Rail
      gfx.fillStyle(0x38bdf8, 0.6);
      gfx.fillRect(0, tileSize / 2 - 1, tileSize, 2);
      gfx.fillStyle(0x86efac, 0.7);
      gfx.fillCircle(tileSize / 2, tileSize / 2, 2.5);

      // D. Outer Glowing Borders
      gfx.lineStyle(1.5, 0x0284c7, 0.9);
      gfx.strokeLineShape(new Phaser.Geom.Line(0, offset, tileSize, offset));
      gfx.lineStyle(1.5, 0x0369a1, 0.9);
      gfx.strokeLineShape(new Phaser.Geom.Line(0, offset + pipeWidth, tileSize, offset + pipeWidth));

      // E. Polished Brass / Gold Coupling Flanges on Left & Right
      this.drawFlange(gfx, 0, offset - 3, 5, pipeWidth + 6, 'vertical');
      this.drawFlange(gfx, tileSize - 5, offset - 3, 5, pipeWidth + 6, 'vertical');
    });

    // 2. Vertical Pipe (│)
    this.drawAndSaveTexture('pipemania:pipe_vertical', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);

      // A. Ambient Floor Drop Shadow
      gfx.fillStyle(0x000000, 0.45);
      gfx.fillRect(offset + 3, 0, pipeWidth, tileSize);

      // B. 3D Cylindrical Metallic Body Layers
      // 1. Right Shadow Ridge
      gfx.fillStyle(0x082f49, 1);
      gfx.fillRect(offset + pipeWidth - 7, 0, 7, tileSize);

      // 2. Midtone Metallic Body
      gfx.fillStyle(0x0284c7, 1);
      gfx.fillRect(offset + 4, 0, pipeWidth - 11, tileSize);

      // 3. Left Light Ridge
      gfx.fillStyle(0x38bdf8, 1);
      gfx.fillRect(offset, 0, 6, tileSize);

      // 4. White Glossy Specular Highlight Line
      gfx.fillStyle(0xf0fdf4, 0.95);
      gfx.fillRect(offset + 2, 0, 2, tileSize);

      // C. Recessed Fluid Lumen Channel
      gfx.fillStyle(0x031d38, 0.95);
      gfx.fillRect(offset + 7, 0, pipeWidth - 14, tileSize);

      // Neon Flow Track Guide Rail
      gfx.fillStyle(0x38bdf8, 0.6);
      gfx.fillRect(tileSize / 2 - 1, 0, 2, tileSize);
      gfx.fillStyle(0x86efac, 0.7);
      gfx.fillCircle(tileSize / 2, tileSize / 2, 2.5);

      // D. Outer Glowing Borders
      gfx.lineStyle(1.5, 0x0284c7, 0.9);
      gfx.strokeLineShape(new Phaser.Geom.Line(offset, 0, offset, tileSize));
      gfx.lineStyle(1.5, 0x0369a1, 0.9);
      gfx.strokeLineShape(new Phaser.Geom.Line(offset + pipeWidth, 0, offset + pipeWidth, tileSize));

      // E. Polished Brass / Gold Coupling Flanges on Top & Bottom
      this.drawFlange(gfx, offset - 3, 0, pipeWidth + 6, 5, 'horizontal');
      this.drawFlange(gfx, offset - 3, tileSize - 5, pipeWidth + 6, 5, 'horizontal');
    });

    // 3. Corner Top-Right (╝) (Connects TOP and RIGHT)
    this.drawAndSaveTexture('pipemania:pipe_corner_tr', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      this.drawSmoothCornerElbow(gfx, tileSize, pipeWidth, offset, 'TOP_RIGHT');
    });

    // 4. Corner Top-Left (╚) (Connects TOP and LEFT)
    this.drawAndSaveTexture('pipemania:pipe_corner_tl', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      this.drawSmoothCornerElbow(gfx, tileSize, pipeWidth, offset, 'TOP_LEFT');
    });

    // 5. Corner Bottom-Right (╗) (Connects BOTTOM and RIGHT)
    this.drawAndSaveTexture('pipemania:pipe_corner_br', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      this.drawSmoothCornerElbow(gfx, tileSize, pipeWidth, offset, 'BOTTOM_RIGHT');
    });

    // 6. Corner Bottom-Left (╔) (Connects BOTTOM and LEFT)
    this.drawAndSaveTexture('pipemania:pipe_corner_bl', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      this.drawSmoothCornerElbow(gfx, tileSize, pipeWidth, offset, 'BOTTOM_LEFT');
    });

    // 7. Cross Pipe (╬) (3D Overpass Bridge)
    this.drawAndSaveTexture('pipemania:pipe_cross', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);

      // A. Horizontal Underpass Pipe (Darker Metallic Depth)
      gfx.fillStyle(0x000000, 0.45);
      gfx.fillRect(0, offset + 3, tileSize, pipeWidth);

      gfx.fillStyle(0x0f2942, 1);
      gfx.fillRect(0, offset, tileSize, pipeWidth);
      gfx.fillStyle(0x021729, 1);
      gfx.fillRect(0, offset + 6, tileSize, pipeWidth - 12);
      gfx.fillStyle(0x0284c7, 0.4);
      gfx.fillRect(0, tileSize / 2 - 1, tileSize, 2);

      // Flanges on Left and Right
      this.drawFlange(gfx, 0, offset - 3, 5, pipeWidth + 6, 'vertical');
      this.drawFlange(gfx, tileSize - 5, offset - 3, 5, pipeWidth + 6, 'vertical');

      // B. Vertical Overpass Bridge with Drop Shadow on intersection
      gfx.fillStyle(0x000000, 0.6);
      gfx.fillRect(offset - 4, offset - 3, pipeWidth + 8, pipeWidth + 6);

      // Vertical 3D Cylinder Body
      gfx.fillStyle(0x082f49, 1);
      gfx.fillRect(offset + pipeWidth - 7, 0, 7, tileSize);
      gfx.fillStyle(0x0284c7, 1);
      gfx.fillRect(offset + 4, 0, pipeWidth - 11, tileSize);
      gfx.fillStyle(0x38bdf8, 1);
      gfx.fillRect(offset, 0, 6, tileSize);
      gfx.fillStyle(0xf0fdf4, 0.95);
      gfx.fillRect(offset + 2, 0, 2, tileSize);

      // Recessed lumen channel for vertical pipe
      gfx.fillStyle(0x031d38, 0.95);
      gfx.fillRect(offset + 7, 0, pipeWidth - 14, tileSize);
      gfx.fillStyle(0x38bdf8, 0.6);
      gfx.fillRect(tileSize / 2 - 1, 0, 2, tileSize);

      // Overpass reinforced bridge collar brackets
      gfx.fillStyle(0xd97706, 1);
      gfx.fillRect(offset - 3, offset - 3, pipeWidth + 6, 4);
      gfx.fillRect(offset - 3, offset + pipeWidth - 1, pipeWidth + 6, 4);
      gfx.fillStyle(0xfef08a, 1);
      gfx.fillRect(offset - 3, offset - 3, pipeWidth + 6, 1.5);
      gfx.fillRect(offset - 3, offset + pipeWidth - 1, pipeWidth + 6, 1.5);

      // Flanges on Top and Bottom
      this.drawFlange(gfx, offset - 3, 0, pipeWidth + 6, 5, 'horizontal');
      this.drawFlange(gfx, offset - 3, tileSize - 5, pipeWidth + 6, 5, 'horizontal');
    });

    // 8. One-Way Right (→)
    this.drawAndSaveTexture('pipemania:pipe_oneway_right', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);

      // 3D Horizontal Pipe Body
      this.drawStandardHorizontalBody(gfx, tileSize, pipeWidth, offset);

      // Glowing Neon-Green 3D Directional Chevrons >>>
      for (let i = 0; i < 3; i++) {
        const x = 14 + i * 16;
        gfx.fillStyle(0x15803d, 1); // Dark green shadow
        gfx.fillTriangle(x, offset + 6, x, offset + pipeWidth - 6, x + 9, tileSize / 2);
        gfx.fillStyle(0x22c55e, 1); // Bright neon green
        gfx.fillTriangle(x + 1, offset + 7, x + 1, offset + pipeWidth - 7, x + 8, tileSize / 2);
        gfx.fillStyle(0x86efac, 1); // Core tip highlight
        gfx.fillCircle(x + 6, tileSize / 2, 1.5);
      }
    });

    // 9. One-Way Left (←)
    this.drawAndSaveTexture('pipemania:pipe_oneway_left', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);

      // 3D Horizontal Pipe Body
      this.drawStandardHorizontalBody(gfx, tileSize, pipeWidth, offset);

      // Glowing Neon-Green 3D Directional Chevrons <<<
      for (let i = 0; i < 3; i++) {
        const x = tileSize - 14 - i * 16;
        gfx.fillStyle(0x15803d, 1);
        gfx.fillTriangle(x, offset + 6, x, offset + pipeWidth - 6, x - 9, tileSize / 2);
        gfx.fillStyle(0x22c55e, 1);
        gfx.fillTriangle(x - 1, offset + 7, x - 1, offset + pipeWidth - 7, x - 8, tileSize / 2);
        gfx.fillStyle(0x86efac, 1);
        gfx.fillCircle(x - 6, tileSize / 2, 1.5);
      }
    });

    // 10. One-Way Down (↓)
    this.drawAndSaveTexture('pipemania:pipe_oneway_down', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);

      // 3D Vertical Pipe Body
      this.drawStandardVerticalBody(gfx, tileSize, pipeWidth, offset);

      // Glowing Neon-Green 3D Directional Chevrons vvv
      for (let i = 0; i < 3; i++) {
        const y = 14 + i * 16;
        gfx.fillStyle(0x15803d, 1);
        gfx.fillTriangle(offset + 6, y, offset + pipeWidth - 6, y, tileSize / 2, y + 9);
        gfx.fillStyle(0x22c55e, 1);
        gfx.fillTriangle(offset + 7, y + 1, offset + pipeWidth - 7, y + 1, tileSize / 2, y + 8);
        gfx.fillStyle(0x86efac, 1);
        gfx.fillCircle(tileSize / 2, y + 6, 1.5);
      }
    });

    // 11. One-Way Up (↑)
    this.drawAndSaveTexture('pipemania:pipe_oneway_up', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);

      // 3D Vertical Pipe Body
      this.drawStandardVerticalBody(gfx, tileSize, pipeWidth, offset);

      // Glowing Neon-Green 3D Directional Chevrons ^^^
      for (let i = 0; i < 3; i++) {
        const y = tileSize - 14 - i * 16;
        gfx.fillStyle(0x15803d, 1);
        gfx.fillTriangle(offset + 6, y, offset + pipeWidth - 6, y, tileSize / 2, y - 9);
        gfx.fillStyle(0x22c55e, 1);
        gfx.fillTriangle(offset + 7, y - 1, offset + pipeWidth - 7, y - 1, tileSize / 2, y - 8);
        gfx.fillStyle(0x86efac, 1);
        gfx.fillCircle(tileSize / 2, y - 6, 1.5);
      }
    });

    // 12. Reservoir Tank Horizontal (Clean 3D Glass Chamber with Fluid Scale)
    this.drawAndSaveTexture('pipemania:pipe_reservoir_h', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);

      // 3D Horizontal Pipe Body
      this.drawStandardHorizontalBody(gfx, tileSize, pipeWidth, offset);

      // 3D Translucent Blue Glass Expansion Tank (width: 44, height: 42)
      const tw = 44;
      const th = 42;
      const tx = (tileSize - tw) / 2;
      const ty = (tileSize - th) / 2;

      // Tank Drop Shadow
      gfx.fillStyle(0x000000, 0.5);
      gfx.fillRoundedRect(tx + 2, ty + 3, tw, th, 10);

      // Glass Tank Outer Vessel
      gfx.fillStyle(0x03254c, 0.95);
      gfx.fillRoundedRect(tx, ty, tw, th, 10);
      gfx.lineStyle(2, 0x38bdf8, 1);
      gfx.strokeRoundedRect(tx, ty, tw, th, 10);

      // Glass Specular Curved Highlights
      gfx.fillStyle(0xe0f2fe, 0.75);
      gfx.fillRoundedRect(tx + 4, ty + 4, tw - 8, 4, 2);

      // Golden Mounting Collar Rings
      gfx.fillStyle(0xd97706, 1);
      gfx.fillRect(tx + 2, ty, 3, th);
      gfx.fillRect(tx + tw - 5, ty, 3, th);
      gfx.fillStyle(0xfde047, 1);
      gfx.fillRect(tx + 2, ty, 1.5, th);
      gfx.fillRect(tx + tw - 5, ty, 1.5, th);

      // Bidirectional Fluid Conduit Center Track
      gfx.fillStyle(0x38bdf8, 0.8);
      gfx.fillRect(tx + 6, tileSize / 2 - 1, tw - 12, 2);

      // Vertical Fluid Measurement Graduation Ticks
      gfx.fillStyle(0x67e8f9, 0.9);
      gfx.fillRect(tx + 12, ty + 11, 2, 7);
      gfx.fillRect(tx + 18, ty + 9, 2, 9);
      gfx.fillRect(tx + 24, ty + 11, 2, 7);
      gfx.fillRect(tx + 30, ty + 9, 2, 9);
      gfx.fillRect(tx + 12, ty + th - 18, 2, 7);
      gfx.fillRect(tx + 18, ty + th - 18, 2, 9);
      gfx.fillRect(tx + 24, ty + th - 18, 2, 7);
      gfx.fillRect(tx + 30, ty + th - 18, 2, 9);
    });

    // 13. Reservoir Tank Vertical (Clean 3D Glass Chamber with Fluid Scale)
    this.drawAndSaveTexture('pipemania:pipe_reservoir_v', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);

      // 3D Vertical Pipe Body
      this.drawStandardVerticalBody(gfx, tileSize, pipeWidth, offset);

      // 3D Translucent Blue Glass Expansion Tank (width: 42, height: 44)
      const tw = 42;
      const th = 44;
      const tx = (tileSize - tw) / 2;
      const ty = (tileSize - th) / 2;

      // Tank Drop Shadow
      gfx.fillStyle(0x000000, 0.5);
      gfx.fillRoundedRect(tx + 2, ty + 3, tw, th, 10);

      // Glass Tank Outer Vessel
      gfx.fillStyle(0x03254c, 0.95);
      gfx.fillRoundedRect(tx, ty, tw, th, 10);
      gfx.lineStyle(2, 0x38bdf8, 1);
      gfx.strokeRoundedRect(tx, ty, tw, th, 10);

      // Glass Specular Curved Highlights
      gfx.fillStyle(0xe0f2fe, 0.75);
      gfx.fillRoundedRect(tx + 4, ty + 4, 4, th - 8, 2);

      // Golden Mounting Collar Rings
      gfx.fillStyle(0xd97706, 1);
      gfx.fillRect(tx, ty + 2, tw, 3);
      gfx.fillRect(tx, ty + th - 5, tw, 3);
      gfx.fillStyle(0xfde047, 1);
      gfx.fillRect(tx, ty + 2, tw, 1.5);
      gfx.fillRect(tx, ty + th - 5, tw, 1.5);

      // Bidirectional Fluid Conduit Center Track
      gfx.fillStyle(0x38bdf8, 0.8);
      gfx.fillRect(tileSize / 2 - 1, ty + 6, 2, th - 12);

      // Horizontal Fluid Measurement Graduation Ticks
      gfx.fillStyle(0x67e8f9, 0.9);
      gfx.fillRect(tx + 11, ty + 12, 7, 2);
      gfx.fillRect(tx + 9, ty + 18, 9, 2);
      gfx.fillRect(tx + 11, ty + 24, 7, 2);
      gfx.fillRect(tx + 9, ty + 30, 9, 2);
      gfx.fillRect(tx + tw - 18, ty + 12, 7, 2);
      gfx.fillRect(tx + tw - 18, ty + 18, 9, 2);
      gfx.fillRect(tx + tw - 18, ty + 24, 7, 2);
      gfx.fillRect(tx + tw - 18, ty + 30, 9, 2);
    });
  }

  private drawStandardHorizontalBody(
    gfx: Phaser.GameObjects.Graphics,
    tileSize: number,
    pipeWidth: number,
    offset: number
  ): void {
    // Drop shadow
    gfx.fillStyle(0x000000, 0.45);
    gfx.fillRect(0, offset + 3, tileSize, pipeWidth);

    // 3D Cylinder Layers
    gfx.fillStyle(0x082f49, 1);
    gfx.fillRect(0, offset + pipeWidth - 7, tileSize, 7);
    gfx.fillStyle(0x0284c7, 1);
    gfx.fillRect(0, offset + 4, tileSize, pipeWidth - 11);
    gfx.fillStyle(0x38bdf8, 1);
    gfx.fillRect(0, offset, tileSize, 6);
    gfx.fillStyle(0xf0fdf4, 0.95);
    gfx.fillRect(0, offset + 2, tileSize, 2);

    // Recessed lumen channel
    gfx.fillStyle(0x031d38, 0.95);
    gfx.fillRect(0, offset + 7, tileSize, pipeWidth - 14);

    // Flanges
    this.drawFlange(gfx, 0, offset - 3, 5, pipeWidth + 6, 'vertical');
    this.drawFlange(gfx, tileSize - 5, offset - 3, 5, pipeWidth + 6, 'vertical');
  }

  private drawStandardVerticalBody(
    gfx: Phaser.GameObjects.Graphics,
    tileSize: number,
    pipeWidth: number,
    offset: number
  ): void {
    // Drop shadow
    gfx.fillStyle(0x000000, 0.45);
    gfx.fillRect(offset + 3, 0, pipeWidth, tileSize);

    // 3D Cylinder Layers
    gfx.fillStyle(0x082f49, 1);
    gfx.fillRect(offset + pipeWidth - 7, 0, 7, tileSize);
    gfx.fillStyle(0x0284c7, 1);
    gfx.fillRect(offset + 4, 0, pipeWidth - 11, tileSize);
    gfx.fillStyle(0x38bdf8, 1);
    gfx.fillRect(offset, 0, 6, tileSize);
    gfx.fillStyle(0xf0fdf4, 0.95);
    gfx.fillRect(offset + 2, 0, 2, tileSize);

    // Recessed lumen channel
    gfx.fillStyle(0x031d38, 0.95);
    gfx.fillRect(offset + 7, 0, pipeWidth - 14, tileSize);

    // Flanges
    this.drawFlange(gfx, offset - 3, 0, pipeWidth + 6, 5, 'horizontal');
    this.drawFlange(gfx, offset - 3, tileSize - 5, pipeWidth + 6, 5, 'horizontal');
  }

  private drawFlange(
    gfx: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    orientation: 'vertical' | 'horizontal'
  ): void {
    // 3D Golden Brass Flange Collar
    gfx.fillStyle(0xb45309, 1); // Dark amber border/shadow
    gfx.fillRect(x, y, w, h);

    gfx.fillStyle(0xf59e0b, 1); // Polished brass face
    if (orientation === 'vertical') {
      gfx.fillRect(x + 1, y + 1, w - 2, h - 2);
      // Gold specular sheen on top edge
      gfx.fillStyle(0xfef08a, 1);
      gfx.fillRect(x + 1, y + 1, w - 2, 3);
      // Fastener rivets
      gfx.fillStyle(0x78350f, 1);
      gfx.fillRect(x + 1.5, y + 4, 2, 2);
      gfx.fillRect(x + 1.5, y + h - 6, 2, 2);
    } else {
      gfx.fillRect(x + 1, y + 1, w - 2, h - 2);
      // Gold specular sheen on left edge
      gfx.fillStyle(0xfef08a, 1);
      gfx.fillRect(x + 1, y + 1, 3, h - 2);
      // Fastener rivets
      gfx.fillStyle(0x78350f, 1);
      gfx.fillRect(x + 4, y + 1.5, 2, 2);
      gfx.fillRect(x + w - 6, y + 1.5, 2, 2);
    }
  }

  private drawGridBackground(gfx: Phaser.GameObjects.Graphics, size: number): void {
    gfx.fillStyle(0x0a0f1d, 1);
    gfx.fillRect(0, 0, size, size);
  }

  /**
   * Draws a gorgeous smooth 3D rounded elbow pipe connecting two orthogonal ports.
   */
  private drawSmoothCornerElbow(
    gfx: Phaser.GameObjects.Graphics,
    size: number,
    pipeWidth: number,
    offset: number,
    cornerType: 'TOP_RIGHT' | 'TOP_LEFT' | 'BOTTOM_RIGHT' | 'BOTTOM_LEFT'
  ): void {
    // Geometric Center and Arc Angles for all 4 Corner Elbows
    let cx = 0;
    let cy = 0;
    let startAngle = 0;
    let endAngle = Math.PI / 2;

    if (cornerType === 'TOP_RIGHT') {
      cx = size;
      cy = 0;
      startAngle = Math.PI / 2; // 90 deg (Right port)
      endAngle = Math.PI; // 180 deg (Top port)
    } else if (cornerType === 'TOP_LEFT') {
      cx = 0;
      cy = 0;
      startAngle = 0; // 0 deg (Top port)
      endAngle = Math.PI / 2; // 90 deg (Left port)
    } else if (cornerType === 'BOTTOM_RIGHT') {
      cx = size;
      cy = size;
      startAngle = Math.PI; // 180 deg (Bottom port)
      endAngle = Math.PI * 1.5; // 270 deg (Right port)
    } else if (cornerType === 'BOTTOM_LEFT') {
      cx = 0;
      cy = size;
      startAngle = Math.PI * 1.5; // 270 deg (Left port)
      endAngle = Math.PI * 2.0; // 360 deg / 0 deg (Bottom port)
    }

    const R_outer = size - offset;
    const R_inner = offset;
    const R_mid = (R_outer + R_inner) / 2;

    // A. Ambient Floor Drop Shadow Arc
    gfx.fillStyle(0x000000, 0.45);
    gfx.beginPath();
    gfx.arc(cx, cy, R_outer + 3, startAngle, endAngle, false);
    gfx.arc(cx, cy, Math.max(1, R_inner - 2), endAngle, startAngle, true);
    gfx.closePath();
    gfx.fillPath();

    // B. 3D Concentric Torus Layers
    // 1. Outer Torus Shadow Ring
    gfx.fillStyle(0x082f49, 1);
    gfx.beginPath();
    gfx.arc(cx, cy, R_outer, startAngle, endAngle, false);
    gfx.arc(cx, cy, R_inner, endAngle, startAngle, true);
    gfx.closePath();
    gfx.fillPath();

    // 2. Vibrant Midtone Cylinder Body
    gfx.fillStyle(0x0284c7, 1);
    gfx.beginPath();
    gfx.arc(cx, cy, R_outer - 2, startAngle, endAngle, false);
    gfx.arc(cx, cy, R_inner + 2, endAngle, startAngle, true);
    gfx.closePath();
    gfx.fillPath();

    // 3. Highlight Bevel Ridge
    gfx.lineStyle(3, 0x38bdf8, 1);
    gfx.beginPath();
    gfx.arc(cx, cy, R_outer - 3, startAngle, endAngle, false);
    gfx.strokePath();

    // 4. White Specular Gloss Streak
    gfx.lineStyle(1.5, 0xf0fdf4, 0.9);
    gfx.beginPath();
    gfx.arc(cx, cy, R_outer - 4.5, startAngle, endAngle, false);
    gfx.strokePath();

    // C. Recessed Lumen Channel
    const R_ch_outer = R_mid + (pipeWidth - 14) / 2;
    const R_ch_inner = R_mid - (pipeWidth - 14) / 2;
    gfx.fillStyle(0x031d38, 0.95);
    gfx.beginPath();
    gfx.arc(cx, cy, R_ch_outer, startAngle, endAngle, false);
    gfx.arc(cx, cy, R_ch_inner, endAngle, startAngle, true);
    gfx.closePath();
    gfx.fillPath();

    // Neon Center Flow Guide Arc
    gfx.lineStyle(2, 0x38bdf8, 0.6);
    gfx.beginPath();
    gfx.arc(cx, cy, R_mid, startAngle, endAngle, false);
    gfx.strokePath();

    // Outer & Inner Glowing Edges
    gfx.lineStyle(1.5, 0x0284c7, 0.9);
    gfx.beginPath();
    gfx.arc(cx, cy, R_outer, startAngle, endAngle, false);
    gfx.strokePath();
    gfx.beginPath();
    gfx.arc(cx, cy, R_inner, startAngle, endAngle, false);
    gfx.strokePath();

    // D. 3D Polished Brass Flanges at Both Open Ports
    if (cornerType === 'TOP_RIGHT') {
      this.drawFlange(gfx, offset - 3, 0, pipeWidth + 6, 5, 'horizontal');
      this.drawFlange(gfx, size - 5, offset - 3, 5, pipeWidth + 6, 'vertical');
    } else if (cornerType === 'TOP_LEFT') {
      this.drawFlange(gfx, offset - 3, 0, pipeWidth + 6, 5, 'horizontal');
      this.drawFlange(gfx, 0, offset - 3, 5, pipeWidth + 6, 'vertical');
    } else if (cornerType === 'BOTTOM_RIGHT') {
      this.drawFlange(gfx, offset - 3, size - 5, pipeWidth + 6, 5, 'horizontal');
      this.drawFlange(gfx, size - 5, offset - 3, 5, pipeWidth + 6, 'vertical');
    } else if (cornerType === 'BOTTOM_LEFT') {
      this.drawFlange(gfx, offset - 3, size - 5, pipeWidth + 6, 5, 'horizontal');
      this.drawFlange(gfx, 0, offset - 3, 5, pipeWidth + 6, 'vertical');
    }
  }

  private drawAndSaveTexture(key: string, size: number, drawFn: (gfx: Phaser.GameObjects.Graphics) => void): void {
    if (!this.textures.exists(key)) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      drawFn(gfx);
      gfx.generateTexture(key, size, size);
      gfx.destroy();
    }
  }
}
