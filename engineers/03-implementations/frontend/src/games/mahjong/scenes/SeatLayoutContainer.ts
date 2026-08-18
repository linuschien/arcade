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
    // Ring 1: Position HUD in a compact ring around the central compass
    const isSideSeat = this.seat === 1 || this.seat === 3;
    const hudY = isSideSeat ? -425 : -225;
    this.hudGroup.setPosition(0, hudY);
    this.hudGroup.setAngle(0);

    // Sleek HUD capsule (130x28)
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x0f172a, 0.94);
    bg.fillRoundedRect(-65, -14, 130, 28, 6);
    bg.lineStyle(1.5, 0xd4af37, 0.9);
    bg.strokeRoundedRect(-65, -14, 130, 28, 6);
    this.hudGroup.add(bg);

    this.hudText = this.scene.add.text(-58, -7, '玩家', {
      fontSize: '11px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#f8fafc',
      fontStyle: 'bold',
    });

    this.hudChipsText = this.scene.add.text(58, -7, '10000 點', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#facc15',
      fontStyle: 'bold',
    });
    this.hudChipsText.setOrigin?.(1, 0);

    this.hudGroup.add([this.hudText, this.hudChipsText]);
    // Hide redundant external HUD group as all player HUD info is now integrated into the central square compass
    this.hudGroup.setVisible(false);
  }

  /**
   * Updates player HUD status around the central compass (Ring 1).
   */
  public updatePlayerInfo(profile: PlayerProfile, roundWind: string = 'EAST'): void {
    const windNames: Record<string, string> = {
      EAST: '東',
      SOUTH: '南',
      WEST: '西',
      NORTH: '北',
    };
    const windName = windNames[profile.wind] || '東';
    const isRoundWind = profile.wind === roundWind;
    const windColor = isRoundWind ? '#facc15' : '#e2e8f0';

    this.hudText.setText(`[${windName}] ${profile.name}`);
    this.hudText.setColor?.(windColor);
    this.hudChipsText.setText(`${profile.chips.toLocaleString()} 點`);
  }

  /**
   * Performs dynamic 3D-like spinning / flip animation on hand tiles when sorting after dealing.
   */
  public animateTileSortSpin(): void {
    if (!this.scene.tweens) return;
    const children = (this.handGroup.list || []) as Phaser.GameObjects.Sprite[];
    children.forEach((child, idx) => {
      this.scene.tweens.add({
        targets: child,
        angle: { from: -180, to: 0 },
        scale: { from: 0.4, to: 1.0 },
        y: { from: -20, to: 0 },
        delay: idx * 25,
        duration: 400,
        ease: 'Cubic.easeOut',
      });
    });
  }

  /**
   * Renders Banker Dice above the left-side Flower Rack.
   */
  public showBankerDice(diceResult: number[] | null, isDealer: boolean = false, handStartX: number = -288): void {
    this.bankerDiceGroup.removeAll(true);
    if (!isDealer || !diceResult || diceResult.length < 3) return;

    const cellStep = 38;
    const rackWidth = 4 * cellStep;
    const diceX = handStartX - 24 - rackWidth / 2;
    const diceY = -58;

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x020617, 0.9);
    bg.fillRoundedRect(diceX - 42, diceY - 14, 84, 28, 6);
    bg.lineStyle(1.5, 0xd4af37, 0.9);
    bg.strokeRoundedRect(diceX - 42, diceY - 14, 84, 28, 6);
    this.bankerDiceGroup.add(bg);

    for (let i = 0; i < 3; i++) {
      const sprite = this.scene.add.sprite(diceX - 24 + i * 24, diceY, `mahjong:dice_${diceResult[i]}`);
      sprite.setDisplaySize(18, 18);
      this.bankerDiceGroup.add(sprite);
    }
  }

  public renderPlayerState(
    profile: PlayerProfile,
    isHuman: boolean,
    isLastDiscardSeat: boolean = false,
    revealHand: boolean = false,
    roundWind: string = 'EAST',
    diceResult: number[] | null = null
  ): void {
    this.updatePlayerInfo(profile, roundWind);

    // Calculate symmetrical centering for Hand + Reserved Drawn Slot + Melds
    const meldCount = profile.melds.length;
    const stepX = isHuman ? SeatLayoutContainer.TILE_W : 28;
    const meldW = SeatLayoutContainer.TILE_W * 3;
    const meldBlockW = meldW + 8;
    const gapDrawn = isHuman ? 12 : 8;

    const maxConcealedTiles = 16 - meldCount * 3;
    const maxHandTilesW = maxConcealedTiles * stepX;
    const fixedDrawnSlotW = gapDrawn + stepX;
    const totalMeldsW = meldCount > 0 ? meldCount * meldBlockW - 8 : 0;
    const marginBeforeMelds = meldCount > 0 ? 16 : 0;

    const totalWidth = maxHandTilesW + fixedDrawnSlotW + marginBeforeMelds + totalMeldsW;
    const handStartX = -totalWidth / 2;
    const meldStartX = handStartX + maxHandTilesW + fixedDrawnSlotW + marginBeforeMelds;

    this.renderMelds(profile.melds, isHuman, revealHand, meldStartX);
    this.renderHand(profile, isHuman, revealHand, handStartX, maxHandTilesW, stepX, gapDrawn);

    // Flower Rack placed on the LEFT of the hand (Item 4)
    this.renderFlowerRack(profile.flowers, profile.wind, handStartX);
    this.showBankerDice(diceResult, profile.isDealer, handStartX);

    this.renderDiscards(profile.discards, isLastDiscardSeat);
  }

  /**
   * 4x2 Flower Rack situated on the LEFT flank of the Hand with full 36x48 standard tiles.
   */
  private renderFlowerRack(flowers: Tile[], wind?: string, handStartX: number = -288): void {
    this.flowerGroup.removeAll(true);

    const cellW = SeatLayoutContainer.TILE_W;
    const cellH = SeatLayoutContainer.TILE_H;
    const stepX = 38;

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

    const flowerStartX = handStartX - 24 - 4 * stepX;

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const idx = r * 4 + c;
        const x = flowerStartX + c * stepX + cellW / 2;
        const y = (r === 0 ? -25 : 25);

        const slotCode = slotKeys[idx];
        const hasFlower = flowers.some((f) => f.shortCode === slotCode);
        const isPositive = playerPositives.includes(idx);

        if (hasFlower) {
          const sprite = this.scene.add.sprite(x, y, `mahjong:tile_${slotCode}`);
          sprite.setDisplaySize(cellW, cellH);
          this.flowerGroup.add(sprite);

          // Highlight positive flowers with coral orange border
          if (isPositive) {
            const frame = this.scene.add.graphics();
            frame.lineStyle(2.5, 0xf97316, 1);
            frame.strokeRoundedRect(x - cellW / 2, y - cellH / 2, cellW, cellH, 3);
            this.flowerGroup.add(frame);
          }
        } else {
          const cell = this.scene.add.sprite(x, y, 'mahjong:flower_cell');
          cell.setDisplaySize(cellW, cellH);
          this.flowerGroup.add(cell);
        }
      }
    }
  }

  /**
   * Modular 3-tile width melds positioned cleanly to the right of hand & drawn tile.
   */
  private renderMelds(
    melds: Meld[],
    isHuman: boolean,
    revealHand: boolean = false,
    meldStartX: number = 0
  ): void {
    this.meldGroup.removeAll(true);

    const meldW = SeatLayoutContainer.TILE_W * 3;
    const meldBlockW = meldW + 8;

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
        // 3 base tiles at y = 0
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * tileStep;
          let texture = 'mahjong:tile_back';
          if (revealHand) {
            texture = `mahjong:tile_${meld.tiles[i].shortCode}`;
          } else if (isHuman && (i === 0 || i === 2)) {
            texture = `mahjong:tile_${meld.tiles[i].shortCode}`;
          }
          const sprite = this.scene.add.sprite(x, 0, texture);
          container.add(sprite);
        }
        // 4th tile stacked on top of center tile at y = -14
        const topTexture = revealHand ? `mahjong:tile_${meld.tiles[3].shortCode}` : 'mahjong:tile_back';
        const topSprite = this.scene.add.sprite(0, -14, topTexture);
        container.add(topSprite);
      } else if (meld.type === 'MELDED_KONG' || meld.type === 'ADDED_KONG') {
        // 3 base tiles at y = 0
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * tileStep;
          const sprite = this.scene.add.sprite(x, 0, `mahjong:tile_${meld.tiles[i].shortCode}`);
          if (i === rotatedIdx) {
            sprite.setAngle(90);
          }
          container.add(sprite);
        }
        // 4th tile stacked on top of the rotated sideways tile at y = -14
        const topX = (rotatedIdx - 1) * tileStep;
        const topSprite = this.scene.add.sprite(topX, -14, `mahjong:tile_${meld.tiles[3].shortCode}`);
        topSprite.setAngle(90);
        container.add(topSprite);
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
   * Hand tiles with reserved drawn slot, symmetrically centered around X = 0.
   */
  private renderHand(
    profile: PlayerProfile,
    isHuman: boolean,
    revealHand: boolean = false,
    startX: number = -312,
    maxHandTilesW: number = 576,
    stepX: number = SeatLayoutContainer.TILE_W,
    gapDrawn: number = 12
  ): void {
    this.handGroup.removeAll(true);

    const hand = profile.hand;
    const showFace = isHuman || revealHand;
    const meldCount = profile.melds.length;
    const maxConcealedTiles = 16 - meldCount * 3;

    // Reserved Drawn Slot Outline (進牌/棄牌區虛線定位格)
    const drawnSlotW = stepX;
    const drawnSlotH = SeatLayoutContainer.TILE_H;
    const drawnX = startX + maxHandTilesW + gapDrawn + stepX / 2;

    const slotGraphics = this.scene.add.graphics();
    // Faint translucent slot base
    slotGraphics.fillStyle(0x020617, 0.35);
    slotGraphics.fillRoundedRect(drawnX - drawnSlotW / 2, -drawnSlotH / 2, drawnSlotW, drawnSlotH, 4);
    // Delicate dashed champagne gold border
    slotGraphics.lineStyle(1.5, 0xd4af37, 0.65);
    this.drawDashedRect(slotGraphics, drawnX - drawnSlotW / 2, -drawnSlotH / 2, drawnSlotW, drawnSlotH, 4, 3);
    this.handGroup.add(slotGraphics);

    hand.forEach((tile, idx) => {
      // If hand has an extra tile (e.g. 14th tile after Chow/Pong claim when drawnTile is null),
      // place the extra tile directly into the reserved drawn slot (drawnX)!
      const isExtraTileInSlot = idx >= maxConcealedTiles && !profile.drawnTile;
      const x = isExtraTileInSlot ? drawnX : startX + idx * stepX + stepX / 2;
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

    // 17th Drawn tile (rendered into the reserved slot on the right with gap)
    if (profile.drawnTile) {
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
   * Draws a crisp dashed rectangle outline on a Graphics object.
   */
  private drawDashedRect(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    w: number,
    h: number,
    dash: number = 4,
    gap: number = 3
  ): void {
    // Top border (Left to Right)
    let cx = x;
    while (cx < x + w) {
      const len = Math.min(dash, x + w - cx);
      g.lineBetween(cx, y, cx + len, y);
      cx += dash + gap;
    }
    // Right border (Top to Bottom)
    let cy = y;
    while (cy < y + h) {
      const len = Math.min(dash, y + h - cy);
      g.lineBetween(x + w, cy, x + w, cy + len);
      cy += dash + gap;
    }
    // Bottom border (Right to Left)
    cx = x + w;
    while (cx > x) {
      const len = Math.min(dash, cx - x);
      g.lineBetween(cx, y + h, cx - len, y + h);
      cx -= dash + gap;
    }
    // Left border (Bottom to Top)
    cy = y + h;
    while (cy > y) {
      const len = Math.min(dash, cy - y);
      g.lineBetween(x, cy, x, cy - len);
      cy -= dash + gap;
    }
  }

  /**
   * 6x3 Standard Discard River (6 cols x 3 rows = 18 tiles) positioned tight against the central compass.
   * Progression is 由內而外 (Inside-out): Row 0 is closest to the central compass, Row 2 is furthest (towards the wall).
   * Top/Bottom seats: baseY = -146 (Row 0: -146, Row 1: -96, Row 2: -46).
   * Left/Right side seats: baseY = -401 (Row 0: -401, Row 1: -351, Row 2: -301).
   */
  private renderDiscards(discards: Tile[], _isLastDiscardSeat: boolean = false): void {
    this.riverGroup.removeAll(true);

    const cols = 6;
    const rows = 3;
    const dw = SeatLayoutContainer.TILE_W;
    const dh = SeatLayoutContainer.TILE_H;
    const stepX = 38;
    const stepY = 50;
    const riverStartX = -((cols * stepX) / 2);

    const isSideSeat = this.seat === 1 || this.seat === 3;
    const baseY = isSideSeat ? -401 : -146;

    // 1. Draw 18 placeholder grid cells (6x3) - 由內而外 (Row 0 closest to compass)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = riverStartX + c * stepX + dw / 2;
        const y = baseY + r * stepY;
        const cell = this.scene.add.sprite(x, y, 'mahjong:flower_cell');
        cell.setDisplaySize(dw, dh);
        this.riverGroup.add(cell);
      }
    }

    // 2. Render actual discarded tiles on top of cells (indices 0..17, 由內而外)
    discards.forEach((tile, idx) => {
      if (idx >= 18) return;
      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const x = riverStartX + col * stepX + dw / 2;
      const y = baseY + row * stepY;

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
