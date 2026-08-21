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
  SeatWind,
  SettlementBreakdown,
  GamePhase,
  AvailableActions,
  ChowOption,
  KongOption,
  Tile,
  SeatingDrawDetails,
  SeatingDrawPlayerInfo,
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

  // Latest Discard Indicator (Multi-layer pulsing glow frame)
  private discardMarker!: Phaser.GameObjects.Container;
  private discardMarkerGlow!: Phaser.GameObjects.Graphics;
  private discardMarkerFrame!: Phaser.GameObjects.Graphics;
  private discardMarkerTween: Phaser.Tweens.Tween | null = null;

  // Smart Ting UI & Independent Auto-Play Button
  private tingContainer!: Phaser.GameObjects.Container;
  private autoPlayBtnContainer!: Phaser.GameObjects.Container;

  // Floating Action Bar (Chow, Pong, Kong, Ting, Hu, Pass)
  private actionBarContainer!: Phaser.GameObjects.Container;
  private subMenuContainer!: Phaser.GameObjects.Container;

  // Settlement Window
  private settlementContainer!: Phaser.GameObjects.Container;

  // Seating Draw Cinematic Sequence
  private seatingCinematicContainer!: Phaser.GameObjects.Container;

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
    this.createSeatingCinematicUI();

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
   * Creates the 4 physical 3D Tile Walls enclosing the central discard rivers & compass.
   */
  private createTileWalls(): void {
    this.wallContainer = this.add.container(0, 0);
    this.wallSprites = [];

    const stacksPerSide = 18;
    const step = 20;

    // Clockwise Wall Progression enclosing the 4/6/8 trapezoid discard rivers & compass (265px radius):
    // 1. South Wall (Bottom): Right to Left (0 to 17)
    for (let i = 0; i < stacksPerSide; i++) {
      const x = 810 - i * step;
      const y = 625;
      const sprite = this.add.sprite(x, y, 'mahjong:wall_tile_stack');
      this.wallSprites.push(sprite);
      this.wallContainer.add(sprite);
    }

    // 2. West Wall (Left): Bottom to Top (18 to 35)
    for (let i = 0; i < stacksPerSide; i++) {
      const x = 375;
      const y = 530 - i * step;
      const sprite = this.add.sprite(x, y, 'mahjong:wall_tile_stack');
      sprite.setAngle(90);
      this.wallSprites.push(sprite);
      this.wallContainer.add(sprite);
    }

    // 3. North Wall (Top): Left to Right (36 to 53)
    for (let i = 0; i < stacksPerSide; i++) {
      const x = 470 + i * step;
      const y = 95;
      const sprite = this.add.sprite(x, y, 'mahjong:wall_tile_stack');
      this.wallSprites.push(sprite);
      this.wallContainer.add(sprite);
    }

    // 4. East Wall (Right): Top to Bottom (54 to 71)
    for (let i = 0; i < stacksPerSide; i++) {
      const x = 905;
      const y = 190 + i * step;
      const sprite = this.add.sprite(x, y, 'mahjong:wall_tile_stack');
      sprite.setAngle(90);
      this.wallSprites.push(sprite);
      this.wallContainer.add(sprite);
    }
  }

  private updateTileWalls(): void {
    this.wallSprites.forEach((sprite, idx) => {
      const count = this.gameState.deck.getStackRemainingTileCount(idx);
      const isIron = this.gameState.deck.isStackInDeadWall(idx);
      const targetTexture = isIron ? 'mahjong:wall_tile_stack_iron' : 'mahjong:wall_tile_stack';
      if (sprite.texture?.key !== targetTexture && this.textures?.exists?.(targetTexture)) {
        sprite.setTexture(targetTexture);
      }
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

  // Central Compass Integrated 4-Player HUD
  private compassPlayerContainers: Phaser.GameObjects.Container[] = [];
  private compassPlayerTexts: Phaser.GameObjects.Text[] = [];
  private compassPlayerChipsTexts: Phaser.GameObjects.Text[] = [];
  private compassPlayerBgs: Phaser.GameObjects.Graphics[] = [];

  private createCentralCompass(): void {
    const cx = 640;
    const cy = 360;

    const dial = this.add.sprite(cx, cy, 'mahjong:compass_dial');
    dial.setDisplaySize(156, 156);
    this.compassDial = dial;

    // Turn pointer (Breathing gold needle)
    this.turnPointer = this.add.graphics();

    // Center Round Wind / Tile Info Core
    this.roundWindText = this.add.text(cx, cy - 14, '東風東', {
      fontSize: '12px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#facc15',
      fontStyle: 'bold',
      resolution: 2,
    }).setOrigin(0.5);

    this.dealerStreakText = this.add.text(cx, cy, '連 0 拉 0', {
      fontSize: '11px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#94a3b8',
      fontStyle: 'bold',
      resolution: 2,
    }).setOrigin(0.5);

    this.remainingTilesText = this.add.text(cx, cy + 14, '餘 70 張', {
      fontSize: '11px',
      fontFamily: '"Microsoft JhengHei", "Roboto Mono", Consolas, monospace',
      color: '#38bdf8',
      fontStyle: 'bold',
      resolution: 2,
    }).setOrigin(0.5);

    // 4 Integrated Player HUD Strips around the 4 borders of the square compass:
    // Seat 0: Bottom (Human), Seat 1: Right (AI), Seat 2: Top (AI), Seat 3: Left (AI)
    const hudConfigs = [
      { x: cx, y: cy + 53, angle: 0 },    // Seat 0 (Bottom)
      { x: cx + 53, y: cy, angle: 270 },  // Seat 1 (Right)
      { x: cx, y: cy - 53, angle: 180 },  // Seat 2 (Top)
      { x: cx - 53, y: cy, angle: 90 },   // Seat 3 (Left)
    ];

    this.compassPlayerContainers = [];
    this.compassPlayerTexts = [];
    this.compassPlayerChipsTexts = [];
    this.compassPlayerBgs = [];

    hudConfigs.forEach((cfg) => {
      const container = this.add.container(cfg.x, cfg.y);
      container.setAngle(cfg.angle);

      const bg = this.add.graphics();
      container.add(bg);
      this.compassPlayerBgs.push(bg);

      // Line 1: [風位] 玩家名
      const pText = this.add.text(0, -6, '[東] 玩家', {
        fontSize: '11px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#f8fafc',
        fontStyle: 'bold',
        resolution: 2,
      }).setOrigin(0.5);
      container.add(pText);
      this.compassPlayerTexts.push(pText);

      // Line 2: 籌碼點數 (11px bold high-res crisp font)
      const chipsText = this.add.text(0, 6, '10,000 點', {
        fontSize: '11px',
        fontFamily: '"Microsoft JhengHei", "Roboto Mono", Consolas, sans-serif',
        color: '#facc15',
        fontStyle: 'bold',
        resolution: 2,
      }).setOrigin(0.5);
      container.add(chipsText);
      this.compassPlayerChipsTexts.push(chipsText);

      this.compassPlayerContainers.push(container);
    });

    // Backwards compatibility list
    this.compassSeatWindTexts = this.compassPlayerTexts;

    // Dice Container for roll animation
    this.diceContainer = this.add.container(cx, cy);
    this.diceContainer.setVisible(false);

    // Persistent Banker Dice outside compass facing Banker's seat
    this.bankerDiceOutsideCompassContainer = this.add.container(0, 0);
    this.bankerDiceOutsideCompassContainer.setDepth(15);
  }

  private createSeats(): void {
    const seatConfigs = [
      { x: 640, y: 680, angle: 0, seat: 0 as PlayerSeat },
      { x: 1180, y: 360, angle: 270, seat: 1 as PlayerSeat },
      { x: 640, y: 40, angle: 180, seat: 2 as PlayerSeat },
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
    // Build a Container with two layers: outer diffuse glow + inner sharp frame
    this.discardMarker = this.add.container(0, 0);
    this.discardMarker.setDepth(50);
    this.discardMarker.setVisible(false);

    // Outer glow (wider, semi-transparent amber-orange)
    this.discardMarkerGlow = this.add.graphics();
    this.discardMarkerGlow.lineStyle(6, 0xff9900, 0.55);
    this.discardMarkerGlow.strokeRoundedRect(-20, -26, 38, 50, 5);
    this.discardMarkerGlow.lineStyle(4, 0xffcc00, 0.3);
    this.discardMarkerGlow.strokeRoundedRect(-22, -28, 42, 54, 7);
    this.discardMarker.add(this.discardMarkerGlow);

    // Inner crisp neon-orange frame
    this.discardMarkerFrame = this.add.graphics();
    this.discardMarkerFrame.lineStyle(3, 0xff6600, 1);
    this.discardMarkerFrame.strokeRoundedRect(-18, -24, 34, 46, 3);
    this.discardMarkerFrame.lineStyle(1.5, 0xffee00, 0.9);
    this.discardMarkerFrame.strokeRoundedRect(-17, -23, 32, 44, 2);
    this.discardMarker.add(this.discardMarkerFrame);
  }

  private highlightLatestDiscard(seat: PlayerSeat, _tile: Tile): void {
    const pos = this.seatContainers[seat].getLatestDiscardWorldPosition();
    if (!pos) {
      this.discardMarker.setVisible(false);
      if (this.discardMarkerTween) {
        this.discardMarkerTween.stop();
        this.discardMarkerTween = null;
      }
      return;
    }
    const seatAngles = [0, 270, 180, 90];
    this.discardMarker.setPosition(pos.x, pos.y);
    this.discardMarker.setAngle(seatAngles[seat]);
    this.discardMarker.setAlpha(1);
    this.discardMarker.setVisible(true);

    // Stop any existing tween then start pulsing alpha animation
    if (this.discardMarkerTween) {
      this.discardMarkerTween.stop();
      this.discardMarkerTween = null;
    }
    this.discardMarkerTween = this.tweens.add({
      targets: this.discardMarker,
      alpha: { from: 1, to: 0.25 },
      duration: 380,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createSmartTingUI(): void {
    // Compact Smart Ting Strip aligned to Seat 1 (East) flower rack X-center (1040), vertically centered at Y=624
    this.tingContainer = this.add.container(1040, 624);
    this.tingContainer.setVisible(false);
    this.tingContainer.setDepth(90);

    // Independent Auto-Play Button positioned above Seat 0 drawn tile slot, vertically centered at Y=624
    this.autoPlayBtnContainer = this.add.container(934, 624);
    this.autoPlayBtnContainer.setVisible(false);
    this.autoPlayBtnContainer.setDepth(95);
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
        if (this.discardMarkerTween) {
          this.discardMarkerTween.stop();
          this.discardMarkerTween = null;
        }
        this.actionBarContainer.setVisible(false);
        this.subMenuContainer.setVisible(false);
        this.refreshAllSeats();
        this.updateCompass();
        this.updateTileWalls();
      },
      onSettlement: (breakdown: SettlementBreakdown) => {
        this.discardMarker.setVisible(false);
        if (this.discardMarkerTween) {
          this.discardMarkerTween.stop();
          this.discardMarkerTween = null;
        }
        this.tingContainer.setVisible(false);
        this.tingContainer.removeAll(true);
        if (this.autoPlayBtnContainer) {
          this.autoPlayBtnContainer.setVisible(false);
          this.autoPlayBtnContainer.removeAll(true);
        }
        this.actionBarContainer.setVisible(false);
        this.subMenuContainer.setVisible(false);
        MahjongAudioService.stopVoice();
        this.showSettlementWindow(breakdown);
      },
      onGameOver: (summary) => {
        this.discardMarker.setVisible(false);
        if (this.discardMarkerTween) {
          this.discardMarkerTween.stop();
          this.discardMarkerTween = null;
        }
        this.tingContainer.setVisible(false);
        this.tingContainer.removeAll(true);
        if (this.autoPlayBtnContainer) {
          this.autoPlayBtnContainer.setVisible(false);
          this.autoPlayBtnContainer.removeAll(true);
        }
        this.actionBarContainer.setVisible(false);
        this.subMenuContainer.setVisible(false);
        this.showGameOverModal(summary);
      },
    });
  }

  private createSeatingCinematicUI(): void {
    this.seatingCinematicContainer = this.add.container(0, 0);
    this.seatingCinematicContainer.setDepth(200);
    this.seatingCinematicContainer.setVisible(false);
  }

  private handlePhaseChange(phase: GamePhase): void {
    if (phase === 'SEATING_DRAW') {
      this.tingContainer.setVisible(false);
      this.tingContainer.removeAll(true);
      if (this.autoPlayBtnContainer) {
        this.autoPlayBtnContainer.setVisible(false);
        this.autoPlayBtnContainer.removeAll(true);
      }
      this.playSeatingCinematicSequence();
    } else if (phase === 'DEALING') {
      this.tingContainer.setVisible(false);
      this.tingContainer.removeAll(true);
      if (this.autoPlayBtnContainer) {
        this.autoPlayBtnContainer.setVisible(false);
        this.autoPlayBtnContainer.removeAll(true);
      }
      this.playDealerWallBreakDiceAnimation();
    }
  }

  /**
   * 1. 抓風位五部曲開局流程 (Seating Draw Cinematic Flow).
   * ① 四方牌咖就位亮相 (非羅盤)
   * ② 賭場骰盅搖骰揭盅 (3D骰子滾出點數)
   * ③ 四風洗勻依序翻牌 (3D翻牌揭曉抽到的風)
   * ④ AI 牌咖平滑換位動畫 (真人視角固定不動)
   * ⑤ 莊家加冕與平滑銜接開局
   */
  private playSeatingCinematicSequence(): void {
    this.discardMarker.setVisible(false);
    if (this.discardMarkerTween) {
      this.discardMarkerTween.stop();
      this.discardMarkerTween = null;
    }
    this.bankerDiceOutsideCompassContainer.setVisible(false);
    this.diceContainer.setVisible(false);

    // Hide central compass during Seating Draw to eliminate visual clutter
    if (this.compassDial) this.compassDial.setVisible(false);
    if (this.turnPointer) this.turnPointer.setVisible(false);
    if (this.roundWindText) this.roundWindText.setVisible(false);
    if (this.dealerStreakText) this.dealerStreakText.setVisible(false);
    if (this.remainingTilesText) this.remainingTilesText.setVisible(false);
    this.compassPlayerContainers.forEach((c) => c.setVisible(false));

    const details = this.gameState.seatingDrawDetails;
    if (!details) {
      this.finishSeatingSequence();
      return;
    }

    this.seatingCinematicContainer.removeAll(true);
    this.seatingCinematicContainer.setAlpha(1);
    this.seatingCinematicContainer.setVisible(true);

    const seatPositions = [
      { x: 640, y: 550 },  // 0: Bottom (賭神 / 真人)
      { x: 1060, y: 360 }, // 1: Right (下家)
      { x: 640, y: 155 },  // 2: Top (對家)
      { x: 220, y: 360 },  // 3: Left (上家)
    ];

    const windNames: Record<SeatWind, string> = {
      EAST: '東風',
      SOUTH: '南風',
      WEST: '西風',
      NORTH: '北風',
    };

    const windCodes: Record<SeatWind, string> = {
      EAST: 'east',
      SOUTH: 'south',
      WEST: 'west',
      NORTH: 'north',
    };

    // Dark table veil
    const veil = this.add.graphics();
    veil.fillStyle(0x000000, 0.45);
    veil.fillRect(0, 0, 1280, 720);
    this.seatingCinematicContainer.add(veil);

    // Top Cinematic Title Banner
    const bannerContainer = this.add.container(640, 50);
    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0x020617, 0.95);
    bannerBg.fillRoundedRect(-220, -24, 440, 48, 12);
    bannerBg.lineStyle(2, 0xd4af37, 0.9);
    bannerBg.strokeRoundedRect(-220, -24, 440, 48, 12);
    bannerContainer.add(bannerBg);

    const bannerText = this.add.text(0, 0, '🎲 開局抓位 決定座次 🎲', {
      fontSize: '17px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#facc15',
      fontStyle: 'bold',
    });
    bannerText.setOrigin(0.5);
    bannerContainer.add(bannerText);
    this.seatingCinematicContainer.add(bannerContainer);

    // ==========================================
    // Stage 1: Create 4 Character Cards at 4 Initial Positions
    // ==========================================
    const cardContainers: Phaser.GameObjects.Container[] = [];
    const cardWindTexts: Phaser.GameObjects.Text[] = [];

    details.players.forEach((pInfo, idx) => {
      const pos = seatPositions[idx];
      const card = this.add.container(pos.x, pos.y);

      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x020617, 0.94);
      cardBg.fillRoundedRect(-95, -40, 190, 80, 12);
      if (pInfo.isHuman) {
        cardBg.lineStyle(2.5, 0xfacc15, 1); // Gold for Human
      } else {
        const borderColors = [0x38bdf8, 0xa855f7, 0x34d399];
        cardBg.lineStyle(2, borderColors[(idx - 1) % 3], 0.85);
      }
      cardBg.strokeRoundedRect(-95, -40, 190, 80, 12);
      card.add(cardBg);

      // Avatar Icon
      const avatarText = this.add.text(-68, -14, pInfo.isHuman ? '👤' : '🤖', {
        fontSize: '22px',
      });
      avatarText.setOrigin(0.5);
      card.add(avatarText);

      // Name Text
      const displayName = pInfo.isHuman ? '賭神 (您)' : pInfo.name;
      const nameText = this.add.text(-46, -22, displayName, {
        fontSize: '14px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: pInfo.isHuman ? '#facc15' : '#ffffff',
        fontStyle: 'bold',
      });
      card.add(nameText);

      // Chips Text
      const chipsText = this.add.text(-46, -4, '🪙 10,000', {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#fbbf24',
      });
      card.add(chipsText);

      // Wind Status Text (initially '待抽風位')
      const windStatus = this.add.text(-46, 14, '[ 待抽風位 ]', {
        fontSize: '11px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#64748b',
        fontStyle: 'bold',
      });
      card.add(windStatus);
      cardWindTexts.push(windStatus);

      // Wind Tile Slot Box (Right side of Card)
      const slotBox = this.add.graphics();
      slotBox.fillStyle(0x0f172a, 0.8);
      slotBox.fillRoundedRect(42, -26, 36, 48, 4);
      slotBox.lineStyle(1, 0x334155, 0.9);
      slotBox.strokeRoundedRect(42, -26, 36, 48, 4);
      card.add(slotBox);

      // Scale in animation
      card.setScale(0);
      this.seatingCinematicContainer.add(card);
      cardContainers.push(card);

      if (this.tweens) {
        this.tweens.add({
          targets: card,
          scale: 1,
          duration: 400,
          delay: idx * 80,
          ease: 'Back.easeOut',
        });
      } else {
        card.setScale(1);
      }
    });

    // ==========================================
    // Stage 2: Large Casino Dice Cup & Dice Roll (Grand & Prominent)
    // ==========================================
    const diceTray = this.add.sprite(640, 365, 'mahjong:dice_tray');
    diceTray.setScale(1.25);
    this.seatingCinematicContainer.add(diceTray);

    const diceCup = this.add.sprite(640, 335, 'mahjong:dice_cup');
    diceCup.setScale(1.3);
    this.seatingCinematicContainer.add(diceCup);

    MahjongAudioService.playDiceRoll();

    if (this.tweens) {
      this.tweens.add({
        targets: diceCup,
        x: { from: 630, to: 650 },
        angle: { from: -15, to: 15 },
        duration: 50,
        yoyo: true,
        repeat: 8,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          // Cup lifts smoothly upwards
          this.tweens.add({
            targets: diceCup,
            y: 200,
            alpha: 0,
            scale: 1.4,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              diceCup.destroy();
            },
          });

          // 3 Dice tumble onto tray
          const d = details.diceResult;
          const diceOffsets = [
            { x: -50, y: -4 },
            { x: 0, y: -16 },
            { x: 50, y: 4 },
          ];

          for (let i = 0; i < 3; i++) {
            const dice = this.add.sprite(
              640 + diceOffsets[i].x,
              365 + diceOffsets[i].y,
              `mahjong:dice_${d[i]}`
            );
            dice.setDisplaySize(38, 38);
            dice.setScale(0.3);
            dice.setAngle(-180);
            this.seatingCinematicContainer.add(dice);

            this.tweens.add({
              targets: dice,
              scale: 1,
              angle: 0,
              duration: 450,
              ease: 'Back.easeOut',
            });
          }

          // Update banner with dice result & first drawer
          bannerText.setText(
            `🎲 擲出 ${d[0]}+${d[1]}+${d[2]}=${details.diceSum} 點 ｜ 由【${details.firstDrawerName}】起抽風牌`
          );

          // Proceed to Stage 3 after short pause
          this.time.delayedCall(700, () => {
            this.executeWindDealSequence(
              details,
              cardContainers,
              cardWindTexts,
              seatPositions,
              windNames,
              windCodes,
              bannerText
            );
          });
        },
      });
    } else {
      this.time.delayedCall(100, () => {
        this.finishSeatingSequence();
      });
    }
  }

  private executeWindDealSequence(
    details: SeatingDrawDetails,
    cardContainers: Phaser.GameObjects.Container[],
    cardWindTexts: Phaser.GameObjects.Text[],
    seatPositions: { x: number; y: number }[],
    windNames: Record<SeatWind, string>,
    windCodes: Record<SeatWind, string>,
    bannerText: Phaser.GameObjects.Text
  ): void {
    // 4 Face-down wind tiles in center
    const dealOrder = [0, 1, 2, 3].map((k) => (details.firstDrawerIndex + k) % 4);

    dealOrder.forEach((playerIdx, stepIdx) => {
      this.time.delayedCall(stepIdx * 400, () => {
        const pInfo = details.players[playerIdx];
        const card = cardContainers[playerIdx];
        const windText = cardWindTexts[playerIdx];

        // Animated tile sliding from center (640, 360) to Card wind slot
        const flyingTile = this.add.sprite(640, 360, 'mahjong:tile_back');
        flyingTile.setDisplaySize(36, 48);
        this.seatingCinematicContainer.add(flyingTile);

        if (this.tweens) {
          this.tweens.add({
            targets: flyingTile,
            x: card.x + 60,
            y: card.y - 2,
            duration: 350,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              // 3D Flip animation
              this.tweens.add({
                targets: flyingTile,
                scaleX: 0,
                duration: 120,
                onComplete: () => {
                  flyingTile.setTexture(`mahjong:tile_${windCodes[pInfo.drawnWind]}`);
                  flyingTile.setDisplaySize(36, 48);
                  this.tweens.add({
                    targets: flyingTile,
                    scaleX: 1,
                    duration: 120,
                    onComplete: () => {
                      // Reparent flyingTile into card container so it glides together with the character card!
                      card.add(flyingTile);
                      flyingTile.setPosition(60, -2);

                      // Update card status text
                      if (pInfo.isDealer) {
                        windText.setText('【東風 👑起莊】');
                        windText.setColor('#facc15');
                      } else {
                        windText.setText(`【${windNames[pInfo.drawnWind]}】`);
                        windText.setColor('#38bdf8');
                      }
                    },
                  });
                },
              });
            },
          });
        }
      });
    });

    // ==========================================
    // Stage 4: AI Opponents Animated Seating Realignment (Cards + Wind Tiles glide together!)
    // ==========================================
    const totalDealDuration = dealOrder.length * 400 + 450;
    this.time.delayedCall(totalDealDuration, () => {
      bannerText.setText('✨ 依照風位入座中... ✨');

      // Human (Seat 0) stays at Seat 0 (Bottom) - does NOT move.
      // 3 AI cards glide smoothly to their newly assigned seatPositions[pInfo.finalSeat]
      details.players.forEach((pInfo, idx) => {
        if (!pInfo.isHuman) {
          const card = cardContainers[idx];
          const targetPos = seatPositions[pInfo.finalSeat];

          if (this.tweens) {
            this.tweens.add({
              targets: card,
              x: targetPos.x,
              y: targetPos.y,
              duration: 850,
              ease: 'Cubic.easeInOut',
            });
          } else {
            card.setPosition(targetPos.x, targetPos.y);
          }
        }
      });

      // After migration settles
      this.time.delayedCall(1000, () => {
        const dealerPlayer = details.players.find((p) => p.isDealer)!;
        const dealerName = dealerPlayer.isHuman ? '您 (賭神)' : dealerPlayer.name;
        bannerText.setText(`👑【${dealerName}】抽得東風 起莊開局！`);

        // Stage 5: Clean Teardown & Transition to Dealing
        this.time.delayedCall(1300, () => {
          if (this.tweens) {
            this.tweens.add({
              targets: this.seatingCinematicContainer,
              alpha: 0,
              duration: 400,
              ease: 'Linear',
              onComplete: () => {
                this.finishSeatingSequence();
              },
            });
          } else {
            this.finishSeatingSequence();
          }
        });
      });
    });
  }

  private finishSeatingSequence(): void {
    this.seatingCinematicContainer.removeAll(true);
    this.seatingCinematicContainer.setVisible(false);

    // Restore central compass
    if (this.compassDial) this.compassDial.setVisible(true);
    if (this.turnPointer) this.turnPointer.setVisible(true);
    if (this.roundWindText) this.roundWindText.setVisible(true);
    if (this.dealerStreakText) this.dealerStreakText.setVisible(true);
    if (this.remainingTilesText) this.remainingTilesText.setVisible(true);
    this.compassPlayerContainers.forEach((c) => c.setVisible(true));

    this.refreshAllSeats();
    this.updateCompass();
    this.gameState.startDealing(false);
  }

  /**
   * 2. 莊家開門擲骰動畫 (Dealer Wall Break & Dealing Animation).
   */
  private playDealerWallBreakDiceAnimation(): void {
    this.bankerDiceOutsideCompassContainer.setVisible(false);

    // Hide central compass during dealer wall break
    if (this.compassDial) this.compassDial.setVisible(false);
    if (this.turnPointer) this.turnPointer.setVisible(false);
    if (this.roundWindText) this.roundWindText.setVisible(false);
    if (this.dealerStreakText) this.dealerStreakText.setVisible(false);
    if (this.remainingTilesText) this.remainingTilesText.setVisible(false);
    this.compassPlayerContainers.forEach((c) => c.setVisible(false));

    MahjongAudioService.playDiceRoll();
    this.diceContainer.removeAll(true);
    this.diceContainer.setVisible(true);
    this.diceContainer.setDepth(200);

    const d = this.gameState.diceResult;
    const diceSum = d[0] + d[1] + d[2];
    const breakSeat = (this.gameState.dealerSeat + (diceSum - 1)) % 4;
    const breakPlayer = this.gameState.players[breakSeat];
    const dealerName = this.gameState.players[this.gameState.dealerSeat].name;

    // ── 1. Full-screen dark overlay (covers seat discard-zone dashed lines) ──
    // diceContainer is at (cx, cy) = (640, 360); use negative offset to fill screen
    const screenOverlay = this.add.graphics();
    screenOverlay.fillStyle(0x000000, 0.82);
    screenOverlay.fillRect(-640, -360, 1280, 720);
    this.diceContainer.add(screenOverlay);

    // ── 2. Larger panel ───────────────────────────────────────────────────────
    const PW = 480;
    const PH = 200;
    const bg = this.add.graphics();
    bg.fillStyle(0x020617, 1.0);
    bg.fillRoundedRect(-PW / 2, -PH / 2, PW, PH, 14);
    bg.lineStyle(2, 0xd4af37, 1.0);
    bg.strokeRoundedRect(-PW / 2, -PH / 2, PW, PH, 14);
    bg.lineStyle(1, 0x334155, 0.8);
    bg.strokeRoundedRect(-PW / 2 + 4, -PH / 2 + 4, PW - 8, PH - 8, 11);
    this.diceContainer.add(bg);

    // ── 3. Dice sprites (larger: 52px) ───────────────────────────────────────
    for (let i = 0; i < 3; i++) {
      const sprite = this.add.sprite((i - 1) * 64, -58, `mahjong:dice_${d[i]}`);
      sprite.setDisplaySize(52, 52);
      this.diceContainer.add(sprite);

      if (this.tweens) {
        this.tweens.add({
          targets: sprite,
          angle: { from: -180, to: 0 },
          scale: { from: 0.5, to: 1.0 },
          duration: 650,
          ease: 'Back.easeOut',
        });
      }
    }

    // ── 4. Larger text ───────────────────────────────────────────────────────
    const titleText = this.add.text(
      0, -4,
      `🎲 莊家【${dealerName}】擲出 ${d[0]} + ${d[1]} + ${d[2]} = ${diceSum} 點`,
      {
        fontSize: '20px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#facc15',
        fontStyle: 'bold',
      }
    ).setOrigin(0.5);
    this.diceContainer.add(titleText);

    // ── 5. Directional arrow (rotates while dice spin → settles on break wall) ─
    // Arrow drawn pointing RIGHT (angle=0) using Graphics
    const arrowContainer = this.add.container(0, 48);

    const arrowGfx = this.add.graphics();
    // Shaft
    arrowGfx.fillStyle(0xf59e0b, 1.0);
    arrowGfx.fillRect(-34, -7, 42, 14);
    // Head (triangle)
    arrowGfx.fillTriangle(36, 0, 4, -18, 4, 18);
    // Bright highlight
    arrowGfx.fillStyle(0xfef3c7, 0.6);
    arrowGfx.fillRect(-32, -3, 38, 5);

    arrowContainer.add(arrowGfx);
    this.diceContainer.add(arrowContainer);

    // Wall direction: seat → rotation angle (pointing toward that wall)
    // Seat 0 = bottom (player's wall) → down → 90°
    // Seat 1 = right wall            → right → 0°
    // Seat 2 = top wall              → up → -90° (270°)
    // Seat 3 = left wall             → left → 180°
    const targetAngleDeg: Record<number, number> = { 0: 90, 1: 0, 2: -90, 3: 180 };
    const targetRad = (targetAngleDeg[breakSeat] ?? 0) * (Math.PI / 180);

    // Phase 1: fast spin (use .rotation — accumulates without normalization)
    const SPIN_RPM = 3.5; // rotations per second during dice roll
    const SPIN_MS = 700;  // spin for 700ms
    const spinRotation = Math.PI * 2 * SPIN_RPM * (SPIN_MS / 1000);

    let spinTween: Phaser.Tweens.Tween | undefined;
    if (this.tweens) {
      spinTween = this.tweens.add({
        targets: arrowContainer,
        rotation: `+=${spinRotation * 100}`, // large value, stopped early
        duration: SPIN_MS * 100,
        ease: 'Linear',
      });
    }

    // Phase 2: after 700ms, stop spin + decelerate to correct angle
    if (this.time) {
      this.time.delayedCall(SPIN_MS, () => {
        if (spinTween) spinTween.stop();
        const cur = arrowContainer.rotation; // raw accumulated radians (no Phaser normalization)
        // CORRECT: compute totalNorm from the *full* planned rotation (cur + extra spins),
        // then calculate delta so that (cur + extra + delta) ≡ targetRad (mod 2π).
        // Using curNorm = cur%2π would omit the extra spins and yield a ~π error.
        const extraSpins = Math.PI * 2 * 1.5; // 1.5 dramatic extra rotations before settling
        const totalNorm = (cur + extraSpins) % (Math.PI * 2);
        const delta = ((targetRad - totalNorm) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const finalRot = cur + extraSpins + delta; // guaranteed visual angle == targetRad

        if (this.tweens) {
          this.tweens.add({
            targets: arrowContainer,
            rotation: finalRot,
            duration: 800,
            ease: 'Cubic.easeOut',
          });
        }
      });
    }

    const windChinese: Record<string, string> = { EAST: '東', SOUTH: '南', WEST: '西', NORTH: '北' };
    const breakWindCn = windChinese[this.gameState.getEffectiveWind(breakSeat as PlayerSeat)] ?? '?';
    const infoText = this.add.text(
      0, 85,
      `【${breakPlayer.name}】${breakWindCn}風牆 第 ${diceSum} 墩開門`,
      {
        fontSize: '18px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#38bdf8',
        fontStyle: 'bold',
      }
    ).setOrigin(0.5).setAlpha(0);
    this.diceContainer.add(infoText);

    if (this.tweens) {
      this.tweens.add({
        targets: infoText,
        alpha: 1,
        duration: 350,
        delay: 900, // after arrow settles
        ease: 'Sine.easeOut',
      });
    }

    // ── 6. Close panel after 2200ms → restore compass → start dealing ─────────
    this.time.delayedCall(2200, () => {
      this.diceContainer.setVisible(false);

      if (this.compassDial) this.compassDial.setVisible(true);
      if (this.turnPointer) this.turnPointer.setVisible(true);
      if (this.roundWindText) this.roundWindText.setVisible(true);
      if (this.dealerStreakText) this.dealerStreakText.setVisible(true);
      if (this.remainingTilesText) this.remainingTilesText.setVisible(true);
      this.compassPlayerContainers.forEach((c) => c.setVisible(true));
      this.updateCompass();

      this.updateBankerDicePosition();
      this.updateTileWalls();
      this.executeSequentialDealingSequence();
    });
  }


  /**
   * Banker dice are now rendered inside each seat container to the right of the flower rack.
   */
  private updateBankerDicePosition(): void {
    this.bankerDiceOutsideCompassContainer.removeAll(true);
    this.bankerDiceOutsideCompassContainer.setVisible(false);
  }

  /**
   * Sequential 4-round dealing (each player takes 2 stacks / 4 tiles in CCW order) + dealer jump tile (17th tile).
   */
  private executeSequentialDealingSequence(): void {
    const dealingOrder: PlayerSeat[] = [0, 1, 2, 3].map(
      (i) => ((this.gameState.dealerSeat + i) % 4) as PlayerSeat
    );

    const totalRounds = 4;
    const stepInterval = 180; // ms per 4-tile deal step

    for (let round = 0; round < totalRounds; round++) {
      for (let step = 0; step < 4; step++) {
        const seat = dealingOrder[step];
        const stepIndex = round * 4 + step;

        this.time.delayedCall(stepIndex * stepInterval, () => {
          this.gameState.dealStepBatch(seat, 4);
          MahjongAudioService.playTileDraw();
          this.updateTileWalls();
          this.refreshAllSeats();
        });
      }
    }

    // Dealer draws 17th jump tile (跳牌) after all 16 steps
    const jumpTileDelay = totalRounds * 4 * stepInterval + 150;
    this.time.delayedCall(jumpTileDelay, () => {
      this.gameState.dealJumpTile();
      MahjongAudioService.playTileDraw();
      this.updateTileWalls();
      this.refreshAllSeats();

      // Proceed to Tile Sort (理牌)
      this.time.delayedCall(400, () => {
        this.animateTileSort();
      });
    });
  }

  /**
   * Animates card sorting cascade after dealing, then triggers multi-round flower replacement.
   */
  private animateTileSort(): void {
    MahjongAudioService.playTileSort();
    this.gameState.sortHandTiles();
    this.refreshAllSeats();

    // Trigger cascading 3D spin animation on hand tiles across all seats
    this.seatContainers.forEach((container) => {
      container.animateTileSortSpin();
    });

    // Proceed to sequential multi-round flower replacement after sorting
    this.time.delayedCall(700, () => {
      this.executeSequentialFlowerReplacement();
    });
  }

  /**
   * Multi-round sequential flower replacement across 4 players (開門多輪輪替依序補花).
   * 補花補到花時等其他三家補完一輪後，下一輪再補！
   */
  private executeSequentialFlowerReplacement(): void {
    const dealingOrder: PlayerSeat[] = [0, 1, 2, 3].map(
      (i) => ((this.gameState.dealerSeat + i) % 4) as PlayerSeat
    );

    let currentRound = 1;

    const processNextRound = () => {
      const { hasMoreFlowers, results } = this.gameState.executeFlowerReplacementRound(dealingOrder);

      if (results.length === 0) {
        // All players have 0 flowers left -> Flower replacement is 100% complete!
        this.gameState.sortHandTiles();
        this.refreshAllSeats();
        this.updateTileWalls();
        this.updateCompass();

        // Check instant flower wins (八仙過海 / 七搶一)
        for (const p of this.gameState.players) {
          if (p.flowers.length === 8) {
            this.gameState.settleFlowerWin(p.seat);
            return;
          }
        }

        // Check dealer Heavenly Win (天胡)
        const dealer = this.gameState.players[this.gameState.dealerSeat];
        if (
          dealer.drawnTile &&
          MahjongHandEvaluator.isWinningHand(dealer.hand, dealer.melds, dealer.drawnTile)
        ) {
          this.gameState.settleWin(this.gameState.dealerSeat, true, undefined, { isHeavenlyWin: true });
          return;
        }

        // Start official player turn phase
        this.gameState.isFirstTurnCycle = true;
        this.gameState.currentTurnCount = 0;
        this.gameState.startPlayerTurn(this.gameState.dealerSeat, false);

        // If dealer is human (Seat 0), check self actions / ting
        if (this.gameState.dealerSeat === 0) {
          this.checkHumanSelfActions();
          this.updateSmartTing();
        } else {
          // AI dealer discard turn
          this.time.delayedCall(800, () => {
            if (
              this.gameState.currentTurnSeat === this.gameState.dealerSeat &&
              this.gameState.phase === 'PLAYER_TURN'
            ) {
              this.gameState.stepAITurn(this.gameState.dealerSeat);
            }
          });
        }
        return;
      }

      // Animate each player's flower replacement in this round sequentially
      results.forEach((res, idx) => {
        this.time.delayedCall(idx * 700, () => {
          MahjongAudioService.playFlowerReplace();
          this.refreshAllSeats();
          this.updateTileWalls();
          this.updateCompass();
        });
      });

      const roundDuration = results.length * 700 + 400;
      this.time.delayedCall(roundDuration, () => {
        currentRound++;
        if (currentRound <= 10) {
          processNextRound();
        }
      });
    };

    processNextRound();
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
    const currentHandWind = winds[this.gameState.dealerRoundsPlayed % 4] || '東';
    this.roundWindText.setText(`${roundWind}風${currentHandWind}`);

    const windChars: Record<string, string> = {
      EAST: '東',
      SOUTH: '南',
      WEST: '西',
      NORTH: '北',
    };

    // Update 4 Integrated Player HUD Strips inside the Square Compass
    for (let i = 0; i < 4; i++) {
      const p = this.gameState.players[i];
      if (!p) continue;
      const char = windChars[p.wind] || '東';
      const isDealer = this.gameState.dealerSeat === i;
      const isCurrentTurn = this.gameState.currentTurnSeat === i;

      const bg = this.compassPlayerBgs[i];
      if (bg) {
        bg.clear();
        if (isCurrentTurn) {
          bg.fillStyle(0x854d0e, 0.95);
          bg.lineStyle(1.5, 0xfacc15, 1);
        } else if (isDealer) {
          bg.fillStyle(0x362005, 0.95);
          bg.lineStyle(1.5, 0xd4af37, 0.9);
        } else {
          bg.fillStyle(0x020617, 0.95);
          bg.lineStyle(1.5, 0x334155, 1);
        }
        bg.fillRoundedRect(-36, -13, 72, 26, 4);
        bg.strokeRoundedRect(-36, -13, 72, 26, 4);
      }

      const pText = this.compassPlayerTexts[i];
      if (pText) {
        pText.setText(`[${char}] ${p.name}`);
        pText.setColor?.(isCurrentTurn ? '#fef08a' : (isDealer ? '#facc15' : '#cbd5e1'));
      }

      const chipsText = this.compassPlayerChipsTexts[i];
      if (chipsText) {
        chipsText.setText(`${p.chips.toLocaleString()} 點`);
        chipsText.setColor?.(isCurrentTurn ? '#ffffff' : (isDealer ? '#fef08a' : '#94a3b8'));
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
    const rInner = 64;
    const rOuter = 74;

    // Glowing gold outer accent arc on active player's rim (35 deg arc)
    if (typeof this.turnPointer.arc === 'function') {
      this.turnPointer.lineStyle(3, 0xfacc15, 0.95);
      this.turnPointer.beginPath();
      this.turnPointer.arc(cx, cy, 68, rad - 0.32, rad + 0.32, false);
      this.turnPointer.strokePath();
    }

    // Sleek chevron arrow head pointing outward toward active seat
    const tipX = cx + Math.cos(rad) * (rOuter + 4);
    const tipY = cy + Math.sin(rad) * (rOuter + 4);
    const leftX = cx + Math.cos(rad - 0.16) * rInner;
    const leftY = cy + Math.sin(rad - 0.16) * rInner;
    const rightX = cx + Math.cos(rad + 0.16) * rInner;
    const rightY = cy + Math.sin(rad + 0.16) * rInner;

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
      this.seatContainers[i].renderPlayerState(
        p,
        p.isHuman,
        lastSeat === i,
        revealAllHands,
        this.gameState.roundWind,
        this.gameState.diceResult,
        this.gameState.getEffectiveWind(i as PlayerSeat)
      );
    }
    this.updateBankerDicePosition();
    this.updateCompass();
  }

  private updateSmartTing(): void {
    const p1 = this.gameState.players[0];
    if (!p1) {
      this.tingContainer.setVisible(false);
      this.tingContainer.removeAll(true);
      if (this.autoPlayBtnContainer) {
        this.autoPlayBtnContainer.setVisible(false);
        this.autoPlayBtnContainer.removeAll(true);
      }
      return;
    }

    const tingInfo = MahjongHandEvaluator.evaluateTing(
      p1.hand,
      p1.melds,
      this.gameState.getAllVisibleTiles()
    );

    this.tingContainer.removeAll(true);

    if (tingInfo.winningTiles.length > 0) {
      this.tingContainer.setVisible(true);

      const count = tingInfo.winningTiles.length;
      const tileW = 28;
      const tileH = 38;
      const gap = 8;
      const miniTilesW = count * tileW + (count - 1) * gap;

      const padX = 10;
      const labelW = 14;
      const labelGap = 8;
      const cardW = padX + labelW + labelGap + miniTilesW + padX;
      const cardH = 48;

      // 1. Sleek Compact Glassmorphic Background Panel
      const bg = this.add.graphics();
      bg.fillStyle(0x090d16, 0.94);
      bg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 7);
      bg.lineStyle(1.5, 0x8b5cf6, 0.9);
      bg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 7);
      this.tingContainer.add(bg);

      // 2. Left label: 聽
      const labelX = -cardW / 2 + padX;
      const title = this.add.text(labelX, 0, '聽', {
        fontSize: '12px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#c4b5fd',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      this.tingContainer.add(title);

      // 3. Mini Winning Tiles Row (Plan A: 28x38 HD Tiles + Top-Right Pill Badge)
      const tilesStartX = labelX + labelW + labelGap + tileW / 2;
      tingInfo.winningTiles.forEach((t, idx) => {
        const tx = tilesStartX + idx * (tileW + gap);

        // High-definition mini tile (28x38)
        const sprite = this.add.sprite(tx, 0, `mahjong:tile_${t.tileCode}`);
        sprite.setDisplaySize(tileW, tileH);
        this.tingContainer.add(sprite);

        // Elegant count badge on top-right of tile
        const badgeW = 16;
        const badgeH = 14;
        const badgeX = tx + tileW / 2 - 2;
        const badgeY = -tileH / 2 + 2;

        const badgeBg = this.add.graphics();
        const isAvailable = t.remainingCount > 0;
        badgeBg.fillStyle(isAvailable ? 0x1e1b4b : 0x1e293b, 0.95);
        badgeBg.fillRoundedRect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 4);
        badgeBg.lineStyle(1, isAvailable ? 0xfacc15 : 0x64748b, 0.9);
        badgeBg.strokeRoundedRect(badgeX - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 4);
        this.tingContainer.add(badgeBg);

        const countTxt = this.add.text(badgeX, badgeY, `${t.remainingCount}`, {
          fontSize: '10px',
          fontFamily: '"Microsoft JhengHei", sans-serif',
          color: isAvailable ? '#facc15' : '#94a3b8',
          fontStyle: 'bold',
        }).setOrigin(0.5);
        this.tingContainer.add(countTxt);
      });
    } else {
      this.tingContainer.setVisible(false);
    }

    // 4. Independent Auto-Play Button (Centered at Y=624, dynamically aligned with Seat 0 drawn slot X)
    if (this.autoPlayBtnContainer) {
      this.autoPlayBtnContainer.removeAll(true);
      if (tingInfo.winningTiles.length > 0 || p1.isAutoPlay) {
        const drawnSlotWorldX = this.seatContainers[0]?.drawnSlotWorldX ?? 934;
        this.autoPlayBtnContainer.setPosition(drawnSlotWorldX, 624);
        this.autoPlayBtnContainer.setVisible(true);

        const btnW = 84;
        const btnH = 24;

        if (!p1.isAutoPlay) {
          const btnBg = this.add.graphics();
          btnBg.fillStyle(0x7c3aed, 0.95);
          btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
          btnBg.lineStyle(1.5, 0xa78bfa, 0.9);
          btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
          this.autoPlayBtnContainer.add(btnBg);

          const btnTxt = this.add.text(0, 0, '🤖 聽牌託管', {
            fontSize: '11px',
            fontFamily: '"Microsoft JhengHei", sans-serif',
            color: '#ffffff',
            fontStyle: 'bold',
          }).setOrigin(0.5);
          this.autoPlayBtnContainer.add(btnTxt);

          this.autoPlayBtnContainer.setSize(btnW, btnH);
          this.autoPlayBtnContainer.setInteractive({ useHandCursor: true });
          this.autoPlayBtnContainer.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0x9333ea, 1);
            btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
            btnBg.lineStyle(1.5, 0xc4b5fd, 1);
            btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
          });
          this.autoPlayBtnContainer.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0x7c3aed, 0.95);
            btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
            btnBg.lineStyle(1.5, 0xa78bfa, 0.9);
            btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
          });
          this.autoPlayBtnContainer.on('pointerdown', () => {
            this.gameState.players[0].isAutoPlay = true;
            this.updateSmartTing();
            if (this.gameState.currentTurnSeat === 0 && this.gameState.phase === 'PLAYER_TURN') {
              this.gameState.stepAITurn(0);
            }
          });
        } else {
          const btnBg = this.add.graphics();
          btnBg.fillStyle(0x065f46, 0.95);
          btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
          btnBg.lineStyle(1.5, 0x34d399, 1);
          btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
          this.autoPlayBtnContainer.add(btnBg);

          const btnTxt = this.add.text(0, 0, '⚡ 解除託管', {
            fontSize: '11px',
            fontFamily: '"Microsoft JhengHei", sans-serif',
            color: '#a7f3d0',
            fontStyle: 'bold',
          }).setOrigin(0.5);
          this.autoPlayBtnContainer.add(btnTxt);

          this.autoPlayBtnContainer.setSize(btnW, btnH);
          this.autoPlayBtnContainer.setInteractive({ useHandCursor: true });
          this.autoPlayBtnContainer.on('pointerover', () => {
            btnBg.clear();
            btnBg.fillStyle(0x047857, 1);
            btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
            btnBg.lineStyle(1.5, 0x6ee7b7, 1);
            btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
          });
          this.autoPlayBtnContainer.on('pointerout', () => {
            btnBg.clear();
            btnBg.fillStyle(0x065f46, 0.95);
            btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
            btnBg.lineStyle(1.5, 0x34d399, 1);
            btnBg.strokeRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 5);
          });
          this.autoPlayBtnContainer.on('pointerdown', () => {
            this.gameState.players[0].isAutoPlay = false;
            this.updateSmartTing();
          });
        }
      } else {
        this.autoPlayBtnContainer.setVisible(false);
      }
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

    const cardW = 108;
    const cardH = 58;
    const gap = 14;
    const totalContentW = options.length * cardW + (options.length - 1) * gap;
    const panelW = Math.max(280, totalContentW + 40);
    const panelH = 92;

    const bg = this.add.graphics();
    bg.fillStyle(0x020617, 0.95);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 10);
    bg.lineStyle(1.5, 0xef4444, 0.9);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 10);
    this.subMenuContainer.add(bg);

    const title = this.add.text(0, -panelH / 2 + 15, '🔥 請選擇槓牌組合', {
      fontSize: '12px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#fca5a5',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.subMenuContainer.add(title);

    const closeBtn = this.add.text(panelW / 2 - 16, -panelH / 2 + 14, '✕', {
      fontSize: '14px',
      fontFamily: 'sans-serif',
      color: '#94a3b8',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#f87171'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#94a3b8'));
    closeBtn.on('pointerdown', () => {
      this.subMenuContainer.setVisible(false);
    });
    this.subMenuContainer.add(closeBtn);

    const startX = -((options.length - 1) * (cardW + gap)) / 2;
    options.forEach((opt, idx) => {
      const optBtn = this.add.container(startX + idx * (cardW + gap), 12);

      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x0f172a, 0.95);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
      cardBg.lineStyle(1.5, 0xef4444, 0.75);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
      optBtn.add(cardBg);

      // Tile Sprite
      const sprite = this.add.sprite(-22, 0, `mahjong:tile_${opt.tileCode}`);
      sprite.setDisplaySize(30, 42);
      optBtn.add(sprite);

      // Label
      const labelText = opt.type === 'CONCEALED_KONG' ? '暗槓\n(x4)' : '加槓\n(x4)';
      const label = this.add.text(20, 0, labelText, {
        fontSize: '11px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: opt.type === 'CONCEALED_KONG' ? '#f87171' : '#facc15',
        fontStyle: 'bold',
        align: 'center',
      }).setOrigin(0.5);
      optBtn.add(label);

      optBtn.setSize(cardW, cardH);
      optBtn.setInteractive({ useHandCursor: true });

      optBtn.on('pointerover', () => {
        cardBg.clear();
        cardBg.fillStyle(0x450a0a, 0.98);
        cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
        cardBg.lineStyle(2, 0xf87171, 1);
        cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
        optBtn.setY(9);
      });

      optBtn.on('pointerout', () => {
        cardBg.clear();
        cardBg.fillStyle(0x0f172a, 0.95);
        cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
        cardBg.lineStyle(1.5, 0xef4444, 0.75);
        cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
        optBtn.setY(12);
      });

      optBtn.on('pointerdown', () => {
        MahjongAudioService.playTileSelect();
        this.subMenuContainer.setVisible(false);
        this.actionBarContainer.setVisible(false);
        if (this.gameState.phase === 'PLAYER_TURN') {
          this.gameState.performSelfKong(0, opt);
          this.refreshAllSeats();
        } else {
          this.gameState.humanRespondAction('KONG');
        }
      });

      this.subMenuContainer.add(optBtn);
    });
  }

  private showChowSubMenu(options: ChowOption[]): void {
    this.subMenuContainer.removeAll(true);
    this.subMenuContainer.setVisible(true);

    const cardW = 118;
    const cardH = 58;
    const gap = 14;
    const totalContentW = options.length * cardW + (options.length - 1) * gap;
    const panelW = Math.max(300, totalContentW + 40);
    const panelH = 92;

    // Outer frosted modal dialog background
    const bg = this.add.graphics();
    bg.fillStyle(0x020617, 0.95);
    bg.fillRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 10);
    bg.lineStyle(1.5, 0x3b82f6, 0.9);
    bg.strokeRoundedRect(-panelW / 2, -panelH / 2, panelW, panelH, 10);
    this.subMenuContainer.add(bg);

    // Title label
    const title = this.add.text(0, -panelH / 2 + 15, '🍽️ 請選擇吃牌組合', {
      fontSize: '12px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#93c5fd',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.subMenuContainer.add(title);

    // Cancel '✕' button in top-right
    const closeBtn = this.add.text(panelW / 2 - 16, -panelH / 2 + 14, '✕', {
      fontSize: '14px',
      fontFamily: 'sans-serif',
      color: '#94a3b8',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setColor('#f87171'));
    closeBtn.on('pointerout', () => closeBtn.setColor('#94a3b8'));
    closeBtn.on('pointerdown', () => {
      this.subMenuContainer.setVisible(false);
    });
    this.subMenuContainer.add(closeBtn);

    // Render each 3-tile graphical combination option
    const startX = -((options.length - 1) * (cardW + gap)) / 2;
    options.forEach((opt, idx) => {
      const optBtn = this.add.container(startX + idx * (cardW + gap), 12);

      // Card outline
      const cardBg = this.add.graphics();
      cardBg.fillStyle(0x0f172a, 0.95);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
      cardBg.lineStyle(1.5, 0x3b82f6, 0.75);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
      optBtn.add(cardBg);

      // 3 Mahjong Tile Sprites side-by-side
      opt.tiles.forEach((tile, tIdx) => {
        const tx = (tIdx - 1) * 34;
        const sprite = this.add.sprite(tx, 0, `mahjong:tile_${tile.shortCode}`);
        sprite.setDisplaySize(30, 42);
        optBtn.add(sprite);
      });

      // Hover & click interaction
      optBtn.setSize(cardW, cardH);
      optBtn.setInteractive({ useHandCursor: true });

      optBtn.on('pointerover', () => {
        cardBg.clear();
        cardBg.fillStyle(0x1e3a8a, 0.98);
        cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
        cardBg.lineStyle(2, 0x60a5fa, 1);
        cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
        optBtn.setY(9);
      });

      optBtn.on('pointerout', () => {
        cardBg.clear();
        cardBg.fillStyle(0x0f172a, 0.95);
        cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
        cardBg.lineStyle(1.5, 0x3b82f6, 0.75);
        cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 6);
        optBtn.setY(12);
      });

      optBtn.on('pointerdown', () => {
        MahjongAudioService.playTileSelect();
        this.subMenuContainer.setVisible(false);
        this.actionBarContainer.setVisible(false);
        this.gameState.humanRespondAction('CHOW', opt);
      });

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
          const winnerWind = this.gameState.getEffectiveWind(winner.seat);
          const posIndices: Record<string, string[]> = {
            EAST: ['spring', 'plum', '1f', '5f'],
            SOUTH: ['summer', 'orchid', '2f', '6f'],
            WEST: ['autumn', 'bamboo_f', '3f', '7f'],
            NORTH: ['winter', 'chrysanthemum', '4f', '8f'],
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
      const effectiveWind = this.gameState.getEffectiveWind(i as PlayerSeat);
      const tWind = this.add.text(colX.wind, curY, windNames[effectiveWind] || '東風', { fontSize: '12px', fontFamily: '"Microsoft JhengHei", sans-serif', color: rowColor, fontStyle });
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
      this.tingContainer.setVisible(false);
      this.tingContainer.removeAll(true);
      if (this.autoPlayBtnContainer) {
        this.autoPlayBtnContainer.setVisible(false);
        this.autoPlayBtnContainer.removeAll(true);
      }
      MahjongAudioService.playBGM();
      this.animateBoardClearBeforeNewRound();
    });
  }

  /**
   * 整理牌桌動畫：局結束後，先淡出所有座位與牌牆，顯示「整理牌桌...」提示，
   * 讓玩家有視覺上洗牌砌牌的儀式感，再正式進入下一局的開局流程。
   */
  /**
   * 整理牌桌動畫 — 4 Stage Flow:
   * 1. 棄牌區 + 牌牆 淡出（洗牌感）
   * 2. 靜默重置 gameState (prepareNewRound)，不觸發 DEALING 事件
   * 3. 四方牌牆依序砌回（72 墩逐一亮起，砌牌儀式感）
   * 4. 座位淡入 → overlay 淡出 → startDealing() 才擲骰子開局
   */
  private animateBoardClearBeforeNewRound(): void {
    // ── Overlay ──────────────────────────────────────────────────────────
    const overlay = this.add.container(640, 360);
    overlay.setDepth(195); // above seating cinematic (200) is fine; above normal depth

    const overlayBg = this.add.graphics();
    overlayBg.fillStyle(0x020617, 0.82);
    overlayBg.fillRoundedRect(-180, -32, 360, 64, 12);
    overlayBg.lineStyle(1.5, 0xd4af37, 0.9);
    overlayBg.strokeRoundedRect(-180, -32, 360, 64, 12);
    overlay.add(overlayBg);

    const overlayText = this.add.text(0, 0, '🀄 洗牌中...', {
      fontSize: '22px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#facc15',
      fontStyle: 'bold',
    });
    overlayText.setOrigin(0.5);
    overlay.add(overlayText);
    overlay.setAlpha(0);

    // ── Stage 1: Fade-out seats + walls ─────────────────────────────────
    this.tweens.add({ targets: overlay, alpha: 1, duration: 200, ease: 'Sine.easeOut' });

    this.tweens.add({
      targets: [...this.seatContainers, ...this.wallSprites],
      alpha: 0,
      duration: 380,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // ── Stage 2: Silent state reset (no phase event) ─────────────────
        this.gameState.prepareNewRound();
        this.refreshAllSeats(false); // render empty seats while still invisible
        this.updateTileWalls();       // mark all 72 stacks as full (for correct textures)

        // Reset all wall sprites to invisible so we can animate them back in
        this.wallSprites.forEach((s) => {
          s.setAlpha(0);
          s.setScale(0.75);
          s.setVisible(true);
        });

        // ── Stage 3: Build tile walls cascade ────────────────────────────
        overlayText.setText('🧱 砌牌中...');

        const TILE_STAGGER_MS = 11; // 72 × 11 = 792ms total cascade
        const TILE_ANIM_MS = 160;

        this.wallSprites.forEach((sprite, idx) => {
          this.tweens.add({
            targets: sprite,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: TILE_ANIM_MS,
            delay: idx * TILE_STAGGER_MS,
            ease: 'Back.easeOut',
          });
        });

        const wallBuildTotalMs = this.wallSprites.length * TILE_STAGGER_MS + TILE_ANIM_MS;

        // ── Stage 4: After walls are built, show seats then start dice ───
        this.time.delayedCall(wallBuildTotalMs, () => {
          overlayText.setText('✅ 準備完成！');

          // Fade in seat containers (now showing empty discard areas)
          this.tweens.add({
            targets: this.seatContainers,
            alpha: 1,
            duration: 220,
            ease: 'Sine.easeOut',
          });

          // Fade out overlay then trigger dice roll
          this.tweens.add({
            targets: overlay,
            alpha: 0,
            duration: 350,
            delay: 120,
            ease: 'Sine.easeIn',
            onComplete: () => {
              overlay.destroy();
              // NOW trigger startDealing → emits DEALING → playDealerWallBreakDiceAnimation
              this.gameState.startDealing(false);
            },
          });
        });
      },
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
      MahjongAudioService.stopVoice();
    } else {
      MahjongAudioService.playBGM();
    }
  }

  private handleShutdown(): void {
    MahjongAudioService.stopBGM();
    MahjongAudioService.stopVoice();
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    this.events.off(Phaser.Scenes.Events.DESTROY, this.handleShutdown, this);
  }
}

