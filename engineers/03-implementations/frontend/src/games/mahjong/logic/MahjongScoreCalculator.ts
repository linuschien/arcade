/**
 * MahjongScoreCalculator.ts
 * Implements 500 Base / 200 Fan scoring, dealer 2N+1 responsibility,
 * strict mutual exclusion hierarchies, and ordered fan breakdown display.
 */

import {
  Tile,
  Meld,
  SeatWind,
  PlayerSeat,
  FanItem,
  SettlementBreakdown,
} from './MahjongTypes';
import { MahjongHandEvaluator } from './MahjongHandEvaluator';

export interface ScoreEvaluationContext {
  winnerSeat: PlayerSeat;
  winnerHand: Tile[];
  winnerMelds: Meld[];
  winnerFlowers: Tile[];
  winningTile: Tile;
  isSelfDrawn: boolean;
  loserSeat?: PlayerSeat; // Required if !isSelfDrawn
  isRobbingKong?: boolean;
  isKongBloom?: boolean; // 槓上開花
  isLastTileDraw?: boolean; // 海底撈月
  isHeavenlyWin?: boolean; // 天胡
  isEarthlyWin?: boolean; // 地胡
  isHumanWin?: boolean; // 人胡
  isFlowerWin?: boolean; // 八仙過海 / 七搶一
  roundWind: SeatWind;
  playerWind: SeatWind;
  dealerSeat: PlayerSeat;
  dealerStreak: number; // N
  currentChips: number[]; // 4 players chips
}

export class MahjongScoreCalculator {
  public static readonly BASE_POINTS = 500;
  public static readonly FAN_RATE = 200;

  /**
   * Calculates the full settlement breakdown for a round win.
   */
  public static evaluateSettlement(ctx: ScoreEvaluationContext): SettlementBreakdown {
    const isDealer = ctx.winnerSeat === ctx.dealerSeat;
    const dealerMultiplierFan = 2 * ctx.dealerStreak + 1;

    const fanItems: FanItem[] = [];

    // Special flower win fast-path
    if (ctx.isFlowerWin) {
      if (ctx.winnerFlowers.length === 8) {
        fanItems.push({ name: '八仙過海', fan: 8, description: '集齊全部八張花牌自摸' });
      } else {
        fanItems.push({ name: '七搶一', fan: 8, description: '手持七張花牌搶進第八張花牌' });
      }
    } else {
      // 1. Evaluate Special Hands / Patterns
      this.evaluateHandPatterns(ctx, fanItems);
    }

    // Sum fans
    const totalFans = fanItems.reduce((acc, item) => acc + item.fan, 0);

    // Calculate Chip Deltas
    const chipDeltas = [0, 0, 0, 0];
    const base = this.BASE_POINTS;
    const rate = this.FAN_RATE;

    if (ctx.isSelfDrawn) {
      // Self Drawn: All 3 opponents pay
      for (let seat = 0; seat < 4; seat++) {
        if (seat === ctx.winnerSeat) continue;

        let fansToPay = totalFans;
        if (isDealer || seat === ctx.dealerSeat) {
          fansToPay += dealerMultiplierFan;
        }

        const amount = base + rate * fansToPay;
        chipDeltas[seat] -= amount;
        chipDeltas[ctx.winnerSeat] += amount;
      }
    } else {
      // Ron: Single loser pays
      const loser = ctx.loserSeat ?? ((ctx.winnerSeat + 3) % 4 as PlayerSeat);
      let fansToPay = totalFans;

      if (isDealer || loser === ctx.dealerSeat) {
        fansToPay += dealerMultiplierFan;
      }

      const amount = base + rate * fansToPay;
      chipDeltas[loser] -= amount;
      chipDeltas[ctx.winnerSeat] += amount;
    }

    const remainingChips = ctx.currentChips.map((c, i) => c + chipDeltas[i]);

    const playerNames = ['賭神', '賭俠小刀', '賭聖阿星', '賭霸有喜'];

    return {
      winnerSeat: ctx.winnerSeat,
      isSelfDrawn: ctx.isSelfDrawn,
      loserSeat: ctx.loserSeat,
      winningTile: ctx.winningTile,
      isRobbingKong: ctx.isRobbingKong,
      isFlowerWin: ctx.isFlowerWin,
      isDraw: false,
      basePoints: base,
      fanRate: rate,
      dealerMultiplierFan,
      dealerStreak: ctx.dealerStreak,
      fans: fanItems,
      totalFans,
      chipDeltas,
      remainingChips,
      winnerName: playerNames[ctx.winnerSeat],
    };
  }

