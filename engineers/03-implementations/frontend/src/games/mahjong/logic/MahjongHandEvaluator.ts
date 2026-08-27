/**
 * MahjongHandEvaluator.ts
 * Implements 16-tile Taiwanese Mahjong winning hand validation,
 * Eight Pairs (嚦咕嚦咕), smart Ting calculation, and action legal checks.
 */

import { Tile, Meld, ChowOption, KongOption, TingInfo } from './MahjongTypes';

export interface HandDecomposition {
  melds: { type: 'PONG' | 'CHOW'; tiles: string[] }[];
  eye: string;
}

export class MahjongHandEvaluator {
  /**
   * Sorts tiles into standard order:
   * Characters (1m-9m) -> Dots (1p-9p) -> Bamboo (1s-9s) -> Winds (E,S,W,N) -> Dragons (Red,Green,White) -> Flowers
   */
  public static sortTiles(tiles: Tile[]): Tile[] {
    const suitOrder: Record<string, number> = {
      CHARACTERS: 1,
      DOTS: 2,
      BAMBOO: 3,
      WINDS: 4,
      DRAGONS: 5,
      FLOWERS: 6,
    };

    return [...tiles].sort((a, b) => {
      const suitDiff = (suitOrder[a.suit] || 99) - (suitOrder[b.suit] || 99);
      if (suitDiff !== 0) return suitDiff;
      return a.value - b.value;
    });
  }

  /**
   * Validates if a complete set of tiles (hand + drawn/called tile + melds) is a legal winning hand.
   * Total tiles must be (17 + K) where K is number of kongs.
   */
  public static isWinningHand(handTiles: Tile[], melds: Meld[], additionalTile?: Tile): boolean {
    const allTiles = additionalTile ? [...handTiles, additionalTile] : [...handTiles];

    // Filter out flowers if any (flowers do not form melds)
    const activeTiles = allTiles.filter((t) => !t.isFlower);

    // Total expected concealed active tiles in hand (including the additional/drawn/winning tile)
    // is always (17 - melds.length * 3), because each meld (Chow/Pong/Kong) accounts for 3 concealed tiles.
    const expectedTilesInHand = 17 - melds.length * 3;
    if (activeTiles.length !== expectedTilesInHand) {
      return false;
    }

    // Check Special Hand: 嚦咕嚦咕 (Eight Pairs: 7 pairs + 1 triplet, concealed 17 tiles)
    if (melds.length === 0 && activeTiles.length === 17) {
      if (this.isEightPairs(activeTiles)) {
        return true;
      }
    }

    // Check Standard Hand: (5 - melds.length) melds + 1 pair
    const requiredMelds = 5 - melds.length;
    return this.canFormMeldsAndPair(activeTiles, requiredMelds);
  }

  /**
   * Special hand: 嚦咕嚦咕 (Eight Pairs / 7 pairs + 1 triplet = 17 tiles).
   * In Taiwanese Mahjong:
   * 1. 17 tiles total, concealed in hand (0 melds).
   * 2. Formed by exactly 7 pairs and 1 triplet, where 4-of-a-kind (quad) counts as 2 pairs.
   * 3. Satisfies: tripletCount === 1 && (pairCount + 2 * quadCount === 7).
   */
  public static isEightPairs(tiles: Tile[]): boolean {
    if (tiles.length !== 17) return false;

    const counts = new Map<string, number>();
    for (const tile of tiles) {
      counts.set(tile.shortCode, (counts.get(tile.shortCode) || 0) + 1);
    }

    let pairCount = 0;
    let tripletCount = 0;
    let quadCount = 0;

    for (const count of counts.values()) {
      if (count === 2) {
        pairCount++;
      } else if (count === 3) {
        tripletCount++;
      } else if (count === 4) {
        quadCount++;
      } else {
        return false;
      }
    }

    // Must satisfy: exactly 1 triplet and total pairs (pairCount + 2 * quadCount) === 7
    return tripletCount === 1 && pairCount + 2 * quadCount === 7;
  }

