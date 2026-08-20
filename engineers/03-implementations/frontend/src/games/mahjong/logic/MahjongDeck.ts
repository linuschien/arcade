/**
 * MahjongDeck.ts
 * Manages the complete 144-tile pool, wall breaking, clockwise head dealing,
 * and counter-clockwise tail replenishment with 16 dynamic dead wall tiles.
 */

import { Tile, SuitType } from './MahjongTypes';

export class MahjongDeck {
  private tiles: Tile[] = [];
  private headIndex: number = 0;
  private tailIndex: number = 0;
  private totalDrawnCount: number = 0;
  private tailDrawnCount: number = 0;
  private initialTotalTiles: number = 144;
  private deadWallReserve: number = 16; // 16 iron tiles reserved at tail
  private isLastDrawFromTail: boolean = false;

  constructor() {
    this.reset();
  }

  /**
   * Generates all 144 tiles for Taiwanese Mahjong.
   */
  public static generateAll144Tiles(): Tile[] {
    const tiles: Tile[] = [];

    const suitConfigs: { suit: SuitType; count: number; suffix: string; prefixName: string }[] = [
      { suit: 'CHARACTERS', count: 9, suffix: 'm', prefixName: '萬' },
      { suit: 'DOTS', count: 9, suffix: 'p', prefixName: '筒' },
      { suit: 'BAMBOO', count: 9, suffix: 's', prefixName: '條' },
    ];

    const chineseNums = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

    // 1. Number tiles (108 tiles)
    suitConfigs.forEach(({ suit, count, suffix, prefixName }) => {
      for (let val = 1; val <= count; val++) {
        for (let copy = 0; copy < 4; copy++) {
          tiles.push({
            id: `${val}${suffix}_${copy}`,
            suit,
            value: val,
            name: `${chineseNums[val]}${prefixName}`,
            shortCode: `${val}${suffix}`,
          });
        }
      }
    });

    // 2. Wind tiles (16 tiles)
    const winds: { val: number; code: string; name: string }[] = [
      { val: 1, code: 'east', name: '東風' },
      { val: 2, code: 'south', name: '南風' },
      { val: 3, code: 'west', name: '西風' },
      { val: 4, code: 'north', name: '北風' },
    ];
    winds.forEach(({ val, code, name }) => {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push({
          id: `${code}_${copy}`,
          suit: 'WINDS',
          value: val,
          name,
          shortCode: code,
        });
      }
    });

    // 3. Dragon tiles (12 tiles)
    const dragons: { val: number; code: string; name: string }[] = [
      { val: 1, code: 'red', name: '紅中' },
      { val: 2, code: 'green', name: '青發' },
      { val: 3, code: 'white', name: '白板' },
    ];
    dragons.forEach(({ val, code, name }) => {
      for (let copy = 0; copy < 4; copy++) {
        tiles.push({
          id: `${code}_${copy}`,
          suit: 'DRAGONS',
          value: val,
          name,
          shortCode: code,
        });
      }
    });

    // 4. Flower tiles (8 tiles: 4 Seasons + 4 Noble Plants)
    const seasons: { val: number; code: string; name: string }[] = [
      { val: 1, code: 'spring', name: '春' },
      { val: 2, code: 'summer', name: '夏' },
      { val: 3, code: 'autumn', name: '秋' },
      { val: 4, code: 'winter', name: '冬' },
    ];
    seasons.forEach(({ val, code, name }) => {
      tiles.push({
        id: `${code}_0`,
        suit: 'FLOWERS',
        value: val,
        name,
        shortCode: code,
        isFlower: true,
      });
    });

    const plants: { val: number; code: string; name: string }[] = [
      { val: 1, code: 'plum', name: '梅' },
      { val: 2, code: 'orchid', name: '蘭' },
      { val: 3, code: 'bamboo_f', name: '竹' },
      { val: 4, code: 'chrysanthemum', name: '菊' },
    ];
    plants.forEach(({ val, code, name }) => {
      tiles.push({
        id: `${code}_0`,
        suit: 'FLOWERS',
        value: val,
        name,
        shortCode: code,
        isFlower: true,
      });
    });