  /**
   * Helper to evaluate all fan types following strict mutual exclusion rules.
   */
  private static evaluateHandPatterns(
    ctx: ScoreEvaluationContext,
    fans: FanItem[]
  ): void {
    const allTiles = [
      ...ctx.winnerHand,
      ...(ctx.winningTile ? [ctx.winningTile] : []),
    ].filter((t): t is Tile => Boolean(t));
    const melds = ctx.winnerMelds || [];
    const isEightPairs = MahjongHandEvaluator.isEightPairs(allTiles) && melds.length === 0;

    // --- 1. Top Hierarchy: 字一色 (16) vs 清一色 (8) vs 混一色 (4) ---
    const allUniqueSuits = new Set<string>();
    for (const t of allTiles) {
      if (!t.isFlower) allUniqueSuits.add(t.suit);
    }
    for (const m of melds) {
      for (const t of m.tiles) {
        if (!t.isFlower) allUniqueSuits.add(t.suit);
      }
    }

    const hasNumberSuits =
      allUniqueSuits.has('CHARACTERS') ||
      allUniqueSuits.has('DOTS') ||
      allUniqueSuits.has('BAMBOO');
    const hasHonors = allUniqueSuits.has('WINDS') || allUniqueSuits.has('DRAGONS');

    let isAllHonors = false;
    let isFullFlush = false;
    let isHalfFlush = false;

    if (!hasNumberSuits && hasHonors) {
      isAllHonors = true;
      fans.push({ name: '字一色', fan: 16, description: '全由字牌組成' });
    } else if (hasNumberSuits && !hasHonors) {
      // Exactly 1 number suit
      const numberSuitCount =
        (allUniqueSuits.has('CHARACTERS') ? 1 : 0) +
        (allUniqueSuits.has('DOTS') ? 1 : 0) +
        (allUniqueSuits.has('BAMBOO') ? 1 : 0);
      if (numberSuitCount === 1) {
        isFullFlush = true;
        fans.push({ name: '清一色', fan: 8, description: '全由單一數牌組成' });
      }
    } else if (hasNumberSuits && hasHonors) {
      const numberSuitCount =
        (allUniqueSuits.has('CHARACTERS') ? 1 : 0) +
        (allUniqueSuits.has('DOTS') ? 1 : 0) +
        (allUniqueSuits.has('BAMBOO') ? 1 : 0);
      if (numberSuitCount === 1) {
        isHalfFlush = true;
        fans.push({ name: '混一色', fan: 4, description: '單一數牌搭配字牌' });
      }
    }

    // --- 2. Winds Hierarchy: 大四喜 (16) vs 小四喜 (8) vs 圈/門風 ---
    const windPongs = this.countMeldsOrTriplets(allTiles, melds, ['east', 'south', 'west', 'north']);
    const windPairs = this.countPairs(allTiles, ['east', 'south', 'west', 'north']);

    let hasBigFourWinds = false;
    let hasSmallFourWinds = false;

    if (windPongs === 4) {
      hasBigFourWinds = true;
      fans.push({ name: '大四喜', fan: 16, description: '湊齊東南西北四組刻子' });
    } else if (windPongs === 3 && windPairs === 1) {
      hasSmallFourWinds = true;
      fans.push({ name: '小四喜', fan: 8, description: '三組風刻加一組風對' });
    }

    // --- 3. Dragons Hierarchy: 大三元 (8) vs 小三元 (4) vs 三元牌刻子 (1 each) ---
    const dragonPongs = this.countMeldsOrTriplets(allTiles, melds, ['red', 'green', 'white']);
    const dragonPairs = this.countPairs(allTiles, ['red', 'green', 'white']);

    let hasBigThreeDragons = false;
    let hasSmallThreeDragons = false;

    if (dragonPongs === 3) {
      hasBigThreeDragons = true;
      fans.push({ name: '大三元', fan: 8, description: '湊齊中發白三組刻子' });
    } else if (dragonPongs === 2 && dragonPairs === 1) {
      hasSmallThreeDragons = true;
      fans.push({ name: '小三元', fan: 4, description: '兩組三元刻加一組三元對' });
    }

    // --- 4. 嚦咕嚦咕 (8) Special Hand ---
    if (isEightPairs) {
      fans.push({ name: '嚦咕嚦咕', fan: 8, description: '七對加一刻全門清特殊牌型' });
      if (ctx.isSelfDrawn) {
        fans.push({ name: '自摸', fan: 1, description: '自摸胡牌' });
      }
      // Eight pairs skips All Triplets, Concealed Triplets, Ping Hu, Men Qing
      this.evaluateFlowers(ctx, fans);
      this.evaluateSituationalFans(ctx, fans);
      return;
    }

    // --- 5. Triplets Hierarchy & Concealed Triplets ---
    // All Triplets (碰碰胡 4)
    const isAllTriplets = this.checkAllTriplets(allTiles, melds);
    if (isAllTriplets && !isAllHonors) {
      fans.push({ name: '碰碰胡', fan: 4, description: '五組面子全部為刻子或槓子' });
    }

    // Concealed Triplets (三暗刻 2 / 四暗刻 5 / 五暗刻 8)
    const concealedCount = this.countConcealedTriplets(allTiles, melds, ctx.winningTile, ctx.isSelfDrawn);
    if (concealedCount === 5) {
      fans.push({ name: '五暗刻', fan: 8, description: '手內五組暗刻' });
    } else if (concealedCount === 4) {
      fans.push({ name: '四暗刻', fan: 5, description: '手內四組暗刻' });
    } else if (concealedCount === 3) {
      fans.push({ name: '三暗刻', fan: 2, description: '手內三組暗刻' });
    }

    // --- 6. Winds & Dragons Individual Fans (if not Big/Small Four Winds or Dragons) ---
    if (!hasBigFourWinds && !hasSmallFourWinds) {
      const roundWindCode = ctx.roundWind.toLowerCase();
      const playerWindCode = ctx.playerWind.toLowerCase();

      const hasRoundWind = this.hasMeldOrTriplet(allTiles, melds, roundWindCode);
      const hasPlayerWind = this.hasMeldOrTriplet(allTiles, melds, playerWindCode);

      if (hasRoundWind && hasPlayerWind && roundWindCode === playerWindCode) {
        fans.push({ name: '雙風台', fan: 2, description: '圈風與門風皆為東風' });
      } else {
        if (hasRoundWind) {
          fans.push({ name: '圈風台', fan: 1, description: `擁有圈風刻子 (${ctx.roundWind})` });
        }
        if (hasPlayerWind) {
          fans.push({ name: '門風台', fan: 1, description: `擁有門風刻子 (${ctx.playerWind})` });
        }
      }
    }

    if (!hasBigThreeDragons && !hasSmallThreeDragons) {
      const dragons = [
        { code: 'red', name: '紅中' },
        { code: 'green', name: '青發' },
        { code: 'white', name: '白板' },
      ];
      dragons.forEach((d) => {
        if (this.hasMeldOrTriplet(allTiles, melds, d.code)) {
          fans.push({ name: `${d.name}刻子`, fan: 1, description: `擁有${d.name}刻子` });
        }
      });
    }

    // --- 7. 平胡 (2) Strict Check ---
    const isPingHu = this.checkPingHu(ctx, allTiles, melds);
    if (isPingHu) {
      fans.push({ name: '平胡', fan: 2, description: '五組全順子、數牌雀頭、兩面聽且放銃' });
    }

    // --- 8. 門清 / 自摸 / 門清自摸 / 全求人 ---
    const hasOpenMelds = melds.some(
      (m) => m.type === 'CHOW' || m.type === 'PONG' || m.type === 'MELDED_KONG' || m.type === 'ADDED_KONG'
    );

    if (!hasOpenMelds && ctx.isSelfDrawn) {
      // 門清自摸 (3) - 天胡與地胡已內含門清自摸，不重複累加
      if (!ctx.isHeavenlyWin && !ctx.isEarthlyWin) {
        fans.push({ name: '門清自摸', fan: 3, description: '全門清且自摸胡牌 (門清一摸三)' });
      }
    } else if (!hasOpenMelds && !ctx.isSelfDrawn) {
      // 門清 (1) - 人胡已內含門清，不重複累加
      if (!ctx.isHumanWin) {
        fans.push({ name: '門清', fan: 1, description: '全門清放銃胡牌' });
      }
    } else if (hasOpenMelds && ctx.isSelfDrawn) {
      // 自摸 (1)
      if (!ctx.isHeavenlyWin && !ctx.isEarthlyWin) {
        fans.push({ name: '自摸', fan: 1, description: '自摸胡牌' });
      }
    } else if (melds.length === 5 && !ctx.isSelfDrawn) {
      // 全求人 (2) - 5 open melds, 1 single wait tile won on ron
      fans.push({ name: '全求人', fan: 2, description: '五組面子全副露單騎聽放銃' });
    }

    // --- 9. Flowers ---
    this.evaluateFlowers(ctx, fans);

    // --- 10. Situational Fans ---
    this.evaluateSituationalFans(ctx, fans);
  }

