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

  describe('Discard Selection (Attack & Defense Mode)', () => {
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
      // 2-Shanten hand: 345m (meld 1), 1p (floating), 9s, 8p (floating)
      // Wall remaining = 8 tiles -> M = 2 <= S (2), mathematically hopeless -> triggers defense mode!
      const hand = [
        createTile('3m', '1'),
        createTile('4m', '1'),
        createTile('5m', '1'),
        createTile('1p', '1'),
        createTile('8p', '1'),
        createTile('9s', '1'),
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
        ],
        flowers: [],
        discards: [createTile('1p', 'd1'), createTile('9s', 'd2')], // 1p is Genbutsu!
        isTing: true,
        isAutoPlay: false,
        isPassLockout: false,
        passPongCodesInTurn: new Set(),
      };

      // Remaining wall = 8 tiles (M = 2 draws <= S=2) -> triggers defense mode
      const safest = MahjongAI.chooseBestDiscard(hand, [], [], [opponent], 8);
      expect(safest.shortCode).toBe('1p'); // Genbutsu 100% safe
    });

    it('should prioritize Dead Honors (絕張字牌) when in defense mode and no Genbutsu exists', () => {
      // Hand has dangerous middle tile 5m (danger score 70) and Dead Dragon 'white' (3 visible -> danger score 5)
      // 2-Shanten hand, wall = 8 tiles (M = 2 <= S=2) -> defense mode
      const hand = [
        createTile('5m', '1'),
        createTile('white', '1'),
        createTile('1m', '1'),
        createTile('2m', '1'),
        createTile('3m', '1'),
        createTile('9s', '1'),
      ];

      const opponent: PlayerProfile = {
        seat: 1,
        name: '賭俠',
        isHuman: false,
        wind: 'SOUTH',
        isDealer: false,
        chips: 10000,
        hand: [],
        drawnTile: null,
        melds: [{ type: 'PONG', tiles: [], sourceSeat: 2 }],
        flowers: [],
        discards: [createTile('3s', 'd1'), createTile('4s', 'd2')], // No Genbutsu for 5m or white
        isTing: true,
        isAutoPlay: false,
        isPassLockout: false,
        passPongCodesInTurn: new Set(),
      };

      const allVisible = [
        createTile('white', 'v1'),
        createTile('white', 'v2'),
        createTile('white', 'v3'),
      ];

      const safest = MahjongAI.chooseBestDiscard(hand, [], allVisible, [opponent], 8);
      // 'white' is a Dead Honor (3 visible copies, danger 5) vs 5m (danger 70)
      expect(safest.shortCode).toBe('white');
    });

    it('should recognize dead honor when 2 copies are visible on table and 2 copies are held in hand', () => {
      // Hand contains 2 copies of 'east' (東風) and 1 copy of dangerous '5p'
      const hand = [
        createTile('east', '1'),
        createTile('east', '2'),
        createTile('5p', '1'),
        createTile('2m', '1'),
        createTile('3m', '1'),
        createTile('7s', '1'),
      ];

      const opponent: PlayerProfile = {
        seat: 1,
        name: '高進',
        isHuman: false,
        wind: 'SOUTH',
        isDealer: false,
        chips: 10000,
        hand: [],
        drawnTile: null,
        melds: [{ type: 'PONG', tiles: [], sourceSeat: 2 }],
        flowers: [],
        discards: [createTile('3s', 'd1')],
        isTing: true,
        isAutoPlay: false,
        isPassLockout: false,
        passPongCodesInTurn: new Set(),
      };

      // 2 copies of 'east' are visible on table
      const allVisible = [
        createTile('east', 'v1'),
        createTile('east', 'v2'),
      ];

      // Total 2 on table + 2 in hand = 4 copies accounted for -> 'east' is 100% Dead Honor!
      const safest = MahjongAI.chooseBestDiscard(hand, [], allVisible, [opponent], 8);
      expect(safest.shortCode).toBe('east');
    });

    it('should prioritize Suji (筋牌) in defense mode when no Genbutsu or dead honors exist', () => {
      // Opponent discarded 4m in river -> 1m is Suji of 4m (danger score 30 - 20 = 10)
      // Hand contains 1m (Suji, danger 10) and 5p (dangerous middle tile, danger 70)
      // 2-Shanten hand, wall = 8 tiles (M = 2 <= S=2) -> defense mode
      const hand = [
        createTile('1m', '1'),
        createTile('5p', '1'),
        createTile('2m', '1'),
        createTile('3m', '1'),
        createTile('7s', '1'),
        createTile('8s', '1'),
      ];

      const opponent: PlayerProfile = {
        seat: 1,
        name: '高進',
        isHuman: false,
        wind: 'SOUTH',
        isDealer: false,
        chips: 10000,
        hand: [],
        drawnTile: null,
        melds: [{ type: 'CHOW', tiles: [], sourceSeat: 0 }],
        flowers: [],
        discards: [createTile('4m', 'd1')], // 4m discarded -> makes 1m Suji!
        isTing: true,
        isAutoPlay: false,
        isPassLockout: false,
        passPongCodesInTurn: new Set(),
      };

      const safest = MahjongAI.chooseBestDiscard(hand, [], [], [opponent], 8);
      expect(safest.shortCode).toBe('1m'); // 1m (Suji danger 10) is much safer than 5p (danger 70)
    });

    it('should choose discard that advances Eight Pairs (嚦咕嚦咕 / 8對半) to 0-Shanten Ting', () => {
      // 17-tile hand: 7 pairs (14 tiles) + 3 singles (8m, 1p, east)
      const handCodes = [
        '1m', '1m',
        '2m', '2m',
        '3m', '3m',
        '4m', '4m',
        '5m', '5m',
        '6m', '6m',
        '7m', '7m',
        '8m', '1p', 'east',
      ];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));

      const best = MahjongAI.chooseBestDiscard(hand, [], [], [], 40);
      // Must discard one of the 3 single tiles (8m, 1p, east) to reach 0-Shanten Eight Pairs Ting
      expect(['8m', '1p', 'east']).toContain(best.shortCode);
    });
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

    it('should prefer discard that yields multi-way live wait with more remaining winning tiles', () => {
      // 17-tile hand: 123m, 456m, 789m, 123p (4 complete melds = 12 tiles) + 3s, 4s, 5s, 6s, 9p (5 tiles)
      // Discard Option A: Discard 9p -> leaves 3456s (2-way wait on 3s and 6s: 6 live remaining tiles)
      // Discard Option B: Discard 3s -> leaves 456s + 9p (1-way single wait on 9p: only 3 live remaining tiles)
      // Discard Option C: Discard 6s -> leaves 345s + 9p (1-way single wait on 9p: only 3 live remaining tiles)
      // Both options yield 0-Shanten Ting! AI must choose 9p to maximize live winning count!
      const handCodes = [
        '1m', '2m', '3m',
        '4m', '5m', '6m',
        '7m', '8m', '9m',
        '1p', '2p', '3p',
        '3s', '4s', '5s', '6s',
        '9p',
      ];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));

      const best = MahjongAI.chooseBestDiscard(hand, [], [], [], 40);
      expect(best.shortCode).toBe('9p'); // Discard 9p to Ting on 3s & 6s (2-way wait)!
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

    it('should ALLOW Added Kong (加槓) when it maintains Ting and does not reduce winning tiles count', () => {
      // Open Pong: 333m (3 tiles)
      // Concealed 13 tiles in 0-Shanten waiting on 9s: 123p, 456p, 789p, 123s, 9s (13 tiles)
      // Drawn 14th tile is the 4th 3m.
      const handCodes = ['1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '1s', '2s', '3s', '9s', '3m'];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));
      const openMelds: Meld[] = [
        {
          type: 'PONG',
          tiles: [createTile('3m', 'p1'), createTile('3m', 'p2'), createTile('3m', 'p3')],
          sourceSeat: 1,
        },
      ];

      const kong: KongOption = {
        type: 'ADDED_KONG',
        tileCode: '3m',
        handTileIds: [hand[hand.length - 1].id],
        meldIndex: 0,
      };

      const isBeneficial = MahjongAI.isKongBeneficial(kong, hand, openMelds);
      expect(isBeneficial).toBe(true);

      const chosenKong = MahjongAI.decideSelfKong([kong], hand, openMelds);
      expect(chosenKong).toEqual(kong);
    });

    it('should REJECT Added Kong when it breaks Ting (destroys 567m meld and regresses to 1-Shanten)', () => {
      // Exactly 4 copies of 5m in existence: 3 in open Pong meld + 1 in hand!
      // Open Pong: 555m (3 tiles)
      // Concealed hand in 0-Shanten: 123p (3), 456p (3), 789p (3), 5m, 6m, 7m (3: forms 567m meld), 9s (eye wait = 1), 1s (drawn = 1) = 14 tiles
      // Without kong: AI discards 1s, leaving 4 sequence melds + 555m pong meld + 9s -> in 0-Shanten Ting (waiting on 9s)!
      // If Added Kong on 5m is executed:
      // Concealed hand becomes: 123p, 456p, 789p, 67m, 9s -> loses 567m meld and drops to 1-Shanten!
      // AI must REJECT Added Kong to preserve Ting!
      const handCodes = ['1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p', '5m', '6m', '7m', '9s', '1s'];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));
      const openMelds: Meld[] = [
        {
          type: 'PONG',
          tiles: [createTile('5m', 'p1'), createTile('5m', 'p2'), createTile('5m', 'p3')],
          sourceSeat: 1,
        },
      ];

      const kong: KongOption = {
        type: 'ADDED_KONG',
        tileCode: '5m',
        handTileIds: [hand.find((t) => t.shortCode === '5m')!.id],
        meldIndex: 0,
      };

      const isBeneficial = MahjongAI.isKongBeneficial(kong, hand, openMelds);
      expect(isBeneficial).toBe(false);
      expect(MahjongAI.decideSelfKong([kong], hand, openMelds)).toBeNull();
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

    it('should PASS on Dragon tile if AI already holds 3 copies (concealed triplet)', () => {
      // Hand with 3x 'red' (concealed triplet of Red Dragon)
      const handCodes = ['1m', '2m', '3m', '4m', '5m', '6m', '7m', '8m', '9m', '1p', '2p', '3p', '1s', 'red', 'red', 'red'];
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

      // AI keeps the concealed triplet intact, does not Pong!
      expect(decision).toBe('PASS');
    });

    it('should PASS on Guest Wind (無台字牌) if it is the SOLE eye in hand', () => {
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

    it('should PASS on Number Tile Pong if Shanten is not strictly reduced', () => {
      // 16-tile hand in 1-Shanten: 123m (1), 456m (2), 789m (3) = 9 tiles.
      // 23p (partial), 56s (partial), 9p (single), 2s, 2s (pair / eyes) = 7 tiles.
      // Total = 16 tiles (3 complete melds + 2 partials + 1 pair + 1 single = 1-Shanten).
      // Discard is 2s.
      // If Pong 2s -> consumes the only pair 22s into 222s, leaving 23p, 56s, 9p (no pair).
      // Post-pong hand is still 1-Shanten!
      // AI chooses PASS to preserve eyes and avoid unnecessary open hand without Shanten gain!
      const handCodes = [
        '1m', '2m', '3m',
        '4m', '5m', '6m',
        '7m', '8m', '9m',
        '2p', '3p',
        '5s', '6s',
        '9p',
        '2s', '2s',
      ];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));
      const calledTile = createTile('2s', 'called');

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
        calledTile
      );

      expect(decision).toBe('PASS'); // 1-Shanten to 1-Shanten -> PASS!
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

    it('should CHOW on 2345s shape when 1s is discarded to generate 45s partial and reduce Shanten', () => {
      // 16-tile hand in 2-Shanten: 123m (1), 456m (2), 789m (3), 2345s (1 meld + 5s single), 9p, 8s, east (3 singles)
      // Current Shanten = (5 - 4) * 2 - 0 - 0 = 2 (2-Shanten)
      // Upper player discards 1s. Chow option: 123s (uses 2s, 3s from hand).
      // Post-hand has: 123m, 456m, 789m, 45s (new partial meld!), 9p, 8s, east + open meld 123s
      // Post-shanten = (5 - 4) * 2 - 1 - 0 = 1 (1-Shanten!).
      // Shanten strictly decreases from 2 to 1 -> AI executes CHOW!
      const handCodes = [
        '1m', '2m', '3m',
        '4m', '5m', '6m',
        '7m', '8m', '9m',
        '2s', '3s', '4s', '5s',
        '9p', '8s', 'east',
      ];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));

      const calledTile = createTile('1s', 'called');
      const actions: AvailableActions = {
        canHu: false,
        canKong: false,
        kongOptions: [],
        canPong: false,
        canChow: true,
        chowOptions: [
          {
            tiles: [calledTile, hand[9], hand[10]], // 1s, 2s, 3s
            discardTileIds: [hand[9].id, hand[10].id],
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

    it('should PASS on Chow if Shanten is not strictly reduced', () => {
      // 16-tile hand in 2-Shanten: 123m (1), 456m (2), 789m (3), 234p (4), 9p, 5s, 8s, east (4 singles)
      // Current Shanten = (5 - 4) * 2 - 0 - 0 = 2 (2-Shanten).
      // Upper player discards 1p. Chow option is 123p (using 2p, 3p from hand, which breaks 234p and leaves 4p as single).
      // If AI chows 1p -> Post-hand has 123m, 456m, 789m, 4p, 9p, 5s, 8s, east + open meld 123p (still 4 complete melds, still 2-Shanten!).
      // Shanten does not decrease (2 is not < 2) -> AI PASSes!
      const handCodes = [
        '1m', '2m', '3m',
        '4m', '5m', '6m',
        '7m', '8m', '9m',
        '2p', '3p', '4p',
        '9p', '5s', '8s', 'east',
      ];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));
      const calledTile = createTile('1p', 'called');

      const actions: AvailableActions = {
        canHu: false,
        canKong: false,
        kongOptions: [],
        canPong: false,
        canChow: true,
        chowOptions: [
          {
            tiles: [calledTile, hand[9], hand[10]], // 1p, 2p, 3p
            discardTileIds: [hand[9].id, hand[10].id],
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

      expect(decision).toBe('PASS');
    });
  });

  describe('Flower Tile Discard Protection', () => {
    it('should never select a flower tile as best discard when hand contains flower tiles', () => {
      const normalTiles = [
        '1m', '2m', '3m',
        '4m', '5m', '6m',
        '7m', '8m', '9m',
        '1p', '2p', '3p',
        '5s', '5s', '5s',
        '9s',
      ].map((c, i) => createTile(c, `${i}`));

      const flowerTile: Tile = {
        id: 'f_spring_0',
        suit: 'FLOWERS',
        value: 1,
        name: '春',
        shortCode: 'f_spring',
        isFlower: true,
      };

      const handWithFlower = [...normalTiles, flowerTile];
      const best = MahjongAI.chooseBestDiscard(handWithFlower, [], [], [], 40);

      expect(best.isFlower).toBeFalsy();
      expect(best.id).not.toBe('f_spring_0');
    });

    it('should never select a flower tile in defense mode (chooseSafestDiscard)', () => {
      const normalTiles = [
        '1m', '2m', '3m',
        '4m', '5m', '6m',
        '7m', '8m', '9m',
        '1p', '2p', '3p',
        '5s', '5s', '5s',
        '9s',
      ].map((c, i) => createTile(c, `${i}`));

      const flowerTile: Tile = {
        id: 'f_summer_0',
        suit: 'FLOWERS',
        value: 2,
        name: '夏',
        shortCode: 'f_summer',
        isFlower: true,
      };

      const handWithFlower = [...normalTiles, flowerTile];
      // Remaining walls = 0 forces defense mode
      const safest = MahjongAI.chooseBestDiscard(handWithFlower, [], [], [], 0);

      expect(safest.isFlower).toBeFalsy();
      expect(safest.id).not.toBe('f_summer_0');
    });

    it('should trigger defense mode and discard safest tile when all Ting options are 0-tile dead waits', () => {
      // 16-tile hand:
      // 123m, 456m, 789m, 123p (4 melds = 12 tiles) + 55s (eye) + 8m (single) + 9s (single) = 16 tiles
      // If discard 8m -> Ting on single 9s (0 live outs outside).
      // If discard 9s -> Ting on single 8m (0 live outs outside).
      // All Ting options have 0 outs -> triggers shouldDefend and selects safest dead tile (8m).
      const handCodes = [
        '1m', '2m', '3m',
        '4m', '5m', '6m',
        '7m', '8m', '9m',
        '1p', '2p', '3p',
        '5s', '5s',
        '8m',
        '9s',
      ];
      const hand = handCodes.map((c, i) => createTile(c, `${i}`));

      // 3 copies of 9s and 3 copies of 8m are visible on table (meaning 0 copies left outside)
      const allVisible = [
        createTile('9s', 'v1'),
        createTile('9s', 'v2'),
        createTile('9s', 'v3'),
        createTile('8m', 'v1'),
        createTile('8m', 'v2'),
        createTile('8m', 'v3'),
      ];

      const best = MahjongAI.chooseBestDiscard(hand, [], allVisible, [], 40);
      // AI must safely discard 8m (safe dead terminal) under dead Ting defense
      expect(best.shortCode).toBe('8m');
    });
  });
});

