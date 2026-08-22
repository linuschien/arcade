/**
 * MahjongAI.ts
 * Implements Shanten calculation, effective tile acceptance maximization,
 * defensive danger rating (Genbutsu, Suji, Dead Honors), universal Kong evaluation,
 * and aggressive Shanten-reduction Meld decisions.
 */

import { Tile, Meld, AvailableActions, PlayerProfile, SeatWind, KongOption } from './MahjongTypes';
import { MahjongHandEvaluator } from './MahjongHandEvaluator';

export class MahjongAI {
  /**
   * Calculates the Shanten (向聽數) of a hand (0 = Ting/Ready, 1 = 1-Shanten, etc.).
   */
  public static calculateShanten(hand: Tile[], melds: Meld[]): number {
    const activeTiles = hand.filter((t) => !t.isFlower);
    const standardShanten = this.calculateStandardShanten(activeTiles, melds.length);

    if (melds.length === 0 && activeTiles.length === 16) {
      const eightPairsShanten = this.calculateEightPairsShanten(activeTiles);
      return Math.min(standardShanten, eightPairsShanten);
    }

    return standardShanten;
  }

  /**
   * Calculates standard 5-meld + 1-pair shanten.
   */
  private static calculateStandardShanten(tiles: Tile[], meldCount: number): number {
    const codeCounts = new Map<string, number>();
    for (const t of tiles) {
      codeCounts.set(t.shortCode, (codeCounts.get(t.shortCode) || 0) + 1);
    }

    let completeMelds = meldCount;
    let partialMelds = 0;
    let pairs = 0;

    // Count triplets & pairs
    for (const [code, count] of codeCounts.entries()) {
      if (count >= 3) {
        completeMelds++;
        codeCounts.set(code, count - 3);
      } else if (count === 2) {
        pairs++;
        codeCounts.set(code, 0);
      }
    }

    // Count sequences in number suits
    const suits = ['m', 'p', 's'];
    for (const suit of suits) {
      for (let n = 1; n <= 7; n++) {
        const c1 = `${n}${suit}`;
        const c2 = `${n + 1}${suit}`;
        const c3 = `${n + 2}${suit}`;

        while (
          (codeCounts.get(c1) || 0) > 0 &&
          (codeCounts.get(c2) || 0) > 0 &&
          (codeCounts.get(c3) || 0) > 0
        ) {
          completeMelds++;
          codeCounts.set(c1, (codeCounts.get(c1) || 0) - 1);
          codeCounts.set(c2, (codeCounts.get(c2) || 0) - 1);
          codeCounts.set(c3, (codeCounts.get(c3) || 0) - 1);
        }
      }

      // Count partial sequences (two-sided or middle gap)
      for (let n = 1; n <= 8; n++) {
        const c1 = `${n}${suit}`;
        const c2 = `${n + 1}${suit}`;
        if ((codeCounts.get(c1) || 0) > 0 && (codeCounts.get(c2) || 0) > 0) {
          partialMelds++;
          codeCounts.set(c1, (codeCounts.get(c1) || 0) - 1);
          codeCounts.set(c2, (codeCounts.get(c2) || 0) - 1);
        }
      }

      for (let n = 1; n <= 7; n++) {
        const c1 = `${n}${suit}`;
        const c3 = `${n + 2}${suit}`;
        if ((codeCounts.get(c1) || 0) > 0 && (codeCounts.get(c3) || 0) > 0) {
          partialMelds++;
          codeCounts.set(c1, (codeCounts.get(c1) || 0) - 1);
          codeCounts.set(c3, (codeCounts.get(c3) || 0) - 1);
        }
      }
    }

    // Standard Taiwanese 16-tile shanten formula:
    // Need 5 melds + 1 pair. Base distance = 10 - 2 * completeMelds - partialMelds - (hasPair ? 1 : 0)
    const requiredMelds = 5;
    const effectiveComplete = Math.min(requiredMelds, completeMelds);
    const maxPartial = requiredMelds - effectiveComplete;
    const effectivePartial = Math.min(maxPartial, partialMelds);
    const hasPair = pairs > 0;

    let shanten = (requiredMelds - effectiveComplete) * 2 - effectivePartial - (hasPair ? 1 : 0);
    return Math.max(0, shanten);
  }