  /**
   * Checks strict 平胡 conditions:
   * 1. 5 melds all sequences (chows), no triplets/kongs.
   * 2. Eye is a number tile (no winds, no dragons).
   * 3. Two-sided wait (兩面聽).
   * 4. 0 Flowers (零花牌).
   * 5. Ron only (!isSelfDrawn).
   */
  private static checkPingHu(
    ctx: ScoreEvaluationContext,
    allTiles: Tile[],
    melds: Meld[]
  ): boolean {
    if (ctx.isSelfDrawn) return false;
    if (ctx.winnerFlowers.length > 0) return false;

    // Check that all melds are CHOWs
    for (const m of melds) {
      if (m.type !== 'CHOW') return false;
    }

    // Decompose hand into all CHOWs and 1 Pair
    const codeCounts = new Map<string, number>();
    for (const t of allTiles) {
      codeCounts.set(t.shortCode, (codeCounts.get(t.shortCode) || 0) + 1);
    }

    let foundPingHuStructure = false;

    // Test each candidate pair
    for (const [pairCode, count] of codeCounts.entries()) {
      if (count >= 2) {
        // Pair must be number suit (not wind or dragon)
        const suit = pairCode.slice(-1);
        if (suit !== 'm' && suit !== 'p' && suit !== 's') continue;

        codeCounts.set(pairCode, count - 2);

        // Can remaining form all sequences?
        if (this.canFormOnlySequences(codeCounts, 5 - melds.length)) {
          // Check two-sided wait for winning tile
          if (this.isTwoSidedWait(ctx.winnerHand, melds, ctx.winningTile, pairCode)) {
            foundPingHuStructure = true;
            codeCounts.set(pairCode, count);
            break;
          }
        }

        codeCounts.set(pairCode, count);
      }
    }

    return foundPingHuStructure;
  }

