/**
 * MainGameScene.ts
 * Main Render & Gameplay Scene for Taiwanese 16-Tile Mahjong.
 * Coordinates 4-seat spatial matrix, Octagonal Wind Compass, Smart Ting UI,
 * Floating Action Bar, Auto-Draw Mode, Sequential Settlement, and ArcadeBridge events.
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

    this.createTableBackground();
    this.createCentralCompass();
    this.createSeats();
    this.createSmartTingUI();
    this.createActionBar();
    this.createSettlementModal();

    this.setupGameStateListeners();

    // Start BGM
    MahjongAudioService.playBGM();

    // Start first match
    this.gameState.startNewMatch();
    this.refreshAllSeats();

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

  private createCentralCompass(): void {
    const cx = 640;
    const cy = 360;

    this.compassDial = this.add.sprite(cx, cy, 'mahjong:compass_dial');

    // Turn pointer (Breathing gold needle)
    this.turnPointer = this.add.graphics();

    this.roundWindText = this.add.text(cx, cy - 22, '東風圈', {
      fontSize: '15px',
      fontFamily: '"Microsoft JhengHei", serif',
      color: '#facc15',
      fontStyle: 'bold',
    });
    this.roundWindText.setOrigin(0.5);

    this.dealerStreakText = this.add.text(cx, cy, '連 0 拉 0', {
      fontSize: '11px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#94a3b8',
    });
    this.dealerStreakText.setOrigin(0.5);

    this.remainingTilesText = this.add.text(cx, cy + 20, '餘 70 張 | 鐵 16', {
      fontSize: '11px',
      fontFamily: 'monospace',
      color: '#38bdf8',
      fontStyle: 'bold',
    });
    this.remainingTilesText.setOrigin(0.5);

    // Dice Container for roll animation
    this.diceContainer = this.add.container(cx, cy);
    this.diceContainer.setVisible(false);
  }

  private createSeats(): void {
    // 4 Seat Layout Containers in world coordinates:
    // P1 (Human / Bottom): 0°
    // P2 (AI / Right): 270°
    // P3 (AI / Top): 180°
    // P4 (AI / Left): 90°
    const seatConfigs = [
      { x: 640, y: 645, angle: 0, seat: 0 as PlayerSeat },
      { x: 1185, y: 360, angle: 270, seat: 1 as PlayerSeat },
      { x: 640, y: 75, angle: 180, seat: 2 as PlayerSeat },
      { x: 95, y: 360, angle: 90, seat: 3 as PlayerSeat },
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

  private createSmartTingUI(): void {
    this.tingContainer = this.add.container(360, 565);
    this.tingContainer.setVisible(false);

    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.9);
    bg.fillRoundedRect(0, 0, 420, 36, 6);
    bg.lineStyle(1, 0x8b5cf6, 0.8);
    bg.strokeRoundedRect(0, 0, 420, 36, 6);
    this.tingContainer.add(bg);

    this.tingText = this.add.text(12, 9, '聽牌: ', {
      fontSize: '13px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#c4b5fd',
      fontStyle: 'bold',
    });
    this.tingContainer.add(this.tingText);

    // Auto Play Button (聽牌託管)
    this.tingAutoBtn = this.add.container(340, 6);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x7c3aed, 1);
    btnBg.fillRoundedRect(0, 0, 70, 24, 4);
    this.tingAutoBtn.add(btnBg);

    const btnTxt = this.add.text(35, 12, '聽牌託管', {
      fontSize: '11px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    btnTxt.setOrigin(0.5);
    this.tingAutoBtn.add(btnTxt);

    btnBg.setInteractive(new Phaser.Geom.Rectangle(0, 0, 70, 24), Phaser.Geom.Rectangle.Contains);
    btnBg.on('pointerdown', () => {
      this.gameState.players[0].isAutoPlay = true;
      MahjongAudioService.playVoiceTing();
      this.tingAutoBtn.setVisible(false);
      this.tingText.setText(this.tingText.text + ' [極速託管中]');
      if (this.gameState.currentTurnSeat === 0) {
        this.gameState.startPlayerTurn(0, false);
      }
    });

    this.tingContainer.add(this.tingAutoBtn);
  }

  private createActionBar(): void {
    this.actionBarContainer = this.add.container(640, 520);
    this.actionBarContainer.setVisible(false);

    this.subMenuContainer = this.add.container(640, 450);
    this.subMenuContainer.setVisible(false);
  }

  private createSettlementModal(): void {
    this.settlementContainer = this.add.container(640, 360);
    this.settlementContainer.setVisible(false);
  }

  private setupGameStateListeners(): void {
    this.gameState.addListener({
      onPhaseChange: (phase: GamePhase) => {
        this.handlePhaseChange(phase);
      },
      onDealingStep: () => {
        this.refreshAllSeats();
        this.updateCompass();
      },
      onFlowerReplaced: () => {
        MahjongAudioService.playFlowerReplace();
        this.refreshAllSeats();
        this.updateCompass();
      },
      onTurnStart: (seat: PlayerSeat) => {
        this.refreshAllSeats();
        this.updateCompass();
        this.updateSmartTing();
        if (seat === 0) {
          this.checkHumanSelfActions();
        }
      },
      onTileDiscarded: (seat: PlayerSeat, tile) => {
        MahjongAudioService.playTileDiscard();
        this.refreshAllSeats();
        this.updateCompass();
        this.updateSmartTing();
        if (seat !== 0) {
          this.checkHumanClaimActions();
        }
      },
      onMeldClaimed: (seat: PlayerSeat, meld) => {
        if (meld.type === 'CHOW') MahjongAudioService.playVoiceChow();
        else if (meld.type === 'PONG') MahjongAudioService.playVoicePong();
        else MahjongAudioService.playVoiceKong();

        this.actionBarContainer.setVisible(false);
        this.subMenuContainer.setVisible(false);
        this.refreshAllSeats();
        this.updateCompass();
      },
      onSettlement: (breakdown: SettlementBreakdown) => {
        this.showSettlementWindow(breakdown);
      },
      onGameOver: (summary) => {
        this.showGameOverModal(summary);
      },
    });
  }

  private handlePhaseChange(phase: GamePhase): void {
    if (phase === 'SEATING_DRAW' || phase === 'DICE_ROLL') {
      this.playDiceRollAnimation();
    }
  }

  private playDiceRollAnimation(): void {
    MahjongAudioService.playDiceRoll();
    this.diceContainer.removeAll(true);
    this.diceContainer.setVisible(true);

    const d = this.gameState.diceResult;
    for (let i = 0; i < 3; i++) {
      const sprite = this.add.sprite((i - 1) * 36, 0, `mahjong:dice_${d[i]}`);
      this.diceContainer.add(sprite);
    }

    this.time.delayedCall(1200, () => {
      this.diceContainer.setVisible(false);
      if (this.gameState.phase === 'SEATING_DRAW') {
        this.gameState.startDealing();
      }
    });
  }

  private handleHumanTileClick(tileId: string): void {
    if (this.gameState.currentTurnSeat !== 0 || this.gameState.phase !== 'PLAYER_TURN') {
      return;
    }
    MahjongAudioService.playTileSelect();
    this.gameState.discardTile(0, tileId);
  }

  private handleHumanTileHover(code: string | null): void {
    this.seatContainers.forEach((c) => c.highlightMatchingDiscards(code));
  }

  private updateCompass(): void {
    const winds = ['東', '南', '西', '北'];
    const currentWind = winds[this.gameState.roundWindIndex] || '東';
    this.roundWindText.setText(`${currentWind}風圈`);

    const streak = this.gameState.dealerStreak;
    const dealerName = this.gameState.players[this.gameState.dealerSeat].name;
    this.dealerStreakText.setText(`莊家: ${dealerName} (連 ${streak})`);

    const remaining = this.gameState.deck.getRegularRemainingCount();
    const dead = this.gameState.deck.getDeadWallCount();
    this.remainingTilesText.setText(`餘 ${remaining} 張 | 鐵 ${dead}`);

    // Update turn pointer needle
    this.turnPointer.clear();
    const seatAngles = [90, 0, 270, 180]; // Screen direction towards seat 0,1,2,3
    const targetAngle = seatAngles[this.gameState.currentTurnSeat];
    const rad = Phaser.Math.DegToRad(targetAngle);

    this.turnPointer.lineStyle(4, 0xfacc15, 0.9);
    this.turnPointer.beginPath();
    this.turnPointer.moveTo(640, 360);
    this.turnPointer.lineTo(640 + Math.cos(rad) * 55, 360 + Math.sin(rad) * 55);
    this.turnPointer.strokePath();
  }

  private refreshAllSeats(): void {
    for (let i = 0; i < 4; i++) {
      const p = this.gameState.players[i];
      this.seatContainers[i].renderPlayerState(p, p.isHuman);
    }
  }

  private updateSmartTing(): void {
    const p1 = this.gameState.players[0];
    const tingInfo = MahjongHandEvaluator.evaluateTing(
      p1.hand,
      p1.melds,
      this.gameState.getAllVisibleTiles()
    );

    if (tingInfo.winningTiles.length > 0) {
      p1.isTing = true;
      this.tingContainer.setVisible(true);

      const tileSummary = tingInfo.winningTiles
        .map((t) => `${t.tileName} (${t.remainingCount}張)`)
        .join(' ');
      this.tingText.setText(`聽牌: ${tileSummary}`);
    } else {
      p1.isTing = false;
      this.tingContainer.setVisible(false);
    }
  }

  private checkHumanSelfActions(): void {
    const p1 = this.gameState.players[0];
    if (p1.isAutoPlay) return;

    const canHu =
      p1.drawnTile &&
      MahjongHandEvaluator.isWinningHand(p1.hand, p1.melds, p1.drawnTile);

    const kongOpts = MahjongHandEvaluator.getSelfKongOptions(
      p1.drawnTile ? [...p1.hand, p1.drawnTile] : p1.hand,
      p1.melds
    );

    if (canHu || kongOpts.length > 0) {
      this.showActionBar({
        canHu: !!canHu,
        canKong: kongOpts.length > 0,
        kongOptions: kongOpts,
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
    if (p1.isAutoPlay || !this.gameState.lastDiscard) return;

    const tile = this.gameState.lastDiscard.tile;
    const fromSeat = this.gameState.lastDiscard.fromSeat;

    const canHu =
      !p1.isPassLockout &&
      MahjongHandEvaluator.isWinningHand(p1.hand, p1.melds, tile);

    const canPong = MahjongHandEvaluator.canPong(p1.hand, tile, p1.passPongCodesInTurn);
    const canKong = MahjongHandEvaluator.canMeldedKong(p1.hand, tile, fromSeat, 0);
    const chowOptions = MahjongHandEvaluator.getChowOptions(p1.hand, tile, fromSeat, 0);

    if (canHu || canPong || canKong || chowOptions.length > 0) {
      this.showActionBar({
        canHu,
        canPong,
        canKong,
        kongOptions: canKong
          ? [
              {
                type: 'MELDED_KONG',
                tileCode: tile.shortCode,
                handTileIds: p1.hand
                  .filter((t) => t.shortCode === tile.shortCode)
                  .map((t) => t.id),
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
    this.actionBarContainer.removeAll(true);
    this.actionBarContainer.setVisible(true);

    const buttons: { key: string; label: string; action: () => void }[] = [];

    if (actions.canHu) {
      buttons.push({
        key: 'action_btn_hu',
        label: '胡',
        action: () => {
          this.actionBarContainer.setVisible(false);
          MahjongAudioService.playVoiceHu();
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
          this.actionBarContainer.setVisible(false);
          MahjongAudioService.playVoiceKong();
          if (this.gameState.phase === 'PLAYER_TURN') {
            const kong = actions.kongOptions[0];
            const p1 = this.gameState.players[0];
            const fullHand = p1.drawnTile ? [...p1.hand, p1.drawnTile] : p1.hand;
            p1.hand = fullHand.filter((t) => !kong.handTileIds.includes(t.id));
            p1.drawnTile = null;

            p1.melds.push({
              type: kong.type,
              tiles: fullHand.filter((t) => kong.handTileIds.includes(t.id)),
              sourceSeat: 0,
            });
            const rep = this.gameState.deck.drawTail();
            p1.drawnTile = rep;
            this.refreshAllSeats();
          } else {
            this.gameState.humanRespondAction('KONG');
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
          MahjongAudioService.playVoicePong();
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
            MahjongAudioService.playVoiceChow();
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
        MahjongAudioService.playVoiceChow();
        this.gameState.humanRespondAction('CHOW', opt);
      });

      optBtn.add(label);
      this.subMenuContainer.add(optBtn);
    });
  }

  private showSettlementWindow(breakdown: SettlementBreakdown): void {
    MahjongAudioService.stopBGM();
    MahjongAudioService.playVictory();

    this.settlementContainer.removeAll(true);
    this.settlementContainer.setVisible(true);

    const bg = this.add.graphics();
    bg.fillStyle(0x020617, 0.95);
    bg.fillRoundedRect(-260, -220, 520, 440, 16);
    bg.lineStyle(2, 0xd4af37, 1);
    bg.strokeRoundedRect(-260, -220, 520, 440, 16);
    this.settlementContainer.add(bg);

    const titleText = breakdown.isDraw
      ? '=== 流局 (荒莊) ==='
      : `=== ${breakdown.winnerName} ${breakdown.isSelfDrawn ? '自摸' : '胡牌'} ===`;

    const title = this.add.text(0, -185, titleText, {
      fontSize: '22px',
      fontFamily: '"Microsoft JhengHei", serif',
      color: '#facc15',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    this.settlementContainer.add(title);

    // Fan breakdown sequence display
    let curY = -140;
    breakdown.fans.forEach((item, idx) => {
      this.time.delayedCall(idx * 150, () => {
        MahjongAudioService.playFanTally();
      });

      const fanLine = this.add.text(-220, curY, `${item.name}`, {
        fontSize: '14px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#f8fafc',
      });
      const fanVal = this.add.text(220, curY, `${item.fan} 台`, {
        fontSize: '14px',
        fontFamily: 'monospace',
        color: '#38bdf8',
        fontStyle: 'bold',
      });
      fanVal.setOrigin(1, 0);

      this.settlementContainer.add([fanLine, fanVal]);
      curY += 24;
    });

    // Total Fans & Points
    curY = Math.max(curY + 10, 50);
    const totalLine = this.add.text(
      0,
      curY,
      `總計: ${breakdown.totalFans} 台 (500底 / 200台)`,
      {
        fontSize: '16px',
        fontFamily: '"Microsoft JhengHei", sans-serif',
        color: '#fbbf24',
        fontStyle: 'bold',
      }
    );
    totalLine.setOrigin(0.5);
    this.settlementContainer.add(totalLine);

    // Chip Deltas
    curY += 35;
    const deltaText = this.add.text(
      0,
      curY,
      `賭神: ${breakdown.chipDeltas[0] >= 0 ? '+' : ''}${breakdown.chipDeltas[0]} 點 | 剩餘: ${breakdown.remainingChips[0]} 點`,
      {
        fontSize: '13px',
        fontFamily: 'monospace',
        color: breakdown.chipDeltas[0] >= 0 ? '#4ade80' : '#f87171',
        fontStyle: 'bold',
      }
    );
    deltaText.setOrigin(0.5);
    this.settlementContainer.add(deltaText);

    // Continue button
    const nextBtn = this.add.graphics();
    nextBtn.fillStyle(0x2563eb, 1);
    nextBtn.fillRoundedRect(-70, 160, 140, 36, 6);
    nextBtn.lineStyle(1, 0x93c5fd, 0.8);
    nextBtn.strokeRoundedRect(-70, 160, 140, 36, 6);
    this.settlementContainer.add(nextBtn);

    const nextTxt = this.add.text(0, 178, '繼續下一局', {
      fontSize: '14px',
      fontFamily: '"Microsoft JhengHei", sans-serif',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    nextTxt.setOrigin(0.5);
    this.settlementContainer.add(nextTxt);

    nextBtn.setInteractive(new Phaser.Geom.Rectangle(-70, 160, 140, 36), Phaser.Geom.Rectangle.Contains);
    nextBtn.on('pointerdown', () => {
      this.settlementContainer.setVisible(false);
      MahjongAudioService.playBGM();
      this.gameState.startDealing();
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