  /**
   * Standard 5 Melds + 1 Pair decomposition check.
   */
  public static canFormMeldsAndPair(tiles: Tile[], requiredMelds: number): boolean {
    const dummyMelds: Meld[] = Array(5 - requiredMelds).fill({ type: 'PONG', tiles: [] });
    return this.findWinningDecompositions(tiles, dummyMelds).length > 0;
  }

  /**
   * Finds all valid decompositions of a winning hand into concealed melds and eye.
   */
  public static findWinningDecompositions(
    handTiles: Tile[],
    melds: Meld[],
    additionalTile?: Tile
  ): HandDecomposition[] {
    const allTiles = additionalTile ? [...handTiles, additionalTile] : [...handTiles];
    const activeTiles = allTiles.filter((t) => !t.isFlower);
    const sortedTiles = this.sortTiles(activeTiles);

    const codeCounts = new Map<string, number>();
    for (const tile of sortedTiles) {
      codeCounts.set(tile.shortCode, (codeCounts.get(tile.shortCode) || 0) + 1);
    }

    const requiredMelds = 5 - melds.length;
    const decompositions: HandDecomposition[] = [];
    const uniqueCodes = Array.from(codeCounts.keys());

    for (const code of uniqueCodes) {
      const count = codeCounts.get(code)!;
      if (count >= 2) {
        // Take pair as eye
        codeCounts.set(code, count - 2);
        this.collectMelds(codeCounts, requiredMelds, [], code, decompositions);
        codeCounts.set(code, count);
      }
    }

    return decompositions;
  }

  private static collectMelds(
    counts: Map<string, number>,
    meldsRemaining: number,
    currentMelds: { type: 'PONG' | 'CHOW'; tiles: string[] }[],
    eye: string,
    results: HandDecomposition[]
  ): void {
    if (meldsRemaining === 0) {
      for (const count of counts.values()) {
        if (count > 0) return;
      }
      results.push({ melds: [...currentMelds], eye });
      return;
    }

    let firstCode: string | null = null;
    for (const [code, count] of counts.entries()) {
      if (count > 0) {
        firstCode = code;
        break;
      }
    }

    if (!firstCode) return;
    const count = counts.get(firstCode)!;

    // 1. Try Pong (Triplet)
    if (count >= 3) {
      counts.set(firstCode, count - 3);
      this.collectMelds(
        counts,
        meldsRemaining - 1,
        [...currentMelds, { type: 'PONG', tiles: [firstCode, firstCode, firstCode] }],
        eye,
        results
      );
      counts.set(firstCode, count);
    }

    // 2. Try Chow (Sequence) - Only valid for number suits (m, p, s)
    const suit = firstCode.slice(-1);
    const num = parseInt(firstCode.slice(0, -1), 10);

    if (!isNaN(num) && (suit === 'm' || suit === 'p' || suit === 's') && num <= 7) {
      const code2 = `${num + 1}${suit}`;
      const code3 = `${num + 2}${suit}`;
      const count2 = counts.get(code2) || 0;
      const count3 = counts.get(code3) || 0;

      if (count >= 1 && count2 >= 1 && count3 >= 1) {
        counts.set(firstCode, count - 1);
        counts.set(code2, count2 - 1);
        counts.set(code3, count3 - 1);

        this.collectMelds(
          counts,
          meldsRemaining - 1,
          [...currentMelds, { type: 'CHOW', tiles: [firstCode, code2, code3] }],
          eye,
          results
        );

        counts.set(firstCode, count);
        counts.set(code2, count2);
        counts.set(code3, count3);
      }
    }
  }

