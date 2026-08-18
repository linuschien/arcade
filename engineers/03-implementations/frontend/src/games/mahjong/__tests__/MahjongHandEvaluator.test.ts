/**
 * MahjongHandEvaluator.test.ts
 * Unit tests for winning hand validation, Eight Pairs (嚦咕嚦咕), smart Ting, and action checks.
 */

import { describe, it, expect } from 'vitest';
import { MahjongHandEvaluator } from '../logic/MahjongHandEvaluator';
import { Tile, Meld } from '../logic/MahjongTypes';

describe('MahjongHandEvaluator Unit Tests', () => {
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

  it('should validate standard 17-tile winning hand (5 melds + 1 pair)', () => {
    // 123m, 456m, 789m, 123p, 555s (5 melds) + 99s (1 pair) = 17 tiles
    const handCodes = [
      '1m', '2m', '3m',
      '4m', '5m', '6m',
      '7m', '8m', '9m',
      '1p', '2p', '3p',
      '5s', '5s', '5s',
      '9s',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));
    const winningTile = createTile('9s', 'win');

    const isWin = MahjongHandEvaluator.isWinningHand(hand, [], winningTile);
    expect(isWin).toBe(true);
  });

  it('should validate winning hand with open melds (e.g. 2 open melds + 3 hand melds + 1 pair)', () => {
    // 2 open melds (Chow 123m, Pong 555p)
    const melds: Meld[] = [
      {
        type: 'CHOW',
        tiles: [createTile('1m'), createTile('2m'), createTile('3m')],
        sourceSeat: 3,
      },
      {
        type: 'PONG',
        tiles: [createTile('5p'), createTile('5p'), createTile('5p')],
        sourceSeat: 2,
      },
    ];

    // Hand: 456s, 789s, 111s (3 melds) + 9p (waiting on 9p pair) = 10 tiles in hand
    const handCodes = ['4s', '5s', '6s', '7s', '8s', '9s', '1s', '1s', '1s', '9p'];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));
    const winningTile = createTile('9p', 'win');

    const isWin = MahjongHandEvaluator.isWinningHand(hand, melds, winningTile);
    expect(isWin).toBe(true);
  });

  it('should validate Special Hand: 嚦咕嚦咕 (Eight Pairs / 7 pairs + 1 triplet)', () => {
    // 11m, 22m, 33m, 44m, 55m, 66m, 77m (7 pairs) + 999m (1 triplet) = 17 tiles
    const codes = [
      '1m', '1m', '2m', '2m', '3m', '3m', '4m', '4m',
      '5m', '5m', '6m', '6m', '7m', '7m', '9m', '9m',
    ];
    const hand = codes.map((c, i) => createTile(c, `${i}`));
    const winningTile = createTile('9m', 'win');

    const isWin = MahjongHandEvaluator.isWinningHand(hand, [], winningTile);
    expect(isWin).toBe(true);
  });

  it('should reject invalid / incomplete hands', () => {
    // Missing matching tiles
    const handCodes = [
      '1m', '2m', '4m',
      '4m', '5m', '6m',
      '7m', '8m', '9m',
      '1p', '2p', '3p',
      '5s', '5s', '8s',
      '9s',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));
    const winningTile = createTile('east', 'win');

    const isWin = MahjongHandEvaluator.isWinningHand(hand, [], winningTile);
    expect(isWin).toBe(false);
  });

  it('should accurately calculate Smart Ting (智慧聽牌) options and remaining counts', () => {
    // Hand: 123m, 456m, 789m, 123p, 555s + 9s (16 tiles ready on 9s)
    const handCodes = [
      '1m', '2m', '3m',
      '4m', '5m', '6m',
      '7m', '8m', '9m',
      '1p', '2p', '3p',
      '5s', '5s', '5s',
      '9s',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));

    const ting = MahjongHandEvaluator.evaluateTing(hand, []);
    expect(ting.winningTiles.length).toBeGreaterThan(0);
    expect(ting.winningTiles.some((t) => t.tileCode === '9s')).toBe(true);
    expect(ting.winningTiles.find((t) => t.tileCode === '9s')!.remainingCount).toBe(3); // 4 - 1 in hand
  });

  it('should evaluate Chow options and enforce upper player (上家) rule', () => {
    const handCodes = ['1m', '2m', '4m', '5m', '9p'];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));
    const calledTile = createTile('3m');

    // Called from upper player (seat 3 to seat 0 -> (3 + 1) % 4 === 0)
    const chowFromUpper = MahjongHandEvaluator.getChowOptions(hand, calledTile, 3, 0);
    expect(chowFromUpper.length).toBe(3); // [1m, 2m, 3m], [2m, 3m, 4m], [3m, 4m, 5m]

    // Called from across player (seat 2 to seat 0 -> not allowed)
    const chowFromAcross = MahjongHandEvaluator.getChowOptions(hand, calledTile, 2, 0);
    expect(chowFromAcross.length).toBe(0);
  });

  it('should evaluate Pong and enforce Same-Turn Pass-Pong Lockout', () => {
    const hand = [createTile('5m', '1'), createTile('5m', '2'), createTile('9s')];
    const calledTile = createTile('5m', '3');

    // Can pong normally
    const passPongEmpty = new Set<string>();
    expect(MahjongHandEvaluator.canPong(hand, calledTile, passPongEmpty)).toBe(true);

    // Locked out in same turn
    const passPongLocked = new Set<string>(['5m']);
    expect(MahjongHandEvaluator.canPong(hand, calledTile, passPongLocked)).toBe(false);
  });

  it('should evaluate Melded Kong and forbid Melded Kong against Upper Player', () => {
    const hand = [
      createTile('8p', '1'),
      createTile('8p', '2'),
      createTile('8p', '3'),
      createTile('1s'),
    ];
    const calledTile = createTile('8p', '4');

    // From Across (seat 2 to seat 0) -> Allowed
    expect(MahjongHandEvaluator.canMeldedKong(hand, calledTile, 2, 0)).toBe(true);

    // From Upper (seat 3 to seat 0) -> Forbidden (禁止大明槓上家)
    expect(MahjongHandEvaluator.canMeldedKong(hand, calledTile, 3, 0)).toBe(false);
  });

  it('should correctly evaluate two-sided wait (雙頭聽) and allow winning on BOTH smaller and larger numbers', () => {
    // 16-tile hand with 2m, 3m (two-sided wait on 1m and 4m)
    const hand: Tile[] = [
      createTile('2m', '1'),
      createTile('3m', '1'),
      // sequence 1s, 2s, 3s
      createTile('1s', '1'),
      createTile('2s', '1'),
      createTile('3s', '1'),
      // sequence 4p, 5p, 6p
      createTile('4p', '1'),
      createTile('5p', '1'),
      createTile('6p', '1'),
      // triplet 7s, 7s, 7s
      createTile('7s', '1'),
      createTile('7s', '2'),
      createTile('7s', '3'),
      // triplet 1p, 1p, 1p
      createTile('1p', '1'),
      createTile('1p', '2'),
      createTile('1p', '3'),
      // pair 9m, 9m (eye)
      createTile('9m', '1'),
      createTile('9m', '2'),
    ];

    // Evaluate Smart Ting
    const ting = MahjongHandEvaluator.evaluateTing(hand, []);
    const winningCodes = ting.winningTiles.map((w) => w.tileCode);

    // BOTH 1m (smaller) and 4m (larger) must be recognized as winning tiles!
    expect(winningCodes).toContain('1m');
    expect(winningCodes).toContain('4m');

    // Winning check for 1m (smaller number)
    const winWithSmall = MahjongHandEvaluator.isWinningHand(hand, [], createTile('1m', '99'));
    expect(winWithSmall).toBe(true);

    // Winning check for 4m (larger number)
    const winWithLarge = MahjongHandEvaluator.isWinningHand(hand, [], createTile('4m', '99'));
    expect(winWithLarge).toBe(true);
  });
});
