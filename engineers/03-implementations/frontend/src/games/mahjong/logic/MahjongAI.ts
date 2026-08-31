/**
 * MahjongAI.ts
 * Implements Shanten calculation, effective tile acceptance maximization,
 * defensive danger rating (Genbutsu, Suji, Dead Honors), universal Kong evaluation,
 * and aggressive Shanten-reduction Meld decisions.
 */

import { Tile, Meld, AvailableActions, PlayerProfile, SeatWind, KongOption, ChowOption } from './MahjongTypes';

export interface SuitPlan {
  comp: number;            // Complete melds (triplets / sequences)
  part: number;            // Partial tatsus (two-sided, border, gap, pair-tatsu)
  hasEye: boolean;         // Uses one pair as 雀頭 (Eye)
  meldedOuts: number[];    // Tile numbers (1..9) completing a meld
  goodTatsuOuts: number[]; // Tile numbers (1..9) forming a two-sided tatsu
  badTatsuOuts: number[];  // Tile numbers (1..9) forming gap/border tatsu or pair
  singles: number[];       // Tile numbers (1..9) as isolated single tiles
}

export interface BestDiscardEvaluation {
  bestDiscard: Tile;
  minShanten: number;
  maxScore: number;
  isDeadWait: boolean;
  bestShantenRes: ShantenResult;
}

export interface KongEvaluation {
  isBeneficial: boolean;
  score: number;
  shanten: number;
}

export interface ShantenResult {
  shanten: number;           // Minimum Shanten distance (0 = Ting/Ready, 1 = 1-Shanten, etc.)
  score: number;             // Overall fitness score: (s === 0 && liveWinningCount === 0) ? 0 : (10 - s) * 2500 + acceptance
  acceptance: number;        // Quality-weighted tile acceptance score
  liveWinningCount: number;  // Real live outs outside when in Ting (0 if dead or not Ting)
  meldedOuts: string[];      // Tile shortCodes completing melds (e.g. ['3m', '6m'])
  goodTatsuOuts: string[];   // Tile shortCodes forming two-sided tatsus (e.g. ['2p', '5p'])
  badTatsuOuts: string[];    // Tile shortCodes forming gap/border tatsus or pairs (e.g. ['1s', 'east'])
}

export class MahjongAI {
  private static suitCache = new Map<string, SuitPlan[]>();

  /**
   * Calculates the Shanten (向聽數) of a hand (0 = Ting/Ready, 1 = 1-Shanten, etc.).
   * Enforces 16-tile invariant: activeTiles.length + melds.length * 3 === 16.
   */
  public static calculateShanten(hand: Tile[], melds: Meld[]): number {
    const activeTiles = hand.filter((t) => !t.isFlower);
    const expected = 16 - melds.length * 3;
    if (activeTiles.length !== expected) {
      return 99;
    }

    const shantenRes = this.calculateShantenWithOuts(activeTiles, melds.length);
    const standardShanten = shantenRes.shanten;

    if (melds.length === 0 && activeTiles.length === 16) {
      const eightPairsShanten = this.calculateEightPairsShanten(activeTiles);
      return Math.min(standardShanten, eightPairsShanten);
    }

    return standardShanten;
  }

