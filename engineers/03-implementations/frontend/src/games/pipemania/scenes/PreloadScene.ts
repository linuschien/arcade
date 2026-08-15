/**
 * PreloadScene.ts
 * Generates all namespaced textures ('pipemania:*') procedurally via Phaser Graphics.
 * Includes all 13 pipe types, gold preset pipes, start/end valves, obstacles, flooz liquid, and wrenches.
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
    const PIPE_WIDTH = 22;
    const PIPE_OFFSET = (TILE_SIZE - PIPE_WIDTH) / 2; // 17

    // 1. Grid Background Tile
    if (!this.textures.exists('pipemania:grid_tile')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0x0f172a, 1); // Slate 900
      gfx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
      gfx.lineStyle(1, 0x1e293b, 1); // Slate 800
      gfx.strokeRect(0, 0, TILE_SIZE, TILE_SIZE);
      gfx.generateTexture('pipemania:grid_tile', TILE_SIZE, TILE_SIZE);
      gfx.destroy();
    }

    // 2. Obstacle Rock
    if (!this.textures.exists('pipemania:obstacle_rock')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0x334155, 1); // Slate 700
      gfx.fillRoundedRect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8, 8);
      gfx.fillStyle(0x475569, 1); // Slate 600
      gfx.fillRoundedRect(8, 8, TILE_SIZE - 16, TILE_SIZE - 16, 6);
      gfx.fillStyle(0x64748b, 1); // Highlights
      gfx.fillCircle(18, 18, 6);
      gfx.fillCircle(38, 34, 8);
      gfx.generateTexture('pipemania:obstacle_rock', TILE_SIZE, TILE_SIZE);
      gfx.destroy();
    }

    // 3. Start Valve
    if (!this.textures.exists('pipemania:start_valve')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0x0284c7, 1); // Sky blue
      gfx.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, 22);
      gfx.fillStyle(0x38bdf8, 1);
      gfx.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, 16);
      gfx.fillStyle(0x0369a1, 1);
      gfx.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, 8);
      gfx.generateTexture('pipemania:start_valve', TILE_SIZE, TILE_SIZE);
      gfx.destroy();
    }

    // 4. End Drain
    if (!this.textures.exists('pipemania:end_drain')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xd97706, 1); // Amber 600
      gfx.fillRoundedRect(6, 6, TILE_SIZE - 12, TILE_SIZE - 12, 10);
      gfx.fillStyle(0x1e293b, 1);
      gfx.fillCircle(TILE_SIZE / 2, TILE_SIZE / 2, 16);
      gfx.lineStyle(2, 0xf59e0b, 1);
      gfx.strokeCircle(TILE_SIZE / 2, TILE_SIZE / 2, 16);
      gfx.generateTexture('pipemania:end_drain', TILE_SIZE, TILE_SIZE);
      gfx.destroy();
    }

    // 5. Reticle Cursor
    if (!this.textures.exists('pipemania:reticle')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.lineStyle(3, 0x38bdf8, 1); // Neon cyan
      gfx.strokeRoundedRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4, 4);
      // Corner brackets
      gfx.fillStyle(0x38bdf8, 1);
      gfx.fillRect(2, 2, 10, 4);
      gfx.fillRect(2, 2, 4, 10);
      gfx.fillRect(TILE_SIZE - 12, 2, 10, 4);
      gfx.fillRect(TILE_SIZE - 6, 2, 4, 10);
      gfx.fillRect(2, TILE_SIZE - 6, 10, 4);
      gfx.fillRect(2, TILE_SIZE - 12, 4, 10);
      gfx.fillRect(TILE_SIZE - 12, TILE_SIZE - 6, 10, 4);
      gfx.fillRect(TILE_SIZE - 6, TILE_SIZE - 12, 4, 10);
      gfx.generateTexture('pipemania:reticle', TILE_SIZE, TILE_SIZE);
      gfx.destroy();
    }

    // 6. Wrench (Life Icon)
    if (!this.textures.exists('pipemania:wrench')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0x94a3b8, 1); // Slate 400
      gfx.fillRect(10, 6, 4, 14);
      gfx.fillCircle(12, 6, 5);
      gfx.fillStyle(0x020617, 1);
      gfx.fillRect(11, 2, 2, 5);
      gfx.generateTexture('pipemania:wrench', 24, 24);
      gfx.destroy();
    }

    // 7. Preset Gold Bolt
    if (!this.textures.exists('pipemania:preset_bolt')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0xf59e0b, 1); // Amber
      gfx.fillCircle(4, 4, 3);
      gfx.lineStyle(1, 0x78350f, 1);
      gfx.strokeCircle(4, 4, 3);
      gfx.generateTexture('pipemania:preset_bolt', 8, 8);
      gfx.destroy();
    }

    // Generate Standard and Specialized Pipe Textures
    this.createPipeTextures(TILE_SIZE, PIPE_WIDTH, PIPE_OFFSET);
  }

  private createPipeTextures(tileSize: number, pipeWidth: number, offset: number): void {
    const PIPE_COLOR = 0x475569; // Slate metallic
    const PIPE_BORDER = 0x94a3b8; // Metallic highlight
    const ONE_WAY_ARROW = 0x22c55e; // Green indicator
    const RESERVOIR_BG = 0x1e3a8a; // Dark blue glass

    // 1. Horizontal
    this.drawAndSaveTexture('pipemania:pipe_horizontal', tileSize, (gfx) => {
      gfx.fillStyle(PIPE_COLOR, 1);
      gfx.fillRect(0, offset, tileSize, pipeWidth);
      gfx.lineStyle(2, PIPE_BORDER, 1);
      gfx.strokeRect(0, offset, tileSize, pipeWidth);
    });

    // 2. Vertical
    this.drawAndSaveTexture('pipemania:pipe_vertical', tileSize, (gfx) => {
      gfx.fillStyle(PIPE_COLOR, 1);
      gfx.fillRect(offset, 0, pipeWidth, tileSize);
      gfx.lineStyle(2, PIPE_BORDER, 1);
      gfx.strokeRect(offset, 0, pipeWidth, tileSize);
    });

    // 3. Corner Top-Right (UP <-> RIGHT)
    this.drawAndSaveTexture('pipemania:pipe_corner_tr', tileSize, (gfx) => {
      gfx.fillStyle(PIPE_COLOR, 1);
      gfx.fillRect(offset, 0, pipeWidth, offset + pipeWidth);
      gfx.fillRect(offset, offset, tileSize - offset, pipeWidth);
      gfx.lineStyle(2, PIPE_BORDER, 1);
      gfx.strokeLineShape(new Phaser.Geom.Line(offset, 0, offset, offset));
      gfx.strokeLineShape(new Phaser.Geom.Line(offset, offset, tileSize, offset));
      gfx.strokeLineShape(new Phaser.Geom.Line(offset + pipeWidth, 0, offset + pipeWidth, offset + pipeWidth));
      gfx.strokeLineShape(new Phaser.Geom.Line(offset + pipeWidth, offset + pipeWidth, tileSize, offset + pipeWidth));
    });

    // 4. Corner Top-Left (UP <-> LEFT)
    this.drawAndSaveTexture('pipemania:pipe_corner_tl', tileSize, (gfx) => {
      gfx.fillStyle(PIPE_COLOR, 1);
      gfx.fillRect(offset, 0, pipeWidth, offset + pipeWidth);
      gfx.fillRect(0, offset, offset + pipeWidth, pipeWidth);
      gfx.lineStyle(2, PIPE_BORDER, 1);
      gfx.strokeLineShape(new Phaser.Geom.Line(offset + pipeWidth, 0, offset + pipeWidth, offset));
      gfx.strokeLineShape(new Phaser.Geom.Line(0, offset, offset + pipeWidth, offset));
      gfx.strokeLineShape(new Phaser.Geom.Line(offset, 0, offset, offset + pipeWidth));
      gfx.strokeLineShape(new Phaser.Geom.Line(0, offset + pipeWidth, offset, offset + pipeWidth));
    });

    // 5. Corner Bottom-Right (DOWN <-> RIGHT)
    this.drawAndSaveTexture('pipemania:pipe_corner_br', tileSize, (gfx) => {
      gfx.fillStyle(PIPE_COLOR, 1);
      gfx.fillRect(offset, offset, pipeWidth, tileSize - offset);
      gfx.fillRect(offset, offset, tileSize - offset, pipeWidth);
      gfx.lineStyle(2, PIPE_BORDER, 1);
      gfx.strokeLineShape(new Phaser.Geom.Line(offset, tileSize, offset, offset + pipeWidth));
      gfx.strokeLineShape(new Phaser.Geom.Line(offset, offset + pipeWidth, tileSize, offset + pipeWidth));
      gfx.strokeLineShape(new Phaser.Geom.Line(offset + pipeWidth, tileSize, offset + pipeWidth, offset));
      gfx.strokeLineShape(new Phaser.Geom.Line(offset + pipeWidth, offset, tileSize, offset));
    });

    // 6. Corner Bottom-Left (DOWN <-> LEFT)
    this.drawAndSaveTexture('pipemania:pipe_corner_bl', tileSize, (gfx) => {
      gfx.fillStyle(PIPE_COLOR, 1);
      gfx.fillRect(offset, offset, pipeWidth, tileSize - offset);
      gfx.fillRect(0, offset, offset + pipeWidth, pipeWidth);
      gfx.lineStyle(2, PIPE_BORDER, 1);
      gfx.strokeLineShape(new Phaser.Geom.Line(offset + pipeWidth, tileSize, offset + pipeWidth, offset + pipeWidth));
      gfx.strokeLineShape(new Phaser.Geom.Line(0, offset + pipeWidth, offset + pipeWidth, offset + pipeWidth));
      gfx.strokeLineShape(new Phaser.Geom.Line(offset, tileSize, offset, offset));
      gfx.strokeLineShape(new Phaser.Geom.Line(0, offset, offset, offset));
    });

    // 7. Cross Pipe (Cross ╬)
    this.drawAndSaveTexture('pipemania:pipe_cross', tileSize, (gfx) => {
      gfx.fillStyle(PIPE_COLOR, 1);
      gfx.fillRect(0, offset, tileSize, pipeWidth);
      gfx.fillRect(offset, 0, pipeWidth, tileSize);
      gfx.lineStyle(2, PIPE_BORDER, 1);
      gfx.strokeRect(0, offset, tileSize, pipeWidth);
      gfx.strokeRect(offset, 0, pipeWidth, tileSize);
      // Cross bridge junction lines
      gfx.lineStyle(1, 0x0284c7, 1);
      gfx.strokeCircle(tileSize / 2, tileSize / 2, 6);
    });

    // 8. One-Way Right (→)
    this.drawAndSaveTexture('pipemania:pipe_oneway_right', tileSize, (gfx) => {
      gfx.fillStyle(PIPE_COLOR, 1);
      gfx.fillRect(0, offset, tileSize, pipeWidth);
      gfx.lineStyle(2, PIPE_BORDER, 1);
      gfx.strokeRect(0, offset, tileSize, pipeWidth);
      // Green Arrow
      gfx.fillStyle(ONE_WAY_ARROW, 1);
      gfx.fillTriangle(tileSize / 2 - 8, offset + 4, tileSize / 2 - 8, offset + pipeWidth - 4, tileSize / 2 + 8, tileSize / 2);
    });

    // 9. One-Way Left (←)
    this.drawAndSaveTexture('pipemania:pipe_oneway_left', tileSize, (gfx) => {
      gfx.fillStyle(PIPE_COLOR, 1);
      gfx.fillRect(0, offset, tileSize, pipeWidth);
      gfx.lineStyle(2, PIPE_BORDER, 1);
      gfx.strokeRect(0, offset, tileSize, pipeWidth);
      gfx.fillStyle(ONE_WAY_ARROW, 1);
      gfx.fillTriangle(tileSize / 2 + 8, offset + 4, tileSize / 2 + 8, offset + pipeWidth - 4, tileSize / 2 - 8, tileSize / 2);
    });

    // 10. One-Way Down (↓)
    this.drawAndSaveTexture('pipemania:pipe_oneway_down', tileSize, (gfx) => {
      gfx.fillStyle(PIPE_COLOR, 1);
      gfx.fillRect(offset, 0, pipeWidth, tileSize);
      gfx.lineStyle(2, PIPE_BORDER, 1);
      gfx.strokeRect(offset, 0, pipeWidth, tileSize);
      gfx.fillStyle(ONE_WAY_ARROW, 1);
      gfx.fillTriangle(offset + 4, tileSize / 2 - 8, offset + pipeWidth - 4, tileSize / 2 - 8, tileSize / 2, tileSize / 2 + 8);
    });

    // 11. One-Way Up (↑)
    this.drawAndSaveTexture('pipemania:pipe_oneway_up', tileSize, (gfx) => {
      gfx.fillStyle(PIPE_COLOR, 1);
      gfx.fillRect(offset, 0, pipeWidth, tileSize);
      gfx.lineStyle(2, PIPE_BORDER, 1);
      gfx.strokeRect(offset, 0, pipeWidth, tileSize);
      gfx.fillStyle(ONE_WAY_ARROW, 1);
      gfx.fillTriangle(offset + 4, tileSize / 2 + 8, offset + pipeWidth - 4, tileSize / 2 + 8, tileSize / 2, tileSize / 2 - 8);
    });

    // 12. Reservoir Horizontal
    this.drawAndSaveTexture('pipemania:pipe_reservoir_h', tileSize, (gfx) => {
      gfx.fillStyle(PIPE_COLOR, 1);
      gfx.fillRect(0, offset, tileSize, pipeWidth);
      // Large tank bubble in middle
      gfx.fillStyle(RESERVOIR_BG, 1);
      gfx.fillRoundedRect(8, 8, tileSize - 16, tileSize - 16, 8);
      gfx.lineStyle(2, 0x38bdf8, 1);
      gfx.strokeRoundedRect(8, 8, tileSize - 16, tileSize - 16, 8);
    });

    // 13. Reservoir Vertical
    this.drawAndSaveTexture('pipemania:pipe_reservoir_v', tileSize, (gfx) => {
      gfx.fillStyle(PIPE_COLOR, 1);
      gfx.fillRect(offset, 0, pipeWidth, tileSize);
      gfx.fillStyle(RESERVOIR_BG, 1);
      gfx.fillRoundedRect(8, 8, tileSize - 16, tileSize - 16, 8);
      gfx.lineStyle(2, 0x38bdf8, 1);
      gfx.strokeRoundedRect(8, 8, tileSize - 16, tileSize - 16, 8);
    });
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
