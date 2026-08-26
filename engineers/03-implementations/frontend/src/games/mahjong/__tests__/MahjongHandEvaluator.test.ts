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

  it('should correctly determine Ting on the 4th tile of both triplets for 5 pairs + 2 triplets', () => {
    // 5 pairs (1m,9m,1p,9p,1s) + 2 triplets (east,red) = 16 tiles
    // Tings on 4th tile of east or red (which completes 5 pairs + 2 pairs from quad + 1 triplet = 7 pairs 1 triplet)
    const handCodes = [
      '1m', '1m', '9m', '9m', '1p', '1p', '9p', '9p', '1s', '1s',
      'east', 'east', 'east',
      'red', 'red', 'red',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));

    const ting = MahjongHandEvaluator.evaluateTing(hand, []);
    expect(ting.winningTiles.length).toBe(2);
    const codes = ting.winningTiles.map((t) => t.tileCode);
    expect(codes).toEqual(expect.arrayContaining(['east', 'red']));
  });

  it('should correctly determine 2-way Ting for Eight Pairs when holding 3 quads + 2 pairs', () => {
    // 3 quads (1m*4, 9m*4, 1p*4 = 6 pairs) + 2 pairs (9p*2, 1s*2 = 2 pairs) = 16 tiles (8 pairs total)
    // Tings on 9p and 1s to become a triplet (7 pairs + 1 triplet)
    const handCodes = [
      '1m', '1m', '1m', '1m',
      '9m', '9m', '9m', '9m',
      '1p', '1p', '1p', '1p',
      '9p', '9p',
      '1s', '1s',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));

    const ting = MahjongHandEvaluator.evaluateTing(hand, []);
    expect(ting.winningTiles.length).toBe(2);
    const codes = ting.winningTiles.map((t) => t.tileCode);
    expect(codes).toEqual(expect.arrayContaining(['9p', '1s']));
  });

  it('should correctly determine single-wait Ting for Eight Pairs (6 pairs + 1 triplet + 1 single)', () => {
    // 6 pairs (1m,9m,1p,9p,1s,east) + 1 triplet (red) + 1 single (white) = 16 tiles (Ting on white)
    const handCodes = [
      '1m', '1m', '9m', '9m', '1p', '1p', '9p', '9p', '1s', '1s', 'east', 'east',
      'red', 'red', 'red',
      'white',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));

    const ting = MahjongHandEvaluator.evaluateTing(hand, []);
    expect(ting.winningTiles.length).toBe(1);
    expect(ting.winningTiles[0].tileCode).toBe('white');
  });

  it('should correctly determine 8-way Ting for Eight Pairs when player holds 8 full pairs', () => {
    // 8 pairs (1m,9m,1p,9p,1s,east,south,red) = 16 tiles (Ting on all 8 pairs)
    const handCodes = [
      '1m', '1m', '9m', '9m', '1p', '1p', '9p', '9p',
      '1s', '1s', 'east', 'east', 'south', 'south', 'red', 'red',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));

    const ting = MahjongHandEvaluator.evaluateTing(hand, []);
    expect(ting.winningTiles.length).toBe(8);
    const codes = ting.winningTiles.map((t) => t.tileCode);
    expect(codes).toEqual(expect.arrayContaining(['1m', '9m', '1p', '9p', '1s', 'east', 'south', 'red']));
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
    // Tiles must strictly be arranged in ascending numerical order
    chowFromUpper.forEach((opt) => {
      expect(opt.tiles[0].value).toBeLessThan(opt.tiles[1].value);
      expect(opt.tiles[1].value).toBeLessThan(opt.tiles[2].value);
    });
    expect(chowFromUpper[0].tiles.map((t) => t.shortCode)).toEqual(['1m', '2m', '3m']);
    expect(chowFromUpper[1].tiles.map((t) => t.shortCode)).toEqual(['2m', '3m', '4m']);
    expect(chowFromUpper[2].tiles.map((t) => t.shortCode)).toEqual(['3m', '4m', '5m']);

    // Called from across player (seat 2 to seat 0 -> not allowed)
    const chowFromAcross = MahjongHandEvaluator.getChowOptions(hand, calledTile, 2, 0);
    expect(chowFromAcross.length).toBe(0);
  });

  it('should evaluate Pong and enforce Same-Turn Pass-Pong Lockout', () => {
    const hand = [createTile('5m', '1'), createTile('5m', '2'), createTile('9s')];
    const calledTile = createTile('5m', '3');

    // Can pong normally (holding 2 matching tiles)
    const passPongEmpty = new Set<string>();
    expect(MahjongHandEvaluator.canPong(hand, calledTile, passPongEmpty)).toBe(true);

    // Composite shapes (holding 3 matching tiles, e.g. 23444s) can also Pong (matching.length >= 2)
    const handWithTriplet = [
      createTile('5m', '1'),
      createTile('5m', '2'),
      createTile('5m', '3'),
      createTile('9s'),
    ];
    expect(MahjongHandEvaluator.canPong(handWithTriplet, calledTile, passPongEmpty)).toBe(true);

    // Locked out in same turn
    const passPongLocked = new Set<string>(['5m']);
    expect(MahjongHandEvaluator.canPong(hand, calledTile, passPongLocked)).toBe(false);
  });

  it('should evaluate Self Kong options and exclude just-claimed Pong tileCode on the same turn', () => {
    const hand = [createTile('5m', '4'), createTile('1s', '1'), createTile('1s', '2'), createTile('1s', '3'), createTile('1s', '4')];
    const melds = [
      {
        type: 'PONG' as const,
        tiles: [createTile('5m', '1'), createTile('5m', '2'), createTile('5m', '3')],
        sourceSeat: 2 as const,
      },
    ];

    // Normally (self-draw turn): both 5m Added Kong and 1s Concealed Kong are available
    const normalOptions = MahjongHandEvaluator.getSelfKongOptions(hand, melds);
    expect(normalOptions.length).toBe(2);
    expect(normalOptions.some((k) => k.type === 'ADDED_KONG' && k.tileCode === '5m')).toBe(true);
    expect(normalOptions.some((k) => k.type === 'CONCEALED_KONG' && k.tileCode === '1s')).toBe(true);

    // On immediate post-Pong turn for 5m: 5m Added Kong is excluded, while 1s Concealed Kong remains available!
    const postPongOptions = MahjongHandEvaluator.getSelfKongOptions(hand, melds, '5m');
    expect(postPongOptions.length).toBe(1);
    expect(postPongOptions[0].type).toBe('CONCEALED_KONG');
    expect(postPongOptions[0].tileCode).toBe('1s');
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

  it('should correctly calculate Smart Ting and Winning Hand with Added Kong (加槓) and Concealed Kong (暗槓)', () => {
    // 1 Added Kong meld (1m x 4)
    const addedKongMeld: Meld = {
      type: 'ADDED_KONG',
      tiles: [createTile('1m', '1'), createTile('1m', '2'), createTile('1m', '3'), createTile('1m', '4')],
      sourceSeat: 0,
    };

    // 13 concealed tiles in hand: 456s, 789s, 234p, 999p, 7m (waiting on 7m pair)
    const handCodes = ['4s', '5s', '6s', '7s', '8s', '9s', '2p', '3p', '4p', '9p', '9p', '9p', '7m'];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));

    // Evaluate Smart Ting with Added Kong meld
    const ting = MahjongHandEvaluator.evaluateTing(hand, [addedKongMeld]);
    expect(ting.winningTiles.length).toBeGreaterThan(0);
    expect(ting.winningTiles.some((t) => t.tileCode === '7m')).toBe(true);

    // Winning check on drawn 7m (槓上自摸 7m)
    const winWith7m = MahjongHandEvaluator.isWinningHand(hand, [addedKongMeld], createTile('7m', 'win'));
    expect(winWith7m).toBe(true);

    // Concealed Kong meld (8s x 4)
    const concealedKongMeld: Meld = {
      type: 'CONCEALED_KONG',
      tiles: [createTile('8s', '1'), createTile('8s', '2'), createTile('8s', '3'), createTile('8s', '4')],
      sourceSeat: 0,
    };

    const tingConcealed = MahjongHandEvaluator.evaluateTing(hand, [concealedKongMeld]);
    expect(tingConcealed.winningTiles.length).toBeGreaterThan(0);
    expect(tingConcealed.winningTiles.some((t) => t.tileCode === '7m')).toBe(true);

    const winConcealed = MahjongHandEvaluator.isWinningHand(hand, [concealedKongMeld], createTile('7m', 'win'));
    expect(winConcealed).toBe(true);
  });
});