  /**
   * Smart Ting (智慧聽牌) Calculator.
   * Tests all 34 regular tile kinds to see which ones would complete a winning hand.
   * Strictly counts only visible information (own hand + open table info, excluding other players' concealed hands).
   */
  public static evaluateTing(
    hand: Tile[],
    melds: Meld[],
    allKnownVisibleTiles: Tile[] = []
  ): TingInfo {
    const winningTiles: TingInfo['winningTiles'] = [];

    // All 34 standard tile codes
    const sampleTiles = this.getAll34UniqueTiles();

    // Count how many copies of each tile are already visible to the player
    const visibleCounts = new Map<string, number>();
    const sourceTiles =
      allKnownVisibleTiles && allKnownVisibleTiles.length > 0
        ? allKnownVisibleTiles
        : [...hand, ...melds.flatMap((m) => m.tiles)];

    for (const t of sourceTiles) {
      if (!t.isFlower) {
        visibleCounts.set(t.shortCode, (visibleCounts.get(t.shortCode) || 0) + 1);
      }
    }

    for (const candidate of sampleTiles) {
      if (this.isWinningHand(hand, melds, candidate)) {
        const usedCount = visibleCounts.get(candidate.shortCode) || 0;
        const remainingCount = Math.max(0, 4 - usedCount);
        winningTiles.push({
          tileCode: candidate.shortCode,
          tileName: candidate.name,
          remainingCount,
        });
      }
    }

    return { winningTiles };
  }

  /**
   * Evaluates Chow (吃牌) options when previous player (上家) discards a tile.
   * Enforces:
   * 1. Only from previous player (上家)
   * 2. Number tiles only (m, p, s)
   * 3. Returns all valid combinations of 2 hand tiles that form a sequence with calledTile
   */
  public static getChowOptions(
    hand: Tile[],
    calledTile: Tile,
    fromSeat: number,
    mySeat: number
  ): ChowOption[] {
    if ((fromSeat + 1) % 4 !== mySeat) {
      return [];
    }

    const suit = calledTile.shortCode.slice(-1);
    const num = parseInt(calledTile.shortCode.slice(0, -1), 10);
    if (isNaN(num) || (suit !== 'm' && suit !== 'p' && suit !== 's')) {
      return [];
    }

    const options: ChowOption[] = [];

    const findTilesByCode = (code: string): Tile[] => {
      return hand.filter((t) => t.shortCode === code);
    };

    // Pattern 1: [num-2, num-1, (num)] (Ascending numerical sequence)
    if (num >= 3) {
      const t1 = findTilesByCode(`${num - 2}${suit}`)[0];
      const t2 = findTilesByCode(`${num - 1}${suit}`)[0];
      if (t1 && t2) {
        options.push({
          tiles: [t1, t2, calledTile],
          discardTileIds: [t1.id, t2.id],
        });
      }
    }

    // Pattern 2: [num-1, (num), num+1] (Ascending numerical sequence)
    if (num >= 2 && num <= 8) {
      const t1 = findTilesByCode(`${num - 1}${suit}`)[0];
      const t2 = findTilesByCode(`${num + 1}${suit}`)[0];
      if (t1 && t2) {
        options.push({
          tiles: [t1, calledTile, t2],
          discardTileIds: [t1.id, t2.id],
        });
      }
    }

    // Pattern 3: [(num), num+1, num+2] (Ascending numerical sequence)
    if (num <= 7) {
      const t1 = findTilesByCode(`${num + 1}${suit}`)[0];
      const t2 = findTilesByCode(`${num + 2}${suit}`)[0];
      if (t1 && t2) {
        options.push({
          tiles: [calledTile, t1, t2],
          discardTileIds: [t1.id, t2.id],
        });
      }
    }

    return options;
  }

  /**
   * Checks if player can Pong (碰牌).
   * Enforces 同巡過碰不得碰同名牌 lockout.
   */
  public static canPong(
    hand: Tile[],
    calledTile: Tile,
    passPongCodesInTurn: Set<string>
  ): boolean {
    if (calledTile.isFlower) return false;
    if (passPongCodesInTurn.has(calledTile.shortCode)) return false;

    const matching = hand.filter((t) => t.shortCode === calledTile.shortCode);
    return matching.length >= 2;
  }

