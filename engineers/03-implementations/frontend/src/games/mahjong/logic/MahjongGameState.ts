/**
 * MahjongGameState.ts
 * Master State Machine for Taiwanese 16-Tile Mahjong.
 * Coordinates 144-tile deck, seating draw, dice roll, dealing, multi-round flower replacement,
 * turn cycles, action arbitration (Hu > Pong/Kong > Chow), pass lockout lifecycle,
 * bankroll elimination, and 4-wind match progression.
 */

import {
  Tile,
  Meld,
  SeatWind,
  PlayerSeat,
  PlayerProfile,
  GamePhase,
  AvailableActions,
  SettlementBreakdown,
  ChowOption,
  KongOption,
  SeatingDrawDetails,
  SeatingDrawPlayerInfo,
} from './MahjongTypes';
import { MahjongDeck } from './MahjongDeck';
import { MahjongHandEvaluator } from './MahjongHandEvaluator';
import { MahjongScoreCalculator } from './MahjongScoreCalculator';
import { MahjongAI } from './MahjongAI';

export interface GameStateListener {
  onPhaseChange?: (phase: GamePhase) => void;
  onDealingStep?: (seat: PlayerSeat, tile: Tile) => void;
  onFlowerReplaced?: (seat: PlayerSeat, flower: Tile, replacement: Tile) => void;
  onTurnStart?: (seat: PlayerSeat, drawnTile: Tile | null) => void;
  onTileDiscarded?: (seat: PlayerSeat, tile: Tile) => void;
  onMeldClaimed?: (seat: PlayerSeat, meld: Meld) => void;
  onSettlement?: (breakdown: SettlementBreakdown) => void;
  onGameOver?: (summary: { score: number; cleared: boolean; reason: string }) => void;
}

export class MahjongGameState {
  public phase: GamePhase = 'SEATING_DRAW';
  public roundWind: SeatWind = 'EAST';
  public dealerSeat: PlayerSeat = 0;
  public dealerStreak: number = 0; // N (連 N 拉 N)
  public currentTurnSeat: PlayerSeat = 0;

  public deck: MahjongDeck = new MahjongDeck();
  public players: PlayerProfile[] = [];

  public lastDiscard: {
    tile: Tile;
    fromSeat: PlayerSeat;
  } | null = null;

  public lastDiscardTurnIndex: number = 0;
  public currentTurnCount: number = 0;
  public continuousSameTileDiscard: { code: string; safeSeats: Set<PlayerSeat> } | null = null;

  public diceResult: number[] = [1, 1, 1];
  public diceSum: number = 3;

  public roundWindIndex: number = 0; // 0=East, 1=South, 2=West, 3=North
  public dealerRoundsPlayed: number = 0;

  public isFirstTurnCycle: boolean = true;
  public currentSettlement: SettlementBreakdown | null = null;
  public seatingDrawDetails: SeatingDrawDetails | null = null;
  public autoStepAI: boolean = true;

  private listeners: GameStateListener[] = [];

  constructor() {
    this.initPlayers();
  }

