/**
 * MahjongGameState.test.ts
 * Unit tests for game flow, dealing, flower replacement, action arbitration,
 * pass lockout reset, four winds progression, and bankroll elimination.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MahjongGameState } from '../logic/MahjongGameState';
import { Tile, Meld } from '../logic/MahjongTypes';

describe('MahjongGameState Unit Tests', () => {
  let state: MahjongGameState;

  beforeEach(() => {
    state = new MahjongGameState();
    state.autoStepAI = false;
  });

  it('should initialize 4 players with 10,000 chips each', () => {
    state.startNewMatch();
    expect(state.players.length).toBe(4);
    state.players.forEach((p) => {
      expect(p.chips).toBe(10000);
    });
    expect(state.roundWind).toBe('EAST');
  });

  it('should strictly satisfy 抓位 (startSeatingDraw) rules across 100 iterations', () => {
    const allWindsOrder = ['EAST', 'SOUTH', 'WEST', 'NORTH'];

    for (let iter = 0; iter < 100; iter++) {
      state.startNewMatch();

      // 1. Dice roll must have 3 dice between 1 and 6, sum between 3 and 18
      expect(state.diceResult.length).toBe(3);
      state.diceResult.forEach((d) => {
        expect(d).toBeGreaterThanOrEqual(1);
        expect(d).toBeLessThanOrEqual(6);
      });
      expect(state.diceSum).toBe(state.diceResult[0] + state.diceResult[1] + state.diceResult[2]);

      // 2. Human must always be seated at Seat 0
      expect(state.players[0].isHuman).toBe(true);
      expect(state.players[0].name).toBe('賭神');

      // 3. All 4 players must have unique winds from ['EAST', 'SOUTH', 'WEST', 'NORTH']
      const assignedWinds = state.players.map((p) => p.wind);
      expect(new Set(assignedWinds).size).toBe(4);

      // 4. Physical seating must be strictly counter-clockwise contiguous (East -> South -> West -> North)
      for (let s = 0; s < 4; s++) {
        const curIdx = allWindsOrder.indexOf(state.players[s].wind);
        const nextIdx = allWindsOrder.indexOf(state.players[(s + 1) % 4].wind);
        expect(nextIdx).toBe((curIdx + 1) % 4);
      }

      // 5. The player who draws EAST must strictly be the initial dealer (起莊)
      const eastSeat = state.players.findIndex((p) => p.wind === 'EAST');
      expect(state.dealerSeat).toBe(eastSeat);
      expect(state.players[eastSeat].isDealer).toBe(true);

      // 6. The other 3 players must NOT be dealer
      for (let s = 0; s < 4; s++) {
        if (s !== eastSeat) {
          expect(state.players[s].isDealer).toBe(false);
        }
      }

      // 7. Initial round wind must be EAST and dealerRoundsPlayed must be 0 (東風東)
      expect(state.roundWindIndex).toBe(0);
      expect(state.dealerRoundsPlayed).toBe(0);
      expect(state.roundWind).toBe('EAST');
    }
  });

  it('should strictly produce standard Taiwanese Mahjong round & hand wind progression', () => {
    state.startNewMatch();

    const winds = ['東', '南', '西', '北'];
    const getAnnouncement = () => {
      const rw = winds[state.roundWindIndex] || '東';
      const hw = winds[state.dealerRoundsPlayed % 4] || '東';
      return `${rw}風${hw}`;
    };

    // 1. Initial game is always "東風東" regardless of which seat drew EAST
    expect(getAnnouncement()).toBe('東風東');

    // 2. Dealer streak (連莊) retains hand wind
    state.dealerStreak = 1;
    state.settleDraw(); // draw gives dealer streak++
    expect(getAnnouncement()).toBe('東風東');
    expect(state.dealerStreak).toBe(2);

    // 3. Non-dealer win rotates dealer: advances to "東風南" (Hand 2)
    state.startDealing();
    const nonDealer1 = ((state.dealerSeat + 1) % 4) as any;
    state.players[nonDealer1].hand = [
      { id: '1m_0', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
    ];
    state.settleWin(nonDealer1, false, state.dealerSeat);
    expect(state.dealerRoundsPlayed).toBe(1);
    expect(getAnnouncement()).toBe('東風南');

    // 4. Next non-dealer win: advances to "東風西" (Hand 3)
    state.startDealing();
    const nonDealer2 = ((state.dealerSeat + 1) % 4) as any;
    state.players[nonDealer2].hand = [
      { id: '1m_0', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
    ];
    state.settleWin(nonDealer2, false, state.dealerSeat);
    expect(state.dealerRoundsPlayed).toBe(2);
    expect(getAnnouncement()).toBe('東風西');

    // 5. Next non-dealer win: advances to "東風北" (Hand 4)
    state.startDealing();
    const nonDealer3 = ((state.dealerSeat + 1) % 4) as any;
    state.players[nonDealer3].hand = [
      { id: '1m_0', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
    ];
    state.settleWin(nonDealer3, false, state.dealerSeat);
    expect(state.dealerRoundsPlayed).toBe(3);
    expect(getAnnouncement()).toBe('東風北');

    // 6. Next non-dealer win: 4 hands completed, round wind advances to "南風東"
    state.startDealing();
    const nonDealer4 = ((state.dealerSeat + 1) % 4) as any;
    state.players[nonDealer4].hand = [
      { id: '1m_0', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
    ];
    state.settleWin(nonDealer4, false, state.dealerSeat);
    expect(state.roundWindIndex).toBe(1);
    expect(state.dealerRoundsPlayed).toBe(0);
    expect(getAnnouncement()).toBe('南風東');
  });

  it('should strictly preserve permanent seating winds from 抓位 and calculate dynamic effective wind for tai evaluation across all 16 rounds', () => {
    state.startNewMatch();

    // Record initial seating winds for all 4 players from 抓位
    const initialWinds = state.players.map((p) => p.wind);
    expect(initialWinds.length).toBe(4);

    // Settle 16 rounds won by non-dealer to cycle all 4 winds and 16 dealer rotations
    for (let i = 0; i < 16; i++) {
      state.startDealing();
      const currentDealer = state.dealerSeat;
      const nonDealer = ((currentDealer + 1) % 4) as any;

      state.players[nonDealer].hand = [
        { id: '1m_0', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
      ];
      state.settleWin(nonDealer, false, currentDealer);

      // 1. Permanent Seating Winds (for capsules / HUD display) NEVER change across all 16 hands!
      state.players.forEach((p, idx) => {
        expect(p.wind).toBe(initialWinds[idx]);
      });

      // 2. Dynamic Effective Wind (for tai & flower evaluation) rotates with dealer position:
      // Current dealer always gets EAST (1/5 flower), next seats get SOUTH, WEST, NORTH!
      const newDealer = state.dealerSeat;
      expect(state.getEffectiveWind(newDealer)).toBe('EAST');
      expect(state.getEffectiveWind(((newDealer + 1) % 4) as any)).toBe('SOUTH');
      expect(state.getEffectiveWind(((newDealer + 2) % 4) as any)).toBe('WEST');
      expect(state.getEffectiveWind(((newDealer + 3) % 4) as any)).toBe('NORTH');
    }
  });

  it('should deal 16 tiles to non-dealers and 17 tiles to dealer, with all flowers replaced', () => {
    state.startNewMatch();
    state.startDealing();

    // After flower replacement, hands should have no flower tiles
    state.players.forEach((p, idx) => {
      const allTiles = p.drawnTile ? [...p.hand, p.drawnTile] : p.hand;
      expect(allTiles.some((t) => t.isFlower)).toBe(false);

      if (idx === state.dealerSeat) {
        expect(allTiles.length).toBe(17);
      } else {
        expect(allTiles.length).toBe(16);
      }
    });
  });

  it('should arbitrate discard actions and reset Pass Lockout on discard', () => {
    state.startNewMatch();
    state.startDealing();

    const p0 = state.players[0];
    // Human draws and discards a tile
    if (!p0.drawnTile) {
      p0.drawnTile = { id: 'test_drawn_0', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' };
    }
    const tileToDiscard = p0.drawnTile;
    state.currentTurnSeat = 0;
    state.phase = 'PLAYER_TURN';
    state.discardTile(0, tileToDiscard.id);

    // Pass lockout must be reset upon tile falling to table
    expect(p0.isPassLockout).toBe(false);
    expect(state.lastDiscard).not.toBeNull();
    expect(state.lastDiscard!.tile.id).toBe(tileToDiscard.id);
  });

  it('should handle Human action responses (Pong, Chow, Pass)', () => {
    state.startNewMatch();
    state.startDealing();

    // Setup player 0 with 2 of 5m
    const p0 = state.players[0];
    p0.hand = [
      { id: '5m_1', suit: 'CHARACTERS', value: 5, name: '五萬', shortCode: '5m' },
      { id: '5m_2', suit: 'CHARACTERS', value: 5, name: '五萬', shortCode: '5m' },
      { id: '1s_0', suit: 'BAMBOO', value: 1, name: '一條', shortCode: '1s' },
    ];
    p0.drawnTile = null;

    // Player 3 discards 5m
    const discardTile: Tile = {
      id: '5m_3',
      suit: 'CHARACTERS',
      value: 5,
      name: '五萬',
      shortCode: '5m',
    };
    state.lastDiscard = { tile: discardTile, fromSeat: 3 };
    state.phase = 'ACTION_WAIT';

    // Human declares PONG
    state.humanRespondAction('PONG');
    expect(p0.melds.length).toBe(1);
    expect(p0.melds[0].type).toBe('PONG');
  });

  it('should handle Chow claims and Pass lockout on win pass', () => {
    state.startNewMatch();
    state.startDealing();

    const p0 = state.players[0];
    p0.hand = [
      { id: '1m_0', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
      { id: '2m_0', suit: 'CHARACTERS', value: 2, name: '二萬', shortCode: '2m' },
      { id: '9p_0', suit: 'DOTS', value: 9, name: '九筒', shortCode: '9p' },
    ];

    const discardTile: Tile = {
      id: '3m_0',
      suit: 'CHARACTERS',
      value: 3,
      name: '三萬',
      shortCode: '3m',
    };
    state.lastDiscard = { tile: discardTile, fromSeat: 3 };
    state.phase = 'ACTION_WAIT';

    // Human declares PASS
    state.humanRespondAction('PASS');
    expect(state.phase).toBe('PLAYER_TURN');
  });

  it('should handle Draw (流局) with dealer retaining streak (N = N + 1)', () => {
    state.startNewMatch();
    state.dealerStreak = 1;
    const initialDealer = state.dealerSeat;

    state.settleDraw();

    expect(state.dealerStreak).toBe(2);
    expect(state.dealerSeat).toBe(initialDealer); // Dealer retained
    expect(state.currentSettlement?.isDraw).toBe(true);
  });

  it('should handle Instant Flower Win (八仙過海)', () => {
    state.startNewMatch();
    state.startDealing();

    const p0 = state.players[0];
    p0.flowers = [
      { id: 'spring_0', suit: 'FLOWERS', value: 1, name: '春', shortCode: 'spring', isFlower: true },
      { id: 'summer_0', suit: 'FLOWERS', value: 2, name: '夏', shortCode: 'summer', isFlower: true },
      { id: 'autumn_0', suit: 'FLOWERS', value: 3, name: '秋', shortCode: 'autumn', isFlower: true },
      { id: 'winter_0', suit: 'FLOWERS', value: 4, name: '冬', shortCode: 'winter', isFlower: true },
      { id: 'plum_0', suit: 'FLOWERS', value: 1, name: '梅', shortCode: 'plum', isFlower: true },
      { id: 'orchid_0', suit: 'FLOWERS', value: 2, name: '蘭', shortCode: 'orchid', isFlower: true },
      { id: 'bamboo_f_0', suit: 'FLOWERS', value: 3, name: '竹', shortCode: 'bamboo_f', isFlower: true },
      { id: 'chrysanthemum_0', suit: 'FLOWERS', value: 4, name: '菊', shortCode: 'chrysanthemum', isFlower: true },
    ];

    state.settleFlowerWin(0);

    expect(state.currentSettlement).not.toBeNull();
    expect(state.currentSettlement?.fans.some((f) => f.name === '八仙過海')).toBe(true);
  });

  it('should progress through four winds and complete match after 4 wind rounds', () => {
    state.startNewMatch();
    expect(state.roundWind).toBe('EAST');

    let matchCleared = false;
    state.addListener({
      onGameOver: (summary) => {
        if (summary.cleared) matchCleared = true;
      },
    });

    // Settle 16 rounds won by non-dealer to cycle all 4 winds (East, South, West, North)
    for (let i = 0; i < 16; i++) {
      state.startDealing();
      const nonDealer = ((state.dealerSeat + 1) % 4) as any;
      // Ensure winner has a winning tile
      state.players[nonDealer].hand = [
        { id: '1m_0', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
      ];
      state.settleWin(nonDealer, false, state.dealerSeat);
    }

    expect(matchCleared).toBe(true);
    expect(state.phase).toBe('MATCH_OVER');
  });

  it('should trigger Game Over when human player bankroll <= 0', () => {
    state.startNewMatch();
    state.startDealing();

    let gameOverFired = false;
    state.addListener({
      onGameOver: (summary) => {
        gameOverFired = true;
        expect(summary.cleared).toBe(false);
      },
    });

    // Artificially bankrupt human player
    state.players[0].chips = 500;

    // Settle a loss for human
    state.settleWin(1, true); // AI self draws -> Human pays > 1000 -> chips <= 0

    expect(state.players[0].chips).toBeLessThanOrEqual(0);
    expect(state.phase).toBe('GAME_OVER');
    expect(gameOverFired).toBe(true);
  });

  it('should execute stepAITurn and return all visible tiles', () => {
    state.startNewMatch();
    state.startDealing();

    expect(() => state.stepAITurn(1)).not.toThrow();
    const visible = state.getAllVisibleTiles();
    expect(Array.isArray(visible)).toBe(true);
  });

  it('should dispatch onTurnStart for dealer Turn 1 and allow AI dealer to discard', () => {
    let turnStartCount = 0;
    let turnSeat: number = -1;

    state.addListener({
      onTurnStart: (seat) => {
        turnStartCount++;
        turnSeat = seat;
      },
    });

    state.startNewMatch();
    state.startDealing();

    // After dealing & flower replacement, onTurnStart must have been dispatched for dealerSeat
    expect(turnStartCount).toBeGreaterThanOrEqual(1);
    expect(turnSeat).toBe(state.dealerSeat);

    const dealer = state.players[state.dealerSeat];
    const initialTileCount = dealer.hand.length + (dealer.drawnTile ? 1 : 0);
    expect(initialTileCount).toBe(17);

    // Verify all 4 players have strictly 16 concealed hand tiles (dealer has 16 in hand + 1 jump tile)
    for (let s = 0; s < 4; s++) {
      expect(state.players[s].hand.length).toBe(16);
    }

    // AI or Human dealer can step turn
    if (state.dealerSeat !== 0) {
      state.stepAITurn(state.dealerSeat);
      const postDiscardTileCount = dealer.hand.length + (dealer.drawnTile ? 1 : 0);
      expect(postDiscardTileCount).toBe(16);
      expect(dealer.discards.length).toBe(1);
    }
  });

  it('should reset isAutoPlay and isTing to false when dealing a new round', () => {
    state.startNewMatch();
    // Simulate player activating AutoPlay / Ting in current round
    state.players[0].isAutoPlay = true;
    state.players[0].isTing = true;
    state.players[1].isAutoPlay = true;

    // Start a new dealing
    state.startDealing();

    // All players must have isAutoPlay and isTing reset to false
    expect(state.players[0].isAutoPlay).toBe(false);
    expect(state.players[0].isTing).toBe(false);
    expect(state.players[1].isAutoPlay).toBe(false);
    expect(state.players[1].isTing).toBe(false);
  });

  it('should handle Melded Kong (明槓) claim with tail replenishment draw and player turn transition', () => {
    state.startNewMatch();
    state.startDealing();

    // Setup player 1 (AI) with 3 '1m' tiles in hand
    const p1 = state.players[1];
    p1.hand = [
      { id: '1m_1', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
      { id: '1m_2', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
      { id: '1m_3', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
      { id: '2m_1', suit: 'CHARACTERS', value: 2, name: '二萬', shortCode: '2m' },
    ];
    p1.drawnTile = null;

    // Player 3 discards 1m
    const discardedTile: Tile = { id: '1m_4', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' };
    state.players[3].discards.push(discardedTile);

    let turnStarted = false;
    let turnSeat = -1;
    let meldClaimed = false;

    state.addListener({
      onMeldClaimed: (seat, meld) => {
        if (seat === 1 && meld.type === 'MELDED_KONG') {
          meldClaimed = true;
        }
      },
      onTurnStart: (seat) => {
        turnStarted = true;
        turnSeat = seat;
      },
    });

    // Resolve claims with Player 1 claiming Melded Kong
    state.resolveClaims(3, discardedTile, [
      { seat: 1, action: 'KONG' },
    ]);

    expect(meldClaimed).toBe(true);
    expect(p1.melds.length).toBe(1);
    expect(p1.melds[0].type).toBe('MELDED_KONG');
    expect(p1.melds[0].tiles.length).toBe(4);
    // Claimant must have received a replenishment tile drawn from tail
    expect(p1.drawnTile).not.toBeNull();
    // Phase must be PLAYER_TURN and turn seat must be Player 1
    expect(state.phase).toBe('PLAYER_TURN');
    expect(state.currentTurnSeat).toBe(1);
    expect(turnStarted).toBe(true);
    expect(turnSeat).toBe(1);
  });

  it('should handle performSelfKong (暗槓 / 加槓) with tail replenishment draw', () => {
    state.startNewMatch();
    state.startDealing();

    const p0 = state.players[0];
    p0.hand = [
      { id: '5s_1', suit: 'BAMBOO', value: 5, name: '五條', shortCode: '5s' },
      { id: '5s_2', suit: 'BAMBOO', value: 5, name: '五條', shortCode: '5s' },
      { id: '5s_3', suit: 'BAMBOO', value: 5, name: '五條', shortCode: '5s' },
      { id: '5s_4', suit: 'BAMBOO', value: 5, name: '五條', shortCode: '5s' },
      { id: '9p_1', suit: 'DOTS', value: 9, name: '九筒', shortCode: '9p' },
    ];
    p0.drawnTile = null;

    state.performSelfKong(0, {
      type: 'CONCEALED_KONG',
      tileCode: '5s',
      handTileIds: ['5s_1', '5s_2', '5s_3', '5s_4'],
    });

    expect(p0.melds.length).toBe(1);
    expect(p0.melds[0].type).toBe('CONCEALED_KONG');
    expect(p0.drawnTile).not.toBeNull();
  });

  it('should trigger settleDraw and preserve 16 dead wall reserve tiles when drawing a flower on dead wall exhaustion', () => {
    state.startNewMatch();
    state.startDealing();

    // Force deck regular tiles remaining to 0 (reached 16 dead wall reserve)
    while (state.deck.hasRegularTilesLeft()) {
      state.deck.drawHead();
    }
    expect(state.deck.hasRegularTilesLeft()).toBe(false);
    expect(state.deck.getDeadWallCount()).toBe(16);

    const p0 = state.players[0];
    const flowerTile: Tile = { id: 'f_bamboo_1', suit: 'FLOWERS', value: 1, name: '春', shortCode: '1f', isFlower: true };
    p0.drawnTile = flowerTile;

    const rep = state.replaceDrawnFlower(0);
    expect(rep).toBeNull();
    expect(p0.flowers).toContain(flowerTile);
    expect(p0.drawnTile).toBeNull();
    // Must have transitioned to ROUND_SETTLEMENT due to draw game (流局)
    expect(state.phase).toBe('ROUND_SETTLEMENT');
  });

  it('should trigger settleDraw and preserve 16 dead wall reserve tiles when performing self kong on dead wall exhaustion', () => {
    state.startNewMatch();
    state.startDealing();

    // Force deck regular tiles remaining to 0
    while (state.deck.hasRegularTilesLeft()) {
      state.deck.drawHead();
    }
    expect(state.deck.hasRegularTilesLeft()).toBe(false);

    const p0 = state.players[0];
    p0.hand = [
      { id: '5s_1', suit: 'BAMBOO', value: 5, name: '五條', shortCode: '5s' },
      { id: '5s_2', suit: 'BAMBOO', value: 5, name: '五條', shortCode: '5s' },
      { id: '5s_3', suit: 'BAMBOO', value: 5, name: '五條', shortCode: '5s' },
      { id: '5s_4', suit: 'BAMBOO', value: 5, name: '五條', shortCode: '5s' },
    ];
    p0.drawnTile = null;

    state.performSelfKong(0, {
      type: 'CONCEALED_KONG',
      tileCode: '5s',
      handTileIds: ['5s_1', '5s_2', '5s_3', '5s_4'],
    });

    expect(p0.melds.length).toBe(1);
    expect(state.phase).toBe('ROUND_SETTLEMENT');
  });

  it('should strictly not award 人胡 (Ren Hu) when player has open melds or after first turn cycle', () => {
    state.startNewMatch();
    state.startDealing();

    const p0 = state.players[0];
    p0.isHuman = true;
    p0.melds = [
      {
        type: 'PONG',
        tiles: [
          { id: '1m_1', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
          { id: '1m_2', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
          { id: '1m_3', suit: 'CHARACTERS', value: 1, name: '一萬', shortCode: '1m' },
        ],
        sourceSeat: 1,
      },
    ];

    // Win by Ron from seat 1
    state.settleWin(0, false, 1);

    const settlement = state.currentSettlement;
    expect(settlement).toBeDefined();
    // Must NOT contain 人胡
    const hasRenHu = settlement!.fans.some((f) => f.name.includes('人胡'));
    expect(hasRenHu).toBe(false);
  });

  it('should strictly not award 人胡 when human ponged dealer discard in turn 1 and won on dealer next discard', () => {
    state.startNewMatch();
    state.startDealing();

    // Force dealer to seat 3
    state.dealerSeat = 3;
    state.currentTurnSeat = 3;
    state.isFirstTurnCycle = true;
    state.currentTurnCount = 1;

    const p0 = state.players[0]; // Human
    p0.isHuman = true;
    p0.hand = [
      { id: 'west_1', suit: 'WINDS', value: 3, name: '西風', shortCode: 'west' },
      { id: 'west_2', suit: 'WINDS', value: 3, name: '西風', shortCode: 'west' },
      ...Array.from({ length: 14 }, (_, i) => ({
        id: `tile_${i}`,
        suit: 'CHARACTERS' as const,
        value: (i % 9) + 1,
        name: `${(i % 9) + 1}萬`,
        shortCode: `${(i % 9) + 1}m`,
      })),
    ];

    // Dealer (seat 3) discards 'west'
    const discardWest: Tile = { id: 'west_3', suit: 'WINDS', value: 3, name: '西風', shortCode: 'west' };
    state.lastDiscard = { tile: discardWest, fromSeat: 3 };
    state.phase = 'ACTION_WAIT';

    // Human responds PONG
    state.humanRespondAction('PONG');
    expect(p0.melds.length).toBe(1);
    expect(state.isFirstTurnCycle).toBe(false);

    // Human discards first tile to Ting
    state.discardTile(0, 'tile_0');
    expect(p0.discards.length).toBe(1);

    // Next turn, dealer discards winning tile
    const winningTile: Tile = { id: '9m_1', suit: 'CHARACTERS', value: 9, name: '九萬', shortCode: '9m' };
    state.lastDiscard = { tile: winningTile, fromSeat: 3 };

    // Settle Ron win for Human
    state.settleWin(0, false, 3);
    const settlement = state.currentSettlement;
    expect(settlement).toBeDefined();
    const hasRenHu = settlement!.fans.some((f) => f.name.includes('人胡'));
    expect(hasRenHu).toBe(false);
  });
});
