/**
 * MahjongAI.test.ts
 * Unit tests for AI Shanten calculation, dynamic defense, live-Ting selection,
 * unified Kong evaluation (Screwdriver protection & fan preservation), and aggressive Meld progression.
 */

import { describe, it, expect } from 'vitest';
import { MahjongAI } from '../logic/MahjongAI';
import { Tile, Meld, PlayerProfile, AvailableActions, KongOption } from '../logic/MahjongTypes';

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

  describe('Dynamic Shanten-to-Draw Defense (shouldDefend)', () => {
    it('should 100% attack when in live Ting (0-Shanten with > 0 live winning tiles)', () => {
      // 0-Shanten, not dead wait
      expect(MahjongAI.shouldDefend(0, 4, false)).toBe(false);
      expect(MahjongAI.shouldDefend(0, 40, false)).toBe(false);
    });

    it('should defend when in dead Ting (0-Shanten with 0 live winning tiles)', () => {
      expect(MahjongAI.shouldDefend(0, 40, true)).toBe(true);
    });

    it('should attack when remaining draws M >= S + 1 (hopeful draw line)', () => {
      // 1-Shanten with M = 2 draws (8 wall tiles left -> M = 2 >= 1+1 = 2)
      expect(MahjongAI.shouldDefend(1, 8, false)).toBe(false);
      // 2-Shanten with M = 3 draws (12 wall tiles left -> M = 3 >= 2+1 = 3)
      expect(MahjongAI.shouldDefend(2, 12, false)).toBe(false);
      // 2-Shanten with plenty of tiles (40 wall tiles -> M = 10)
      expect(MahjongAI.shouldDefend(2, 40, false)).toBe(false);
    });

    it('should defend when remaining draws M <= S (mathematically hopeless line)', () => {
      // 1-Shanten with only M = 1 draw left (4 wall tiles -> M = 1 <= 1)
      expect(MahjongAI.shouldDefend(1, 4, false)).toBe(true);
      // 2-Shanten with only M = 2 draws left (8 wall tiles -> M = 2 <= 2)
      expect(MahjongAI.shouldDefend(2, 8, false)).toBe(true);
      // 3-Shanten with only M = 3 draws left (12 wall tiles -> M = 3 <= 3)
      expect(MahjongAI.shouldDefend(3, 12, false)).toBe(true);
    });
  });

  describe('Ting Selection and Avoid Dead Wait', () => {
    it('should prefer discard that leads to live Ting over dead Ting', () => {
      // Hand: 123m, 456m, 789m, 123p, 55s, 9s, 8m
      // If discard 8m -> waits on 9s
      // If discard 9s -> waits on 8m (suppose all 8m are already dead)
      const handCodes = ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '1p', '2p', '3p', '5s', '5s', '9s', '8m'];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));

      // 4 copies of 8m are visible on the table (dead)
      const allVisible = [
        createTile('8m', 'v1'),
        createTile('8m', 'v2'),
        createTile('8m', 'v3'),
        createTile('8m', 'v4'),
      ];

      const best = MahjongAI.chooseBestDiscard(hand, [], allVisible, [], 40);
      // Must discard 8m (which waits on live 9s), instead of discarding 9s (which would wait on dead 8m)
      expect(best.shortCode).toBe('8m');
    });
  });

  describe('Universal Kong Evaluation (isKongBeneficial & Screwdriver Protection)', () => {
    it('should REJECT Concealed Kong on "Screwdriver" shape (5556m) to protect 3-way Ting', () => {
      // 16-tile hand in 0-Shanten: 123p (3), 456p (3), 789p (3), 123s (3), 5556m (4) = 16 tiles
      // 4 melds: 123p, 456p, 789p, 123s (12 tiles).
      // 5556m: 55m (eye) + 56m (waits 4/7m) OR 555m (meld) + 6m (waits 6m) -> 3-way wait on 4m, 6m, 7m!
      // Drawn 17th tile is the 4th 5m.
      const handCodes = [
        '1p', '2p', '3p',
        '4p', '5p', '6p',
        '7p', '8p', '9p',
        '1s', '2s', '3s',
        '5m', '5m', '5m', '5m', // 4 copies of 5m
        '6m',
      ];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));

      const kong: KongOption = {
        type: 'CONCEALED_KONG',
        tileCode: '5m',
        handTileIds: hand.filter((t) => t.shortCode === '5m').map((t) => t.id),
      };

      const isBeneficial = MahjongAI.isKongBeneficial(kong, hand, []);
      expect(isBeneficial).toBe(false); // Rejected! Protects 3-way Ting (4/6/7m)
    });

    it('should ALLOW Concealed Kong when it does not reduce winning tiles count', () => {
      // Hand in 0-Shanten: 123m, 456m, 789m, 123p, 99s (eyes) + 5555s (independent quad)
      // Waits on 9s. If 5s is konged, it still waits on 9s (winning count unchanged).
      const handCodes = [
        '1m', '2m', '3m',
        '4m', '5m', '6m',
        '7m', '8m', '9m',
        '1p', '2p', '3p',
        '9s', '9s',
        '5s', '5s', '5s', '5s',
      ];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));
      // Drawn 17th tile is one of the 5s
      const kong: KongOption = {
        type: 'CONCEALED_KONG',
        tileCode: '5s',
        handTileIds: hand.filter((t) => t.shortCode === '5s').map((t) => t.id),
      };

      const isBeneficial = MahjongAI.isKongBeneficial(kong, hand, []);
      expect(isBeneficial).toBe(true); // Allowed!
    });

    it('should REJECT Melded Kong (大明槓) when hand is Concealed (門清)', () => {
      const handCodes = ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '1p', '2p', '3p', '9s', '9s', '5s', '5s', '5s'];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));

      const kong: KongOption = {
        type: 'MELDED_KONG',
        tileCode: '5s',
        handTileIds: hand.filter((t) => t.shortCode === '5s').map((t) => t.id),
      };

      // melds.length === 0 -> Concealed (門清)
      expect(MahjongAI.isKongBeneficial(kong, hand, [])).toBe(false);
    });

    it('should REJECT Melded Kong when hand holds 3 or more Concealed Triplets (三暗刻)', () => {
      // Hand has 3 concealed triplets (111m, 222m, 333m) + 555s + 99s
      const handCodes = [
        '1m', '1m', '1m',
        '2m', '2m', '2m',
        '3m', '3m', '3m',
        '5s', '5s', '5s',
        '9s', '9s',
      ];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));
      const openMelds: Meld[] = [{ type: 'CHOW', tiles: [createTile('1p'), createTile('2p'), createTile('3p')], sourceSeat: 3 }];

      const kong: KongOption = {
        type: 'MELDED_KONG',
        tileCode: '5s',
        handTileIds: hand.filter((t) => t.shortCode === '5s').map((t) => t.id),
      };

      // Taking Melded Kong on 5s would break 3 Concealed Triplets -> Rejected
      expect(MahjongAI.isKongBeneficial(kong, hand, openMelds)).toBe(false);
    });

    it('should ALLOW Melded Kong when hand is open and has no concealed triplet fan loss', () => {
      // 16-tile hand: 2 open Chows (6 tiles) + 10 concealed tiles (123m, 99s, 8s, 9p, 555s)
      const handCodes = ['1m', '2m', '3m', '9s', '9s', '8s', '9p', '5s', '5s', '5s'];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));
      const openMelds: Meld[] = [
        { type: 'CHOW', tiles: [createTile('1p'), createTile('2p'), createTile('3p')], sourceSeat: 3 },
        { type: 'CHOW', tiles: [createTile('7p'), createTile('8p'), createTile('9p')], sourceSeat: 3 },
      ];

      const kong: KongOption = {
        type: 'MELDED_KONG',
        tileCode: '5s',
        handTileIds: hand.filter((t) => t.shortCode === '5s').map((t) => t.id),
      };

      expect(MahjongAI.isKongBeneficial(kong, hand, openMelds)).toBe(true);
    });
  });

  describe('Aggressive Meld Decisions (decideAction: Chow & Pong)', () => {
    it('should Pong Honor tiles with Fan (中發白/正風) even if it is the only pair in hand', () => {
      // Hand with only 1 pair: 'red' (紅中, Dragon = 1 Fan)
      const handCodes = ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '1p', '2p', '3p', '1s', '2s', 'red', 'red'];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));

      const actions: AvailableActions = {
        canHu: false,
        canKong: false,
        kongOptions: [],
        canPong: true,
        canChow: false,
        chowOptions: [],
        canTing: false,
        canPass: true,
      };

      const decision = MahjongAI.decideAction(
        actions,
        hand,
        [],
        'EAST',
        'SOUTH',
        [],
        createTile('red', 'called')
      );

      expect(decision).toBe('PONG');
    });

    it('should PASS on Guest Wind (无台字牌) if it is the SOLE eye in hand', () => {
      // Hand with only 1 pair: 'west' (西風, Guest Wind for South player in East round -> 0 Fan)
      const handCodes = ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '1p', '2p', '3p', '1s', '2s', 'west', 'west'];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));

      const actions: AvailableActions = {
        canHu: false,
        canKong: false,
        kongOptions: [],
        canPong: true,
        canChow: false,
        chowOptions: [],
        canTing: false,
        canPass: true,
      };

      const decision = MahjongAI.decideAction(
        actions,
        hand,
        [],
        'EAST',
        'SOUTH',
        [],
        createTile('west', 'called')
      );

      expect(decision).toBe('PASS'); // Preserves the only eye!
    });

    it('should PONG Guest Wind if hand has OTHER pairs (not sole eye)', () => {
      // Hand with 2 pairs: 'west' (guest wind) AND '9s' (9s pair)
      const handCodes = ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '1p', '2p', '3p', '9s', '9s', 'west', 'west'];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));

      const actions: AvailableActions = {
        canHu: false,
        canKong: false,
        kongOptions: [],
        canPong: true,
        canChow: false,
        chowOptions: [],
        canTing: false,
        canPass: true,
      };

      const decision = MahjongAI.decideAction(
        actions,
        hand,
        [],
        'EAST',
        'SOUTH',
        [],
        createTile('west', 'called')
      );

      expect(decision).toBe('PONG'); // Reduces Shanten directly!
    });

    it('should CHOW when it strictly reduces Shanten', () => {
      // 16-tile hand: 12m (partial), 456m, 789m, 123p, 55s (pair), 9p, 9s, east (2-Shanten)
      const handCodes = [
        '1m', '2m',
        '4m', '5m', '6m',
        '7m', '8m', '9m',
        '1p', '2p', '3p',
        '5s', '5s',
        '9p', '9s', 'east',
      ];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));

      const calledTile = createTile('3m', 'called');
      const actions: AvailableActions = {
        canHu: false,
        canKong: false,
        kongOptions: [],
        canPong: false,
        canChow: true,
        chowOptions: [
          {
            tiles: [hand[0], hand[1], calledTile],
            discardTileIds: [hand[0].id, hand[1].id],
          },
        ],
        canTing: false,
        canPass: true,
      };

      const decision = MahjongAI.decideAction(
        actions,
        hand,
        [],
        'EAST',
        'SOUTH',
        [],
        calledTile
      );

      expect(decision).toBe('CHOW'); // Advances hand from 2-Shanten to 1-Shanten!
    });
  });
});