  public addListener(listener: GameStateListener): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: GameStateListener): void {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private initPlayers(): void {
    const names = ['賭神', '賭俠小刀', '賭聖阿星', '賭霸有喜'];
    const winds: SeatWind[] = ['EAST', 'SOUTH', 'WEST', 'NORTH'];

    this.players = [];
    for (let i = 0; i < 4; i++) {
      this.players.push({
        seat: i as PlayerSeat,
        name: names[i],
        isHuman: i === 0,
        wind: winds[i],
        isDealer: i === 0,
        chips: 10000,
        hand: [],
        drawnTile: null,
        melds: [],
        flowers: [],
        discards: [],
        isTing: false,
        isAutoPlay: false,
        isPassLockout: false,
        passPongCodesInTurn: new Set(),
      });
    }
  }

  /**
   * Starts a new match (一將).
   */
  public startNewMatch(): void {
    this.roundWindIndex = 0;
    this.roundWind = 'EAST';
    this.dealerSeat = 0;
    this.dealerStreak = 0;
    this.dealerRoundsPlayed = 0;

    this.initPlayers();
    this.startSeatingDraw();
  }

  /**
   * Phase 1: 搬風抓位 (Seating Draw).
   * 1. 蓋著洗勻東、南、西、北四張風牌。
   * 2. 擲 3 顆骰子決定開抓方位，四位角色依序各抽一張風牌。
   * 3. 真人玩家（賭神）固定於螢幕正下方（Seat 0），依抽到的風位動態賦予門風。
   * 4. 依照麻將物理座次（東->南->西->北逆時針依序為本家->下家->對家->上家），
   *    將抽到對應風位的 AI 角色（賭俠、賭聖、賭霸）安排入座於 Seat 1（下家）、Seat 2（對家）、Seat 3（上家）。
   * 5. 抽到東風者為第一圈第一盤之起莊（dealerSeat）。
   */
  public startSeatingDraw(): void {
    // 1. 擲 3 顆骰子決定抓位起抽順序 (隨機生成並優先寫入 state)
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    this.diceResult = [d1, d2, d3];
    this.diceSum = d1 + d2 + d3;

    this.phase = 'SEATING_DRAW';

    // 2. 蓋著洗勻四張風牌 (東、南、西、北)
    const windPool: SeatWind[] = ['EAST', 'SOUTH', 'WEST', 'NORTH'];
    for (let i = windPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [windPool[i], windPool[j]] = [windPool[j], windPool[i]];
    }

    // 3. 四位角色按起抽順序各抽一張洗勻的風牌
    const firstDrawer = (this.diceSum - 1) % 4;
    const characters = [
      { name: '賭神', isHuman: true },
      { name: '賭俠小刀', isHuman: false },
      { name: '賭聖阿星', isHuman: false },
      { name: '賭霸有喜', isHuman: false },
    ];

    const drawnResults: { name: string; isHuman: boolean; wind: SeatWind }[] = [];
    for (let i = 0; i < 4; i++) {
      const charIndex = (firstDrawer + i) % 4;
      drawnResults.push({
        name: characters[charIndex].name,
        isHuman: characters[charIndex].isHuman,
        wind: windPool[i],
      });
    }

    // 4. 第一人稱視角映射：
    // 賭神必定坐在 Seat 0 (螢幕下方)，門風由其抽到的風牌決定
    const humanResult = drawnResults.find((r) => r.isHuman)!;
    const allWindsOrder: SeatWind[] = ['EAST', 'SOUTH', 'WEST', 'NORTH'];
    const humanWindIdx = allWindsOrder.indexOf(humanResult.wind);

    // 四個座位（0=下/真人, 1=右/下家, 2=上/對家, 3=左/上家）的門風按麻將逆時針規律依序排列
    const seatWinds: SeatWind[] = [
      allWindsOrder[humanWindIdx], // Seat 0 (賭神)
      allWindsOrder[(humanWindIdx + 1) % 4], // Seat 1 (下家)
      allWindsOrder[(humanWindIdx + 2) % 4], // Seat 2 (對家)
      allWindsOrder[(humanWindIdx + 3) % 4], // Seat 3 (上家)
    ];

    // 將抽到對應風位之角色分派至對應座位
    const aiResults = drawnResults.filter((r) => !r.isHuman);
    for (let s = 0; s < 4; s++) {
      const targetWind = seatWinds[s];
      if (s === 0) {
        this.players[0].name = humanResult.name;
        this.players[0].isHuman = true;
        this.players[0].wind = targetWind;
      } else {
        const matchingAI = aiResults.find((r) => r.wind === targetWind)!;
        this.players[s].name = matchingAI.name;
        this.players[s].isHuman = false;
        this.players[s].wind = targetWind;
      }

      if (targetWind === 'EAST') {
        this.dealerSeat = s as PlayerSeat;
        this.players[s].isDealer = true;
      } else {
        this.players[s].isDealer = false;
      }
    }

    // 5. 紀錄抓位完整過程細節，供前端動畫演繹
    const seatingPlayers: SeatingDrawPlayerInfo[] = characters.map((c, initIdx) => {
      const drawn = drawnResults.find((r) => r.name === c.name)!;
      const finalSeat = seatWinds.indexOf(drawn.wind) as PlayerSeat;
      return {
        name: c.name,
        isHuman: c.isHuman,
        initialPosIndex: initIdx,
        drawnWind: drawn.wind,
        finalSeat,
        isDealer: drawn.wind === 'EAST',
      };
    });

    this.seatingDrawDetails = {
      diceResult: [d1, d2, d3],
      diceSum: this.diceSum,
      firstDrawerIndex: firstDrawer,
      firstDrawerName: characters[firstDrawer].name,
      players: seatingPlayers,
    };

    // 6. 所有風位與起莊計算完畢後，再發出狀態變更通知
    this.notifyPhase();
  }

  /**
   * Phase 2: 莊家擲骰開門與配牌 (Dice Roll & Dealing).
   */
  public startDealing(autoStartFlowers: boolean = true): void {
    // Reset player round hands
    this.players.forEach((p) => {
      p.hand = [];
      p.drawnTile = null;
      p.melds = [];
      p.flowers = [];
      p.discards = [];
      p.isTing = false;
      p.isAutoPlay = false;
      p.isPassLockout = false;
      p.passPongCodesInTurn = new Set();
    });

    // Dealer rolls 3 dice for wall breaking (隨機生成並優先寫入 state)
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const d3 = Math.floor(Math.random() * 6) + 1;
    this.diceResult = [d1, d2, d3];
    this.diceSum = d1 + d2 + d3;

    this.phase = 'DEALING';
    this.notifyPhase();

    this.deck.reset();
    this.deck.setupWallBreak(this.diceSum, this.dealerSeat);

    // Deal 4 rounds of 4 tiles (16 tiles each in CCW order starting from East)
    const dealingOrder: PlayerSeat[] = [];
    for (let i = 0; i < 4; i++) {
      dealingOrder.push(((this.dealerSeat + i) % 4) as PlayerSeat);
    }

    for (let round = 0; round < 4; round++) {
      for (const seat of dealingOrder) {
        for (let k = 0; k < 4; k++) {
          const tile = this.deck.drawHead();
          if (tile) {
            this.players[seat].hand.push(tile);
            this.listeners.forEach((l) => l.onDealingStep?.(seat, tile));
          }
        }
      }
    }

    // Dealer draws 17th jump tile (跳牌)
    const jumpTile = this.deck.drawHead();
    if (jumpTile) {
      this.players[this.dealerSeat].drawnTile = jumpTile;
      this.listeners.forEach((l) => l.onDealingStep?.(this.dealerSeat, jumpTile));
    }

    // Sort all player hands into standard order
    this.sortHandTiles();

    if (autoStartFlowers) {
      this.startFlowerReplacement();
    }
  }

  /**
   * Sorts all player hands into standard order after dealing animation.
   */
  public sortHandTiles(): void {
    this.players.forEach((p) => {
      p.hand = MahjongHandEvaluator.sortTiles(p.hand);
    });
  }

  /**
   * Phase 3: 多輪輪替補花 (Multi-Round Flower Replacement).
   */
  public startFlowerReplacement(): void {
    if (this.phase === 'PLAYER_TURN' || this.phase === 'ROUND_SETTLEMENT' || this.phase === 'MATCH_OVER') {
      return;
    }
    this.phase = 'FLOWER_REPLACEMENT';
    this.notifyPhase();

    const dealingOrder: PlayerSeat[] = [];
    for (let i = 0; i < 4; i++) {
      dealingOrder.push(((this.dealerSeat + i) % 4) as PlayerSeat);
    }

    let hasAnyFlower = true;
    let iterations = 0;

    while (hasAnyFlower && iterations < 10) {
      hasAnyFlower = false;
      iterations++;

      for (const seat of dealingOrder) {
        const p = this.players[seat];

        // 1. Replace flower in drawnTile (if dealer jump tile is a flower)
        while (p.drawnTile && p.drawnTile.isFlower) {
          const flower = p.drawnTile;
          p.flowers.push(flower);
          const replacement = this.deck.drawTail();
          p.drawnTile = replacement;
          hasAnyFlower = true;
          this.listeners.forEach((l) => l.onFlowerReplaced?.(seat, flower, replacement!));
        }

        // 2. Replace flowers in hand tiles
        let handHasFlower = true;
        while (handHasFlower) {
          handHasFlower = false;
          const nextHand: Tile[] = [];
          for (const t of p.hand) {
            if (t.isFlower) {
              p.flowers.push(t);
              const replacement = this.deck.drawTail();
              if (replacement) {
                nextHand.push(replacement);
                this.listeners.forEach((l) => l.onFlowerReplaced?.(seat, t, replacement));
                if (replacement.isFlower) {
                  handHasFlower = true;
                }
              }
              hasAnyFlower = true;
            } else {
              nextHand.push(t);
            }
          }
          p.hand = MahjongHandEvaluator.sortTiles(nextHand);
        }
      }
    }

    // Check instant flower wins (八仙過海 / 七搶一)
    for (const p of this.players) {
      if (p.flowers.length === 8) {
        this.settleFlowerWin(p.seat);
        return;
      }
    }

    // Check dealer Heavenly Win (天胡)
    const dealer = this.players[this.dealerSeat];
    if (
      dealer.drawnTile &&
      MahjongHandEvaluator.isWinningHand(dealer.hand, dealer.melds, dealer.drawnTile)
    ) {
      // Heavenly Win!
      this.settleWin(this.dealerSeat, true, undefined, { isHeavenlyWin: true });
      return;
    }

    // Start playing phase
    this.isFirstTurnCycle = true;
    this.currentTurnCount = 0;
    this.currentTurnSeat = this.dealerSeat;
    this.startPlayerTurn(this.dealerSeat, false);
  }

  public startPlayerTurn(seat: PlayerSeat, needDraw: boolean = true): void {
    this.phase = 'PLAYER_TURN';
    this.currentTurnSeat = seat;
    this.notifyPhase();

    this.currentTurnCount++;
    if (this.currentTurnCount > 4) {
      this.isFirstTurnCycle = false;
    }

    const player = this.players[seat];

    if (needDraw) {
      if (!this.deck.hasRegularTilesLeft()) {
        this.settleDraw();
        return;
      }

      const drawn = this.deck.drawHead();
      if (!drawn) {
        this.settleDraw();
        return;
      }

      player.drawnTile = drawn;

      // In headless unit tests (autoStepAI = true), replace flowers synchronously
      if (this.autoStepAI) {
        while (player.drawnTile && player.drawnTile.isFlower) {
          const flower = player.drawnTile;
          player.flowers.push(flower);
          if (player.flowers.length === 8) {
            this.settleFlowerWin(seat);
            return;
          }
          const rep = this.deck.drawTail();
          player.drawnTile = rep;
          this.listeners.forEach((l) => l.onFlowerReplaced?.(seat, flower, rep!));
        }
      }
    }

    // Always emit onTurnStart for both drawn turns and non-drawn turns
    this.listeners.forEach((l) => l.onTurnStart?.(seat, player.drawnTile));

    // If human is in Auto-Draw Ting mode (託管摸打) and in headless test mode
    if (player.isHuman && player.isAutoPlay && this.autoStepAI) {
      this.executeAutoPlay(seat);
      return;
    }

    // If AI turn and autoStepAI enabled
    if (!player.isHuman && this.autoStepAI) {
      this.executeAITurn(seat);
    }
  }

  /**
   * Step-by-step visual flower replacement: moves drawn flower to rack and draws replacement from tail.
   */
  public replaceDrawnFlower(seat: PlayerSeat): Tile | null {
    const player = this.players[seat];
    if (!player.drawnTile || !player.drawnTile.isFlower) return null;

    const flower = player.drawnTile;
    player.flowers.push(flower);
    player.drawnTile = null;

    if (player.flowers.length === 8) {
      this.settleFlowerWin(seat);
      return null;
    }

    // Ensure 16 dead wall reserve tiles are preserved: if regular tiles exhausted, cannot draw from dead wall -> Draw Game
    if (!this.deck.hasRegularTilesLeft()) {
      this.listeners.forEach((l) => l.onFlowerReplaced?.(seat, flower, null as any));
      this.settleDraw();
      return null;
    }

    const rep = this.deck.drawTail();
    if (!rep) {
      this.settleDraw();
      return null;
    }

    player.drawnTile = rep;
    this.listeners.forEach((l) => l.onFlowerReplaced?.(seat, flower, rep));
    return rep;
  }

  public stepAITurn(seat?: PlayerSeat): void {
    const targetSeat = seat ?? this.currentTurnSeat;
    if (!this.players[targetSeat].isHuman) {
      this.executeAITurn(targetSeat);
    } else if (this.players[targetSeat].isAutoPlay) {
      this.executeAutoPlay(targetSeat);
    }
  }

  /**
   * Discards a tile from the player's hand.
   */
  public discardTile(seat: PlayerSeat, tileId: string): void {
    const player = this.players[seat];

    // Flower tiles must never be discarded - if attempted, replace flower instead
    if (player.drawnTile && player.drawnTile.isFlower && player.drawnTile.id === tileId) {
      console.warn(`[MahjongGameState] Player ${seat} attempted to discard flower tile ${tileId} - replacing flower instead`);
      this.replaceDrawnFlower(seat);
      return;
    }

    const totalTiles = player.hand.length + (player.drawnTile ? 1 : 0) + player.melds.length * 3;
    if (totalTiles < 17) {
      console.warn(`[MahjongGameState] Player ${seat} cannot discard: tile count is ${totalTiles} (less than 17)`);
      return;
    }

    let discarded: Tile | null = null;

    if (player.drawnTile && player.drawnTile.id === tileId) {
      discarded = player.drawnTile;
      player.drawnTile = null;
    } else {
      const idx = player.hand.findIndex((t) => t.id === tileId);
      if (idx !== -1) {
        discarded = player.hand[idx];
        player.hand.splice(idx, 1);
        if (player.drawnTile) {
          player.hand.push(player.drawnTile);
          player.drawnTile = null;
        }
        player.hand = MahjongHandEvaluator.sortTiles(player.hand);
      }
    }

    if (!discarded) {
      throw new Error(`Tile ${tileId} not found in player ${seat}'s hand`);
    }

    // Add to discard river
    player.discards.push(discarded);
    this.lastDiscard = { tile: discarded, fromSeat: seat };
    this.lastDiscardTurnIndex = this.currentTurnCount++;

    // Reset pass lockout on successful discard
    player.isPassLockout = false;
    player.passPongCodesInTurn.clear();

    this.listeners.forEach((l) => l.onTileDiscarded?.(seat, discarded!));

    // Arbitrate opponent actions
    this.arbitrateDiscard(seat, discarded);
  }

  /**
   * Arbitrates available actions (Hu > Pong/Kong > Chow) after a discard.
   */
  public arbitrateDiscard(fromSeat: PlayerSeat, tile: Tile): void {
    this.phase = 'ACTION_WAIT';

    const claims: {
      seat: PlayerSeat;
      action: 'HU' | 'PONG' | 'KONG' | 'CHOW' | 'PASS';
      option?: any;
    }[] = [];

    // Collect options from other 3 players
    for (let seat = 0; seat < 4; seat++) {
      if (seat === fromSeat) continue;
      const p = this.players[seat as PlayerSeat];

      const canHu =
        !p.isPassLockout &&
        MahjongHandEvaluator.isWinningHand(p.hand, p.melds, tile);

      const canPong = MahjongHandEvaluator.canPong(p.hand, tile, p.passPongCodesInTurn);
      const canMeldedKong = MahjongHandEvaluator.canMeldedKong(p.hand, tile, fromSeat, seat);
      const chowOptions = MahjongHandEvaluator.getChowOptions(p.hand, tile, fromSeat, seat);
      const canChow = chowOptions.length > 0;

      const actions: AvailableActions = {
        canHu,
        canPong,
        canKong: canMeldedKong,
        kongOptions: canMeldedKong
          ? [
              {
                type: 'MELDED_KONG',
                tileCode: tile.shortCode,
                handTileIds: p.hand
                  .filter((t) => t.shortCode === tile.shortCode)
                  .map((t) => t.id),
              },
            ]
          : [],
        canChow,
        chowOptions,
        canTing: false,
        canPass: true,
      };

      if (p.isHuman) {
        if (canHu || canPong || canMeldedKong || canChow) {
          if (p.isAutoPlay && canHu) {
            // Auto Hu
            claims.push({ seat: p.seat, action: 'HU' });
          } else if (p.isAutoPlay) {
            // In auto ting mode, pass on melds
            claims.push({ seat: p.seat, action: 'PASS' });
          } else {
            // Wait for human input
            this.phase = 'ACTION_WAIT';
            this.notifyPhase();
            return;
          }
        } else {
          claims.push({ seat: p.seat, action: 'PASS' });
        }
      } else {
        // AI decision
        const choice = MahjongAI.decideAction(
          actions,
          p.hand,
          p.melds,
          this.roundWind,
          this.getEffectiveWind(p.seat)
        );
        claims.push({
          seat: p.seat,
          action: choice,
          option: choice === 'CHOW' ? chowOptions[0] : undefined,
        });
      }
    }

    this.resolveClaims(fromSeat, tile, claims);
  }

  /**
   * Resolves actions by priority: Hu (with Intercept rule) > Pong / Kong > Chow > Pass.
   */
  public resolveClaims(
    fromSeat: PlayerSeat,
    tile: Tile,
    claims: { seat: PlayerSeat; action: 'HU' | 'PONG' | 'KONG' | 'CHOW' | 'PASS'; option?: any }[]
  ): void {
    // 1. Check Hu (Intercept Rule 攔胡: closest in CCW order from fromSeat wins)
    const huClaims = claims.filter((c) => c.action === 'HU');
    if (huClaims.length > 0) {
      let winnerSeat = huClaims[0].seat;
      let minDistance = 99;
      for (const c of huClaims) {
        const dist = (c.seat - fromSeat + 4) % 4;
        if (dist < minDistance) {
          minDistance = dist;
          winnerSeat = c.seat;
        }
      }
      this.settleWin(winnerSeat, false, fromSeat);
      return;
    }

    // 2. Check Pong / Melded Kong
    const pongOrKong = claims.find((c) => c.action === 'PONG' || c.action === 'KONG');
    if (pongOrKong) {
      const claimant = this.players[pongOrKong.seat];
      // Remove last tile from discard river
      const discarder = this.players[fromSeat];
      discarder.discards.pop();

      if (pongOrKong.action === 'PONG') {
        const handTiles = claimant.hand.filter((t) => t.shortCode === tile.shortCode).slice(0, 2);
        claimant.hand = claimant.hand.filter(
          (t) => t.id !== handTiles[0].id && t.id !== handTiles[1].id
        );

        const meld: Meld = {
          type: 'PONG',
          tiles: [handTiles[0], tile, handTiles[1]],
          calledTile: tile,
          sourceSeat: fromSeat,
          relativeSourceIndex: (fromSeat - pongOrKong.seat + 4) % 4 === 3 ? 0 : (fromSeat - pongOrKong.seat + 4) % 4 === 2 ? 1 : 2,
        };
        this.isFirstTurnCycle = false;
        claimant.melds.push(meld);
        this.listeners.forEach((l) => l.onMeldClaimed?.(pongOrKong.seat, meld));

        // Jump turn to claimant to discard
        this.startPlayerTurn(pongOrKong.seat, false);
      } else {
        // Melded Kong
        const handTiles = claimant.hand.filter((t) => t.shortCode === tile.shortCode).slice(0, 3);
        claimant.hand = claimant.hand.filter(
          (t) => !handTiles.some((ht) => ht.id === t.id)
        );

        const meld: Meld = {
          type: 'MELDED_KONG',
          tiles: [...handTiles, tile],
          calledTile: tile,
          sourceSeat: fromSeat,
        };
        this.isFirstTurnCycle = false;
        claimant.melds.push(meld);
        this.listeners.forEach((l) => l.onMeldClaimed?.(pongOrKong.seat, meld));

        // Switch turn to claimant
        this.currentTurnSeat = pongOrKong.seat;
        this.phase = 'PLAYER_TURN';
        this.notifyPhase();

        // Replenishment draw from tail
        if (!this.deck.hasRegularTilesLeft()) {
          this.settleDraw();
          return;
        }
        const rep = this.deck.drawTail();
        if (!rep) {
          this.settleDraw();
          return;
        }
        claimant.drawnTile = rep;

        // Auto flower replacement on tail draw
        while (claimant.drawnTile && claimant.drawnTile.isFlower) {
          const flower = claimant.drawnTile;
          claimant.flowers.push(flower);
          if (claimant.flowers.length === 8) {
            this.settleFlowerWin(pongOrKong.seat);
            return;
          }
          if (!this.deck.hasRegularTilesLeft()) {
            this.settleDraw();
            return;
          }
          const flowerRep = this.deck.drawTail();
          if (!flowerRep) {
            this.settleDraw();
            return;
          }
          claimant.drawnTile = flowerRep;
          this.listeners.forEach((l) => l.onFlowerReplaced?.(pongOrKong.seat, flower, flowerRep));
        }

        this.listeners.forEach((l) => l.onTurnStart?.(pongOrKong.seat, claimant.drawnTile));

        // If human is in Auto-Draw Ting mode
        if (claimant.isHuman && claimant.isAutoPlay) {
          this.executeAutoPlay(pongOrKong.seat);
          return;
        }

        // If AI turn and autoStepAI enabled
        if (!claimant.isHuman && this.autoStepAI) {
          this.executeAITurn(pongOrKong.seat);
        }
      }
      return;
    }

    // 3. Check Chow
    const chow = claims.find((c) => c.action === 'CHOW');
    if (chow && chow.option) {
      const claimant = this.players[chow.seat];
      const discarder = this.players[fromSeat];
      discarder.discards.pop();

      const option = chow.option as ChowOption;
      claimant.hand = claimant.hand.filter((t) => !option.discardTileIds.includes(t.id));

      const meld: Meld = {
        type: 'CHOW',
        tiles: option.tiles,
        calledTile: tile,
        sourceSeat: fromSeat,
        relativeSourceIndex: 1, // Chow centered
      };
      this.isFirstTurnCycle = false;
      claimant.melds.push(meld);
      this.listeners.forEach((l) => l.onMeldClaimed?.(chow.seat, meld));

      // Jump turn to claimant to discard
      this.startPlayerTurn(chow.seat, false);
      return;
    }

    // 4. All Passed -> Proceed to next CCW player regular turn
    const nextSeat = ((fromSeat + 1) % 4) as PlayerSeat;
    this.startPlayerTurn(nextSeat, true);
  }

  /**
   * Human responds to available actions.
   */
  public humanRespondAction(action: 'HU' | 'PONG' | 'KONG' | 'CHOW' | 'PASS', option?: any): void {
    if (this.phase !== 'ACTION_WAIT' || !this.lastDiscard) return;

    if (action === 'PASS') {
      // If human passed on a Hu -> trigger Pass Lockout
      const p1 = this.players[0];
      if (MahjongHandEvaluator.isWinningHand(p1.hand, p1.melds, this.lastDiscard.tile)) {
        p1.isPassLockout = true;
      }
      // If passed on Pong -> record pass pong code
      if (MahjongHandEvaluator.canPong(p1.hand, this.lastDiscard.tile, p1.passPongCodesInTurn)) {
        p1.passPongCodesInTurn.add(this.lastDiscard.tile.shortCode);
      }
    }

    const claims: {
      seat: PlayerSeat;
      action: 'HU' | 'PONG' | 'KONG' | 'CHOW' | 'PASS';
      option?: any;
    }[] = [{ seat: 0, action, option }];

    // Collect other AI responses
    for (let seat = 1; seat < 4; seat++) {
      const p = this.players[seat as PlayerSeat];
      const canHu =
        !p.isPassLockout &&
        MahjongHandEvaluator.isWinningHand(p.hand, p.melds, this.lastDiscard.tile);

      const canPong = MahjongHandEvaluator.canPong(p.hand, this.lastDiscard.tile, p.passPongCodesInTurn);
      const canMeldedKong = MahjongHandEvaluator.canMeldedKong(
        p.hand,
        this.lastDiscard.tile,
        this.lastDiscard.fromSeat,
        seat
      );
      const chowOptions = MahjongHandEvaluator.getChowOptions(
        p.hand,
        this.lastDiscard.tile,
        this.lastDiscard.fromSeat,
        seat
      );

      const actions: AvailableActions = {
        canHu,
        canPong,
        canKong: canMeldedKong,
        kongOptions: canMeldedKong
          ? [
              {
                type: 'MELDED_KONG',
                tileCode: this.lastDiscard.tile.shortCode,
                handTileIds: p.hand
                  .filter((t) => t.shortCode === this.lastDiscard!.tile.shortCode)
                  .map((t) => t.id),
              },
            ]
          : [],
        canChow: chowOptions.length > 0,
        chowOptions,
        canTing: false,
        canPass: true,
      };

      const choice = MahjongAI.decideAction(
        actions,
        p.hand,
        p.melds,
        this.roundWind,
        p.wind
      );
      claims.push({
        seat: p.seat,
        action: choice,
        option: choice === 'CHOW' ? chowOptions[0] : undefined,
      });
    }

    this.resolveClaims(this.lastDiscard.fromSeat, this.lastDiscard.tile, claims);
  }

  /**
   * Performs a self kong (Concealed or Added) for the player at seat.
   */
  public performSelfKong(seat: PlayerSeat, kong: KongOption): void {
    const p = this.players[seat];
    const fullHand = p.drawnTile ? [...p.hand, p.drawnTile] : p.hand;

    if (kong.type === 'CONCEALED_KONG') {
      p.hand = fullHand.filter((t) => !kong.handTileIds.includes(t.id));
      p.drawnTile = null;

      const meld: Meld = {
        type: 'CONCEALED_KONG',
        tiles: fullHand.filter((t) => kong.handTileIds.includes(t.id)),
        sourceSeat: seat,
      };
      p.melds.push(meld);
      this.listeners.forEach((l) => l.onMeldClaimed?.(seat, meld));
    } else if (kong.type === 'ADDED_KONG') {
      const addedTile = fullHand.find((t) => kong.handTileIds.includes(t.id));
      if (addedTile) {
        p.hand = fullHand.filter((t) => t.id !== addedTile.id);
        p.drawnTile = null;

        const targetMeld = p.melds.find(
          (m) => m.type === 'PONG' && m.tiles[0].shortCode === kong.tileCode
        );
        if (targetMeld) {
          targetMeld.type = 'ADDED_KONG';
          targetMeld.tiles.push(addedTile);
          this.listeners.forEach((l) => l.onMeldClaimed?.(seat, targetMeld));
        }
      }
    }

    // Replenishment draw from tail
    if (!this.deck.hasRegularTilesLeft()) {
      this.settleDraw();
      return;
    }
    const rep = this.deck.drawTail();
    if (!rep) {
      this.settleDraw();
      return;
    }
    p.drawnTile = rep;

    // In headless unit tests (autoStepAI = true), replace flowers synchronously
    if (this.autoStepAI) {
      while (p.drawnTile && p.drawnTile.isFlower) {
        const flower = p.drawnTile;
        p.flowers.push(flower);
        if (p.flowers.length === 8) {
          this.settleFlowerWin(seat);
          return;
        }
        if (!this.deck.hasRegularTilesLeft()) {
          this.settleDraw();
          return;
        }
        const flowerRep = this.deck.drawTail();
        if (!flowerRep) {
          this.settleDraw();
          return;
        }
        p.drawnTile = flowerRep;
        this.listeners.forEach((l) => l.onFlowerReplaced?.(seat, flower, flowerRep));
      }
    }

    this.listeners.forEach((l) => l.onTurnStart?.(seat, p.drawnTile));
  }

  /**
   * Executes AI player's turn logic.
   */
  private executeAITurn(seat: PlayerSeat): void {
    const p = this.players[seat];

    // Check Self Hu
    if (p.drawnTile && MahjongHandEvaluator.isWinningHand(p.hand, p.melds, p.drawnTile)) {
      this.settleWin(seat, true);
      return;
    }

    // Check Self Kongs (Concealed or Added)
    const kongOpts = MahjongHandEvaluator.getSelfKongOptions(
      p.drawnTile ? [...p.hand, p.drawnTile] : p.hand,
      p.melds
    );

    if (kongOpts.length > 0 && Math.random() > 0.4) {
      const kong = kongOpts[0];
      this.performSelfKong(seat, kong);
      if (this.phase === 'ROUND_SETTLEMENT' || this.phase === 'MATCH_OVER' || this.phase === 'GAME_OVER') {
        return;
      }
    }

    // Choose discard with fresh hand after potential self kong
    const fullHand = p.drawnTile ? [...p.hand, p.drawnTile] : p.hand;
    const allVisible = this.getAllVisibleTiles();
    const opponents = this.players.filter((_, i) => i !== seat);

    const bestDiscard = MahjongAI.chooseBestDiscard(
      fullHand,
      p.melds,
      allVisible,
      opponents,
      this.deck.getRegularRemainingCount()
    );

    this.discardTile(seat, bestDiscard.id);
  }

  /**
   * Executes human auto play in Ting mode.
   */
  private executeAutoPlay(seat: PlayerSeat): void {
    const p = this.players[seat];

    // If drawn tile is a flower, replace flower instead of discarding
    if (p.drawnTile && p.drawnTile.isFlower) {
      this.replaceDrawnFlower(seat);
      return;
    }

    if (p.drawnTile && MahjongHandEvaluator.isWinningHand(p.hand, p.melds, p.drawnTile)) {
      this.settleWin(seat, true);
      return;
    }

    if (p.drawnTile) {
      this.discardTile(seat, p.drawnTile.id);
    } else if (p.hand.length > 0) {
      this.discardTile(seat, p.hand[p.hand.length - 1].id);
    }
  }

  /**
   * Collects all publicly visible tiles across the table (open melds, flowers, discards).
   * Other players' concealed hands and opponent concealed kongs are NEVER included.
   */
  public getAllVisibleTiles(forSeat: PlayerSeat = 0): Tile[] {
    const tiles: Tile[] = [];
    this.players.forEach((p, seat) => {
      tiles.push(...p.flowers);
      tiles.push(...p.discards);
      p.melds.forEach((m) => {
        if (m.type !== 'CONCEALED_KONG' || seat === forSeat) {
          tiles.push(...m.tiles);
        }
      });
    });
    return tiles;
  }

  /**
   * Returns the dynamic effective seat wind (當局門風) for tai and flower evaluation.
   * Dealer is strictly EAST (1/5 flower, East wind), and CCW next seats are SOUTH, WEST, NORTH.
   */
  public getEffectiveWind(seat: PlayerSeat): SeatWind {
    const winds: SeatWind[] = ['EAST', 'SOUTH', 'WEST', 'NORTH'];
    return winds[(seat - this.dealerSeat + 4) % 4];
  }

  /**
   * Round Settlement for Win.
   */
  public settleWin(
    winnerSeat: PlayerSeat,
    isSelfDrawn: boolean,
    loserSeat?: PlayerSeat,
    extraFlags: {
      isKongBloom?: boolean;
      isRobbingKong?: boolean;
      isHeavenlyWin?: boolean;
      isEarthlyWin?: boolean;
      isHumanWin?: boolean;
    } = {}
  ): void {
    this.phase = 'ROUND_SETTLEMENT';
    this.notifyPhase();

    const winner = this.players[winnerSeat];
    const winningTile = isSelfDrawn
      ? winner.drawnTile || winner.hand[winner.hand.length - 1]
      : this.lastDiscard?.tile || winner.hand[winner.hand.length - 1];

    const isKongBloom = extraFlags.isKongBloom ?? (isSelfDrawn && this.deck.wasLastDrawFromTail());
    const totalMelds = this.players.reduce((sum, p) => sum + p.melds.length, 0);
    const isEarthlyWin =
      extraFlags.isEarthlyWin ??
      (isSelfDrawn && this.isFirstTurnCycle && winnerSeat !== this.dealerSeat && totalMelds === 0 && winner.discards.length === 0);
    const isHumanWin =
      extraFlags.isHumanWin ??
      (!isSelfDrawn && this.isFirstTurnCycle && winnerSeat !== this.dealerSeat && totalMelds === 0 && winner.melds.length === 0 && winner.discards.length === 0);

    const winnerEffectiveWind = this.getEffectiveWind(winnerSeat);
    const breakdown = MahjongScoreCalculator.evaluateSettlement({
      winnerSeat,
      winnerHand: winner.hand,
      winnerMelds: winner.melds,
      winnerFlowers: winner.flowers,
      winningTile,
      isSelfDrawn,
      loserSeat,
      isRobbingKong: extraFlags.isRobbingKong,
      isKongBloom,
      isLastTileDraw: this.deck.getRegularRemainingCount() === 0,
      isHeavenlyWin: extraFlags.isHeavenlyWin,
      isEarthlyWin,
      isHumanWin,
      roundWind: this.roundWind,
      playerWind: winnerEffectiveWind,
      dealerSeat: this.dealerSeat,
      dealerStreak: this.dealerStreak,
      currentChips: this.players.map((p) => p.chips),
    });

    // Update chip balances
    for (let i = 0; i < 4; i++) {
      this.players[i].chips = breakdown.remainingChips[i];
    }

    this.currentSettlement = breakdown;
    this.listeners.forEach((l) => l.onSettlement?.(breakdown));

    // Update dealer streak / rotation
    if (winnerSeat === this.dealerSeat) {
      this.dealerStreak++;
    } else {
      this.dealerStreak = 0;
      this.rotateDealer();
    }

    this.checkGameOrMatchEnd();
  }

  /**
   * Round Settlement for Special Flower Win (八仙過海 / 七搶一).
   */
  public settleFlowerWin(winnerSeat: PlayerSeat): void {
    this.phase = 'ROUND_SETTLEMENT';
    this.notifyPhase();

    const winner = this.players[winnerSeat];
    const winnerEffectiveWind = this.getEffectiveWind(winnerSeat);
    const breakdown = MahjongScoreCalculator.evaluateSettlement({
      winnerSeat,
      winnerHand: winner.hand,
      winnerMelds: winner.melds,
      winnerFlowers: winner.flowers,
      winningTile: winner.flowers[winner.flowers.length - 1],
      isSelfDrawn: winner.flowers.length === 8,
      isFlowerWin: true,
      roundWind: this.roundWind,
      playerWind: winnerEffectiveWind,
      dealerSeat: this.dealerSeat,
      dealerStreak: this.dealerStreak,
      currentChips: this.players.map((p) => p.chips),
    });

    for (let i = 0; i < 4; i++) {
      this.players[i].chips = breakdown.remainingChips[i];
    }

    this.currentSettlement = breakdown;
    this.listeners.forEach((l) => l.onSettlement?.(breakdown));

    if (winnerSeat === this.dealerSeat) {
      this.dealerStreak++;
    } else {
      this.dealerStreak = 0;
      this.rotateDealer();
    }

    this.checkGameOrMatchEnd();
  }

  /**
   * Round Settlement for Draw (流局 / 荒莊).
   */
  public settleDraw(): void {
    this.phase = 'ROUND_SETTLEMENT';
    this.notifyPhase();

    // Dealer retains bankership: N = N + 1
    this.dealerStreak++;

    const breakdown: SettlementBreakdown = {
      winnerSeat: this.dealerSeat,
      isSelfDrawn: false,
      isDraw: true,
      basePoints: 0,
      fanRate: 0,
      dealerMultiplierFan: 2 * this.dealerStreak + 1,
      dealerStreak: this.dealerStreak,
      fans: [{ name: '流局 (荒莊)', fan: 0, description: '海底16張鐵牌流局，莊家連莊' }],
      totalFans: 0,
      chipDeltas: [0, 0, 0, 0],
      remainingChips: this.players.map((p) => p.chips),
      winnerName: '流局',
    };

    this.currentSettlement = breakdown;
    this.listeners.forEach((l) => l.onSettlement?.(breakdown));

    this.checkGameOrMatchEnd();
  }

  private rotateDealer(): void {
    this.dealerSeat = ((this.dealerSeat + 1) % 4) as PlayerSeat;
    this.dealerRoundsPlayed++;

    // Update isDealer while strictly preserving each player's permanent seating wind from 抓位
    for (let i = 0; i < 4; i++) {
      this.players[i].isDealer = (i === this.dealerSeat);
    }

    // If 4 dealer rotations completed, advance round wind
    if (this.dealerRoundsPlayed >= 4) {
      this.dealerRoundsPlayed = 0;
      this.roundWindIndex++;
      const roundWinds: SeatWind[] = ['EAST', 'SOUTH', 'WEST', 'NORTH'];
      if (this.roundWindIndex < 4) {
        this.roundWind = roundWinds[this.roundWindIndex];
      }
    }
  }

  private checkGameOrMatchEnd(): void {
    const p1 = this.players[0];

    // Check Human Bankruptcy
    if (p1.chips <= 0) {
      this.phase = 'GAME_OVER';
      this.notifyPhase();
      this.listeners.forEach((l) =>
        l.onGameOver?.({
          score: 0,
          cleared: false,
          reason: '真人玩家籌碼破產淘汰！',
        })
      );
      return;
    }

    // Check 4-wind match completion
    if (this.roundWindIndex >= 4) {
      this.phase = 'MATCH_OVER';
      this.notifyPhase();
      this.listeners.forEach((l) =>
        l.onGameOver?.({
          score: p1.chips,
          cleared: true,
          reason: '恭喜順利打滿四圈通關一將！',
        })
      );
    }
  }

  private notifyPhase(): void {
    this.listeners.forEach((l) => l.onPhaseChange?.(this.phase));
  }
}