  private static canFormOnlySequences(counts: Map<string, number>, remaining: number): boolean {
    if (remaining === 0) {
      for (const count of counts.values()) {
        if (count > 0) return false;
      }
      return true;
    }

    let firstCode: string | null = null;
    for (const [code, count] of counts.entries()) {
      if (count > 0) {
        firstCode = code;
        break;
      }
    }
    if (!firstCode) return false;

    const suit = firstCode.slice(-1);
    const num = parseInt(firstCode.slice(0, -1), 10);
    if (isNaN(num) || (suit !== 'm' && suit !== 'p' && suit !== 's') || num > 7) {
      return false;
    }

    const code2 = `${num + 1}${suit}`;
    const code3 = `${num + 2}${suit}`;
    const c1 = counts.get(firstCode) || 0;
    const c2 = counts.get(code2) || 0;
    const c3 = counts.get(code3) || 0;

    if (c1 >= 1 && c2 >= 1 && c3 >= 1) {
      counts.set(firstCode, c1 - 1);
      counts.set(code2, c2 - 1);
      counts.set(code3, c3 - 1);

      if (this.canFormOnlySequences(counts, remaining - 1)) {
        counts.set(firstCode, c1);
        counts.set(code2, c2);
        counts.set(code3, c3);
        return true;
      }

      counts.set(firstCode, c1);
      counts.set(code2, c2);
      counts.set(code3, c3);
    }

    return false;
  }