  /**
   * Decomposes a single number suit (1..9) into all non-dominated SuitPlans.
   * Supports up to 17 tiles per suit (Taiwanese Mahjong Pure One Suit / 清一色).
   */
  public static decomposeNumberSuit(counts: number[]): SuitPlan[] {
    const key = counts.slice(1, 10).join(',');
    const cached = this.suitCache.get(key);
    if (cached) {
      return cached;
    }

    const totalTiles = counts.slice(1, 10).reduce((a, b) => a + b, 0);
    if (totalTiles === 0) {
      const emptyPlan: SuitPlan[] = [
        { comp: 0, part: 0, hasEye: false, meldedOuts: [], goodTatsuOuts: [], badTatsuOuts: [], singles: [] },
      ];
      this.suitCache.set(key, emptyPlan);
      return emptyPlan;
    }

    const rawPlans: SuitPlan[] = [];

    const search = (
      idx: number,
      c: number[],
      currentComp: number,
      currentPart: number,
      hasEye: boolean,
      meldedOuts: Set<number>,
      goodTatsuOuts: Set<number>,
      badTatsuOuts: Set<number>,
      singles: Set<number>
    ) => {
      while (idx <= 9 && c[idx] === 0) {
        idx++;
      }

      if (idx > 9) {
        rawPlans.push({
          comp: currentComp,
          part: currentPart,
          hasEye,
          meldedOuts: Array.from(meldedOuts),
          goodTatsuOuts: Array.from(goodTatsuOuts),
          badTatsuOuts: Array.from(badTatsuOuts),
          singles: Array.from(singles),
        });
        return;
      }

      // 1. Triplet (AAA: 3 matching tiles)
      if (c[idx] >= 3) {
        c[idx] -= 3;
        search(idx, c, currentComp + 1, currentPart, hasEye, meldedOuts, goodTatsuOuts, badTatsuOuts, singles);
        c[idx] += 3;
      }

      // 2. Sequence (ABC: n, n+1, n+2)
      if (idx <= 7 && c[idx] >= 1 && c[idx + 1] >= 1 && c[idx + 2] >= 1) {
        c[idx]--;
        c[idx + 1]--;
        c[idx + 2]--;
        search(idx, c, currentComp + 1, currentPart, hasEye, meldedOuts, goodTatsuOuts, badTatsuOuts, singles);
        c[idx]++;
        c[idx + 1]++;
        c[idx + 2]++;
      }

      // 3. Two-Sided or Border Tatsu (AB: n, n+1)
      if (idx <= 8 && c[idx] >= 1 && c[idx + 1] >= 1) {
        c[idx]--;
        c[idx + 1]--;
        const nextMelded = new Set(meldedOuts);
        if (idx > 1) nextMelded.add(idx - 1);
        if (idx + 1 < 9) nextMelded.add(idx + 2);

        const nextBadTatsu = new Set(badTatsuOuts);
        nextBadTatsu.add(idx);
        nextBadTatsu.add(idx + 1);

        search(idx, c, currentComp, currentPart + 1, hasEye, nextMelded, goodTatsuOuts, nextBadTatsu, singles);
        c[idx]++;
        c[idx + 1]++;
      }

      // 4. Gap Tatsu (AC: n, n+2)
      if (idx <= 7 && c[idx] >= 1 && c[idx + 2] >= 1) {
        c[idx]--;
        c[idx + 2]--;
        const nextMelded = new Set(meldedOuts);
        nextMelded.add(idx + 1);

        const nextBadTatsu = new Set(badTatsuOuts);
        nextBadTatsu.add(idx);
        nextBadTatsu.add(idx + 2);

        search(idx, c, currentComp, currentPart + 1, hasEye, nextMelded, goodTatsuOuts, nextBadTatsu, singles);
        c[idx]++;
        c[idx + 2]++;
      }

      // 5. Pair as Eye or Pair-Tatsu (AA: 2 matching tiles)
      if (c[idx] >= 2) {
        // 5a. As Eye (雀頭)
        if (!hasEye) {
          c[idx] -= 2;
          search(idx, c, currentComp, currentPart, true, meldedOuts, goodTatsuOuts, badTatsuOuts, singles);
          c[idx] += 2;
        }

        // 5b. As Pair-Tatsu (雙碰搭子: waits on 3rd copy to become triplet)
        c[idx] -= 2;
        const nextMelded = new Set(meldedOuts);
        nextMelded.add(idx);
        search(idx, c, currentComp, currentPart + 1, hasEye, nextMelded, goodTatsuOuts, badTatsuOuts, singles);
        c[idx] += 2;
      }

      // 6. Single Tile (孤張)
      const nextBad = new Set(badTatsuOuts);
      const nextGood = new Set(goodTatsuOuts);
      const nextSingles = new Set(singles);
      nextSingles.add(idx);

      // Drawing self forms a pair
      nextBad.add(idx);

      // Adjacent connections
      if (idx >= 3 && idx <= 7) {
        nextGood.add(idx - 1);
        nextGood.add(idx + 1);
      } else if (idx === 2) {
        nextBad.add(1);
        nextGood.add(3);
      } else if (idx === 8) {
        nextGood.add(7);
        nextBad.add(9);
      } else if (idx === 1) {
        nextBad.add(2);
      } else if (idx === 9) {
        nextBad.add(8);
      }

      // Gap connections
      if (idx - 2 >= 1) nextBad.add(idx - 2);
      if (idx + 2 <= 9) nextBad.add(idx + 2);

      const oldVal = c[idx];
      c[idx]--;
      search(idx, c, currentComp, currentPart, hasEye, meldedOuts, nextGood, nextBad, nextSingles);
      c[idx] = oldVal;
    };

    search(1, [...counts], 0, 0, false, new Set(), new Set(), new Set(), new Set());

    // Deduplicate & Prune dominated plans:
    const plans: SuitPlan[] = [];
    for (const p of rawPlans) {
      // Check if p is strictly dominated by an existing plan with equal or better meld progression power
      const pPower = 2 * p.comp + p.part;
      const isDominated = plans.some((existing) => {
        if (existing.hasEye !== p.hasEye) return false;
        const exPower = 2 * existing.comp + existing.part;
        if (exPower > pPower && existing.comp >= p.comp) return true;
        if (exPower === pPower && existing.comp >= p.comp && existing.part >= p.part) {
          // Exactly same shape/composition: check if meldedOuts/tatsus are identical
          return (
            existing.meldedOuts.join(',') === p.meldedOuts.join(',') &&
            existing.goodTatsuOuts.join(',') === p.goodTatsuOuts.join(',') &&
            existing.badTatsuOuts.join(',') === p.badTatsuOuts.join(',')
          );
        }
        return false;
      });
      if (!isDominated) {
        plans.push(p);
      }
    }

    this.suitCache.set(key, plans.length > 0 ? plans : rawPlans);
    return plans.length > 0 ? plans : rawPlans;
  }

