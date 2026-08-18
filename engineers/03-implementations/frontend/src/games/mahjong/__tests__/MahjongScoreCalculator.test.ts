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

  it('should evaluate 地胡 (8 fans) + 槓上開花 (1 fan) = 9 fans (implicitly includes concealed self-draw)', () => {
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
      isEarthlyWin: true,
      isKongBloom: true, // Drew flower on first turn, replenished from tail and won!
      roundWind: 'EAST',
      playerWind: 'SOUTH',
      dealerSeat: 0,
      dealerStreak: 0,
      currentChips: [10000, 10000, 10000, 10000],
    });

    expect(result.fans.some((f) => f.name === '地胡' && f.fan === 8)).toBe(true);
    expect(result.fans.some((f) => f.name === '槓上開花' && f.fan === 1)).toBe(true);
    expect(result.fans.some((f) => f.name === '門清自摸')).toBe(false); // Excluded (implicitly included)
    expect(result.totalFans).toBe(9);
  });

  it('should evaluate 天胡 (16 fans) + 槓上開花 (1 fan) + 莊家 (1 fan) = 18 fans for dealer flower replenishment win', () => {
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
      isHeavenlyWin: true,
      isKongBloom: true, // Drew flower on initial deal/jump, replenished from tail and won!
      roundWind: 'EAST',
      playerWind: 'EAST',
      dealerSeat: 0,
      dealerStreak: 0, // N = 0 -> 2N+1 = 1 fan
      currentChips: [10000, 10000, 10000, 10000],
    });

    expect(result.fans.some((f) => f.name === '天胡' && f.fan === 16)).toBe(true);
    expect(result.fans.some((f) => f.name === '槓上開花' && f.fan === 1)).toBe(true);
    expect(result.dealerMultiplierFan).toBe(1);
    expect(result.fans.some((f) => f.name === '門清自摸')).toBe(false); // Excluded (implicitly included)
    expect(result.totalFans).toBe(17);
    // Non-dealers each pay: 500 + 200 * (17 + 1) = 4100
    expect(result.chipDeltas[1]).toBe(-4100);
    expect(result.chipDeltas[2]).toBe(-4100);
    expect(result.chipDeltas[3]).toBe(-4100);
    expect(result.chipDeltas[0]).toBe(12300);
  });

  it('should evaluate 人胡 (8 fans) + 平胡 (2 fans) = 10 fans when ron on first turn without melds', () => {
    // Hand: 123m, 456m, 789m, 123p, 45s (waiting on 3s/6s) + 9m pair
    const handCodes = [
      '1m', '2m', '3m',
      '4m', '5m', '6m',
      '7m', '8m', '9m',
      '1p', '2p', '3p',
      '4s', '5s',
      '9m', '9m',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));
    const winningTile = createTile('6s', 'win'); // 2-sided wait

    const result = MahjongScoreCalculator.evaluateSettlement({
      winnerSeat: 1, // Non-dealer
      winnerHand: hand,
      winnerMelds: [],
      winnerFlowers: [],
      winningTile,
      isSelfDrawn: false,
      loserSeat: 0,
      isHumanWin: true,
      roundWind: 'EAST',
      playerWind: 'SOUTH',
      dealerSeat: 0,
      dealerStreak: 0,
      currentChips: [10000, 10000, 10000, 10000],
    });

    expect(result.fans.some((f) => f.name === '人胡' && f.fan === 8)).toBe(true);
    expect(result.fans.some((f) => f.name === '平胡' && f.fan === 2)).toBe(true);
    expect(result.fans.some((f) => f.name === '門清')).toBe(false); // Excluded (implicitly included)
    // Extra 1 fan because loser is dealer (2N+1 = 1)
    // Total fans for winner = 8 (人胡) + 2 (平胡) = 10 fans
    expect(result.totalFans).toBe(10);
    // Dealer pays: 500 + 200 * (10 + 1) = 2700
    expect(result.chipDeltas[0]).toBe(-2700);
    expect(result.chipDeltas[1]).toBe(2700);
  });

  it('should evaluate 嚦咕嚦咕 (8 fans) + 自摸 (1 fan) = 9 fans, excluding 門清自摸/碰碰胡/暗刻', () => {
    // 7 pairs + 1 triplet in multiple suits (not full flush): 11m, 22m, 33m, 44p, 55p, 66s, 77s, 888s (17 tiles)
    const handCodes = [
      '1m', '1m',
      '2m', '2m',
      '3m', '3m',
      '4p', '4p',
      '5p', '5p',
      '6s', '6s',
      '7s', '7s',
      '8s', '8s',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));
    const winningTile = createTile('8s', 'win'); // Forms triplet 888s

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
      dealerStreak: 0,
      currentChips: [10000, 10000, 10000, 10000],
    });

    expect(result.fans.some((f) => f.name === '嚦咕嚦咕' && f.fan === 8)).toBe(true);
    expect(result.fans.some((f) => f.name === '自摸' && f.fan === 1)).toBe(true);
    expect(result.fans.some((f) => f.name === '門清自摸')).toBe(false); // Excluded
    expect(result.fans.some((f) => f.name === '碰碰胡')).toBe(false); // Excluded
    expect(result.totalFans).toBe(9);
  });

  it('should evaluate 花槓 (2 fans) excluding internal 正花, but including separate 正花 (2+1=3 fans)', () => {
    // Player is East wind (needs flower 1: 春, 梅)
    // Has full Seasons (春夏秋冬 = 花槓 2台) + 1 separate Plant (梅 = 正花 1台)
    const seasonFlowers: Tile[] = [
      { id: 'f_spring', suit: 'FLOWERS', value: 1, name: '春', shortCode: 'spring', isFlower: true },
      { id: 'f_summer', suit: 'FLOWERS', value: 2, name: '夏', shortCode: 'summer', isFlower: true },
      { id: 'f_autumn', suit: 'FLOWERS', value: 3, name: '秋', shortCode: 'autumn', isFlower: true },
      { id: 'f_winter', suit: 'FLOWERS', value: 4, name: '冬', shortCode: 'winter', isFlower: true },
      { id: 'f_plum', suit: 'FLOWERS', value: 1, name: '梅', shortCode: 'plum', isFlower: true },
    ];

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
      winnerSeat: 1,
      winnerHand: hand,
      winnerMelds: [],
      winnerFlowers: seasonFlowers,
      winningTile,
      isSelfDrawn: false,
      loserSeat: 2,
      roundWind: 'EAST',
      playerWind: 'EAST', // Matches 春 (value 1) and 梅 (value 1)
      dealerSeat: 0,
      dealerStreak: 0,
      currentChips: [10000, 10000, 10000, 10000],
    });

    expect(result.fans.some((f) => f.name === '四季花槓' && f.fan === 2)).toBe(true);
    expect(result.fans.some((f) => f.name === '正花 (春)')).toBe(false); // Excluded (internal to season gang)
    expect(result.fans.some((f) => f.name === '正花 (梅)' && f.fan === 1)).toBe(true); // Included (from plant gang)
    expect(result.fans.some((f) => f.name === '門清' && f.fan === 1)).toBe(true);
    expect(result.totalFans).toBe(4);
  });

  it('should evaluate 五暗刻 (8 fans) + 碰碰胡 (4 fans) + 門清自摸 (3 fans) = 15 fans without mutual exclusion', () => {
    // 5 concealed triplets + 1 pair: 111m, 222m, 333m, 444p, 555s + 9s9s (Self drawn)
    const handCodes = [
      '1m', '1m', '1m',
      '2m', '2m', '2m',
      '3m', '3m', '3m',
      '4p', '4p', '4p',
      '5s', '5s', '5s',
      '9s',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));
    const winningTile = createTile('9s', 'win'); // Pair tile zimo

    const result = MahjongScoreCalculator.evaluateSettlement({
      winnerSeat: 1,
      winnerHand: hand,
      winnerMelds: [],
      winnerFlowers: [],
      winningTile,
      isSelfDrawn: true,
      roundWind: 'EAST',
      playerWind: 'SOUTH',
      dealerSeat: 0,
      dealerStreak: 0,
      currentChips: [10000, 10000, 10000, 10000],
    });

    expect(result.fans.some((f) => f.name === '五暗刻' && f.fan === 8)).toBe(true);
    expect(result.fans.some((f) => f.name === '碰碰胡' && f.fan === 4)).toBe(true);
    expect(result.fans.some((f) => f.name === '門清自摸' && f.fan === 3)).toBe(true);
    expect(result.totalFans).toBe(15);
  });
});
