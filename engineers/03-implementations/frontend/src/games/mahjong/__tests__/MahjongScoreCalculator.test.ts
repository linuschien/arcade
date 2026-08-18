/**
 * MahjongScoreCalculator.test.ts
 * Unit tests for 500 Base / 200 Fan scoring, dealer 2N+1 responsibility,
 * strict 平胡 5 conditions, and mutual exclusion rules.
 */

import { describe, it, expect } from 'vitest';
import { MahjongScoreCalculator } from '../logic/MahjongScoreCalculator';
import { Tile, Meld } from '../logic/MahjongTypes';

describe('MahjongScoreCalculator Unit Tests', () => {
  const createTile = (shortCode: string, idSuffix: string = '0'): Tile => {
    let suit: any = 'CHARACTERS';
    let value = 1;
    let name = shortCode;

    if (shortCode.endsWith('m')) {
      suit = 'CHARACTERS';
      value = parseInt(shortCode[0], 10);
      name = `${value}萬`;
    } else if (shortCode.endsWith('p')) {
      suit = 'DOTS';
      value = parseInt(shortCode[0], 10);
      name = `${value}筒`;
    } else if (shortCode.endsWith('s')) {
      suit = 'BAMBOO';
      value = parseInt(shortCode[0], 10);
      name = `${value}條`;
    } else if (['east', 'south', 'west', 'north'].includes(shortCode)) {
      suit = 'WINDS';
      name = shortCode;
    } else if (['red', 'green', 'white'].includes(shortCode)) {
      suit = 'DRAGONS';
      name = shortCode;
    }

    return {
      id: `${shortCode}_${idSuffix}`,
      suit,
      value,
      name,
      shortCode,
    };
  };

  it('should calculate 門清自摸 (3 fans) correctly with 500 Base / 200 Fan', () => {
    // Hand: 123m, 456m, 789m, 123p, 456s + 9s pair (Self drawn, concealed)
    const handCodes = [
      '1m', '2m', '3m',
      '4m', '5m', '6m',
      '7m', '8m', '9m',
      '1p', '2p', '3p',
      '4s', '5s', '6s',
      '9s',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));
    const winningTile = createTile('9s', 'win');

    const result = MahjongScoreCalculator.evaluateSettlement({
      winnerSeat: 1, // Non-dealer
      winnerHand: hand,
      winnerMelds: [],
      winnerFlowers: [],
      winningTile,
      isSelfDrawn: true,
      roundWind: 'EAST',
      playerWind: 'SOUTH',
      dealerSeat: 0,
      dealerStreak: 0, // N = 0 -> Dealer multiplier = 2N+1 = 1
      currentChips: [10000, 10000, 10000, 10000],
    });

    // 門清自摸 (3 fans)
    expect(result.totalFans).toBe(3);

    // Non-dealers (seat 2, 3) pay: 500 + 200 * 3 = 1100
    // Dealer (seat 0) pays: 500 + 200 * (3 + 1) = 1300
    // Winner receives: 1100 + 1100 + 1300 = 3500
    expect(result.chipDeltas[0]).toBe(-1300);
    expect(result.chipDeltas[2]).toBe(-1100);
    expect(result.chipDeltas[3]).toBe(-1100);
    expect(result.chipDeltas[1]).toBe(3500);
  });

  it('should calculate Dealer winning with streak N=2 (2N+1 = 5 fans extra)', () => {
    const handCodes = [
      '1m', '2m', '3m',
      '4m', '5m', '6m',
      '7m', '8m', '9m',
      '1p', '2p', '3p',
      '4s', '5s', '6s',
      '9s',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));
    const winningTile = createTile('9s', 'win');

    const result = MahjongScoreCalculator.evaluateSettlement({
      winnerSeat: 0, // Dealer
      winnerHand: hand,
      winnerMelds: [],
      winnerFlowers: [],
      winningTile,
      isSelfDrawn: true,
      roundWind: 'EAST',
      playerWind: 'EAST',
      dealerSeat: 0,
      dealerStreak: 2, // 2N+1 = 5 fans
      currentChips: [10000, 10000, 10000, 10000],
    });

    // Total pattern fans = 3 (門清自摸)
    expect(result.totalFans).toBe(3);
    expect(result.dealerMultiplierFan).toBe(5);

    // Each non-dealer pays: 500 + 200 * (3 + 5) = 2100
    expect(result.chipDeltas[1]).toBe(-2100);
    expect(result.chipDeltas[2]).toBe(-2100);
    expect(result.chipDeltas[3]).toBe(-2100);
    expect(result.chipDeltas[0]).toBe(6300);
  });

  it('should evaluate strict 平胡 (2 fans) + 門清 (1 fan) on Ron', () => {
    // 5 sequences in number suits, number pair (9p), two-sided wait on 3m (with 1m, 2m), 0 flowers, Ron
    const handCodes = [
      '1m', '2m',
      '4m', '5m', '6m',
      '7m', '8m', '9m',
      '1p', '2p', '3p',
      '4s', '5s', '6s',
      '9p', '9p',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));
    const winningTile = createTile('3m', 'win');

    const result = MahjongScoreCalculator.evaluateSettlement({
      winnerSeat: 0,
      winnerHand: hand,
      winnerMelds: [],
      winnerFlowers: [],
      winningTile,
      isSelfDrawn: false,
      loserSeat: 2,
      roundWind: 'EAST',
      playerWind: 'EAST',
      dealerSeat: 0,
      dealerStreak: 0,
      currentChips: [10000, 10000, 10000, 10000],
    });

    expect(result.fans.some((f) => f.name === '平胡' && f.fan === 2)).toBe(true);
    expect(result.fans.some((f) => f.name === '門清' && f.fan === 1)).toBe(true);
    expect(result.totalFans).toBe(3);
  });

  it('should evaluate 清一色 (8 fans) and exclude 混一色', () => {
    // All characters (1m ~ 9m)
    const handCodes = [
      '1m', '2m', '3m',
      '1m', '2m', '3m',
      '4m', '5m', '6m',
      '7m', '8m', '9m',
      '9m', '9m', '9m',
      '5m',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));
    const winningTile = createTile('5m', 'win');

    const result = MahjongScoreCalculator.evaluateSettlement({
      winnerSeat: 0,
      winnerHand: hand,
      winnerMelds: [],
      winnerFlowers: [],
      winningTile,
      isSelfDrawn: false,
      loserSeat: 1,
      roundWind: 'EAST',
      playerWind: 'EAST',
      dealerSeat: 0,
      dealerStreak: 0,
      currentChips: [10000, 10000, 10000, 10000],
    });

    expect(result.fans.some((f) => f.name === '清一色' && f.fan === 8)).toBe(true);
    expect(result.fans.some((f) => f.name === '混一色')).toBe(false); // Excluded
  });

  it('should evaluate 大三元 (8 fans) and exclude single dragon pongs', () => {
    const melds: Meld[] = [
      {
        type: 'PONG',
        tiles: [createTile('red'), createTile('red'), createTile('red')],
        sourceSeat: 1,
      },
      {
        type: 'PONG',
        tiles: [createTile('green'), createTile('green'), createTile('green')],
        sourceSeat: 2,
      },
      {
        type: 'PONG',
        tiles: [createTile('white'), createTile('white'), createTile('white')],
        sourceSeat: 3,
      },
    ];

    const handCodes = ['1m', '2m', '3m', '4s', '5s', '6s', '9p'];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));
    const winningTile = createTile('9p', 'win');

    const result = MahjongScoreCalculator.evaluateSettlement({
      winnerSeat: 0,
      winnerHand: hand,
      winnerMelds: melds,
      winnerFlowers: [],
      winningTile,
      isSelfDrawn: false,
      loserSeat: 1,
      roundWind: 'EAST',
      playerWind: 'EAST',
      dealerSeat: 0,
      dealerStreak: 0,
      currentChips: [10000, 10000, 10000, 10000],
    });

    expect(result.fans.some((f) => f.name === '大三元' && f.fan === 8)).toBe(true);
    expect(result.fans.some((f) => f.name === '紅中刻子')).toBe(false);
  });
});