  /**
   * Fast O(1) Decomposition of Honor tiles (東南西北中發白).
   */
  public static decomposeHonors(honorCounts: Map<string, number>): SuitPlan[] {
    const honors = ['east', 'south', 'west', 'north', 'red', 'green', 'white'];
    let baseTriplets = 0;
    const pairs: string[] = [];
    const singles: string[] = [];

    for (const h of honors) {
      const count = honorCounts.get(h) || 0;
      if (count >= 3) {
        baseTriplets += Math.floor(count / 3);
        const rem = count % 3;
        if (rem === 2) pairs.push(h);
        else if (rem === 1) singles.push(h);
      } else if (count === 2) {
        pairs.push(h);
      } else if (count === 1) {
        singles.push(h);
      }
    }

    const plans: SuitPlan[] = [];

    // Plan A: No Honor used as Eye
    plans.push({
      comp: baseTriplets,
      part: pairs.length,
      hasEye: false,
      meldedOuts: pairs.map((h) => honors.indexOf(h) + 1),
      goodTatsuOuts: [],
      badTatsuOuts: singles.map((h) => honors.indexOf(h) + 1),
      singles: singles.map((h) => honors.indexOf(h) + 1),
    });

    // Plan B: Use one Honor pair as Eye
    for (let i = 0; i < pairs.length; i++) {
      const eyeHonor = pairs[i];
      const otherPairs = pairs.filter((_, idx) => idx !== i);
      plans.push({
        comp: baseTriplets,
        part: otherPairs.length,
        hasEye: true,
        meldedOuts: otherPairs.map((h) => honors.indexOf(h) + 1),
        goodTatsuOuts: [],
        badTatsuOuts: singles.map((h) => honors.indexOf(h) + 1),
        singles: singles.map((h) => honors.indexOf(h) + 1),
      });
    }

    return plans;
  }

  /**
   * Combines the 4 suits (m, p, s, z) via Suit DP to calculate minimum Shanten and unified outs.
   * Enforces 16-tile invariant: activeTiles.length + meldCount * 3 === 16.
   * Dynamic DP aggregates outs across ALL optimal combinations grouped by Shanten level.
   */
  public static calculateShantenWithOuts(
    hand: Tile[],
    meldCount: number,
    allKnownVisibleTiles: Tile[] = []
  ): ShantenResult {
    const activeTiles = hand.filter((t) => !t.isFlower);
    const expected = 16 - meldCount * 3;
    if (activeTiles.length !== expected) {
      return {
        shanten: 99,
        score: 0,
        acceptance: 0,
        liveWinningCount: 0,
        meldedOuts: [],
        goodTatsuOuts: [],
        badTatsuOuts: [],
      };
    }

    const countsM = new Array(10).fill(0);
    const countsP = new Array(10).fill(0);
    const countsS = new Array(10).fill(0);
    const honorCounts = new Map<string, number>();

    for (const t of activeTiles) {
      if (t.suit === 'CHARACTERS') {
        countsM[t.value]++;
      } else if (t.suit === 'DOTS') {
        countsP[t.value]++;
      } else if (t.suit === 'BAMBOO') {
        countsS[t.value]++;
      } else {
        honorCounts.set(t.shortCode, (honorCounts.get(t.shortCode) || 0) + 1);
      }
    }

    const visibleSource =
      allKnownVisibleTiles && allKnownVisibleTiles.length > 0 ? allKnownVisibleTiles : activeTiles;

    const plansM = this.decomposeNumberSuit(countsM);
    const plansP = this.decomposeNumberSuit(countsP);
    const plansS = this.decomposeNumberSuit(countsS);
    const plansZ = this.decomposeHonors(honorCounts);

    const requiredMelds = 5 - meldCount;
    const honorsList = ['east', 'south', 'west', 'north', 'red', 'green', 'white'];

    // Group combinations by Shanten level
    const shantenGroups = new Map<
      number,
      { meldedSet: Set<string>; goodTatsuSet: Set<string>; badTatsuSet: Set<string> }
    >();

    for (const pm of plansM) {
      for (const pp of plansP) {
        for (const ps of plansS) {
          for (const pz of plansZ) {
            const eyeCount = (pm.hasEye ? 1 : 0) + (pp.hasEye ? 1 : 0) + (ps.hasEye ? 1 : 0) + (pz.hasEye ? 1 : 0);
            if (eyeCount > 1) continue; // At most 1 global Eye across all 4 suits

            const hasEye = eyeCount === 1;
            const totalComp = pm.comp + pp.comp + ps.comp + pz.comp;
            const totalPart = pm.part + pp.part + ps.part + pz.part;

            const effComp = Math.min(requiredMelds, totalComp);
            const maxPart = requiredMelds - effComp;
            const effPart = Math.min(maxPart, totalPart);

            const s = Math.max(0, (requiredMelds - effComp) * 2 - effPart - (hasEye ? 1 : 0));

            let group = shantenGroups.get(s);
            if (!group) {
              group = {
                meldedSet: new Set<string>(),
                goodTatsuSet: new Set<string>(),
                badTatsuSet: new Set<string>(),
              };
              shantenGroups.set(s, group);
            }

            pm.meldedOuts.forEach((n) => group!.meldedSet.add(`${n}m`));
            pm.goodTatsuOuts.forEach((n) => group!.goodTatsuSet.add(`${n}m`));
            pm.badTatsuOuts.forEach((n) => group!.badTatsuSet.add(`${n}m`));

            pp.meldedOuts.forEach((n) => group!.meldedSet.add(`${n}p`));
            pp.goodTatsuOuts.forEach((n) => group!.goodTatsuSet.add(`${n}p`));
            pp.badTatsuOuts.forEach((n) => group!.badTatsuSet.add(`${n}p`));

            ps.meldedOuts.forEach((n) => group!.meldedSet.add(`${n}s`));
            ps.goodTatsuOuts.forEach((n) => group!.goodTatsuSet.add(`${n}s`));
            ps.badTatsuOuts.forEach((n) => group!.badTatsuSet.add(`${n}s`));

            pz.meldedOuts.forEach((idx) => group!.meldedSet.add(honorsList[idx - 1]));
            pz.badTatsuOuts.forEach((idx) => group!.badTatsuSet.add(honorsList[idx - 1]));

            // In 0-Shanten waiting on Eye (5 melds, no Eye):
            // Only drawing the isolated single tile itself can complete the Eye!
            if (s === 0 && !hasEye) {
              pm.singles.forEach((n) => group!.meldedSet.add(`${n}m`));
              pp.singles.forEach((n) => group!.meldedSet.add(`${n}p`));
              ps.singles.forEach((n) => group!.meldedSet.add(`${n}s`));
              pz.singles.forEach((idx) => group!.meldedSet.add(honorsList[idx - 1]));
            }
          }
        }
      }
    }

    let bestScore = -999999;
    let bestResult: ShantenResult = {
      shanten: requiredMelds * 2,
      score: 0,
      acceptance: 0,
      liveWinningCount: 0,
      meldedOuts: [],
      goodTatsuOuts: [],
      badTatsuOuts: [],
    };

    // Evaluate all Shanten groups and pick argmax(score)
    for (const [s, group] of shantenGroups.entries()) {
      const unifiedMelded = Array.from(group.meldedSet);
      const unifiedGood = Array.from(group.goodTatsuSet);
      const unifiedBad = Array.from(group.badTatsuSet);

      const totalAcceptance = this.calculateTileAcceptance(
        {
          shanten: s,
          score: 0,
          acceptance: 0,
          liveWinningCount: 0,
          meldedOuts: unifiedMelded,
          goodTatsuOuts: unifiedGood,
          badTatsuOuts: unifiedBad,
        },
        visibleSource
      );

      const totalLiveWinning = s === 0 ? Math.floor(totalAcceptance / 100) : 0;
      const finalScore = (s === 0 && totalLiveWinning === 0) ? 0 : (10 - s) * 2500 + totalAcceptance;

      if (finalScore > bestScore || (finalScore === bestScore && s < bestResult.shanten)) {
        bestScore = finalScore;
        bestResult = {
          shanten: s,
          score: finalScore,
          acceptance: totalAcceptance,
          liveWinningCount: totalLiveWinning,
          meldedOuts: unifiedMelded,
          goodTatsuOuts: unifiedGood,
          badTatsuOuts: unifiedBad,
        };
      }
    }

    return bestResult;
  }

