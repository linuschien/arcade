/**
 * MainGameScene.ts
 * Main Render & Gameplay Scene for Taiwanese 16-Tile Mahjong.
 * Coordinates 4-seat spatial matrix, 3D Tile Walls (東南西北 72 墩牌牆),
 * Central Wind Compass & Discard Rivers, Smart Ting UI, Floating Action Bar,
 * Sequential Settlement, and ArcadeBridge events.
 */

import Phaser from 'phaser';
import { ArcadeBridge } from '@/core/bridge/ArcadeBridge';
import { MahjongGameState } from '../logic/MahjongGameState';
import { SeatLayoutContainer } from './SeatLayoutContainer';
import { MahjongAudioService } from '../audio/MahjongAudioService';
import { MahjongHandEvaluator } from '../logic/MahjongHandEvaluator';
import {
  PlayerSeat,
  SettlementBreakdown,
  GamePhase,
  AvailableActions,
  ChowOption,
  KongOption,
  Tile,
} from '../logic/MahjongTypes';

export class MainGameScene extends Phaser.Scene {
  private gameState!: MahjongGameState;
  private seatContainers: SeatLayoutContainer[] = [];

  // Central Compass & Dice UI
  private compassDial!: Phaser.GameObjects.Sprite;
  private roundWindText!: Phaser.GameObjects.Text;
  private dealerStreakText!: Phaser.GameObjects.Text;
  private remainingTilesText!: Phaser.GameObjects.Text;
  private turnPointer!: Phaser.GameObjects.Graphics;
  private diceContainer!: Phaser.GameObjects.Container;
  private bankerDiceOutsideCompassContainer!: Phaser.GameObjects.Container;
  private compassSeatWindTexts: Phaser.GameObjects.Text[] = [];

  // 3D Physical Tile Walls (東南西北 72 墩)
  private wallContainer!: Phaser.GameObjects.Container;
  private wallSprites: Phaser.GameObjects.Sprite[] = [];

  // Latest Discard Indicator
  private discardMarker!: Phaser.GameObjects.Graphics;

  // Smart Ting UI
  private tingContainer!: Phaser.GameObjects.Container;
  private tingText!: Phaser.GameObjects.Text;
  private tingAutoBtn!: Phaser.GameObjects.Container;

  // Floating Action Bar (Chow, Pong, Kong, Ting, Hu, Pass)
  private actionBarContainer!: Phaser.GameObjects.Container;
  private subMenuContainer!: Phaser.GameObjects.Container;

  // Settlement Window
  private settlementContainer!: Phaser.GameObjects.Container;

  private isPausedState: boolean = false;

  constructor() {
    super({ key: 'mahjong:MainGameScene' });
  }

  public create(): void {
    this.gameState = new MahjongGameState();
    // Disable synchronous auto-stepping in gameState so Phaser controls visual turn timing
    this.gameState.autoStepAI = false;

    this.createTableBackground();
    this.createTileWalls();
    this.createCentralCompass();
    this.createSeats();
    this.createDiscardMarker();
    this.createSmartTingUI();
    this.createActionBar();
    this.createSettlementModal();

    this.setupGameStateListeners();

    // Start BGM
    MahjongAudioService.playBGM();

    // Start first match
    this.gameState.startNewMatch();
    this.refreshAllSeats();
    this.updateTileWalls();

    // Scene teardown listeners
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.on(Phaser.Scenes.Events.DESTROY, this.handleShutdown, this);
  }

  private createTableBackground(): void {
    const W = 1280;
    const H = 720;

    const bg = this.add.graphics();
    // Emerald Green Felt gradient
    bg.fillStyle(0x0b2f1f, 1);
    bg.fillRect(0, 0, W, H);

    // Dark walnut wood border
    bg.lineStyle(12, 0x1e1b18, 1);
    bg.strokeRect(6, 6, W - 12, H - 12);

    // Champagne gold inner trim
    bg.lineStyle(2, 0xd4af37, 0.9);
    bg.strokeRect(14, 14, W - 28, H - 28);
  }

  /**
   * Creates the 4 physical 3D Tile Walls (72 stacks = 144 tiles).
   */
  private createTileWalls(): void {
    this.wallContainer = this.add.container(0, 0);
    this.wallSprites = [];

    const stacksPerSide = 18;
    const step = 20;

    // Clockwise Wall Progression around the table:
    // 1. South Wall (Bottom): Right to Left (0 to 17)
    for (let i = 0; i < stacksPerSide; i++) {
      const x = 810 - i * step;
      const y = 482;
      const sprite = this.add.sprite(x, y, 'mahjong:wall_tile_stack');
      this.wallSprites.push(sprite);
      this.wallContainer.add(sprite);
    }

    // 2. West Wall (Left): Bottom to Top (18 to 35)
    for (let i = 0; i < stacksPerSide; i++) {
      const x = 425;
      const y = 470 - i * 13;
      const sprite = this.add.sprite(x, y, 'mahjong:wall_tile_stack');
      sprite.setAngle(90);
      this.wallSprites.push(sprite);
      this.wallContainer.add(sprite);
    }

    // 3. North Wall (Top): Left to Right (36 to 53)
    for (let i = 0; i < stacksPerSide; i++) {
      const x = 470 + i * step;
      const y = 238;
      const sprite = this.add.sprite(x, y, 'mahjong:wall_tile_stack');
      this.wallSprites.push(sprite);
      this.wallContainer.add(sprite);
    }

    // 4. East Wall (Right): Top to Bottom (54 to 71)
    for (let i = 0; i < stacksPerSide; i++) {
      const x = 855;
      const y = 250 + i * 13;
      const sprite = this.add.sprite(x, y, 'mahjong:wall_tile_stack');
      sprite.setAngle(90);
      this.wallSprites.push(sprite);
      this.wallContainer.add(sprite);
    }
  }

  private updateTileWalls(): void {
    this.wallSprites.forEach((sprite, idx) => {
      const count = this.gameState.deck.getStackRemainingTileCount(idx);
      if (count === 0) {
        sprite.setVisible(false);
      } else if (count === 1) {
        sprite.setVisible(true);
        sprite.setAlpha?.(0.65);
        sprite.setScale?.(0.85);
      } else {
        sprite.setVisible(true);
        sprite.setAlpha?.(1.0);
        sprite.setScale?.(1.0);
      }
    });
  }

  private createCentralCompass(): void {
    const cx = 640;
    const cy = 360;

    const dial = this.add.sprite(cx, cy, 'mahjong:compass_dial');
    dial.setDisplaySize(140, 140);

    // Turn pointer (Breathing gold needle)
    this.turnPointer = this.add.graphics();

    this.roundWindText = this.add.text(cx, cy - 20, '東風東', {
      fontSize: '14px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#facc15',
      fontStyle: 'bold',
    });
    this.roundWindText.setOrigin(0.5);

    this.dealerStreakText = this.add.text(cx, cy, '連 0 拉 0', {
      fontSize: '11px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#94a3b8',
      fontStyle: 'bold',
    });
    this.dealerStreakText.setOrigin(0.5);

    this.remainingTilesText = this.add.text(cx, cy + 20, '餘 70 張', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#38bdf8',
      fontStyle: 'bold',
    });
    this.remainingTilesText.setOrigin(0.5);

