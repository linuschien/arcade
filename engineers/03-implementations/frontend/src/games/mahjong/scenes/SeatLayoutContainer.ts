/**
 * SeatLayoutContainer.ts
 * Shared first-person local coordinate layout container for each of the 4 Mahjong seats.
 * Manages HandZone, Modular MeldZone (3-tile fixed grid), 4x2 Flower Rack,
 * 6x3 Discard River, and Anti-Rotated HUD.
 */

import Phaser from 'phaser';
import { PlayerProfile, Tile, Meld, PlayerSeat, SeatWind } from '../logic/MahjongTypes';

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
  public drawnSlotWorldX: number = 934;

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
    const isDealer = profile.isDealer;
    const windColor = isDealer ? '#facc15' : '#e2e8f0';

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
   * Renders Banker Dice adjacent to the Flower Rack (below flower rack from dealer's perspective).
   */
  public showBankerDice(diceResult: number[] | null, isDealer: boolean = false, _handStartX: number = -288): void {
    this.bankerDiceGroup.removeAll(true);
    if (!isDealer || !diceResult || diceResult.length < 3) return;

    const isSideSeat = this.seat === 1 || this.seat === 3;
    const diceX = isSideSeat ? -156 : -373;
    const diceY = isSideSeat ? -67 : -64;

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
    diceResult: number[] | null = null,
    effectiveWind?: SeatWind
  ): void {
    this.updatePlayerInfo(profile, roundWind);

    // Calculate symmetrical centering for Hand + Reserved Drawn Slot + Melds
    const meldCount = profile.melds.length;
    const stepX = SeatLayoutContainer.TILE_W;
    const meldW = SeatLayoutContainer.TILE_W * 3;
    const meldBlockW = meldW + 8;
    const gapDrawn = 12;

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

    // 4x2 Flower Rack Pinwheel aligned with Discard River Row 2 & Side Flower Racks:
    // Human (0°): Left edge at X = 191, Bottom edge at Y = 592.
    // North (180°): Right edge at X = 1089, Top edge at Y = 128.
    // West (90°): Left edge at X = 191, Top edge at Y = 128.
    // East (270°): Right edge at X = 1089, Bottom edge at Y = 592.
    const activeWind = effectiveWind || profile.wind;
    this.renderFlowerRack(profile.flowers, activeWind, handStartX);
    this.showBankerDice(diceResult, profile.isDealer, handStartX);

    this.renderDiscards(profile.discards, isLastDiscardSeat);
  }

  /**
   * 4x2 Flower Rack Pinwheel aligned with Discard River Row 2 & Side Flower Racks.
   * Seat 0 (Human, 0°): Local center (-373, -137) -> World (267, 543), Left edge at X = 191, Bottom edge at Y = 592.
   * Seat 3 (West, 90°): Local center (-156, -140) -> World (240, 204), Left edge at X = 191, Top edge at Y = 128.
   * Seat 2 (North, 180°): Local center (-373, -137) -> World (1013, 177), Right edge at X = 1089, Top edge at Y = 128.
   * Seat 1 (East, 270°): Local center (-156, -140) -> World (1040, 516), Right edge at X = 1089, Bottom edge at Y = 592.
   */
  private renderFlowerRack(flowers: Tile[], wind?: string, _handStartX: number = -288): void {
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

    const isSideSeat = this.seat === 1 || this.seat === 3;
    const flowerCenterX = isSideSeat ? -156 : -373;
    const flowerCenterY = -137;
    const flowerStartX = flowerCenterX - ((4 * stepX) / 2);

    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 4; c++) {
        const idx = r * 4 + c;
        const x = flowerStartX + c * stepX + cellW / 2;
        const y = flowerCenterY + (r === 0 ? -25 : 25);

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
        // CHOW: 3 tiles in ascending numerical order, with calledTile rotated 90 degrees sideways
        for (let i = 0; i < 3; i++) {
          const x = (i - 1) * tileStep;
          const tile = meld.tiles[i];
          const sprite = this.scene.add.sprite(x, 0, `mahjong:tile_${tile.shortCode}`);
          const isCalledTile = meld.calledTile
            ? tile.id === meld.calledTile.id ||
              (tile.shortCode === meld.calledTile.shortCode &&
                !meld.tiles.slice(0, i).some((prev) => prev.id === meld.calledTile?.id))
            : false;
          if (isCalledTile) {
            sprite.setAngle(90);
          }
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
    this.drawnSlotWorldX = this.x + drawnX;

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
   * 4 / 6 / 8 Trapezoidal Discard River (Row 0: 4, Row 1: 6, Row 2: 8 = 18 tiles total).
   * Row 0 width (152px) aligns with the 156x156 central compass with zero corner collisions.
   * Progression is 由內而外 (Inside-out): Row 0 is closest to the central compass, Row 2 is furthest (towards the wall).
   * Top/Bottom seats: baseY = -178 (Row 0: -178, Row 1: -128, Row 2: -78).
   * Left/Right side seats: baseY = -433 (Row 0: -433, Row 1: -383, Row 2: -333).
   */
  private renderDiscards(discards: Tile[], _isLastDiscardSeat: boolean = false): void {
    this.riverGroup.removeAll(true);

    const dw = SeatLayoutContainer.TILE_W;
    const dh = SeatLayoutContainer.TILE_H;
    const stepX = 38;
    const stepY = 50;

    const isSideSeat = this.seat === 1 || this.seat === 3;
    const baseY = isSideSeat ? -429 : -212;

    // 1. Draw 18 placeholder grid cells (4 / 6 / 8 trapezoid) - 由內而外
    for (let idx = 0; idx < 18; idx++) {
      const { x, y } = this.getDiscardCoord(idx, baseY, stepX, stepY, dw);
      const cell = this.scene.add.sprite(x, y, 'mahjong:flower_cell');
      cell.setDisplaySize(dw, dh);
      this.riverGroup.add(cell);
    }

    // 2. Render actual discarded tiles on top of cells (indices 0..17, 由內而外)
    discards.forEach((tile, idx) => {
      if (idx >= 18) return;
      const { x, y } = this.getDiscardCoord(idx, baseY, stepX, stepY, dw);

      const sprite = this.scene.add.sprite(x, y, `mahjong:tile_${tile.shortCode}`);
      sprite.setDisplaySize(dw, dh);
      sprite.setData('isDiscardTile', true);
      sprite.setData('shortCode', tile.shortCode);

      this.riverGroup.add(sprite);
    });
  }

  /**
   * Computes the (x, y) coordinate for the 4 / 6 / 8 trapezoidal discard grid.
   */
  private getDiscardCoord(idx: number, baseY: number, stepX: number, stepY: number, dw: number): { x: number; y: number } {
    let row = 0;
    let col = idx;
    let colsInRow = 4;

    if (idx >= 10) {
      row = 2;
      col = idx - 10;
      colsInRow = 8;
    } else if (idx >= 4) {
      row = 1;
      col = idx - 4;
      colsInRow = 6;
    }

    const rowStartX = -((colsInRow * stepX) / 2);
    const x = rowStartX + col * stepX + dw / 2;
    const y = baseY + row * stepY;
    return { x, y };
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