  /**
   * Shanten for 嚦咕嚦咕 (Eight Pairs).
   * In 16-tile Taiwanese Mahjong:
   * - 8 pairs (pairCount = 8) -> 0-Shanten Ting (waits on any of the 8 pairs to become triplet)
   * - 6 pairs + 1 triplet + 1 single (pairCount = 7, tripletCount >= 1) -> 0-Shanten Ting (waits on single)
   * - 7 pairs + 2 singles (pairCount = 7, tripletCount = 0) -> 1-Shanten
   * Note: 4-of-a-kind (quad) counts as 2 pairs.
   * Enforces 16-tile invariant: activeTiles.length === 16.
   */
  private static calculateEightPairsShanten(tiles: Tile[]): number {
    const activeTiles = tiles.filter((t) => !t.isFlower);
    if (activeTiles.length !== 16) {
      return 99;
    }

    const codeCounts = new Map<string, number>();
    for (const t of activeTiles) {
      codeCounts.set(t.shortCode, (codeCounts.get(t.shortCode) || 0) + 1);
    }
    let pairCount = 0;
    let tripletCount = 0;

    for (const count of codeCounts.values()) {
      if (count === 4) {
        pairCount += 2;
      } else if (count === 3) {
        tripletCount += 1;
        pairCount += 1;
      } else if (count === 2) {
        pairCount += 1;
      }
    }

    if (pairCount >= 8 || (pairCount >= 7 && tripletCount >= 1)) {
      return 0;
    }
    return Math.max(1, 8 - pairCount);
  }