  /**
   * Shanten for 嚦咕嚦咕 (Eight Pairs).
   */
  private static calculateEightPairsShanten(tiles: Tile[]): number {
    const codeCounts = new Map<string, number>();
    for (const t of tiles) {
      codeCounts.set(t.shortCode, (codeCounts.get(t.shortCode) || 0) + 1);
    }
    let pairCount = 0;
    for (const count of codeCounts.values()) {
      if (count >= 2) pairCount++;
    }
    return Math.max(0, 8 - pairCount);
  }

  /**
   * Counts the total remaining copies of winning tiles outside in visible information.
   * Reuses the Single Source of Truth from MahjongHandEvaluator.evaluateTing.
   */
  public static countWinningTilesRemaining(
    hand: Tile[],
    melds: Meld[],
    allKnownVisibleTiles: Tile[] = []
  ): number {
    const tingInfo = MahjongHandEvaluator.evaluateTing(hand, melds, allKnownVisibleTiles);
    return tingInfo.winningTiles.reduce((sum, w) => sum + w.remainingCount, 0);
  }

  /**
   * Evaluates whether the AI should switch to defense mode based on Shanten and remaining draws.
   */
  public static shouldDefend(
    currentShanten: number,
    remainingWallTiles: number,
    isDeadWait: boolean = false
  ): boolean {
    // 1. If in dead wait (0 live winning tiles left), defense is mandatory
    if (isDeadWait) return true;

    // 2. If in live Ting (0-Shanten with > 0 live winning tiles), 100% attack
    if (currentShanten === 0) return false;

    // 3. For all Shanten >= 1:
    // Personal remaining draws M = Math.floor(remainingWallTiles / 4).
    // From S-Shanten, minimum draws needed to win under perfect consecutive draws is S + 1.
    // When M <= S (M < S + 1), it is mathematically impossible to complete the hand -> Defend!
    const remainingDraws = Math.floor(remainingWallTiles / 4);
    return remainingDraws <= currentShanten;
  }

  /**
   * Evaluates the best discard for the AI player.
   */
  public static chooseBestDiscard(
    hand: Tile[],
    melds: Meld[],
    allKnownVisibleTiles: Tile[],
    opponents: PlayerProfile[],
    remainingWallTiles: number
  ): Tile {
    if (hand.length === 0) {
      throw new Error('Hand is empty');
    }
    if (hand.length === 1) {
      return hand[0];
    }

    const currentShanten = this.calculateShanten(hand, melds);
    let isDeadWait = false;

    // 當處於聽牌（打一張即聽牌）狀態時：檢查是否存在能聽「活牌（W > 0）」的出牌方式
    if (currentShanten === 0) {
      let hasLiveTingDiscard = false;
      for (let i = 0; i < hand.length; i++) {
        const testHand = hand.filter((_, idx) => idx !== i);
        if (this.calculateShanten(testHand, melds) === 0) {
          if (this.countWinningTilesRemaining(testHand, melds, allKnownVisibleTiles) > 0) {
            hasLiveTingDiscard = true;
            break;
          }
        }
      }
      isDeadWait = !hasLiveTingDiscard;
    }

    if (this.shouldDefend(currentShanten, remainingWallTiles, isDeadWait)) {
      return this.chooseSafestDiscard(hand, opponents, allKnownVisibleTiles);
    }

    let bestTile = hand[0];
    let bestScore = -999999;

    const handCounts = new Map<string, number>();
    hand.forEach((t) => handCounts.set(t.shortCode, (handCounts.get(t.shortCode) || 0) + 1));

    for (let i = 0; i < hand.length; i++) {
      const candidate = hand[i];
      const testHand = hand.filter((_, idx) => idx !== i);
      const s = this.calculateShanten(testHand, melds);
      const acceptance = this.calculateTileAcceptance(testHand, melds, allKnownVisibleTiles);

      // Discard bias:
      // Prefer discarding isolated honors (winds/dragons), then terminals (1,9), then middle numbers
      let discardBonus = 0;
      const countInHand = handCounts.get(candidate.shortCode) || 1;
      if (countInHand === 1) {
        if (candidate.suit === 'WINDS' || candidate.suit === 'DRAGONS') {
          discardBonus += 50;
        } else if (candidate.value === 1 || candidate.value === 9) {
          discardBonus += 20;
        }
      }

      // Penalty for discarding into a 0-tile dead wait (never deliberately choose a dead Ting)
      let deadTingPenalty = 0;
      if (s === 0 && acceptance === 0) {
        deadTingPenalty = -50000;
      }

      const score = (10 - s) * 100000 + acceptance * 100 + discardBonus + deadTingPenalty;

      if (score > bestScore) {
        bestScore = score;
        bestTile = candidate;
      }
    }

    return bestTile;
  }