    return tiles;
  }

  /**
   * Resets and shuffles the full 144-tile deck.
   */
  public reset(customTiles?: Tile[]): void {
    this.tiles = customTiles ? [...customTiles] : MahjongDeck.generateAll144Tiles();
    this.shuffle();
    this.headIndex = 0;
    this.tailIndex = this.tiles.length - 1;
    this.totalDrawnCount = 0;
    this.tailDrawnCount = 0;
    this.deadWallReserve = 16;
    this.isLastDrawFromTail = false;
  }

  /**
   * Fisher-Yates shuffle.
   */
  public shuffle(): void {
    for (let i = this.tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
    }
  }

  private breakStackIndex: number = 0;

  /**
   * Sets up the circular wall break using 3 dice sum S in [3, 18].
   * Retains S stacks at the break point.
   */
  public setupWallBreak(diceSum: number, dealerSeatIndex: number = 0): {
    breakSeat: number;
    breakStack: number;
    headIndex: number;
    tailIndex: number;
  } {
    const seatOffset = (diceSum - 1) % 4;
    const breakSeat = (dealerSeatIndex + seatOffset) % 4;
    const breakStack = diceSum; // S stacks retained on target wall

    // Reorganize tiles array starting from Head
    // Total 72 stacks (18 stacks per player seat).
    // Clockwise physical wall mapping:
    // Seat 0 (Bottom Wall): Stacks 0..17
    // Seat 1 (Right Wall): Stacks 54..71
    // Seat 2 (Top Wall): Stacks 36..53
    // Seat 3 (Left Wall): Stacks 18..35
    const seatWallStarts = [0, 54, 36, 18];
    const breakStackIndex = (seatWallStarts[breakSeat] + breakStack) % 72;
    this.breakStackIndex = breakStackIndex;
    const breakTileIndex = breakStackIndex * 2; // 2 tiles per stack

    // Rotate tiles so headIndex = 0 corresponds to breakTileIndex
    const reordered: Tile[] = [];
    for (let i = 0; i < this.tiles.length; i++) {
      reordered.push(this.tiles[(breakTileIndex + i) % this.tiles.length]);
    }
    this.tiles = reordered;
    this.headIndex = 0;
    this.tailIndex = this.tiles.length - 1;
    this.totalDrawnCount = 0;
    this.tailDrawnCount = 0;

    return {
      breakSeat,
      breakStack,
      headIndex: this.headIndex,
      tailIndex: this.tailIndex,
    };
  }

  /**
   * Calculates the number of tiles (0, 1, or 2) remaining on a physical wall stack (0 to 71).
   */
  public getStackRemainingTileCount(stackIndex: number): number {
    const relStack = (stackIndex - this.breakStackIndex + 72) % 72;
    const tileA = relStack * 2;
    const tileB = relStack * 2 + 1;

    let count = 0;
    if (this.headIndex <= this.tailIndex) {
      if (tileA >= this.headIndex && tileA <= this.tailIndex) count++;
      if (tileB >= this.headIndex && tileB <= this.tailIndex) count++;
    } else {
      if (tileA >= this.headIndex || tileA <= this.tailIndex) count++;
      if (tileB >= this.headIndex || tileB <= this.tailIndex) count++;
    }
    return count;
  }

  public getBreakStackIndex(): number {
    return this.breakStackIndex;
  }

  /**
   * Checks if a physical wall stack (0 to 71) currently belongs to the 16 Dead Wall (海底鐵牌) reserve.
   */
  public isStackInDeadWall(stackIndex: number): boolean {
    const relStack = (stackIndex - this.breakStackIndex + 72) % 72;
    const tailRelStack = Math.floor(this.tailIndex / 2);
    const diff = (tailRelStack - relStack + 72) % 72;
    return diff >= 0 && diff < 8;
  }

  /**
   * Regular draw from the head of the wall (clockwise dealing).
   * Returns null if remaining tiles would breach the 16 dead wall tiles.
   */
  public drawHead(): Tile | null {
    if (!this.hasRegularTilesLeft()) {
      return null;
    }
    this.isLastDrawFromTail = false;
    const tile = this.tiles[this.headIndex];
    this.headIndex = (this.headIndex + 1) % this.tiles.length;
    this.totalDrawnCount++;
    return tile;
  }

  /**
   * Replenishment draw from the tail of the wall (counter-clockwise flower/kong replenishment).
   * Shifts the dead wall forward by 1 tile.
   */
  public drawTail(): Tile | null {
    if (!this.hasRegularTilesLeft()) {
      return null;
    }
    this.isLastDrawFromTail = true;
    const tile = this.tiles[this.tailIndex];
    this.tailIndex = (this.tailIndex - 1 + this.tiles.length) % this.tiles.length;
    this.totalDrawnCount++;
    this.tailDrawnCount++;
    return tile;
  }

  public wasLastDrawFromTail(): boolean {
    return this.isLastDrawFromTail;
  }

  /**
   * Checks if regular tiles are available (excluding the 16 dead wall tiles).
   */
  public hasRegularTilesLeft(): boolean {
    return this.getRegularRemainingCount() > 0;
  }

  /**
   * Number of regular tiles that can be legally drawn before reaching dead wall.
   */
  public getRegularRemainingCount(): number {
    return Math.max(0, this.initialTotalTiles - this.totalDrawnCount - this.deadWallReserve);
  }

  /**
   * Current dead wall reserve count (fixed at 16).
   */
  public getDeadWallCount(): number {
    return this.deadWallReserve;
  }

  /**
   * Total tiles remaining in the physical wall (regular + dead wall).
   */
  public getTotalRemainingTiles(): number {
    return Math.max(0, this.initialTotalTiles - this.totalDrawnCount);
  }

  public getTiles(): Tile[] {
    return [...this.tiles];
  }
}