  /**
   * Checks if a number tile is truly isolated (no duplicate, no adjacent +/-1 or +/-2 neighbors).
   */
  private static isTrueIsolated(tile: Tile, hand: Tile[]): boolean {
    const num = tile.value;
    const suit = tile.suit === 'CHARACTERS' ? 'm' : tile.suit === 'DOTS' ? 'p' : 's';

    for (const t of hand) {
      if (t.id === tile.id || t.isFlower) continue;
      const otherSuit =
        t.suit === 'CHARACTERS' ? 'm' : t.suit === 'DOTS' ? 'p' : t.suit === 'BAMBOO' ? 's' : '';
      if (otherSuit === suit) {
        if (Math.abs(t.value - num) <= 2) {
          return false;
        }
      }
    }
    return true;
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
   * Discard recommendation engine with true Shanten, weighted acceptance,
   * live-outs verification for Tenpai, and symmetric pre-Ting triplet protection.
   */
  public static chooseBestDiscard(
    hand: Tile[],
    melds: Meld[],
    allKnownVisibleTiles: Tile[] = [],
    opponents: PlayerProfile[] = [],
    remainingWallTiles: number = 72,
    roundWind?: SeatWind,
    playerWind?: SeatWind
  ): Tile {
    const candidateList = hand.filter((t) => !t.isFlower);
    if (candidateList.length === 0) return hand[0];

    const evalRes = this.evaluateBestDiscardCandidate(
      candidateList,
      melds,
      allKnownVisibleTiles,
      roundWind,
      playerWind
    );

    if (this.shouldDefend(evalRes.minShanten, remainingWallTiles, evalRes.isDeadWait)) {
      return this.chooseSafestDiscard(candidateList, opponents, allKnownVisibleTiles);
    }

    return evalRes.bestDiscard;
  }

  /**
   * Tier 2: Evaluates all unique candidate discards from a 17-tile hand (17 - 3M).
   * Reuses Tier 1 calculateShantenWithOuts and applies strategic discard biases.
   */
  public static evaluateBestDiscardCandidate(
    activeHand: Tile[],
    melds: Meld[],
    allKnownVisibleTiles: Tile[] = [],
    roundWind?: SeatWind,
    playerWind?: SeatWind
  ): BestDiscardEvaluation {
    const candidateList = activeHand.filter((t) => !t.isFlower);
    const expected = 17 - melds.length * 3;
    if (candidateList.length !== expected) {
      const fallbackTile = candidateList[0] || activeHand[0];
      return {
        bestDiscard: fallbackTile,
        minShanten: 99,
        maxScore: 0,
        isDeadWait: true,
        bestShantenRes: {
          shanten: 99,
          score: 0,
          acceptance: 0,
          liveWinningCount: 0,
          meldedOuts: [],
          goodTatsuOuts: [],
          badTatsuOuts: [],
        },
      };
    }

    const handCounts = new Map<string, number>();
    candidateList.forEach((t) => handCounts.set(t.shortCode, (handCounts.get(t.shortCode) || 0) + 1));
    const visibleCounts = new Map<string, number>();
    allKnownVisibleTiles.forEach((t) => visibleCounts.set(t.shortCode, (visibleCounts.get(t.shortCode) || 0) + 1));

    // Deduplicate candidate discards by unique shortCode
    const uniqueCandidateMap = new Map<string, { tile: Tile; idx: number }>();
    for (let i = 0; i < candidateList.length; i++) {
      const code = candidateList[i].shortCode;
      if (!uniqueCandidateMap.has(code)) {
        uniqueCandidateMap.set(code, { tile: candidateList[i], idx: i });
      }
    }

    let bestTile = candidateList[0];
    let maxScore = -999999;
    let bestShantenRes: ShantenResult = {
      shanten: 99,
      score: 0,
      acceptance: 0,
      liveWinningCount: 0,
      meldedOuts: [],
      goodTatsuOuts: [],
      badTatsuOuts: [],
    };

    for (const item of uniqueCandidateMap.values()) {
      const candidate = item.tile;
      const testHand = candidateList.filter((_, idx) => idx !== item.idx);
      const shantenRes = this.calculateShantenWithOuts(testHand, melds.length, allKnownVisibleTiles);

      const countInHand = handCounts.get(candidate.shortCode) || 1;
      const bonus = this.calculateDiscardBonus(
        candidate,
        candidateList,
        countInHand,
        shantenRes.shanten,
        visibleCounts,
        roundWind,
        playerWind
      );

      const totalCandidateScore = shantenRes.score + bonus;

      if (totalCandidateScore > maxScore) {
        maxScore = totalCandidateScore;
        bestTile = candidate;
        bestShantenRes = shantenRes;
      }
    }

    const isDeadWait = bestShantenRes.score <= 0;

    return {
      bestDiscard: bestTile,
      minShanten: bestShantenRes.shanten,
      maxScore,
      isDeadWait,
      bestShantenRes,
    };
  }

  /**
   * Calculates strategic discard preference bonus / penalty.
   */
  private static calculateDiscardBonus(
    candidate: Tile,
    activeHand: Tile[],
    countInHand: number,
    s: number,
    visibleCounts: Map<string, number>,
    roundWind?: SeatWind,
    playerWind?: SeatWind
  ): number {
    let discardBonus = 0;

    if (candidate.suit === 'WINDS' || candidate.suit === 'DRAGONS') {
      if (countInHand === 1) {
        const usedCount = visibleCounts.get(candidate.shortCode) || 0;
        const remaining = Math.max(0, 4 - usedCount);
        if (remaining === 0) {
          discardBonus += 80; // 絕張死字牌（外面殘張0）：最優先清理！
        } else {
          discardBonus += 50; // 客風/字牌真孤張
        }
      } else if (countInHand >= 3 && s >= 1) {
        // Triplet protection: in pre-Ting stages (s >= 1), protect Honor triplets
        if (this.isFanHonor(candidate, roundWind, playerWind)) {
          discardBonus -= 600; // 有台字牌暗刻（中發白/正風）
        } else {
          discardBonus -= 300; // 客風暗刻未聽牌前不應先於真孤張被打出
        }
      }
    } else {
      // 數牌（萬、筒、條）處理
      if (countInHand >= 3 && s >= 1) {
        discardBonus -= 300; // 數牌暗刻未聽牌前保護
      } else if (this.isTrueIsolated(candidate, activeHand)) {
        if (candidate.value === 1 || candidate.value === 9) {
          discardBonus += 20; // 真·孤張 1/9
        } else if (candidate.value === 2 || candidate.value === 8) {
          discardBonus += 10; // 真·孤張 2/8
        }
      }
    }

    return discardBonus;
  }

  /**
   * Checks if an honor tile yields fan points (Dragon or Seat/Round Wind).
   */
  public static isFanHonor(
    tile: Tile,
    roundWind?: SeatWind,
    playerWind?: SeatWind
  ): boolean {
    if (tile.suit === 'DRAGONS') return true;
    if (tile.suit === 'WINDS') {
      const code = tile.shortCode.toLowerCase();
      if (roundWind && code === roundWind.toLowerCase()) return true;
      if (playerWind && code === playerWind.toLowerCase()) return true;
    }
    return false;
  }

  /**
   * Defense Mode: Chooses the safest discard based on Genbutsu, Suji, and dead honors.
   */
  private static chooseSafestDiscard(
    hand: Tile[],
    opponents: PlayerProfile[],
    allKnownVisibleTiles: Tile[]
  ): Tile {
    const validHand = hand.filter((t) => !t.isFlower);
    const candidateList = validHand.length > 0 ? validHand : hand;

    // Collect all opponent discards (Genbutsu 現物)
    const opponentDiscards = new Set<string>();
    opponents.forEach((op) => {
      op.discards.forEach((d) => opponentDiscards.add(d.shortCode));
    });

    // Visible tile counts across table (open discards + melds + own hand)
    const visibleCounts = new Map<string, number>();
    const sourceTiles =
      allKnownVisibleTiles && allKnownVisibleTiles.length > 0
        ? allKnownVisibleTiles
        : hand;

    sourceTiles.forEach((t) => {
      if (!t.isFlower) {
        visibleCounts.set(t.shortCode, (visibleCounts.get(t.shortCode) || 0) + 1);
      }
    });

    let safestTile = candidateList[0];
    let lowestDangerScore = 9999;

    for (const tile of candidateList) {
      let dangerScore = 50; // Base score for unknown tile
      const code = tile.shortCode;

      // 1. Genbutsu (現物): 100% Safe against players who discarded it
      if (opponentDiscards.has(code)) {
        dangerScore = 0;
      } else if (tile.suit === 'WINDS' || tile.suit === 'DRAGONS') {
        // 2. Honors: Safe if dead (3 or 4 copies visible)
        const visible = visibleCounts.get(code) || 0;
        if (visible >= 4) {
          dangerScore = 1; // 4-visible Dead honor is 100% completely safe (cannot form sequence)
        } else if (visible === 3) {
          dangerScore = 5; // 3-visible Dead honor
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
        }

        // 4. Wall / Dead tile check (壁牌 / 絕張牌): 4-visible or 3-visible tiles are extremely safe
        const visible = visibleCounts.get(code) || 0;
        if (visible >= 4) {
          dangerScore = Math.min(dangerScore, 5); // 4 visible = 絕張牌
        } else if (visible === 3) {
          dangerScore = Math.min(dangerScore, 15); // 3 visible = 壁牌 (One-Chance)
        }

        // Suji check: if 4 is discarded, 1 and 7 are Suji-safe from two-sided waits
        if (num === 1 && opponentDiscards.has(`4${suit}`)) {
          dangerScore = Math.min(dangerScore, 15);
        }
        if (num === 9 && opponentDiscards.has(`6${suit}`)) {
          dangerScore = Math.min(dangerScore, 15);
        }
        if (num === 2 && opponentDiscards.has(`5${suit}`)) {
          dangerScore = Math.min(dangerScore, 20);
        }
        if (num === 8 && opponentDiscards.has(`5${suit}`)) {
          dangerScore = Math.min(dangerScore, 20);
        }
        if (num === 3 && opponentDiscards.has(`6${suit}`)) {
          dangerScore = Math.min(dangerScore, 25);
        }
        if (num === 7 && opponentDiscards.has(`4${suit}`)) {
          dangerScore = Math.min(dangerScore, 25);
        }

        // Two-way Suji for middle numbers: 4 is safe only if BOTH 1 and 7 are discarded
        if (num === 4 && opponentDiscards.has(`1${suit}`) && opponentDiscards.has(`7${suit}`)) {
          dangerScore = Math.min(dangerScore, 20);
        }
        if (num === 5 && opponentDiscards.has(`2${suit}`) && opponentDiscards.has(`8${suit}`)) {
          dangerScore = Math.min(dangerScore, 20);
        }
        if (num === 6 && opponentDiscards.has(`3${suit}`) && opponentDiscards.has(`9${suit}`)) {
          dangerScore = Math.min(dangerScore, 20);
        }
      }

      if (dangerScore < lowestDangerScore) {
        lowestDangerScore = dangerScore;
        safestTile = tile;
      }
    }

    return safestTile;
  }

  /**
   * Evaluates quality-weighted tile acceptance for a pre-calculated ShantenResult.
   * Melded Out: 100 pts
   * Good Tatsu Out (two-sided): 50 pts
   * Bad Tatsu Out (gap/border/pair): 20 pts
   */
  public static calculateTileAcceptance(
    shantenRes: ShantenResult,
    allKnownVisibleTiles: Tile[] = []
  ): number {
    const visibleCounts = new Map<string, number>();
    allKnownVisibleTiles.forEach((t) => {
      if (!t.isFlower) {
        visibleCounts.set(t.shortCode, (visibleCounts.get(t.shortCode) || 0) + 1);
      }
    });

    if (shantenRes.shanten === 0) {
      // Ting state: only Melded Outs (winning tiles) count
      let totalWinningTiles = 0;
      for (const code of shantenRes.meldedOuts) {
        const used = visibleCounts.get(code) || 0;
        totalWinningTiles += Math.max(0, 4 - used);
      }
      return totalWinningTiles * 100;
    }

    // 1-Shanten or higher: tier-weighted sum with de-duplication to highest tier
    const tileBestTier = new Map<string, number>();

    for (const code of shantenRes.meldedOuts) {
      tileBestTier.set(code, 100);
    }
    for (const code of shantenRes.goodTatsuOuts) {
      if (!tileBestTier.has(code) || (tileBestTier.get(code) || 0) < 50) {
        tileBestTier.set(code, 50);
      }
    }
    for (const code of shantenRes.badTatsuOuts) {
      if (!tileBestTier.has(code) || (tileBestTier.get(code) || 0) < 20) {
        tileBestTier.set(code, 20);
      }
    }

    let score = 0;
    for (const [code, weight] of tileBestTier.entries()) {
      const used = visibleCounts.get(code) || 0;
      const rem = Math.max(0, 4 - used);
      score += weight * rem;
    }

    return score;
  }

  /**
   * Boolean wrapper for evaluateKong.
   */
  public static isKongBeneficial(
    kong: KongOption,
    hand: Tile[],
    melds: Meld[],
    allKnownVisibleTiles: Tile[] = []
  ): boolean {
    return this.evaluateKong(kong, hand, melds, allKnownVisibleTiles).isBeneficial;
  }

  /**
   * Universal Kong Evaluation Engine.
   * Evaluates whether executing a kongOption (CONCEALED_KONG, ADDED_KONG, MELDED_KONG)
   * is beneficial based on Score-first and Shanten tie-breaker.
   */
  public static evaluateKong(
    kong: KongOption,
    hand: Tile[],
    melds: Meld[],
    allKnownVisibleTiles: Tile[] = []
  ): KongEvaluation {
    const validHand = hand.filter((t) => !t.isFlower);
    const candidateList = validHand.length > 0 ? validHand : hand;
    const isConcealed = melds.length === 0;

    // 1. Hand Count Invariant Guard:
    // Melded Kong claims on opponent discard -> hand must have 16 - 3M tiles
    // Concealed / Added Kong executed on self turn -> hand must have 17 - 3M tiles
    const expectedCount = kong.type === 'MELDED_KONG' ? 16 - melds.length * 3 : 17 - melds.length * 3;
    if (candidateList.length !== expectedCount) {
      return { isBeneficial: false, score: -999999, shanten: 99 };
    }

    // 2. Melded Kong (大明槓) Fan Checks:
    if (kong.type === 'MELDED_KONG') {
      // Must preserve 門清
      if (isConcealed) {
        return { isBeneficial: false, score: -999999, shanten: 99 };
      }

      // Must preserve 三暗刻 / 四暗刻
      const codeCounts = new Map<string, number>();
      for (const t of candidateList) {
        codeCounts.set(t.shortCode, (codeCounts.get(t.shortCode) || 0) + 1);
      }
      let concealedTriplets = 0;
      for (const count of codeCounts.values()) {
        if (count >= 3) concealedTriplets++;
      }
      if (concealedTriplets >= 3) {
        return { isBeneficial: false, score: -999999, shanten: 99 };
      }
    }

    // 3. Simulate Hand & Melds after Kong:
    const remainingHand: Tile[] = [];
    const simulatedMelds: Meld[] = [...melds];

    if (kong.type === 'CONCEALED_KONG') {
      let removed = 0;
      const kongTiles: Tile[] = [];
      for (const t of candidateList) {
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
      for (const t of candidateList) {
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
      for (const t of candidateList) {
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

    // 4. Calculate Post-Kong State (Tier 1)
    const postKongRes = this.calculateShantenWithOuts(remainingHand, simulatedMelds.length, allKnownVisibleTiles);
    const postKongScore = postKongRes.score + 500;
    const postKongShanten = postKongRes.shanten;

    // 5. Calculate Pre-Kong Baseline State
    let baselineScore = -999999;
    let baselineShanten = 99;

    if (kong.type === 'MELDED_KONG') {
      const baseRes = this.calculateShantenWithOuts(candidateList, melds.length, allKnownVisibleTiles);
      baselineScore = baseRes.score;
      baselineShanten = baseRes.shanten;
    } else {
      // Concealed or Added Kong: 17 tiles -> call Tier 2 to get best discard baseline
      const baseEval = this.evaluateBestDiscardCandidate(candidateList, melds, allKnownVisibleTiles);
      baselineScore = baseEval.bestShantenRes.score;
      baselineShanten = baseEval.minShanten;
    }

    // 6. Universal Comparison: Score-first, Shanten on ties
    const isBeneficial =
      postKongScore > baselineScore ||
      (postKongScore === baselineScore && postKongShanten < baselineShanten);

    return {
      isBeneficial,
      score: postKongScore,
      shanten: postKongShanten,
    };
  }

  /**
   * Decides which self kong (Concealed or Added) to execute during AI's turn, if beneficial.
   * Compares all kong options on the Score auction to pick the best one.
   */
  public static decideSelfKong(
    kongOptions: KongOption[],
    hand: Tile[],
    melds: Meld[],
    allKnownVisibleTiles: Tile[] = []
  ): KongOption | null {
    let bestKong: KongOption | null = null;
    let bestScore = -999999;
    let bestShanten = 99;

    for (const kong of kongOptions) {
      const evalRes = this.evaluateKong(kong, hand, melds, allKnownVisibleTiles);
      if (evalRes.isBeneficial) {
        if (
          evalRes.score > bestScore ||
          (evalRes.score === bestScore && evalRes.shanten < bestShanten)
        ) {
          bestScore = evalRes.score;
          bestShanten = evalRes.shanten;
          bestKong = kong;
        }
      }
    }
    return bestKong;
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
  ): AIDecision {
    // 1. Always Hu if possible
    if (actions.canHu) {
      return { action: 'HU' };
    }

    // Representative called tile
    const targetTile = calledTile || actions.chowOptions[0]?.tiles[2] || hand[0];
    const currentShantenRes = this.calculateShantenWithOuts(hand, melds.length, allKnownVisibleTiles);
    const currentShanten = currentShantenRes.shanten;
    const currentBaselineScore = currentShantenRes.score;

    // Auction variables: Start with PASS as baseline champion
    let maxActionScore = currentBaselineScore;
    let minActionShanten = currentShanten;
    let chosenDecision: AIDecision = { action: 'PASS' };

    // 2. Kong decision (Melded Kong)
    if (actions.canKong && actions.kongOptions.length > 0) {
      const kong = actions.kongOptions[0];
      const kongEval = this.evaluateKong(kong, hand, melds, allKnownVisibleTiles);
      if (kongEval.isBeneficial) {
        if (
          kongEval.score > maxActionScore ||
          (kongEval.score === maxActionScore && kongEval.shanten < minActionShanten)
        ) {
          maxActionScore = kongEval.score;
          minActionShanten = kongEval.shanten;
          chosenDecision = { action: 'KONG' };
        }
      }
    }

    // 3. Pong decision
    if (actions.canPong) {
      const isHonor = targetTile.suit === 'WINDS' || targetTile.suit === 'DRAGONS';
      const hasFan = this.isFanHonor(targetTile, roundWind, playerWind);

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

      // Simulate Pong hand & melds:
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

      // Evaluate best discard from postHand via Tier 2:
      const pongEval = this.evaluateBestDiscardCandidate(
        postHand,
        postMelds,
        allKnownVisibleTiles,
        roundWind,
        playerWind
      );
      const bestPostDiscard = pongEval.bestDiscard;
      const minPostShanten = pongEval.minShanten;
      const maxPostScore = pongEval.bestShantenRes.score;

      if (isHonor) {
        // Honor tile rule:
        // Reject if AI already holds 3+ copies (already a complete concealed triplet)
        const honorCountInHand = codeCounts.get(targetTile.shortCode) || 0;
        if (honorCountInHand >= 3) {
          // Keep concealed triplet, do not Pong
        } else if (!hasFan && isSoleEye) {
          // Keep as eye, do not Pong
        } else if (bestPostDiscard.shortCode === targetTile.shortCode) {
          // Reject Pong-then-Discard-same-tile
        } else {
          const honorScore = hasFan ? maxPostScore + 1000 : maxPostScore;
          if (honorScore > maxActionScore || (honorScore === maxActionScore && minPostShanten < minActionShanten)) {
            maxActionScore = honorScore;
            minActionShanten = minPostShanten;
            chosenDecision = { action: 'PONG' };
          }
        }
      } else {
        // Number tile rule:
        // Must strictly improve hand score and not discard the called tile immediately
        if (bestPostDiscard.shortCode !== targetTile.shortCode) {
          if (maxPostScore > maxActionScore || (maxPostScore === maxActionScore && minPostShanten < minActionShanten)) {
            maxActionScore = maxPostScore;
            minActionShanten = minPostShanten;
            chosenDecision = { action: 'PONG' };
          }
        }
      }
    }

    // 4. Chow decision with combo optimization
    if (actions.canChow && actions.chowOptions.length > 0) {
      let bestChowOption: ChowOption | null = null;
      let bestChowScore = -999999;
      let bestChowShanten = 99;

      for (const opt of actions.chowOptions) {
        const removeIds = new Set(opt.discardTileIds);
        const postHand = hand.filter((t) => !removeIds.has(t.id));
        const postMelds: Meld[] = [
          ...melds,
          { type: 'CHOW', tiles: opt.tiles, sourceSeat: 3 },
        ];

        // Evaluate best discard from postHand via Tier 2:
        const chowEval = this.evaluateBestDiscardCandidate(
          postHand,
          postMelds,
          allKnownVisibleTiles,
          roundWind,
          playerWind
        );
        const bestOptionDiscard = chowEval.bestDiscard;
        const minPostShanten = chowEval.minShanten;
        const maxOptionScore = chowEval.bestShantenRes.score;

        // Reject self-defeating "吃什麼打什麼"
        if (bestOptionDiscard.shortCode === targetTile.shortCode) {
          continue;
        }

        if (
          maxOptionScore > bestChowScore ||
          (maxOptionScore === bestChowScore && minPostShanten < bestChowShanten)
        ) {
          bestChowScore = maxOptionScore;
          bestChowShanten = minPostShanten;
          bestChowOption = opt;
        }
      }

      if (
        bestChowOption &&
        (bestChowScore > maxActionScore ||
          (bestChowScore === maxActionScore && bestChowShanten < minActionShanten))
      ) {
        maxActionScore = bestChowScore;
        minActionShanten = bestChowShanten;
        chosenDecision = { action: 'CHOW', chosenChowOption: bestChowOption };
      }
    }

    return chosenDecision;
  }
}

export interface AIDecision {
  action: 'HU' | 'KONG' | 'PONG' | 'CHOW' | 'PASS';
  chosenChowOption?: ChowOption;
}