  /**
   * Defense Mode: Chooses the safest discard based on Genbutsu, Suji, and dead honors.
   */
  private static chooseSafestDiscard(
    hand: Tile[],
    opponents: PlayerProfile[],
    allKnownVisibleTiles: Tile[]
  ): Tile {
    // Collect all opponent discards (Genbutsu 現物)
    const opponentDiscards = new Set<string>();
    opponents.forEach((op) => {
      op.discards.forEach((d) => opponentDiscards.add(d.shortCode));
    });

    // Visible tile counts across table
    const visibleCounts = new Map<string, number>();
    allKnownVisibleTiles.forEach((t) => {
      visibleCounts.set(t.shortCode, (visibleCounts.get(t.shortCode) || 0) + 1);
    });

    let safestTile = hand[0];
    let lowestDangerScore = 9999;

    for (const tile of hand) {
      let dangerScore = 50; // Base score for unknown tile
      const code = tile.shortCode;

      // 1. Genbutsu (現物): 100% Safe against players who discarded it
      if (opponentDiscards.has(code)) {
        dangerScore = 0;
      } else if (tile.suit === 'WINDS' || tile.suit === 'DRAGONS') {
        // 2. Honors: Safe if dead (3 or 4 copies visible)
        const visible = visibleCounts.get(code) || 0;
        if (visible >= 3) {
          dangerScore = 5; // Dead honor
        } else if (visible === 2) {
          dangerScore = 20;
        } else {
          dangerScore = 60; // Live honor is risky
        }
      } else {
        // 3. Suji (筋牌) and Terminals (1, 9)
        const num = tile.value;
        const suit = code.slice(-1);

        if (num === 1 || num === 9) {
          dangerScore = 30; // Terminals are generally safer than middle
        } else if (num === 2 || num === 8) {
          dangerScore = 40;
        } else {
          // Middle tiles (3, 4, 5, 6, 7)
          dangerScore = 70;
        }

        // Suji check: If 4 is discarded, 1 and 7 are somewhat safer (Suji)
        if (num === 1 && opponentDiscards.has(`4${suit}`)) dangerScore -= 20;
        if (num === 9 && opponentDiscards.has(`6${suit}`)) dangerScore -= 20;
        if (num === 7 && opponentDiscards.has(`4${suit}`)) dangerScore -= 15;
        if (num === 3 && opponentDiscards.has(`6${suit}`)) dangerScore -= 15;
      }

      if (dangerScore < lowestDangerScore) {
        lowestDangerScore = dangerScore;
        safestTile = tile;
      }
    }

    return safestTile;
  }

  /**
   * Calculates effective tile acceptance count for a hand.
   */
  private static calculateTileAcceptance(
    hand: Tile[],
    melds: Meld[],
    allKnownVisibleTiles: Tile[]
  ): number {
    const currentShanten = this.calculateShanten(hand, melds);
    const sampleTiles = MahjongHandEvaluator.getAll34UniqueTiles();

    const visibleCounts = new Map<string, number>();
    allKnownVisibleTiles.forEach((t) => {
      visibleCounts.set(t.shortCode, (visibleCounts.get(t.shortCode) || 0) + 1);
    });

    if (currentShanten === 0) {
      return this.countWinningTilesRemaining(hand, melds, allKnownVisibleTiles);
    }

    let totalAcceptance = 0;

    for (const testTile of sampleTiles) {
      const testHand = [...hand, testTile];
      const newShanten = this.calculateShanten(testHand, melds);

      if (newShanten < currentShanten) {
        const usedCount = visibleCounts.get(testTile.shortCode) || 0;
        const remainingCount = Math.max(0, 4 - usedCount);
        totalAcceptance += remainingCount;
      }
    }

    return totalAcceptance;
  }

