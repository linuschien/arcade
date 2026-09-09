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
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      this.drawRoundedRect(ctx, -12, -18, 24, 37, 4);
      ctx.fill();

      // 2. Front Aerodynamic Wing & Endplates (Positioned ahead of the front wheels)
      const wingGrad = ctx.createLinearGradient(0, -18, 0, -14);
      wingGrad.addColorStop(0, isPlayer ? '#2563eb' : '#dc2626');
      wingGrad.addColorStop(1, isPlayer ? '#1d4ed8' : '#991b1b');
      ctx.fillStyle = wingGrad;
      this.drawRoundedRect(ctx, -15, -18, 30, 3.5, 1);
      ctx.fill();

      // Carbon front wing endplates
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-16, -19.5, 2, 6);
      ctx.fillRect(14, -19.5, 2, 6);

      // 3. Suspension Double Wishbones (Front & Rear Axles)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      // Front Left Wishbones
      ctx.moveTo(-4, -10);
      ctx.lineTo(-10, -10);
      ctx.moveTo(-3, -12.5);
      ctx.lineTo(-10, -11);
      // Front Right Wishbones
      ctx.moveTo(4, -10);
      ctx.lineTo(10, -10);
      ctx.moveTo(3, -12.5);
      ctx.lineTo(10, -11);
      // Rear Wishbones
      ctx.moveTo(-4, 10);
      ctx.lineTo(-10, 10);
      ctx.moveTo(4, 10);
      ctx.lineTo(10, 10);
      ctx.stroke();

      // 4. 4 Tires (F1 Rubber Slicks with Alloy Rims)
      const tireGradLeft = ctx.createLinearGradient(-18, 0, -10, 0);
      tireGradLeft.addColorStop(0, '#334155');
      tireGradLeft.addColorStop(1, '#0f172a');
      const tireGradRight = ctx.createLinearGradient(10, 0, 18, 0);
      tireGradRight.addColorStop(0, '#0f172a');
      tireGradRight.addColorStop(1, '#334155');

      // Front Wheels (Centered cleanly on front axle at y = -10, behind front wing)
      ctx.fillStyle = tireGradLeft;
      this.drawRoundedRect(ctx, -17, -14, 7, 8, 2);
      ctx.fill();
      ctx.fillStyle = tireGradRight;
      this.drawRoundedRect(ctx, 10, -14, 7, 8, 2);
      ctx.fill();

      // Rear Wheels (Centered on rear axle at y = 10, wider racing slicks)
      ctx.fillStyle = tireGradLeft;
      this.drawRoundedRect(ctx, -18, 5, 8, 10, 2);
      ctx.fill();
      ctx.fillStyle = tireGradRight;
      this.drawRoundedRect(ctx, 10, 5, 8, 10, 2);
      ctx.fill();

      // Wheel Alloy Rims (Silver with metallic luster)
      ctx.fillStyle = '#94a3b8';
      this.drawRoundedRect(ctx, -15, -12.5, 3.5, 5, 1);
      ctx.fill();
      this.drawRoundedRect(ctx, 11.5, -12.5, 3.5, 5, 1);
      ctx.fill();
      this.drawRoundedRect(ctx, -16, 7, 4, 6, 1);
      ctx.fill();
      this.drawRoundedRect(ctx, 12, 7, 4, 6, 1);
      ctx.fill();

      // Hub nuts
      ctx.fillStyle = isPlayer ? '#facc15' : '#ef4444';
      ctx.fillRect(-14, -11, 2, 2);
      ctx.fillRect(12.5, -11, 2, 2);
      ctx.fillRect(-15, 9, 2, 2);
      ctx.fillRect(13, 9, 2, 2);

      // 5. Aerodynamic Chassis Body (Streamlined Monocoque)
      ctx.beginPath();
      ctx.moveTo(0, -19);      // Sharp nosecone tip
      ctx.lineTo(3.5, -14);    // Front nose cone
      ctx.lineTo(4.5, -5);     // Narrow waist ahead of sidepods
      ctx.lineTo(8.5, 0);      // Sidepod intake flare
      ctx.lineTo(8.5, 9);      // Sidepod radiator body
      ctx.lineTo(4, 16);       // Engine cover taper
      ctx.lineTo(-4, 16);
      ctx.lineTo(-8.5, 9);
      ctx.lineTo(-8.5, 0);     // Left sidepod intake flare
      ctx.lineTo(-4.5, -5);
      ctx.lineTo(-3.5, -14);
      ctx.closePath();

      const bodyGrad = ctx.createLinearGradient(-9, 0, 9, 0);
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

      // 6. Racing Stripe (Centered longitudinal livery)
      ctx.fillStyle = isPlayer ? '#ffffff' : '#facc15';
      ctx.fillRect(-1.25, -18, 2.5, 33);

      // 7. Rear Wing & Spoiler
      // Struts
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-3, 14, 1.5, 3);
      ctx.fillRect(1.5, 14, 1.5, 3);
      // Wing plane
      ctx.fillStyle = isPlayer ? '#1e40af' : '#b91c1c';
      this.drawRoundedRect(ctx, -16, 16, 32, 4, 1);
      ctx.fill();
      // Endplates
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-17, 14.5, 2, 7);
      ctx.fillRect(15, 14.5, 2, 7);

      // 8. Cockpit & Driver Helmet
      // Dark cockpit aperture
      ctx.fillStyle = '#020617';
      this.drawRoundedRect(ctx, -3.5, -4, 7, 8.5, 3);
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

    // 3. Smoke Screen (rallyx:smoke) - Volumetric puffy cartoon cumulus cloud
    createProceduralTexture('rallyx:smoke', size, size, (ctx) => {
      // Soft ground contact aura
      ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
      ctx.beginPath();
      ctx.ellipse(24, 25, 21, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Individual puffy cloud lobes (each lobe has its own 3D spherical lighting)
      const lobes = [
        { cx: 24, cy: 20, r: 12 }, // Central dome
        { cx: 16, cy: 22, r: 10 }, // Left-mid swell
        { cx: 32, cy: 22, r: 10 }, // Right-mid swell
        { cx: 20, cy: 28, r: 10 }, // Bottom-left puff
        { cx: 28, cy: 28, r: 10 }, // Bottom-right puff
        { cx: 11, cy: 26, r: 7 },  // Far-left wisp
        { cx: 37, cy: 26, r: 7 },  // Far-right wisp
        { cx: 24, cy: 15, r: 8 },  // Top crest
      ];

      for (const lobe of lobes) {
        ctx.beginPath();
        ctx.arc(lobe.cx, lobe.cy, lobe.r, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(
          lobe.cx - lobe.r * 0.35,
          lobe.cy - lobe.r * 0.35,
          1,
          lobe.cx,
          lobe.cy,
          lobe.r
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.55, '#f8fafc');
        grad.addColorStop(0.85, '#e2e8f0');
        grad.addColorStop(1, 'rgba(203, 213, 225, 0.85)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Brilliant white fluffy highlight crests on top of cloud billows
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.arc(23, 13.5, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(15, 18, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(31, 18, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Soft vapor curls
      ctx.fillStyle = 'rgba(241, 245, 249, 0.7)';
      ctx.beginPath();
      ctx.arc(7, 28, 3, 0, Math.PI * 2);
      ctx.arc(41, 28, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Granite Boulder Obstacle (rallyx:rock) - Full 48x48 tile rugged 3D stone barrier
    createProceduralTexture('rallyx:rock', size, size, (ctx) => {
      // 1. Fill entire 48x48 tile base with dark bedrock granite (no exposed road)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, 48, 48);

      // 2. 3D Beveled outer stone rim (Sunlit top-left, shaded bottom-right)
      // Top Edge Bevel
      const topBevel = ctx.createLinearGradient(0, 0, 0, 5);
      topBevel.addColorStop(0, '#94a3b8');
      topBevel.addColorStop(1, '#64748b');
      ctx.fillStyle = topBevel;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(48, 0);
      ctx.lineTo(44, 4);
      ctx.lineTo(4, 4);
      ctx.closePath();
      ctx.fill();

      // Left Edge Bevel
      const leftBevel = ctx.createLinearGradient(0, 0, 5, 0);
      leftBevel.addColorStop(0, '#94a3b8');
      leftBevel.addColorStop(1, '#475569');
      ctx.fillStyle = leftBevel;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(4, 4);
      ctx.lineTo(4, 44);
      ctx.lineTo(0, 48);
      ctx.closePath();
      ctx.fill();

      // Right Edge Bevel (Shadow)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(48, 0);
      ctx.lineTo(48, 48);
      ctx.lineTo(44, 44);
      ctx.lineTo(44, 4);
      ctx.closePath();
      ctx.fill();

      // Bottom Edge Bevel (Deep Shadow)
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.moveTo(0, 48);
      ctx.lineTo(4, 44);
      ctx.lineTo(44, 44);
      ctx.lineTo(48, 48);
      ctx.closePath();
      ctx.fill();

      // 3. Facet 1: Top-Left Upper Sunlit Stone Shelf
      ctx.beginPath();
      ctx.moveTo(4, 4);
      ctx.lineTo(28, 4);
      ctx.lineTo(22, 24);
      ctx.lineTo(4, 20);
      ctx.closePath();
      const grad1 = ctx.createLinearGradient(4, 4, 28, 24);
      grad1.addColorStop(0, '#cbd5e1');
      grad1.addColorStop(0.6, '#94a3b8');
      grad1.addColorStop(1, '#64748b');
      ctx.fillStyle = grad1;
      ctx.fill();

      // 4. Facet 2: Top-Right Apex Rock Face
      ctx.beginPath();
      ctx.moveTo(28, 4);
      ctx.lineTo(44, 4);
      ctx.lineTo(44, 26);
      ctx.lineTo(29, 28);
      ctx.lineTo(22, 24);
      ctx.closePath();
      const grad2 = ctx.createLinearGradient(28, 4, 44, 28);
      grad2.addColorStop(0, '#94a3b8');
      grad2.addColorStop(1, '#475569');
      ctx.fillStyle = grad2;
      ctx.fill();

      // 5. Facet 3: Lower-Left Granite Terraces
      ctx.beginPath();
      ctx.moveTo(4, 20);
      ctx.lineTo(22, 24);
      ctx.lineTo(19, 44);
      ctx.lineTo(4, 44);
      ctx.closePath();
      const grad3 = ctx.createLinearGradient(4, 20, 22, 44);
      grad3.addColorStop(0, '#64748b');
      grad3.addColorStop(1, '#334155');
      ctx.fillStyle = grad3;
      ctx.fill();

      // 6. Facet 4: Lower-Right Deep Shadow Abyss
      ctx.beginPath();
      ctx.moveTo(22, 24);
      ctx.lineTo(29, 28);
      ctx.lineTo(44, 26);
      ctx.lineTo(44, 44);
      ctx.lineTo(19, 44);
      ctx.closePath();
      const grad4 = ctx.createLinearGradient(22, 24, 44, 44);
      grad4.addColorStop(0, '#334155');
      grad4.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad4;
      ctx.fill();

      // 7. Deep Geological Faults & Fissure Cracks
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      // Main jagged cleavage fracture
      ctx.moveTo(28, 4);
      ctx.lineTo(22, 24);
      ctx.lineTo(29, 28);
      ctx.lineTo(36, 44);
      ctx.stroke();

      // Secondary fault line
      ctx.beginPath();
      ctx.moveTo(22, 24);
      ctx.lineTo(12, 33);
      ctx.lineTo(19, 44);
      ctx.stroke();

      // Highlight line on sunlit crack lip
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(27, 4);
      ctx.lineTo(21, 23);
      ctx.stroke();

      // 8. Natural Granite Mineral Flecks
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(10, 10, 2, 2);
      ctx.fillRect(18, 14, 2, 1.5);
      ctx.fillRect(35, 12, 1.5, 1.5);
      ctx.fillRect(14, 38, 2, 1.5);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(28, 16, 2, 2);
      ctx.fillRect(38, 34, 2, 2);
      ctx.fillRect(8, 25, 2, 1.5);

      // Outer bounding border
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, 47, 47);
    });

    // Base Flag Pole & Triangular Racing Pennant Helper
    const drawBaseFlagPole = (ctx: CanvasRenderingContext2D) => {
      // Chrome Flagpole (Thin, vertical metallic pole at x = 10)
      const poleGrad = ctx.createLinearGradient(9, 0, 12, 0);
      poleGrad.addColorStop(0, '#f8fafc');
      poleGrad.addColorStop(0.5, '#94a3b8');
      poleGrad.addColorStop(1, '#475569');
      ctx.fillStyle = poleGrad;
      this.drawRoundedRect(ctx, 9.5, 7, 2.5, 34, 1);
      ctx.fill();

      // Chrome Sphere Finial on Top
      const finialGrad = ctx.createRadialGradient(10.5, 6, 0.5, 11, 7, 2.5);
      finialGrad.addColorStop(0, '#ffffff');
      finialGrad.addColorStop(0.6, '#cbd5e1');
      finialGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = finialGrad;
      ctx.beginPath();
      ctx.arc(10.75, 7, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Pole Mount Base
      ctx.fillStyle = '#1e293b';
      this.drawRoundedRect(ctx, 8, 41, 6, 3, 1);
      ctx.fill();

      // Grommets (Flag attachment rings to the pole)
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(10.5, 11, 2, 2);
      ctx.fillRect(10.5, 27, 2, 2);
    };

    // 5. Regular Flag (rallyx:flag_regular) - Vivid Crimson Triangular Racing Pennant
    createProceduralTexture('rallyx:flag_regular', size, size, (ctx) => {
      drawBaseFlagPole(ctx);

      // Triangular waving cloth pennant
      ctx.beginPath();
      ctx.moveTo(12, 10);
      ctx.quadraticCurveTo(26, 8, 41, 19);
      ctx.quadraticCurveTo(26, 26, 12, 28);
      ctx.closePath();

      const pennantGrad = ctx.createLinearGradient(12, 10, 41, 28);
      pennantGrad.addColorStop(0, '#f87171');
      pennantGrad.addColorStop(0.35, '#ef4444');
      pennantGrad.addColorStop(0.7, '#dc2626');
      pennantGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = pennantGrad;
      ctx.fill();

      // Realistic cloth ripple fold shadow
      ctx.beginPath();
      ctx.moveTo(22, 9);
      ctx.quadraticCurveTo(27, 18, 23, 27);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 6. Special Flag "S" (rallyx:flag_special) - Golden Amber Pennant with Red 'S'
    createProceduralTexture('rallyx:flag_special', size, size, (ctx) => {
      drawBaseFlagPole(ctx);

      // Triangular waving cloth pennant
      ctx.beginPath();
      ctx.moveTo(12, 10);
      ctx.quadraticCurveTo(26, 8, 41, 19);
      ctx.quadraticCurveTo(26, 26, 12, 28);
      ctx.closePath();

      const sGrad = ctx.createLinearGradient(12, 10, 41, 28);
      sGrad.addColorStop(0, '#fde047');
      sGrad.addColorStop(0.4, '#facc15');
      sGrad.addColorStop(0.8, '#eab308');
      sGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = sGrad;
      ctx.fill();

      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Embossed Bold 'S'
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 16px "Arial Black", "Roboto Mono", monospace';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillText('S', 24.5, 19.5);
      ctx.fillStyle = '#dc2626';
      ctx.fillText('S', 23.5, 18.5);
    });

    // 7. Lucky Flag "L" (rallyx:flag_lucky) - Emerald Green Pennant with White/Yellow 'L'
    createProceduralTexture('rallyx:flag_lucky', size, size, (ctx) => {
      drawBaseFlagPole(ctx);

      // Triangular waving cloth pennant
      ctx.beginPath();
      ctx.moveTo(12, 10);
      ctx.quadraticCurveTo(26, 8, 41, 19);
      ctx.quadraticCurveTo(26, 26, 12, 28);
      ctx.closePath();

      const lGrad = ctx.createLinearGradient(12, 10, 41, 28);
      lGrad.addColorStop(0, '#4ade80');
      lGrad.addColorStop(0.4, '#22c55e');
      lGrad.addColorStop(0.8, '#16a34a');
      lGrad.addColorStop(1, '#15803d');
      ctx.fillStyle = lGrad;
      ctx.fill();

      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Embossed Bold 'L'
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 16px "Arial Black", "Roboto Mono", monospace';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.fillText('L', 24.5, 19.5);
      ctx.fillStyle = '#fef08a';
      ctx.fillText('L', 23.5, 18.5);
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

