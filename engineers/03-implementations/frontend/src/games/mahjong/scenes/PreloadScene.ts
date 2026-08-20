/**
 * PreloadScene.ts
 * Procedurally generates high-definition 2.5D ivory acrylic Mahjong tile textures,
 * octagonal wind compass, emerald green felt, dice, wall blocks, and action buttons.
 * Prefix all textures with 'mahjong:' to ensure complete namespace isolation.
 */

import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'mahjong:PreloadScene' });
  }

  public preload(): void {
    this.createProceduralTextures();
  }

  public create(): void {
    this.scene.start('mahjong:MainGameScene');
  }

  private createProceduralTextures(): void {
    const W = 36;
    const H = 48;

    const createTileCanvas = (
      key: string,
      drawContent: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
    ) => {
      if (this.textures.exists(key)) return;

      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Drop shadow & dark bevel
      ctx.fillStyle = '#06130b';
      this.drawRoundedRect(ctx, 2, 2, W - 2, H - 2, 4);
      ctx.fill();

      // 2. Ivory acrylic face gradient
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.7, '#fdfbf7');
      grad.addColorStop(1, '#e8e2d5');
      ctx.fillStyle = grad;
      this.drawRoundedRect(ctx, 0, 0, W - 2, H - 2, 4);
      ctx.fill();

      // 3. Champagne gold outer border
      ctx.strokeStyle = '#c5a059';
      ctx.lineWidth = 1;
      ctx.stroke();

      // 4. Subtle inner card recess
      ctx.strokeStyle = '#d5dbdb';
      ctx.lineWidth = 0.8;
      this.drawRoundedRect(ctx, 2.5, 2.5, W - 7, H - 7, 2);
      ctx.stroke();

      // 5. Draw specific tile content
      drawContent(ctx, W, H);

      if (typeof this.textures.addCanvas === 'function') {
        this.textures.addCanvas(key, canvas);
      }
    };

    // 1. Base Blank Face
    createTileCanvas('mahjong:tile_face_base', () => {});

    // 2. Tile Back (Jade Green with Golden Diamond Emblem)
    if (!this.textures.exists('mahjong:tile_back')) {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Shadow
        ctx.fillStyle = '#06130b';
        this.drawRoundedRect(ctx, 2, 2, W - 2, H - 2, 4);
        ctx.fill();

        // Emerald Jade Gradient
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, '#15803d');
        grad.addColorStop(0.5, '#0f5132');
        grad.addColorStop(1, '#064e3b');
        ctx.fillStyle = grad;
        this.drawRoundedRect(ctx, 0, 0, W - 2, H - 2, 4);
        ctx.fill();

        // Emerald inner trim
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1;
        this.drawRoundedRect(ctx, 2.5, 2.5, W - 7, H - 7, 2);
        ctx.stroke();

        // Golden diamond in center
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.moveTo(W / 2 - 1, H / 2 - 8);
        ctx.lineTo(W / 2 + 7, H / 2 - 1);
        ctx.lineTo(W / 2 - 1, H / 2 + 6);
        ctx.lineTo(W / 2 - 9, H / 2 - 1);
        ctx.closePath();
        ctx.fill();

        if (typeof this.textures.addCanvas === 'function') {
          this.textures.addCanvas('mahjong:tile_back', canvas);
        }
      }
    }

    // 3. Characters (1m ~ 9m) - 硃砂紅
    const numChars = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    for (let i = 1; i <= 9; i++) {
      createTileCanvas(`mahjong:tile_${i}m`, (ctx) => {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 13px "Microsoft JhengHei", "Songti TC", serif';
        ctx.fillStyle = '#b91c1c'; // Cinnabar Red
        ctx.fillText(numChars[i], W / 2 - 1, H / 2 - 8);

        ctx.font = 'bold 12px "Microsoft JhengHei", "Songti TC", serif';
        ctx.fillStyle = '#b91c1c';
        ctx.fillText('萬', W / 2 - 1, H / 2 + 8);
      });
    }

    const cx = W / 2 - 1; // 17
    const cy = H / 2 - 1; // 23

    // Reusable Helper: Standard Mahjong Dot (Concentric ring with core)
    const drawDot = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      color: string,
      centerColor?: string
    ) => {
      // 1. Outer colored ring
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // 2. White concentric groove
      ctx.beginPath();
      ctx.arc(x, y, r * 0.62, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(0.6, r * 0.2);
      ctx.stroke();

      // 3. Center colored core
      ctx.beginPath();
      ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = centerColor || '#ffffff';
      ctx.fill();
    };

    // Reusable Helper: 1p Giant Multi-Petal Sunburst Rosette with Outer Enclosing Ring (大餅)
    const drawBigDot = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      // 1. Outermost solid enclosing ring (翡翠綠大外圈)
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#15803d'; // Jade Green outer ring
      ctx.fill();

      // 2. Outer ring white decorative groove
      ctx.beginPath();
      ctx.arc(x, y, r - 1.2, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // 3. Inner base inside the outer ring
      ctx.beginPath();
      ctx.arc(x, y, r - 2, 0, Math.PI * 2);
      ctx.fillStyle = '#fdfbf7'; // Ivory white inner face
      ctx.fill();

      // 4. 8 Petals nested inside the outer ring (翡翠綠內嵌花瓣)
      const petals = 8;
      for (let i = 0; i < petals; i++) {
        const angle = (i * Math.PI * 2) / petals;
        const px = x + Math.cos(angle) * (r * 0.58);
        const py = y + Math.sin(angle) * (r * 0.58);
        ctx.beginPath();
        ctx.arc(px, py, r * 0.26, 0, Math.PI * 2);
        ctx.fillStyle = '#15803d';
        ctx.fill();
      }

      // 5. Red concentric ring
      ctx.beginPath();
      ctx.arc(x, y, r * 0.60, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();

      // 6. White groove
      ctx.beginPath();
      ctx.arc(x, y, r * 0.40, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      // 7. Sapphire Blue core
      ctx.beginPath();
      ctx.arc(x, y, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = '#0284c7';
      ctx.fill();

      // 8. Golden sunburst center dot
      ctx.beginPath();
      ctx.arc(x, y, r * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.fill();
    };

    // Reusable Helper: Bamboo Stick Joint (竹節，支援角度旋轉)
    const drawBambooStick = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
      color: string,
      nodeColor: string = '#ffffff',
      angle: number = 0
    ) => {
      ctx.save();
      ctx.translate(x, y);
      if (angle !== 0) {
        ctx.rotate(angle);
      }

      const halfW = w / 2;
      const halfH = h / 2;

      // 1. Bamboo stick main shaft
      ctx.fillStyle = color;
      ctx.fillRect(-halfW + 0.5, -halfH + 1, w - 1, h - 2);

      // 2. Top & Bottom flared nodes (rounded knobs)
      ctx.beginPath();
      ctx.arc(0, -halfH + 1.2, halfW * 0.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, halfH - 1.2, halfW * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // 3. Center joint band (white with accent dot)
      ctx.fillStyle = nodeColor;
      ctx.fillRect(-halfW, -0.75, w, 1.5);

      // 4. Center accent dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, 0.75, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    // Reusable Helper: 1s Perched Sparrow / Bird (麻雀鳥)
    const drawBirdOneBamboo = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      const curve = (cpx: number, cpy: number, endX: number, endY: number) => {
        if (typeof ctx.quadraticCurveTo === 'function') {
          ctx.quadraticCurveTo(cpx, cpy, endX, endY);
        } else {
          ctx.lineTo(endX, endY);
        }
      };

      // 1. Bamboo perch branch at the bottom
      ctx.fillStyle = '#15803d';
      ctx.fillRect(x - 9, y + 11, 18, 3);

      // 2. Flowing Tail feathers (3 curved plumes in Green, Red, Blue)
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(x - 2, y + 5);
      curve(x - 7, y + 9, x - 10, y + 16);
      curve(x - 5, y + 11, x - 1, y + 7);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(x - 1, y + 6);
      curve(x - 4, y + 12, x - 6, y + 19);
      curve(x - 2, y + 13, x, y + 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(x, y + 7);
      curve(x - 2, y + 13, x - 3, y + 20);
      curve(x - 1, y + 14, x + 1, y + 8);
      ctx.closePath();
      ctx.fill();

      // 3. Bird Body & Wings
      // Body (Ruby Red)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x, y + 3, 5.8, 0, Math.PI * 2);
      ctx.fill();

      // Wing (Emerald Green with gold rim)
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(x - 1.5, y + 3, 4.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(x - 1.5, y + 2, 2, 0, Math.PI * 2);
      ctx.fill();

      // 4. Bird Chest (Gold/Orange breast)
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(x + 2.5, y + 3, 3.2, 0, Math.PI * 2);
      ctx.fill();

      // 5. Bird Head (Emerald Green)
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(x + 3, y - 6, 4.2, 0, Math.PI * 2);
      ctx.fill();

      // 6. Beak (Cinnabar Red triangle pointing right)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(x + 6, y - 7.5);
      ctx.lineTo(x + 11, y - 6);
      ctx.lineTo(x + 6, y - 4.5);
      ctx.closePath();
      ctx.fill();

      // 7. Eye (White circle + Black pupil)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + 3.8, y - 6.8, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x + 4.2, y - 6.8, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // 8. Head Crest / Crown feathers (Red & Gold)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(x + 1, y - 10);
      ctx.lineTo(x - 2, y - 14);
      ctx.lineTo(x + 2, y - 10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(x - 2, y - 14, 1.2, 0, Math.PI * 2);
      ctx.fill();
    };

    // 4. Dots (1p ~ 9p) - Authentic Traditional Concentric Circles & Rosettes
    // 1p (Big Dot / 大餅 with outer enclosing green ring)
    createTileCanvas('mahjong:tile_1p', (ctx) => {
      drawBigDot(ctx, cx, cy, 14);
    });

    // 2p (Top Green, Bottom Blue)
    createTileCanvas('mahjong:tile_2p', (ctx) => {
      drawDot(ctx, cx, cy - 9, 5.0, '#15803d');
      drawDot(ctx, cx, cy + 9, 5.0, '#0284c7');
    });

    // 3p (Diagonal: Top-Left Blue, Center Red, Bottom-Right Green)
    createTileCanvas('mahjong:tile_3p', (ctx) => {
      drawDot(ctx, cx - 7, cy - 10, 4.4, '#0284c7');
      drawDot(ctx, cx, cy, 4.4, '#dc2626');
      drawDot(ctx, cx + 7, cy + 10, 4.4, '#15803d');
    });

    // 4p (4 Dots: Top-Left Blue, Top-Right Green, Bottom-Left Green, Bottom-Right Blue)
    createTileCanvas('mahjong:tile_4p', (ctx) => {
      drawDot(ctx, cx - 7, cy - 9, 4.4, '#0284c7');
      drawDot(ctx, cx + 7, cy - 9, 4.4, '#15803d');
      drawDot(ctx, cx - 7, cy + 9, 4.4, '#15803d');
      drawDot(ctx, cx + 7, cy + 9, 4.4, '#0284c7');
    });

    // 5p (4 outer corners Blue/Green + 1 center Red dot)
    createTileCanvas('mahjong:tile_5p', (ctx) => {
      drawDot(ctx, cx - 7.5, cy - 10, 4.0, '#0284c7');
      drawDot(ctx, cx + 7.5, cy - 10, 4.0, '#15803d');
      drawDot(ctx, cx, cy, 4.6, '#dc2626', '#facc15');
      drawDot(ctx, cx - 7.5, cy + 10, 4.0, '#15803d');
      drawDot(ctx, cx + 7.5, cy + 10, 4.0, '#0284c7');
    });

    // 6p (Top 2 Green, Bottom 4 Red with clear vertical separation)
    createTileCanvas('mahjong:tile_6p', (ctx) => {
      // Top 2 Green (separated from bottom)
      drawDot(ctx, cx - 6.5, cy - 12, 4.0, '#15803d');
      drawDot(ctx, cx + 6.5, cy - 12, 4.0, '#15803d');

      // Bottom 4 Red
      drawDot(ctx, cx - 6.5, cy + 2, 4.0, '#dc2626');
      drawDot(ctx, cx + 6.5, cy + 2, 4.0, '#dc2626');
      drawDot(ctx, cx - 6.5, cy + 12, 4.0, '#dc2626');
      drawDot(ctx, cx + 6.5, cy + 12, 4.0, '#dc2626');
    });

    // 7p (Top 3 slanted ALL GREEN + Bottom 4 square RED)
    createTileCanvas('mahjong:tile_7p', (ctx) => {
      // Top 3 slanted ALL GREEN
      drawDot(ctx, cx - 8, cy - 12, 3.6, '#15803d');
      drawDot(ctx, cx, cy - 9, 3.6, '#15803d');
      drawDot(ctx, cx + 8, cy - 6, 3.6, '#15803d');

      // Bottom 4 RED
      drawDot(ctx, cx - 6.5, cy + 5, 3.8, '#dc2626');
      drawDot(ctx, cx + 6.5, cy + 5, 3.8, '#dc2626');
      drawDot(ctx, cx - 6.5, cy + 13.5, 3.8, '#dc2626');
      drawDot(ctx, cx + 6.5, cy + 13.5, 3.8, '#dc2626');
    });

    // 8p (2 columns of 4 Blue dots)
    createTileCanvas('mahjong:tile_8p', (ctx) => {
      const yOffsets = [-13.5, -4.5, 4.5, 13.5];
      for (const dy of yOffsets) {
        drawDot(ctx, cx - 6.5, cy + dy, 3.5, '#0284c7');
        drawDot(ctx, cx + 6.5, cy + dy, 3.5, '#0284c7');
      }
    });

    // 9p (3x3 grid: Top Row 3 Blue, Middle Row 3 Red, Bottom Row 3 Green)
    createTileCanvas('mahjong:tile_9p', (ctx) => {
      const xOffsets = [-7.5, 0, 7.5];
      // Row 1 (Top): Blue
      for (const dx of xOffsets) {
        drawDot(ctx, cx + dx, cy - 11, 3.7, '#0284c7');
      }
      // Row 2 (Middle): Red
      for (const dx of xOffsets) {
        drawDot(ctx, cx + dx, cy, 3.7, '#dc2626');
      }
      // Row 3 (Bottom): Green
      for (const dx of xOffsets) {
        drawDot(ctx, cx + dx, cy + 11, 3.7, '#15803d');
      }
    });

    // 5. Bamboo (1s ~ 9s) - Authentic Traditional Perched Bird & Bamboo Joints
    // 1s (Traditional Perched Sparrow / Bird)
    createTileCanvas('mahjong:tile_1s', (ctx) => {
      drawBirdOneBamboo(ctx, cx, cy);
    });

    // 2s (Top Green, Bottom Blue)
    createTileCanvas('mahjong:tile_2s', (ctx) => {
      drawBambooStick(ctx, cx, cy - 9, 5.0, 13, '#15803d', '#dc2626');
      drawBambooStick(ctx, cx, cy + 9, 5.0, 13, '#0284c7', '#dc2626');
    });

    // 3s (Top Blue, Bottom 2 Green)
    createTileCanvas('mahjong:tile_3s', (ctx) => {
      drawBambooStick(ctx, cx, cy - 9, 4.8, 12, '#0284c7', '#dc2626');
      drawBambooStick(ctx, cx - 6.5, cy + 9, 4.8, 12, '#15803d', '#dc2626');
      drawBambooStick(ctx, cx + 6.5, cy + 9, 4.8, 12, '#15803d', '#dc2626');
    });

    // 4s (Top-Left Green, Top-Right Blue, Bottom-Left Blue, Bottom-Right Green)
    createTileCanvas('mahjong:tile_4s', (ctx) => {
      drawBambooStick(ctx, cx - 6.5, cy - 9, 4.5, 12.5, '#15803d');
      drawBambooStick(ctx, cx + 6.5, cy - 9, 4.5, 12.5, '#0284c7');
      drawBambooStick(ctx, cx - 6.5, cy + 9, 4.5, 12.5, '#0284c7');
      drawBambooStick(ctx, cx + 6.5, cy + 9, 4.5, 12.5, '#15803d');
    });

    // 5s (4 Corners Green/Blue + Center Red with Gold Node)
    createTileCanvas('mahjong:tile_5s', (ctx) => {
      drawBambooStick(ctx, cx - 7.5, cy - 10, 4.2, 11.5, '#15803d');
      drawBambooStick(ctx, cx + 7.5, cy - 10, 4.2, 11.5, '#0284c7');
      drawBambooStick(ctx, cx, cy, 4.6, 12, '#dc2626', '#facc15');
      drawBambooStick(ctx, cx - 7.5, cy + 10, 4.2, 11.5, '#0284c7');
      drawBambooStick(ctx, cx + 7.5, cy + 10, 4.2, 11.5, '#15803d');
    });

    // 6s (All 6 Bamboo Sticks are Green)
    createTileCanvas('mahjong:tile_6s', (ctx) => {
      // Top 3 Green
      drawBambooStick(ctx, cx - 7.5, cy - 9, 4.0, 12, '#15803d');
      drawBambooStick(ctx, cx, cy - 9, 4.0, 12, '#15803d');
      drawBambooStick(ctx, cx + 7.5, cy - 9, 4.0, 12, '#15803d');

      // Bottom 3 Green
      drawBambooStick(ctx, cx - 7.5, cy + 9, 4.0, 12, '#15803d');
      drawBambooStick(ctx, cx, cy + 9, 4.0, 12, '#15803d');
      drawBambooStick(ctx, cx + 7.5, cy + 9, 4.0, 12, '#15803d');
    });

    // 7s (1 / 3 / 3 Stacking: Top 1 Red, Middle 3 Green, Bottom 3 Green)
    createTileCanvas('mahjong:tile_7s', (ctx) => {
      // Top 1 Red
      drawBambooStick(ctx, cx, cy - 13, 4.0, 8.5, '#dc2626');

      // Middle 3 Green
      drawBambooStick(ctx, cx - 7.5, cy, 3.8, 8.5, '#15803d');
      drawBambooStick(ctx, cx, cy, 3.8, 8.5, '#15803d');
      drawBambooStick(ctx, cx + 7.5, cy, 3.8, 8.5, '#15803d');

      // Bottom 3 Green
      drawBambooStick(ctx, cx - 7.5, cy + 12, 3.8, 8.5, '#15803d');
      drawBambooStick(ctx, cx, cy + 12, 3.8, 8.5, '#15803d');
      drawBambooStick(ctx, cx + 7.5, cy + 12, 3.8, 8.5, '#15803d');
    });

    // 8s (Horizontal Mirror Symmetric M / W: Outer sticks vertical, Inner sticks slanted, All Green)
    createTileCanvas('mahjong:tile_8s', (ctx) => {
      const rot = 0.42; // ~24 degrees for inner diagonal sticks
      // Top 4 Green (M shape: | \ / |)
      drawBambooStick(ctx, cx - 8.5, cy - 9, 3.8, 11, '#15803d', '#ffffff', 0); // Left outer straight
      drawBambooStick(ctx, cx - 2.8, cy - 9, 3.8, 11, '#15803d', '#ffffff', rot); // Left inner slanted down-right \
      drawBambooStick(ctx, cx + 2.8, cy - 9, 3.8, 11, '#15803d', '#ffffff', -rot); // Right inner slanted down-left /
      drawBambooStick(ctx, cx + 8.5, cy - 9, 3.8, 11, '#15803d', '#ffffff', 0); // Right outer straight

      // Bottom 4 Green (W shape / Horizontal Mirror of M: | / \ |)
      drawBambooStick(ctx, cx - 8.5, cy + 9, 3.8, 11, '#15803d', '#ffffff', 0); // Left outer straight
      drawBambooStick(ctx, cx - 2.8, cy + 9, 3.8, 11, '#15803d', '#ffffff', -rot); // Left inner slanted up-right /
      drawBambooStick(ctx, cx + 2.8, cy + 9, 3.8, 11, '#15803d', '#ffffff', rot); // Right inner slanted up-left \
      drawBambooStick(ctx, cx + 8.5, cy + 9, 3.8, 11, '#15803d', '#ffffff', 0); // Right outer straight
    });

    // 9s (3x3 grid: Left Green, Middle Red, Right Blue)
    createTileCanvas('mahjong:tile_9s', (ctx) => {
      const yOffsets = [-11, 0, 11];
      for (const dy of yOffsets) {
        drawBambooStick(ctx, cx - 7.5, cy + dy, 4.0, 9.5, '#15803d');
        drawBambooStick(ctx, cx, cy + dy, 4.0, 9.5, '#dc2626');
        drawBambooStick(ctx, cx + 7.5, cy + dy, 4.0, 9.5, '#0284c7');
      }
    });

    // 6. Winds (East, South, West, North) - 蒼黑
    const winds = [
      { key: 'east', char: '東' },
      { key: 'south', char: '南' },
      { key: 'west', char: '西' },
      { key: 'north', char: '北' },
    ];
    winds.forEach(({ key, char }) => {
      createTileCanvas(`mahjong:tile_${key}`, (ctx) => {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 18px "Microsoft JhengHei", "Songti TC", serif';
        ctx.fillStyle = '#0f172a'; // Deep Black
        ctx.fillText(char, W / 2 - 1, H / 2 - 1);
      });
    });

    // 7. Dragons (Red, Green, White)
    const dragons = [
      { key: 'red', char: '中', color: '#dc2626' },
      { key: 'green', char: '發', color: '#16a34a' },
      { key: 'white', char: '白', color: '#0284c7' },
    ];
    dragons.forEach(({ key, char, color }) => {
      createTileCanvas(`mahjong:tile_${key}`, (ctx) => {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (key === 'white') {
          // White Dragon Box
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 2.5;
          if (typeof ctx.strokeRect === 'function') {
            ctx.strokeRect(W / 2 - 9, H / 2 - 13, 16, 24);
          } else if (typeof ctx.rect === 'function') {
            ctx.beginPath();
            ctx.rect(W / 2 - 9, H / 2 - 13, 16, 24);
            ctx.stroke?.();
          }
        } else {
          ctx.font = 'bold 19px "Microsoft JhengHei", "Songti TC", serif';
          ctx.fillStyle = color;
          ctx.fillText?.(char, W / 2 - 1, H / 2 - 1);
        }
      });
    });

    // 8. Flowers (Spring1~Winter4, Plum1~Chrysanthemum4)
    const flowers = [
      { key: 'spring', char: '春', num: '1', color: '#ea580c' },
      { key: 'summer', char: '夏', num: '2', color: '#ea580c' },
      { key: 'autumn', char: '秋', num: '3', color: '#ea580c' },
      { key: 'winter', char: '冬', num: '4', color: '#ea580c' },
      { key: 'plum', char: '梅', num: '1', color: '#ca8a04' },
      { key: 'orchid', char: '蘭', num: '2', color: '#ca8a04' },
      { key: 'bamboo_f', char: '竹', num: '3', color: '#ca8a04' },
      { key: 'chrysanthemum', char: '菊', num: '4', color: '#ca8a04' },
    ];
    flowers.forEach(({ key, char, num, color }) => {
      createTileCanvas(`mahjong:tile_${key}`, (ctx) => {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 15px "Microsoft JhengHei", "Songti TC", serif';
        ctx.fillStyle = color;
        ctx.fillText(char, W / 2 - 1, H / 2 - 7);

        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = '#7c2d12';
        ctx.fillText(num, W / 2 - 1, H / 2 + 10);
      });
    });

    // 9. Flower Rack Slot Cell Frame
    if (!this.textures.exists('mahjong:flower_cell')) {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        this.drawRoundedRect(ctx, 1, 1, W - 2, H - 2, 3);
        ctx.fill();

        ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash?.([2, 2]);
        ctx.stroke?.();
        ctx.setLineDash?.([]);

        if (typeof this.textures.addCanvas === 'function') {
          this.textures.addCanvas('mahjong:flower_cell', canvas);
        }
      }
    }

    // 10. Central Square HUD Wind Compass (156 x 156)
    if (!this.textures.exists('mahjong:compass_dial')) {
      const canvas = document.createElement('canvas');
      canvas.width = 156;
      canvas.height = 156;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Outer dark slate bezel
        ctx.fillStyle = '#0f172a';
        this.drawRoundedRect(ctx, 0, 0, 156, 156, 12);
        ctx.fill();

        // Golden outer rim
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2.5;
        this.drawRoundedRect(ctx, 3, 3, 150, 150, 10);
        ctx.stroke();

        // Inner center core plate for round wind / tile count (Emerald core)
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.arc(78, 78, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (typeof this.textures.addCanvas === 'function') {
          this.textures.addCanvas('mahjong:compass_dial', canvas);
        }
      }
    }

    // 11. Dice Textures (1 ~ 6)
    for (let i = 1; i <= 6; i++) {
      const key = `mahjong:dice_${i}`;
      if (!this.textures.exists(key)) {
        const canvas = document.createElement('canvas');
        canvas.width = 30;
        canvas.height = 30;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Dice Body
          ctx.fillStyle = '#ffffff';
          this.drawRoundedRect(ctx, 1, 1, 28, 28, 4);
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Dots
          ctx.fillStyle = i === 1 || i === 4 ? '#dc2626' : '#0f172a';
          const p = [
            [],
            [[15, 15]],
            [[8, 8], [22, 22]],
            [[8, 8], [15, 15], [22, 22]],
            [[8, 8], [22, 8], [8, 22], [22, 22]],
            [[8, 8], [22, 8], [15, 15], [8, 22], [22, 22]],
            [[8, 7], [22, 7], [8, 15], [22, 15], [8, 23], [22, 23]],
          ][i];

          p.forEach(([dx, dy]) => {
            ctx.beginPath();
            ctx.arc(dx, dy, i === 1 ? 4 : 2.5, 0, Math.PI * 2);
            ctx.fill();
          });

          if (typeof this.textures.addCanvas === 'function') {
            this.textures.addCanvas(key, canvas);
          }
        }
      }
    }

    // 12. Action Buttons (Chow, Pong, Kong, Ting, Hu, Pass)
    const actionBtns = [
      { key: 'action_btn_chow', label: '吃', bg: '#2563eb' },
      { key: 'action_btn_pong', label: '碰', bg: '#059669' },
      { key: 'action_btn_kong', label: '槓', bg: '#d97706' },
      { key: 'action_btn_ting', label: '聽', bg: '#7c3aed' },
      { key: 'action_btn_hu', label: '胡', bg: '#dc2626' },
      { key: 'action_btn_pass', label: '過', bg: '#475569' },
    ];
    actionBtns.forEach(({ key, label, bg }) => {
      const textureKey = `mahjong:${key}`;
      if (!this.textures.exists(textureKey)) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 36;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = bg;
          this.drawRoundedRect(ctx, 0, 0, 64, 36, 6);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          this.drawRoundedRect(ctx, 1.5, 1.5, 61, 33, 5);
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px "Microsoft JhengHei", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, 32, 18);

          if (typeof this.textures.addCanvas === 'function') {
            this.textures.addCanvas(textureKey, canvas);
          }
        }
      }
    });

    // 13. 3D Wall Tile Blocks
    if (!this.textures.exists('mahjong:wall_tile_stack')) {
      const canvas = document.createElement('canvas');
      canvas.width = 22;
      canvas.height = 30;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Lower tile
        ctx.fillStyle = '#0f5132';
        this.drawRoundedRect(ctx, 1, 12, 20, 16, 2);
        ctx.fill();
        ctx.strokeStyle = '#15803d';
        ctx.stroke();

        // Upper tile
        ctx.fillStyle = '#15803d';
        this.drawRoundedRect(ctx, 1, 1, 20, 16, 2);
        ctx.fill();
        ctx.strokeStyle = '#4ade80';
        ctx.stroke();

        // Top ivory face rim
        ctx.fillStyle = '#f8fafc';
        this.drawRoundedRect(ctx, 3, 3, 16, 3, 1);
        ctx.fill();

        if (typeof this.textures.addCanvas === 'function') {
          this.textures.addCanvas('mahjong:wall_tile_stack', canvas);
        }
      }
    }

    // 14. Casino Leather & Gold Dice Cup (骰盅)
    if (!this.textures.exists('mahjong:dice_cup')) {
      const canvas = document.createElement('canvas');
      canvas.width = 110;
      canvas.height = 130;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        this.drawEllipse(ctx, 55, 120, 48, 10);
        ctx.fill();

        // Cup Body (Tapered Cylinder)
        const cupGrad = ctx.createLinearGradient(15, 0, 95, 0);
        cupGrad.addColorStop(0, '#1c0b05');
        cupGrad.addColorStop(0.2, '#451a03');
        cupGrad.addColorStop(0.5, '#78350f');
        cupGrad.addColorStop(0.8, '#451a03');
        cupGrad.addColorStop(1, '#0f0502');

        ctx.beginPath();
        ctx.moveTo(28, 16);
        ctx.lineTo(82, 16);
        this.drawQuadraticCurveTo(ctx, 94, 60, 98, 112);
        this.drawQuadraticCurveTo(ctx, 55, 122, 12, 112);
        this.drawQuadraticCurveTo(ctx, 16, 60, 28, 16);
        ctx.closePath();
        ctx.fillStyle = cupGrad;
        ctx.fill();

        // Gold Trim Bands
        const drawGoldBand = (y: number, w: number, curvature: number) => {
          const goldGrad = ctx.createLinearGradient(55 - w / 2, y, 55 + w / 2, y);
          goldGrad.addColorStop(0, '#92400e');
          goldGrad.addColorStop(0.3, '#f59e0b');
          goldGrad.addColorStop(0.5, '#fef08a');
          goldGrad.addColorStop(0.7, '#fbbf24');
          goldGrad.addColorStop(1, '#78350f');

          ctx.fillStyle = goldGrad;
          this.drawEllipse(ctx, 55, y, w / 2, curvature);
          ctx.fill();
        };

        // Top Gold Knob / Finial
        drawGoldBand(14, 38, 4);
        drawGoldBand(18, 56, 3);
        // Mid Decorative Gold Ring
        drawGoldBand(64, 82, 5);
        // Bottom Opening Rim (Heavy Gold Lip)
        drawGoldBand(112, 88, 7);

        // Cup Body Specular Highlight (Left edge sheen)
        const sheenGrad = ctx.createLinearGradient(28, 0, 50, 0);
        sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
        sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sheenGrad;
        ctx.beginPath();
        ctx.moveTo(28, 22);
        ctx.lineTo(44, 22);
        ctx.lineTo(34, 108);
        ctx.lineTo(18, 108);
        ctx.closePath();
        ctx.fill();

        if (typeof this.textures.addCanvas === 'function') {
          this.textures.addCanvas('mahjong:dice_cup', canvas);
        }
      }
    }

    // 15. Casino Velvet Dice Tray Base (骰托)
    if (!this.textures.exists('mahjong:dice_tray')) {
      const canvas = document.createElement('canvas');
      canvas.width = 240;
      canvas.height = 140;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Outer Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        this.drawEllipse(ctx, 120, 75, 112, 58);
        ctx.fill();

        // Mahogany & Gold Outer Rim
        const rimGrad = ctx.createLinearGradient(0, 0, 240, 140);
        rimGrad.addColorStop(0, '#b45309');
        rimGrad.addColorStop(0.5, '#78350f');
        rimGrad.addColorStop(1, '#451a03');

        this.drawEllipse(ctx, 120, 70, 110, 55);
        ctx.fillStyle = rimGrad;
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#fbbf24';
        ctx.stroke();

        // Inner Emerald Green Velvet Felt
        const feltGrad =
          typeof ctx.createRadialGradient === 'function'
            ? ctx.createRadialGradient(120, 70, 10, 120, 70, 95)
            : ctx.createLinearGradient(0, 0, 240, 140);
        feltGrad.addColorStop(0, '#065f46');
        feltGrad.addColorStop(0.8, '#064e3b');
        feltGrad.addColorStop(1, '#022c22');

        this.drawEllipse(ctx, 120, 70, 96, 46);
        ctx.fillStyle = feltGrad;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#34d399';
        ctx.stroke();

        if (typeof this.textures.addCanvas === 'function') {
          this.textures.addCanvas('mahjong:dice_tray', canvas);
        }
      }
    }
  }

  private drawEllipse(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    rx: number,
    ry: number
  ): void {
    if (typeof ctx.ellipse === 'function') {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      return;
    }
    ctx.beginPath();
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(rx, ry);
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.restore();
  }

  private drawQuadraticCurveTo(
    ctx: CanvasRenderingContext2D,
    cpx: number,
    cpy: number,
    x: number,
    y: number
  ): void {
    if (typeof ctx.quadraticCurveTo === 'function') {
      ctx.quadraticCurveTo(cpx, cpy, x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    if (typeof ctx.quadraticCurveTo === 'function') {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      return;
    }
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.closePath();
  }
}