  /**
   * Universal Kong Evaluation Engine.
   * Evaluates whether executing a kongOption (CONCEALED_KONG, ADDED_KONG, MELDED_KONG)
   * is beneficial and safe regarding Shanten, winning tiles count, and fan preservation.
   */
  public static isKongBeneficial(
    kong: KongOption,
    hand: Tile[],
    melds: Meld[],
    allKnownVisibleTiles: Tile[] = []
  ): boolean {
    const isConcealed = melds.length === 0;

    // 1. Melded Kong (大明槓) Fan Checks:
    if (kong.type === 'MELDED_KONG') {
      // Must preserve 門清
      if (isConcealed) return false;

      // Must preserve 三暗刻 / 四暗刻
      const codeCounts = new Map<string, number>();
      for (const t of hand) {
        if (!t.isFlower) {
          codeCounts.set(t.shortCode, (codeCounts.get(t.shortCode) || 0) + 1);
        }
      }
      let concealedTriplets = 0;
      for (const count of codeCounts.values()) {
        if (count >= 3) concealedTriplets++;
      }
      if (concealedTriplets >= 3) {
        return false; // Protect 三暗刻 / 四暗刻
      }
    }

    // 2. Simulate Hand & Melds after Kong:
    const remainingHand: Tile[] = [];
    const simulatedMelds: Meld[] = [...melds];

    if (kong.type === 'CONCEALED_KONG') {
      let removed = 0;
      const kongTiles: Tile[] = [];
      for (const t of hand) {
        if (t.shortCode === kong.tileCode && removed < 4) {
          kongTiles.push(t);
          removed++;
        } else {
          remainingHand.push(t);
        }
      }
      simulatedMelds.push({
        type: 'CONCEALED_KONG',
        tiles: kongTiles,
        sourceSeat: 0,
      });
    } else if (kong.type === 'ADDED_KONG') {
      let removed = 0;
      for (const t of hand) {
        if (t.shortCode === kong.tileCode && removed < 1) {
          removed++;
        } else {
          remainingHand.push(t);
        }
      }
      if (typeof kong.meldIndex === 'number' && simulatedMelds[kong.meldIndex]) {
        const oldMeld = simulatedMelds[kong.meldIndex];
        simulatedMelds[kong.meldIndex] = {
          ...oldMeld,
          type: 'ADDED_KONG',
        };
      }
    } else if (kong.type === 'MELDED_KONG') {
      let removed = 0;
      const kongTiles: Tile[] = [];
      for (const t of hand) {
        if (t.shortCode === kong.tileCode && removed < 3) {
          kongTiles.push(t);
          removed++;
        } else {
          remainingHand.push(t);
        }
      }
      simulatedMelds.push({
        type: 'MELDED_KONG',
        tiles: kongTiles,
        sourceSeat: 1,
      });
    }

    const currentShanten = this.calculateShanten(hand, melds);
    const postKongShanten = this.calculateShanten(remainingHand, simulatedMelds);

    // Shanten must not regress (increase)
    if (postKongShanten > currentShanten) {
      return false;
    }

    // If currently in Ting (currentShanten === 0):
    // Kong must maintain Ting (postKongShanten === 0) AND must not reduce winning tiles count (protect multi-way Ting / Screwdriver)
    if (currentShanten === 0) {
      if (postKongShanten !== 0) return false;

      // Calculate pre-kong winning tiles count
      let currentWinningCount = 0;

      if (kong.type === 'MELDED_KONG') {
        // Claim on opponent discard: hand has 16 tiles
        currentWinningCount = this.countWinningTilesRemaining(hand, melds, allKnownVisibleTiles);
      } else {
        // Self kong (Concealed or Added): hand has 17 tiles. Find max winning count among all 0-shanten discards
        for (let i = 0; i < hand.length; i++) {
          const testHand = hand.filter((_, idx) => idx !== i);
          if (this.calculateShanten(testHand, melds) === 0) {
            const count = this.countWinningTilesRemaining(testHand, melds, allKnownVisibleTiles);
            if (count > currentWinningCount) {
              currentWinningCount = count;
            }
          }
        }
      }

      const postWinningCount = this.countWinningTilesRemaining(remainingHand, simulatedMelds, allKnownVisibleTiles);

      // If winning tiles count strictly decreases (e.g. 5556 dropping from 3-way to 1-way wait), reject!
      if (postWinningCount < currentWinningCount) {
        return false;
      }
    }

    return true;
  }

