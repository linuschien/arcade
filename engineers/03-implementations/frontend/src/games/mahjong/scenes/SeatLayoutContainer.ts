/**
 * SeatLayoutContainer.ts
 * Shared first-person local coordinate layout container for each of the 4 Mahjong seats.
 * Manages HandZone, Modular MeldZone (3-tile fixed grid), 4x2 Flower Rack,
 * 6x3 Discard River, and Anti-Rotated HUD.
 */

import Phaser from 'phaser';
import { PlayerProfile, Tile, Meld, PlayerSeat } from '../logic/MahjongTypes';

export class SeatLayoutContainer extends Phaser.GameObjects.Container {
  public seat: PlayerSeat;
  public seatAngle: number;

  private handGroup: Phaser.GameObjects.Container;
  private meldGroup: Phaser.GameObjects.Container;
  private flowerGroup: Phaser.GameObjects.Container;
  private riverGroup: Phaser.GameObjects.Container;
  private hudGroup: Phaser.GameObjects.Container;

  private hudText!: Phaser.GameObjects.Text;
  private hudChipsText!: Phaser.GameObjects.Text;
  private dealerBadge!: Phaser.GameObjects.Text;

  private hoveredTileSprite: Phaser.GameObjects.Sprite | null = null;
  public onTileClick?: (tileId: string) => void;
  public onTileHover?: (shortCode: string | null) => void;

  public static readonly TILE_W = 36;
  public static readonly TILE_H = 48;

  constructor(scene: Phaser.Scene, x: number, y: number, angle: number, seat: PlayerSeat) {
    super(scene, x, y);
    this.seat = seat;
    this.seatAngle = angle;
    this.setAngle(angle);

    this.riverGroup = scene.add.container(0, 0);
    this.handGroup = scene.add.container(0, 0);
    this.meldGroup = scene.add.container(0, 0);
    this.flowerGroup = scene.add.container(0, 0);
    this.hudGroup = scene.add.container(0, 0);

    this.add([this.riverGroup, this.handGroup, this.meldGroup, this.flowerGroup, this.hudGroup]);

    this.initHUD();
    scene.add.existing(this);
  }

  private initHUD(): void {
    this.hudGroup.setAngle(-this.seatAngle);

    // Position HUD at player's physical LEFT arm across all 4 seats
    let hudX = 0;
    let hudY = 0;

    if (this.seat === 0) {
      // Bottom Human: Physical LEFT = Screen Bottom-Left
      hudX = -540;
      hudY = 0;
    } else if (this.seat === 1) {
      // Right AI (facing Left): Physical LEFT = Screen Bottom-Right (inside felt)
      hudX = -200;
      hudY = -40;
    } else if (this.seat === 2) {
      // Top AI (facing Down): Physical LEFT = Screen Top-Right
      hudX = -340;
      hudY = 0;
    } else if (this.seat === 3) {
      // Left AI (facing Right): Physical LEFT = Screen Top-Left
      hudX = -200;
      hudY = -10;
    }

    this.hudGroup.setPosition(hudX, hudY);

    // HUD Background Capsule
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.92);
    bg.fillRoundedRect(0, 0, 142, 48, 8);
    bg.lineStyle(1, 0xd4af37, 0.9);
    bg.strokeRoundedRect(0, 0, 142, 48, 8);
    this.hudGroup.add(bg);

    this.hudText = this.scene.add.text(10, 6, '玩家', {
      fontSize: '12px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#f8fafc',
      fontStyle: 'bold',
    });

    this.hudChipsText = this.scene.add.text(10, 26, '10000 點', {
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#facc15',
      fontStyle: 'bold',
    });

    this.dealerBadge = this.scene.add.text(118, 6, '莊', {
      fontSize: '14px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#ef4444',
      fontStyle: 'bold',
    });
    this.dealerBadge.setVisible(false);

