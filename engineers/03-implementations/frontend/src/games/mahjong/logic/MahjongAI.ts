/**
 * MahjongAI.ts
 * Implements Shanten calculation, effective tile acceptance maximization,
 * defensive danger rating (Genbutsu, Suji, Dead Honors), and Meld EV decisions.
 */

import { Tile, Meld, AvailableActions, PlayerProfile, SeatWind } from './MahjongTypes';
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

    // Check if defense mode should be activated
    const currentShanten = this.calculateShanten(hand, melds);
    const shouldDefend =
      currentShanten >= 2 &&
      (opponents.some((p) => p.isTing || p.melds.length >= 3) || remainingWallTiles < 30);

    if (shouldDefend) {
      return this.chooseSafestDiscard(hand, opponents, allKnownVisibleTiles);
    }

    let bestTile = hand[0];
    let bestScore = -999999;

    // Count duplicates in hand
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

      // Total score: heavily weight lower shanten, then acceptance, then discard bias
      const score = (10 - s) * 10000 + acceptance * 100 + discardBonus;

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
      let totalWinningTiles = 0;
      for (const testTile of sampleTiles) {
        if (MahjongHandEvaluator.isWinningHand(hand, melds, testTile)) {
          const usedCount = visibleCounts.get(testTile.shortCode) || 0;
          totalWinningTiles += Math.max(0, 4 - usedCount);
        }
      }
      return totalWinningTiles;
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
   * AI Decision for available meld actions (Chow, Pong, Kong, Hu, Pass).
   */
  public static decideAction(
    actions: AvailableActions,
    hand: Tile[],
    melds: Meld[],
    roundWind: SeatWind,
    playerWind: SeatWind
  ): 'HU' | 'KONG' | 'PONG' | 'CHOW' | 'PASS' {
    // 1. Always Hu if possible
    if (actions.canHu) {
      return 'HU';
    }

    // 2. Pong decision
    if (actions.canPong) {
      // Prioritize Honor tiles (Dragons, Round Wind, Seat Wind)
      const targetTile = actions.chowOptions[0]?.tiles[2] || hand[0]; // Representative
      const isValuableHonor =
        targetTile.suit === 'DRAGONS' ||
        (targetTile.suit === 'WINDS' &&
          (targetTile.shortCode === roundWind.toLowerCase() ||
            targetTile.shortCode === playerWind.toLowerCase()));

      if (isValuableHonor) {
        return 'PONG';
      }

      // If hand is already open, Pong is beneficial
      if (melds.length > 0) {
        return 'PONG';
      }
    }

    // 3. Kong decision
    if (actions.canKong && actions.kongOptions.length > 0) {
      return 'KONG';
    }

    // 4. Chow decision
    if (actions.canChow && actions.chowOptions.length > 0) {
      // If hand already open, take chow
      if (melds.length >= 1) {
        return 'CHOW';
      }
    }

    return 'PASS';
  }
}
