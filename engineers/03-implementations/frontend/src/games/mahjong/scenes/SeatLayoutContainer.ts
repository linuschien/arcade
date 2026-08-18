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

  private riverGroup: Phaser.GameObjects.Container;
  private handGroup: Phaser.GameObjects.Container;
  private meldGroup: Phaser.GameObjects.Container;
  private flowerGroup: Phaser.GameObjects.Container;
  private hudGroup: Phaser.GameObjects.Container;
  private bankerDiceGroup: Phaser.GameObjects.Container;

  private hudText!: Phaser.GameObjects.Text;
  private hudChipsText!: Phaser.GameObjects.Text;
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
    this.bankerDiceGroup = scene.add.container(0, 0);

    this.add([this.riverGroup, this.handGroup, this.meldGroup, this.flowerGroup, this.bankerDiceGroup, this.hudGroup]);

    this.initHUD();
    scene.add.existing(this);
  }

  private initHUD(): void {
    this.hudGroup.setAngle(-this.seatAngle);

    // Position HUD at the exact 4 corners with identical 20px border margin (PRD 5.3)
    let hudX = 0;
    let hudY = 0;

    if (this.seat === 0) {
      // Bottom Human (0 deg, container at (640, 645)): Bottom-Left Corner (20, 652)
      hudX = -620;
      hudY = 7;
    } else if (this.seat === 1) {
      // Right AI (270 deg, container at (1180, 360)): Bottom-Right Corner (1118, 652)
      hudX = -292;
      hudY = -62;
    } else if (this.seat === 2) {
      // Top AI (180 deg, container at (640, 75)): Top-Right Corner (1118, 20)
      hudX = -478;
      hudY = 55;
    } else if (this.seat === 3) {
      // Left AI (90 deg, container at (100, 360)): Top-Left Corner (20, 20)
      hudX = -340;
      hudY = 80;
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

    this.hudGroup.add([this.hudText, this.hudChipsText]);
  }

  /**
   * Updates player HUD status with directional arrows & seat wind + fan bonus tip (PRD 5.3).
   */
  public updatePlayerInfo(profile: PlayerProfile, roundWind: string = 'EAST'): void {
    const arrows = ['▼', '▶', '▲', '◀'];
    const arrow = arrows[this.seat] || '▼';
    const windNames: Record<string, string> = {
      EAST: '東風',
      SOUTH: '南風',
      WEST: '西風',
      NORTH: '北風',
    };
    const windName = windNames[profile.wind] || '東風';
    const isDoubleWind = profile.wind === roundWind;
    const windBonusTip = isDoubleWind ? '圈/門2台' : '門風1台';
    this.hudText.setText(`${arrow} [${windName}・${windBonusTip}] ${profile.name}`);
    this.hudChipsText.setText(`${profile.chips.toLocaleString()} 點`);
  }

  /**
   * Displays the 3 dice to the RIGHT of the Banker's Flower Rack (PRD 5.2).
   */
  public showBankerDice(d: number[] | null): void {
    this.bankerDiceGroup.removeAll(true);
    if (!d || d.length < 3) return;

    const diceStartX = 260;
    const diceStartY = -85;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x020617, 0.92);
    bg.fillRoundedRect(diceStartX - 5, diceStartY - 14, 86, 28, 6);
    bg.lineStyle(1, 0xd4af37, 0.9);
    bg.strokeRoundedRect(diceStartX - 5, diceStartY - 14, 86, 28, 6);
    this.bankerDiceGroup.add(bg);

    for (let i = 0; i < 3; i++) {
      const sprite = this.scene.add.sprite(diceStartX + 10 + i * 24, diceStartY, `mahjong:dice_${d[i]}`);
      sprite.setDisplaySize(18, 18);
      this.bankerDiceGroup.add(sprite);
    }
  }

  public renderPlayerState(
    profile: PlayerProfile,
    isHuman: boolean,
    isLastDiscardSeat: boolean = false,
    revealHand: boolean = false,
    roundWind: string = 'EAST'
  ): void {
    this.updatePlayerInfo(profile, roundWind);
    this.renderFlowerRack(profile.flowers, profile.wind);
    this.renderMelds(profile.melds, isHuman, revealHand);
    this.renderHand(profile, isHuman, revealHand);
    this.renderDiscards(profile.discards, isLastDiscardSeat);
  }

  /**
   * 4x2 Flower Rack situated to the RIGHT of Discard River.
   */
  private renderFlowerRack(flowers: Tile[], wind?: string): void {
    this.flowerGroup.removeAll(true);

    const cellW = 24;
    const cellH = 34;

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

    const startX = 150;
    const startY = -104;

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const idx = r * 4 + c;
        const x = startX + c * (cellW + 2);
        const y = startY + r * (cellH + 2);

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
  private renderMelds(melds: Meld[], isHuman: boolean, revealHand: boolean = false): void {
    this.meldGroup.removeAll(true);

    const meldW = SeatLayoutContainer.TILE_W * 3;
    const meldBlockW = meldW + 8;
    const meldRightEdge = 330;
    const meldStartX = meldRightEdge - melds.length * meldBlockW;

    melds.forEach((meld, idx) => {
      const meldX = meldStartX + idx * meldBlockW + meldW / 2;
      const container = this.scene.add.container(meldX, 0);

      const tileStep = SeatLayoutContainer.TILE_W;

      // Determine sideways tile position based on sourceSeat relative to current seat (PRD 6.2)
      // Left (上家): relative 3 -> index 0
      // Opposite (對家): relative 2 -> index 1
      // Right (下家): relative 1 -> index 2
      const relSeat = meld.sourceSeat !== undefined ? (meld.sourceSeat - this.seat + 4) % 4 : 2;
      const rotatedIdx = relSeat === 3 ? 0 : relSeat === 1 ? 2 : 1;

      if (meld.type === 'CONCEALED_KONG') {
        for (let i = 0; i < 4; i++) {
          const x = (i - 1.5) * tileStep;
          let texture = 'mahjong:tile_back';
          if (revealHand) {
            texture = `mahjong:tile_${meld.tiles[i].shortCode}`;
          } else if (isHuman && (i === 0 || i === 3)) {
            texture = `mahjong:tile_${meld.tiles[i].shortCode}`;
          }
          const sprite = this.scene.add.sprite(x, 0, texture);
          container.add(sprite);
        }
      } else if (meld.type === 'MELDED_KONG' || meld.type === 'ADDED_KONG') {
        for (let i = 0; i < 4; i++) {
          const x = (i - 1.5) * tileStep;
          const sprite = this.scene.add.sprite(x, 0, `mahjong:tile_${meld.tiles[i].shortCode}`);
          if (i === rotatedIdx) {
            sprite.setAngle(90);
          }
          container.add(sprite);
        }
      } else if (meld.type === 'PONG') {
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * tileStep;
          const sprite = this.scene.add.sprite(x, 0, `mahjong:tile_${meld.tiles[i].shortCode}`);
          if (i === rotatedIdx) {
            sprite.setAngle(90);
          }
          container.add(sprite);
        }
      } else {
        // CHOW: 3 tiles (Chow piece placed strictly in the middle, index 1)
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * tileStep;
          const sprite = this.scene.add.sprite(x, 0, `mahjong:tile_${meld.tiles[i].shortCode}`);
          container.add(sprite);
        }
      }

      this.meldGroup.add(container);
    });
  }

  /**
   * Hand tiles with automatic leftward shift as melds expand on the right.
   */
  private renderHand(profile: PlayerProfile, isHuman: boolean, revealHand: boolean = false): void {
    this.handGroup.removeAll(true);

    const meldCount = profile.melds.length;
    const meldW = SeatLayoutContainer.TILE_W * 3;
    const meldBlockW = meldW + 8;
    const meldRightEdge = 330;
    const meldStartX = meldRightEdge - meldCount * meldBlockW;

    const hand = profile.hand;
    const stepX = SeatLayoutContainer.TILE_W;
    const gapDrawn = 12;
    
    // Fixed max concealed capacity for current meld count (16 - 3*M) + reserved 17th drawn slot
    const maxConcealedTiles = 16 - meldCount * 3;
    const maxHandTilesW = maxConcealedTiles * stepX;
    const fixedDrawnSlotW = gapDrawn + stepX;
    const totalHandAreaW = maxHandTilesW + fixedDrawnSlotW;

    // Right edge of the entire hand area (including reserved drawn tile slot) stays cleanly left of melds
    const marginBeforeMelds = 20;
    const handAreaRightEdge = meldCount > 0 ? (meldStartX - marginBeforeMelds) : 260;
    const startX = handAreaRightEdge - totalHandAreaW;

    const showFace = isHuman || revealHand;

    hand.forEach((tile, idx) => {
      const x = startX + idx * stepX + stepX / 2;
      const textureKey = showFace ? `mahjong:tile_${tile.shortCode}` : 'mahjong:tile_back';

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

    // 17th Drawn tile (rendered into the reserved slot on the right with 12px gap)
    if (profile.drawnTile) {
      const drawnX = startX + maxHandTilesW + gapDrawn + stepX / 2;
      const textureKey = showFace
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
   * 9x2 Compact Discard River with pre-rendered placeholder cells (PRD 5.2 / AC4).
   */
  private renderDiscards(discards: Tile[], _isLastDiscardSeat: boolean = false): void {
    this.riverGroup.removeAll(true);

    const cols = 9;
    const dw = 28;
    const dh = 38;
    const riverStartX = -(cols * (dw + 2)) / 2 + (dw / 2);
    const riverStartY = -120;

    // 1. Draw 18 placeholder grid cells (like Flower Rack)
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < cols; c++) {
        const x = riverStartX + c * (dw + 2);
        const y = riverStartY + r * (dh + 2);
        const cell = this.scene.add.sprite(x, y, 'mahjong:flower_cell');
        cell.setDisplaySize(dw, dh);
        this.riverGroup.add(cell);
      }
    }

    // 2. Render actual discarded tiles on top of cells
    discards.forEach((tile, idx) => {
      if (idx >= 18) return;
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const x = riverStartX + col * (dw + 2);
      const y = riverStartY + row * (dh + 2);

      const sprite = this.scene.add.sprite(x, y, `mahjong:tile_${tile.shortCode}`);
      sprite.setDisplaySize(dw, dh);
      sprite.setData('isDiscardTile', true);
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
      if (sprite.getData && sprite.getData('isDiscardTile')) {
        if (targetCode && sprite.getData('shortCode') === targetCode) {
          sprite.setTint(0xfacc15);
        } else {
          sprite.clearTint();
        }
      }
    });
  }

  /**
   * Returns world position of the latest discarded tile.
   */
  public getLatestDiscardWorldPosition(): { x: number; y: number } | null {
    if (!this.riverGroup) return null;
    const children = (this.riverGroup as any).list || [];
    const discardTiles = children.filter((c: any) => c.getData && c.getData('isDiscardTile'));
    if (discardTiles.length === 0) return null;

    const lastSprite = discardTiles[discardTiles.length - 1];
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
