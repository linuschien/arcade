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
    const TILE_SIZE = 56;
    const PIPE_WIDTH = 26;
    const PIPE_OFFSET = (TILE_SIZE - PIPE_WIDTH) / 2; // 15

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

    // 2. Obstacle Barrier (Hazard Steel Block with Warning Stripes)
    if (!this.textures.exists('pipemania:obstacle_rock')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Steel base plate
      gfx.fillStyle(0x1e293b, 1);
      gfx.fillRoundedRect(3, 3, TILE_SIZE - 6, TILE_SIZE - 6, 6);
      gfx.lineStyle(2, 0x475569, 1);
      gfx.strokeRoundedRect(3, 3, TILE_SIZE - 6, TILE_SIZE - 6, 6);

      // Hazard Warning Stripes
      gfx.fillStyle(0xd97706, 0.9); // Amber hazard
      gfx.fillRect(8, 8, TILE_SIZE - 16, TILE_SIZE - 16);

      gfx.fillStyle(0x0f172a, 0.9);
      for (let i = 0; i < 4; i++) {
        gfx.fillTriangle(
          12 + i * 8, 8,
          18 + i * 8, 8,
          8, 12 + i * 8
        );
        gfx.fillTriangle(
          8, 18 + i * 8,
          18 + i * 8, 8,
          12 + i * 8, 8
        );
      }

      // Center lock icon
      gfx.fillStyle(0xef4444, 1); // Red danger LED
      gfx.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, 5);
      gfx.fillStyle(0xffffff, 0.8);
      gfx.fillCircle(TILE_SIZE / 2 - 1, TILE_SIZE / 2 - 1, 2);

      gfx.generateTexture('pipemania:obstacle_rock', TILE_SIZE, TILE_SIZE);
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
      gfx.fillRect(1, 1, 12, 4);
      gfx.fillRect(1, 1, 4, 12);
      gfx.fillRect(TILE_SIZE - 13, 1, 12, 4);
      gfx.fillRect(TILE_SIZE - 5, 1, 4, 12);
      gfx.fillRect(1, TILE_SIZE - 5, 12, 4);
      gfx.fillRect(1, TILE_SIZE - 13, 4, 12);
      gfx.fillRect(TILE_SIZE - 13, TILE_SIZE - 5, 12, 4);
      gfx.fillRect(TILE_SIZE - 5, TILE_SIZE - 13, 4, 12);

      gfx.generateTexture('pipemania:reticle', TILE_SIZE, TILE_SIZE);
      gfx.destroy();
    }

    // 6. Wrench (Life Icon)
    if (!this.textures.exists('pipemania:wrench')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Chrome handle
      gfx.fillStyle(0x94a3b8, 1);
      gfx.fillRect(10, 8, 4, 14);
      gfx.fillStyle(0x38bdf8, 1);
      gfx.fillRect(11, 10, 2, 10);
      // Wrench jaw head
      gfx.fillStyle(0xe2e8f0, 1);
      gfx.fillCircle(12, 6, 6);
      gfx.fillStyle(0x090d16, 1);
      gfx.fillRect(11, 1, 2, 7);
      gfx.generateTexture('pipemania:wrench', 24, 24);
      gfx.destroy();
    }

    // 7. Preset Gold Bolt
    if (!this.textures.exists('pipemania:preset_bolt')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xf59e0b, 1);
      gfx.fillCircle(4, 4, 3.5);
      gfx.fillStyle(0xfef08a, 1);
      gfx.fillCircle(3, 3, 1.5);
      gfx.lineStyle(1, 0x78350f, 1);
      gfx.strokeCircle(4, 4, 3.5);
      gfx.generateTexture('pipemania:preset_bolt', 8, 8);
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
   * Clearly shows solid vault on 3 sides and an INTAKE FUNNEL MOUTH on the entry port.
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
        const nw = 26;

        // Dark tile base
        gfx.fillStyle(0x0a0f1d, 1);
        gfx.fillRect(0, 0, tileSize, tileSize);

        // Active Inflow Port location (where water enters from neighbor cell)
        const inSideX = -nx;
        const inSideY = -ny;

        // 1. Inflow Receiving Intake Collar
        gfx.fillStyle(0xd97706, 1); // Amber receptor
        if (inSideX !== 0) {
          const x = inSideX > 0 ? cx : 0;
          gfx.fillRect(x, cy - nw / 2, cx, nw);
          // Dark receiving mouth groove
          gfx.fillStyle(0x0f172a, 1);
          gfx.fillRect(x, cy - (nw - 8) / 2, cx, nw - 8);
          // Golden flange on receiving edge
          gfx.fillStyle(0xf59e0b, 1);
          gfx.fillRect(inSideX > 0 ? tileSize - 4 : 0, cy - nw / 2 - 2, 4, nw + 4);
        } else {
          const y = inSideY > 0 ? cy : 0;
          gfx.fillRect(cx - nw / 2, y, nw, cy);
          gfx.fillStyle(0x0f172a, 1);
          gfx.fillRect(cx - (nw - 8) / 2, y, nw - 8, cy);
          gfx.fillStyle(0xf59e0b, 1);
          gfx.fillRect(cx - nw / 2 - 2, inSideY > 0 ? tileSize - 4 : 0, nw + 4, 4);
        }

        // 2. Heavy Square Drain Housing on non-active edges
        gfx.fillStyle(0x451a03, 1); // Dark amber vault
        gfx.fillRoundedRect(5, 5, tileSize - 10, tileSize - 10, 8);
        gfx.lineStyle(2, 0xf59e0b, 1);
        gfx.strokeRoundedRect(5, 5, tileSize - 10, tileSize - 10, 8);

        // 3. Cyclone Suction Vortex Drain in center
        gfx.fillStyle(0x0f172a, 1);
        gfx.fillCircle(cx, cy, 16);
        gfx.lineStyle(2, 0xd97706, 1);
        gfx.strokeCircle(cx, cy, 16);
        gfx.lineStyle(1.5, 0xf59e0b, 0.8);
        gfx.strokeCircle(cx, cy, 10);
        gfx.fillStyle(0x78350f, 1);
        gfx.fillCircle(cx, cy, 5);

        // 4. Large Bold Intake Arrow pointing INTO the central drain vortex
        gfx.fillStyle(0xfde047, 1); // Bright glowing gold/yellow
        if (nx > 0) {
          // Flow moving right into left intake
          gfx.fillTriangle(cx - 15, cy - 6, cx - 15, cy + 6, cx - 5, cy);
        } else if (nx < 0) {
          // Flow moving left into right intake
          gfx.fillTriangle(cx + 15, cy - 6, cx + 15, cy + 6, cx + 5, cy);
        } else if (ny > 0) {
          // Flow moving down into top intake
          gfx.fillTriangle(cx - 6, cy - 15, cx + 6, cy - 15, cx, cy - 5);
        } else {
          // Flow moving up into bottom intake
          gfx.fillTriangle(cx - 6, cy + 15, cx + 6, cy + 15, cx, cy + 5);
        }
      });
    });

    if (!this.textures.exists('pipemania:end_drain')) {
      this.drawAndSaveTexture('pipemania:end_drain', tileSize, (gfx) => {
        gfx.fillStyle(0xd97706, 1);
        gfx.fillRoundedRect(6, 6, tileSize - 12, tileSize - 12, 10);
        gfx.fillStyle(0x0f172a, 1);
        gfx.fillCircle(tileSize / 2, tileSize / 2, 12);
      });
    }
  }

  /**
   * Procedurally generates all 13 Pipe Textures with 3D cylindrical shading,
   * smooth curved quarter-torus elbows, and high-visibility direction indicators.
   */
  private createHighClarityPipeTextures(tileSize: number, pipeWidth: number, offset: number): void {
    const BODY_COLOR = 0x243048; // Sleek metallic titanium
    const BORDER_CYAN = 0x38bdf8; // Glowing cyan edge
    const INNER_DARK = 0x090d16; // Deep fluid channel
    const FLANGE_COLOR = 0x64748b; // Metallic pipe flange collars

    // 1. Horizontal Pipe (─)
    this.drawAndSaveTexture('pipemania:pipe_horizontal', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      // Outer pipe body
      gfx.fillStyle(BODY_COLOR, 1);
      gfx.fillRect(0, offset, tileSize, pipeWidth);
      // Inner fluid lumen groove
      gfx.fillStyle(INNER_DARK, 1);
      gfx.fillRect(0, offset + 4, tileSize, pipeWidth - 8);
      // Specular highlight line along top
      gfx.fillStyle(0x94a3b8, 0.8);
      gfx.fillRect(0, offset + 1, tileSize, 2);
      // Center flow track line
      gfx.fillStyle(BORDER_CYAN, 0.4);
      gfx.fillRect(0, tileSize / 2 - 1, tileSize, 2);
      // Border strokes
      gfx.lineStyle(1.5, BORDER_CYAN, 0.9);
      gfx.strokeLineShape(new Phaser.Geom.Line(0, offset, tileSize, offset));
      gfx.strokeLineShape(new Phaser.Geom.Line(0, offset + pipeWidth, tileSize, offset + pipeWidth));
      // End flanges
      gfx.fillStyle(FLANGE_COLOR, 1);
      gfx.fillRect(0, offset - 2, 4, pipeWidth + 4);
      gfx.fillRect(tileSize - 4, offset - 2, 4, pipeWidth + 4);
    });

    // 2. Vertical Pipe (│)
    this.drawAndSaveTexture('pipemania:pipe_vertical', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      gfx.fillStyle(BODY_COLOR, 1);
      gfx.fillRect(offset, 0, pipeWidth, tileSize);
      gfx.fillStyle(INNER_DARK, 1);
      gfx.fillRect(offset + 4, 0, pipeWidth - 8, tileSize);
      gfx.fillStyle(0x94a3b8, 0.8);
      gfx.fillRect(offset + 1, 0, 2, tileSize);
      gfx.fillStyle(BORDER_CYAN, 0.4);
      gfx.fillRect(tileSize / 2 - 1, 0, 2, tileSize);
      gfx.lineStyle(1.5, BORDER_CYAN, 0.9);
      gfx.strokeLineShape(new Phaser.Geom.Line(offset, 0, offset, tileSize));
      gfx.strokeLineShape(new Phaser.Geom.Line(offset + pipeWidth, 0, offset + pipeWidth, tileSize));
      gfx.fillStyle(FLANGE_COLOR, 1);
      gfx.fillRect(offset - 2, 0, pipeWidth + 4, 4);
      gfx.fillRect(offset - 2, tileSize - 4, pipeWidth + 4, 4);
    });

    // 3. Corner Top-Right (╝) (Connects TOP and RIGHT with a smooth rounded elbow)
    this.drawAndSaveTexture('pipemania:pipe_corner_tr', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      this.drawSmoothCornerElbow(gfx, tileSize, pipeWidth, offset, 'TOP_RIGHT');
    });

    // 4. Corner Top-Left (╚) (Connects TOP and LEFT with a smooth rounded elbow)
    this.drawAndSaveTexture('pipemania:pipe_corner_tl', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      this.drawSmoothCornerElbow(gfx, tileSize, pipeWidth, offset, 'TOP_LEFT');
    });

    // 5. Corner Bottom-Right (╗) (Connects BOTTOM and RIGHT with a smooth rounded elbow)
    this.drawAndSaveTexture('pipemania:pipe_corner_br', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      this.drawSmoothCornerElbow(gfx, tileSize, pipeWidth, offset, 'BOTTOM_RIGHT');
    });

    // 6. Corner Bottom-Left (╔) (Connects BOTTOM and LEFT with a smooth rounded elbow)
    this.drawAndSaveTexture('pipemania:pipe_corner_bl', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      this.drawSmoothCornerElbow(gfx, tileSize, pipeWidth, offset, 'BOTTOM_LEFT');
    });

    // 7. Cross Pipe (╬) (3D Overpass Bridge)
    this.drawAndSaveTexture('pipemania:pipe_cross', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      // Horizontal underpass
      gfx.fillStyle(0x1a2333, 1);
      gfx.fillRect(0, offset, tileSize, pipeWidth);
      gfx.fillStyle(INNER_DARK, 1);
      gfx.fillRect(0, offset + 4, tileSize, pipeWidth - 8);
      // Vertical overpass
      gfx.fillStyle(BODY_COLOR, 1);
      gfx.fillRect(offset, 0, pipeWidth, tileSize);
      gfx.fillStyle(INNER_DARK, 1);
      gfx.fillRect(offset + 4, 0, pipeWidth - 8, tileSize);
      // Overpass bridge borders
      gfx.lineStyle(2, BORDER_CYAN, 1);
      gfx.strokeLineShape(new Phaser.Geom.Line(offset, 0, offset, tileSize));
      gfx.strokeLineShape(new Phaser.Geom.Line(offset + pipeWidth, 0, offset + pipeWidth, tileSize));
      // Overpass center bridge band
      gfx.fillStyle(0x0284c7, 0.9);
      gfx.fillRect(offset - 2, offset - 2, pipeWidth + 4, 4);
      gfx.fillRect(offset - 2, offset + pipeWidth - 2, pipeWidth + 4, 4);
      // Flanges
      gfx.fillStyle(FLANGE_COLOR, 1);
      gfx.fillRect(0, offset - 2, 4, pipeWidth + 4);
      gfx.fillRect(tileSize - 4, offset - 2, 4, pipeWidth + 4);
      gfx.fillRect(offset - 2, 0, pipeWidth + 4, 4);
      gfx.fillRect(offset - 2, tileSize - 4, pipeWidth + 4, 4);
    });

    // 8. One-Way Right (→)
    this.drawAndSaveTexture('pipemania:pipe_oneway_right', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      gfx.fillStyle(BODY_COLOR, 1);
      gfx.fillRect(0, offset, tileSize, pipeWidth);
      gfx.fillStyle(INNER_DARK, 1);
      gfx.fillRect(0, offset + 4, tileSize, pipeWidth - 8);
      gfx.lineStyle(1.5, BORDER_CYAN, 0.9);
      gfx.strokeLineShape(new Phaser.Geom.Line(0, offset, tileSize, offset));
      gfx.strokeLineShape(new Phaser.Geom.Line(0, offset + pipeWidth, tileSize, offset + pipeWidth));
      // Neon Green Directional Chevrons >>>
      gfx.fillStyle(0x22c55e, 1);
      for (let i = 0; i < 3; i++) {
        const x = 12 + i * 14;
        gfx.fillTriangle(x, offset + 6, x, offset + pipeWidth - 6, x + 8, tileSize / 2);
      }
      gfx.fillStyle(FLANGE_COLOR, 1);
      gfx.fillRect(0, offset - 2, 4, pipeWidth + 4);
      gfx.fillRect(tileSize - 4, offset - 2, 4, pipeWidth + 4);
    });

    // 9. One-Way Left (←)
    this.drawAndSaveTexture('pipemania:pipe_oneway_left', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      gfx.fillStyle(BODY_COLOR, 1);
      gfx.fillRect(0, offset, tileSize, pipeWidth);
      gfx.fillStyle(INNER_DARK, 1);
      gfx.fillRect(0, offset + 4, tileSize, pipeWidth - 8);
      gfx.lineStyle(1.5, BORDER_CYAN, 0.9);
      gfx.strokeLineShape(new Phaser.Geom.Line(0, offset, tileSize, offset));
      gfx.strokeLineShape(new Phaser.Geom.Line(0, offset + pipeWidth, tileSize, offset + pipeWidth));
      // Neon Green Directional Chevrons <<<
      gfx.fillStyle(0x22c55e, 1);
      for (let i = 0; i < 3; i++) {
        const x = tileSize - 12 - i * 14;
        gfx.fillTriangle(x, offset + 6, x, offset + pipeWidth - 6, x - 8, tileSize / 2);
      }
      gfx.fillStyle(FLANGE_COLOR, 1);
      gfx.fillRect(0, offset - 2, 4, pipeWidth + 4);
      gfx.fillRect(tileSize - 4, offset - 2, 4, pipeWidth + 4);
    });

    // 10. One-Way Down (↓)
    this.drawAndSaveTexture('pipemania:pipe_oneway_down', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      gfx.fillStyle(BODY_COLOR, 1);
      gfx.fillRect(offset, 0, pipeWidth, tileSize);
      gfx.fillStyle(INNER_DARK, 1);
      gfx.fillRect(offset + 4, 0, pipeWidth - 8, tileSize);
      gfx.lineStyle(1.5, BORDER_CYAN, 0.9);
      gfx.strokeLineShape(new Phaser.Geom.Line(offset, 0, offset, tileSize));
      gfx.strokeLineShape(new Phaser.Geom.Line(offset + pipeWidth, 0, offset + pipeWidth, tileSize));
      // Neon Green Directional Chevrons vvv
      gfx.fillStyle(0x22c55e, 1);
      for (let i = 0; i < 3; i++) {
        const y = 12 + i * 14;
        gfx.fillTriangle(offset + 6, y, offset + pipeWidth - 6, y, tileSize / 2, y + 8);
      }
      gfx.fillStyle(FLANGE_COLOR, 1);
      gfx.fillRect(offset - 2, 0, pipeWidth + 4, 4);
      gfx.fillRect(offset - 2, tileSize - 4, pipeWidth + 4, 4);
    });

    // 11. One-Way Up (↑)
    this.drawAndSaveTexture('pipemania:pipe_oneway_up', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      gfx.fillStyle(BODY_COLOR, 1);
      gfx.fillRect(offset, 0, pipeWidth, tileSize);
      gfx.fillStyle(INNER_DARK, 1);
      gfx.fillRect(offset + 4, 0, pipeWidth - 8, tileSize);
      gfx.lineStyle(1.5, BORDER_CYAN, 0.9);
      gfx.strokeLineShape(new Phaser.Geom.Line(offset, 0, offset, tileSize));
      gfx.strokeLineShape(new Phaser.Geom.Line(offset + pipeWidth, 0, offset + pipeWidth, tileSize));
      // Neon Green Directional Chevrons ^^^
      gfx.fillStyle(0x22c55e, 1);
      for (let i = 0; i < 3; i++) {
        const y = tileSize - 12 - i * 14;
        gfx.fillTriangle(offset + 6, y, offset + pipeWidth - 6, y, tileSize / 2, y - 8);
      }
      gfx.fillStyle(FLANGE_COLOR, 1);
      gfx.fillRect(offset - 2, 0, pipeWidth + 4, 4);
      gfx.fillRect(offset - 2, tileSize - 4, pipeWidth + 4, 4);
    });

    // 12. Reservoir Tank Horizontal
    this.drawAndSaveTexture('pipemania:pipe_reservoir_h', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      // Inflow/outflow horizontal stub
      gfx.fillStyle(BODY_COLOR, 1);
      gfx.fillRect(0, offset + 3, tileSize, pipeWidth - 6);
      // Large glass chamber tank
      gfx.fillStyle(0x172554, 1); // Dark blue vacuum
      gfx.fillRoundedRect(6, 6, tileSize - 12, tileSize - 12, 10);
      gfx.lineStyle(2, 0x38bdf8, 1);
      gfx.strokeRoundedRect(6, 6, tileSize - 12, tileSize - 12, 10);
      // Tank level gauge lines
      gfx.fillStyle(0x60a5fa, 0.7);
      gfx.fillRect(10, 16, 8, 2);
      gfx.fillRect(10, 26, 12, 2);
      gfx.fillRect(10, 36, 8, 2);
      // 4X Slow Indicator Badge
      gfx.fillStyle(0x38bdf8, 1);
      gfx.fillCircle(tileSize - 14, 14, 6);
    });

    // 13. Reservoir Tank Vertical
    this.drawAndSaveTexture('pipemania:pipe_reservoir_v', tileSize, (gfx) => {
      this.drawGridBackground(gfx, tileSize);
      gfx.fillStyle(BODY_COLOR, 1);
      gfx.fillRect(offset + 3, 0, pipeWidth - 6, tileSize);
      gfx.fillStyle(0x172554, 1);
      gfx.fillRoundedRect(6, 6, tileSize - 12, tileSize - 12, 10);
      gfx.lineStyle(2, 0x38bdf8, 1);
      gfx.strokeRoundedRect(6, 6, tileSize - 12, tileSize - 12, 10);
      gfx.fillStyle(0x60a5fa, 0.7);
      gfx.fillRect(16, 10, 2, 8);
      gfx.fillRect(26, 10, 2, 12);
      gfx.fillRect(36, 10, 2, 8);
      gfx.fillStyle(0x38bdf8, 1);
      gfx.fillCircle(tileSize - 14, 14, 6);
    });
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
    const BODY_COLOR = 0x243048;
    const BORDER_CYAN = 0x38bdf8;
    const INNER_DARK = 0x090d16;
    const FLANGE_COLOR = 0x64748b;

    // Corner center point & arc angle definitions
    let cx = 0;
    let cy = 0;
    let startAngle = 0;
    let endAngle = Math.PI / 2;

    if (cornerType === 'TOP_RIGHT') {
      // Connects TOP and RIGHT (elbow curves around top-right outer corner)
      // Center of curvature at bottom-left corner of the bend
      cx = 0;
      cy = size;
      startAngle = -Math.PI / 2; // 270 deg (top)
      endAngle = 0; // 0 deg (right)
    } else if (cornerType === 'TOP_LEFT') {
      // Connects TOP and LEFT
      cx = size;
      cy = size;
      startAngle = Math.PI; // 180 deg (left)
      endAngle = -Math.PI / 2; // 270 deg (top)
    } else if (cornerType === 'BOTTOM_RIGHT') {
      // Connects BOTTOM and RIGHT
      cx = 0;
      cy = 0;
      startAngle = 0; // 0 deg (right)
      endAngle = Math.PI / 2; // 90 deg (bottom)
    } else if (cornerType === 'BOTTOM_LEFT') {
      // Connects BOTTOM and LEFT
      cx = size;
      cy = 0;
      startAngle = Math.PI / 2; // 90 deg (bottom)
      endAngle = Math.PI; // 180 deg (left)
    }

    const R_outer = size - offset; // 56 - 15 = 41
    const R_inner = offset; // 15
    const R_mid = (R_outer + R_inner) / 2; // 28

    // 1. Draw smooth outer pipe body (Quarter Torus)
    gfx.fillStyle(BODY_COLOR, 1);
    gfx.beginPath();
    gfx.arc(cx, cy, R_outer, startAngle, endAngle, false);
    gfx.arc(cx, cy, R_inner, endAngle, startAngle, true);
    gfx.closePath();
    gfx.fillPath();

    // 2. Draw smooth inner dark channel
    const R_ch_outer = R_mid + (pipeWidth - 8) / 2;
    const R_ch_inner = R_mid - (pipeWidth - 8) / 2;
    gfx.fillStyle(INNER_DARK, 1);
    gfx.beginPath();
    gfx.arc(cx, cy, R_ch_outer, startAngle, endAngle, false);
    gfx.arc(cx, cy, R_ch_inner, endAngle, startAngle, true);
    gfx.closePath();
    gfx.fillPath();

    // 3. Center luminous line
    gfx.lineStyle(2, BORDER_CYAN, 0.4);
    gfx.beginPath();
    gfx.arc(cx, cy, R_mid, startAngle, endAngle, false);
    gfx.strokePath();

    // 4. Glowing outer and inner borders
    gfx.lineStyle(1.5, BORDER_CYAN, 0.9);
    gfx.beginPath();
    gfx.arc(cx, cy, R_outer, startAngle, endAngle, false);
    gfx.strokePath();
    gfx.beginPath();
    gfx.arc(cx, cy, R_inner, startAngle, endAngle, false);
    gfx.strokePath();

    // 5. Connection Flanges on the 2 borders
    gfx.fillStyle(FLANGE_COLOR, 1);
    if (cornerType === 'TOP_RIGHT') {
      gfx.fillRect(offset - 2, 0, pipeWidth + 4, 4); // Top flange
      gfx.fillRect(size - 4, offset - 2, 4, pipeWidth + 4); // Right flange
    } else if (cornerType === 'TOP_LEFT') {
      gfx.fillRect(offset - 2, 0, pipeWidth + 4, 4); // Top flange
      gfx.fillRect(0, offset - 2, 4, pipeWidth + 4); // Left flange
    } else if (cornerType === 'BOTTOM_RIGHT') {
      gfx.fillRect(offset - 2, size - 4, pipeWidth + 4, 4); // Bottom flange
      gfx.fillRect(size - 4, offset - 2, 4, pipeWidth + 4); // Right flange
    } else if (cornerType === 'BOTTOM_LEFT') {
      gfx.fillRect(offset - 2, size - 4, pipeWidth + 4, 4); // Bottom flange
      gfx.fillRect(0, offset - 2, 4, pipeWidth + 4); // Left flange
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
