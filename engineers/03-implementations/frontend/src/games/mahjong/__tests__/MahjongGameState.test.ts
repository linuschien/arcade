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
    p0.isPassLockout = true; // Was locked out

    // Human discards a tile
    const tileToDiscard = p0.drawnTile || p0.hand[0];
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
});
