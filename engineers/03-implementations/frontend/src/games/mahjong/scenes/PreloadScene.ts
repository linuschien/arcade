/**
 * PreloadScene.ts
 * Procedurally generates high-definition 2.5D ivory acrylic Mahjong tile textures,
 * octagonal wind compass, emerald green felt, dice, and action buttons.
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

    // 1. Base Tile Blank Face (Ivory 2.5D acrylic with bevel & shadow)
    if (!this.textures.exists('mahjong:tile_face_base')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Drop shadow
      gfx.fillStyle(0x020f08, 0.6);
      gfx.fillRoundedRect(2, 2, W - 2, H - 2, 4);

      // Ivory acrylic base
      gfx.fillStyle(0xf8fafc, 1);
      gfx.fillRoundedRect(0, 0, W - 2, H - 2, 4);

      // 3D Bevel highlight
      gfx.lineStyle(1, 0xffffff, 0.9);
      gfx.strokeRoundedRect(1, 1, W - 4, H - 4, 3);

      // Inner card recess
      gfx.lineStyle(1, 0xcfd8dc, 0.8);
      gfx.strokeRoundedRect(3, 3, W - 8, H - 8, 2);

      gfx.generateTexture('mahjong:tile_face_base', W, H);
      gfx.destroy();
    }

    // 2. Tile Back (Jade green with golden bamboo pattern)
    if (!this.textures.exists('mahjong:tile_back')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      // Drop shadow
      gfx.fillStyle(0x020f08, 0.6);
      gfx.fillRoundedRect(2, 2, W - 2, H - 2, 4);

      // Jade green base
      gfx.fillStyle(0x0f5132, 1);
      gfx.fillRoundedRect(0, 0, W - 2, H - 2, 4);

      // Emerald inner trim
      gfx.lineStyle(1, 0x22c55e, 0.8);
      gfx.strokeRoundedRect(2, 2, W - 6, H - 6, 3);

      // Golden diamond emblem in center
      gfx.fillStyle(0xd4af37, 0.9);
      gfx.beginPath();
      gfx.moveTo(W / 2 - 1, H / 2 - 8);
      gfx.lineTo(W / 2 + 7, H / 2 - 1);
      gfx.lineTo(W / 2 - 1, H / 2 + 6);
      gfx.lineTo(W / 2 - 9, H / 2 - 1);
      gfx.closePath();
      gfx.fillPath();

      gfx.generateTexture('mahjong:tile_back', W, H);
      gfx.destroy();
    }

    // 3. Characters (1m ~ 9m) - 硃砂紅
    const numChars = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    for (let i = 1; i <= 9; i++) {
      const key = `mahjong:tile_${i}m`;
      if (!this.textures.exists(key)) {
        const rt = this.make.renderTexture({ width: W, height: H });
        rt.draw('mahjong:tile_face_base', 0, 0);

        const txt = this.make.text({
          x: W / 2 - 1,
          y: H / 2 - 1,
          text: `${numChars[i]}\n萬`,
          style: {
            fontSize: '13px',
            fontFamily: 'serif, STKaiti, "Songti TC", "Microsoft JhengHei"',
            color: '#b91c1c', // Cinnabar Red
            align: 'center',
            fontStyle: 'bold',
          },
          add: false,
        });
        txt.setOrigin(0.5);
        rt.draw(txt);
        rt.saveTexture(key);
        txt.destroy();
        rt.destroy();
      }
    }

    // 4. Dots (1p ~ 9p) - 深青藍 & 硃砂紅
    for (let i = 1; i <= 9; i++) {
      const key = `mahjong:tile_${i}p`;
      if (!this.textures.exists(key)) {
        const rt = this.make.renderTexture({ width: W, height: H });
        rt.draw('mahjong:tile_face_base', 0, 0);

        const txt = this.make.text({
          x: W / 2 - 1,
          y: H / 2 - 1,
          text: `${numChars[i]}\n筒`,
          style: {
            fontSize: '13px',
            fontFamily: 'serif, STKaiti, "Songti TC", "Microsoft JhengHei"',
            color: '#0369a1', // Azure Blue
            align: 'center',
            fontStyle: 'bold',
          },
          add: false,
        });
        txt.setOrigin(0.5);
        rt.draw(txt);
        rt.saveTexture(key);
        txt.destroy();
        rt.destroy();
      }
    }

    // 5. Bamboo (1s ~ 9s) - 竹綠
    for (let i = 1; i <= 9; i++) {
      const key = `mahjong:tile_${i}s`;
      if (!this.textures.exists(key)) {
        const rt = this.make.renderTexture({ width: W, height: H });
        rt.draw('mahjong:tile_face_base', 0, 0);

        const txt = this.make.text({
          x: W / 2 - 1,
          y: H / 2 - 1,
          text: i === 1 ? '一\n索' : `${numChars[i]}\n條`,
          style: {
            fontSize: '13px',
            fontFamily: 'serif, STKaiti, "Songti TC", "Microsoft JhengHei"',
            color: '#15803d', // Bamboo Green
            align: 'center',
            fontStyle: 'bold',
          },
          add: false,
        });
        txt.setOrigin(0.5);
        rt.draw(txt);
        rt.saveTexture(key);
        txt.destroy();
        rt.destroy();
      }
    }

    // 6. Winds (East, South, West, North)
    const winds = [
      { key: 'east', char: '東', color: '#0f172a' },
      { key: 'south', char: '南', color: '#0f172a' },
      { key: 'west', char: '西', color: '#0f172a' },
      { key: 'north', char: '北', color: '#0f172a' },
    ];
    winds.forEach(({ key, char, color }) => {
      const textureKey = `mahjong:tile_${key}`;
      if (!this.textures.exists(textureKey)) {
        const rt = this.make.renderTexture({ width: W, height: H });
        rt.draw('mahjong:tile_face_base', 0, 0);

        const txt = this.make.text({
          x: W / 2 - 1,
          y: H / 2 - 1,
          text: char,
          style: {
            fontSize: '18px',
            fontFamily: 'serif, STKaiti, "Songti TC", "Microsoft JhengHei"',
            color,
            fontStyle: 'bold',
          },
          add: false,
        });
        txt.setOrigin(0.5);
        rt.draw(txt);
        rt.saveTexture(textureKey);
        txt.destroy();
        rt.destroy();
      }
    });

    // 7. Dragons (Red, Green, White)
    const dragons = [
      { key: 'red', char: '中', color: '#dc2626' },
      { key: 'green', char: '發', color: '#16a34a' },
      { key: 'white', char: '白', color: '#0284c7' },
    ];
    dragons.forEach(({ key, char, color }) => {
      const textureKey = `mahjong:tile_${key}`;
      if (!this.textures.exists(textureKey)) {
        const rt = this.make.renderTexture({ width: W, height: H });
        rt.draw('mahjong:tile_face_base', 0, 0);

        const txt = this.make.text({
          x: W / 2 - 1,
          y: H / 2 - 1,
          text: char,
          style: {
            fontSize: '18px',
            fontFamily: 'serif, STKaiti, "Songti TC", "Microsoft JhengHei"',
            color,
            fontStyle: 'bold',
          },
          add: false,
        });
        txt.setOrigin(0.5);
        rt.draw(txt);
        rt.saveTexture(textureKey);
        txt.destroy();
        rt.destroy();
      }
    });

    // 8. Flowers (Seasons 1..4, Plants 1..4)
    const flowers = [
      { key: 'spring', char: '春1', color: '#ea580c' },
      { key: 'summer', char: '夏2', color: '#ea580c' },
      { key: 'autumn', char: '秋3', color: '#ea580c' },
      { key: 'winter', char: '冬4', color: '#ea580c' },
      { key: 'plum', char: '梅1', color: '#ca8a04' },
      { key: 'orchid', char: '蘭2', color: '#ca8a04' },
      { key: 'bamboo_f', char: '竹3', color: '#ca8a04' },
      { key: 'chrysanthemum', char: '菊4', color: '#ca8a04' },
    ];
    flowers.forEach(({ key, char, color }) => {
      const textureKey = `mahjong:tile_${key}`;
      if (!this.textures.exists(textureKey)) {
        const rt = this.make.renderTexture({ width: W, height: H });
        rt.draw('mahjong:tile_face_base', 0, 0);

        const txt = this.make.text({
          x: W / 2 - 1,
          y: H / 2 - 1,
          text: char,
          style: {
            fontSize: '13px',
            fontFamily: 'serif, STKaiti, "Songti TC", "Microsoft JhengHei"',
            color,
            fontStyle: 'bold',
          },
          add: false,
        });
        txt.setOrigin(0.5);
        rt.draw(txt);
        rt.saveTexture(textureKey);
        txt.destroy();
        rt.destroy();
      }
    });

    // 9. Central Octagonal Wind Compass (140 x 140)
    if (!this.textures.exists('mahjong:compass_dial')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      const CW = 140;
      const CH = 140;

      // Dark Wood / Brass bevel base
      gfx.fillStyle(0x1e293b, 1);
      gfx.fillRoundedRect(0, 0, CW, CH, 16);

      // Gold Octagonal Border
      gfx.lineStyle(2, 0xd4af37, 1);
      gfx.strokeRoundedRect(4, 4, CW - 8, CH - 8, 12);

      // Inner Emerald Center Plate
      gfx.fillStyle(0x064e3b, 1);
      gfx.fillCircle(CW / 2, CH / 2, 45);
      gfx.lineStyle(1, 0x10b981, 0.8);
      gfx.strokeCircle(CW / 2, CH / 2, 45);

      gfx.generateTexture('mahjong:compass_dial', CW, CH);
      gfx.destroy();
    }

    // 10. Action Buttons (Chow, Pong, Kong, Ting, Hu, Pass)
    const actionBtns = [
      { key: 'action_btn_chow', label: '吃', bg: 0x2563eb },
      { key: 'action_btn_pong', label: '碰', bg: 0x059669 },
      { key: 'action_btn_kong', label: '槓', bg: 0xd97706 },
      { key: 'action_btn_ting', label: '聽', bg: 0x7c3aed },
      { key: 'action_btn_hu', label: '胡', bg: 0xdc2626 },
      { key: 'action_btn_pass', label: '過', bg: 0x475569 },
    ];
    actionBtns.forEach(({ key, label, bg }) => {
      const textureKey = `mahjong:${key}`;
      if (!this.textures.exists(textureKey)) {
        const BW = 56;
        const BH = 56;
        const gfx = this.make.graphics({ x: 0, y: 0 });
        gfx.fillStyle(bg, 1);
        gfx.fillCircle(BW / 2, BH / 2, 25);
        gfx.lineStyle(2, 0xffffff, 0.9);
        gfx.strokeCircle(BW / 2, BH / 2, 25);

        const rt = this.make.renderTexture({ width: BW, height: BH });
        rt.draw(gfx);
        gfx.destroy();

        const txt = this.make.text({
          x: BW / 2,
          y: BH / 2,
          text: label,
          style: {
            fontSize: '20px',
            fontFamily: 'sans-serif, "Microsoft JhengHei"',
            color: '#ffffff',
            fontStyle: 'bold',
          },
          add: false,
        });
        txt.setOrigin(0.5);
        rt.draw(txt);
        rt.saveTexture(textureKey);
        txt.destroy();
        rt.destroy();
      }
    });

    // 11. Dice Faces 1..6
    for (let d = 1; d <= 6; d++) {
      const key = `mahjong:dice_${d}`;
      if (!this.textures.exists(key)) {
        const DS = 28;
        const gfx = this.make.graphics({ x: 0, y: 0 });
        // White rounded cube
        gfx.fillStyle(0xf8fafc, 1);
        gfx.fillRoundedRect(0, 0, DS, DS, 4);
        gfx.lineStyle(1, 0x94a3b8, 0.8);
        gfx.strokeRoundedRect(0, 0, DS, DS, 4);

        // Draw red/black pips
        const pipColor = d === 1 || d === 4 ? 0xdc2626 : 0x0f172a;
        gfx.fillStyle(pipColor, 1);

        const cx = DS / 2;
        const cy = DS / 2;
        const offset = 6;

        if (d === 1) {
          gfx.fillCircle(cx, cy, 4);
        } else if (d === 2) {
          gfx.fillCircle(cx - offset, cy - offset, 2.5);
          gfx.fillCircle(cx + offset, cy + offset, 2.5);
        } else if (d === 3) {
          gfx.fillCircle(cx - offset, cy - offset, 2.5);
          gfx.fillCircle(cx, cy, 2.5);
          gfx.fillCircle(cx + offset, cy + offset, 2.5);
        } else if (d === 4) {
          gfx.fillCircle(cx - offset, cy - offset, 2.5);
          gfx.fillCircle(cx + offset, cy - offset, 2.5);
          gfx.fillCircle(cx - offset, cy + offset, 2.5);
          gfx.fillCircle(cx + offset, cy + offset, 2.5);
        } else if (d === 5) {
          gfx.fillCircle(cx - offset, cy - offset, 2.5);
          gfx.fillCircle(cx + offset, cy - offset, 2.5);
          gfx.fillCircle(cx, cy, 2.5);
          gfx.fillCircle(cx - offset, cy + offset, 2.5);
          gfx.fillCircle(cx + offset, cy + offset, 2.5);
        } else if (d === 6) {
          gfx.fillCircle(cx - offset, cy - offset, 2.5);
          gfx.fillCircle(cx + offset, cy - offset, 2.5);
          gfx.fillCircle(cx - offset, cy, 2.5);
          gfx.fillCircle(cx + offset, cy, 2.5);
          gfx.fillCircle(cx - offset, cy + offset, 2.5);
          gfx.fillCircle(cx + offset, cy + offset, 2.5);
        }

        gfx.generateTexture(key, DS, DS);
        gfx.destroy();
      }
    }

    // 12. Flower Rack Cell (Slot indicator)
    if (!this.textures.exists('mahjong:flower_cell')) {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      gfx.fillStyle(0x062817, 0.5);
      gfx.fillRoundedRect(0, 0, W, H, 3);
      gfx.lineStyle(1, 0x15803d, 0.4);
      gfx.strokeRoundedRect(0, 0, W, H, 3);
      gfx.generateTexture('mahjong:flower_cell', W, H);
      gfx.destroy();
    }
  }
}
