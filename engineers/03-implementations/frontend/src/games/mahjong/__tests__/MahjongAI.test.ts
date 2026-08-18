/**
 * MahjongAI.test.ts
 * Unit tests for AI Shanten calculation, Tile Acceptance, and Defensive Discarding.
 */

import { describe, it, expect } from 'vitest';
import { MahjongAI } from '../logic/MahjongAI';
import { Tile, PlayerProfile } from '../logic/MahjongTypes';

describe('MahjongAI Unit Tests', () => {
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

  it('should calculate 0-Shanten (Ting / Ready) accurately', () => {
    // 16 tiles waiting on 9s
    const handCodes = [
      '1m', '2m', '3m',
      '4m', '5m', '6m',
      '7m', '8m', '9m',
      '1p', '2p', '3p',
      '5s', '5s', '5s',
      '9s',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));
    const shanten = MahjongAI.calculateShanten(hand, []);
    expect(shanten).toBe(0);
  });

  it('should choose discard that minimizes shanten in attack mode', () => {
    // 16 tiles + 1 extra useless 'east' tile
    const handCodes = [
      '1m', '2m', '3m',
      '4m', '5m', '6m',
      '7m', '8m', '9m',
      '1p', '2p', '3p',
      '5s', '5s', '5s',
      '9s', 'east',
    ];
    const hand = handCodes.map((c, i) => createTile(c, `${i}`));

    const mockOpponents: PlayerProfile[] = [];
    const best = MahjongAI.chooseBestDiscard(hand, [], [], mockOpponents, 60);

    // Discarding 'east' preserves 0-shanten on 9s
    expect(best.shortCode).toBe('east');
  });

  it('should prioritize Genbutsu (現物) in defense mode', () => {
    // Hand has 3m (dangerous middle card) and 1p (already in opponent discard river)
    const hand = [
      createTile('3m', '1'),
      createTile('4m', '1'),
      createTile('5m', '1'),
      createTile('1p', '1'),
    ];

    const opponent: PlayerProfile = {
      seat: 1,
      name: '小刀',
      isHuman: false,
      wind: 'SOUTH',
      isDealer: false,
      chips: 10000,
      hand: [],
      drawnTile: null,
      melds: [
        { type: 'CHOW', tiles: [], sourceSeat: 0 },
        { type: 'CHOW', tiles: [], sourceSeat: 0 },
        { type: 'PONG', tiles: [], sourceSeat: 2 },
      ], // 3 open melds -> triggers defense
      flowers: [],
      discards: [createTile('1p', 'd1'), createTile('9s', 'd2')], // 1p is Genbutsu!
      isTing: true,
      isAutoPlay: false,
      isPassLockout: false,
      passPongCodesInTurn: new Set(),
    };

    // Remaining wall < 30 tiles and shanten >= 2 -> forces defense
    const safest = MahjongAI.chooseBestDiscard(hand, [], [], [opponent], 20);
    expect(safest.shortCode).toBe('1p'); // Genbutsu 100% safe
  });
});