  /**
   * Checks if player can Melded Kong (大明槓).
   * Enforces:
   * 1. Hand has 3 matching tiles.
   * 2. Forbidden against Upper Player (禁止大明槓上家).
   */
  public static canMeldedKong(
    hand: Tile[],
    calledTile: Tile,
    fromSeat: number,
    mySeat: number
  ): boolean {
    if (calledTile.isFlower) return false;
    if ((fromSeat + 1) % 4 === mySeat) {
      // Forbidden against upper player (上家)
      return false;
    }

    const matching = hand.filter((t) => t.shortCode === calledTile.shortCode);
    return matching.length >= 3;
  }

  /**
   * Finds all available Kong options during player's own turn (Concealed or Added).
   * Supports excluding newly claimed Pong tileCode on the immediate post-Pong discard turn.
   */
  public static getSelfKongOptions(
    hand: Tile[],
    melds: Meld[],
    excludedAddedKongTileCode?: string
  ): KongOption[] {
    const options: KongOption[] = [];

    // 1. Concealed Kongs (4 matching tiles in hand)
    const codeMap = new Map<string, Tile[]>();
    for (const t of hand) {
      if (t.isFlower) continue;
      const list = codeMap.get(t.shortCode) || [];
      list.push(t);
      codeMap.set(t.shortCode, list);
    }

    for (const [code, list] of codeMap.entries()) {
      if (list.length === 4) {
        options.push({
          type: 'CONCEALED_KONG',
          tileCode: code,
          handTileIds: list.map((t) => t.id),
        });
      }
    }

    // 2. Added Kongs (Hand has 4th tile matching an existing open PONG meld)
    melds.forEach((meld, index) => {
      if (meld.type === 'PONG') {
        const meldCode = meld.tiles[0].shortCode;
        if (excludedAddedKongTileCode && meldCode === excludedAddedKongTileCode) {
          return; // Forbidden on the same turn the Pong was just claimed
        }
        const matchingHandTile = hand.find((t) => t.shortCode === meldCode);
        if (matchingHandTile) {
          options.push({
            type: 'ADDED_KONG',
            tileCode: meldCode,
            handTileIds: [matchingHandTile.id],
            meldIndex: index,
          });
        }
      }
    });

    return options;
  }

  /**
   * Generates a template list of all 34 unique standard mahjong tile types.
   */
  public static getAll34UniqueTiles(): Tile[] {
    const tiles: Tile[] = [];
    const chineseNums = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

    // Characters (萬)
    for (let i = 1; i <= 9; i++) {
      tiles.push({
        id: `${i}m_template`,
        suit: 'CHARACTERS',
        value: i,
        name: `${chineseNums[i]}萬`,
        shortCode: `${i}m`,
      });
    }
    // Dots (筒)
    for (let i = 1; i <= 9; i++) {
      tiles.push({
        id: `${i}p_template`,
        suit: 'DOTS',
        value: i,
        name: `${chineseNums[i]}筒`,
        shortCode: `${i}p`,
      });
    }
    // Bamboo (條)
    for (let i = 1; i <= 9; i++) {
      tiles.push({
        id: `${i}s_template`,
        suit: 'BAMBOO',
        value: i,
        name: `${chineseNums[i]}條`,
        shortCode: `${i}s`,
      });
    }
    // Winds
    const winds = [
      { val: 1, code: 'east', name: '東風' },
      { val: 2, code: 'south', name: '南風' },
      { val: 3, code: 'west', name: '西風' },
      { val: 4, code: 'north', name: '北風' },
    ];
    winds.forEach((w) => {
      tiles.push({
        id: `${w.code}_template`,
        suit: 'WINDS',
        value: w.val,
        name: w.name,
        shortCode: w.code,
      });
    });
    // Dragons
    const dragons = [
      { val: 1, code: 'red', name: '紅中' },
      { val: 2, code: 'green', name: '青發' },
      { val: 3, code: 'white', name: '白板' },
    ];
    dragons.forEach((d) => {
      tiles.push({
        id: `${d.code}_template`,
        suit: 'DRAGONS',
        value: d.val,
        name: d.name,
        shortCode: d.code,
      });
    });

    return tiles;
  }
}