  /**
   * Decides which self kong (Concealed or Added) to execute during AI's turn, if beneficial.
   */
  public static decideSelfKong(
    kongOptions: KongOption[],
    hand: Tile[],
    melds: Meld[],
    allKnownVisibleTiles: Tile[] = []
  ): KongOption | null {
    for (const kong of kongOptions) {
      if (this.isKongBeneficial(kong, hand, melds, allKnownVisibleTiles)) {
        return kong;
      }
    }
    return null;
  }

  /**
   * AI Decision for available meld actions (Chow, Pong, Kong, Hu, Pass).
   */
  public static decideAction(
    actions: AvailableActions,
    hand: Tile[],
    melds: Meld[],
    roundWind: SeatWind,
    playerWind: SeatWind,
    allKnownVisibleTiles: Tile[] = [],
    calledTile?: Tile
  ): 'HU' | 'KONG' | 'PONG' | 'CHOW' | 'PASS' {
    // 1. Always Hu if possible
    if (actions.canHu) {
      return 'HU';
    }

    // Representative called tile
    const targetTile = calledTile || actions.chowOptions[0]?.tiles[2] || hand[0];
    const currentShanten = this.calculateShanten(hand, melds);

    // 2. Kong decision (Melded Kong)
    if (actions.canKong && actions.kongOptions.length > 0) {
      const kong = actions.kongOptions[0];
      if (this.isKongBeneficial(kong, hand, melds, allKnownVisibleTiles)) {
        return 'KONG';
      }
    }

    // 3. Pong decision
    if (actions.canPong) {
      const isHonor = targetTile.suit === 'WINDS' || targetTile.suit === 'DRAGONS';
      const isDragon = targetTile.suit === 'DRAGONS';
      const isRoundWind = targetTile.suit === 'WINDS' && targetTile.shortCode === roundWind.toLowerCase();
      const isSeatWind = targetTile.suit === 'WINDS' && targetTile.shortCode === playerWind.toLowerCase();
      const hasFan = isDragon || isRoundWind || isSeatWind;

      // Count pairs in hand
      const codeCounts = new Map<string, number>();
      for (const t of hand) {
        if (!t.isFlower) {
          codeCounts.set(t.shortCode, (codeCounts.get(t.shortCode) || 0) + 1);
        }
      }
      let pairCount = 0;
      for (const count of codeCounts.values()) {
        if (count >= 2) pairCount++;
      }
      const isSoleEye = pairCount <= 1;

      // Simulate Pong hand & Shanten:
      let removed = 0;
      const postHand: Tile[] = [];
      const pongTiles: Tile[] = [];
      for (const t of hand) {
        if (t.shortCode === targetTile.shortCode && removed < 2) {
          pongTiles.push(t);
          removed++;
        } else {
          postHand.push(t);
        }
      }
      const postMelds: Meld[] = [
        ...melds,
        { type: 'PONG', tiles: [...pongTiles, targetTile], sourceSeat: 1 },
      ];
      const postShanten = this.calculateShanten(postHand, postMelds);

      if (isHonor) {
        // Honor tile rule:
        // Only reject if it has NO fan (guest wind) AND it's the sole eye/pair in hand.
        if (!hasFan && isSoleEye) {
          // Keep as eye, do not Pong
        } else {
          return 'PONG';
        }
      } else {
        // Number tile rule:
        // Pong if it strictly reduces Shanten
        if (postShanten < currentShanten) {
          return 'PONG';
        }
      }
    }

    // 4. Chow decision
    if (actions.canChow && actions.chowOptions.length > 0) {
      for (const opt of actions.chowOptions) {
        const removeIds = new Set(opt.discardTileIds);
        const postHand = hand.filter((t) => !removeIds.has(t.id));
        const postMelds: Meld[] = [
          ...melds,
          { type: 'CHOW', tiles: opt.tiles, sourceSeat: 3 },
        ];
        const postShanten = this.calculateShanten(postHand, postMelds);

        if (postShanten < currentShanten) {
          return 'CHOW';
        }
      }
    }

    return 'PASS';
  }
}
