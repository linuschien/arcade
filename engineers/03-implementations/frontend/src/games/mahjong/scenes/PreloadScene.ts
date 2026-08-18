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

    // 4. Dots (1p ~ 9p) - 湛藍 & 硃砂紅
    for (let i = 1; i <= 9; i++) {
      createTileCanvas(`mahjong:tile_${i}p`, (ctx) => {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.font = 'bold 13px "Microsoft JhengHei", "Songti TC", serif';
        ctx.fillStyle = '#0284c7'; // Azure Blue
        ctx.fillText(numChars[i], W / 2 - 1, H / 2 - 8);

        ctx.font = 'bold 12px "Microsoft JhengHei", "Songti TC", serif';
        ctx.fillStyle = '#0284c7';
        ctx.fillText('筒', W / 2 - 1, H / 2 + 8);
      });
    }

    // 5. Bamboo (1s ~ 9s) - 翠竹綠
    for (let i = 1; i <= 9; i++) {
      createTileCanvas(`mahjong:tile_${i}s`, (ctx) => {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (i === 1) {
          // 1 Bird / 一索
          ctx.font = 'bold 14px "Microsoft JhengHei", "Songti TC", serif';
          ctx.fillStyle = '#15803d'; // Bamboo Green
          ctx.fillText('一', W / 2 - 1, H / 2 - 8);

          ctx.font = 'bold 13px "Microsoft JhengHei", "Songti TC", serif';
          ctx.fillStyle = '#dc2626'; // Red bird beak
          ctx.fillText('鳥', W / 2 - 1, H / 2 + 8);
        } else {
          ctx.font = 'bold 13px "Microsoft JhengHei", "Songti TC", serif';
          ctx.fillStyle = '#15803d';
          ctx.fillText(numChars[i], W / 2 - 1, H / 2 - 8);

          ctx.font = 'bold 12px "Microsoft JhengHei", "Songti TC", serif';
          ctx.fillStyle = '#15803d';
          ctx.fillText('條', W / 2 - 1, H / 2 + 8);
        }
      });
    }

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

    // 10. Central Octagonal Wind Compass (140 x 140)
    if (!this.textures.exists('mahjong:compass_dial')) {
      const canvas = document.createElement('canvas');
      canvas.width = 140;
      canvas.height = 140;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Outer dark wood bezel
        ctx.fillStyle = '#0f172a';
        this.drawRoundedRect(ctx, 0, 0, 140, 140, 16);
        ctx.fill();

        // Golden rim
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;
        this.drawRoundedRect(ctx, 4, 4, 132, 132, 12);
        ctx.stroke();

        // Inner center plate
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.arc(70, 70, 48, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
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