    // Fixed Seat Winds on Compass Dial (Bottom Seat 0, Right Seat 1, Top Seat 2, Left Seat 3)
    this.compassSeatWindTexts = [
      this.add.text(cx, cy + 46, '東', {
        fontSize: '13px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#fef08a',
        fontStyle: 'bold',
      }).setOrigin(0.5),
      this.add.text(cx + 46, cy, '南', {
        fontSize: '13px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#fef08a',
        fontStyle: 'bold',
      }).setOrigin(0.5),
      this.add.text(cx, cy - 46, '西', {
        fontSize: '13px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#fef08a',
        fontStyle: 'bold',
      }).setOrigin(0.5),
      this.add.text(cx - 46, cy, '北', {
        fontSize: '13px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#fef08a',
        fontStyle: 'bold',
      }).setOrigin(0.5),
    ];

    // Dice Container for roll animation
    this.diceContainer = this.add.container(cx, cy);
    this.diceContainer.setVisible(false);

    // Persistent Banker Dice outside compass facing Banker's seat
    this.bankerDiceOutsideCompassContainer = this.add.container(0, 0);
    this.bankerDiceOutsideCompassContainer.setDepth(15);
  }

  private createSeats(): void {
    const seatConfigs = [
      { x: 640, y: 645, angle: 0, seat: 0 as PlayerSeat },
      { x: 1180, y: 360, angle: 270, seat: 1 as PlayerSeat },
      { x: 640, y: 75, angle: 180, seat: 2 as PlayerSeat },
      { x: 100, y: 360, angle: 90, seat: 3 as PlayerSeat },
    ];

    this.seatContainers = seatConfigs.map((cfg) => {
      const container = new SeatLayoutContainer(
        this,
        cfg.x,
        cfg.y,
        cfg.angle,
        cfg.seat
      );

      if (cfg.seat === 0) {
        container.onTileClick = (tileId: string) => this.handleHumanTileClick(tileId);
        container.onTileHover = (code: string | null) => this.handleHumanTileHover(code);
      }

      return container;
    });
  }

  private createDiscardMarker(): void {
    this.discardMarker = this.add.graphics();
    this.discardMarker.lineStyle(2.5, 0x00f0ff, 1);
    this.discardMarker.strokeRoundedRect(-18, -24, 34, 46, 3);
    this.discardMarker.setDepth(50);
    this.discardMarker.setVisible(false);
  }

  private highlightLatestDiscard(seat: PlayerSeat, _tile: Tile): void {
    const pos = this.seatContainers[seat].getLatestDiscardWorldPosition();
    if (!pos) {
      this.discardMarker.setVisible(false);
      return;
    }
    const seatAngles = [0, 270, 180, 90];
    this.discardMarker.setPosition(pos.x, pos.y);
    this.discardMarker.setAngle(seatAngles[seat]);
    this.discardMarker.setVisible(true);
  }

  private createSmartTingUI(): void {
    // Smart Ting positioned directly centered beneath player's hand
    this.tingContainer = this.add.container(640, 690);
    this.tingContainer.setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.92);
    bg.fillRoundedRect(-190, -13, 380, 26, 6);
    bg.lineStyle(1, 0x8b5cf6, 0.85);
    bg.strokeRoundedRect(-190, -13, 380, 26, 6);
    this.tingContainer.add(bg);

    this.tingText = this.add.text(-180, -7, '聽牌: ', {
      fontSize: '12px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#c4b5fd',
      fontStyle: 'bold',
    });
    this.tingContainer.add(this.tingText);

    // Auto Play Button (聽牌託管)
    this.tingAutoBtn = this.add.container(115, -11);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x7c3aed, 1);
    btnBg.fillRoundedRect(0, 0, 70, 22, 4);
    this.tingAutoBtn.add(btnBg);

    const btnTxt = this.add.text(35, 11, '聽牌託管', {
      fontSize: '11px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    btnTxt.setOrigin(0.5);
    this.tingAutoBtn.add(btnTxt);

    btnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 70, 22), Phaser.Geom.Rectangle.Contains);
    btnBg.on('pointerdown', () => {
      this.gameState.players[0].isAutoPlay = true;
      MahjongAudioService.playVoiceTing();
      this.tingAutoBtn.setVisible(false);
      this.tingText.setText(this.tingText.text + ' [極速託管中]');
      if (this.gameState.currentTurnSeat === 0) {
        this.gameState.stepAITurn(0);
      }
    });

    this.tingContainer.add(this.tingAutoBtn);
    this.tingContainer.setDepth(90);
  }

  private createActionBar(): void {
    // Action bar positioned above hand and below discard river
    this.actionBarContainer = this.add.container(640, 580);
    this.actionBarContainer.setVisible(false);
    this.actionBarContainer.setDepth(100);

    this.subMenuContainer = this.add.container(640, 520);
    this.subMenuContainer.setVisible(false);
    this.subMenuContainer.setDepth(110);
  }

  private createSettlementModal(): void {
    this.settlementContainer = this.add.container(640, 360);
    this.settlementContainer.setVisible(false);
    this.settlementContainer.setDepth(200);
  }

  private setupGameStateListeners(): void {
    this.gameState.addListener({
      onPhaseChange: (phase: GamePhase) => {
        this.handlePhaseChange(phase);
      },
      onDealingStep: () => {
        this.refreshAllSeats();
        this.updateCompass();
        this.updateTileWalls();
      },
      onFlowerReplaced: () => {
        MahjongAudioService.playFlowerReplace();
        this.refreshAllSeats();
        this.updateCompass();
        this.updateTileWalls();
      },
      onTurnStart: (seat: PlayerSeat) => {
        this.refreshAllSeats();
        this.updateCompass();
        this.updateSmartTing();
        this.updateTileWalls();

        // 1. 摸到花要有時間顯示花 (Display drawn flower tile before replacing)
        const p = this.gameState.players[seat];
        if (p.drawnTile && p.drawnTile.isFlower) {
          this.handleInTurnFlowerSequence(seat);
          return;
        }

        // 2. Audio Gating: wait until active voice announcement (補花 / 碰 / 槓) completes before proceeding!
        MahjongAudioService.waitForVoiceComplete().then(() => {
          if (seat === 0) {
            this.checkHumanSelfActions();
            const p0 = this.gameState.players[0];
            if (p0.isAutoPlay && !this.actionBarContainer.visible) {
              const canHu =
                p0.drawnTile !== null &&
                MahjongHandEvaluator.isWinningHand(p0.hand, p0.melds, p0.drawnTile);
              if (!canHu) {
                this.time.delayedCall(400, () => {
                  if (this.gameState.currentTurnSeat === 0 && this.gameState.phase === 'PLAYER_TURN') {
                    this.gameState.stepAITurn(0);
                  }
                });
              }
            }
          } else {
            // AI turn: schedule async turn step with 600ms thinking delay AFTER voice is done
            this.time.delayedCall(600, () => {
              if (this.gameState.currentTurnSeat === seat && this.gameState.phase === 'PLAYER_TURN') {
                this.gameState.stepAITurn(seat);
              }
            });
          }
        });
      },
      onTileDiscarded: (seat: PlayerSeat, tile) => {
        MahjongAudioService.playTileDiscard();
        this.refreshAllSeats();
        this.updateCompass();
        this.updateSmartTing();
        this.updateTileWalls();
        this.highlightLatestDiscard(seat, tile);

        if (seat !== 0) {
          this.checkHumanClaimActions();
        }
      },
      onMeldClaimed: (_seat: PlayerSeat, meld) => {
        if (meld.type === 'CHOW') MahjongAudioService.playVoiceChow();
        else if (meld.type === 'PONG') MahjongAudioService.playVoicePong();
        else MahjongAudioService.playVoiceKong();

        this.discardMarker.setVisible(false);
        this.actionBarContainer.setVisible(false);
        this.subMenuContainer.setVisible(false);
        this.refreshAllSeats();
        this.updateCompass();
        this.updateTileWalls();
      },
      onSettlement: (breakdown: SettlementBreakdown) => {
        this.discardMarker.setVisible(false);
        this.showSettlementWindow(breakdown);
      },
      onGameOver: (summary) => {
        this.discardMarker.setVisible(false);
        this.showGameOverModal(summary);
      },
    });
  }

  private handlePhaseChange(phase: GamePhase): void {
    if (phase === 'SEATING_DRAW') {
      this.playSeatingDiceAnimation();
    } else if (phase === 'DEALING') {
      this.playDealerWallBreakDiceAnimation();
    }
  }

  /**
   * 1. 抓風位擲骰動畫 (Seating Draw Dice Animation).
   */
  private playSeatingDiceAnimation(): void {
    this.discardMarker.setVisible(false);
    this.bankerDiceOutsideCompassContainer.setVisible(false);
    MahjongAudioService.playDiceRoll();
    this.diceContainer.removeAll(true);
    this.diceContainer.setVisible(true);

    const d = this.gameState.diceResult;
    const diceSum = d[0] + d[1] + d[2];

    const bg = this.add.graphics();
    bg.fillStyle(0x020617, 0.92);
    bg.fillRoundedRect(-150, -45, 300, 90, 12);
    bg.lineStyle(1.5, 0xd4af37, 0.9);
    bg.strokeRoundedRect(-150, -45, 300, 90, 12);
    this.diceContainer.add(bg);

    for (let i = 0; i < 3; i++) {
      const sprite = this.add.sprite((i - 1) * 44, -10, `mahjong:dice_${d[i]}`);
      sprite.setDisplaySize(32, 32);
      this.diceContainer.add(sprite);

      if (this.tweens) {
        this.tweens.add({
          targets: sprite,
          angle: { from: -180, to: 180 },
          scale: { from: 0.7, to: 1.0 },
          duration: 600,
          ease: 'Cubic.easeOut',
        });
      }
    }

    const infoText = this.add.text(
      0,
      25,
      `🎲 抓風位擲骰 ${d[0]}+${d[1]}+${d[2]}=${diceSum} 點 (決定風位起抽順序)`,
      {
        fontSize: '12px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#facc15',
        fontStyle: 'bold',
      }
    );
    infoText.setOrigin(0.5);
    this.diceContainer.add(infoText);

    this.time.delayedCall(1400, () => {
      this.diceContainer.setVisible(false);
      this.refreshAllSeats();
      this.updateCompass();
      this.gameState.startDealing(false);
    });
  }

  /**
   * 2. 莊家開門擲骰動畫 (Dealer Wall Break & Dealing Animation).
   */
  private playDealerWallBreakDiceAnimation(): void {
    this.bankerDiceOutsideCompassContainer.setVisible(false);
    MahjongAudioService.playDiceRoll();
    this.diceContainer.removeAll(true);
    this.diceContainer.setVisible(true);

    const windNames: Record<string, string> = {
      EAST: '東',
      SOUTH: '南',
      WEST: '西',
      NORTH: '北',
    };
    const d = this.gameState.diceResult;
    const diceSum = d[0] + d[1] + d[2];
    const breakSeat = (this.gameState.dealerSeat + (diceSum - 1)) % 4;
    const breakPlayer = this.gameState.players[breakSeat];
    const breakWind = windNames[breakPlayer.wind] || '東';
    const dealerName = this.gameState.players[this.gameState.dealerSeat].name;

    const bg = this.add.graphics();
    bg.fillStyle(0x020617, 0.92);
    bg.fillRoundedRect(-155, -45, 310, 90, 12);
    bg.lineStyle(1.5, 0xd4af37, 0.9);
    bg.strokeRoundedRect(-155, -45, 310, 90, 12);
    this.diceContainer.add(bg);

    for (let i = 0; i < 3; i++) {
      const sprite = this.add.sprite((i - 1) * 44, -10, `mahjong:dice_${d[i]}`);
      sprite.setDisplaySize(32, 32);
      this.diceContainer.add(sprite);

      if (this.tweens) {
        this.tweens.add({
          targets: sprite,
          angle: { from: -180, to: 180 },
          scale: { from: 0.7, to: 1.0 },
          duration: 600,
          ease: 'Cubic.easeOut',
        });
      }
    }

    const infoText = this.add.text(
      0,
      25,
      `🎲 莊家${dealerName}開門 ${d[0]}+${d[1]}+${d[2]}=${diceSum} 點 (${breakWind}風第${diceSum}墩開門)`,
      {
        fontSize: '12px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#facc15',
        fontStyle: 'bold',
      }
    );
    infoText.setOrigin(0.5);
    this.diceContainer.add(infoText);

    // 1. Center dice roll completes after 1400ms -> Central dice disappears, THEN Banker outer dice appear!
    this.time.delayedCall(1400, () => {
      this.diceContainer.setVisible(false);
      this.bankerDiceOutsideCompassContainer.setVisible(true);
      this.updateBankerDicePosition();
      this.updateTileWalls();
      this.animateTileSort();
    });
  }

  /**
   * Places 3 Banker Dice outside the central compass facing current Banker's seat.
   */
  private updateBankerDicePosition(): void {
    this.bankerDiceOutsideCompassContainer.removeAll(true);

    // Only show outer Banker dice after central rolling dice have finished and disappeared!
    if (
      this.diceContainer.visible ||
      this.gameState.phase === 'SEATING_DRAW' ||
      this.gameState.phase === 'DEALING'
    ) {
      this.bankerDiceOutsideCompassContainer.setVisible(false);
      return;
    }

    const d = this.gameState.diceResult;
    if (!d || d.length < 3) return;

    this.bankerDiceOutsideCompassContainer.setVisible(true);

    const dealerSeat = this.gameState.dealerSeat;
    // Coordinates placed right outside compass (radius 70px) facing the current dealer seat
    const positions = [
      { x: 640, y: 442 }, // Seat 0 (Bottom Human)
      { x: 722, y: 360 }, // Seat 1 (Right AI)
      { x: 640, y: 278 }, // Seat 2 (Top AI)
      { x: 558, y: 360 }, // Seat 3 (Left AI)
    ];
    const angles = [0, 270, 180, 90];
    const pos = positions[dealerSeat];

    const sub = this.add.container(pos.x, pos.y);
    sub.setAngle(angles[dealerSeat]);

    const bg = this.add.graphics();
    bg.fillStyle(0x020617, 0.92);
    bg.fillRoundedRect(-42, -14, 84, 28, 6);
    bg.lineStyle(1.5, 0xd4af37, 0.9);
    bg.strokeRoundedRect(-42, -14, 84, 28, 6);
    sub.add(bg);

    for (let i = 0; i < 3; i++) {
      const sprite = this.add.sprite(-24 + i * 24, 0, `mahjong:dice_${d[i]}`);
      sprite.setDisplaySize(18, 18);
      sub.add(sprite);
    }
    this.bankerDiceOutsideCompassContainer.add(sub);
  }

  /**
   * Animates card sorting cascade after dealing, then triggers flower replacement.
   */
  private animateTileSort(): void {
    MahjongAudioService.playTileSort();
    this.gameState.sortHandTiles();
    this.refreshAllSeats();

    // Trigger cascading 3D spin animation on hand tiles across all seats
    this.seatContainers.forEach((container) => {
      container.animateTileSortSpin();
    });

    // Human player hand ripple lift
    const humanContainer = this.seatContainers[0];
    if (this.tweens && humanContainer) {
      this.tweens.add({
        targets: humanContainer,
        y: { from: 655, to: 645 },
        duration: 400,
        ease: 'Back.easeOut',
      });
    }

    // Proceed to multi-round flower replacement after sorting
    this.time.delayedCall(700, () => {
      this.gameState.startFlowerReplacement();
    });
  }

  /**
   * In-turn step-by-step visual flower replacement sequence:
   * 1. 摸到花要有時間顯示花 (shown in drawn slot for 550ms)
   * 2. 然後置放到花槽後播放音效補花 (moves flower to rack & plays "補花")
   * 3. 播放完才顯示補的牌 (waits for voice complete, then displays replacement in drawn slot)
   * 4. 如果又補到花就回到第 1 步 (recursive loop until non-flower drawn)
   */
  private handleInTurnFlowerSequence(seat: PlayerSeat): void {
    const p = this.gameState.players[seat];
    if (!p.drawnTile || !p.drawnTile.isFlower) return;

    // Step 1: Flower is displayed in the drawn tile slot (refresh UI so player sees it)
    this.refreshAllSeats();
    this.updateCompass();

    this.time.delayedCall(550, () => {
      // Step 2: Move flower to flower rack & trigger "補花" voice + chime
      const rep = this.gameState.replaceDrawnFlower(seat);
      this.refreshAllSeats();
      this.updateCompass();
      this.updateTileWalls();

      // If game settled (e.g. Draw / Flower Win) or rep is null (dead wall reached), stop sequence
      if (this.gameState.phase === 'ROUND_SETTLEMENT' || this.gameState.phase === 'MATCH_OVER' || !rep) {
        return;
      }

      // Step 3: Wait for "補花" voice to completely finish, then reveal replacement tile!
      MahjongAudioService.waitForVoiceComplete().then(() => {
        this.refreshAllSeats();
        this.updateCompass();
        this.updateSmartTing();
        this.updateTileWalls();

        // Step 4: If replacement tile is ANOTHER flower, repeat from Step 1!
        if (rep && rep.isFlower) {
          this.handleInTurnFlowerSequence(seat);
        } else {
          // Normal turn continuation with the valid replacement tile
          if (seat === 0) {
            this.checkHumanSelfActions();
            const p0 = this.gameState.players[0];
            if (p0.isAutoPlay && !this.actionBarContainer.visible) {
              const canHu =
                p0.drawnTile !== null &&
                MahjongHandEvaluator.isWinningHand(p0.hand, p0.melds, p0.drawnTile);
              if (!canHu) {
                this.time.delayedCall(400, () => {
                  if (this.gameState.currentTurnSeat === 0 && this.gameState.phase === 'PLAYER_TURN') {
                    this.gameState.stepAITurn(0);
                  }
                });
              }
            }
          } else {
            this.time.delayedCall(600, () => {
              if (this.gameState.currentTurnSeat === seat && this.gameState.phase === 'PLAYER_TURN') {
                this.gameState.stepAITurn(seat);
              }
            });
          }
        }
      });
    });
  }

  private handleHumanTileClick(tileId: string): void {
    if (this.gameState.currentTurnSeat !== 0 || this.gameState.phase !== 'PLAYER_TURN') {
      return;
    }
    MahjongAudioService.playTileSelect();
    this.actionBarContainer.setVisible(false);
    this.subMenuContainer.setVisible(false);
    this.gameState.discardTile(0, tileId);
  }

  private handleHumanTileHover(code: string | null): void {
    this.seatContainers.forEach((c) => c.highlightMatchingDiscards(code));
  }

  private updateCompass(): void {
    const winds = ['東', '南', '西', '北'];
    const roundWind = winds[this.gameState.roundWindIndex] || '東';
    const windChars: Record<string, string> = {
      EAST: '東',
      SOUTH: '南',
      WEST: '西',
      NORTH: '北',
    };
    const dealer = this.gameState.players[this.gameState.dealerSeat];
    const dealerWind = windChars[dealer.wind] || '東';
    this.roundWindText.setText(`${roundWind}風${dealerWind}`);

    // Update 4 cardinal Seat Wind labels around compass dial (fixed after seating)
    for (let i = 0; i < 4; i++) {
      const p = this.gameState.players[i];
      if (p && this.compassSeatWindTexts[i]) {
        const char = windChars[p.wind] || '東';
        this.compassSeatWindTexts[i].setText(char);
      }
    }

    const streak = this.gameState.dealerStreak;
    this.dealerStreakText.setText(`連 ${streak} 拉 ${streak}`);

    const remaining = this.gameState.deck.getRegularRemainingCount();
    this.remainingTilesText.setText(`餘 ${remaining} 張`);

    // Render outer rim chevron pointer (does not obscure center text)
    this.turnPointer.clear();
    const seatAngles = [90, 0, 270, 180]; // Screen direction towards seat 0,1,2,3
    const targetAngle = seatAngles[this.gameState.currentTurnSeat];
    const rad = Phaser.Math.DegToRad(targetAngle);

    const cx = 640;
    const cy = 360;
    const rInner = 56;
    const rOuter = 66;

    // Glowing gold outer accent arc on active player's rim (35 deg arc)
    if (typeof this.turnPointer.arc === 'function') {
      this.turnPointer.lineStyle(3, 0xfacc15, 0.95);
      this.turnPointer.beginPath();
      this.turnPointer.arc(cx, cy, 63, rad - 0.32, rad + 0.32, false);
      this.turnPointer.strokePath();
    }

    // Sleek chevron arrow head pointing outward toward active seat
    const tipX = cx + Math.cos(rad) * (rOuter + 3);
    const tipY = cy + Math.sin(rad) * (rOuter + 3);
    const leftX = cx + Math.cos(rad - 0.18) * rInner;
    const leftY = cy + Math.sin(rad - 0.18) * rInner;
    const rightX = cx + Math.cos(rad + 0.18) * rInner;
    const rightY = cy + Math.sin(rad + 0.18) * rInner;

    this.turnPointer.fillStyle(0xfacc15, 1);
    this.turnPointer.beginPath();
    this.turnPointer.moveTo(tipX, tipY);
    this.turnPointer.lineTo(leftX, leftY);
    this.turnPointer.lineTo(rightX, rightY);
    this.turnPointer.closePath();
    this.turnPointer.fill();
  }

  private refreshAllSeats(revealAllHands: boolean = false): void {
    const lastSeat = this.gameState.lastDiscard?.fromSeat;
    for (let i = 0; i < 4; i++) {
      const p = this.gameState.players[i];
      this.seatContainers[i].renderPlayerState(p, p.isHuman, lastSeat === i, revealAllHands, this.gameState.roundWind);
    }
    this.updateBankerDicePosition();
    this.updateCompass();
  }

  private updateSmartTing(): void {
    const p1 = this.gameState.players[0];
    const tingInfo = MahjongHandEvaluator.evaluateTing(
      p1.hand,
      p1.melds,
      this.gameState.getAllVisibleTiles()
    );

    if (tingInfo.winningTiles.length > 0) {
      this.tingContainer.setVisible(true);

      const tileSummary = tingInfo.winningTiles
        .map((t) => `${t.tileName} (${t.remainingCount}張)`)
        .join(' ');
      const statusLabel = p1.isAutoPlay ? ' [極速託管中]' : p1.isTing ? ' [已聽牌]' : '';
      this.tingText.setText(`聽牌: ${tileSummary}${statusLabel}`);
      this.tingAutoBtn.setVisible(!p1.isAutoPlay);
    } else {
      this.tingContainer.setVisible(false);
    }
  }

  private checkHumanSelfActions(): void {
    const p1 = this.gameState.players[0];
    const fullHand = p1.drawnTile ? [...p1.hand, p1.drawnTile] : p1.hand;

    const canHu =
      p1.drawnTile !== null &&
      MahjongHandEvaluator.isWinningHand(p1.hand, p1.melds, p1.drawnTile);

    const kongOptions = MahjongHandEvaluator.getSelfKongOptions(fullHand, p1.melds);

    // If player is in auto-play mode (託管模式):
    if (p1.isAutoPlay) {
      this.actionBarContainer.setVisible(false);
      this.subMenuContainer.setVisible(false);
      if (canHu) {
        // Auto-Hu on Self-Draw (自摸自動胡牌)
        this.time.delayedCall(400, () => {
          if (this.gameState.currentTurnSeat === 0 && this.gameState.phase === 'PLAYER_TURN') {
            this.gameState.settleWin(0, true);
          }
        });
      }
      return;
    }

    if (canHu || kongOptions.length > 0) {
      this.showActionBar({
        canHu,
        canKong: kongOptions.length > 0,
        kongOptions: kongOptions.map((k) => ({
          type: k.type,
          tileCode: k.tileCode,
          handTileIds: k.handTileIds,
        })),
        canPong: false,
        canChow: false,
        chowOptions: [],
        canTing: false,
        canPass: true,
      });
    } else {
      this.actionBarContainer.setVisible(false);
    }
  }

  private checkHumanClaimActions(): void {
    const p1 = this.gameState.players[0];
    if (p1.isAutoPlay) {
      this.actionBarContainer.setVisible(false);
      this.subMenuContainer.setVisible(false);
      return;
    }

    const last = this.gameState.lastDiscard;
    if (!last || last.fromSeat === 0) return;

    const fullHand = [...p1.hand];
    const fromSeat = last.fromSeat;

    const canHu =
      !p1.isPassLockout &&
      MahjongHandEvaluator.isWinningHand(p1.hand, p1.melds, last.tile);

    const canPong = MahjongHandEvaluator.canPong(fullHand, last.tile, p1.passPongCodesInTurn);
    const canKong = MahjongHandEvaluator.canMeldedKong(fullHand, last.tile, fromSeat, 0);
    const chowOptions = MahjongHandEvaluator.getChowOptions(fullHand, last.tile, fromSeat, 0);

    if (canHu || canPong || canKong || chowOptions.length > 0) {
      this.showActionBar({
        canHu,
        canPong,
        canKong,
        kongOptions: canKong
          ? [
              {
                type: 'MELDED_KONG',
                tileCode: last.tile.shortCode,
                handTileIds: fullHand.filter((t) => t.shortCode === last.tile.shortCode).map((t) => t.id),
              },
            ]
          : [],
        canChow: chowOptions.length > 0,
        chowOptions,
        canTing: false,
        canPass: true,
      });
    } else {
      this.actionBarContainer.setVisible(false);
    }
  }

  private showActionBar(actions: AvailableActions): void {
    if (this.gameState.players[0].isAutoPlay) {
      this.actionBarContainer.setVisible(false);
      this.subMenuContainer.setVisible(false);
      return;
    }

    this.actionBarContainer.removeAll(true);
    this.actionBarContainer.setVisible(true);

    const buttons: { key: string; label: string; action: () => void }[] = [];

    if (actions.canHu) {
      buttons.push({
        key: 'action_btn_hu',
        label: '胡',
        action: () => {
          this.actionBarContainer.setVisible(false);
          this.subMenuContainer.setVisible(false);
          if (this.gameState.currentTurnSeat === 0 && this.gameState.phase === 'PLAYER_TURN') {
            this.gameState.settleWin(0, true);
          } else {
            this.gameState.humanRespondAction('HU');
          }
        },
      });
    }

    if (actions.canKong) {
      buttons.push({
        key: 'action_btn_kong',
        label: '槓',
        action: () => {
          if (actions.kongOptions.length === 1) {
            this.actionBarContainer.setVisible(false);
            this.subMenuContainer.setVisible(false);
            if (this.gameState.phase === 'PLAYER_TURN') {
              const kong = actions.kongOptions[0];
              this.gameState.performSelfKong(0, kong as any);
              this.refreshAllSeats();
            } else {
              this.gameState.humanRespondAction('KONG');
            }
          } else if (actions.kongOptions.length > 1) {
            this.showKongSubMenu(actions.kongOptions as any);
          }
        },
      });
    }

    if (actions.canPong) {
      buttons.push({
        key: 'action_btn_pong',
        label: '碰',
        action: () => {
          this.actionBarContainer.setVisible(false);
          this.subMenuContainer.setVisible(false);
          this.gameState.humanRespondAction('PONG');
        },
      });
    }

    if (actions.canChow) {
      buttons.push({
        key: 'action_btn_chow',
        label: '吃',
        action: () => {
          if (actions.chowOptions.length === 1) {
            this.actionBarContainer.setVisible(false);
            this.subMenuContainer.setVisible(false);
            this.gameState.humanRespondAction('CHOW', actions.chowOptions[0]);
          } else {
            this.showChowSubMenu(actions.chowOptions);
          }
        },
      });
    }

    if (actions.canPass) {
      buttons.push({
        key: 'action_btn_pass',
        label: '過',
        action: () => {
          this.actionBarContainer.setVisible(false);
          this.subMenuContainer.setVisible(false);
          if (this.gameState.phase === 'ACTION_WAIT') {
            this.gameState.humanRespondAction('PASS');
          }
        },
      });
    }

    const spacing = 65;
    const startX = -((buttons.length - 1) * spacing) / 2;

    buttons.forEach((btn, idx) => {
      const sprite = this.add.sprite(startX + idx * spacing, 0, `mahjong:${btn.key}`);
      sprite.setInteractive({ useHandCursor: true });
      sprite.on('pointerdown', btn.action);
      this.actionBarContainer.add(sprite);
    });
  }

  private showKongSubMenu(options: KongOption[]): void {
    this.subMenuContainer.removeAll(true);
    this.subMenuContainer.setVisible(true);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.95);
    bg.fillRoundedRect(-160, -30, 320, 60, 8);
    bg.lineStyle(1, 0xef4444, 0.8);
    bg.strokeRoundedRect(-160, -30, 320, 60, 8);
    this.subMenuContainer.add(bg);

    options.forEach((opt, idx) => {
      const optBtn = this.add.container((idx - (options.length - 1) / 2) * 90, 0);
      const labelText = opt.type === 'CONCEALED_KONG' ? `暗槓 ${opt.tileCode}` : `加槓 ${opt.tileCode}`;
      const label = this.add.text(0, 0, labelText, {
        fontSize: '12px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#f87171',
        fontStyle: 'bold',
      });
      label.setOrigin(0.5);
      label.setInteractive({ useHandCursor: true });

      label.on('pointerdown', () => {
        this.subMenuContainer.setVisible(false);
        this.actionBarContainer.setVisible(false);
        if (this.gameState.phase === 'PLAYER_TURN') {
          this.gameState.performSelfKong(0, opt);
          this.refreshAllSeats();
        } else {
          this.gameState.humanRespondAction('KONG');
        }
      });

      optBtn.add(label);
      this.subMenuContainer.add(optBtn);
    });
  }

  private showChowSubMenu(options: ChowOption[]): void {
    this.subMenuContainer.removeAll(true);
    this.subMenuContainer.setVisible(true);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.95);
    bg.fillRoundedRect(-160, -30, 320, 60, 8);
    bg.lineStyle(1, 0x3b82f6, 0.8);
    bg.strokeRoundedRect(-160, -30, 320, 60, 8);
    this.subMenuContainer.add(bg);

    options.forEach((opt, idx) => {
      const optBtn = this.add.container((idx - (options.length - 1) / 2) * 90, 0);
      const text = opt.tiles.map((t) => t.name).join('');

      const label = this.add.text(0, 0, text, {
        fontSize: '12px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#60a5fa',
        fontStyle: 'bold',
      });
      label.setOrigin(0.5);
      label.setInteractive({ useHandCursor: true });

      label.on('pointerdown', () => {
        this.subMenuContainer.setVisible(false);
        this.actionBarContainer.setVisible(false);
        this.gameState.humanRespondAction('CHOW', opt);
      });

      optBtn.add(label);
      this.subMenuContainer.add(optBtn);
    });
  }

  private showSettlementWindow(breakdown: SettlementBreakdown): void {
    MahjongAudioService.stopBGM();
    MahjongAudioService.playVictory();

    // 2.1 Reveal all 4 players' hands for player review
    this.refreshAllSeats(true);

    this.settlementContainer.removeAll(true);
    this.settlementContainer.setVisible(true);

    const bg = this.add.graphics();
    bg.fillStyle(0x020617, 0.96);
    bg.fillRoundedRect(-310, -240, 620, 480, 16);
    bg.lineStyle(2, 0xd4af37, 1);
    bg.strokeRoundedRect(-310, -240, 620, 480, 16);
    this.settlementContainer.add(bg);

    const isDraw = breakdown.isDraw;
    const winner = this.gameState.players[breakdown.winnerSeat];
    const loser = breakdown.loserSeat !== undefined ? this.gameState.players[breakdown.loserSeat] : null;

    // 2.3 Title showing winner & who discarded (放槍者)
    let titleText = '=== 流局 (荒莊，莊家連莊) ===';
    if (!isDraw) {
      if (breakdown.isSelfDrawn) {
        titleText = `=== 【${winner.name}】 自摸胡牌！ ===`;
      } else if (loser) {
        titleText = `=== 【${winner.name}】 胡牌！ (${loser.name} 放槍) ===`;
      } else {
        titleText = `=== 【${winner.name}】 胡牌！ ===`;
      }
    }

    const title = this.add.text(0, -215, titleText, {
      fontSize: '20px',
      fontFamily: '"Microsoft JhengHei", serif',
      color: '#facc15',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.settlementContainer.add(title);

    // 1. Visual Winning Hand (圖形牌型展示，包含副露、立牌、胡牌、花牌)
    let curY = -185;
    if (!isDraw) {
      const patternLabel = this.add.text(-285, curY, '胡牌牌型:', {
        fontSize: '12px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#93c5fd',
        fontStyle: 'bold',
      });
      this.settlementContainer.add(patternLabel);

      let tileX = -215;
      const tileW = 20;
      const tileH = 28;

      // 1.1 Render Melds
      winner.melds.forEach((meld) => {
        meld.tiles.forEach((t) => {
          const sp = this.add.sprite(tileX + tileW / 2, curY + 14, `mahjong:tile_${t.shortCode}`);
          sp.setDisplaySize(tileW, tileH);
          this.settlementContainer.add(sp);
          tileX += tileW + 1;
        });
        tileX += 4; // gap between melds
      });

      // 1.2 Render Concealed Hand
      winner.hand.forEach((t) => {
        const sp = this.add.sprite(tileX + tileW / 2, curY + 14, `mahjong:tile_${t.shortCode}`);
        sp.setDisplaySize(tileW, tileH);
        this.settlementContainer.add(sp);
        tileX += tileW + 1;
      });

      // 1.3 Render Winning Tile (with gap & neon cyan focus box + '胡' badge)
      const winTile = breakdown.winningTile || winner.drawnTile || this.gameState.lastDiscard?.tile;
      if (winTile) {
        tileX += 6;
        const winBox = this.add.graphics();
        winBox.lineStyle(2, 0x00f0ff, 1);
        winBox.strokeRoundedRect(tileX, curY, tileW - 2, tileH - 2, 3);
        this.settlementContainer.add(winBox);

        const sp = this.add.sprite(tileX + tileW / 2, curY + 14, `mahjong:tile_${winTile.shortCode}`);
        sp.setDisplaySize(tileW, tileH);
        this.settlementContainer.add(sp);

        const winBadge = this.add.text(tileX + tileW / 2, curY - 7, '胡', {
          fontSize: '10px',
          fontFamily: '"Microsoft JhengHei", sans-serif',
          color: '#ef4444',
          fontStyle: 'bold',
        });
        winBadge.setOrigin(0.5);
        this.settlementContainer.add(winBadge);
        tileX += tileW + 6;
      }

      // 1.4 Render Winner's Flowers (🌸 花牌)
      if (winner.flowers && winner.flowers.length > 0) {
        tileX += 8;
        const flowerLabel = this.add.text(tileX, curY + 6, '🌸花:', {
          fontSize: '11px',
          fontFamily: '"Microsoft JhengHei", sans-serif',
          color: '#f472b6',
          fontStyle: 'bold',
        });
        this.settlementContainer.add(flowerLabel);
        tileX += 34;

        winner.flowers.forEach((flower) => {
          const sp = this.add.sprite(tileX + tileW / 2, curY + 14, `mahjong:tile_${flower.shortCode}`);
          sp.setDisplaySize(tileW, tileH);
          this.settlementContainer.add(sp);

          // Check if this flower is positive flower for winner
          const winnerWind = ['EAST', 'SOUTH', 'WEST', 'NORTH'][(winner.seat - this.gameState.dealerSeat + 4) % 4];
          const posIndices: Record<string, string[]> = {
            EAST: ['1f', '5f'],
            SOUTH: ['2f', '6f'],
            WEST: ['3f', '7f'],
            NORTH: ['4f', '8f'],
          };
          const isPos = (posIndices[winnerWind] || []).includes(flower.shortCode);
          if (isPos) {
            const fBox = this.add.graphics();
            fBox.lineStyle(1.5, 0xf97316, 1);
            fBox.strokeRoundedRect(tileX, curY, tileW - 2, tileH - 2, 2);
            this.settlementContainer.add(fBox);
          }

          tileX += tileW + 1;
        });
      }

      curY += 38;
    } else {
      curY += 10;
    }

    // 2. Fan Breakdown Box (條列式明細 + 總計台數)
    const fanBoxHeight = isDraw ? 50 : 125;
    const fanBoxBg = this.add.graphics();
    fanBoxBg.fillStyle(0x0f172a, 0.85);
    fanBoxBg.fillRoundedRect(-285, curY, 570, fanBoxHeight, 8);
    fanBoxBg.lineStyle(1, 0x334155, 0.8);
    fanBoxBg.strokeRoundedRect(-285, curY, 570, fanBoxHeight, 8);
    this.settlementContainer.add(fanBoxBg);

    let fanY = curY + 8;
    if (isDraw) {
      const drawLine = this.add.text(-270, fanY + 8, '海底牌盡無人胡牌，莊家連莊保留莊位', {
        fontSize: '13px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#94a3b8',
      });
      this.settlementContainer.add(drawLine);
    } else {
      // 3. Bulleted Fan List (條列式台數清單, 2-column grid)
      const fans = breakdown.fans;
      fans.forEach((f, idx) => {
        const col = idx % 2;
        const row = Math.floor(idx / 2);
        const fx = col === 0 ? -270 : 10;
        const fy = fanY + row * 18;

        const fanLine = this.add.text(fx, fy, `• ${f.name} (+${f.fan}台)`, {
          fontSize: '12px',
          fontFamily: '"Microsoft JhengHei", sans-serif',
          color: '#f8fafc',
        });
        this.settlementContainer.add(fanLine);
      });

      const maxFanRows = Math.ceil(fans.length / 2);
      let dealerY = fanY + Math.max(maxFanRows * 18, 20);

      // Dealer Streak liability line with precise phrasing
      let dealerNote = '';
      if (breakdown.winnerSeat === this.gameState.dealerSeat) {
        dealerNote = `• 莊家獲勝加計: 莊家 1台 + 連${breakdown.dealerStreak}拉${breakdown.dealerStreak} ${2 * breakdown.dealerStreak}台 (計加收 ${breakdown.dealerMultiplierFan}台)`;
      } else if (breakdown.loserSeat === this.gameState.dealerSeat) {
        dealerNote = `• 莊家放槍額外負擔: 莊家 1台 + 連${breakdown.dealerStreak}拉${breakdown.dealerStreak} ${2 * breakdown.dealerStreak}台 (計加收 ${breakdown.dealerMultiplierFan}台)`;
      } else if (breakdown.isSelfDrawn) {
        dealerNote = `• 閒家自摸莊家額外賠付: 莊家 1台 + 連${breakdown.dealerStreak}拉${breakdown.dealerStreak} ${2 * breakdown.dealerStreak}台 (莊家加賠 ${breakdown.dealerMultiplierFan}台)`;
      }

      if (dealerNote) {
        const dealerText = this.add.text(-270, dealerY, dealerNote, {
          fontSize: '12px',
          fontFamily: '"Microsoft JhengHei", sans-serif',
          color: '#fbbf24',
        });
        this.settlementContainer.add(dealerText);
        dealerY += 18;
      }

      // 4. Prominent Total Fans Banner (總計台數)
      const totalFansLine = this.add.text(
        -270,
        curY + fanBoxHeight - 22,
        `【 總計台數: ${breakdown.totalFans} 台 】 (底 500 點 / 台 200 點)`,
        {
          fontSize: '13px',
          fontFamily: '"Microsoft JhengHei", sans-serif',
          color: '#38bdf8',
          fontStyle: 'bold',
        }
      );
      this.settlementContainer.add(totalFansLine);
    }

    curY += fanBoxHeight + 12;

    // 2.3 Four-player Ledger Table (四家點數計算清單，精確座標對齊)
    const colX = {
      seat: -280,
      wind: -140,
      id: -75,
      role: -10,
      delta: 140,
      chips: 280,
    };

    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x1e293b, 0.7);
    headerBg.fillRoundedRect(-285, curY - 2, 570, 20, 4);
    this.settlementContainer.add(headerBg);

    const h1 = this.add.text(colX.seat, curY, '座位 / 玩家', { fontSize: '11px', fontFamily: '"Microsoft JhengHei", sans-serif', color: '#94a3b8', fontStyle: 'bold' });
    const h2 = this.add.text(colX.wind, curY, '門風', { fontSize: '11px', fontFamily: '"Microsoft JhengHei", sans-serif', color: '#94a3b8', fontStyle: 'bold' });
    const h3 = this.add.text(colX.id, curY, '身份', { fontSize: '11px', fontFamily: '"Microsoft JhengHei", sans-serif', color: '#94a3b8', fontStyle: 'bold' });
    const h4 = this.add.text(colX.role, curY, '勝負角色', { fontSize: '11px', fontFamily: '"Microsoft JhengHei", sans-serif', color: '#94a3b8', fontStyle: 'bold' });
    const h5 = this.add.text(colX.delta, curY, '點數變動', { fontSize: '11px', fontFamily: '"Microsoft JhengHei", sans-serif', color: '#94a3b8', fontStyle: 'bold' }).setOrigin(1, 0);
    const h6 = this.add.text(colX.chips, curY, '剩餘籌碼', { fontSize: '11px', fontFamily: '"Microsoft JhengHei", sans-serif', color: '#94a3b8', fontStyle: 'bold' }).setOrigin(1, 0);
    this.settlementContainer.add([h1, h2, h3, h4, h5, h6]);

    curY += 22;

    const arrows = ['▼', '▶', '▲', '◀'];
    const windNames: Record<string, string> = {
      EAST: '東風',
      SOUTH: '南風',
      WEST: '西風',
      NORTH: '北風',
    };

    for (let i = 0; i < 4; i++) {
      const p = this.gameState.players[i];
      const isWinner = !isDraw && breakdown.winnerSeat === i;
      const isLoser = !isDraw && breakdown.loserSeat === i;
      const isVictim = !isDraw && ((breakdown.isSelfDrawn && !isWinner) || isLoser);

      const roleText = isDraw
        ? '流局'
        : isWinner
        ? breakdown.isSelfDrawn
          ? '自摸'
          : '胡牌'
        : breakdown.isSelfDrawn
        ? '被自摸'
        : isLoser
        ? '放槍'
        : '陪打';

      const delta = breakdown.chipDeltas[i];
      const deltaStr = delta > 0 ? `+${delta.toLocaleString()} 點` : delta < 0 ? `${delta.toLocaleString()} 點` : '0 點';
      const remainingStr = `${breakdown.remainingChips[i].toLocaleString()} 點`;

      const rowColor = isWinner ? '#4ade80' : isVictim ? '#f87171' : '#94a3b8';
      const fontStyle = isWinner || p.isDealer ? 'bold' : 'normal';

      if (i % 2 === 1) {
        const rowBg = this.add.graphics();
        rowBg.fillStyle(0x1e293b, 0.35);
        rowBg.fillRoundedRect(-285, curY - 2, 570, 18, 2);
        this.settlementContainer.add(rowBg);
      }

      const tSeat = this.add.text(colX.seat, curY, `${arrows[i]} ${p.name}`, { fontSize: '12px', fontFamily: '"Microsoft JhengHei", sans-serif', color: rowColor, fontStyle });
      const tWind = this.add.text(colX.wind, curY, windNames[p.wind] || '東風', { fontSize: '12px', fontFamily: '"Microsoft JhengHei", sans-serif', color: rowColor, fontStyle });
      const tId = this.add.text(colX.id, curY, p.isDealer ? '莊家' : '閒家', { fontSize: '12px', fontFamily: '"Microsoft JhengHei", sans-serif', color: p.isDealer ? '#fbbf24' : rowColor, fontStyle });
      const tRole = this.add.text(colX.role, curY, roleText, { fontSize: '12px', fontFamily: '"Microsoft JhengHei", sans-serif', color: isWinner ? '#4ade80' : isVictim ? '#f87171' : '#94a3b8', fontStyle });
      const tDelta = this.add.text(colX.delta, curY, deltaStr, { fontSize: '12px', fontFamily: '"Microsoft JhengHei", sans-serif', color: delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : '#94a3b8', fontStyle }).setOrigin(1, 0);
      const tChips = this.add.text(colX.chips, curY, remainingStr, { fontSize: '12px', fontFamily: '"Microsoft JhengHei", sans-serif', color: '#e2e8f0', fontStyle }).setOrigin(1, 0);

      this.settlementContainer.add([tSeat, tWind, tId, tRole, tDelta, tChips]);
      curY += 20;
    }

    // Continue Button (繼續下一局)
    const nextBtn = this.add.graphics();
    nextBtn.fillStyle(0x2563eb, 1);
    nextBtn.fillRoundedRect(-80, 195, 160, 34, 6);
    nextBtn.lineStyle(1, 0x93c5fd, 0.8);
    nextBtn.strokeRoundedRect(-80, 195, 160, 34, 6);
    this.settlementContainer.add(nextBtn);

    const nextTxt = this.add.text(0, 212, '繼續下一局', {
      fontSize: '14px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    nextTxt.setOrigin(0.5);
    this.settlementContainer.add(nextTxt);

    nextBtn.setInteractive(new Phaser.Geom.Rectangle(-80, 195, 160, 34), Phaser.Geom.Rectangle.Contains);
    nextBtn.on('pointerdown', () => {
      this.settlementContainer.setVisible(false);
      this.refreshAllSeats(false);
      MahjongAudioService.playBGM();
      this.gameState.startDealing(false);
    });
  }

  private showGameOverModal(summary: { score: number; cleared: boolean; reason: string }): void {
    MahjongAudioService.stopBGM();
    if (summary.cleared) {
      MahjongAudioService.playVictory();
    } else {
      MahjongAudioService.playGameOver();
    }

    const modal = this.add.container(640, 360);
    const bg = this.add.graphics();
    bg.fillStyle(0x020617, 0.98);
    bg.fillRoundedRect(-220, -140, 440, 280, 16);
    bg.lineStyle(2, summary.cleared ? 0xd4af37 : 0xef4444, 1);
    bg.strokeRoundedRect(-220, -140, 440, 280, 16);
    modal.add(bg);

    const title = this.add.text(0, -90, summary.cleared ? '🎉 通關大勝利！' : '💀 GAME OVER', {
      fontSize: '24px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: summary.cleared ? '#facc15' : '#ef4444',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    const reason = this.add.text(0, -40, summary.reason, {
      fontSize: '14px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#cbd5e1',
    });
    reason.setOrigin(0.5);

    const score = this.add.text(0, 10, `最終積分: ${summary.score.toLocaleString()} 點`, {
      fontSize: '18px',
      fontFamily: 'monospace',
      color: '#38bdf8',
      fontStyle: 'bold',
    });
    score.setOrigin(0.5);

    modal.add([title, reason, score]);

    // Emit GAME_OVER to Arcade Stadium Bridge
    if (summary.cleared) {
      ArcadeBridge.emit('GAME_OVER', {
        gameId: 'mahjong',
        score: summary.score,
        playTimeSeconds: 120,
        creditsUsed: 1,
      });
    }
  }

  public setPauseState(paused: boolean): void {
    this.isPausedState = paused;
    if (paused) {
      MahjongAudioService.stopBGM();
    } else {
      MahjongAudioService.playBGM();
    }
  }

  private handleShutdown(): void {
    MahjongAudioService.stopBGM();
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.handleShutdown, this);
  }
}

