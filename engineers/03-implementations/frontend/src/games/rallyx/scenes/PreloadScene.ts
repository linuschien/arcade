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

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private createProceduralTextures(): void {
    const size = 48;

    const createProceduralTexture = (
      key: string,
      width: number,
      height: number,
      draw: (ctx: CanvasRenderingContext2D) => void
    ) => {
      if (this.textures.exists(key)) return;
      if (typeof this.textures.createCanvas === 'function') {
        const tex = this.textures.createCanvas(key, width, height);
        if (tex && tex.context) {
          draw(tex.context);
          if (typeof tex.refresh === 'function') {
            tex.refresh();
          }
          return;
        }
      }
      // Fallback to Graphics if createCanvas is unavailable in mock environment
      if (typeof this.make?.graphics === 'function') {
        const gfx = this.make.graphics({ x: 0, y: 0 });
        gfx.fillStyle(0x2563eb, 1);
        gfx.fillRect(0, 0, width, height);
        gfx.generateTexture(key, width, height);
        gfx.destroy();
      }
    };

    // Master Formula 1 Car Rendering (Centered at 0, 0, facing UP towards negative Y)
    const renderFormulaCarUp = (ctx: CanvasRenderingContext2D, isPlayer: boolean) => {
      // 1. Road drop shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      this.drawRoundedRect(ctx, -10, -18, 20, 36, 4);
      ctx.fill();

      // 2. 4 Tires (F1 Rubber Slicks with Alloy Rims)
      const tireGrad = ctx.createLinearGradient(-19, 0, -11, 0);
      tireGrad.addColorStop(0, '#334155');
      tireGrad.addColorStop(1, '#0f172a');

      // Front Left & Right Tires
      ctx.fillStyle = tireGrad;
      this.drawRoundedRect(ctx, -19, -15, 8, 12, 2);
      ctx.fill();
      this.drawRoundedRect(ctx, 11, -15, 8, 12, 2);
      ctx.fill();

      // Rear Left & Right Tires (Wider racing slicks)
      this.drawRoundedRect(ctx, -21, 6, 10, 15, 2);
      ctx.fill();
      this.drawRoundedRect(ctx, 11, 6, 10, 15, 2);
      ctx.fill();

      // Wheel Rims (Alloy Silver with hub nut)
      ctx.fillStyle = '#94a3b8';
      this.drawRoundedRect(ctx, -17, -12, 4, 6, 1);
      ctx.fill();
      this.drawRoundedRect(ctx, 13, -12, 4, 6, 1);
      ctx.fill();
      this.drawRoundedRect(ctx, -18, 9, 4, 9, 1);
      ctx.fill();
      this.drawRoundedRect(ctx, 14, 9, 4, 9, 1);
      ctx.fill();

      // Hub nuts
      ctx.fillStyle = isPlayer ? '#facc15' : '#ef4444';
      ctx.fillRect(-16, -10, 2, 2);
      ctx.fillRect(14, -10, 2, 2);
      ctx.fillRect(-17, 12, 2, 3);
      ctx.fillRect(15, 12, 2, 3);

      // 3. Front Aerodynamic Wing
      ctx.fillStyle = isPlayer ? '#1d4ed8' : '#991b1b';
      this.drawRoundedRect(ctx, -16, -18, 32, 4, 1);
      ctx.fill();
      // Carbon endplates
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-17, -20, 2, 7);
      ctx.fillRect(15, -20, 2, 7);

      // 4. Aerodynamic Chassis Body
      ctx.beginPath();
      ctx.moveTo(0, -21); // Nosecone tip
      ctx.lineTo(4, -14);
      ctx.lineTo(6, -3);
      ctx.lineTo(10, 4);   // Sidepod intake flare
      ctx.lineTo(8, 16);   // Engine cover
      ctx.lineTo(4, 18);   // Rear mount
      ctx.lineTo(-4, 18);
      ctx.lineTo(-8, 16);
      ctx.lineTo(-10, 4);  // Left sidepod intake flare
      ctx.lineTo(-6, -3);
      ctx.lineTo(-4, -14);
      ctx.closePath();

      const bodyGrad = ctx.createLinearGradient(-10, 0, 10, 0);
      if (isPlayer) {
        bodyGrad.addColorStop(0, '#1d4ed8');
        bodyGrad.addColorStop(0.3, '#3b82f6');
        bodyGrad.addColorStop(0.5, '#60a5fa');
        bodyGrad.addColorStop(0.7, '#3b82f6');
        bodyGrad.addColorStop(1, '#1d4ed8');
      } else {
        bodyGrad.addColorStop(0, '#991b1b');
        bodyGrad.addColorStop(0.3, '#ef4444');
        bodyGrad.addColorStop(0.5, '#f87171');
        bodyGrad.addColorStop(0.7, '#ef4444');
        bodyGrad.addColorStop(1, '#991b1b');
      }
      ctx.fillStyle = bodyGrad;
      ctx.fill();
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 5. Racing Stripe
      ctx.fillStyle = isPlayer ? '#ffffff' : '#facc15';
      ctx.fillRect(-1.5, -20, 3, 34);

      // 6. Rear Wing & Spoiler
      // Struts
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-4, 14, 2, 4);
      ctx.fillRect(2, 14, 2, 4);
      // Wing plane
      ctx.fillStyle = isPlayer ? '#1e40af' : '#b91c1c';
      this.drawRoundedRect(ctx, -17, 16, 34, 5, 1);
      ctx.fill();
      // Endplates
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-18, 14, 2, 8);
      ctx.fillRect(16, 14, 2, 8);

      // 7. Cockpit & Driver Helmet
      // Dark cockpit aperture
      ctx.fillStyle = '#020617';
      this.drawRoundedRect(ctx, -4, -4, 8, 9, 3);
      ctx.fill();

      // Spherical Helmet with radial highlight
      const helmetGrad = ctx.createRadialGradient(-1, -1, 1, 0, 0, 4);
      if (isPlayer) {
        helmetGrad.addColorStop(0, '#ffffff');
        helmetGrad.addColorStop(0.8, '#cbd5e1');
        helmetGrad.addColorStop(1, '#94a3b8');
      } else {
        helmetGrad.addColorStop(0, '#fef08a');
        helmetGrad.addColorStop(0.8, '#eab308');
        helmetGrad.addColorStop(1, '#ca8a04');
      }
      ctx.fillStyle = helmetGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Visor slit
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-2, -2, 4, 1.5);
    };

    const drawFormulaCar = (
      ctx: CanvasRenderingContext2D,
      isPlayer: boolean,
      dir: 'up' | 'down' | 'left' | 'right'
    ) => {
      ctx.save();
      ctx.translate(24, 24);

      let angle = 0;
      if (dir === 'right') angle = Math.PI / 2;
      else if (dir === 'down') angle = Math.PI;
      else if (dir === 'left') angle = Math.PI * 1.5;
      ctx.rotate(angle);

      renderFormulaCarUp(ctx, isPlayer);

      ctx.restore();
    };

    const directions: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];

    // 1. Blue Player Car (rallyx:player_{up,down,left,right})
    directions.forEach((dir) => {
      const key = `rallyx:player_${dir}`;
      createProceduralTexture(key, size, size, (ctx) => {
        drawFormulaCar(ctx, true, dir);
      });
      if (dir === 'up') {
        createProceduralTexture('rallyx:player', size, size, (ctx) => {
          drawFormulaCar(ctx, true, 'up');
        });
      }
    });

    // 2. Red Enemy Car (rallyx:enemy_{up,down,left,right})
    directions.forEach((dir) => {
      const key = `rallyx:enemy_${dir}`;
      createProceduralTexture(key, size, size, (ctx) => {
        drawFormulaCar(ctx, false, dir);
      });
      if (dir === 'up') {
        createProceduralTexture('rallyx:enemy', size, size, (ctx) => {
          drawFormulaCar(ctx, false, 'up');
        });
      }
    });

    // 3. Smoke Puff (rallyx:smoke) - Volumetric cloud
    createProceduralTexture('rallyx:smoke', size, size, (ctx) => {
      ctx.fillStyle = 'rgba(203, 213, 225, 0.7)';
      ctx.beginPath();
      ctx.arc(24, 24, 14, 0, Math.PI * 2);
      ctx.arc(15, 21, 10, 0, Math.PI * 2);
      ctx.arc(33, 21, 10, 0, Math.PI * 2);
      ctx.arc(24, 15, 8, 0, Math.PI * 2);
      ctx.arc(24, 33, 8, 0, Math.PI * 2);
      ctx.fill();

      const coreGrad = ctx.createRadialGradient(22, 20, 2, 24, 24, 10);
      coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      coreGrad.addColorStop(1, 'rgba(241, 245, 249, 0.8)');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(23, 22, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Granite Boulder Obstacle (rallyx:rock) - 3D faceted granite rock
    createProceduralTexture('rallyx:rock', size, size, (ctx) => {
      // Road contact shadow
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.beginPath();
      ctx.ellipse(24, 38, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Facet 1: Top-Left Sunlit Facet
      ctx.beginPath();
      ctx.moveTo(14, 34);
      ctx.lineTo(10, 24);
      ctx.lineTo(20, 12);
      ctx.lineTo(28, 15);
      ctx.lineTo(24, 26);
      ctx.closePath();
      const grad1 = ctx.createLinearGradient(10, 12, 28, 34);
      grad1.addColorStop(0, '#cbd5e1');
      grad1.addColorStop(1, '#64748b');
      ctx.fillStyle = grad1;
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Facet 2: Top-Right Apex Facet
      ctx.beginPath();
      ctx.moveTo(20, 12);
      ctx.lineTo(32, 11);
      ctx.lineTo(38, 22);
      ctx.lineTo(28, 26);
      ctx.lineTo(28, 15);
      ctx.closePath();
      const grad2 = ctx.createLinearGradient(20, 11, 38, 26);
      grad2.addColorStop(0, '#94a3b8');
      grad2.addColorStop(1, '#475569');
      ctx.fillStyle = grad2;
      ctx.fill();
      ctx.stroke();

      // Facet 3: Lower-Right Deep Shadow Facet
      ctx.beginPath();
      ctx.moveTo(38, 22);
      ctx.lineTo(40, 33);
      ctx.lineTo(30, 38);
      ctx.lineTo(22, 36);
      ctx.lineTo(28, 26);
      ctx.closePath();
      const grad3 = ctx.createLinearGradient(22, 22, 40, 38);
      grad3.addColorStop(0, '#334155');
      grad3.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad3;
      ctx.fill();
      ctx.stroke();

      // Facet 4: Lower-Left Facet
      ctx.beginPath();
      ctx.moveTo(10, 24);
      ctx.lineTo(12, 36);
      ctx.lineTo(22, 36);
      ctx.lineTo(28, 26);
      ctx.lineTo(24, 26);
      ctx.lineTo(14, 34);
      ctx.closePath();
      const grad4 = ctx.createLinearGradient(10, 24, 28, 36);
      grad4.addColorStop(0, '#64748b');
      grad4.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad4;
      ctx.fill();
      ctx.stroke();

      // Crisp Fissure & Geological Fracture Lines
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(20, 12);
      ctx.lineTo(24, 26);
      ctx.lineTo(22, 36);
      ctx.stroke();

      // Sunlit mineral flecks
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(18, 18, 2, 2);
      ctx.fillRect(26, 20, 2, 2);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(32, 28, 2, 2);
      ctx.fillRect(16, 30, 2, 2);
    });

    // Base Flag Pole & Waving Cloth Helper
    const drawBaseFlag = (ctx: CanvasRenderingContext2D) => {
      // 1. Metallic Pole & Finial
      const poleGrad = ctx.createLinearGradient(10, 0, 14, 0);
      poleGrad.addColorStop(0, '#f8fafc');
      poleGrad.addColorStop(0.5, '#94a3b8');
      poleGrad.addColorStop(1, '#475569');
      ctx.fillStyle = poleGrad;
      this.drawRoundedRect(ctx, 10, 5, 3.5, 38, 1);
      ctx.fill();

      // Golden sphere finial
      const finialGrad = ctx.createRadialGradient(11, 4, 1, 11.5, 5, 3.5);
      finialGrad.addColorStop(0, '#fef08a');
      finialGrad.addColorStop(0.7, '#eab308');
      finialGrad.addColorStop(1, '#854d0e');
      ctx.fillStyle = finialGrad;
      ctx.beginPath();
      ctx.arc(11.5, 5, 3, 0, Math.PI * 2);
      ctx.fill();

      // Pole base stand
      ctx.fillStyle = '#334155';
      this.drawRoundedRect(ctx, 8, 41, 7, 3, 1);
      ctx.fill();

      // 2. Waving Flag Fabric with wave gradient
      ctx.beginPath();
      ctx.moveTo(13.5, 6);
      ctx.quadraticCurveTo(28, 4, 42, 6.5);
      ctx.lineTo(42, 27);
      ctx.quadraticCurveTo(28, 24.5, 13.5, 27);
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(13, 0, 42, 0);
      waveGrad.addColorStop(0, '#fde047');
      waveGrad.addColorStop(0.4, '#facc15');
      waveGrad.addColorStop(0.7, '#eab308');
      waveGrad.addColorStop(1, '#fde047');
      ctx.fillStyle = waveGrad;
      ctx.fill();

      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    // 5. Regular Flag (rallyx:flag_regular)
    createProceduralTexture('rallyx:flag_regular', size, size, (ctx) => {
      drawBaseFlag(ctx);
      // Red triangular pennant
      ctx.beginPath();
      ctx.moveTo(15.5, 8.5);
      ctx.lineTo(39, 16.5);
      ctx.lineTo(15.5, 24.5);
      ctx.closePath();
      const pennantGrad = ctx.createLinearGradient(15, 0, 39, 0);
      pennantGrad.addColorStop(0, '#ef4444');
      pennantGrad.addColorStop(1, '#b91c1c');
      ctx.fillStyle = pennantGrad;
      ctx.fill();
    });

    // 6. Special Flag "S" (rallyx:flag_special)
    createProceduralTexture('rallyx:flag_special', size, size, (ctx) => {
      drawBaseFlag(ctx);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 18px "Arial Black", "Roboto Mono", monospace';
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillText('S', 28.5, 17.5);
      // Main glyph
      ctx.fillStyle = '#dc2626';
      ctx.fillText('S', 27.5, 16.5);
    });

    // 7. Lucky Flag "L" (rallyx:flag_lucky)
    createProceduralTexture('rallyx:flag_lucky', size, size, (ctx) => {
      drawBaseFlag(ctx);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 18px "Arial Black", "Roboto Mono", monospace';
      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillText('L', 28.5, 17.5);
      // Main glyph
      ctx.fillStyle = '#16a34a';
      ctx.fillText('L', 27.5, 16.5);
    });

    // 8. Player Crash Particles (rallyx:crash_0..3)
    [12, 9, 6, 3].forEach((radius, idx) => {
      const key = `rallyx:crash_${idx}`;
      createProceduralTexture(key, size, size, (ctx) => {
        const grad = ctx.createRadialGradient(24, 24, 1, 24, 24, radius);
        if (idx % 2 === 0) {
          grad.addColorStop(0, '#fef08a');
          grad.addColorStop(0.7, '#ef4444');
          grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
        } else {
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.7, '#facc15');
          grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(24, 24, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // 9. HUD Life Mini Car Icon (rallyx:hud_life) - Reuses Blue F1 Player Car scaled down (no more oil barrel!)
    createProceduralTexture('rallyx:hud_life', 24, 24, (ctx) => {
      ctx.save();
      ctx.translate(12, 12);
      ctx.scale(0.55, 0.55);
      renderFormulaCarUp(ctx, true);
      ctx.restore();
    });

    // 10. Decorative Border Themes 0..3 (rallyx:border_theme_0..3)
    // Theme 0: Forest (Green Canopy with 3D Spherical Leaf Lobes)
    createProceduralTexture('rallyx:border_theme_0', size, size, (ctx) => {
      ctx.fillStyle = '#022c11';
      ctx.fillRect(0, 0, size, size);

      // Under-canopy shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.arc(24, 24, 18, 0, Math.PI * 2);
      ctx.fill();

      // 8-lobed scalloped canopy with radial leaf gradients
      const cx = 24;
      const cy = 24;
      const angles = [0, 45, 90, 135, 180, 225, 270, 315];
      for (const deg of angles) {
        const rad = (deg * Math.PI) / 180;
        const lx = cx + Math.cos(rad) * 11;
        const ly = cy + Math.sin(rad) * 11;

        const lobeGrad = ctx.createRadialGradient(lx - 2, ly - 2, 1, lx, ly, 9);
        lobeGrad.addColorStop(0, '#4ade80');
        lobeGrad.addColorStop(0.5, '#16a34a');
        lobeGrad.addColorStop(1, '#14532d');
        ctx.fillStyle = lobeGrad;
        ctx.beginPath();
        ctx.arc(lx, ly, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sunlit crown foliage
      const crownGrad = ctx.createRadialGradient(21, 20, 2, 24, 24, 12);
      crownGrad.addColorStop(0, '#86efac');
      crownGrad.addColorStop(0.6, '#22c55e');
      crownGrad.addColorStop(1, '#15803d');
      ctx.fillStyle = crownGrad;
      ctx.beginPath();
      ctx.arc(24, 24, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // Theme 1: Garden (Cobblestone Lawn)
    createProceduralTexture('rallyx:border_theme_1', size, size, (ctx) => {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, size, size);

      const drawPaver = (px: number, py: number, pw: number, ph: number) => {
        // Paver drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.drawRoundedRect(ctx, px + 2, py + 2, pw, ph, 3);
        ctx.fill();

        // 3D Beveled Stone
        const stoneGrad = ctx.createLinearGradient(px, py, px + pw, py + ph);
        stoneGrad.addColorStop(0, '#f1f5f9');
        stoneGrad.addColorStop(0.4, '#cbd5e1');
        stoneGrad.addColorStop(1, '#64748b');
        ctx.fillStyle = stoneGrad;
        this.drawRoundedRect(ctx, px, py, pw, ph, 3);
        ctx.fill();

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.stroke();
      };

      drawPaver(3, 3, 19, 19);
      drawPaver(25, 25, 19, 19);
    });

    // Theme 2: Waterway (Canal Ripples)
    createProceduralTexture('rallyx:border_theme_2', size, size, (ctx) => {
      const waterGrad = ctx.createLinearGradient(0, 0, size, size);
      waterGrad.addColorStop(0, '#0369a1');
      waterGrad.addColorStop(1, '#075985');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, 0, size, size);

      // Concentric water ripple rings
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(24, 24, 16, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(125, 211, 252, 0.9)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(24, 24, 9, 0, Math.PI * 2);
      ctx.stroke();

      // Glint center
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(24, 24, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Theme 3: Ruins / Pine Forest
    createProceduralTexture('rallyx:border_theme_3', size, size, (ctx) => {
      ctx.fillStyle = '#052e16';
      ctx.fillRect(0, 0, size, size);

      // Pine bark trunk
      ctx.fillStyle = '#78350f';
      this.drawRoundedRect(ctx, 22, 32, 4, 12, 1);
      ctx.fill();

      // Base pine bough layer
      ctx.beginPath();
      ctx.moveTo(8, 34);
      ctx.lineTo(40, 34);
      ctx.lineTo(24, 18);
      ctx.closePath();
      const bough1Grad = ctx.createLinearGradient(24, 18, 24, 34);
      bough1Grad.addColorStop(0, '#16a34a');
      bough1Grad.addColorStop(1, '#14532d');
      ctx.fillStyle = bough1Grad;
      ctx.fill();

      // Top pine bough layer
      ctx.beginPath();
      ctx.moveTo(12, 22);
      ctx.lineTo(36, 22);
      ctx.lineTo(24, 6);
      ctx.closePath();
      const bough2Grad = ctx.createLinearGradient(24, 6, 24, 22);
      bough2Grad.addColorStop(0, '#86efac');
      bough2Grad.addColorStop(0.5, '#22c55e');
      bough2Grad.addColorStop(1, '#15803d');
      ctx.fillStyle = bough2Grad;
      ctx.fill();
    });
  }
}