    this.hudGroup.add([this.hudText, this.hudChipsText, this.dealerBadge]);
  }

  /**
   * Updates player HUD status with directional arrows (PRD 5.3).
   */
  public updatePlayerInfo(profile: PlayerProfile): void {
    const arrows = ['▼', '▶', '▲', '◀'];
    const arrow = arrows[this.seat] || '▼';
    const windChars: Record<string, string> = {
      EAST: '東',
      SOUTH: '南',
      WEST: '西',
      NORTH: '北',
    };
    const windChar = windChars[profile.wind] || '東';
    this.hudText.setText(`${arrow} [${windChar}] ${profile.name}`);
    this.hudChipsText.setText(`${profile.chips.toLocaleString()} 點`);
    this.dealerBadge.setVisible(profile.isDealer);
  }

  public renderPlayerState(profile: PlayerProfile, isHuman: boolean, isLastDiscardSeat: boolean = false): void {
    this.updatePlayerInfo(profile);
    this.renderFlowerRack(profile.flowers, profile.wind);
    this.renderMelds(profile.melds, isHuman);
    this.renderHand(profile, isHuman);
    this.renderDiscards(profile.discards, isLastDiscardSeat);
  }

  /**
   * 4x2 Flower Rack at player's physical RIGHT arm.
   */
  private renderFlowerRack(flowers: Tile[], wind?: string): void {
    this.flowerGroup.removeAll(true);

    const cellW = SeatLayoutContainer.TILE_W * 0.65;
    const cellH = SeatLayoutContainer.TILE_H * 0.65;

    const slotKeys = [
      'spring', 'summer', 'autumn', 'winter',
      'plum', 'orchid', 'bamboo_f', 'chrysanthemum',
    ];

    // Positive flower indices matching player's current seat wind per PRD 4.3 & 6.3
    const positiveIndices: Record<string, number[]> = {
      EAST: [0, 4], // 春1, 梅1
      SOUTH: [1, 5], // 夏2, 蘭2
      WEST: [2, 6], // 秋3, 竹3
      NORTH: [3, 7], // 冬4, 菊4
    };
    const playerPositives = wind ? (positiveIndices[wind] || []) : [];

    let startX = 340;
    let startY = 0;

    if (this.seat === 0) {
      startX = 340;
      startY = 0;
    } else if (this.seat === 1) {
      startX = 200;
      startY = 0;
    } else if (this.seat === 2) {
      startX = 340;
      startY = 0;
    } else if (this.seat === 3) {
      startX = 200;
      startY = 0;
    }

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const idx = r * 4 + c;
        const x = startX + c * (cellW + 2);
        const y = startY + (r - 0.5) * (cellH + 2);

        const slotCode = slotKeys[idx];
        const hasFlower = flowers.some((f) => f.shortCode === slotCode);
        const isPositive = playerPositives.includes(idx);

        if (hasFlower) {
          const sprite = this.scene.add.sprite(x, y, `mahjong:tile_${slotCode}`);
          sprite.setDisplaySize(cellW, cellH);
          // Highlight positive flowers with golden glow per PRD 6.3
          if (isPositive) {
            sprite.setTint(0xffe082);
          }
          this.flowerGroup.add(sprite);
        } else {
          const cell = this.scene.add.sprite(x, y, 'mahjong:flower_cell');
          cell.setDisplaySize(cellW, cellH);
          this.flowerGroup.add(cell);
        }
      }
    }
  }

  /**
   * Modular 3-tile width melds with positional encoding (PRD 6.2).
   */
  private renderMelds(melds: Meld[], isHuman: boolean): void {
    this.meldGroup.removeAll(true);

    const meldW = isHuman ? SeatLayoutContainer.TILE_W * 3 : 20 * 3;
    const meldBlockW = meldW + (isHuman ? 8 : 6);
    const meldRightEdge = isHuman ? 330 : 180;
    const totalMeldsW = melds.length * meldBlockW;
    const meldStartX = meldRightEdge - totalMeldsW;

    melds.forEach((meld, idx) => {
      const meldX = meldStartX + idx * meldBlockW + meldW / 2;
      const container = this.scene.add.container(meldX, 0);

      const tileStep = isHuman ? SeatLayoutContainer.TILE_W : 20;

      // Determine sideways tile position based on sourceSeat relative to current seat (PRD 6.2)
      // Left (上家): relative 3 -> index 0
      // Opposite (對家): relative 2 -> index 1
      // Right (下家): relative 1 -> index 2
      let sidewaysIdx = 1;
      if (meld.sourceSeat !== undefined) {
        const rel = (meld.sourceSeat - this.seat + 4) % 4;
        if (rel === 3) sidewaysIdx = 0; // 上家
        else if (rel === 2) sidewaysIdx = 1; // 對家
        else if (rel === 1) sidewaysIdx = 2; // 下家
      }

      if (meld.type === 'CONCEALED_KONG') {
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * tileStep;
          // Human sees their own outer 2 face tiles; AI concealed kong is 100% face-down
          const tex = (isHuman && (i === 0 || i === 2))
            ? `mahjong:tile_${meld.tiles[0].shortCode}`
            : 'mahjong:tile_back';
          const sprite = this.scene.add.sprite(x, 0, tex);
          if (!isHuman) sprite.setDisplaySize(18, 24);
          container.add(sprite);
        }
        const topSprite = this.scene.add.sprite(0, -12, 'mahjong:tile_back');
        if (!isHuman) topSprite.setDisplaySize(18, 24);
        container.add(topSprite);
      } else if (meld.type === 'MELDED_KONG' || meld.type === 'ADDED_KONG') {
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * tileStep;
          const sprite = this.scene.add.sprite(x, 0, `mahjong:tile_${meld.tiles[i].shortCode}`);
          if (!isHuman) sprite.setDisplaySize(18, 24);
          if (i === sidewaysIdx) {
            sprite.setAngle(90);
          }
          container.add(sprite);
        }
        // 4th tile vertically stacked above the sideways tile (PRD 6.2)
        const topX = (sidewaysIdx - 1) * tileStep;
        const topSprite = this.scene.add.sprite(topX, -12, `mahjong:tile_${meld.tiles[3].shortCode}`);
        if (!isHuman) topSprite.setDisplaySize(18, 24);
        topSprite.setAngle(90);
        container.add(topSprite);
      } else if (meld.type === 'PONG') {
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * tileStep;
          const sprite = this.scene.add.sprite(x, 0, `mahjong:tile_${meld.tiles[i].shortCode}`);
          if (!isHuman) sprite.setDisplaySize(18, 24);
          // Sideways orientation based on source seat (PRD 6.2)
          if (i === sidewaysIdx) {
            sprite.setAngle(90);
          }
          container.add(sprite);
        }
      } else {
        // CHOW: 3 tiles
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * tileStep;
          const sprite = this.scene.add.sprite(x, 0, `mahjong:tile_${meld.tiles[i].shortCode}`);
          if (!isHuman) sprite.setDisplaySize(18, 24);
          container.add(sprite);
        }
      }

      this.meldGroup.add(container);
    });
  }

  /**
   * Hand tiles with automatic leftward shift as melds expand on the right.
   */
  private renderHand(profile: PlayerProfile, isHuman: boolean): void {
    this.handGroup.removeAll(true);

    const meldCount = profile.melds.length;
    const meldW = isHuman ? SeatLayoutContainer.TILE_W * 3 : 20 * 3;
    const meldBlockW = meldW + (isHuman ? 8 : 6);
    const meldRightEdge = isHuman ? 330 : 180;
    const meldStartX = meldRightEdge - meldCount * meldBlockW;

    const hand = profile.hand;
    const stepX = isHuman ? SeatLayoutContainer.TILE_W : 18;
    const gapDrawn = isHuman ? 12 : 8;
    const hasDrawn = !!profile.drawnTile;
    const handTilesW = hand.length * stepX;
    const drawnTileW = hasDrawn ? (gapDrawn + stepX) : 0;
    const totalHandAreaW = handTilesW + drawnTileW;

    // Right edge of the entire hand area (including drawn tile) stays cleanly to the left of the melds
    const marginBeforeMelds = isHuman ? 24 : 16;
    const handAreaRightEdge = meldCount > 0 ? (meldStartX - marginBeforeMelds) : (isHuman ? 260 : 150);
    const startX = handAreaRightEdge - totalHandAreaW;

    hand.forEach((tile, idx) => {
      const x = startX + idx * stepX + stepX / 2;
      const textureKey = isHuman ? `mahjong:tile_${tile.shortCode}` : 'mahjong:tile_back';

      const sprite = this.scene.add.sprite(x, 0, textureKey);
      if (!isHuman) sprite.setDisplaySize(18, 24);
      sprite.setData('tileId', tile.id);
      sprite.setData('shortCode', tile.shortCode);

      if (isHuman) {
        sprite.setInteractive({ useHandCursor: true });

        sprite.on('pointerover', () => {
          sprite.setY(-10);
          sprite.setTint(0xffe082);
          this.hoveredTileSprite = sprite;
          this.onTileHover?.(tile.shortCode);
        });

        sprite.on('pointerout', () => {
          sprite.setY(0);
          sprite.clearTint();
          if (this.hoveredTileSprite === sprite) {
            this.hoveredTileSprite = null;
          }
          this.onTileHover?.(null);
        });

        sprite.on('pointerdown', () => {
          this.onTileClick?.(tile.id);
        });
      }

      this.handGroup.add(sprite);
    });

    // 17th Drawn tile (placed on the right of the hand with 12px gap per PRD 6.1)
    if (profile.drawnTile) {
      const drawnX = startX + handTilesW + gapDrawn + stepX / 2;
      const textureKey = isHuman
        ? `mahjong:tile_${profile.drawnTile.shortCode}`
        : 'mahjong:tile_back';

      const drawnSprite = this.scene.add.sprite(drawnX, 0, textureKey);
      if (!isHuman) drawnSprite.setDisplaySize(18, 24);
      drawnSprite.setData('tileId', profile.drawnTile.id);
      drawnSprite.setData('shortCode', profile.drawnTile.shortCode);

      if (isHuman) {
        drawnSprite.setInteractive({ useHandCursor: true });

        drawnSprite.on('pointerover', () => {
          drawnSprite.setY(-10);
          drawnSprite.setTint(0xffe082);
          this.onTileHover?.(profile.drawnTile!.shortCode);
        });

        drawnSprite.on('pointerout', () => {
          drawnSprite.setY(0);
          drawnSprite.clearTint();
          this.onTileHover?.(null);
        });

        drawnSprite.on('pointerdown', () => {
          this.onTileClick?.(profile.drawnTile!.id);
        });
      }

      this.handGroup.add(drawnSprite);
    }
  }

  /**
   * 9x2 Compact Discard River in local coordinate frame (PRD 5.2 / AC4).
   */
  private renderDiscards(discards: Tile[], isLastDiscardSeat: boolean = false): void {
    this.riverGroup.removeAll(true);

    const cols = 9;
    const dw = SeatLayoutContainer.TILE_W * 0.7;
    const dh = SeatLayoutContainer.TILE_H * 0.7;
    const riverStartX = -(cols * (dw + 2)) / 2 + (dw / 2);
    const riverStartY = -120;

    discards.forEach((tile, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const x = riverStartX + col * (dw + 2);
      const y = riverStartY + row * (dh + 2);

      const sprite = this.scene.add.sprite(x, y, `mahjong:tile_${tile.shortCode}`);
      sprite.setDisplaySize(dw, dh);
      sprite.setData('shortCode', tile.shortCode);

      // Latest Discard Focus indicator per PRD 5.2
      if (isLastDiscardSeat && idx === discards.length - 1) {
        sprite.setTint(0xffea00);
      }

      this.riverGroup.add(sprite);
    });
  }

  /**
   * Highlights matching discard tiles on hover.
   */
  public highlightMatchingDiscards(targetCode: string | null): void {
    this.riverGroup.each((child: Phaser.GameObjects.GameObject) => {
      const sprite = child as Phaser.GameObjects.Sprite;
      if (targetCode && sprite.getData('shortCode') === targetCode) {
        sprite.setTint(0xfacc15);
      } else {
        sprite.clearTint();
      }
    });
  }

  /**
   * Returns world position of the latest discarded tile.
   */
  public getLatestDiscardWorldPosition(): { x: number; y: number } | null {
    if (!this.riverGroup) return null;
    const count = this.riverGroup.length ?? (this.riverGroup as any).list?.length ?? 0;
    if (count === 0) return null;

    const lastSprite = typeof (this.riverGroup as any).getAt === 'function'
      ? (this.riverGroup as any).getAt(count - 1)
      : (this.riverGroup as any).list?.[count - 1];

    if (!lastSprite) return null;
    const matrix = typeof this.getWorldTransformMatrix === 'function'
      ? this.getWorldTransformMatrix()
      : null;

    if (!matrix) {
      return { x: this.x + (lastSprite.x || 0), y: this.y + (lastSprite.y || 0) };
    }
    const worldPoint = matrix.transformPoint(lastSprite.x || 0, lastSprite.y || 0, new Phaser.Math.Vector2());
    return { x: worldPoint.x, y: worldPoint.y };
  }
}