  private static isTwoSidedWait(
    hand: Tile[],
    melds: Meld[],
    winningTile: Tile,
    pairCode: string
  ): boolean {
    const suit = winningTile.shortCode.slice(-1);
    const num = parseInt(winningTile.shortCode.slice(0, -1), 10);
    if (isNaN(num) || (suit !== 'm' && suit !== 'p' && suit !== 's')) return false;

    // Two-sided wait means either (num-2, num-1) waiting on num (where num <= 9 and num-2 >= 1)
    // or (num+1, num+2) waiting on num (where num >= 1 and num+2 <= 9).
    // Specifically:
    // If waiting on 3 with (1, 2) -> Edge wait (邊張), NOT two-sided!
    // If waiting on 7 with (8, 9) -> Edge wait (邊張), NOT two-sided!
    // Two-sided must be e.g. waiting on 2 or 5 with (3, 4), or 3 or 6 with (4, 5).
    if (winningTile.shortCode === pairCode) {
      return false; // Single wait on pair
    }

    // Check if winningTile forms a two-sided sequence in hand
    // Case 1: hand has (num+1, num+2), winningTile is num -> num cannot be 7 (since 789 is edge wait)
    if (num <= 6) {
      const c2 = `${num + 1}${suit}`;
      const c3 = `${num + 2}${suit}`;
      if (hand.some((t) => t.shortCode === c2) && hand.some((t) => t.shortCode === c3)) {
        return true;
      }
    }
    // Case 2: hand has (num-2, num-1), winningTile is num -> num cannot be 3 (since 123 is edge wait)
    if (num >= 4) {
      const c1 = `${num - 2}${suit}`;
      const c2 = `${num - 1}${suit}`;
      if (hand.some((t) => t.shortCode === c1) && hand.some((t) => t.shortCode === c2)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Flower fans:
   * 1. Flower Kong (花槓 2): 4 seasons or 4 noble plants.
   * 2. Seat Flower (正花 1): 1=East, 2=South, 3=West, 4=North.
   */
  private static evaluateFlowers(ctx: ScoreEvaluationContext, fans: FanItem[]): void {
    if (ctx.winnerFlowers.length === 0) return;

    const seasonCodes = ['spring', 'summer', 'autumn', 'winter'];
    const plantCodes = ['plum', 'orchid', 'bamboo_f', 'chrysanthemum'];

    const hasAllSeasons = seasonCodes.every((c) =>
      ctx.winnerFlowers.some((f) => f.shortCode === c)
    );
    const hasAllPlants = plantCodes.every((c) =>
      ctx.winnerFlowers.some((f) => f.shortCode === c)
    );

    let seasonFansAwarded = false;
    let plantFansAwarded = false;

    if (hasAllSeasons) {
      fans.push({ name: '四季花槓', fan: 2, description: '集齊春夏秋冬全套' });
      seasonFansAwarded = true;
    }
    if (hasAllPlants) {
      fans.push({ name: '四君子花槓', fan: 2, description: '集齊梅蘭竹菊全套' });
      plantFansAwarded = true;
    }

    // Dynamic Seat flower number: East=1, South=2, West=3, North=4
    const seatOffsets: Record<SeatWind, number> = {
      EAST: 1,
      SOUTH: 2,
      WEST: 3,
      NORTH: 4,
    };
    const targetFlowerNum = seatOffsets[ctx.playerWind];

    if (!seasonFansAwarded) {
      const matchingSeason = ctx.winnerFlowers.find(
        (f) => seasonCodes.includes(f.shortCode) && f.value === targetFlowerNum
      );
      if (matchingSeason) {
        fans.push({ name: `正花 (${matchingSeason.name})`, fan: 1, description: '摸到與門風相符之四季花牌' });
      }
    }

    if (!plantFansAwarded) {
      const matchingPlant = ctx.winnerFlowers.find(
        (f) => plantCodes.includes(f.shortCode) && f.value === targetFlowerNum
      );
      if (matchingPlant) {
        fans.push({ name: `正花 (${matchingPlant.name})`, fan: 1, description: '摸到與門風相符之四君子花牌' });
      }
    }
  }

  /**
   * Situational fans:
   * 天胡 (16), 地胡 (8), 人胡 (8), 槓上開花 (1), 海底撈月 (1), 搶槓 (1).
   */
  private static evaluateSituationalFans(
    ctx: ScoreEvaluationContext,
    fans: FanItem[]
  ): void {
    if (ctx.isHeavenlyWin) {
      fans.push({ name: '天胡', fan: 16, description: '莊家起手配牌跳牌自摸' });
    } else if (ctx.isEarthlyWin && (!ctx.winnerMelds || ctx.winnerMelds.length === 0)) {
      fans.push({ name: '地胡', fan: 8, description: '閒家第一巡第一張摸牌自摸' });
    } else if (ctx.isHumanWin && (!ctx.winnerMelds || ctx.winnerMelds.length === 0)) {
      fans.push({ name: '人胡', fan: 8, description: '第一巡抓第一張放銃牌榮和' });
    }

    if (ctx.isKongBloom) {
      fans.push({ name: '槓上開花', fan: 1, description: '槓牌或補花後牌尾自摸' });
    }

    if (ctx.isLastTileDraw) {
      fans.push({ name: '海底撈月', fan: 1, description: '摸進最後一張合法牌自摸' });
    }

    if (ctx.isRobbingKong) {
      fans.push({ name: '搶槓', fan: 1, description: '別家加槓時榮和胡牌' });
    }
  }

  private static countMeldsOrTriplets(tiles: Tile[], melds: Meld[], targetCodes: string[]): number {
    let count = 0;
    for (const code of targetCodes) {
      if (this.hasMeldOrTriplet(tiles, melds, code)) {
        count++;
      }
    }
    return count;
  }

  private static hasMeldOrTriplet(tiles: Tile[], melds: Meld[], targetCode: string): boolean {
    if (melds.some((m) => m.type !== 'CHOW' && m.tiles[0].shortCode === targetCode)) {
      return true;
    }
    const matching = tiles.filter((t) => t.shortCode === targetCode);
    return matching.length >= 3;
  }

  private static countPairs(tiles: Tile[], targetCodes: string[]): number {
    let count = 0;
    const codeCounts = new Map<string, number>();
    for (const t of tiles) {
      codeCounts.set(t.shortCode, (codeCounts.get(t.shortCode) || 0) + 1);
    }
    for (const code of targetCodes) {
      if (codeCounts.get(code) === 2) {
        count++;
      }
    }
    return count;
  }

  private static checkAllTriplets(tiles: Tile[], melds: Meld[]): boolean {
    for (const m of melds) {
      if (m.type === 'CHOW') return false;
    }
    const decompositions = MahjongHandEvaluator.findWinningDecompositions(tiles, melds);
    return decompositions.some((decomp) => decomp.melds.every((m) => m.type === 'PONG'));
  }

  private static countConcealedTriplets(
    tiles: Tile[],
    melds: Meld[],
    winningTile: Tile,
    isSelfDrawn: boolean
  ): number {
    // Concealed Kongs in declared melds
    let baseConcealedKongs = 0;
    melds.forEach((m) => {
      if (m.type === 'CONCEALED_KONG') {
        baseConcealedKongs++;
      }
    });

    const decompositions = MahjongHandEvaluator.findWinningDecompositions(tiles, melds);

    if (decompositions.length === 0) {
      return baseConcealedKongs;
    }

    // Evaluate each valid winning decomposition to find the maximum concealed triplets (高點法)
    let maxConcealed = 0;

    for (const decomp of decompositions) {
      let count = baseConcealedKongs;

      for (const m of decomp.melds) {
        if (m.type === 'PONG') {
          if (isSelfDrawn) {
            // Self-drawn: all concealed Pongs count as concealed triplets
            count++;
          } else {
            // On Ron (他家放槍): if winning tile completed this triplet (e.g. 雙碰聽牌放槍), it's open (明刻)
            if (m.tiles[0] === winningTile.shortCode) {
              continue;
            }
            count++;
          }
        }
      }

      if (count > maxConcealed) {
        maxConcealed = count;
      }
    }

    return maxConcealed;
  }
}
