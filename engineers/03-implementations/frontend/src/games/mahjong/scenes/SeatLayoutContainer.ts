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

    // Position HUD relative to seat so it never overlaps hand tiles
    let hudX = -320;
    let hudY = 0;

    if (this.seat === 0) {
      // Bottom Human
      hudX = -460;
      hudY = -10;
    } else if (this.seat === 1) {
      // Right AI
      hudX = 0;
      hudY = -220;
    } else if (this.seat === 2) {
      // Top AI
      hudX = -360;
      hudY = 0;
    } else if (this.seat === 3) {
      // Left AI
      hudX = 0;
      hudY = -220;
    }

    this.hudGroup.setPosition(hudX, hudY);

    // HUD Background Capsule
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.9);
    bg.fillRoundedRect(0, 0, 130, 48, 8);
    bg.lineStyle(1, 0xd4af37, 0.9);
    bg.strokeRoundedRect(0, 0, 130, 48, 8);
    this.hudGroup.add(bg);

    this.hudText = this.scene.add.text(10, 6, '玩家', {
      fontSize: '13px',
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

    this.dealerBadge = this.scene.add.text(100, 6, '莊', {
      fontSize: '14px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#ef4444',
      fontStyle: 'bold',
    });
    this.dealerBadge.setVisible(false);

    this.hudGroup.add([this.hudText, this.hudChipsText, this.dealerBadge]);
  }

  /**
   * Updates player HUD status.
   */
  public updatePlayerInfo(profile: PlayerProfile): void {
    const windChars: Record<string, string> = {
      EAST: '東',
      SOUTH: '南',
      WEST: '西',
      NORTH: '北',
    };
    const windChar = windChars[profile.wind] || '東';
    this.hudText.setText(`[${windChar}] ${profile.name}`);
    this.hudChipsText.setText(`${profile.chips.toLocaleString()} 點`);
    this.dealerBadge.setVisible(profile.isDealer);
  }

  /**
   * Renders hand, melds, flowers, and discards.
   */
  public renderPlayerState(profile: PlayerProfile, isHuman: boolean): void {
    this.updatePlayerInfo(profile);
    this.renderFlowerRack(profile.flowers);
    this.renderMelds(profile.melds, isHuman);
    this.renderHand(profile, isHuman);
    this.renderDiscards(profile.discards);
  }

  /**
   * 4x2 Flower Rack at far right.
   */
  private renderFlowerRack(flowers: Tile[]): void {
    this.flowerGroup.removeAll(true);

    const startX = 220;
    const cellW = SeatLayoutContainer.TILE_W * 0.65;
    const cellH = SeatLayoutContainer.TILE_H * 0.65;

    const slotKeys = [
      'spring', 'summer', 'autumn', 'winter',
      'plum', 'orchid', 'bamboo_f', 'chrysanthemum',
    ];

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const idx = r * 4 + c;
        const x = startX + c * (cellW + 2);
        const y = (r - 0.5) * (cellH + 2);

        const slotCode = slotKeys[idx];
        const hasFlower = flowers.some((f) => f.shortCode === slotCode);

        if (hasFlower) {
          const sprite = this.scene.add.sprite(x, y, `mahjong:tile_${slotCode}`);
          sprite.setDisplaySize(cellW, cellH);
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
   * Modular 3-tile width melds.
   */
  private renderMelds(melds: Meld[], _isHuman: boolean): void {
    this.meldGroup.removeAll(true);

    const meldW = SeatLayoutContainer.TILE_W * 3;
    const startX = 200; // Left of flower rack

    melds.forEach((meld, idx) => {
      const meldX = startX - (idx + 1) * (meldW + 6);
      const container = this.scene.add.container(meldX, 0);

      if (meld.type === 'CONCEALED_KONG') {
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * SeatLayoutContainer.TILE_W;
          const tex = i === 1 ? 'mahjong:tile_back' : `mahjong:tile_${meld.tiles[0].shortCode}`;
          const sprite = this.scene.add.sprite(x, 0, tex);
          container.add(sprite);
        }
        const topSprite = this.scene.add.sprite(0, -12, 'mahjong:tile_back');
        container.add(topSprite);
      } else if (meld.type === 'MELDED_KONG' || meld.type === 'ADDED_KONG') {
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * SeatLayoutContainer.TILE_W;
          const sprite = this.scene.add.sprite(x, 0, `mahjong:tile_${meld.tiles[i].shortCode}`);
          container.add(sprite);
        }
        const topSprite = this.scene.add.sprite(0, -12, `mahjong:tile_${meld.tiles[3].shortCode}`);
        container.add(topSprite);
      } else {
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * SeatLayoutContainer.TILE_W;
          const sprite = this.scene.add.sprite(x, 0, `mahjong:tile_${meld.tiles[i].shortCode}`);
          container.add(sprite);
        }
      }

      this.meldGroup.add(container);
    });
  }

  /**
   * Hand tiles with leftward shrink as melds increase.
   * For AI: uses compact step so it never exceeds screen borders.
   */
  private renderHand(profile: PlayerProfile, isHuman: boolean): void {
    this.handGroup.removeAll(true);

    const meldCount = profile.melds.length;
    const meldW = SeatLayoutContainer.TILE_W * 3 + 6;
    const rightEdge = 200 - meldCount * meldW - 10;

    const hand = profile.hand;
    const stepX = isHuman ? SeatLayoutContainer.TILE_W : 20;
    const totalHandW = hand.length * stepX;
    const startX = rightEdge - totalHandW;

    hand.forEach((tile, idx) => {
      const x = startX + idx * stepX;
      const textureKey = isHuman ? `mahjong:tile_${tile.shortCode}` : 'mahjong:tile_back';

      const sprite = this.scene.add.sprite(x, 0, textureKey);
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

    // Drawn tile
    if (profile.drawnTile) {
      const drawnX = rightEdge + 14;
      const textureKey = isHuman
        ? `mahjong:tile_${profile.drawnTile.shortCode}`
        : 'mahjong:tile_back';

      const drawnSprite = this.scene.add.sprite(drawnX, 0, textureKey);
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
   * 6x3 Discard River in local coordinate frame.
   */
  private renderDiscards(discards: Tile[]): void {
    this.riverGroup.removeAll(true);

    const riverStartX = -90;
    const riverStartY = -135;
    const dw = SeatLayoutContainer.TILE_W * 0.75;
    const dh = SeatLayoutContainer.TILE_H * 0.75;

    discards.forEach((tile, idx) => {
      const col = idx % 6;
      const row = Math.floor(idx / 6);

      const x = riverStartX + col * (dw + 2);
      const y = riverStartY + row * (dh + 2);

      const sprite = this.scene.add.sprite(x, y, `mahjong:tile_${tile.shortCode}`);
      sprite.setDisplaySize(dw, dh);
      sprite.setData('shortCode', tile.shortCode);

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
}

